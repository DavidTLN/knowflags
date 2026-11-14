"""Fetch the major cities of a few countries and their current flag from Wikidata / Wikimedia Commons.

Runs in GitHub Actions (.github/workflows/wikidata-cities.yml), Commons not being reachable from
every environment. Output:
  public/flags/cities/{slug}.{svg|png}   the flag (large SVGs replaced by a 1000px PNG)
  data/wikidata/cities.json             one record per city (flag may be null), with its
                                        administrative ancestors so it can be attached to a region
The JSON is then imported into Supabase (flag_taxonomy + subnational_flags).

Usage: python3 scripts/wikidata/fetch_cities.py [iso ...]   (default: every country in MIN_POP)
"""
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_flags import ROOT, OUT_DIR, sparql, v, qid, slugify, commons_file, commons_info, download  # noqa: E402

CITY_DIR = os.path.join(ROOT, 'public', 'flags', 'cities')

# « Grande ville » : seuil de population par pays (habitants de la commune elle-même)
MIN_POP = {'fr': 100_000, 'ch': 30_000, 'de': 100_000, 'gb': 100_000, 'us': 250_000, 'jp': 300_000}
COUNTRY_QID = {'fr': 'Q142', 'ch': 'Q39', 'de': 'Q183', 'gb': 'Q145', 'us': 'Q30', 'jp': 'Q17'}

# Types Wikidata acceptés comme « ville » (on évite ainsi arrondissements, boroughs, quartiers)
GENERIC = ['Q515', 'Q1549591', 'Q1637706', 'Q200250', 'Q5119']
TYPES = {
    'fr': ['Q484170'],                                  # commune of France
    'ch': ['Q70208'],                                   # municipality of Switzerland
    'de': ['Q42744322', 'Q22865'],                      # urban municipality, independent city
    'gb': ['Q3957'],                                    # town
    'us': ['Q1093829', 'Q3301053'],                     # city of the US, consolidated city-county
    'jp': ['Q494721', 'Q1137833'],                      # city of Japan, designated city
}

# Slugs déjà utilisés sur le site pour ces villes
SLUG_OVERRIDE = {'Q60': 'new-york-city', 'Q61': 'washington-dc', 'Q1794': 'frankfurt', 'Q28848': 'saint-paul'}

# Pas des villes au sens du site : boroughs de New York, quartier de Hambourg, Porto Rico,
# Tokyo (déjà publiée comme préfecture)
EXCLUDE = {'Q18424', 'Q11299', 'Q18426', 'Q18432', 'Q1630', 'Q41211', 'Q1490', 'Q7473516'}


def cities_for(iso):
    types = ' '.join('wd:' + t for t in GENERIC + TYPES[iso])
    rows = sparql(f'''
SELECT ?c ?en ?fr ?local ?pop ?flag ?rank ?wen ?wfr WHERE {{
  ?c wdt:P17 wd:{COUNTRY_QID[iso]} ; wdt:P1082 ?pop .
  FILTER(?pop >= {MIN_POP[iso]})
  VALUES ?t {{ {types} }}
  ?c wdt:P31 ?t .
  FILTER NOT EXISTS {{ ?c wdt:P576 ?dissolved }}
  OPTIONAL {{ ?c rdfs:label ?en FILTER(lang(?en)='en') }}
  OPTIONAL {{ ?c rdfs:label ?fr FILTER(lang(?fr)='fr') }}
  OPTIONAL {{ ?c p:P41 ?fs . ?fs ps:P41 ?flag ; wikibase:rank ?rank .
             FILTER(?rank != wikibase:DeprecatedRank) FILTER NOT EXISTS {{ ?fs pq:P582 ?end }} }}
  OPTIONAL {{ ?wen schema:about ?c ; schema:isPartOf <https://en.wikipedia.org/> }}
  OPTIONAL {{ ?wfr schema:about ?c ; schema:isPartOf <https://fr.wikipedia.org/> }}
}}''')
    by = {}
    for b in rows:
        q = qid(v(b, 'c'))
        d = by.setdefault(q, {'iso': iso, 'qid': q, 'name_en': v(b, 'en'), 'name_fr': v(b, 'fr'),
                              'population': 0, 'file': None, 'file_rank': None,
                              'wiki_en': v(b, 'wen'), 'wiki_fr': v(b, 'wfr')})
        d['population'] = max(d['population'], int(float(v(b, 'pop'))))
        if v(b, 'flag'):
            preferred = v(b, 'rank').endswith('PreferredRank')
            if not d['file'] or (preferred and not d['file_rank']):
                d['file'] = commons_file(v(b, 'flag'))
                d['file_rank'] = preferred
    out = [d for d in by.values() if (d['name_en'] or d['name_fr']) and d['qid'] not in EXCLUDE]
    for d in out:
        d['name_en'] = d['name_en'] or d['name_fr']
        d['name_fr'] = d['name_fr'] or d['name_en']
        if iso == 'jp':   # « Hachiōji-shi » -> « Hachiōji »
            d['name_en'] = re.sub(r'-shi$', '', d['name_en'])
            d['name_fr'] = re.sub(r'-shi$', '', d['name_fr'])
        d.pop('file_rank')
    return sorted(out, key=lambda d: -d['population'])


def ancestors(qids):
    """Toutes les entités administratives englobantes (P131+), avec leur libellé anglais."""
    res = {q: [] for q in qids}
    for i in range(0, len(qids), 60):
        chunk = ' '.join('wd:' + q for q in qids[i:i + 60])
        rows = sparql(f'''
SELECT ?c ?a ?en WHERE {{
  VALUES ?c {{ {chunk} }}
  ?c wdt:P131+ ?a .
  OPTIONAL {{ ?a rdfs:label ?en FILTER(lang(?en)='en') }}
}}''')
        for b in rows:
            res[qid(v(b, 'c'))].append({'qid': qid(v(b, 'a')), 'en': v(b, 'en')})
        time.sleep(1)
    return res


def main():
    isos = [i.lower() for i in sys.argv[1:]] or list(MIN_POP)
    os.makedirs(CITY_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)

    recs = []
    for iso in isos:
        c = cities_for(iso)
        print('cities', iso, len(c), 'with flag:', sum(1 for d in c if d['file']), flush=True)
        recs.extend(c)
        time.sleep(1)

    # Slugs uniques : nom anglais, suffixé du code pays en cas d'homonymie (Birmingham, Portland...)
    base = {}
    for d in recs:
        base.setdefault(slugify(d['name_en']), []).append(d)
    for s, ds in base.items():
        for d in ds:
            d['slug'] = SLUG_OVERRIDE.get(d['qid']) or (s if len(ds) == 1 else f"{s}-{d['iso']}")

    anc = ancestors([d['qid'] for d in recs])
    for d in recs:
        d['ancestors'] = anc.get(d['qid'], [])

    info = commons_info([d['file'] for d in recs if d['file']])
    for d in recs:
        i = info.get(d['file']) if d['file'] else None
        d['image_path'] = None
        if i:
            try:
                d['image_path'] = download(i, os.path.join(CITY_DIR, d['slug']))
            except Exception as ex:  # noqa: BLE001
                print('  ! download failed', d['file'], ex)
            d.update({k: i[k] for k in ('license', 'artist', 'page', 'width', 'height')})

    json.dump(recs, open(os.path.join(OUT_DIR, 'cities.json'), 'w'), ensure_ascii=False, indent=1)
    print('city records:', len(recs), 'with flag image:', sum(1 for d in recs if d['image_path']))


if __name__ == '__main__':
    main()

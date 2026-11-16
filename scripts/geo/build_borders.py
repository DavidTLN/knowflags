"""Build data/geo/borders.json: land and maritime neighbours of every country in the database.

Runs in GitHub Actions (.github/workflows/geo-borders.yml).

Land borders: CIA World Factbook (github.com/factbook/factbook.json, cloned by the workflow) —
  total length, coastline and length per neighbour. Borders of overseas territories count for their
  sovereign state, with a "via": France gets Brazil and Suriname via French Guiana and Sint Maarten via
  Saint-Martin, the UK gets Cyprus via Akrotiri and Dhekelia, etc. Every edge is made symmetric.
Maritime borders: Wikipedia "List of countries and territories by land and maritime borders" — the (M) and
  (L/M) entries, i.e. countries whose maritime zones (territorial sea / EEZ) are delimited against each other.
  A foreign territory missing from the database is mapped to its sovereign state, with a "via".

Output rows: {iso, num, land, coast, neighbours: [{iso, km, via}], maritime: [{iso, via}]}
Imported into public.countries with one SQL query (http_get from raw.githubusercontent.com).
"""
import glob
import json
import os
import re
import sys
import unicodedata

import requests

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FB = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'factbook')
KEY = os.environ.get('SUPABASE_PUBLISHABLE_KEY', '')
UA = {'User-Agent': 'KnowFlags/1.0 (https://knowflags.com)'}
WIKI_PAGE = 'List_of_countries_and_territories_by_land_and_maritime_borders'

# Territoires du Factbook ou de Wikipédia absents de la base : rattachés à leur État, avec « via »
TERRITORIES = {
    'french guiana': ('fr', 'French Guiana'), 'saint martin': ('fr', 'Saint Martin'), 'saint martin (france)': ('fr', 'Saint Martin'),
    'collectivity of saint martin': ('fr', 'Saint Martin'), 'saint barthelemy': ('fr', 'Saint Barthélemy'), 'guadeloupe': ('fr', 'Guadeloupe'),
    'martinique': ('fr', 'Martinique'), 'mayotte': ('fr', 'Mayotte'), 'reunion': ('fr', 'Réunion'), 'saint pierre and miquelon': ('fr', 'Saint Pierre and Miquelon'),
    'wallis and futuna': ('fr', 'Wallis and Futuna'), 'french southern and antarctic lands': ('fr', 'French Southern Lands'),
    'clipperton island': ('fr', 'Clipperton'), 'akrotiri': ('gb', 'Akrotiri'), 'dhekelia': ('gb', 'Dhekelia'),
    'uk (akrotiri)': ('gb', 'Akrotiri'), 'uk (dhekelia)': ('gb', 'Dhekelia'), 'turks and caicos islands': ('gb', 'Turks and Caicos'),
    'anguilla': ('gb', 'Anguilla'), 'british virgin islands': ('gb', 'British Virgin Islands'), 'montserrat': ('gb', 'Montserrat'),
    'british indian ocean territory': ('gb', 'British Indian Ocean Territory'), 'pitcairn islands': ('gb', 'Pitcairn Islands'),
    'saint helena, ascension and tristan da cunha': ('gb', 'Saint Helena'), 'south georgia and the south sandwich islands': ('gb', 'South Georgia'),
    'united states virgin islands': ('us', 'US Virgin Islands'), 'american samoa': ('us', 'American Samoa'),
    'northern mariana islands': ('us', 'Northern Mariana Islands'), 'navassa island': ('us', 'Navassa Island'),
    'united states minor outlying islands': ('us', 'US Minor Outlying Islands'), 'wake island': ('us', 'Wake Island'),
    'howland island': ('us', 'Howland Island'), 'baker island': ('us', 'Baker Island'), 'jarvis island': ('us', 'Jarvis Island'),
    'johnston atoll': ('us', 'Johnston Atoll'), 'palmyra atoll': ('us', 'Palmyra Atoll'), 'kingman reef': ('us', 'Kingman Reef'),
    'midway atoll': ('us', 'Midway Atoll'), 'caribbean netherlands': ('nl', 'Caribbean Netherlands'), 'bonaire': ('nl', 'Bonaire'),
    'sint eustatius': ('nl', 'Sint Eustatius'), 'saba': ('nl', 'Saba'), 'norfolk island': ('au', 'Norfolk Island'),
    'christmas island': ('au', 'Christmas Island'), 'cocos (keeling) islands': ('au', 'Cocos Islands'), 'heard island and mcdonald islands': ('au', 'Heard Island'),
    'ashmore and cartier islands': ('au', 'Ashmore and Cartier Islands'), 'coral sea islands': ('au', 'Coral Sea Islands'),
    'tokelau': ('nz', 'Tokelau'), 'niue': ('nz', 'Niue'), 'cook islands': ('nz', 'Cook Islands'), 'svalbard': ('no', 'Svalbard'),
    'jan mayen': ('no', 'Jan Mayen'), 'bouvet island': ('no', 'Bouvet Island'), 'western sahara': ('ma', 'Western Sahara'),
    'macau': ('cn', 'Macau'), 'macao': ('cn', 'Macau'), 'gaza strip': ('ps', 'Gaza Strip'), 'west bank': ('ps', 'West Bank'),
    'tristan da cunha': ('gb', 'Tristan da Cunha'), 'ascension island': ('gb', 'Ascension Island'), 'saint helena': ('gb', 'Saint Helena'),
    'falkland islands': ('fk', None), 'south ossetia': ('ge', 'South Ossetia'), 'abkhazia': ('ge', 'Abkhazia'), 'transnistria': ('md', 'Transnistria'),
    'northern cyprus': ('cy', 'Northern Cyprus'), 'somaliland': ('so', 'Somaliland'),
    'akrotiri and dhekelia': ('gb', 'Akrotiri and Dhekelia'),
}
# Territoires présents dans la base : leurs frontières terrestres comptent aussi pour leur État (avec « via »)
PARENT = {'gi': ('gb', 'Gibraltar'), 'sx': ('nl', 'Sint Maarten'), 'gl': ('dk', 'Greenland'), 'aw': ('nl', 'Aruba'), 'cw': ('nl', 'Curaçao')}
ALIASES = {
    'czechia': 'cz', 'democratic republic of the congo': 'cd', 'congo, democratic republic of the': 'cd', 'republic of the congo': 'cg',
    'congo, republic of the': 'cg', 'congo': 'cg', "cote d'ivoire": 'ci', 'ivory coast': 'ci', 'burma': 'mm', 'myanmar': 'mm',
    'turkey (turkiye)': 'tr', 'turkiye': 'tr', 'turkey': 'tr', 'the gambia': 'gm', 'gambia, the': 'gm', 'gambia': 'gm', 'eswatini': 'sz',
    'swaziland': 'sz', 'timor-leste': 'tl', 'east timor': 'tl', 'holy see (vatican city)': 'va', 'holy see': 'va', 'vatican city': 'va',
    'south korea': 'kr', 'korea, south': 'kr', 'north korea': 'kp', 'korea, north': 'kp', 'kosovo': 'xk', 'russia': 'ru',
    'united states': 'us', 'us': 'us', 'united kingdom': 'gb', 'uk': 'gb', 'bahamas, the': 'bs', 'the bahamas': 'bs', 'bahamas': 'bs',
    'north macedonia': 'mk', 'macedonia': 'mk', 'laos': 'la', 'vietnam': 'vn', 'iran': 'ir', 'syria': 'sy', 'bolivia': 'bo',
    'venezuela': 've', 'tanzania': 'tz', 'moldova': 'md', 'brunei': 'bn', 'cabo verde': 'cv', 'cape verde': 'cv',
    'federated states of micronesia': 'fm', 'micronesia': 'fm', 'micronesia, federated states of': 'fm', 'state of palestine': 'ps',
    'palestine': 'ps', 'people\'s republic of china': 'cn', 'china': 'cn', 'republic of china': 'tw', 'taiwan': 'tw',
    'sao tome and principe': 'st', 'uae': 'ae', 'united arab emirates': 'ae', 'kingdom of the netherlands': 'nl', 'netherlands': 'nl',
    'saint kitts and nevis': 'kn', 'saint vincent and the grenadines': 'vc', 'saint lucia': 'lc', 'hong kong': 'hk',
    'curacao': 'cw', 'aruba': 'aw', 'sint maarten': 'sx', 'gibraltar': 'gi', 'greenland': 'gl', 'faroe islands': 'fo', 'bermuda': 'bm',
    'cayman islands': 'ky', 'puerto rico': 'pr', 'guam': 'gu', 'new caledonia': 'nc', 'french polynesia': 'pf', 'jersey': 'je',
    'guernsey': 'gg', 'isle of man': 'im', 'aland islands': 'ax', 'aland': 'ax',
    'kingdom of denmark': 'dk', 'realm of new zealand': 'nz',
}


def fold(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', s.replace('’', "'")).strip()


def main():
    if os.environ.get('COUNTRIES_FILE'):            # test local
        countries = json.load(open(os.environ['COUNTRIES_FILE']))
    else:
        countries = requests.get('https://rounuhpemkrnftoafoxg.supabase.co/rest/v1/countries?select=iso_code,name_en',
                                 headers={'apikey': KEY}, timeout=60).json()
    ours = {c['iso_code'] for c in countries}
    name2iso = {fold(c['name_en']): c['iso_code'] for c in countries if c.get('name_en')}
    name2iso.update(ALIASES)
    rows = [x.split(':') for x in open(os.path.join(ROOT, 'data/geo/fips_iso.txt')).read().strip().split('|')]
    fips2iso = {f.lower(): a.lower() for a, f, n in rows if f}
    iso2num = {a.lower(): n for a, f, n in rows if n}

    def resolve(name):
        """-> (iso, via) or (None, None)"""
        n = fold(re.sub(r'\s*\(.*?\)\s*$', '', name)) if fold(name) not in name2iso and fold(name) not in TERRITORIES else fold(name)
        if n in name2iso and name2iso[n] in ours:
            return name2iso[n], None
        if n in TERRITORIES:
            iso, via = TERRITORIES[n]
            return (iso, via) if iso in ours else (None, None)
        return None, 'MISSING'

    def txt(x):
        return (x or {}).get('text', '') if isinstance(x, dict) else ''

    def km(s):
        m = re.search(r'([\d,\.]+)\s*km', s or '')
        return float(m.group(1).replace(',', '')) if m else None

    land, coast, total, missing = {}, {}, {}, set()

    def add_edge(a, b, length, via_a=None, via_b=None):
        """a borders b (via_a = territory of a, via_b = territory of b)."""
        if not a or not b or a == b:
            return
        via = via_a or via_b
        for x, y in ((a, b), (b, a)):
            cur = land.setdefault(x, {})
            e = cur.get(y)
            if e is None or (length and not e['km']):
                cur[y] = {'km': length, 'via': via}
            elif via and e['via'] and via not in e['via'] and length and e['km']:
                # Deux territoires du même État contre le même voisin (Akrotiri + Dhekelia) : on additionne
                cur[y] = {'km': e['km'] + length, 'via': e['via'] + ' & ' + via}

    # ── Factbook ──────────────────────────────────────────────────────────
    for p in glob.glob(os.path.join(FB, '*', '*.json')):
        gec = os.path.basename(p)[:-5]
        d = json.load(open(p))
        cn = (d.get('Government') or {}).get('Country name') or {}
        short = txt(cn.get('conventional short form'))
        iso = fips2iso.get(gec)
        own_via = None
        if not iso or iso not in ours:
            t = TERRITORIES.get(fold(short))
            if not t or t[0] not in ours:
                continue
            iso, own_via = t
        g = d.get('Geography') or {}
        lb = g.get('Land boundaries') or {}
        if own_via is None:
            total[iso] = km(txt(lb.get('total')))
            coast[iso] = km(txt(g.get('Coastline')))
        text = '; '.join(txt(v) for k, v in lb.items() if k.startswith('border'))
        for part in re.split(r';\s*|\s+and\s+(?=[A-Z])', text):
            m = re.match(r'(.+?)\s+([\d,\.]+)\s*km', part.strip())
            if not m:
                continue
            other, via = resolve(m.group(1).strip())
            if via == 'MISSING':
                missing.add('factbook:' + m.group(1).strip()); continue
            length = float(m.group(2).replace(',', ''))
            add_edge(iso, other, length, own_via, via)
            if iso in PARENT and other != PARENT[iso][0]:
                add_edge(PARENT[iso][0], other, length, PARENT[iso][1], via)

    # ── Wikipedia (maritime + land via territories) ───────────────────────
    w = open(os.environ['WIKI_FILE']).read() if os.environ.get('WIKI_FILE') else requests.get('https://en.wikipedia.org/w/api.php', headers=UA, timeout=60,
                     params={'action': 'parse', 'page': WIKI_PAGE, 'prop': 'wikitext', 'format': 'json', 'formatversion': 2}).json()['parse']['wikitext']
    if os.environ.get('DUMP_WIKI'):
        open(os.environ['DUMP_WIKI'], 'w').write(w)
    maritime = {}
    tok_re = re.compile(r"\{\{[Ff]lag(icon)?\|([^}|]+)[^}]*\}\}|\[\[([^\]|]+)(?:\|[^\]]*)?\]\]")
    ROW_START = "|" + "'" * 3

    def first_name(fragment):
        """Premier nom d'une cellule : {{flag|X}}, ou le lien qui suit un {{flagicon|État}}."""
        toks = tok_re.findall(fragment)
        if not toks:
            return None
        icon, flagname, link = toks[0]
        if icon and len(toks) > 1 and toks[1][2]:
            return toks[1][2]
        return flagname or link

    for row in re.split(r'\n\|-[^\n]*\n', w):
        lines = [l for l in row.split('\n') if l.startswith('|')]
        if len(lines) < 5 or not lines[0].startswith(ROW_START):
            continue
        head = re.sub(r'\{\{efn[^}]*\}\}', '', lines[0])
        aggregate = 'includ' in head.split('<br')[1] if '<br' in head else False   # « France (y compris ses territoires) »
        subj = first_name(head.split('<br')[0])
        if not subj:
            continue
        siso, svia = resolve(subj)
        if not siso:
            if svia == 'MISSING':
                missing.add('wiki-row:' + subj)
            continue
        if aggregate:
            svia = None
        for item in re.split(r'<br\s*/?>', lines[-1]):
            item = re.sub(r'<ref[^>]*/>|<ref.*?</ref>|<ref.*$', '', item)
            item = re.sub(r'\{\{efn[^}]*\}\}', '', item)
            tm = re.search(r'\((L/M|L|M)\)\s*(?:</small>)?\s*$', item.strip())
            if not tm:
                continue
            kind = tm.group(1)
            nm = first_name(re.sub(r'<small>.*', '', item))
            if not nm:
                continue
            oiso, ovia = resolve(nm)
            if ovia == 'MISSING' or not oiso:
                sov = re.search(r'<small>\(\[\[([^\]|]+)', item)          # territoire étranger : son État
                oiso, ovia = None, None
                if sov:
                    oiso2, _ = resolve(sov.group(1))
                    if oiso2:
                        oiso, ovia = oiso2, nm
                if not oiso:
                    missing.add('wiki:' + nm)
                    continue
            if oiso == siso:
                continue
            via = svia or ovia
            if 'M' in kind:
                for x, y in ((siso, oiso), (oiso, siso)):
                    maritime.setdefault(x, {}).setdefault(y, via)
            if 'L' in kind and not aggregate and oiso not in land.get(siso, {}) and total.get(siso) != 0 and total.get(oiso) != 0:
                add_edge(siso, oiso, None, svia, ovia)

    # Pays constitutifs du Royaume-Uni (absents du Factbook) : voisins terrestres saisis à la main
    for a_, b_ in (('gb-eng', 'gb-sct'), ('gb-eng', 'gb-wls'), ('gb-nir', 'ie')):
        if a_ in ours and b_ in ours:
            add_edge(a_, b_, None)

    out = []
    for iso in sorted(ours):
        nb = land.get(iso, {})
        mar = maritime.get(iso, {})
        out.append({
            'iso': iso, 'num': iso2num.get(iso), 'land': total.get(iso), 'coast': coast.get(iso),
            'neighbours': [{'iso': k, 'km': v['km'], 'via': v['via']} for k, v in sorted(nb.items(), key=lambda kv: -(kv[1]['km'] or 0))],
            'maritime': [{'iso': k, 'via': v} for k, v in sorted(mar.items())],
        })
    json.dump(out, open(os.path.join(ROOT, 'data/geo/borders.json'), 'w'), ensure_ascii=False, indent=0)
    print('countries', len(out), 'with land neighbours', sum(1 for r in out if r['neighbours']),
          'with maritime', sum(1 for r in out if r['maritime']))
    print('unmatched', sorted(missing))
    for k in ('fr', 'bh', 'jp', 'is', 'gb', 'nl'):
        r = next((x for x in out if x['iso'] == k), None)
        print(k, r and json.dumps({'n': r['neighbours'], 'm': [m['iso'] + ('(' + m['via'] + ')' if m['via'] else '') for m in r['maritime']]}, ensure_ascii=False))


if __name__ == '__main__':
    main()

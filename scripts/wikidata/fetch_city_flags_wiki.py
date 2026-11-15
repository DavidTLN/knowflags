"""Second pass for cities: find the flag shown in each city's Wikipedia articles.

For every record of data/wikidata/cities.json with no image yet, look at the images used by the city's
articles (24 languages) and keep a file whose name says "flag" in some language and names the city.
Rejected on the way (lessons from the region pass): files used by several cities, national flags,
photos (jpg), proposals and historical flags, files naming another place.
Updates cities.json in place (file, image_path, method='wikipedia') and downloads to public/flags/cities.
"""
import collections
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_flags import OUT_DIR, sparql, v, qid, commons_info, download  # noqa: E402
from fetch_region_flags import LANGS, FLAG_WORDS, NOT_FLAG, fold, tokens, api, flag_like  # noqa: E402
from fetch_cities import CITY_DIR, COUNTRY_QID  # noqa: E402

STOP = set('flag of the bandera de del la le drapeau flagge bandeira bandiera bayragi bayrak city ciudad ville stadt cidade '
           'municipality municipal corporation metropolitan council svg png gif official civil'.split())
BAD = re.compile(r'propos|unofficial|fiction|fantasy|historic|former|waving|photo|dynast|sultanat|emirat|kingdom|empire|\d{4} ?\d{4}', re.I)


def main():
    path = os.path.join(OUT_DIR, 'cities.json')
    recs = json.load(open(path))
    todo = [d for d in recs if not d.get('image_path')]
    by_q = {d['qid']: d for d in todo}
    print('cities without flag', len(todo), flush=True)

    # Noms des pays (pour écarter les drapeaux nationaux)
    cq = ' '.join('wd:' + q for q in COUNTRY_QID.values())
    cnames = set()
    for b in sparql(f'SELECT ?l WHERE {{ VALUES ?c {{ {cq} }} ?c rdfs:label ?l FILTER(lang(?l) IN ("en","fr","es","de")) }}'):
        cnames.add(fold(v(b, 'l')))
    ctoks = set(t for n in cnames for t in n.split())

    links = {}
    qs = list(by_q)
    for i in range(0, len(qs), 150):
        vals = ' '.join('wd:' + q for q in qs[i:i + 150])
        for b in sparql(f'''SELECT ?r ?wiki ?title WHERE {{ VALUES ?r {{ {vals} }}
  ?a schema:about ?r ; schema:isPartOf ?wiki ; schema:name ?title . FILTER(STRENDS(STR(?wiki), ".wikipedia.org/")) }}'''):
            links.setdefault(qid(v(b, 'r')), {})[v(b, 'wiki').split('//')[1].split('.')[0]] = v(b, 'title')
        time.sleep(1)

    cand = {}
    for lang in LANGS:
        need = [(q, links[q][lang]) for q in by_q if lang in links.get(q, {}) and q not in cand]
        for i in range(0, len(need), 20):
            chunk = {t: q for q, t in need[i:i + 20]}
            pages, cont = [], {}
            redirects, normal = {}, {}
            while True:
                d = api(lang, {'action': 'query', 'prop': 'images', 'titles': '|'.join(chunk), 'imlimit': 'max', 'redirects': 1, **cont})
                qd = d.get('query', {})
                pages += qd.get('pages', [])
                redirects.update({x['to']: x['from'] for x in qd.get('redirects', [])})
                normal.update({x['to']: x['from'] for x in qd.get('normalized', [])})
                if 'continue' not in d:
                    break
                cont = d['continue']
            for p in pages:
                t = p.get('title'); t = redirects.get(t, t); t = normal.get(t, t)
                q = chunk.get(t)
                if not q:
                    continue
                rec = by_q[q]
                names = list(links.get(q, {}).values()) + [rec['name_en'], rec['name_fr']]
                toks = tokens(*names) - ctoks
                for im in p.get('images', []):
                    f = im['title'].split(':', 1)[1]
                    ff = fold(re.sub(r'\.[a-z]+$', '', f, flags=re.I))
                    if not FLAG_WORDS.search(f) or NOT_FLAG.search(f) or BAD.search(f) or re.search(r'\.jpe?g$', f, re.I):
                        continue
                    hit = [t for t in toks if t in ff.split() or (len(t) >= 6 and t in ff.replace(' ', ''))]
                    if not hit:
                        continue
                    rest = [w for w in ff.split() if len(w) >= 4 and w not in STOP and w not in ctoks and not w.isdigit()
                            and not FLAG_WORDS.search(w) and not any(w in n or n in w for n in toks)]
                    if rest:            # le fichier nomme autre chose (quartier, province, autre ville)
                        continue
                    score = len(hit) * 2 + (1 if f.lower().endswith('.svg') else 0) + (2 if lang == 'en' else 0)
                    cand.setdefault(q, []).append((score, f))
            time.sleep(0.2)
        print('lang', lang, 'cities with a candidate', len(cand), flush=True)

    # Un même fichier proposé pour plusieurs villes = drapeau générique : écarté
    best = {q: max(cs)[1] for q, cs in cand.items()}
    use = collections.Counter(best.values())
    best = {q: f for q, f in best.items() if use[f] == 1}
    info = commons_info(sorted(set(best.values())))
    n = 0
    for q, f in best.items():
        i = info.get(f)
        if not i or not flag_like(i):
            continue
        rec = by_q[q]
        try:
            rec['image_path'] = download(i, os.path.join(CITY_DIR, rec['slug']))
        except Exception as ex:  # noqa: BLE001
            print('  ! download failed', f, ex); continue
        rec.update({'file': f, 'method': 'wikipedia', **{k: i[k] for k in ('license', 'artist', 'page', 'width', 'height')}})
        n += 1
    json.dump(recs, open(path, 'w'), ensure_ascii=False, indent=1)
    print('wikipedia pass: +', n, 'flags; total with image', sum(1 for d in recs if d.get('image_path')))


if __name__ == '__main__':
    main()

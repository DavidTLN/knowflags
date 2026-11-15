"""Find the flags of regions that still have no image, and download them.

Runs in GitHub Actions (.github/workflows/region-flags.yml). Reads the regions from Supabase
(public REST, publishable key), keeps those with no public/flags/regions/{slug}.{svg|png}, then tries:
  A. Wikidata: the current flag image (P41), or the image (P18) of the region's flag item (P163)
  B. Wikipedia: a flag file shown in the region's own article (en, then other languages),
     whose file name says "flag" in some language AND contains the region's name
  C. Commons: file names such as "Flag of <name>, <country>.svg" that exist
Each found image must look like a flag (width/height between 0.9 and 3).

Output:
  public/flags/regions/{slug}.{svg|png}
  data/wikidata/regions_recovered.json   [{slug, image_path, file, method, license, artist, page}]
The JSON is imported into flag_taxonomy with one SQL query (http_get from raw.githubusercontent.com).
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_flags import ROOT, OUT_DIR, UA, sparql, v, qid, commons_info, download  # noqa: E402

REG_DIR = os.path.join(ROOT, 'public', 'flags', 'regions')
SUPABASE = os.environ.get('SUPABASE_URL', 'https://rounuhpemkrnftoafoxg.supabase.co')
KEY = os.environ['SUPABASE_PUBLISHABLE_KEY']
LANGS = ['en', 'fr', 'es', 'de', 'pt', 'ru', 'it', 'pl', 'uk', 'nl', 'tr', 'ja', 'zh', 'ar', 'id', 'sv', 'cs', 'ro', 'hu', 'el', 'fa', 'ko', 'vi', 'th']

FLAG_WORDS = re.compile(r'flag|bandera|bandeira|drapeau|flagge|vlag|bandiera|flaga|flagga|lippu|zastava|vlajka|zaszlo|steag|bayrak|'
                        r'σημαια|флаг|прапор|знаме|сцяг|דגל|علم|پرچم|旗|기|ธง|झंडा|cờ|bendera', re.I)
NOT_FLAG = re.compile(r'coat|arms|escudo|blason|wappen|herb|герб|emblem|seal|sello|logo|map|locator|location|mapa|karte|carte|карта|'
                      r'position|relief|icon|symbol|banner_of_the_president|stub', re.I)
GENERIC = set('''province provincia provincie region regione regiao região oblast okrug krai kray county department departamento
departement district distrito governorate prefecture state estado municipality municipio municipalité autonomous republic
canton voivodeship parish island islands territory capital the of de del la le les das do da di du von und and city area
federal community comunidad autonoma'''.split())
QUALIFIERS = ['Province', 'Region', 'Department', 'District', 'Governorate', 'Prefecture', 'State', 'County', 'Oblast']

S = requests.Session()
S.headers['User-Agent'] = UA


def fold(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def tokens(*names):
    out = set()
    for n in names:
        for t in fold(n).split():
            if len(t) >= 4 and t not in GENERIC:
                out.add(t)
    return out


def rest(path):
    rows, start = [], 0
    while True:
        r = S.get(f'{SUPABASE}/rest/v1/{path}', headers={'apikey': KEY, 'Range': f'{start}-{start + 999}'}, timeout=60)
        r.raise_for_status()
        chunk = r.json()
        rows += chunk
        if len(chunk) < 1000:
            return rows
        start += 1000


def has_file(slug):
    return any(os.path.exists(os.path.join(REG_DIR, f'{slug}.{e}')) for e in ('svg', 'png'))


def flag_like(i):
    w, h = i.get('width') or 0, i.get('height') or 0
    return w and h and 0.9 <= w / h <= 3.0


def api(lang, params):
    base = 'https://commons.wikimedia.org/w/api.php' if lang == 'commons' else f'https://{lang}.wikipedia.org/w/api.php'
    for k in range(4):
        r = S.get(base, params={**params, 'format': 'json', 'formatversion': 2}, timeout=60)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(5 * (k + 1)); continue
        r.raise_for_status()
        return r.json()
    return {}


def main():
    countries = {c['id']: c for c in rest('flag_taxonomy?select=id,iso_code,name_en,metadata&flag_type=eq.country')}
    regions = rest('flag_taxonomy?select=id,slug,name_en,name_fr,country_id,metadata&flag_type=eq.region&order=slug')
    todo = [r for r in regions if not has_file(r['slug'])]
    print('regions', len(regions), 'missing a flag file', len(todo), flush=True)

    found = {}          # slug -> (commons file, method)
    by_q = {}
    for r in todo:
        q = (r.get('metadata') or {}).get('wikidata')
        if q:
            by_q.setdefault(q, []).append(r)

    # ── A. Wikidata P41 / P163→P18 ──────────────────────────────────────────
    qs = list(by_q)
    sitelinks = {}      # qid -> {lang: title}
    for i in range(0, len(qs), 150):
        vals = ' '.join('wd:' + q for q in qs[i:i + 150])
        rows = sparql(f'''
SELECT ?r ?flag ?f2 WHERE {{
  VALUES ?r {{ {vals} }}
  OPTIONAL {{ ?r p:P41 ?st . ?st ps:P41 ?flag ; wikibase:rank ?rk . FILTER(?rk != wikibase:DeprecatedRank) FILTER NOT EXISTS {{ ?st pq:P582 ?e }} }}
  OPTIONAL {{ ?r wdt:P163 ?fi . ?fi wdt:P18 ?f2 . FILTER NOT EXISTS {{ ?fi wdt:P31 wd:Q14660 }} }}
}}''')
        for b in rows:
            q = qid(v(b, 'r'))
            img = v(b, 'flag') or v(b, 'f2')
            if img:
                for r in by_q[q]:
                    found.setdefault(r['slug'], (urllib.parse.unquote(img.rsplit('/', 1)[1]).replace('_', ' '), 'wikidata'))
        links = sparql(f'''
SELECT ?r ?wiki ?title WHERE {{
  VALUES ?r {{ {vals} }}
  ?a schema:about ?r ; schema:isPartOf ?wiki ; schema:name ?title .
  FILTER(STRENDS(STR(?wiki), ".wikipedia.org/"))
}}''')
        for b in links:
            lang = v(b, 'wiki').split('//')[1].split('.')[0]
            sitelinks.setdefault(qid(v(b, 'r')), {})[lang] = v(b, 'title')
        time.sleep(1)
    print('A wikidata:', len(found), flush=True)

    # ── B. images used in the region's Wikipedia articles ──────────────────
    cand = {}           # slug -> list of (score, file, lang)
    for lang in LANGS:
        need = [(q, sitelinks[q][lang]) for q in by_q if q in sitelinks and lang in sitelinks[q]
                and any(r['slug'] not in found for r in by_q[q])]
        for i in range(0, len(need), 20):
            chunk = dict((t, q) for q, t in need[i:i + 20])
            params = {'action': 'query', 'prop': 'images', 'titles': '|'.join(chunk), 'imlimit': 'max', 'redirects': 1}
            pages, cont = [], {}
            while True:
                d = api(lang, {**params, **cont})
                pages += d.get('query', {}).get('pages', [])
                redirects = {x['to']: x['from'] for x in d.get('query', {}).get('redirects', [])}
                normal = {x['to']: x['from'] for x in d.get('query', {}).get('normalized', [])}
                if 'continue' not in d:
                    break
                cont = d['continue']
            for p in pages:
                t = p.get('title')
                t = redirects.get(t, t); t = normal.get(t, t)
                q = chunk.get(t)
                if not q:
                    continue
                regs = by_q[q]
                names = list(sitelinks.get(q, {}).values()) + [regs[0]['name_en'], regs[0]['name_fr']]
                toks = tokens(*names)
                ctry = countries.get(regs[0]['country_id'], {})
                ctoks = tokens(ctry.get('name_en', ''))
                for im in p.get('images', []):
                    f = im['title'].split(':', 1)[1]
                    ff = fold(f)
                    if not FLAG_WORDS.search(f) or NOT_FLAG.search(f):
                        continue
                    hit = [t for t in toks if t in ff.split() or (len(t) >= 6 and t in ff.replace(' ', ''))]
                    if not hit or (set(hit) <= ctoks):
                        continue
                    full = [fold(x) for x in names if x]
                    exact = any(x and x in ff for x in full)      # « Moscow Oblast » plutôt que « Moscow »
                    score = len(hit) * 2 + (4 if exact else 0) + (1 if f.lower().endswith('.svg') else 0) + (2 if lang == 'en' else 0)
                    for r in regs:
                        if r['slug'] not in found:
                            cand.setdefault(r['slug'], []).append((score, f, lang))
            time.sleep(0.2)
        print('B', lang, 'candidates so far', len(cand), flush=True)

    # Vérifie les candidats B (existence, format drapeau) et garde le meilleur
    files = sorted({f for cs in cand.values() for _, f, _ in cs})
    info = commons_info(files) if files else {}
    for slug, cs in cand.items():
        for _, f, _ in sorted(cs, reverse=True):
            i = info.get(f)
            if i and flag_like(i):
                found.setdefault(slug, (f, 'wikipedia'))
                break
    print('after B:', len(found), flush=True)

    # ── C. Commons file-name guesses ───────────────────────────────────────
    guesses = {}        # file -> slug
    for r in todo:
        if r['slug'] in found:
            continue
        ctry = countries.get(r['country_id'], {}).get('name_en', '')
        n = (r['name_en'] or '').strip()
        if not n:
            continue
        has_q = any(w.lower() in fold(n).split() for w in QUALIFIERS)
        names = [n] + ([f'{n} {w}' for w in QUALIFIERS] if not has_q else [])
        opts = []
        for nm in names:
            for ext in ('svg', 'png'):
                opts += [f'Flag of {nm}, {ctry}.{ext}', f'Flag of {nm} ({ctry}).{ext}']
                if nm != n or has_q:
                    opts.append(f'Flag of {nm}.{ext}')
        for o in opts:
            guesses.setdefault(o, r['slug'])
    files = list(guesses)
    ok = {}
    for i in range(0, len(files), 50):
        d = api('commons', {'action': 'query', 'titles': '|'.join('File:' + f for f in files[i:i + 50]), 'prop': 'imageinfo', 'iiprop': 'size'})
        for p in d.get('query', {}).get('pages', []):
            if not p.get('missing') and p.get('imageinfo'):
                ok[p['title'].split(':', 1)[1]] = True
        time.sleep(0.2)
    for f in files:
        if f in ok:
            found.setdefault(guesses[f], (f, 'commons-name'))
    print('after C:', len(found), flush=True)

    # ── Download ──────────────────────────────────────────────────────────
    info = commons_info(sorted({f for f, _ in found.values()}))
    out = []
    for slug, (f, method) in sorted(found.items()):
        i = info.get(f)
        if not i or not flag_like(i):
            continue
        try:
            path = download(i, os.path.join(REG_DIR, slug))
        except Exception as ex:  # noqa: BLE001
            print('  ! download failed', f, ex); continue
        out.append({'slug': slug, 'image_path': path, 'file': f, 'method': method,
                    'license': i.get('license'), 'artist': i.get('artist'), 'page': i.get('page')})
    json.dump(out, open(os.path.join(OUT_DIR, 'regions_recovered.json'), 'w'), ensure_ascii=False, indent=1)
    by_m = {}
    for o in out:
        by_m[o['method']] = by_m.get(o['method'], 0) + 1
    print('recovered', len(out), 'of', len(todo), by_m)


if __name__ == '__main__':
    main()

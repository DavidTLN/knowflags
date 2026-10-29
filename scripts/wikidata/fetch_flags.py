"""Fetch historical national flags and first-level region flags from Wikidata / Wikimedia Commons.

Runs in GitHub Actions (.github/workflows/wikidata-flags.yml) because Commons is not reachable
from every environment. Output:
  public/flags/history/{iso}-{year}[-n].{svg|png}
  public/flags/regions/{iso}-{slug}.{svg|png}
  data/wikidata/history.json   one record per historical flag
  data/wikidata/regions.json   one record per first-level division (flag may be null)
The JSON files are then imported into Supabase (country_flag_history, flag_taxonomy).

Usage: python3 scripts/wikidata/fetch_flags.py [history|regions|all] [iso ...]
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse

import requests

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HIST_DIR = os.path.join(ROOT, 'public', 'flags', 'history')
REG_DIR = os.path.join(ROOT, 'public', 'flags', 'regions')
OUT_DIR = os.path.join(ROOT, 'data', 'wikidata')
UA = 'KnowFlagsImporter/1.0 (https://github.com/DavidTLN/knowflags)'
S = requests.Session()
S.headers['User-Agent'] = UA

ISO = ('ad ae af ag al am ao ar at au aw ax az ba bb bd be bf bg bh bi bj bm bn bo br bs bt bw by bz ca cd cf cg '
       'ch ci cl cm cn co cr cu cv cw cy cz de dj dk dm do dz ec ee eg er es et fi fj fk fm fo fr ga gb gd ge gg gh '
       'gi gl gm gn gq gr gt gu gw gy hk hn hr ht hu id ie il im in iq ir is it je jm jo jp ke kg kh ki km kn kp kr '
       'kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mo mr mt mu mv mw mx my mz na nc ne '
       'ng ni nl no np nr nz om pa pe pf pg ph pk pl pr ps pt pw py qa ro rs ru rw sa sb sc sd se sg si sk sl sm sn '
       'so sr ss st sv sx sy sz td tg th tj tl tm tn to tr tt tv tw tz ua ug us uy uz va vc ve vn vu ws xk ye za zm '
       'zw').split()
EXTRA_QID = {'gb-eng': 'Q21', 'gb-sct': 'Q22', 'gb-wls': 'Q25', 'gb-nir': 'Q26', 'xk': 'Q1246'}
# Countries whose regions are already curated in flag_taxonomy
REGIONS_DONE = {'ca', 'fr', 'de', 'ch', 'gb', 'us'}
MAX_SVG = 400_000   # larger SVGs are replaced by a 1000px PNG rendering


def sparql(q, tries=4):
    for i in range(tries):
        r = S.get('https://query.wikidata.org/sparql', params={'query': q, 'format': 'json'}, timeout=120)
        if r.status_code == 200:
            return r.json()['results']['bindings']
        time.sleep(5 * (i + 1))
    r.raise_for_status()


def v(b, k):
    return b[k]['value'] if k in b else None


def qid(uri):
    return uri.rsplit('/', 1)[-1] if uri else None


def year(d):
    if not d:
        return None
    m = re.match(r'^(-?\d{1,4})', d.lstrip('+'))
    return int(m.group(1)) if m else None


def isodate(d):
    """Wikidata time -> YYYY-MM-DD (Postgres date), None if not representable."""
    if not d:
        return None
    m = re.match(r'^\+?(\d{4})-(\d{2})-(\d{2})', d)
    if not m:
        return None
    y, mo, da = m.groups()
    return f'{y}-{mo if mo != "00" else "01"}-{da if da != "00" else "01"}'


def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def commons_file(url):
    # http://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20X.svg -> 'Flag of X.svg'
    return urllib.parse.unquote(url.rsplit('/', 1)[-1]).replace('_', ' ')


def commons_info(files):
    """Batch imageinfo: url, size, mime, license, artist, thumb."""
    out = {}
    files = list(dict.fromkeys(files))
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        r = S.get('https://commons.wikimedia.org/w/api.php', params={
            'action': 'query', 'format': 'json', 'prop': 'imageinfo',
            'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 1000,
            'titles': '|'.join('File:' + f for f in chunk)}, timeout=120)
        r.raise_for_status()
        data = r.json()
        norm = {n['to']: n['from'] for n in data['query'].get('normalized', [])}
        for p in data['query']['pages'].values():
            if 'imageinfo' not in p:
                continue
            ii = p['imageinfo'][0]
            meta = ii.get('extmetadata', {})
            title = norm.get(p['title'], p['title'])[5:]
            out[title] = {
                'url': ii['url'], 'thumb': ii.get('thumburl'), 'size': ii.get('size', 0),
                'mime': ii.get('mime'), 'width': ii.get('width'), 'height': ii.get('height'),
                'license': (meta.get('LicenseShortName') or {}).get('value'),
                'artist': re.sub(r'<[^>]+>', '', (meta.get('Artist') or {}).get('value', '')).strip()[:200],
                'page': 'https://commons.wikimedia.org/wiki/File:' + title.replace(' ', '_'),
            }
        time.sleep(1)
    return out


def download(info, dest_noext):
    if info['mime'] == 'image/svg+xml' and info['size'] <= MAX_SVG:
        url, ext = info['url'], '.svg'
    elif info.get('thumb'):
        url, ext = info['thumb'], '.png'
    else:
        url, ext = info['url'], os.path.splitext(info['url'])[1].lower()
    path = dest_noext + ext
    if not os.path.exists(path):
        for i in range(4):
            r = S.get(url, timeout=120)
            if r.status_code == 200:
                break
            time.sleep(3 * (i + 1))
        r.raise_for_status()
        with open(path, 'wb') as f:
            f.write(r.content)
        time.sleep(0.3)
    return '/' + os.path.relpath(path, os.path.join(ROOT, 'public')).replace(os.sep, '/')


def country_qids(isos):
    rows = sparql('SELECT ?c ?iso WHERE { ?c wdt:P297 ?iso . FILTER NOT EXISTS { ?c wdt:P576 ?x } }')
    m = {}
    for b in rows:
        iso = v(b, 'iso').lower()
        m.setdefault(iso, qid(v(b, 'c')))
    m.update(EXTRA_QID)
    return {i: m[i] for i in isos if i in m}


def fetch_history(qids):
    recs = []
    for iso, q in qids.items():
        rows = sparql(f'''
SELECT ?img ?start ?end ?flag ?flagLabelEn ?flagLabelFr WHERE {{
  {{ wd:{q} p:P41 ?st . ?st ps:P41 ?img .
     OPTIONAL {{ ?st pq:P580 ?start }} OPTIONAL {{ ?st pq:P582 ?end }} }}
  UNION
  {{ wd:{q} wdt:P163 ?flag . ?flag wdt:P18 ?img .
     OPTIONAL {{ ?flag wdt:P571|wdt:P580 ?start }} OPTIONAL {{ ?flag wdt:P576|wdt:P582 ?end }}
     OPTIONAL {{ ?flag rdfs:label ?flagLabelEn FILTER(lang(?flagLabelEn)='en') }}
     OPTIONAL {{ ?flag rdfs:label ?flagLabelFr FILTER(lang(?flagLabelFr)='fr') }} }}
}}''')
        seen = set()
        for b in rows:
            f = commons_file(v(b, 'img'))
            s, e = v(b, 'start'), v(b, 'end')
            if not e or f in seen:      # keep only flags that ended (current flag already exists)
                continue
            seen.add(f)
            recs.append({'iso': iso, 'qid': q, 'file': f, 'date_start': isodate(s), 'date_end': isodate(e),
                         'year_start': year(s), 'year_end': year(e),
                         'label_en': v(b, 'flagLabelEn'), 'label_fr': v(b, 'flagLabelFr'),
                         'flag_qid': qid(v(b, 'flag'))})
        print('history', iso, sum(1 for r in recs if r['iso'] == iso), flush=True)
        time.sleep(1)
    info = commons_info([r['file'] for r in recs])
    used = {}
    for r in recs:
        i = info.get(r['file'])
        if not i:
            r['image_url'] = None
            continue
        base = f"{r['iso']}-{r['year_start'] if r['year_start'] is not None else 'x'}"
        n = used.get(base, 0)
        used[base] = n + 1
        name = base if n == 0 else f'{base}-wd{n}'
        try:
            r['image_url'] = download(i, os.path.join(HIST_DIR, name))
        except Exception as ex:  # noqa: BLE001
            print('  ! download failed', r['file'], ex)
            r['image_url'] = None
        r.update({k: i[k] for k in ('license', 'artist', 'page', 'width', 'height')})
    return recs


def fetch_regions(qids):
    recs = []
    for iso, q in qids.items():
        if iso in REGIONS_DONE or iso.startswith('gb-'):
            continue
        rows = sparql(f'''
SELECT DISTINCT ?r ?en ?fr ?code ?flag ?capEn ?pop WHERE {{
  wd:{q} p:P150 ?s . ?s ps:P150 ?r .
  FILTER NOT EXISTS {{ ?s pq:P582 ?e }}
  FILTER NOT EXISTS {{ ?r wdt:P576 ?d }}
  OPTIONAL {{ ?r rdfs:label ?en FILTER(lang(?en)='en') }}
  OPTIONAL {{ ?r rdfs:label ?fr FILTER(lang(?fr)='fr') }}
  OPTIONAL {{ ?r wdt:P300 ?code }}
  OPTIONAL {{ ?r p:P41 ?fs . ?fs ps:P41 ?flag . FILTER NOT EXISTS {{ ?fs pq:P582 ?fe }} }}
  OPTIONAL {{ ?r wdt:P36 ?cap . ?cap rdfs:label ?capEn FILTER(lang(?capEn)='en') }}
  OPTIONAL {{ ?r wdt:P1082 ?pop }}
}}''')
        by = {}
        for b in rows:
            rq = qid(v(b, 'r'))
            d = by.setdefault(rq, {'iso': iso, 'qid': rq, 'name_en': v(b, 'en'), 'name_fr': v(b, 'fr'),
                                   'code': v(b, 'code'), 'file': None, 'capital_en': v(b, 'capEn'),
                                   'population': None})
            if v(b, 'flag') and not d['file']:
                d['file'] = commons_file(v(b, 'flag'))
            if v(b, 'pop'):
                d['population'] = max(d['population'] or 0, int(float(v(b, 'pop'))))
            if not d['code'] and v(b, 'code'):
                d['code'] = v(b, 'code')
        regs = [d for d in by.values() if d['name_en'] or d['name_fr']]
        for d in regs:
            d['name_en'] = d['name_en'] or d['name_fr']
            d['name_fr'] = d['name_fr'] or d['name_en']
            d['slug'] = f"{iso}-{slugify(d['name_en'])}"
        recs.extend(regs)
        print('regions', iso, len(regs), sum(1 for d in regs if d['file']), flush=True)
        time.sleep(1)
    info = commons_info([r['file'] for r in recs if r['file']])
    for r in recs:
        i = info.get(r['file']) if r['file'] else None
        r['image_path'] = None
        if i:
            try:
                r['image_path'] = download(i, os.path.join(REG_DIR, r['slug']))
            except Exception as ex:  # noqa: BLE001
                print('  ! download failed', r['file'], ex)
            r.update({k: i[k] for k in ('license', 'artist', 'page', 'width', 'height')})
    return recs


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    isos = sys.argv[2:] or ISO
    for d in (HIST_DIR, REG_DIR, OUT_DIR):
        os.makedirs(d, exist_ok=True)
    qids = country_qids(isos)
    print('countries resolved:', len(qids), 'missing:', sorted(set(isos) - set(qids)))
    if mode in ('history', 'all'):
        h = fetch_history(qids)
        json.dump(h, open(os.path.join(OUT_DIR, 'history.json'), 'w'), ensure_ascii=False, indent=1)
        print('history records:', len(h))
    if mode in ('regions', 'all'):
        r = fetch_regions(qids)
        json.dump(r, open(os.path.join(OUT_DIR, 'regions.json'), 'w'), ensure_ascii=False, indent=1)
        print('region records:', len(r), 'with flag:', sum(1 for x in r if x['image_path']))


if __name__ == '__main__':
    main()

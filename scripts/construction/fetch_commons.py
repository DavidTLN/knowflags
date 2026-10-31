"""List and download Wikimedia Commons construction sheets of flags.

Runs on GitHub Actions (Commons is not reachable from every sandbox).
Output:
  data/construction/commons_index.json   one entry per file: title, url, size, licence, artist
  data/construction/commons/<safe name>.svg
"""
import json
import os
import re
import time

import requests

API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'KnowFlagsBot/1.0 (https://knowflags.com; construction sheet inventory)'}
OUT = 'data/construction'
S = requests.Session()
S.headers.update(UA)


def api(**p):
    p.update(format='json', formatversion=2)
    for attempt in range(5):
        r = S.get(API, params=p, timeout=60)
        if r.status_code == 200:
            return r.json()
        time.sleep(3 * (attempt + 1))
    r.raise_for_status()


def category_files(root, depth=3):
    seen_cats, files = set(), set()
    todo = [(root, 0)]
    while todo:
        cat, d = todo.pop()
        if cat in seen_cats:
            continue
        seen_cats.add(cat)
        cont = {}
        while True:
            j = api(action='query', list='categorymembers', cmtitle=cat, cmlimit=500, cmtype='file|subcat', **cont)
            for m in j['query']['categorymembers']:
                if m['ns'] == 6:
                    files.add(m['title'])
                elif m['ns'] == 14 and d < depth:
                    todo.append((m['title'], d + 1))
            if 'continue' not in j:
                break
            cont = j['continue']
    return files, seen_cats


def search_files(q):
    files, cont = set(), {}
    while True:
        j = api(action='query', list='search', srsearch=q, srnamespace=6, srlimit=500, **cont)
        for m in j['query']['search']:
            files.add(m['title'])
        if 'continue' not in j:
            break
        cont = j['continue']
    return files


def imageinfo(titles):
    out = {}
    titles = sorted(titles)
    for i in range(0, len(titles), 50):
        j = api(action='query', prop='imageinfo', titles='|'.join(titles[i:i + 50]),
                iiprop='url|size|mime|extmetadata', iiextmetadatafilter='LicenseShortName|Artist|UsageTerms')
        for p in j['query']['pages']:
            ii = (p.get('imageinfo') or [{}])[0]
            em = ii.get('extmetadata', {})
            out[p['title']] = {
                'title': p['title'],
                'url': ii.get('url'),
                'mime': ii.get('mime'),
                'size': ii.get('size'),
                'width': ii.get('width'),
                'height': ii.get('height'),
                'license': em.get('LicenseShortName', {}).get('value'),
                'artist': re.sub('<[^>]+>', '', em.get('Artist', {}).get('value', '') or '').strip(),
            }
    return out


def safe(title):
    return re.sub(r'[^A-Za-z0-9._()-]+', '_', title[5:])


def main():
    os.makedirs(f'{OUT}/commons', exist_ok=True)
    files = set()
    cats = set()
    for root in ('Category:Construction sheets of national flags',
                 'Category:Construction sheets of flags',
                 'Category:Flag construction sheets'):
        f, c = category_files(root)
        print(root, len(f), 'files', len(c), 'categories')
        files |= f
        cats |= c
    for q in ('intitle:"construction sheet"', 'intitle:construction intitle:flag', 'intitle:"construction" intitle:"flag of"'):
        f = search_files(q)
        print(q, len(f))
        files |= f
    files = {t for t in files if t.lower().endswith('.svg') and 'construction' in t.lower()}
    print('svg construction files:', len(files))
    info = imageinfo(files)
    with open(f'{OUT}/commons_index.json', 'w') as fh:
        json.dump({'categories': sorted(cats), 'files': [info[k] for k in sorted(info)]}, fh, ensure_ascii=False, indent=1)
    n = 0
    for t, m in sorted(info.items()):
        if not m.get('url') or (m.get('size') or 0) > 3_000_000:
            continue
        path = f'{OUT}/commons/{safe(t)}'
        if os.path.exists(path):
            continue
        for attempt in range(4):
            r = S.get(m['url'], timeout=60)
            if r.status_code == 200:
                with open(path, 'wb') as fh:
                    fh.write(r.content)
                n += 1
                break
            time.sleep(5 * (attempt + 1))
        time.sleep(0.3)
    print('downloaded', n)


if __name__ == '__main__':
    main()

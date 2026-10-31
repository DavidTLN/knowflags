"""Download the Commons images chosen during the historical flags review.

Reads data/history/selection.json: [{"file": "Flag of X (1900–1950).svg", "name": "xx-1900"}, ...]
and writes public/flags/history/{name}.svg (or .png for rasters and SVGs over 400 KB,
rendered by Commons as a 1000 px wide PNG). Existing files are left alone.
Writes data/history/downloaded.json: {name: "public path"}.
"""
import json
import os
import time

import requests

OUT = 'public/flags/history'
UA = {'User-Agent': 'KnowFlagsBot/1.0 (https://knowflags.com; historical flags review)'}
S = requests.Session()
S.headers.update(UA)
MAX_SVG = 400_000


def info(titles):
    out = {}
    for i in range(0, len(titles), 25):
        for attempt in range(4):
            r = S.get('https://commons.wikimedia.org/w/api.php', params=dict(
                action='query', prop='imageinfo', titles='|'.join('File:' + t for t in titles[i:i + 25]),
                iiprop='url|size|mime', iiurlwidth=1000, redirects=1, format='json', formatversion=2), timeout=60)
            if r.status_code == 200:
                break
            time.sleep(5)
        q = r.json().get('query', {})
        back = {}
        for n in q.get('normalized', []):
            back[n['to']] = n['from']
        for d in q.get('redirects', []):
            back[d['to']] = back.get(d['from'], d['from'])
        for p in q.get('pages', []):
            ii = (p.get('imageinfo') or [None])[0]
            src = back.get(p['title'], p['title'])
            out[src.replace('File:', '', 1)] = ii
        time.sleep(0.3)
    return out


def main():
    sel = json.load(open('data/history/selection.json'))
    os.makedirs(OUT, exist_ok=True)
    done = {}
    if os.path.exists('data/history/downloaded.json'):
        done = json.load(open('data/history/downloaded.json'))
    todo = [s for s in sel if s['name'] not in done]
    meta = info(sorted({s['file'] for s in todo}))
    for s in todo:
        ii = meta.get(s['file'])
        if not ii:
            print('missing', s['file'])
            continue
        is_svg = ii.get('mime') == 'image/svg+xml'
        if is_svg and (ii.get('size') or 0) <= MAX_SVG:
            url, ext = ii['url'], 'svg'
        else:
            url, ext = ii.get('thumburl') or ii['url'], 'png'
        path = f'{OUT}/{s["name"]}.{ext}'
        for attempt in range(4):
            r = S.get(url, timeout=120)
            if r.status_code == 200 and r.content:
                open(path, 'wb').write(r.content)
                done[s['name']] = '/' + path.replace('public/', '', 1)
                print('ok', s['name'], ext, len(r.content))
                break
            time.sleep(5 * (attempt + 1))
        else:
            print('fail', s['file'], r.status_code)
        time.sleep(0.4)
    json.dump(done, open('data/history/downloaded.json', 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()

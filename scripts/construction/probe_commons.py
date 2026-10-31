"""Second pass: look for construction sheets of specific flags (per-country searches).

Usage: python3 scripts/construction/probe_commons.py "Name|Alt name" ...
Writes data/construction/probe.json and downloads new SVG hits next to the others.
"""
import json
import sys
import time

from fetch_commons import api, imageinfo, safe, S, OUT
import os


def main():
    hits = {}
    for arg in sys.argv[1:]:
        found = set()
        for name in arg.split('|'):
            for q in (f'intitle:construction intitle:"{name}"', f'intitle:"{name}" intitle:sheet',
                      f'"{name}" flag construction sheet', f'intitle:"{name}" intitle:specification flag',
                      f'intitle:"{name}" intitle:construcción', f'intitle:"{name}" intitle:"construction"'):
                try:
                    j = api(action='query', list='search', srsearch=q, srnamespace=6, srlimit=50)
                except Exception as e:  # noqa: BLE001
                    print('err', q, e)
                    continue
                for m in j.get('query', {}).get('search', []):
                    t = m['title']
                    tl = t.lower()
                    if any(k in tl for k in ('construct', 'specification', 'sheet', 'construcci', 'konstrukt')):
                        found.add(t)
                time.sleep(0.2)
            for cat in (f'Category:Flag of {name}', f'Category:Flags of {name}', f'Category:National flag of {name}',
                        f'Category:Construction sheets of the flag of {name}', f'Category:Flag of the {name}'):
                try:
                    j = api(action='query', list='categorymembers', cmtitle=cat, cmlimit=500, cmtype='file')
                except Exception:  # noqa: BLE001
                    continue
                for m in j.get('query', {}).get('categorymembers', []):
                    tl = m['title'].lower()
                    if any(k in tl for k in ('construct', 'specification', 'sheet', 'construcci', 'konstrukt')):
                        found.add(m['title'])
        hits[arg] = sorted(found)
        print(arg, len(found))
    allt = {t for v in hits.values() for t in v}
    info = imageinfo(allt) if allt else {}
    json.dump({'hits': hits, 'info': info}, open(f'{OUT}/probe.json', 'w'), ensure_ascii=False, indent=1)
    for t, m in info.items():
        if not t.lower().endswith('.svg') or not m.get('url') or (m.get('size') or 0) > 3_000_000:
            continue
        path = f'{OUT}/commons/{safe(t)}'
        if os.path.exists(path):
            continue
        r = S.get(m['url'], timeout=60)
        if r.status_code == 200:
            open(path, 'wb').write(r.content)
        time.sleep(0.3)


if __name__ == '__main__':
    main()

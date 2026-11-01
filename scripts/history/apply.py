"""Turn the reviewed historical flags into image downloads and SQL.

Input: data/history/curated/{iso}.json
  {
    "iso": "xx",
    "update": [{"id": 12, "date_start": "1900-01-01", "date_end": null, "label_fr": "...", "label_en": "...",
                "notes_fr": "...", "notes_en": "...", "file": "Commons file name (only to replace the image)"}],
    "add":    [{"date_start": "...", "date_end": "...", "label_fr": "...", "label_en": "...",
                "notes_fr": "...", "notes_en": "...", "file": "Commons file name"}],
    "delete": [ids of exact duplicates]
  }
Only the keys present in an update are changed.

Step 1  python3 scripts/history/apply.py select   -> data/history/selection.json (file + image name)
Step 2  (GitHub Actions downloads the images, writes data/history/downloaded.json)
Step 3  python3 scripts/history/apply.py sql      -> data/history/sql/{iso}.sql
"""
import glob
import json
import os
import re
import sys

CUR = 'data/history/curated'
FIELDS = ('date_start', 'date_end', 'label_fr', 'label_en', 'notes_fr', 'notes_en')


def load():
    for p in sorted(glob.glob(f'{CUR}/*.json')):
        yield json.load(open(p, encoding='utf-8'))


def names(d, taken):
    """Image name {iso}-{year}, then {iso}-{year}-2, -3... (never reuses a name already on disk)."""
    out = []
    for e in d.get('update', []) + d.get('add', []):
        if not e.get('file'):
            continue
        year = (e.get('date_start') or e.get('year') or '')[:4]
        if not year:
            raise SystemExit(f"{d['iso']}: give date_start or year for {e['file']} (images are named {{iso}}-{{year}})")
        base = f"{d['iso']}-{year}"
        n, name = 1, base
        while name in taken:
            n += 1
            name = f'{base}-{n}'
        taken.add(name)
        e['_name'] = name
        out.append({'file': e['file'], 'name': name})
    return out


def on_disk():
    return {os.path.splitext(os.path.basename(p))[0] for p in glob.glob('public/flags/history/*')}


def lit(v):
    if v is None:
        return 'null'
    return "'" + str(v).replace("'", "''") + "'"


def main():
    mode = sys.argv[1]
    taken = on_disk()
    sel, data = [], list(load())
    # keep names stable across runs: reuse previous selection when the file is the same
    prev = {}
    if os.path.exists('data/history/selection.json'):
        for s in json.load(open('data/history/selection.json')):
            prev.setdefault(s['file'], []).append(s['name'])
    for d in data:
        for e in d.get('update', []) + d.get('add', []):
            if e.get('image'):
                e.pop('file', None)
            if e.get('file') and prev.get(e['file']):
                cands = [n for n in prev[e['file']] if n.startswith(d['iso'] + '-')]
                if cands:
                    e['_name'] = cands[0]
                    taken.add(cands[0])
    for d in data:
        todo = {'iso': d['iso'], 'update': [e for e in d.get('update', []) if e.get('file') and '_name' not in e],
                'add': [e for e in d.get('add', []) if e.get('file') and '_name' not in e]}
        names(todo, taken)
        for e in d.get('update', []) + d.get('add', []):
            if e.get('file'):
                sel.append({'file': e['file'], 'name': e['_name']})
    if mode == 'select':
        json.dump(sel, open('data/history/selection.json', 'w'), ensure_ascii=False, indent=1)
        print(len(sel), 'images selected')
        return
    got = json.load(open('data/history/downloaded.json')) if os.path.exists('data/history/downloaded.json') else {}
    os.makedirs('data/history/sql', exist_ok=True)
    missing = 0
    for d in data:
        q = []
        for i in d.get('delete', []):
            q.append(f'delete from country_flag_history where id = {int(i)} and iso_code = {lit(d["iso"])};')
        for e in d.get('update', []):
            sets = [f'{k} = {lit(e[k])}' for k in FIELDS if k in e]
            if e.get('image'):
                assert e['image'].startswith('https://') or os.path.exists('public' + e['image']), e['image']
                sets.append(f'image_url = {lit(e["image"])}')
            elif e.get('file'):
                if e['_name'] in got:
                    sets.append(f'image_url = {lit(got[e["_name"]])}')
                else:
                    missing += 1
            if sets:
                q.append(f'update country_flag_history set {", ".join(sets)} where id = {int(e["id"])} and iso_code = {lit(d["iso"])};')
        for e in d.get('add', []):
            img = e.get('image') or got.get(e.get('_name'))
            if e.get('image'):
                assert e['image'].startswith('https://') or os.path.exists('public' + e['image']), e['image']
            if e.get('file') and not img:
                missing += 1
                continue
            cols = ['iso_code', 'image_url'] + [k for k in FIELDS if k in e]
            vals = [lit(d['iso']), lit(img)] + [lit(e[k]) for k in FIELDS if k in e]
            q.append(f'insert into country_flag_history ({", ".join(cols)}) values ({", ".join(vals)});')
        open(f'data/history/sql/{d["iso"]}.sql', 'w', encoding='utf-8').write('\n'.join(q) + '\n')
    print('sql written', len(data), 'countries;', missing, 'images not downloaded yet')


if __name__ == '__main__':
    main()

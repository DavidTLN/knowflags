"""Import Wikimedia Commons construction sheets into public/flags/construction.

Usage:
    python3 scripts/construction/import_commons.py [iso ...]

Reads scripts/construction/commons_map.json  {iso: "File:....svg"}
and data/construction/commons_index.json (licence, author, url) +
data/construction/commons/<file>.svg (downloaded by fetch_commons.py).

Each sheet is cleaned (editor metadata removed, width/height dropped so the
viewBox drives the size) and written as {iso}-construction-{fr,en}.svg
(the Commons sheets are numeric, so both locales share the same drawing).
Credits are written to public/flags/construction/credits.json; the page shows
them under the sheet, as the Commons licences require.
"""
import json
import os
import re
import sys

from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(ROOT, 'public', 'flags', 'construction')
DATA = os.path.join(ROOT, 'data', 'construction')
SVG = 'http://www.w3.org/2000/svg'
DROP_NS = ('http://www.inkscape.org/namespaces/inkscape',
           'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
           'http://creativecommons.org/ns#',
           'http://purl.org/dc/elements/1.1/',
           'http://www.w3.org/1999/02/22-rdf-syntax-ns#')


def num(v):
    return float(re.sub(r'[^\d.eE+-]', '', v))


def clean(path):
    parser = etree.XMLParser(remove_comments=True, huge_tree=True, resolve_entities=False)
    tree = etree.parse(path, parser)
    root = tree.getroot()
    for el in list(root.iter()):
        if not isinstance(el.tag, str):
            continue
        ns = etree.QName(el).namespace
        if ns in DROP_NS or etree.QName(el).localname == 'metadata':
            p = el.getparent()
            if p is not None:
                p.remove(el)
            continue
        for a in list(el.attrib):
            ans = etree.QName(a).namespace
            if ans in DROP_NS:
                del el.attrib[a]
    vb = root.get('viewBox')
    if not vb:
        vb = '0 0 %g %g' % (num(root.get('width')), num(root.get('height')))
        root.set('viewBox', vb)
    for a in ('width', 'height'):
        if a in root.attrib:
            del root.attrib[a]
    etree.cleanup_namespaces(root)
    s = etree.tostring(root, encoding='unicode')
    s = re.sub(r'>\s+<', '><', s)
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + s + '\n'


def main():
    only = sys.argv[1:]
    cmap = json.load(open(os.path.join(HERE, 'commons_map.json')))
    index = {f['title']: f for f in json.load(open(os.path.join(DATA, 'commons_index.json')))['files']}
    credits_path = os.path.join(OUT, 'credits.json')
    credits = json.load(open(credits_path)) if os.path.exists(credits_path) else {}
    for iso, title in sorted(cmap.items()):
        if only and iso not in only:
            continue
        meta = index[title]
        src = os.path.join(DATA, 'commons', re.sub(r'[^A-Za-z0-9._()-]+', '_', title[5:]))
        svg = clean(src)
        for loc in ('fr', 'en'):
            with open(os.path.join(OUT, f'{iso}-construction-{loc}.svg'), 'w', encoding='utf-8') as f:
                f.write(svg)
        credits[iso] = {
            'source': 'Wikimedia Commons',
            'file': title,
            'url': 'https://commons.wikimedia.org/wiki/' + title.replace(' ', '_'),
            'author': meta.get('artist') or None,
            'license': meta.get('license') or None,
        }
        print('ok', iso, len(svg) // 1024, 'KB')
    with open(credits_path, 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(credits.items())), f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()

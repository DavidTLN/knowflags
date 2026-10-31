"""Collect historical flags of every country from Wikipedia EN, FR and the country's own language.

Runs on GitHub Actions (Wikipedia/Commons are not reachable from every sandbox).
For each country: Wikidata gives the "flag of X" item (P163) and its sitelinks; the
"Flag of X" article is read in en, fr and the native wiki, plus the English
"List of ... flags" article when the Flag article links to it. Every file
referenced in a gallery, a table row or a thumbnail is recorded with the
section it sits in and the caption / row text around it.

Output:
  data/history/raw/{iso}.json        all candidates (wiki, page, section, file, text)
  data/history/files.json            Commons metadata of every referenced file
  data/history/candidates.txt        compact review list (historical sections only)
"""
import json
import os
import re
import sys
import time
import html

import mwparserfromhell
import requests

OUT = 'data/history'
UA = {'User-Agent': 'KnowFlagsBot/1.0 (https://knowflags.com; historical flags review)'}
S = requests.Session()
S.headers.update(UA)

NATIVE = dict(x.split(':') for x in '''ad:ca ae:ar af:fa ag:en al:sq am:hy ao:pt ar:es at:de au:en aw:nl ax:sv az:az ba:bs bb:en bd:bn
be:nl bf:fr bg:bg bh:ar bi:fr bj:fr bm:en bn:ms bo:es br:pt bs:en bt:en bw:en by:be bz:en ca:fr cd:fr cf:fr cg:fr ch:de
ci:fr cl:es cm:fr cn:zh co:es cr:es cu:es cv:pt cw:nl cy:el cz:cs de:de dj:fr dk:da dm:en do:es dz:ar ec:es ee:et eg:ar
er:ar es:es et:am fi:fi fj:en fk:en fm:en fo:fo fr:fr ga:fr gb:en gb-eng:en gb-nir:en gb-sct:en gb-wls:cy gd:en ge:ka
gg:en gh:en gi:en gl:da gm:en gn:fr gq:es gr:el gt:es gu:en gw:pt gy:en hk:zh hn:es hr:hr ht:fr hu:hu id:id ie:ga il:he
im:en in:hi iq:ar ir:fa is:is it:it je:en jm:en jo:ar jp:ja ke:sw kg:ky kh:km ki:en km:fr kn:en kp:ko kr:ko kw:ar ky:en
kz:kk la:lo lb:ar lc:en li:de lk:si lr:en ls:en lt:lt lu:lb lv:lv ly:ar ma:ar mc:fr md:ro me:sr mg:mg mh:en mk:mk ml:fr
mm:my mn:mn mo:zh mr:ar mt:mt mu:en mv:dv mw:en mx:es my:ms mz:pt na:en nc:fr ne:fr ng:en ni:es nl:nl no:no np:ne nr:en
nz:en om:ar pa:es pe:es pf:fr pg:en ph:tl pk:ur pl:pl pr:es ps:ar pt:pt pw:en py:es qa:ar ro:ro rs:sr ru:ru rw:rw sa:ar
sb:en sc:en sd:ar se:sv sg:en si:sl sk:sk sl:en sm:it sn:fr so:so sr:nl ss:en st:pt sv:es sx:nl sy:ar sz:en td:fr tg:fr
th:th tj:tg tl:pt tm:tk tn:ar to:en tr:tr tt:en tv:en tw:zh tz:sw ua:uk ug:en us:en uy:es uz:uz va:it vc:en ve:es vn:vi
vu:fr ws:en xk:sq ye:ar za:af zm:en zw:en'''.split())
EXTRA_QID = {'gb-eng': 'Q21', 'gb-sct': 'Q22', 'gb-wls': 'Q25', 'gb-nir': 'Q26', 'xk': 'Q1246'}
FILE_RE = re.compile(r'([^\|\[\]=\n{}<>:]+?\.(?:svg|png|jpe?g|gif))', re.I)
YEAR_RE = re.compile(r'(?<!\d)(1[0-9]{3}|20[0-2][0-9])(?!\d)')
HIST = re.compile(r'histor|former|evolution|évolution|ancien|chronolog|past|geschicht|historia|histór|storia|история|'
                  r'историј|історі|歴史|历史|歷史|역사|تاريخ|تاریخ|היסטור|dějin|histori|tarih|ιστορ|წარსულ|պատմ|'
                  r'zgodovin|povijest|istorij|istoric|történet|dzieje|geçmiş|sejarah|kasaysayan|lịch sử|ประวัติ', re.I)
EXCL = re.compile(r'standard|ensign|naval|navy|militar|army|air force|jack|propos|subdivision|region|province|state flags|'
                  r'sport|party|ethnic|organi[sz]ation|see also|similar|governor|presidential|royal standard|'
                  r'étendard|pavillon|marine|armée|propositions?|régions?|provinces?|voir aussi|'
                  r'flagge der bundesländer|dienstflagge|kriegsflagge|landesflagge', re.I)


def get(url, **params):
    for attempt in range(5):
        try:
            r = S.get(url, params=params, timeout=60)
            if r.status_code == 200:
                return r.json()
        except Exception:  # noqa: BLE001
            pass
        time.sleep(3 * (attempt + 1))
    return {}


def sparql(q):
    for attempt in range(4):
        r = S.get('https://query.wikidata.org/sparql', params={'query': q, 'format': 'json'}, timeout=120)
        if r.status_code == 200:
            return r.json()['results']['bindings']
        time.sleep(5 * (attempt + 1))
    r.raise_for_status()


def entities(ids, props='claims|sitelinks'):
    out = {}
    ids = list(ids)
    for i in range(0, len(ids), 40):
        j = get('https://www.wikidata.org/w/api.php', action='wbgetentities', ids='|'.join(ids[i:i + 40]),
                props=props, format='json')
        out.update(j.get('entities', {}))
    return out


def wikitext(wiki, title):
    j = get(f'https://{wiki}.wikipedia.org/w/api.php', action='query', prop='revisions', rvprop='content',
            rvslots='main', titles=title, redirects=1, format='json', formatversion=2)
    pages = j.get('query', {}).get('pages', [])
    if not pages or 'revisions' not in pages[0]:
        return None, None
    return pages[0]['title'], pages[0]['revisions'][0]['slots']['main']['content']


def plain(s):
    try:
        t = mwparserfromhell.parse(s).strip_code(normalize=True, collapse=True)
    except Exception:  # noqa: BLE001
        t = s
    t = re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'\b(?:thumb|vignette|miniatur|upright|left|right|center|gauche|droite|border|frameless|\d+px)\b\|?', ' ', t)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()


def norm_file(f):
    f = f.strip().replace('_', ' ')
    f = re.sub(r'^[^:]{2,20}:', '', f).strip()
    return (f[:1].upper() + f[1:]) if f else f


def sections(text):
    parts, title, buf = [], 'intro', []
    path = {}
    for line in text.split('\n'):
        m = re.match(r'^(={2,6})\s*(.*?)\s*\1\s*$', line)
        if m:
            parts.append((title, '\n'.join(buf)))
            level = len(m.group(1))
            path[level] = plain(m.group(2))
            for k in list(path):
                if k > level:
                    del path[k]
            title = ' > '.join(path[k] for k in sorted(path))
            buf = []
        else:
            buf.append(line)
    parts.append((title, '\n'.join(buf)))
    return parts


def extract(wiki, page, text):
    out = []
    for sec, body in sections(text):
        # galleries
        for g in re.findall(r'<gallery[^>]*>(.*?)</gallery>', body, re.S | re.I):
            for line in g.split('\n'):
                if '|' in line:
                    f, cap = line.split('|', 1)
                else:
                    f, cap = line, ''
                if FILE_RE.search(f):
                    out.append(dict(wiki=wiki, page=page, section=sec, file=norm_file(f), text=plain(cap)[:500], kind='gallery'))
        body_ng = re.sub(r'<gallery[^>]*>.*?</gallery>', '', body, flags=re.S | re.I)
        # table rows
        if '{|' in body_ng:
            for row in re.split(r'\n\|-', body_ng):
                files = [norm_file(x) for x in FILE_RE.findall(row)]
                if files:
                    t = plain(row)
                    for f in dict.fromkeys(files):
                        out.append(dict(wiki=wiki, page=page, section=sec, file=f, text=t[:600], kind='table'))
        # thumbnails outside tables
        try:
            code = mwparserfromhell.parse(re.sub(r'\{\|.*?\|\}', '', body_ng, flags=re.S))
            for link in code.filter_wikilinks():
                title = str(link.title)
                if FILE_RE.fullmatch(norm_file(title) or '') and ':' in title:
                    out.append(dict(wiki=wiki, page=page, section=sec, file=norm_file(title),
                                    text=plain(str(link.text or ''))[:500], kind='thumb'))
        except Exception:  # noqa: BLE001
            pass
    seen, res = set(), []
    for c in out:
        k = (c['wiki'], c['section'], c['file'], c['text'][:80])
        if c['file'] and k not in seen:
            seen.add(k)
            res.append(c)
    return res


def commons_meta(files):
    meta = {}
    files = sorted(files)
    for i in range(0, len(files), 25):
        titles = '|'.join('File:' + f for f in files[i:i + 25])
        j = get('https://commons.wikimedia.org/w/api.php', action='query', prop='imageinfo', titles=titles,
                iiprop='url|size|mime|extmetadata', iiextmetadatafilter='ImageDescription|LicenseShortName|Artist|DateTimeOriginal',
                iiextmetadatalanguage='en', format='json', formatversion=2, redirects=1)
        q = j.get('query', {})
        redir = {r['to']: r['from'] for r in q.get('redirects', [])}
        norm = {n['to']: n['from'] for n in q.get('normalized', [])}
        for p in q.get('pages', []):
            ii = (p.get('imageinfo') or [{}])[0]
            em = ii.get('extmetadata', {})
            t = p['title']
            src = norm.get(redir.get(t, t), redir.get(t, t))
            meta[src[5:]] = dict(title=t, missing='missing' in p and not ii, url=ii.get('url'), mime=ii.get('mime'),
                                 size=ii.get('size'), width=ii.get('width'), height=ii.get('height'),
                                 license=em.get('LicenseShortName', {}).get('value'),
                                 artist=plain(em.get('Artist', {}).get('value', '') or '')[:120],
                                 desc=plain(em.get('ImageDescription', {}).get('value', '') or '')[:400])
        time.sleep(0.2)
    return meta


def main():
    only = sys.argv[1:]
    os.makedirs(f'{OUT}/raw', exist_ok=True)
    rows = sparql('SELECT ?c ?iso WHERE { ?c wdt:P297 ?iso . ?c wdt:P31/wdt:P279* wd:Q6256 }')
    rows += sparql('SELECT ?c ?iso WHERE { ?c wdt:P297 ?iso . FILTER NOT EXISTS { ?c wdt:P576 [] } }')
    qids = {}
    for b in rows:
        iso = b['iso']['value'].lower()
        qids.setdefault(iso, b['c']['value'].rsplit('/', 1)[-1])
    qids.update(EXTRA_QID)
    isos = [i for i in NATIVE if not only or i in only]
    countries = entities([qids[i] for i in isos if i in qids])
    flag_items = {}
    for iso in isos:
        e = countries.get(qids.get(iso, ''), {})
        cl = e.get('claims', {}).get('P163', [])
        best = [c for c in cl if c.get('rank') == 'preferred'] or [c for c in cl if 'P582' not in c.get('qualifiers', {})] or cl
        if best:
            try:
                flag_items[iso] = best[0]['mainsnak']['datavalue']['value']['id']
            except KeyError:
                pass
    flags = entities(set(flag_items.values()), props='sitelinks')
    allfiles = set()
    lines = []
    for iso in isos:
        sl = flags.get(flag_items.get(iso, ''), {}).get('sitelinks', {})
        cands, pages = [], []
        for wiki in dict.fromkeys(['en', 'fr', NATIVE[iso]]):
            t = sl.get(f'{wiki}wiki', {}).get('title')
            if not t:
                continue
            title, text = wikitext(wiki, t)
            if not text:
                continue
            pages.append(f'{wiki}:{title}')
            cands += extract(wiki, title, text)
            if wiki == 'en':
                for lst in dict.fromkeys(re.findall(r'\[\[(List of [^\]\|#]*flags[^\]\|#]*)', text))[:2]:
                    lt, ltext = wikitext('en', lst)
                    if ltext:
                        pages.append(f'en:{lt}')
                        cands += extract('en', lt, ltext)
            time.sleep(0.3)
        json.dump(dict(iso=iso, flag_item=flag_items.get(iso), pages=pages, candidates=cands),
                  open(f'{OUT}/raw/{iso}.json', 'w'), ensure_ascii=False, indent=1)
        allfiles |= {c['file'] for c in cands}
        print(iso, len(pages), 'pages', len(cands), 'candidates', flush=True)
    meta = commons_meta(allfiles)
    json.dump(meta, open(f'{OUT}/files.json', 'w'), ensure_ascii=False, indent=1)
    # compact review list
    for iso in isos:
        d = json.load(open(f'{OUT}/raw/{iso}.json'))
        by = {}
        for c in d['candidates']:
            sec = c['section']
            hist = HIST.search(sec) or HIST.search(c['page'] or '')
            years = YEAR_RE.findall(c['file'] + ' ' + c['text'])
            if EXCL.search(sec) and not HIST.search(sec):
                continue
            if not (hist or years):
                continue
            by.setdefault(c['file'], []).append(c)
        lines.append(f'### {iso}  pages: {", ".join(d["pages"])}')
        for f, cs in by.items():
            m = meta.get(f, {})
            if m.get('missing') or not m.get('url'):
                continue
            yrs = sorted(set(YEAR_RE.findall(f + ' ' + ' '.join(c['text'] for c in cs))))
            lines.append(f'- {f}  [{",".join(yrs[:6])}] {m.get("mime","")[6:]} {m.get("size") or 0 // 1}')
            for c in cs[:3]:
                lines.append(f'    {c["wiki"]}|{c["section"][:50]}| {c["text"][:220]}')
            if m.get('desc'):
                lines.append(f'    commons| {m["desc"][:220]}')
    open(f'{OUT}/candidates.txt', 'w').write('\n'.join(lines) + '\n')
    print('files', len(meta))


if __name__ == '__main__':
    main()

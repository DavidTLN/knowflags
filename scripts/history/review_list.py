"""Build compact per-country review lists from the Wikipedia crawl.

data/history/raw/{iso}.json -> data/history/review/{iso}.txt
One line per flag file found in a historical / national-flag section of the
en, fr or native "Flag of" articles (and the English "List of ... flags"),
with the years found and the most useful caption.
"""
import json
import os
import re
import sys

YEAR = re.compile(r'(?<!\d)(1[0-9]{3}|20[0-2][0-9])(?!\d)')
FLAGWORD = re.compile(r'flag|drapeau|flagge|bandera|bandiera|bandeira|vlag|flaga|vlajka|zastava|lippu|флаг|прапор|знам|'
                      r'ensign|banner|pavillon|standard|bayra|bendera|watawat|國旗|国旗|旗|깃발|기|علم|پرچم|דגל|σημαία|'
                      r'დროშ|դրոշ|zászló|vėliava|karogs|lipp|flamuri|steag|zastavа', re.I)
EXCL = re.compile(r'politic|house flag|yacht|militar|navy|naval|army|air force|standard|sport|scout|ethnic|unofficial|'
                  r'propos|civil ensign|state ensign|jack|part(y|ies)|religio|presidential|government|police|customs|'
                  r'organi[sz]ation|compan|subnational|provinc|count(y|ies)|municip|cities|city|district|similar|'
                  r'see also|vexillolog|colou?rs?|symbol|design|construction|protocol|etiquette|usage|'
                  r'pavillon|étendard|militaire|marine|partis?\b|région|sportif|similaire|couleurs|symboli|'
                  r'kriegs|dienst|bundesl|partei|bundeswehr|wappen|coat of arms|emblem|anthem|hymne|'
                  r'regional|states? of|territor|dependenc|overseas|autonomous|ethnic', re.I)


TEXT_EXCL = re.compile(r'standard|ensign|propos|company|compagnie|gesellschaft|\bparty\b|parti\b|possible rendition|regiment|'
                       r'\bnavy\b|naval|\bwar flag|merchant|civil flag|jack|governor|gouverneur|presidential|présidentiel|'
                       r'yacht|rebel|insurg|militia|army\b|armée|guerre|kriegs|handels|dienst|standarte|étendard|pavillon|'
                       r'unofficial|non officiel|reconstruction|hypothetical|fictional|fantasy', re.I)
FILE_EXCL = re.compile(r'standard|ensign|jack|propos|naval|war flag|merchant|civil|party|company|army|navy|governor|'
                       r'presidential|yacht|coat of arms|emblem|seal|map|roundel|cockade|pennant|guidon|kriegs|handels|'
                       r'dienst|standarte|pavillon|étendard', re.I)


def main():
    os.makedirs('data/history/review', exist_ok=True)
    meta = json.load(open('data/history/files.json'))
    isos = sys.argv[1:] or sorted(os.path.splitext(f)[0] for f in os.listdir('data/history/raw'))
    total = 0
    for iso in isos:
        d = json.load(open(f'data/history/raw/{iso}.json'))
        by = {}
        for c in d['candidates']:
            f = c['file']
            if not FLAGWORD.search(f) or f.lower().endswith(('.jpg', '.jpeg', '.gif')):
                continue
            if EXCL.search(c['section']):
                continue
            m = meta.get(f) or {}
            if m.get('missing') or not m.get('url'):
                continue
            by.setdefault(f, []).append(c)
        lines = [f'### {iso}  ({", ".join(d["pages"])})']
        rows = []
        for f, cs in by.items():
            yrs = sorted(set(YEAR.findall(f + ' ' + ' '.join(c['text'] for c in cs))))
            if not yrs:
                continue
            ftxt = ' '.join(c['text'] for c in cs)
            if FILE_EXCL.search(f) or (ftxt and all(TEXT_EXCL.search(c['text']) for c in cs if c['text'])):
                continue
            # best texts: one per wiki, the longest informative one
            texts = {}
            for c in cs:
                t = c['text'].strip(' |')
                if len(t) > len(texts.get(c['wiki'], '')):
                    texts[c['wiki']] = t
            secs = sorted({c['wiki'] + ':' + c['section'][:40] for c in cs})
            m = meta[f]
            kind = 'svg' if m.get('mime') == 'image/svg+xml' else 'png'
            rows.append((int(yrs[0]), f, yrs, kind, secs, texts))
        rows.sort()
        for y, f, yrs, kind, secs, texts in rows:
            lines.append(f'- {f} [{",".join(yrs[:6])}] {kind} {"; ".join(secs)[:90]}')
            for w, t in texts.items():
                lines.append(f'    {w}: {t[:200]}')
        open(f'data/history/review/{iso}.txt', 'w').write('\n'.join(lines) + '\n')
        total += len(rows)
    print('files kept', total)


if __name__ == '__main__':
    main()

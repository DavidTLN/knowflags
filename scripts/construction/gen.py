"""Generate KnowFlags construction sheets.

Usage:
    python3 scripts/construction/gen.py <flag-svg-dir> [iso ...]

<flag-svg-dir> holds true-ratio flag SVGs named {iso}.svg (e.g. a clone of
github.com/hampusborgos/country-flags/svg, which mirrors Wikimedia Commons).
The flag artwork is embedded as-is; this script only adds the construction
layer (dimension arrows, centre-line guides, ISO and ratio tags) from the
specs in specs.py. Output: public/flags/construction/{iso}-construction-{fr,en}.svg

Style: viewBox only, #FAFAF9 background, #111 outline, #2540E8 double arrows,
#444 dash-dot guides (10 6 3 6), [ISO] bottom-left and [H:W] bottom-right in #0A8A0A.
"""
import os
import re
import sys
from fractions import Fraction

from lxml import etree

sys.path.insert(0, os.path.dirname(__file__))
from specs import SPECS  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'flags', 'construction')
SVG_NS = 'http://www.w3.org/2000/svg'
BLUE, GUIDE, GREEN = '#2540E8', '#444', '#0A8A0A'
M = 150            # margin around the flag
MAX_W, MAX_H = 1716, 1092
FS = 46            # dimension font size


LOC = 'en'


def fmt(v):
    if isinstance(v, dict):
        return v[LOC]
    if isinstance(v, str):
        return v
    f = Fraction(v).limit_denominator(1000)
    if f.denominator == 1:
        return str(f.numerator)
    r = round(float(v), 2)
    return ('%g' % r)


def arrow_h(x1, x2, y, label, halo=False, small=False):
    a = 14 if x2 - x1 > 40 else max(4, (x2 - x1) / 3)
    ty = y - 14
    txt = label_text((x1 + x2) / 2, ty, label, halo, size=FS if not small else 36)
    return (f'<g stroke="{BLUE}" stroke-width="2.5" fill="{BLUE}">'
            f'<line x1="{x1:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y:.1f}"/>'
            f'<polygon points="{x1:.1f},{y:.1f} {x1+a:.1f},{y-7:.1f} {x1+a:.1f},{y+7:.1f}"/>'
            f'<polygon points="{x2:.1f},{y:.1f} {x2-a:.1f},{y-7:.1f} {x2-a:.1f},{y+7:.1f}"/>'
            f'{txt}</g>')


def arrow_v(y1, y2, x, label, halo=False, small=False):
    a = 14 if y2 - y1 > 40 else max(4, (y2 - y1) / 3)
    cy = (y1 + y2) / 2
    tx = x - 16
    size = FS if not small else 36
    t = label_text(tx, cy, label, halo, size=size, rot=True)
    return (f'<g stroke="{BLUE}" stroke-width="2.5" fill="{BLUE}">'
            f'<line x1="{x:.1f}" y1="{y1:.1f}" x2="{x:.1f}" y2="{y2:.1f}"/>'
            f'<polygon points="{x:.1f},{y1:.1f} {x-7:.1f},{y1+a:.1f} {x+7:.1f},{y1+a:.1f}"/>'
            f'<polygon points="{x:.1f},{y2:.1f} {x-7:.1f},{y2-a:.1f} {x+7:.1f},{y2-a:.1f}"/>'
            f'{t}</g>')


def label_text(x, y, label, halo, size=FS, rot=False):
    tr = f' transform="rotate(-90 {x:.1f} {y:.1f})"' if rot else ''
    body = escape(fmt(label))
    base = f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="middle"{tr}'
    out = ''
    if halo:  # separate halo text underneath (paint-order is not supported everywhere)
        out = f'{base} fill="#FAFAF9" stroke="#FAFAF9" stroke-width="10" stroke-linejoin="round">{body}</text>'
    return out + f'{base} stroke="none">{body}</text>'


def escape(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def guide(x1, y1, x2, y2):
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{GUIDE}" '
            f'stroke-width="1.5" stroke-dasharray="10 6 3 6" opacity="0.75"/>')


def chain_h(xs, labels, y, X):
    out = []
    for i in range(len(xs) - 1):
        a, b = X(xs[i]), X(xs[i + 1])
        lab = labels[i] if labels else xs[i + 1] - xs[i]
        if lab is None:
            continue
        small = b - a < 80
        out.append(arrow_h(a, b, y, lab, small=small))
    return out


def chain_v(ys, labels, x, Y):
    out = []
    for i in range(len(ys) - 1):
        a, b = Y(ys[i]), Y(ys[i + 1])
        lab = labels[i] if labels else ys[i + 1] - ys[i]
        if lab is None:
            continue
        small = b - a < 80
        out.append(arrow_v(a, b, x, lab, small=small))
    return out


def embed_flag(path, x, y, w, h):
    root = etree.parse(path).getroot()
    vb = root.get('viewBox')
    if not vb:
        vb = '0 0 %s %s' % (re.sub(r'[^\d.]', '', root.get('width')), re.sub(r'[^\d.]', '', root.get('height')))
    for a in ('width', 'height', 'x', 'y', 'preserveAspectRatio'):
        if a in root.attrib:
            del root.attrib[a]
    root.set('viewBox', vb)
    root.set('x', '%.1f' % x)
    root.set('y', '%.1f' % y)
    root.set('width', '%.1f' % w)
    root.set('height', '%.1f' % h)
    root.set('preserveAspectRatio', 'none')
    s = etree.tostring(root, encoding='unicode')
    s = re.sub(r'\s+xmlns="http://www.w3.org/2000/svg"', '', s, count=1)
    vw, vh = [float(v) for v in vb.split()[2:4]]
    return s, vw / vh


def build(iso, spec, src_dir):
    W, H = spec['W'], spec['H']
    s = min(MAX_W / W, MAX_H / H)
    fw, fh = W * s, H * s
    X = lambda u: M + u * s  # noqa: E731
    Y = lambda u: M + u * s  # noqa: E731
    cw, ch = fw + 2 * M, fh + 2 * M + 90
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
             f'viewBox="0 0 {cw:.0f} {ch:.0f}" font-family="Arial, Helvetica, sans-serif">',
             f'<rect width="{cw:.0f}" height="{ch:.0f}" fill="#FAFAF9"/>']
    flag, file_ratio = embed_flag(os.path.join(src_dir, spec.get('src', iso) + '.svg'), M, M, fw, fh)
    if abs(file_ratio - W / H) / (W / H) > 0.02:
        print(f'  ! {iso}: artwork ratio {file_ratio:.3f} vs spec {W/H:.3f}')
    parts.append(flag)
    parts.append(f'<rect x="{M}" y="{M}" width="{fw:.1f}" height="{fh:.1f}" fill="none" stroke="#111" stroke-width="3.5"/>')

    # guides: chain breakpoints + centre lines + explicit
    gx = set(spec.get('x', [])[1:-1]) | set(spec.get('gx', []))
    gy = set(spec.get('y', [])[1:-1]) | set(spec.get('gy', []))
    if spec.get('centre', True):
        gx.add(W / 2)
        gy.add(H / 2)
    for v in sorted(gx):
        parts.append(guide(X(v), M, X(v), M + fh))
    for v in sorted(gy):
        parts.append(guide(M, Y(v), M + fw, Y(v)))
    for (cx, cy, r) in spec.get('circles', []):
        parts.append(f'<circle cx="{X(cx):.1f}" cy="{Y(cy):.1f}" r="{r*s:.1f}" fill="none" stroke="{GUIDE}" '
                     f'stroke-width="1.5" stroke-dasharray="10 6 3 6" opacity="0.85"/>')
    for (x1, y1, x2, y2) in spec.get('lines', []):
        parts.append(guide(X(x1), Y(y1), X(x2), Y(y2)))

    # outer chains
    if len(spec.get('x', [])) > 2:
        parts += chain_h(spec['x'], spec.get('xl'), M - 70, X)
    if len(spec.get('y', [])) > 2:
        parts += chain_v(spec['y'], spec.get('yl'), M - 70, Y)
    parts.append(arrow_h(M, M + fw, M + fh + 70, spec.get('wl', W)))
    parts.append(arrow_v(M, M + fh, M + fw + 70, spec.get('hl', H)))

    # internal dimensions
    for d in spec.get('dims', []):
        kind, a, b, at, lab = d
        if kind == 'h':
            parts.append(arrow_h(X(a), X(b), Y(at), lab, halo=True, small=(b - a) * s < 80))
        else:
            parts.append(arrow_v(Y(a), Y(b), X(at), lab, halo=True, small=(b - a) * s < 80))

    for (tx, tyy, txt) in spec.get('texts', []):
        parts.append(label_text(X(tx), Y(tyy), txt, True, size=40).replace('stroke="none"', f'stroke="none" fill="{BLUE}"'))

    ty = M + fh + 70 + 115
    parts.append(f'<text x="{M - 70}" y="{ty:.0f}" font-size="42" font-weight="700" fill="{GREEN}">[{iso.upper()}]</text>')
    parts.append(f'<text x="{M + fw + 70:.0f}" y="{ty:.0f}" font-size="42" font-weight="700" fill="{GREEN}" '
                 f'text-anchor="end">[{spec["tag"]}]</text>')
    parts.append('</svg>')
    return '\n'.join(parts) + '\n'


def main():
    src = sys.argv[1]
    only = sys.argv[2:]
    os.makedirs(OUT, exist_ok=True)
    for iso, spec in SPECS.items():
        if only and iso not in only:
            continue
        global LOC
        for loc in ('fr', 'en'):
            LOC = loc
            svg = build(iso, spec, src)
            with open(os.path.join(OUT, f'{iso}-construction-{loc}.svg'), 'w', encoding='utf-8') as f:
                f.write(svg)
        print('ok', iso)


if __name__ == '__main__':
    main()

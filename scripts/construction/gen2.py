"""KnowFlags construction sheets, v2 (detailed).

Usage:
    python3 scripts/construction/gen2.py <flag-svg-dir> [iso ...]

Draws the sheets listed in specs2.py, in the same visual language as the
Wikimedia Commons series the other sheets come from: the flag is shown at half
opacity so the construction reads on top of it, dashed centre and construction
guides, blue double-arrow dimensions with the value set in a gap of the line,
[ISO] bottom-left and [H:W] bottom-right in green.

Flag units, origin at the top-left corner of the flag, x to the fly, y down.
Spec keys (all optional except W, H, tag):
  top / left            breakpoints of the outer chains (above / left of the flag)
  bottom / right        extra outer chains (below / right, inside the totals)
  top_l, left_l, ...    labels for the chain segments (None hides one)
  wl / hl               labels of the overall width / height
  h   [(x1, x2, y, label)]           internal horizontal dimension
  v   [(y1, y2, x, label)]           internal vertical dimension
  a   [(x1, y1, x2, y2, label)]      aligned dimension between two points
  ext [(x1, y1, x2, y2)]             thin extension line
  circles [(cx, cy, r)], boxes [(x, y, w, h)], lines [(x1, y1, x2, y2)]
  gx / gy               extra full-height / full-width guides
  marks [(x, y)]        centre crosses
  arcs  [(cx, cy, r, a1, a2, label)] angle (degrees, 0 = towards the fly, clockwise)
  notes [(x, y, text)]  free text (formulas), left aligned, inside the flag
  centre                draw the two centre lines (default True)
"""
import math
import os
import re
import sys
from fractions import Fraction

from lxml import etree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from specs2 import SPECS  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, 'artwork')
OUT = os.path.join(HERE, '..', '..', 'public', 'flags', 'construction')
BLUE, GUIDE, GREEN, INK = '#2540E8', '#444', '#0A8A0A', '#111'
M = 170
MAX_W, MAX_H = 1600, 1000
FS = 40
LOC = 'en'


def fmt(v):
    if v is None:
        return ''
    if isinstance(v, dict):
        return v[LOC]
    if isinstance(v, str):
        return re.sub(r'(?<=\d)\.(?=\d)', ',', v) if LOC == 'fr' else v
    f = Fraction(v).limit_denominator(1000)
    if f.denominator == 1:
        return str(f.numerator)
    whole, rest = divmod(f.numerator, f.denominator)
    vulgar = {Fraction(1, 2): '½', Fraction(1, 4): '¼', Fraction(3, 4): '¾', Fraction(1, 3): '⅓', Fraction(2, 3): '⅔'}
    fr_ = Fraction(rest, f.denominator)
    if fr_ in vulgar:
        return (str(whole) if whole else '') + vulgar[fr_]
    s = ('%.3f' % float(v)).rstrip('0').rstrip('.')
    return s.replace('.', ',') if LOC == 'fr' else s


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def text_w(s, size):
    return sum(0.33 if c in '.,:;1il|½¼¾⅓⅔' else 0.62 for c in s) * size


class Sheet:
    def __init__(self, spec):
        self.spec = spec
        W, H = spec['W'], spec['H']
        self.s = min(MAX_W / W, MAX_H / H)
        self.fw, self.fh = W * self.s, H * self.s
        self.parts = []

    def X(self, u):
        return M + u * self.s

    def Y(self, u):
        return M + u * self.s

    # primitives --------------------------------------------------------------
    def guide(self, x1, y1, x2, y2, op=0.55):
        self.parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{GUIDE}" '
                          f'stroke-width="1.6" stroke-dasharray="10 6 3 6" opacity="{op}"/>')

    def thin(self, x1, y1, x2, y2):
        self.parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{INK}" '
                          f'stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>')

    def dim(self, x1, y1, x2, y2, label, size=FS, side=-1):
        """Double arrow from (x1,y1) to (x2,y2), label centred in a gap of the line."""
        lab = fmt(label)
        L = math.hypot(x2 - x1, y2 - y1)
        if L < 1:
            return
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        ang = math.degrees(math.atan2(uy, ux))
        if ang > 89.99 or ang < -90.01:
            ang -= 180 if ang > 0 else -180
        if L < 70:
            size = min(size, 30)
        tw = text_w(lab, size) + 16 if lab else 0
        a = min(16, L / 3)
        out = [f'<g stroke="{BLUE}" fill="{BLUE}" stroke-width="2">']
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        outside = lab and tw > L - 2 * a - 6
        if lab and not outside:
            g = tw / 2
            out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{mx - ux * g:.1f}" y2="{my - uy * g:.1f}"/>')
            out.append(f'<line x1="{mx + ux * g:.1f}" y1="{my + uy * g:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"/>')
        else:
            out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"/>')
        for (px, py, dx, dy) in ((x1, y1, ux, uy), (x2, y2, -ux, -uy)):
            nx, ny = -dy, dx
            out.append(f'<polygon stroke="none" points="{px:.1f},{py:.1f} {px + dx * a + nx * 6:.1f},{py + dy * a + ny * 6:.1f} '
                       f'{px + dx * a - nx * 6:.1f},{py + dy * a - ny * 6:.1f}"/>')
        out.append('</g>')
        if lab:
            if outside:  # label beside the line when the span is too short, kept horizontal
                if abs(ux) >= abs(uy):
                    my += side * size * 0.8
                else:
                    mx += side * (tw / 2 + 2)
                ang = 0
            tx, ty = mx, my + size * 0.35
            out.append(f'<text x="{tx:.1f}" y="{ty:.1f}" font-size="{size}" text-anchor="middle" fill="{INK}" '
                       f'transform="rotate({ang:.2f} {mx:.1f} {my:.1f})">{esc(lab)}</text>')
        self.parts.append(''.join(out))

    # sheet -------------------------------------------------------------------
    def build(self, iso, src_dir):
        sp, s = self.spec, self.s
        W, H = sp['W'], sp['H']
        X, Y = self.X, self.Y
        fw, fh = self.fw, self.fh
        has_r = bool(sp.get('right'))
        has_b = bool(sp.get('bottom'))
        cw = fw + 2 * M + (80 if has_r else 0)
        ch = fh + 2 * M + 70 + (80 if has_b else 0)
        P = self.parts
        P.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw:.0f} {ch:.0f}" '
                 f'font-family="Calibri, Arial, \'Liberation Sans\', Helvetica, sans-serif">')
        P.append(f'<rect width="{cw:.0f}" height="{ch:.0f}" fill="#FAFAF9"/>')
        P.append(f'<rect x="{M}" y="{M}" width="{fw:.1f}" height="{fh:.1f}" fill="#fff"/>')
        name = sp.get('src', iso) + '.svg'
        local = os.path.join(ART, name)
        path = local if os.path.exists(local) else os.path.join(src_dir, name)
        P.append(f'<g opacity="{sp.get("opacity", 0.5)}">{embed(path, M, M, fw, fh)}</g>')

        gx = set(sp.get('top', [])[1:-1]) | set(sp.get('gx', [])) | set(sp.get('bottom', [])[1:-1])
        gy = set(sp.get('left', [])[1:-1]) | set(sp.get('gy', [])) | set(sp.get('right', [])[1:-1])
        if sp.get('centre', True):
            gx.add(W / 2)
            gy.add(H / 2)
        for v in sorted(gx):
            self.guide(X(v), M - (95 if v in sp.get('top', []) else 0), X(v), M + fh + (95 if v in sp.get('bottom', []) else 0))
        for v in sorted(gy):
            self.guide(M - (95 if v in sp.get('left', []) else 0), Y(v), M + fw + (95 if v in sp.get('right', []) else 0), Y(v))
        for (x1, y1, x2, y2) in sp.get('lines', []):
            self.guide(X(x1), Y(y1), X(x2), Y(y2))
        for (cx, cy, r) in sp.get('circles', []):
            P.append(f'<circle cx="{X(cx):.1f}" cy="{Y(cy):.1f}" r="{r * s:.1f}" fill="none" stroke="{BLUE}" '
                     f'stroke-width="1.6" stroke-dasharray="8 6" opacity="0.7"/>')
        for (bx, by, bw, bh) in sp.get('boxes', []):
            P.append(f'<rect x="{X(bx):.1f}" y="{Y(by):.1f}" width="{bw * s:.1f}" height="{bh * s:.1f}" fill="none" '
                     f'stroke="{INK}" stroke-width="1.4" stroke-dasharray="6 5" opacity="0.65"/>')
        for (x1, y1, x2, y2) in sp.get('ext', []):
            self.thin(X(x1), Y(y1), X(x2), Y(y2))
        P.append(f'<rect x="{M}" y="{M}" width="{fw:.1f}" height="{fh:.1f}" fill="none" stroke="{INK}" stroke-width="3.5"/>')
        for (mx, my) in sp.get('marks', []):
            P.append(f'<path d="M{X(mx) - 9:.1f} {Y(my):.1f}h18M{X(mx):.1f} {Y(my) - 9:.1f}v18" stroke="{INK}" stroke-width="2"/>')

        def chain(pts, labels, fixed, horiz, side):
            for i in range(len(pts) - 1):
                lab = labels[i] if labels else pts[i + 1] - pts[i]
                if lab is None:
                    continue
                if horiz:
                    self.dim(X(pts[i]), fixed, X(pts[i + 1]), fixed, lab, side=side)
                else:
                    self.dim(fixed, Y(pts[i]), fixed, Y(pts[i + 1]), lab, side=side)

        if len(sp.get('top', [])) > 2:
            chain(sp['top'], sp.get('top_l'), M - 60, True, -1)
        if len(sp.get('left', [])) > 2:
            chain(sp['left'], sp.get('left_l'), M - 60, False, -1)
        if has_b:
            chain(sp['bottom'], sp.get('bottom_l'), M + fh + 60, True, 1)
        if has_r:
            chain(sp['right'], sp.get('right_l'), M + fw + 60, False, 1)
        self.dim(M, M + fh + (140 if has_b else 60), M + fw, M + fh + (140 if has_b else 60), sp.get('wl', W))
        self.dim(M + fw + (140 if has_r else 60), M, M + fw + (140 if has_r else 60), M + fh, sp.get('hl', H))

        for (x1, x2, y, lab) in sp.get('h', []):
            self.dim(X(x1), Y(y), X(x2), Y(y), lab)
        for (y1, y2, x, lab) in sp.get('v', []):
            self.dim(X(x), Y(y1), X(x), Y(y2), lab)
        for (x1, y1, x2, y2, lab) in sp.get('a', []):
            self.dim(X(x1), Y(y1), X(x2), Y(y2), lab)
        for (cx, cy, r, a1, a2, lab) in sp.get('arcs', []):
            R = r * s
            p1 = (X(cx) + R * math.cos(math.radians(a1)), Y(cy) + R * math.sin(math.radians(a1)))
            p2 = (X(cx) + R * math.cos(math.radians(a2)), Y(cy) + R * math.sin(math.radians(a2)))
            large = 1 if abs(a2 - a1) > 180 else 0
            sweep = 1 if a2 > a1 else 0
            P.append(f'<path d="M{p1[0]:.1f} {p1[1]:.1f}A{R:.1f} {R:.1f} 0 {large} {sweep} {p2[0]:.1f} {p2[1]:.1f}" '
                     f'fill="none" stroke="{BLUE}" stroke-width="2"/>')
            am = math.radians((a1 + a2) / 2)
            tx, ty = X(cx) + (R + 34) * math.cos(am), Y(cy) + (R + 34) * math.sin(am) + 12
            P.append(f'<text x="{tx:.1f}" y="{ty:.1f}" font-size="34" text-anchor="middle" fill="{INK}">{esc(fmt(lab))}</text>')
        for (tx, ty, txt) in sp.get('notes', []):
            lines = fmt(txt).split('\n')
            for k, line in enumerate(lines):
                yy = Y(ty) - (len(lines) - 1 - k) * 40
                P.append(f'<text x="{X(tx):.1f}" y="{yy:.1f}" font-size="34" fill="{INK}">{esc(line)}</text>')

        tyy = ch - 26
        P.append(f'<text x="{M - 60}" y="{tyy:.0f}" font-size="40" font-weight="700" fill="{GREEN}">[{iso.split("-")[0].upper() if "-" not in iso else iso.upper()}]</text>')
        P.append(f'<text x="{cw - 30:.0f}" y="{tyy:.0f}" font-size="40" font-weight="700" fill="{GREEN}" text-anchor="end">[{sp["tag"]}]</text>')
        P.append('</svg>')
        return '\n'.join(P) + '\n'


def embed(path, x, y, w, h):
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
    return re.sub(r'\s+xmlns="http://www.w3.org/2000/svg"', '', s, count=1)


def main():
    global LOC
    src = sys.argv[1]
    only = sys.argv[2:]
    for iso, spec in SPECS.items():
        if only and iso not in only:
            continue
        for loc in ('fr', 'en'):
            LOC = loc
            svg = Sheet(spec).build(iso, src)
            with open(os.path.join(OUT, f'{iso}-construction-{loc}.svg'), 'w', encoding='utf-8') as f:
                f.write(svg)
        print('ok', iso)


if __name__ == '__main__':
    main()

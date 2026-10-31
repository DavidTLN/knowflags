"""Bounding box of everything that is not the field colour inside a window.

Usage: python3 scripts/construction/bbox.py <flag-svg-dir> <iso> <W> <H> x0 y0 x1 y1
Window and result in flag units. The field colour is the most common colour
on the window's border.
"""
import io
import os
import sys

import cairosvg
import numpy as np
from PIL import Image

src, iso = sys.argv[1], sys.argv[2]
W, H, x0, y0, x1, y1 = map(float, sys.argv[3:9])
art = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artwork', iso + '.svg')
path = art if os.path.exists(art) else os.path.join(src, iso + '.svg')
PX = 3000
png = cairosvg.svg2png(url=path, output_width=PX, output_height=int(round(PX * H / W)))
im = np.array(Image.open(io.BytesIO(png)).convert('RGB')).astype(int)
u = W / im.shape[1]
a, b, c, d = int(x0 / u), int(y0 / u), int(x1 / u), int(y1 / u)
win = im[b:d, a:c]
border = np.concatenate([win[0], win[-1], win[:, 0], win[:, -1]])
keys = [tuple(p) for p in border]
bg = max(set(keys), key=keys.count)
bgs = [bg]
if len(sys.argv) > 9:  # treat every field colour (>4% of the flag) as background
    q = (im // 8) * 8
    flat = q.reshape(-1, 3)
    vals, cnt = np.unique(flat, axis=0, return_counts=True)
    bgs = [tuple(v) for v, c in zip(vals, cnt) if c > 0.04 * len(flat)]
diff = np.ones(win.shape[:2], bool)
for c_ in bgs:
    diff &= np.abs(win - np.array(c_)).sum(axis=2) > 60
from scipy import ndimage  # noqa: E402
diff = ndimage.binary_opening(diff, iterations=3)
ys, xs = np.nonzero(diff)
if len(xs) == 0:
    print('nothing')
    sys.exit()
bx0, bx1 = (xs.min() + a) * u, (xs.max() + 1 + a) * u
by0, by1 = (ys.min() + b) * u, (ys.max() + 1 + b) * u
print(f'{iso} bbox x={bx0:.3f} y={by0:.3f} w={bx1 - bx0:.3f} h={by1 - by0:.3f} cx={(bx0 + bx1) / 2:.3f} cy={(by0 + by1) / 2:.3f} bg={bg}')

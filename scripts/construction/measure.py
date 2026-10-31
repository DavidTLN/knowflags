"""Measure a flag artwork: bounding boxes of its colour regions, in flag units.

Usage: python3 scripts/construction/measure.py <flag-svg-dir> <iso> <W> <H> [min_area_ratio]

Renders the artwork at high resolution, splits it into connected regions of
uniform colour and prints each region's bounding box (x, y, w, h) and centre in
the flag's own construction units (W x H). Used to read off positions of stars,
discs and emblems when writing specs2.py; official values are preferred
whenever the flag law gives them.
"""
import io
import os
import sys

import cairosvg
import numpy as np
from PIL import Image
from scipy import ndimage

src, iso, W, H = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
min_ratio = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0004
art = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artwork', iso + '.svg')
path = art if os.path.exists(art) else os.path.join(src, iso + '.svg')
PX = 2400
png = cairosvg.svg2png(url=path, output_width=PX, output_height=int(PX * H / W))
im = np.array(Image.open(io.BytesIO(png)).convert('RGB')).astype(int)
h, w, _ = im.shape
q = (im // 24) * 24
keys = q[..., 0] * 65536 + q[..., 1] * 256 + q[..., 2]
vals, counts = np.unique(keys, return_counts=True)
u = W / w
out = []
for v, c in zip(vals, counts):
    if c < h * w * min_ratio:
        continue
    lab, n = ndimage.label(keys == v)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        area = (lab[sl] == i).sum()
        if area < h * w * min_ratio:
            continue
        y0, y1 = sl[0].start, sl[0].stop
        x0, x1 = sl[1].start, sl[1].stop
        col = '#%02x%02x%02x' % (v // 65536, (v // 256) % 256, v % 256)
        out.append((area, col, x0 * u, y0 * u, (x1 - x0) * u, (y1 - y0) * u))
out.sort(reverse=True)
print(f'{iso}: {W:g} x {H:g} units, {len(out)} regions')
for area, col, x, y, bw, bh in out[:40]:
    print(f'{col} area={area / (h * w) * 100:5.2f}%  x={x:7.3f} y={y:7.3f} w={bw:7.3f} h={bh:7.3f}  '
          f'cx={x + bw / 2:7.3f} cy={y + bh / 2:7.3f}')

"""Construction specs, one entry per ISO code (lowercase).

Units are the official construction units of each flag (W wide, H high).
  x / y      : breakpoints along the top / left edges (dimension chains + guides)
  xl / yl    : optional labels for the chain segments (None hides a segment)
  gx / gy    : extra vertical / horizontal guide positions
  circles    : (cx, cy, r) dashed guide circles
  lines      : (x1, y1, x2, y2) extra dashed guides
  dims       : ('h', x1, x2, y, label) or ('v', y1, y2, x, label) internal dimensions
  wl / hl    : label override for the total width / height
  tag        : ratio tag, height:width, as stored in countries.ratio
  src        : artwork file name if it differs from the ISO code
  centre     : add the two centre lines (default True)
  source     : where the measurements come from
"""


def S(W, H, tag, **kw):
    kw.update(W=W, H=H, tag=tag)
    return kw


SPECS = {}


def add(iso, spec):
    assert iso not in SPECS, iso
    SPECS[iso] = spec


# ── Batch 1 — plain stripes ──────────────────────────────────────────────────
add('fr', S(3, 2, '2:3', x=[0, 1, 2, 3], source='Constitution, art. 2; equal vertical thirds'))
add('it', S(3, 2, '2:3', x=[0, 1, 2, 3], source='Constitution, art. 12; equal vertical thirds'))
add('de', S(5, 3, '3:5', y=[0, 1, 2, 3], source='Federal flag decree 1950'))
add('ie', S(6, 3, '1:2', x=[0, 2, 4, 6], source='Constitution, art. 7; Department of the Taoiseach'))
add('be', S(15, 13, '13:15', x=[0, 5, 10, 15], source='Belgian Constitution, art. 193; 13:15 official in parliament use'))
add('nl', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Royal decree 1937'))
add('at', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Federal Constitutional Law, art. 8a'))
add('ng', S(6, 3, '1:2', x=[0, 2, 4, 6], source='Constitution of Nigeria'))
add('ru', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Federal Constitutional Law on the State Flag, 2000'))
add('lu', S(5, 3, '3:5', y=[0, 1, 2, 3], source='Law of 23 June 1972'))

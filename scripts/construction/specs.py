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

# ── Batch 2 — plain stripes ──────────────────────────────────────────────────
add('hu', S(6, 3, '1:2', y=[0, 1, 2, 3], source='Act CC of 2011 on national symbols: three equal stripes, ratio 1:2 (DB says 2:3)'))
add('ro', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Law 75/1994; equal vertical thirds'))
add('td', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Constitution of Chad, art. 8'))
add('ml', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Constitution of Mali'))
add('gn', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Constitution of Guinea'))
add('ci', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Constitution of Côte d\'Ivoire'))
add('bg', S(5, 3, '3:5', y=[0, 1, 2, 3], source='State Emblem Act; Constitution art. 166'))
add('lt', S(5, 3, '3:5', y=[0, 1, 2, 3], source='Law on the National Flag, 2004'))
add('ye', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Constitution of Yemen'))
add('sl', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Sierra Leone national flag; equal stripes'))

# ── Batch 3 — plain stripes ──────────────────────────────────────────────────
add('ga', S(4, 3, '3:4', y=[0, 1, 2, 3], source='Constitution of Gabon, art. 2'))
add('ua', S(3, 2, '2:3', y=[0, 1, 2], source='Constitution of Ukraine, art. 20'))
add('pl', S(8, 5, '5:8', y=[0, 2.5, 5], source='Act on the coat of arms, colours and anthem, 1980'))
add('mc', S(5, 4, '4:5', y=[0, 2, 4], source='Ordinance of 4 April 1881'))
add('id', S(3, 2, '2:3', y=[0, 1, 2], source='Law 24/2009'))
add('lv', S(20, 10, '1:2', y=[0, 4, 6, 10], source='Latvian State Flag Law; stripes 2:1:2'))
add('co', S(3, 2, '2:3', y=[0, 1, 1.5, 2], source='Decree 861 of 1924; yellow half the height'))
add('am', S(6, 3, '1:2', y=[0, 1, 2, 3], source='Law on the National Flag, 2006'))
add('mu', S(12, 8, '2:3', y=[0, 2, 4, 6, 8], source='Mauritius national flag; four equal stripes'))
add('gm', S(27, 18, '2:3', y=[0, 6, 7, 11, 12, 18], source='Gambia national flag specification 6:1:4:1:6'))

# ── Batch 4 — stripes with simple charges ────────────────────────────────────
add('bw', S(36, 24, '2:3', y=[0, 9, 10, 14, 15, 24], source='Botswana flag specification 9:1:4:1:9'))
add('th', S(9, 6, '2:3', y=[0, 1, 2, 4, 5, 6], source='Flag Act B.E. 2522 (1979); stripes 1:1:2:1:1'))
add('cr', S(10, 6, '3:5', y=[0, 1, 2, 4, 5, 6], source='Decree of 1906 / Law 7.879; stripes 1:1:2:1:1'))
add('eg', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Law 41 of 1984'))
add('iq', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Law 9 of 2008'))
add('sy', S(9, 6, '2:3', y=[0, 2, 4, 6], gx=[3, 6], source='Constitution of Syria; stars in the white stripe'))
add('es', S(6, 4, '2:3', y=[0, 1, 3, 4], gx=[2], dims=[('h', 0, 2, 3.5, '2')],
             source='Royal Decree 1511/1977: yellow twice each red; arms axis at half the height from the hoist'))
add('gr', S(27, 18, '2:3', x=[0, 10, 27], y=list(range(0, 19, 2)), gx=[4, 6], centre=False,
             dims=[('h', 4, 6, 9, '2')],
             source='Law 851/1978: nine stripes, canton five stripes square, cross one stripe wide'))
add('ar', S(24, 15, '5:8', y=[0, 5, 10, 15], source='Decree 10.302/1944; three equal stripes'))
add('bo', S(22, 15, '15:22', y=[0, 5, 10, 15], source='Supreme Decree 241/2004; three equal stripes'))

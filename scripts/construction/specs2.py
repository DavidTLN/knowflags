"""Detailed construction specs for gen2.py (flags without a usable Commons sheet).

Units are the flag's construction units, origin top-left. Values come from the
flag law or official manual named in `source`; where a law gives no figure
for an emblem, its box is measured on the official artwork and marked with ≈.
"""
SPECS = {}


def add(iso, **kw):
    assert iso not in SPECS, iso
    SPECS[iso] = kw


# Canada — National Flag of Canada Manufacturing Standards (leaf coordinates on a 1920 x 960 grid)
add('ca', W=1920, H=960, tag='1:2',
    top=[0, 480, 1440, 1920], bottom=[0, 480, 588, 1332, 1440, 1920], bottom_l=[None, 108, 744, 108, None],
    h=[(942, 978, 845, 36)],
    v=[(80, 886, 1380, 806), (0, 80, 1060, 80), (886, 960, 1060, 74)],
    boxes=[(588, 80, 744, 806)],
    source='Canadian Heritage, National Flag of Canada specifications: bands 1/4, leaf on a 1920 x 960 grid')


def approx(v):
    """Label for a value measured on the artwork (no figure in the flag law)."""
    r = round(v, 1)
    return '≈' + (('%g' % r))


def framed(x, y, w, h, W, H, measured=True, dec=1):
    """Outer chains locating a box (emblem, arms...) against the edges."""
    f = (lambda v: approx(v)) if measured else (lambda v: v)
    return dict(bottom=[0, x, x + w, W], bottom_l=[f(x), f(w), f(W - x - w)],
                right=[0, y, y + h, H], right_l=[f(y), f(h), f(H - y - h)],
                boxes=[(x, y, w, h)])


def merge(*ds, **kw):
    out = {}
    for d in ds + (kw,):
        for k, v in d.items():
            if k in out and isinstance(v, list):
                out[k] = out[k] + v
            else:
                out[k] = v
    return out


UJ_CANTON = dict(top=[0, 25, 27, 33, 35, 60, 120], left=[0, 10, 12, 18, 20, 30, 60], centre=False,
                 lines=[(0, 0, 60, 30), (0, 30, 60, 0)])


def ensign(iso, box, tag='1:2', source='', **kw):
    """British ensign 1:2 on a 120 x 60 grid: Union Flag canton 60 x 30, badge centred in the fly."""
    x, y, w, h = box
    add(iso, **merge(dict(W=120, H=60, tag=tag), UJ_CANTON, framed(x, y, w, h, 120, 60), dict(gx=[90], gy=[30]),
                     source=source, **kw))


# ── Batch A ──────────────────────────────────────────────────────────────────
add('af', **merge(dict(W=200, H=100, tag='1:2'), framed(33.6, 24.1, 132.8, 51.9, 200, 100),
                  source='Islamic Emirate flag (2021): white field, black Shahada centred; text block measured on the artwork'))
add('al', **merge(dict(W=70, H=50, tag='5:7'), framed(20.6, 9.4, 28.8, 31.2, 70, 50),
                  source='Law 8926/2002: ratio 5:7, double-headed eagle centred; eagle box measured on the artwork'))
add('ar', W=144, H=90, tag='5:8', left=[0, 30, 60, 90], circles=[(72, 45, 12.5), (72, 45, 4.86)],
    v=[(32.5, 57.5, 92, 25)], h=[(67.14, 76.86, 64, approx(9.7))],
    source='Decree 1650/2010: three equal stripes; Sun of May diameter 5/6 of the white stripe; face measured')
add('ax', W=26, H=17, tag='17:26', top=[0, 8, 9.5, 11.5, 13, 26], left=[0, 6, 7.5, 9.5, 11, 17], centre=False,
    source='Åland flag act 1991/2004: 8 + 1.5 + 2 + 1.5 + 13 by 6 + 1.5 + 2 + 1.5 + 6')
ensign('bm', (76.6, 12.7, 27.4, 34.6), source='Bermuda red ensign; arms box measured on the artwork')
add('bn', **merge(dict(W=200, H=100, tag='1:2'), framed(66.7, 32.5, 66.6, 46.8, 200, 100),
                  source='Brunei flag 1959: diagonal white and black bands, arms centred; arms box measured'))
add('bo', **merge(dict(W=220, H=150, tag='15:22', left=[0, 50, 100, 150]), framed(82.0, 53.8, 56.0, 44.3, 220, 150),
                  source='Supreme Decree 241/2004: three equal stripes; arms box measured on the state flag artwork'))
add('br', W=20, H=14, tag='7:10', top=[0, 1.7, 18.3, 20], left=[0, 1.7, 12.3, 14], circles=[(10, 7, 3.5)],
    h=[(6.5, 13.5, 10.9, 7)], marks=[(8, 14), (10, 7)],
    notes=[(0.6, 13.4, {'en': 'Band: arcs R 8 and 8.5 centred 2 M left of the base midpoint',
                        'fr': 'Bande : arcs R 8 et 8,5 centrés à 2 M à gauche du milieu de la base'})],
    source='Law 5.700/1971: 20 x 14 modules (M), rhombus 1.7 M from the edges, sphere radius 3.5 M, band arcs R 8 M and 8.5 M')
add('bt', **merge(dict(W=150, H=100, tag='2:3', lines=[(0, 100, 150, 0)]), framed(21.6, 20, 100.8, 70.2, 150, 100),
                  source='Bhutan national flag rules 1972: diagonal division, dragon along it; dragon box measured'))
add('bz', W=50, H=30, tag='3:5', left=[0, 3, 27, 30], circles=[(25, 15, 8.75)], h=[(16.25, 33.75, 25.5, approx(17.5))],
    source='Belize National Flag: red stripes 1/10 of the height; disc measured on the artwork')
add('cd', W=40, H=30, tag='3:4', lines=[(0, 30, 40, 0)], circles=[(7.3, 7.3, 5.45)],
    v=[(1.85, 12.75, 14.5, approx(10.9))], h=[(0, 7.3, 15, approx(7.3))], marks=[(7.3, 7.3)],
    source='Constitution of the DR Congo 2006, art. 1: sky blue, red diagonal band edged yellow, yellow star; star measured')
add('cm', W=9, H=6, tag='2:3', top=[0, 3, 6, 9], circles=[(4.5, 2.93, 0.795)], v=[(2.135, 3.725, 6.2, approx(1.6))], marks=[(4.5, 2.93)],
    source='Constitution of Cameroon, art. 1: three equal bands, star centred; star measured')
add('cy', **merge(dict(W=30, H=20, tag='2:3'), framed(7.85, 3.45, 16.4, 13.4, 30, 20),
                  source='Constitution of Cyprus, art. 4: copper island and olive branches on white; emblem box measured'))
add('dj', W=30, H=20, tag='2:3', top=[0, 17.32, 30], top_l=['10√3 ≈ 17.32', None], left=[0, 10, 20], lines=[(0, 0, 17.32, 10), (0, 20, 17.32, 10)],
    circles=[(6.63, 10, 2.75)], v=[(7.25, 12.75, 11, approx(5.5))], h=[(0, 6.63, 13.5, approx(6.6))], marks=[(6.63, 10)],
    source='Djibouti flag 1977: two equal stripes, equilateral white triangle; star measured')
add('do', W=45, H=30, tag='2:3', top=[0, 19.5, 25.5, 45], left=[0, 12, 18, 30], centre=False,
    boxes=[(19.53, 13.35, 5.9, 4.64)], h=[(19.53, 25.43, 19.2, approx(5.9))], v=[(13.35, 17.99, 27, approx(4.6))],
    source='Constitution of the Dominican Republic, art. 31: white cross 1/5 of the height, arms at the centre')
add('eg', **merge(dict(W=45, H=30, tag='2:3', left=[0, 10, 20, 30]), framed(19.0, 10.3, 7.0, 9.5, 45, 30),
                  source='Law 41 of 1984: three equal stripes, eagle of Saladin centred; eagle measured'))
add('et', W=60, H=30, tag='1:2', left=[0, 10, 20, 30], circles=[(30, 15, 10)], h=[(20, 40, 15, 20)],
    source='Proclamation 654/2009: three equal stripes, blue disc twice the stripe height')
ensign('fj', (77.6, 14.2, 24.7, 31.7), source='Fiji flag 1970: blue ensign with the shield of the arms; shield measured')
ensign('fk', (76.2, 11.7, 27.5, 36.6), source='Falkland Islands blue ensign; arms measured')
add('fm', W=190, H=100, tag='10:19', circles=[(95, 50, 31)], marks=[(64, 50), (126, 50), (95, 19), (95, 81)],
    h=[(64, 126, 50, approx(62)), (85.6, 104.4, 95, approx(18.8))], v=[(19, 50, 108, approx(31))],
    source='Flag of the Federated States of Micronesia 1978: four stars on a circle; positions measured')

# ── Batch B ──────────────────────────────────────────────────────────────────
add('gb-nir', **merge(dict(W=60, H=30, tag='1:2', top=[0, 27, 33, 60], left=[0, 12, 18, 30], centre=False),
                      framed(23.6, 2.2, 12.8, 20.2, 60, 30),
                      source='Ulster Banner (1953): red cross 1/5 of the height; crown and star measured'))
add('gb-wls', **merge(dict(W=50, H=30, tag='3:5', left=[0, 15, 30]), framed(4.8, 1.7, 39.9, 25.8, 50, 30),
                      source='Welsh flag: white over green in equal halves, red dragon; dragon box measured'))
add('gd', W=70, H=42, tag='3:5', top=[0, 6, 64, 70], left=[0, 6, 36, 42], bottom=[0, 21, 35, 49, 70],
    lines=[(6, 6, 64, 36), (6, 36, 64, 6)], circles=[(35, 21, 5)], h=[(30, 40, 28.5, approx(10))],
    marks=[(21, 3), (35, 3), (49, 3), (21, 39), (35, 39), (49, 39), (35, 21)], boxes=[(8.3, 17.15, 5.35, 7.35)],
    source='Grenada flag 1974: red border 1/7 of the height, stars centred on the border; disc and nutmeg measured')
add('gg', W=36, H=24, tag='2:3', top=[0, 15, 21, 36], left=[0, 9, 15, 24], centre=False,
    h=[(9, 27, 22.6, 18)], v=[(3, 21, 33, 18)],
    source='Guernsey flag 1985: red cross 1/4 of the height, gold cross of William 3/4 of the height')
add('gi', **merge(dict(W=60, H=30, tag='1:2', left=[0, 20, 30]), framed(21.3, 2.8, 17.5, 26.7, 60, 30),
                  source='Gibraltar flag 1982: white 2/3, red 1/3; castle and key measured'))
add('gq', **merge(dict(W=45, H=30, tag='2:3', left=[0, 10, 20, 30], top=[0, 11.25, 45], lines=[(0, 0, 11.25, 15), (0, 30, 11.25, 15)]),
                  framed(19.0, 10.6, 7.0, 8.7, 45, 30),
                  source='Equatorial Guinea flag: three equal stripes, blue triangle to 1/4 of the length; arms measured'))
add('gt', **merge(dict(W=24, H=15, tag='5:8', top=[0, 8, 16, 24]), framed(9.4, 5.24, 5.22, 4.5, 24, 15),
                  source='Decree 104-97: three equal vertical bands, arms centred; arms measured'))
add('gu', **merge(dict(W=41, H=22, tag='22:41', top=[0, 1, 40, 41], left=[0, 1, 21, 22]), framed(16.9, 5.1, 7.2, 11.8, 41, 22),
                  source='Guam flag 1948/1917: red border 1/22 of the height, seal centred; seal measured'))
add('gw', W=12, H=6, tag='1:2', top=[0, 4, 12], left=[0, 3, 6], centre=False, gx=[2], circles=[(2, 2.91, 0.99)],
    v=[(1.92, 3.9, 3.5, approx(2))], marks=[(2, 2.91)],
    source='Constitution of Guinea-Bissau: red band 1/3 of the length, black star centred on it; star measured')
add('hr', W=200, H=100, tag='1:2', left=[0, 33.33, 66.67, 100], left_l=['33.3', '33.3', '33.3'],
    lines=[(0, 0, 200, 100), (0, 100, 200, 0)], marks=[(100, 50)], gx=[76.55, 123.45, 80.6, 119.4],
    h=[(76.55, 123.45, 9, 46.9), (80.6, 119.4, 82, 38.8)], v=[(13.7, 33.33, 130, 19.6), (33.33, 75.8, 130, 42.5)],
    source='Croatian flag (M. Šutej): three equal stripes, arms centred on the diagonals, crown 46.9 wide, shield 38.8 wide')
add('ht', W=580, H=348, tag='3:5', left=[0, 174, 348], bottom=[0, 235, 345, 580], right=[0, 129, 219, 348],
    boxes=[(235, 129, 110, 90)],
    source='Haitian flag: blue over red, white panel 110 x 90 with the arms, 129 from the top and bottom edges')
add('im', **merge(dict(W=60, H=30, tag='1:2'), framed(19.7, 6.8, 20.7, 18.4, 60, 30),
                  source='Isle of Man flag: red field, triskelion centred; triskelion measured'))
add('ir', **merge(dict(W=84, H=48, tag='4:7', left=[0, 16, 32, 48]), framed(36.0, 18.6, 12.0, 11.4, 84, 48),
                  notes=[(1.5, 47, {'en': 'Takbir 11 times along each edge of the white stripe', 'fr': 'Takbir répété 11 fois sur chaque bord de la bande blanche'})],
                  source='Constitution of Iran, art. 18; ISIRI 1: three equal stripes, emblem centred; emblem measured'))
add('je', **merge(dict(W=50, H=30, tag='3:5', lines=[(0, 0, 50, 30), (0, 30, 50, 0)]), framed(21.4, 0.7, 7.2, 11.4, 50, 30),
                  source='Jersey flag 1981: red saltire on white, badge in the upper arm; badge measured'))
add('ke', W=120, H=80, tag='2:3', left=[0, 24, 28, 52, 56, 80], boxes=[(50.6, 16, 18.9, 48)],
    v=[(16, 64, 76, 48), (12, 24, 84, 12)], h=[(50.6, 69.5, 68, approx(18.9))], marks=[(60, 40)],
    notes=[(2, 77, {'en': 'Spears crossed at 60°', 'fr': 'Lances croisées à 60°'})],
    source='Kenyan flag: stripes 24 + 4 + 24 + 4 + 24, Maasai shield 48 high centred, spear tips 12 from the top')
add('kg', W=50, H=30, tag='3:5', circles=[(25, 15, 8.92), (25, 15, 5.4)], h=[(16.08, 33.92, 26.5, approx(17.8)), (19.6, 30.4, 22, approx(10.8))],
    source='Law on the State Flag of Kyrgyzstan 2023: red field, sun with 40 straight rays and tunduk; sizes measured')
add('kh', **merge(dict(W=60, H=40, tag='2:3', left=[0, 10, 30, 40]), framed(17.6, 12.1, 24.8, 16.1, 60, 40),
                  source='Constitution of Cambodia: blue, red twice as wide, blue; Angkor Wat measured'))
add('ki', **merge(dict(W=60, H=30, tag='1:2', left=[0, 16.2, 30], left_l=[approx(16.2), approx(13.8)]),
                  framed(21.9, 0.7, 16.2, 15.5, 60, 30),
                  source='Kiribati flag 1979: red over blue and white waves, frigatebird over a rising sun; measured'))
ensign('ky', (73.9, 10.4, 32.2, 39.2), source='Cayman Islands blue ensign; arms measured')
add('kz', **merge(dict(W=200, H=100, tag='1:2', top=[0, 6, 18, 200], top_l=[approx(6), approx(12), None]),
                  framed(76.8, 21.5, 62.4, 55.5, 200, 100),
                  source='Constitutional Law on state symbols 2007: ornament along the hoist, sun and steppe eagle; measured'))
add('lb', W=6, H=4, tag='2:3', left=[0, 1, 3, 4], bottom=[0, 2, 4, 6], boxes=[(2, 1, 2, 2)],
    source='Constitution of Lebanon, art. 5: white twice each red stripe, cedar 1/3 of the length and as high as the white')
add('lk', W=200, H=100, tag='1:2', top=[0, 9.3, 35.3, 61.3, 70.7, 190.7, 200],
    top_l=[approx(9.3), approx(26), approx(26), approx(9.4), approx(120), approx(9.3)], left=[0, 9.3, 90.7, 100],
    left_l=[approx(9.3), approx(81.4), approx(9.3)], centre=False,
    source='Constitution of Sri Lanka, schedule 1: yellow border, green and orange stripes, lion panel; measured')
add('lr', W=20.9, H=11, tag='10:19', top=[0, 5, 20.9], left=list(range(0, 12)), centre=False,
    circles=[(2.5, 2.5, 1.47)], h=[(1.03, 3.97, 4.6, approx(2.9))], marks=[(2.5, 2.5)],
    source='Liberian flag 1847: eleven stripes, canton five stripes square, star centred; star measured')
add('me', **merge(dict(W=40, H=20, tag='1:2', top=[0, 1, 39, 40], top_l=[1, None, 1], left=[0, 1, 19, 20], left_l=[1, None, 1]),
                  framed(14.4, 3.6, 11.2, 12.9, 40, 20),
                  source='Law on state symbols 2004: gold border 1/20 of the height, arms centred; arms measured'))
add('mr', W=1500, H=1000, tag='2:3', left=[0, 200, 800, 1000], circles=[(750, 325, 375)], marks=[(750, 325)],
    h=[(375, 1125, 325, 750)],
    v=[(200, 300, 610, 100), (300, 491, 610, 191), (491, 598, 610, 107), (598, 700, 610, 102), (700, 800, 610, 100)],
    source='Constitutional law 2017: red stripes 1/5, crescent from a circle of diameter 3/4 of the length, star 191 high')
add('mw', **merge(dict(W=45, H=30, tag='2:3', left=[0, 10, 20, 30]), framed(12.6, 1.2, 19.7, 8.1, 45, 30),
                  source='Malawi flag 1964/2012: three equal stripes, red rising sun on the black; sun measured'))
add('nc', **merge(dict(W=60, H=30, tag='1:2', left=[0, 10, 20, 30], gx=[20], circles=[(20, 15, 10)], h=[(10, 30, 27, 20)]),
                  dict(boxes=[(10.4, 5.3, 19.3, 18.5)], v=[(5.3, 23.8, 33, approx(18.5))]),
                  source='Kanak flag (official alongside the tricolour since 2010): three equal stripes, disc 2/3 of the height centred 1/3 from the hoist'))
add('ni', **merge(dict(W=50, H=30, tag='3:5', left=[0, 10, 20, 30], circles=[(25, 14.97, 4.5)]),
                  dict(h=[(20.5, 29.5, 21, approx(9))]),
                  source='Nicaraguan flag law 1971: three equal stripes, arms in a circle centred; measured'))

# ── Batch C ──────────────────────────────────────────────────────────────────
# Nepal: drawn in the artwork's own units (base AB = 60); labels in the constitution's units (AB = 1).
_NX, _NY = 17.582, 4.664
add('np', W=71.571, H=87.246, tag='1.219:1', centre=False, wl={'en': '≈1.193 (with border)', 'fr': '≈1,193 (avec bordure)'},
    hl={'en': '≈1.454 (with border)', 'fr': '≈1,454 (avec bordure)'},
    bottom=[0, _NX - 15, _NX, _NX + 45, 71.571], bottom_l=[None, '1/4', '3/4', None],
    left=[0, _NY, _NY + 20, _NY + 37.574, _NY + 58.787, _NY + 80, 87.246],
    left_l=[None, '1/3', '1−√2/2', '√2/4', '√2/4', None],
    gx=[_NX], gy=[_NY + 37.574],
    lines=[(_NX - 15, _NY, _NX + 45, _NY + 37.574), (_NX + 45, _NY + 80, _NX - 15, _NY + 20)],
    circles=[(_NX, _NY + 58.787, 12.84), (_NX, _NY + 29.045, 7.723)],
    marks=[(_NX, _NY + 58.787), (_NX, _NY + 29.045)],
    h=[(_NX - 12.84, _NX + 12.84, _NY + 75.5, '≈0.428'), (_NX - 7.723, _NX + 7.723, _NY + 14.5, '≈0.257')],
    notes=[(30, _NY + 70, {'en': 'Unit: base AB = 1 (without border)', 'fr': 'Unité : base AB = 1 (sans bordure)'})],
    source='Constitution of Nepal, schedule 1: geometric construction from the base AB; heights 4/3, 1, √2/2, √2/4')
add('pf', **merge(dict(W=60, H=40, tag='2:3', left=[0, 10, 30, 40]), framed(21.4, 11.2, 17.2, 17.6, 60, 40),
                  source='Organic law 2004-192: white band half the height, emblem centred; emblem measured'))
add('pg', W=40, H=30, tag='3:4', lines=[(0, 0, 40, 30)], boxes=[(20.25, 3.2, 13.4, 15)],
    marks=[(10, 11.2), (10, 25), (5.4, 17.1), (14.6, 16.7)], h=[(20.25, 33.65, 1.6, approx(13.4))], v=[(3.2, 18.2, 36, approx(15))],
    source='National Flag of Papua New Guinea Act 1971: diagonal division, bird of paradise and Southern Cross; measured')
add('py', W=60, H=33, tag='11:20', left=[0, 11, 22, 33], circles=[(30, 16.5, 4.275)], h=[(25.725, 34.275, 23.5, approx(8.6))],
    source='Law 990/1996: three equal stripes, seals centred; seal measured')
add('sb', W=200, H=100, tag='1:2', lines=[(0, 100, 200, 0)], marks=[(15.3, 12.1), (54.7, 12.1), (35, 29.1), (15.3, 46), (54.7, 46)],
    top=[0, 15.3, 35, 54.7, 200], top_l=[approx(15.3), approx(19.7), approx(19.7), None],
    left=[0, 12.1, 29.1, 46, 100], left_l=[approx(12.1), approx(17), approx(16.9), None], centre=False,
    source='Solomon Islands flag 1977: diagonal yellow band, five stars in the canton; positions measured')
add('sm', **merge(dict(W=40, H=30, tag='3:4', left=[0, 15, 30]), framed(12.5, 4.4, 15.1, 18.1, 40, 30),
                  source='Law 1/2011: white over light blue, arms centred; arms measured'))
add('sn', W=30, H=20, tag='2:3', top=[0, 10, 20, 30], circles=[(15, 10, 3.28)], v=[(6.72, 13.28, 20.8, approx(6.6))], marks=[(15, 10)],
    source='Constitution of Senegal, art. 1: three equal bands, green star centred; star measured')
add('so', W=81, H=54, tag='2:3', circles=[(40.5, 27, 13)], h=[(27.5, 53.5, 27, 26)],
    source='Somali flag 1954 (Soviet catalogue of flags, table 134): star diameter 13/27 of the height')
add('sz', **merge(dict(W=24, H=16, tag='2:3', left=[0, 3, 4, 12, 13, 16]), framed(2.37, 4.56, 19.5, 6.9, 24, 16),
                  source='Eswatini flag 1968: stripes 3 + 1 + 8 + 1 + 3, shield and spears; shield measured'))
add('tg', W=8.09, H=5, tag='1:1.618', left=[0, 1, 2, 3, 4, 5], top=[0, 3, 8.09], top_l=[3, '5.09'], wl='8.09', centre=False,
    circles=[(1.5, 1.5, 0.94)], h=[(0.56, 2.44, 2.8, approx(1.9))], marks=[(1.5, 1.5)],
    source='Togolese flag 1960: five equal stripes, square canton three stripes high, golden ratio; star measured')
add('tm', W=30, H=20, tag='2:3', top=[0, 3.6, 9, 30], top_l=[approx(3.6), approx(5.4), None], boxes=[(12.36, 2.26, 4.04, 4.73)],
    h=[(12.36, 16.4, 8, approx(4))], v=[(2.26, 6.99, 18, approx(4.7))],
    source='Turkmen flag 2001: carpet band with five guls near the hoist, crescent and five stars; measured')
add('ug', W=45, H=30, tag='2:3', left=[0, 5, 10, 15, 20, 25, 30], circles=[(22.5, 15, 4.67)], h=[(17.83, 27.17, 22.5, approx(9.3))],
    source='Uganda flag 1962: six equal stripes, white disc with the crested crane; disc measured')
add('uy', W=27, H=18, tag='2:3', top=[0, 10, 27], left=list(range(0, 19, 2)), centre=False, circles=[(5, 5, 3.7)],
    h=[(1.3, 8.7, 9.3, approx(7.4))], marks=[(5, 5)],
    source='Law of 11 July 1830: nine stripes, canton five stripes square with the Sun of May; sun measured')
add('va', **merge(dict(W=100, H=100, tag='1:1', top=[0, 50, 100]), framed(57.3, 20.9, 34.2, 54.2, 100, 100),
                  source='Fundamental Law of Vatican City State, annex: yellow and white halves, keys and tiara; measured'))
add('xk', **merge(dict(W=70, H=50, tag='5:7'), framed(15.35, 7.3, 39.3, 35.7, 70, 50),
                  dict(marks=[(18.1, 13.46), (24.65, 11.08), (31.51, 9.87), (38.49, 9.87), (45.35, 11.08), (51.9, 13.46)]),
                  source='Law on the flag of Kosovo 2008: map and six stars centred; measured'))
add('mz', W=48, H=32, tag='2:3', top=[0, 21, 48], left=[0, 10, 11, 21, 22, 32], lines=[(0, 0, 21, 16), (0, 32, 21, 16)],
    boxes=[(0.74, 10.06, 12.52, 12.0)], h=[(0.74, 13.26, 24, approx(12.5))], v=[(10.06, 22.06, 15, approx(12))],
    source='Constitution of Mozambique: stripes 10 + 1 + 10 + 1 + 10, red triangle to 21, star with book, rifle and hoe; star measured')
add('ao', W=150, H=100, tag='2:3', top=[0, 75, 150], left=[0, 50, 100], bottom=[0, 131, 150], bottom_l=[None, 19],
    lines=[(0, 0, 131, 100)], circles=[(75, 50, 26), (75, 50, 24), (75, 50, 20)],
    v=[(24, 50, 128, 26), (26, 50, 117, 24), (30, 50, 106, 20), (32, 50, 45, 18)],
    notes=[(4, 95, {'en': 'Machete 51 long, handle 12', 'fr': 'Machette longue de 51, manche de 12'})],
    source='Constitution of Angola 2010, annex: half gear radii 26 / 24 / 20, machete on the diagonal (Commons construction sheet)')
add('az', W=120, H=60, tag='1:2', left=[0, 20, 40, 60], bottom=[0, 49, 73, 120], bottom_l=[None, 24, None],
    circles=[(58, 30, 9), (68, 30, 5)],
    v=[(21, 39, 46, 18), (22.5, 37.5, 62, 15), (25, 35, 76, 10)],
    source='Law on the State Flag 2004: three equal stripes; crescent 3/10, inner circle 1/4, star 1/6 of the height, emblem 2/5 wide')
add('bb', **merge(dict(W=9, H=6, tag='2:3', top=[0, 3, 6, 9]), framed(3.21, 1.56, 2.57, 2.9, 9, 6),
                  source='National Emblems and National Flag Act 1966: three equal bands, broken trident; trident measured'))
add('ec', **merge(dict(W=30, H=20, tag='2:3', left=[0, 10, 15, 20]), framed(10.9, 5.0, 8.2, 9.5, 30, 20),
                  source='Ecuador flag law 1900/2009: yellow half the height, blue and red a quarter each; arms measured'))
add('mo', **merge(dict(W=60, H=40, tag='2:3'), framed(19.9, 7.7, 20.2, 23.5, 60, 40),
                  source='Macau flag 1999: lotus, bridge, water and five stars on green; emblem measured'))
add('tj', **merge(dict(W=280, H=140, tag='1:2', left=[0, 40, 100, 140]), framed(107.6, 43.5, 64.8, 53.6, 280, 140),
                  source='Law on the State Flag of Tajikistan: stripes 2 : 3 : 2, crown and seven stars; emblem measured'))
add('tr', W=180, H=120, tag='2:3', gx=[4, 64, 71.5, 102.5], circles=[(64, 60, 30), (71.5, 60, 24), (102.5, 60, 15)],
    h=[(0, 4, 104, 'M = 4'), (4, 64, 104, 'A = 60'), (64, 71.5, 22, 'C = 7.5'), (47.5, 87.5, 14, 'E = 40'), (87.5, 117.5, 82, 'F = 30')],
    v=[(30, 90, 30, 'B = 60'), (36, 84, 140, 'D = 48')], wl='L = 180', hl='G = 120',
    source='Turkish Flag Law 2994 (1983): G width; A = G/2, B = G/2, C = G/16, D = 2G/5, E = G/3, F = G/4, L = 3G/2, M = G/30')
add('tw', W=900, H=600, tag='2:3', top=[0, 450, 900], left=[0, 300, 600], centre=False, circles=[(225, 150, 112.5), (225, 150, 63.75)],
    h=[(112.5, 337.5, 272, 225), (161.25, 288.75, 150, 127.5)], marks=[(225, 150)],
    source='National Flag Law of the Republic of China 1954: canton 1/4, sun of 12 rays in a circle 3/4 of the canton height')
add('ve', W=30, H=20, tag='2:3', left=[0, 6.67, 13.33, 20], left_l=['20/3', '20/3', '20/3'], circles=[(15, 13.5, 6.4)],
    h=[(8.6, 21.4, 14, approx(12.8))],
    source='Law on the national flag, shield and anthem 2006: three equal stripes, arc of eight stars; arc measured')
add('es', W=750, H=500, tag='2:3', left=[0, 125, 375, 500], gx=[250], h=[(0, 250, 470, 250)], v=[(150, 350, 365, 200)],
    source='Royal Decree 1511/1977: yellow twice each red; arms 2/5 of the height, axis at half the height from the hoist')
add('co', W=30, H=20, tag='2:3', left=[0, 10, 15, 20],
    source='Decree 861 of 1924: yellow half the height, blue and red a quarter each')
add('ru', W=9, H=6, tag='2:3', left=[0, 2, 4, 6], source='Federal Constitutional Law on the State Flag 2000: three equal stripes')
add('ad', W=200, H=140, tag='7:10', top=[0, 64, 69, 131, 136, 200], top_l=[64, 5, 62, 5, 64],
    left=[0, 37, 48, 88, 103, 140], left_l=[37, 11, 40, 15, 37], boxes=[(69, 37, 62, 66)],
    source='Andorran flag law 1971/1996: stripes 8 : 9 : 8, arms 62 wide and 66 high in a 200 x 140 grid (Commons construction sheet)')

# ── Batch D (Commons sheets replaced: wrong ratio, English text, too heavy or too thin) ──
add('li', W=20, H=12, tag='3:5', top=[0, 4, 20], left=[0, 3, 6, 12], boxes=[(2, 1.5, 4, 3)], marks=[(4, 3)],
    h=[(2, 6, 5.2, 4)], v=[(1.5, 4.5, 7, 3)],
    source='Law of 30 June 1982: blue over red, crown in a 4 x 3 box centred 4 from the hoist and 3 from the top')
add('ne', W=14, H=12, tag='6:7', left=[0, 4, 8, 12], top=[0, 7, 14], circles=[(7, 6, 1.7)], h=[(5.3, 8.7, 7.4, approx(3.4))],
    source='Constitution of Niger: three equal stripes, orange disc centred; disc measured')
add('mx', W=84, H=48, tag='4:7', top=[0, 28, 56, 84], bottom=[0, 31.5, 52.5, 84], bottom_l=[None, 21, None],
    right=[0, 14.5, 33.5, 48], right_l=[approx(14.5), approx(19), approx(14.5)], boxes=[(31.5, 14.5, 21, 19)],
    source='Law on the national arms, flag and anthem 1984: three equal bands, arms 3/4 of the white band wide')
add('rs', W=504, H=336, tag='2:3', left=[0, 112, 224, 336], bottom=[0, 117, 243, 504], right=[0, 28, 112, 280, 336],
    gx=[180, 252], boxes=[(117, 28, 126, 252)], wl='A = 504', hl='2/3 A = 336',
    notes=[(262, 326, {'en': 'Arms: 1/4 A wide, 1/2 A high\n(crown 1/6 A, shield 1/3 A)\naxis 1/7 A left of the centre',
                       'fr': 'Armoiries : 1/4 A × 1/2 A\n(couronne 1/6 A, écu 1/3 A)\naxe à 1/7 A à gauche du centre'})],
    source='Law on the appearance and use of the coat of arms, flag and anthem 2009 (Commons construction sheet, A = length)')
add('sg', **merge(dict(W=54, H=36, tag='2:3', left=[0, 18, 36]), framed(4.97, 2.23, 15.32, 13.54, 54, 36),
                  source='Singapore Arms and Flag and National Anthem Act: red over white, crescent and five stars; emblem measured'))
add('md', W=300, H=150, tag='1:2', top=[0, 100, 200, 300], bottom=[0, 120, 180, 300], bottom_l=[None, 60, None],
    right=[0, 33, 117, 150], boxes=[(120, 33, 60, 84)],
    source='Law on the State Flag 1990: three equal bands, arms 0.4 H wide and 0.56 H high centred')
add('om', **merge(dict(W=24, H=12, tag='1:2', top=[0, 6, 24], left=[0, 4, 8, 12], centre=False), framed(1.32, 0.62, 3.36, 3.17, 24, 12),
                  source='Omani flag 1995: red band 1/4 of the length, three equal stripes, emblem in the upper hoist; emblem measured'))
add('gb-sct', W=50, H=40, tag='4:5', lines=[(0, 0, 50, 40), (0, 40, 50, 0)], a=[(15.0, 6.877, 10.0, 13.123, 8), (35.0, 6.877, 40.0, 13.123, 8)],
    source='Lord Lyon King of Arms: ratio 4:5, white saltire 1/5 of the height wide')
add('fo', W=22, H=16, tag='8:11', top=[0, 6, 7, 9, 10, 22], left=[0, 6, 7, 9, 10, 16], centre=False,
    source='Faroese flag law 1959: 6 + 1 + 2 + 1 + 12 by 6 + 1 + 2 + 1 + 6')

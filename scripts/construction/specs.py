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

# ── Batch 5 — Nordic and Christian crosses ───────────────────────────────────
add('dk', S(37, 28, '28:37', x=[0, 12, 16, 37], y=[0, 12, 16, 28], centre=False,
            source='Danish flag specification 12+4+21 by 12+4+12'))
add('se', S(16, 10, '5:8', x=[0, 5, 7, 16], y=[0, 4, 6, 10], centre=False,
            source='Swedish Flag Act 1982:269: 5+2+9 by 4+2+4'))
add('no', S(22, 16, '8:11', x=[0, 6, 7, 9, 10, 22], y=[0, 6, 7, 9, 10, 16], centre=False,
            source='Act on the flag of Norway, 1898: 6+1+2+1+12 by 6+1+2+1+6'))
add('fi', S(18, 11, '11:18', x=[0, 5, 8, 18], y=[0, 4, 7, 11], centre=False,
            source='Act on the Flag of Finland 380/1978: 5+3+10 by 4+3+4'))
add('is', S(25, 18, '18:25', x=[0, 7, 8, 10, 11, 25], y=[0, 7, 8, 10, 11, 18], centre=False,
            source='Act on the Icelandic national flag 34/1944: 7+1+2+1+14 by 7+1+2+1+7'))
add('fo', S(22, 16, '8:11', x=[0, 6, 7, 9, 10, 22], y=[0, 6, 7, 9, 10, 16], centre=False,
            source='Faroese flag law 1959: 6+1+2+1+12 by 6+1+2+1+6'))
add('ax', S(26, 17, '17:26', x=[0, 8, 9.5, 11.5, 13, 26], y=[0, 6, 7.5, 9.5, 11, 17], centre=False,
            source='Åland flag act 1991/2004: 8+1.5+2+1.5+13 by 6+1.5+2+1.5+6'))
add('ch', S(32, 32, '1:1', x=[0, 6, 13, 19, 26, 32], y=[0, 6, 13, 19, 26, 32],
            source='Swiss coat of arms protection act 2013: cross arms 6 wide, 7 long, square 32'))
add('gb-eng', S(25, 15, '3:5', x=[0, 11, 14, 25], y=[0, 6, 9, 15], centre=False,
                source='Cross of St George, cross 1/5 of the height'))
add('gb-sct', S(5, 4, '4:5', lines=[(0, 0, 5, 4), (0, 4, 5, 0)], texts=[(2.5, 1.0, {'en': 'saltire width = 1/5 of height', 'fr': 'largeur du sautoir = 1/5 de la hauteur'})],
                source='Lord Lyon: 4:5, saltire width 1/5 of the height '))

# ── Batch 6 — British Isles and Central Europe ───────────────────────────────
_UJ = dict(x=[0, 25, 27, 33, 35, 60], y=[0, 10, 12, 18, 20, 30], centre=False,
           lines=[(0, 0, 60, 30), (0, 30, 60, 0)],
           source='Union Flag: St George cross 6 (1/5 H) with 2 white fimbriation, saltires 6 (white 3 + red 2 counterchanged)')
add('gb', S(60, 30, '1:2', **_UJ))
add('gb-nir', S(60, 30, '1:2', x=[0, 27, 33, 60], y=[0, 12, 18, 30], centre=False,
                source='Ulster Banner (1953): red cross 1/5 of the height, crowned star with the Red Hand'))
add('gb-wls', S(5, 3, '3:5', y=[0, 1.5, 3], source='Welsh flag: equal white over green, dragon centred'))
add('gg', S(36, 24, '2:3', x=[0, 15, 21, 36], y=[0, 9, 15, 24], centre=False,
            source='Guernsey flag 1985: red cross 1/4 H with gold cross of William'))
add('gi', S(6, 3, '1:2', y=[0, 2, 3], source='Gibraltar flag: white 2/3, red 1/3'))
add('je', S(30, 18, '3:5', lines=[(0, 0, 30, 18), (0, 18, 30, 0)], source='Jersey flag 1981: red saltire with badge'))
add('im', S(2, 1, '1:2', source='Isle of Man flag: triskelion centred'))
add('cz', S(3, 2, '2:3', x=[0, 1.5, 3], y=[0, 1, 2], source='Act 3/1993: blue wedge to half the length'))
add('sk', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Constitution of Slovakia, art. 8'))
add('si', S(12, 6, '1:2', y=[0, 2, 4, 6], source='Act on the coat of arms, flag and anthem 1994'))

# ── Batch 7 — Europe with emblems ────────────────────────────────────────────
add('ad', S(25, 17.5, '7:10', x=[0, 8, 17, 25], source='Andorran flag law 1971/1996: stripes 8:9:8'))
add('al', S(7, 5, '5:7', source='Law 8926/2002: double-headed eagle centred'))
add('ba', S(16, 8, '1:2', source='Decision of the High Representative, 1998'))
add('hr', S(6, 3, '1:2', y=[0, 1, 2, 3], source='Law on the coat of arms, flag and anthem 1990'))
add('li', S(5, 3, '3:5', y=[0, 1.5, 3], source='Law of 30 June 1982'))
add('md', S(6, 3, '1:2', x=[0, 2, 4, 6], source='Law on the State Flag 1990'))
add('me', S(40, 20, '1:2', x=[0, 1, 39, 40], y=[0, 1, 19, 20], xl=[None, None, None], yl=['1', None, '1'],
            source='Law on the state symbols 2004: gold border 1/20 of the height'))
add('mk', S(2, 1, '1:2', source='Law on the flag 1995: sun with eight rays'))
add('mt', S(3, 2, '2:3', x=[0, 1.5, 3], source='Constitution of Malta, art. 3'))
add('pt', S(15, 10, '2:3', x=[0, 6, 15], circles=[(6, 5, 2.5)], dims=[('v', 2.5, 7.5, 9, '5')],
            source='Decree of 19 June 1911: green 2/5, red 3/5, sphere diameter 1/2 H on the dividing line'))

# ── Batch 8 ──────────────────────────────────────────────────────────────────
add('rs', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Law on the appearance and use of the coat of arms, flag and anthem 2009'))
add('sm', S(4, 3, '3:4', y=[0, 1.5, 3], source='Law 1/2011 of San Marino'))
add('va', S(2, 2, '1:1', x=[0, 1, 2], source='Fundamental Law of Vatican City State, annex'))
add('xk', S(7, 5, '5:7', source='Law on the flag of Kosovo 2008'))
add('bb', S(3, 2, '2:3', x=[0, 1, 2, 3], source='National Emblems and National Flag Act 1966'))
add('bs', S(6, 3, '1:2', x=[0, 2.598, 6], xl=['≈2.6', None], y=[0, 1, 2, 3],
            source='Bahamas flag: three equal stripes, equilateral black triangle'))
add('ca', S(8, 4, '1:2', x=[0, 2, 6, 8], source='Royal Proclamation 1965: red bands each 1/4 of the length'))
add('cl', S(24, 16, '2:3', x=[0, 8, 24], y=[0, 8, 16], circles=[(4, 4, 2)], dims=[('h', 2, 6, 7, '4')],
            source='Decree 1534/1967: canton square 1/2 H, star diameter 1/2 canton'))
add('cu', S(20, 10, '1:2', y=[0, 2, 4, 6, 8, 10], x=[0, 8.66, 20], xl=['≈8.66', None],
            source='Cuban flag law: five equal stripes, equilateral red triangle'))
add('jm', S(12, 6, '1:2', lines=[(0, 0, 12, 6), (0, 6, 12, 0)], source='Jamaican flag: gold saltire 1/6 of the height'))

# ── Batch 9 ──────────────────────────────────────────────────────────────────
add('ag', S(3, 2, '2:3', y=[0, 1, 2], lines=[(0, 0, 1.5, 2), (3, 0, 1.5, 2)], source='Antigua and Barbuda flag 1967'))
add('aw', S(27, 18, '2:3', y=[0, 12, 13, 14, 15, 18], gx=[4], gy=[4], centre=False,
            source='Aruba flag 1976: two yellow stripes 1/18 H, star centred 4 units from hoist and top'))
add('bm', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], source='Bermuda red ensign: canton 1/4 of the field'))
add('br', S(20, 14, '7:10', x=[0, 1.7, 18.3, 20], y=[0, 1.7, 12.3, 14], circles=[(10, 7, 3.5)],
            dims=[('h', 6.5, 13.5, 10.6, '7')],
            source='Law 5.700/1971: 20 x 14 modules, rhombus 1.7 from the edges, circle radius 3.5'))
add('bz', S(50, 30, '3:5', y=[0, 3, 27, 30], source='Belize National Flag: red stripes 1/10 of the height'))
add('cw', S(54, 36, '2:3', y=[0, 22.5, 27, 36], source='Curaçao flag 1984: yellow stripe 1/8 H at 5/8'))
add('dm', S(24, 12, '1:2', x=[0, 10.5, 11.5, 12.5, 13.5, 24], y=[0, 4.5, 5.5, 6.5, 7.5, 12],
            source='Dominica National Flag Act: triple cross of 1/12 H stripes'))
add('do', S(45, 30, '2:3', x=[0, 19.5, 25.5, 45], y=[0, 12, 18, 30], centre=False,
            source='Constitution of the Dominican Republic, art. 31: white cross 1/5 H'))
add('gd', S(50, 30, '3:5', x=[0, 4.2, 45.8, 50], y=[0, 4.2, 25.8, 30], lines=[(4.2, 4.2, 45.8, 25.8), (4.2, 25.8, 45.8, 4.2)],
            circles=[(25, 15, 3.6)], source='Grenada flag 1974: red border 1/7 H'))
add('gl', S(18, 12, '2:3', y=[0, 6, 12], x=[0, 3, 11, 18], gx=[7], circles=[(7, 6, 4)], centre=False,
            source='Greenland flag 1985: disc diameter 8 centred 7 from the hoist'))

# ── Batch 10 ─────────────────────────────────────────────────────────────────
add('gy', S(5, 3, '3:5', x=[0, 2.5, 5], lines=[(0, 0, 5, 1.5), (0, 3, 5, 1.5)], source='Guyana flag 1966: black triangle to half the length'))
add('hn', S(6, 3, '1:2', y=[0, 1, 2, 3], source='Decree 1866 / 1949: three equal stripes'))
add('kn', S(3, 2, '2:3', lines=[(0, 2, 3, 0)], source='Saint Kitts and Nevis flag 1983'))
add('lc', S(2, 1, '1:2', source='Saint Lucia flag 1979/2002'))
add('pa', S(6, 4, '2:3', x=[0, 3, 6], y=[0, 2, 4], gx=[1.5, 4.5], gy=[1, 3], centre=False,
            source='Law 34/1949: four quarters, stars centred in the white quarters'))
add('pr', S(15, 10, '2:3', y=[0, 2, 4, 6, 8, 10], x=[0, 8.66, 15], xl=['≈8.66', None],
            source='Law 1/1952: five equal stripes, equilateral blue triangle'))
add('sr', S(15, 10, '2:3', y=[0, 2, 3, 7, 8, 10], source='Suriname flag 1975: stripes 2:1:4:1:2'))
add('tt', S(5, 3, '3:5', source='Trinidad and Tobago flag 1962'))
add('us', S(1.9, 1, '10:19', x=[0, 0.76, 1.9], xl=['D=0.76', None], y=[0, 0.5385, 1], yl=['C=0.5385', None],
            wl='B=1.9', hl='A=1', centre=False, source='Executive Order 10834 (1959): A=1, B=1.9, C=0.5385, D=0.76, L=0.0769'))
add('uy', S(27, 18, '2:3', x=[0, 10, 27], y=list(range(0, 19, 2)), centre=False,
            source='Law of 11 July 1830: nine stripes, white canton five stripes square'))
add('vc', S(12, 8, '2:3', x=[0, 3, 9, 12], source='Saint Vincent flag 1985: bands 1:2:1'))
add('ve', S(18, 12, '2:3', y=[0, 4, 8, 12], source='Law on the national flag, shield and anthem 2006'))

# ── Batch 11 ─────────────────────────────────────────────────────────────────
add('ec', S(3, 2, '2:3', y=[0, 1, 1.5, 2], source='Ecuador flag law 1900/2009: yellow half the height'))
add('fk', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], source='Falkland Islands blue ensign'))
add('gt', S(24, 15, '5:8', x=[0, 8, 16, 24], source='Decree 104-97: three equal vertical bands'))
add('ht', S(5, 3, '3:5', y=[0, 1.5, 3], source='Constitution of Haiti 1987, art. 3'))
add('ky', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], source='Cayman Islands blue ensign'))
add('mx', S(21, 12, '4:7', x=[0, 7, 14, 21], source='Law on the national arms, flag and anthem 1984'))
add('ni', S(5, 3, '3:5', y=[0, 1, 2, 3], source='Law 1971: three equal stripes'))
add('pe', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Law 8 / Decree 1950: three equal vertical bands'))
add('py', S(60, 33, '11:20', y=[0, 11, 22, 33], source='Law 990/1996: three equal stripes'))
add('sv', S(335, 189, '189:335', y=[0, 63, 126, 189], source='Law of the national symbols 1972: three equal stripes'))

# ── Batch 12 — Africa ────────────────────────────────────────────────────────
add('ao', S(3, 2, '2:3', y=[0, 1, 2], source='Constitution of Angola 2010, annex'))
add('bf', S(3, 2, '2:3', y=[0, 1, 2], source='Constitution of Burkina Faso, art. 34'))
add('bi', S(5, 3, '3:5', lines=[(0, 0, 5, 3), (0, 3, 5, 0)], source='Constitution of Burundi, art. 9'))
add('bj', S(15, 10, '2:3', x=[0, 6, 15], y=[0, 5, 10], centre=False, source='Benin flag 1959/1990: green 2/5 of the length'))
add('cd', S(4, 3, '3:4', lines=[(0, 3, 4, 0)], source='Constitution of the DR Congo 2006, art. 1'))
add('cf', S(12, 8, '2:3', y=[0, 2, 4, 6, 8], x=[0, 5, 7, 12], source='Constitution of the Central African Republic'))
add('cg', S(3, 2, '2:3', x=[0, 1, 2, 3], lines=[(0, 2, 2, 0), (1, 2, 3, 0)], centre=False,
            source='Constitution of the Republic of the Congo: yellow diagonal band'))
add('cm', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Constitution of Cameroon, art. 1'))
add('cv', S(18, 12, '2:3', y=[0, 6, 7, 8, 9, 12], source='Cape Verde flag 1992: stripes 6:1:1:1:3; 2:3 per the 2009 government graphic guide'))
add('dj', S(15, 10, '2:3', y=[0, 5, 10], x=[0, 8.66, 15], xl=['≈8.66', None],
            source='Djibouti flag 1977: equilateral white triangle'))

# ── Batch 13 — Africa ────────────────────────────────────────────────────────
add('dz', S(3, 2, '2:3', x=[0, 1.5, 3], source='Law 63-145 of 25 April 1963'))
add('er', S(4, 2, '1:2', lines=[(0, 0, 4, 1), (0, 2, 4, 1)], source='Eritrean flag 1995'))
add('et', S(6, 3, '1:2', y=[0, 1, 2, 3], source='Proclamation 654/2009'))
add('gh', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Ghana Armed Forces flag regulations; three equal stripes'))
add('gq', S(9, 6, '2:3', y=[0, 2, 4, 6], x=[0, 2.25, 9], source='Equatorial Guinea flag; triangle to 1/4 of the length'))
add('gw', S(12, 6, '1:2', x=[0, 4, 12], y=[0, 3, 6], centre=False, source='Constitution of Guinea-Bissau: red band 1/3 of the length'))
add('ke', S(27, 18, '2:3', y=[0, 6, 7, 11, 12, 18], source='Kenyan flag: stripes 6:1:4:1:6'))
add('km', S(20, 12, '3:5', y=[0, 3, 6, 9, 12], source='Constitution of Comoros 2001: four equal stripes'))
add('lr', S(20.9, 11, '10:19', x=[0, 5, 20.9], y=list(range(0, 12)), centre=False,
            source='Liberian flag 1847: eleven stripes, canton five stripes square'))
add('ls', S(15, 10, '2:3', y=[0, 3, 7, 10], source='Lesotho flag 2006: stripes 3:4:3'))

# ── Batch 14 — Africa ────────────────────────────────────────────────────────
add('ly', S(8, 4, '1:2', y=[0, 1, 3, 4], source='Libyan flag 1951/2011: stripes 1:2:1'))
add('ma', S(9, 6, '2:3', source='Dahir of 17 November 1915'))
add('mg', S(3, 2, '2:3', x=[0, 1, 3], y=[0, 1, 2], centre=False, source='Constitution of Madagascar: white 1/3 of the length'))
add('mr', S(15, 10, '2:3', y=[0, 2, 8, 10], source='Constitutional law 2017: red stripes 1/5 of the height'))
add('mw', S(4.5, 3, '2:3', y=[0, 1, 2, 3], source='Malawi flag: three equal stripes'))
add('na', S(3, 2, '2:3', lines=[(0, 2, 3, 0)], source='Namibian flag 1990'))
add('ne', S(7, 6, '6:7', y=[0, 2, 4, 6], circles=[(3.5, 3, 0.85)], source='Constitution of Niger: three equal stripes, orange disc'))
add('rw', S(6, 4, '2:3', y=[0, 2, 3, 4], source='Rwanda flag 2001: blue half, yellow and green quarters'))
add('sc', S(6, 3, '1:2', x=[0, 2, 4, 6], y=[0, 1, 2, 3], centre=False,
            lines=[(0, 3, 2, 0), (0, 3, 4, 0), (0, 3, 6, 1), (0, 3, 6, 2)],
            source='Seychelles flag 1996: five oblique bands from the lower hoist'))
add('sd', S(12, 6, '1:2', y=[0, 2, 4, 6], x=[0, 4, 12], source='Sudan flag 1970: green triangle to 1/3 of the length'))

# ── Batch 15 — Africa ────────────────────────────────────────────────────────
add('sn', S(9, 6, '2:3', x=[0, 3, 6, 9], source='Constitution of Senegal, art. 1'))
add('so', S(3, 2, '2:3', source='Somali flag 1954'))
add('ss', S(20, 10, '1:2', y=[0, 3, 3.5, 6.5, 7, 10], x=[0, 8.66, 20], xl=['≈8.66', None],
            source='South Sudan flag: stripes 3:0.5:3:0.5:3, equilateral blue triangle'))
add('st', S(28, 14, '1:2', y=[0, 4, 10, 14], x=[0, 7, 28], source='São Tomé and Príncipe flag: yellow 3/7, triangle 1/4 of the length'))
add('sz', S(24, 16, '2:3', y=[0, 3, 4, 12, 13, 16], source='Eswatini flag 1968: stripes 3:1:8:1:3'))
add('tg', S(8.09, 5, '1:1.618', y=[0, 1, 2, 3, 4, 5], x=[0, 3, 8.09], xl=['3', '5.09'], wl='8.09',
            source='Togolese flag 1960: five equal stripes, square canton three stripes high, golden ratio'))
add('tn', S(6, 4, '2:3', circles=[(3, 2, 1)], dims=[('h', 2, 4, 2.9, '2')],
            source='Law 99-56: white disc diameter 1/3 of the length'))
add('tz', S(3, 2, '2:3', lines=[(0, 2, 3, 0)], source='Tanzanian flag 1964'))
add('ug', S(9, 6, '2:3', y=[0, 1, 2, 3, 4, 5, 6], source='Uganda flag 1962: six equal stripes'))
add('za', S(3, 2, '2:3', source='South African flag 1994'))

# ── Batch 16 ─────────────────────────────────────────────────────────────────
add('zm', S(42, 28, '2:3', x=[0, 27, 32, 37, 42], y=[0, 10, 28], centre=False,
            source='Zambian flag 1964/1996: three vertical bands in the lower fly'))
add('zw', S(14, 7, '1:2', y=list(range(0, 8)), source='Zimbabwe flag 1980: seven equal stripes'))
add('sx', S(3, 2, '2:3', y=[0, 1, 2], source='Sint Maarten flag 1985'))
add('ae', S(6, 3, '1:2', x=[0, 1.5, 6], y=[0, 1, 2, 3], centre=False, source='UAE flag 1971: red band 1/4 of the length'))
add('af', S(2, 1, '1:2', source='Flag of the Islamic Emirate of Afghanistan (2021): white field with the Shahada'))
add('az', S(6, 3, '1:2', y=[0, 1, 2, 3], source='Law on the State Flag 2004: three equal stripes'))
add('bd', S(20, 12, '3:5', x=[0, 9, 20], gx=[9], circles=[(9, 6, 4)], dims=[('h', 5, 13, 10.6, '8')],
            source='Bangladesh flag rules 1972: 10:6, disc radius 1/5 of the length, centre at 9/20'))
add('bn', S(2, 1, '1:2', source='Brunei flag 1959'))
add('bt', S(3, 2, '2:3', lines=[(0, 2, 3, 0)], source='Bhutan national flag rules 1972'))
add('cn', S(30, 20, '2:3', x=[0, 5, 10, 15, 30], y=[0, 5, 10, 20], circles=[(5, 5, 3)], dims=[('h', 2, 8, 9, '6')],
            centre=False, source='Construction sheet of the National Flag Law 1949/1990: canton 15 x 10 grid, large star diameter 6'))

# ── Batch 17 ─────────────────────────────────────────────────────────────────
add('cy', S(3, 2, '2:3', source='Constitution of Cyprus, art. 4'))
add('ge', S(30, 20, '2:3', x=[0, 13, 17, 30], y=[0, 8, 12, 20], centre=False,
            source='Law on the State Flag of Georgia 2004: cross 1/5 H'))
add('hk', S(3, 2, '2:3', source='Basic Law of Hong Kong, annex'))
add('il', S(220, 160, '8:11', y=[0, 15, 40, 120, 145, 160], source='Israel Flag and Emblem Law 1949: 220 x 160, stripes 25 at 15 from the edges'))
add('in', S(9, 6, '2:3', y=[0, 2, 4, 6], source='Flag Code of India 2002: three equal stripes'))
add('ir', S(21, 12, '4:7', y=[0, 4, 8, 12], source='Constitution of Iran, art. 18; ISIRI 1'))
add('jo', S(6, 3, '1:2', y=[0, 1, 2, 3], x=[0, 3, 6], source='Constitution of Jordan, art. 4: triangle to half the length'))
add('jp', S(15, 10, '2:3', circles=[(7.5, 5, 3)], dims=[('h', 4.5, 10.5, 9, '6')],
            source='Act on National Flag and Anthem 1999: disc diameter 3/5 of the height, centred'))
add('kg', S(5, 3, '3:5', source='Law on the State Flag of Kyrgyzstan 2023'))
add('kh', S(3, 2, '2:3', y=[0, 0.5, 1.5, 2], source='Constitution of Cambodia: blue, red twice as wide, blue'))

# ── Batch 18 ─────────────────────────────────────────────────────────────────
add('kp', S(72, 36, '1:2', y=[0, 6, 7, 29, 30, 36], source='DPRK flag 1948: stripes 6:1:22:1:6'))
add('kr', S(3, 2, '2:3', circles=[(1.5, 1, 0.5)], dims=[('h', 1, 2, 1.85, '1')],
            source='National Flag Act 2007: taegeuk diameter 1/2 of the height'))
add('kw', S(12, 6, '1:2', y=[0, 2, 4, 6], x=[0, 3, 12], source='Kuwaiti flag 1961: trapezium to 1/4 of the length'))
add('kz', S(2, 1, '1:2', source='Constitutional Law on state symbols 2007'))
add('la', S(6, 4, '2:3', y=[0, 1, 3, 4], circles=[(3, 2, 0.8)], dims=[('h', 2.2, 3.8, 3.5, '1.6')],
            source='Lao flag 1975: blue half the height, disc diameter 0.8 of the blue band'))
add('lb', S(12, 8, '2:3', y=[0, 2, 6, 8], source='Constitution of Lebanon, art. 5: white twice each red'))
add('lk', S(2, 1, '1:2', source='Constitution of Sri Lanka, schedule'))
add('mn', S(6, 3, '1:2', x=[0, 2, 4, 6], source='Law on the State Flag of Mongolia 1992'))
add('mo', S(3, 2, '2:3', source='Basic Law of Macau, annex'))
add('mv', S(6, 4, '2:3', x=[0, 1, 5, 6], y=[0, 1, 3, 4], source='Maldives flag 1965: red border 1/4 of the height'))

# ── Batch 19 ─────────────────────────────────────────────────────────────────
add('my', S(28, 14, '1:2', x=[0, 14, 28], y=[0, 8, 14], centre=False, source='Malaysian flag 1963: fourteen stripes, canton half the length over eight stripes'))
add('np', S(1, 1.219, '1.219:1', wl='1', hl='≈1.219', centre=False,
            source='Constitution of Nepal, schedule 1: two stacked pennants, full geometric construction'))
add('om', S(12, 6, '1:2', x=[0, 3, 12], y=[0, 2, 4, 6], centre=False, source='Omani flag 1995: red band 1/4 of the length'))
add('ph', S(2, 1, '1:2', x=[0, 0.866, 2], xl=['≈0.866', None], y=[0, 0.5, 1],
            source='Republic Act 8491: equilateral white triangle'))
add('pk', S(12, 8, '2:3', x=[0, 3, 12], source='Pakistan flag specification: white band 1/4 of the length'))
add('ps', S(6, 3, '1:2', y=[0, 1, 2, 3], x=[0, 2, 6], source='Palestinian flag 1964: triangle to 1/3 of the length'))
add('qa', S(28, 11, '11:28', x=[0, 8, 10, 28], source='Qatari flag 1971/1974: nine-point serrated band'))
add('sa', S(3, 2, '2:3', source='Basic Law of Saudi Arabia, art. 3'))
add('sg', S(3, 2, '2:3', y=[0, 1, 2], source='Singapore Arms and Flag and National Anthem Act'))
add('tj', S(14, 7, '1:2', y=[0, 2, 5, 7], source='Law on the State Flag of Tajikistan: stripes 2:3:2'))

# ── Batch 20 ─────────────────────────────────────────────────────────────────
add('tl', S(6, 3, '1:2', x=[0, 2, 3, 6], centre=False, lines=[(0, 0, 3, 1.5), (0, 3, 3, 1.5)],
            source='Constitution of Timor-Leste: black triangle to 1/3, yellow to 1/2 of the length'))
add('tm', S(3, 2, '2:3', source='Turkmen flag 2001'))
add('tr', S(12, 8, '2:3', circles=[(4.25, 4, 2), (4.75, 4, 1.6)], gx=[4.25], dims=[('v', 2, 6, 2.0, '4')],
            source='Turkish Flag Law 2994: crescent outer diameter 1/2 of the height'))
add('tw', S(3, 2, '2:3', x=[0, 1.5, 3], y=[0, 1, 2], centre=False, source='Flag law of the Republic of China 1954'))
add('uz', S(100, 50, '1:2', y=[0, 16, 17, 33, 34, 50], source='Law on the State Flag of Uzbekistan 1991'))
add('vn', S(3, 2, '2:3', source='Constitution of Vietnam, art. 13'))
add('au', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], centre=False, source='Flags Act 1953: Union Jack canton 1/4'))
add('fj', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], centre=False, source='Fiji flag 1970'))
add('fm', S(38, 20, '10:19', source='Micronesia flag 1978'))
add('gu', S(41, 22, '22:41', source='Guam flag 1948'))

# ── Batch 21 — Oceania ───────────────────────────────────────────────────────
add('ki', S(2, 1, '1:2', source='Kiribati flag 1979'))
add('mh', S(57, 30, '10:19', lines=[(0, 30, 57, 0)], source='Marshall Islands flag 1979'))
add('nr', S(24, 12, '1:2', y=[0, 5.5, 6.5, 12], source='Nauru flag 1968: yellow stripe 1/12 of the height on the centre line'))
add('nz', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], centre=False, source='Flags, Emblems and Names Protection Act 1981'))
add('pf', S(12, 8, '2:3', y=[0, 2, 6, 8], source='Organic law 2004-192: white band half the height'))
add('pg', S(4, 3, '3:4', lines=[(0, 0, 4, 3)], source='National Flag of Papua New Guinea Act 1971'))
add('pw', S(16, 10, '5:8', x=[0, 7, 16], gx=[7], circles=[(7, 5, 3)], dims=[('v', 2, 8, 11, '6')],
            source='Palau flag 1981: disc diameter 3/5 of the height, offset towards the hoist'))
add('sb', S(2, 1, '1:2', lines=[(0, 1, 2, 0)], source='Solomon Islands flag 1977'))
add('to', S(96, 48, '1:2', x=[0, 17, 23, 40, 96], y=[0, 9, 15, 24, 48], centre=False,
            source='Constitution of Tonga, art. 47: white canton with red cross'))
add('tv', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], centre=False, source='Tuvalu flag 1997'))
add('vu', S(3, 2, '2:3', source='State Flag and Armorial Bearings Public Declaration: official image 2:3 (3:5 and 19:36 also used)'))
add('ws', S(4, 2, '1:2', x=[0, 2, 4], y=[0, 1, 2], centre=False, source='Flag of Samoa Act 1948'))

# ── Corrections ──────────────────────────────────────────────────────────────
add('nc', S(6, 3, '1:2', y=[0, 1, 2, 3], gx=[2], circles=[(2, 1.5, 0.983)], dims=[('h', 0, 2, 2.75, '2')],
            source='Kanak flag (official alongside the tricolour since 2010): three equal stripes, disc centred 1/3 from the hoist'))

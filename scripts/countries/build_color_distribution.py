"""Répartition des couleurs par pays + camemberts les plus proches.

Entrées
  data/games/camembert.json      parts brutes par drapeau (scripts/games/build_camembert.js)
  meanings.json                  export de countries.color_meanings :
                                 {iso: {clé: [hex, sens_en, sens_fr]}}

Sorties
  data/countries/color_distribution.json   {iso: [{key, hex, pct, en, fr}]}  -> countries.color_distribution
  data/countries/similar_palettes.json     {iso: [iso, iso, iso]}            -> countries.similar_palettes

Chaque part est rattachée à la couleur officielle la plus proche (color_meanings) ;
une teinte trop éloignée (détail d'emblème) prend un nom générique.
Proximité entre deux camemberts : pour chaque part, distance de couleur (« redmean »)
à la part la plus proche de l'autre drapeau, plus l'écart de pourcentage, pondéré par la part ;
mesure symétrisée. gb-nir (même drapeau que gb) n'est proposé à personne.

Usage : python3 scripts/countries/build_color_distribution.py meanings.json
"""
import json
import math
import sys

NAMES = {
    'red': ('Red', 'Rouge'), 'white': ('White', 'Blanc'), 'blue': ('Blue', 'Bleu'),
    'yellow': ('Yellow', 'Jaune'), 'green': ('Green', 'Vert'), 'black': ('Black', 'Noir'),
    'orange': ('Orange', 'Orange'), 'purple': ('Purple', 'Violet'), 'maroon': ('Maroon', 'Bordeaux'),
    'light blue': ('Light blue', 'Bleu clair'), 'brown': ('Brown', 'Marron'), 'grey': ('Grey', 'Gris'),
}
GENERIC = {
    'red': '#D52B1E', 'white': '#FFFFFF', 'blue': '#0033A0', 'light blue': '#75AADB', 'yellow': '#FCD116',
    'green': '#078930', 'black': '#000000', 'orange': '#FF8200', 'purple': '#6A1B9A', 'maroon': '#8D1B3D',
    'brown': '#8B5A2B', 'grey': '#9E9E9E',
}


def rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def cdist(a, b):
    a, b = rgb(a), rgb(b)
    rm = (a[0] + b[0]) / 2
    return math.sqrt((2 + rm / 256) * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + (2 + (255 - rm) / 256) * (a[2] - b[2]) ** 2)


def distribution(slices, meanings):
    acc = {}
    for hx, pct in slices:
        cands = [(cdist(hx, v[0]), k) for k, v in meanings.items() if v and v[0]]
        dist, key = min(cands) if cands else (999, None)
        if dist > 160 or key is None:
            _, key = min((cdist(hx, v), k) for k, v in GENERIC.items())
        e = acc.setdefault(key, {'key': key, 'hex': hx, 'pct': 0, '_b': 0})
        if pct > e['_b']:
            e['hex'], e['_b'] = hx, pct
        e['pct'] = round(e['pct'] + pct, 1)
    rows = sorted(acc.values(), key=lambda e: -e['pct'])
    for e in rows:
        del e['_b']
        e['en'], e['fr'] = NAMES.get(e['key'], (e['key'].title(), e['key']))
    return rows


def one_way(a, b):
    tot = 0
    for ha, pa in a:
        best = min(b, key=lambda x: cdist(ha, x[0]))
        tot += pa / 100 * (cdist(ha, best[0]) / 100 + abs(pa - best[1]) / 20)
    return tot


def main():
    pal = json.load(open('data/games/camembert.json'))
    meanings = json.load(open(sys.argv[1]))
    dist = {iso: distribution(s, meanings.get(iso, {})) for iso, s in pal.items()}
    similar = {}
    for a in pal:
        scored = sorted((one_way(pal[a], pal[b]) + one_way(pal[b], pal[a]), b)
                        for b in pal if b != a and b != 'gb-nir' and not (a == 'gb-nir' and b == 'gb'))
        similar[a] = [b for _, b in scored[:3]]
    json.dump(dist, open('data/countries/color_distribution.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    json.dump(similar, open('data/countries/similar_palettes.json', 'w'), separators=(',', ':'))
    print(len(dist), 'pays')


if __name__ == '__main__':
    main()

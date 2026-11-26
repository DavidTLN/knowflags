// Répartition des couleurs de chaque drapeau, pour le jeu The Camembert Game.
// Usage : npm i --no-save svg-country-flags @resvg/resvg-js
//         node scripts/games/build_camembert.js "fr,de,..." data/games/camembert.json
// Rendu SVG à 600 px sans anticrénelage, couleurs proches regroupées (distance « redmean » < 70),
// teintes sous 1 % ignorées (détails d’emblème), 7 parts au maximum.
const fs = require('fs'), path = require('path')
const { Resvg } = require('@resvg/resvg-js')
const ISOS = process.argv[2].split(',')
const DIR = path.join(path.dirname(require.resolve('svg-country-flags/package.json')), 'svg')
const dist = (a, b) => { const rm = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db) }
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
const out = {}, missing = []
for (const iso of ISOS) {
  const file = path.join(DIR, iso + '.svg')
  if (!fs.existsSync(file)) { missing.push(iso); continue }
  const r = new Resvg(fs.readFileSync(file), { fitTo: { mode: 'width', value: 600 }, shapeRendering: 0, textRendering: 0, imageRendering: 1 }).render()
  const px = r.pixels, counts = new Map(); let total = 0
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue
    const k = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]
    counts.set(k, (counts.get(k) || 0) + 1); total++
  }
  const cols = [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => [[k >> 16, (k >> 8) & 255, k & 255], n])
  const clusters = []
  for (const [c, n] of cols) {
    let best = null, bd = 1e9
    for (const cl of clusters) { const d = dist(c, cl.c); if (d < bd) { bd = d; best = cl } }
    if (best && bd < 70) best.n += n; else clusters.push({ c, n })
  }
  const keep = clusters.filter(cl => cl.n / total >= 0.01).sort((a, b) => b.n - a.n).slice(0, 7)
  const sum = keep.reduce((s, cl) => s + cl.n, 0)
  let slices = keep.map(cl => [hex(cl.c), Math.round(cl.n / sum * 1000) / 10])
  const diff = Math.round((100 - slices.reduce((s, x) => s + x[1], 0)) * 10) / 10
  slices[0][1] = Math.round((slices[0][1] + diff) * 10) / 10
  out[iso] = slices
}
fs.writeFileSync(process.argv[3], JSON.stringify(out))
console.log('flags', Object.keys(out).length, 'missing', missing.join(','))
for (const iso of ['fr','gb','ch','np','mx','br','jp','us','ca','ru','nl','sa','bt','gb-wls','va']) console.log(iso, JSON.stringify(out[iso]))

'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import GameIcon from '@/components/games/GameIcon'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import FlagTemplateBuilder, { renderDesignToCanvas } from '@/components/games/flagdraw/FlagTemplateBuilder'

// ─── Flag definitions — MINIMAL: only name + ratio + hasEmblem ───────────────
const FLAG_DEFS = {
  ad: { en: "Andorra", fr: "Andorre", ratio: 1.4286, hasEmblem: true },
  ae: { en: "United Arab Emirates", fr: "Émirats arabes unis", ratio: 2.0, hasEmblem: false },
  af: { en: "Afghanistan", fr: "Afghanistan", ratio: 2.0, hasEmblem: true },
  ag: { en: "Antigua and Barbuda", fr: "Antigua-et-Barbuda", ratio: 1.5, hasEmblem: true },
  al: { en: "Albania", fr: "Albanie", ratio: 1.4, hasEmblem: true },
  am: { en: "Armenia", fr: "Arménie", ratio: 2.0, hasEmblem: false },
  ao: { en: "Angola", fr: "Angola", ratio: 1.5, hasEmblem: true },
  ar: { en: "Argentina", fr: "Argentine", ratio: 1.5556, hasEmblem: true },
  at: { en: "Austria", fr: "Autriche", ratio: 1.5, hasEmblem: true },
  au: { en: "Australia", fr: "Australie", ratio: 2.0, hasEmblem: true },
  aw: { en: "Aruba", fr: "Aruba", ratio: 1.5, hasEmblem: false },
  ax: { en: "Åland", fr: "Åland", ratio: 1.5, hasEmblem: false },
  az: { en: "Azerbaijan", fr: "Azerbaïdjan", ratio: 2.0, hasEmblem: true },
  ba: { en: "Bosnia and Herzegovina", fr: "Bosnie-Herzégovine", ratio: 2.0, hasEmblem: true },
  bb: { en: "Barbados", fr: "Barbade", ratio: 1.5, hasEmblem: true },
  bd: { en: "Bangladesh", fr: "Bangladesh", ratio: 1.6667, hasEmblem: true },
  be: { en: "Belgium", fr: "Belgique", ratio: 1.1538, hasEmblem: false },
  bf: { en: "Burkina Faso", fr: "Burkina Faso", ratio: 1.5, hasEmblem: true },
  bg: { en: "Bulgaria", fr: "Bulgarie", ratio: 1.6667, hasEmblem: true },
  bh: { en: "Bahrain", fr: "Bahreïn", ratio: 1.6667, hasEmblem: false },
  bi: { en: "Burundi", fr: "Burundi", ratio: 1.6667, hasEmblem: true },
  bj: { en: "Benin", fr: "Bénin", ratio: 1.5, hasEmblem: false },
  bm: { en: "Bermuda", fr: "Bermudes", ratio: 1.5, hasEmblem: false },
  bn: { en: "Brunei", fr: "Brunei", ratio: 2.0, hasEmblem: true },
  bo: { en: "Bolivia", fr: "Bolivie", ratio: 1.5, hasEmblem: true },
  br: { en: "Brazil", fr: "Brésil", ratio: 1.4286, hasEmblem: true },
  bs: { en: "Bahamas", fr: "Bahamas", ratio: 2.0, hasEmblem: false },
  bt: { en: "Bhutan", fr: "Bhoutan", ratio: 1.5, hasEmblem: true },
  bw: { en: "Botswana", fr: "Botswana", ratio: 1.5, hasEmblem: false },
  by: { en: "Belarus", fr: "Biélorussie", ratio: 2.0, hasEmblem: true },
  bz: { en: "Belize", fr: "Belize", ratio: 1.6667, hasEmblem: true },
  ca: { en: "Canada", fr: "Canada", ratio: 2.0, hasEmblem: true },
  cd: { en: "DR Congo", fr: "RD Congo", ratio: 1.3333, hasEmblem: true },
  cf: { en: "Central African Republic", fr: "République centrafricaine", ratio: 1.6667, hasEmblem: true },
  cg: { en: "Republic of the Congo", fr: "République du Congo", ratio: 1.5, hasEmblem: false },
  ch: { en: "Switzerland", fr: "Suisse", ratio: 1.0, hasEmblem: false },
  ci: { en: "Ivory Coast", fr: "Côte d'Ivoire", ratio: 1.5, hasEmblem: false },
  cl: { en: "Chile", fr: "Chili", ratio: 1.5, hasEmblem: true },
  cm: { en: "Cameroon", fr: "Cameroun", ratio: 1.5, hasEmblem: true },
  cn: { en: "China", fr: "Chine", ratio: 1.5, hasEmblem: true },
  co: { en: "Colombia", fr: "Colombie", ratio: 1.5, hasEmblem: true },
  cr: { en: "Costa Rica", fr: "Costa Rica", ratio: 1.6667, hasEmblem: false },
  cu: { en: "Cuba", fr: "Cuba", ratio: 2.0, hasEmblem: true },
  cv: { en: "Cape Verde", fr: "Cap-Vert", ratio: 1.7, hasEmblem: true },
  cw: { en: "Curaçao", fr: "Curaçao", ratio: 1.5, hasEmblem: false },
  cy: { en: "Cyprus", fr: "Chypre", ratio: 1.6667, hasEmblem: true },
  cz: { en: "Czech Republic", fr: "République tchèque", ratio: 1.5, hasEmblem: false },
  de: { en: "Germany", fr: "Allemagne", ratio: 1.6667, hasEmblem: false },
  dj: { en: "Djibouti", fr: "Djibouti", ratio: 1.5, hasEmblem: true },
  dk: { en: "Denmark", fr: "Danemark", ratio: 1.3214, hasEmblem: true },
  dm: { en: "Dominica", fr: "Dominique", ratio: 2.0, hasEmblem: true },
  do: { en: "Dominican Republic", fr: "République dominicaine", ratio: 1.5, hasEmblem: true },
  dz: { en: "Algeria", fr: "Algérie", ratio: 1.5, hasEmblem: true },
  ec: { en: "Ecuador", fr: "Équateur", ratio: 2.0, hasEmblem: true },
  ee: { en: "Estonia", fr: "Estonie", ratio: 1.5714, hasEmblem: false },
  eg: { en: "Egypt", fr: "Égypte", ratio: 1.5, hasEmblem: true },
  er: { en: "Eritrea", fr: "Érythrée", ratio: 2.0, hasEmblem: true },
  es: { en: "Spain", fr: "Espagne", ratio: 1.5, hasEmblem: true },
  et: { en: "Ethiopia", fr: "Éthiopie", ratio: 2.0, hasEmblem: true },
  fi: { en: "Finland", fr: "Finlande", ratio: 1.6364, hasEmblem: false },
  fj: { en: "Fiji", fr: "Fidji", ratio: 2.0, hasEmblem: true },
  fk: { en: "Falkland Islands", fr: "Îles Malouines", ratio: 1.5, hasEmblem: false },
  fm: { en: "Micronesia", fr: "Micronésie", ratio: 1.9, hasEmblem: true },
  fo: { en: "Faroe Islands", fr: "Îles Féroé", ratio: 1.5, hasEmblem: false },
  fr: { en: "France", fr: "France", ratio: 1.5, hasEmblem: false },
  ga: { en: "Gabon", fr: "Gabon", ratio: 1.3333, hasEmblem: false },
  gb: { en: "United Kingdom", fr: "Royaume-Uni", ratio: 2.0, hasEmblem: true },
  gd: { en: "Grenada", fr: "Grenade", ratio: 1.6667, hasEmblem: true },
  ge: { en: "Georgia", fr: "Géorgie", ratio: 1.6667, hasEmblem: true },
  gg: { en: "Guernsey", fr: "Guernesey", ratio: 1.5, hasEmblem: false },
  gh: { en: "Ghana", fr: "Ghana", ratio: 1.5, hasEmblem: true },
  gi: { en: "Gibraltar", fr: "Gibraltar", ratio: 1.5, hasEmblem: false },
  gl: { en: "Greenland", fr: "Groenland", ratio: 1.5, hasEmblem: false },
  gm: { en: "Gambia", fr: "Gambie", ratio: 1.5, hasEmblem: false },
  gn: { en: "Guinea", fr: "Guinée", ratio: 1.5, hasEmblem: false },
  gq: { en: "Equatorial Guinea", fr: "Guinée équatoriale", ratio: 1.5, hasEmblem: true },
  gr: { en: "Greece", fr: "Grèce", ratio: 1.5, hasEmblem: false },
  gt: { en: "Guatemala", fr: "Guatemala", ratio: 1.6, hasEmblem: true },
  gu: { en: "Guam", fr: "Guam", ratio: 1.5, hasEmblem: false },
  gw: { en: "Guinea-Bissau", fr: "Guinée-Bissau", ratio: 2.0, hasEmblem: true },
  gy: { en: "Guyana", fr: "Guyana", ratio: 1.6667, hasEmblem: true },
  hk: { en: "Hong Kong", fr: "Hong Kong", ratio: 1.5, hasEmblem: false },
  hn: { en: "Honduras", fr: "Honduras", ratio: 2.0, hasEmblem: true },
  hr: { en: "Croatia", fr: "Croatie", ratio: 2.0, hasEmblem: true },
  ht: { en: "Haiti", fr: "Haïti", ratio: 1.6667, hasEmblem: true },
  hu: { en: "Hungary", fr: "Hongrie", ratio: 1.5, hasEmblem: false },
  id: { en: "Indonesia", fr: "Indonésie", ratio: 1.5, hasEmblem: false },
  ie: { en: "Ireland", fr: "Irlande", ratio: 2.0, hasEmblem: false },
  il: { en: "Israel", fr: "Israël", ratio: 1.375, hasEmblem: true },
  im: { en: "Isle of Man", fr: "Île de Man", ratio: 1.5, hasEmblem: false },
  in: { en: "India", fr: "Inde", ratio: 1.5, hasEmblem: true },
  iq: { en: "Iraq", fr: "Irak", ratio: 2.0, hasEmblem: true },
  ir: { en: "Iran", fr: "Iran", ratio: 1.75, hasEmblem: true },
  is: { en: "Iceland", fr: "Islande", ratio: 1.3889, hasEmblem: false },
  it: { en: "Italy", fr: "Italie", ratio: 1.5, hasEmblem: true },
  je: { en: "Jersey", fr: "Jersey", ratio: 1.5, hasEmblem: false },
  jm: { en: "Jamaica", fr: "Jamaïque", ratio: 2.0, hasEmblem: false },
  jo: { en: "Jordan", fr: "Jordanie", ratio: 2.0, hasEmblem: true },
  jp: { en: "Japan", fr: "Japon", ratio: 1.5, hasEmblem: true },
  ke: { en: "Kenya", fr: "Kenya", ratio: 1.5, hasEmblem: true },
  kg: { en: "Kyrgyzstan", fr: "Kirghizistan", ratio: 1.6667, hasEmblem: true },
  kh: { en: "Cambodia", fr: "Cambodge", ratio: 1.5, hasEmblem: true },
  ki: { en: "Kiribati", fr: "Kiribati", ratio: 2.0, hasEmblem: true },
  km: { en: "Comoros", fr: "Comores", ratio: 1.6667, hasEmblem: true },
  kn: { en: "Saint Kitts and Nevis", fr: "Saint-Kitts-et-Nevis", ratio: 1.5, hasEmblem: true },
  kp: { en: "North Korea", fr: "Corée du Nord", ratio: 2.0, hasEmblem: true },
  kr: { en: "South Korea", fr: "Corée du Sud", ratio: 1.5, hasEmblem: false },
  kw: { en: "Kuwait", fr: "Koweït", ratio: 2.0, hasEmblem: false },
  ky: { en: "Cayman Islands", fr: "Îles Caïmans", ratio: 1.5, hasEmblem: false },
  kz: { en: "Kazakhstan", fr: "Kazakhstan", ratio: 2.0, hasEmblem: true },
  la: { en: "Laos", fr: "Laos", ratio: 1.5, hasEmblem: true },
  lb: { en: "Lebanon", fr: "Liban", ratio: 1.5, hasEmblem: true },
  lc: { en: "Saint Lucia", fr: "Sainte-Lucie", ratio: 2.0, hasEmblem: false },
  li: { en: "Liechtenstein", fr: "Liechtenstein", ratio: 1.6667, hasEmblem: true },
  lk: { en: "Sri Lanka", fr: "Sri Lanka", ratio: 2.0, hasEmblem: true },
  lr: { en: "Liberia", fr: "Libéria", ratio: 1.9, hasEmblem: true },
  ls: { en: "Lesotho", fr: "Lesotho", ratio: 1.5, hasEmblem: true },
  lt: { en: "Lithuania", fr: "Lituanie", ratio: 1.6667, hasEmblem: true },
  lu: { en: "Luxembourg", fr: "Luxembourg", ratio: 1.6667, hasEmblem: false },
  lv: { en: "Latvia", fr: "Lettonie", ratio: 2.0, hasEmblem: true },
  ly: { en: "Libya", fr: "Libye", ratio: 2.0, hasEmblem: true },
  ma: { en: "Morocco", fr: "Maroc", ratio: 1.5, hasEmblem: true },
  mc: { en: "Monaco", fr: "Monaco", ratio: 1.25, hasEmblem: true },
  md: { en: "Moldova", fr: "Moldavie", ratio: 2.0, hasEmblem: true },
  me: { en: "Montenegro", fr: "Monténégro", ratio: 2.0, hasEmblem: true },
  mg: { en: "Madagascar", fr: "Madagascar", ratio: 1.5, hasEmblem: false },
  mh: { en: "Marshall Islands", fr: "Îles Marshall", ratio: 1.9, hasEmblem: true },
  mk: { en: "North Macedonia", fr: "Macédoine du Nord", ratio: 2.0, hasEmblem: true },
  ml: { en: "Mali", fr: "Mali", ratio: 1.5, hasEmblem: false },
  mm: { en: "Myanmar", fr: "Myanmar", ratio: 1.5, hasEmblem: true },
  mn: { en: "Mongolia", fr: "Mongolie", ratio: 2.0, hasEmblem: true },
  mo: { en: "Macau", fr: "Macao", ratio: 1.5, hasEmblem: false },
  mr: { en: "Mauritania", fr: "Mauritanie", ratio: 1.5, hasEmblem: true },
  mt: { en: "Malta", fr: "Malte", ratio: 1.5, hasEmblem: false },
  mu: { en: "Mauritius", fr: "Maurice", ratio: 1.5, hasEmblem: false },
  mv: { en: "Maldives", fr: "Maldives", ratio: 1.5, hasEmblem: true },
  mw: { en: "Malawi", fr: "Malawi", ratio: 1.5, hasEmblem: true },
  mx: { en: "Mexico", fr: "Mexique", ratio: 1.75, hasEmblem: true },
  my: { en: "Malaysia", fr: "Malaisie", ratio: 2.0, hasEmblem: true },
  mz: { en: "Mozambique", fr: "Mozambique", ratio: 1.5, hasEmblem: true },
  na: { en: "Namibia", fr: "Namibie", ratio: 1.5, hasEmblem: true },
  nc: { en: "New Caledonia", fr: "Nouvelle-Calédonie", ratio: 1.5, hasEmblem: false },
  ne: { en: "Niger", fr: "Niger", ratio: 1.1667, hasEmblem: true },
  ng: { en: "Nigeria", fr: "Nigeria", ratio: 2.0, hasEmblem: false },
  ni: { en: "Nicaragua", fr: "Nicaragua", ratio: 1.6667, hasEmblem: true },
  nl: { en: "Netherlands", fr: "Pays-Bas", ratio: 1.5, hasEmblem: false },
  no: { en: "Norway", fr: "Norvège", ratio: 1.375, hasEmblem: true },
  np: { en: "Nepal", fr: "Népal", ratio: 0.75, hasEmblem: true },
  nr: { en: "Nauru", fr: "Nauru", ratio: 2.0, hasEmblem: true },
  nz: { en: "New Zealand", fr: "Nouvelle-Zélande", ratio: 2.0, hasEmblem: true },
  om: { en: "Oman", fr: "Oman", ratio: 2.0, hasEmblem: true },
  pa: { en: "Panama", fr: "Panama", ratio: 1.5, hasEmblem: true },
  pe: { en: "Peru", fr: "Pérou", ratio: 1.5, hasEmblem: true },
  pf: { en: "French Polynesia", fr: "Polynésie française", ratio: 1.5, hasEmblem: false },
  pg: { en: "Papua New Guinea", fr: "Papouasie-Nouvelle-Guinée", ratio: 1.3333, hasEmblem: true },
  ph: { en: "Philippines", fr: "Philippines", ratio: 2.0, hasEmblem: true },
  pk: { en: "Pakistan", fr: "Pakistan", ratio: 1.5, hasEmblem: true },
  pl: { en: "Poland", fr: "Pologne", ratio: 1.6, hasEmblem: false },
  pr: { en: "Puerto Rico", fr: "Porto Rico", ratio: 1.5, hasEmblem: false },
  ps: { en: "Palestine", fr: "Palestine", ratio: 2.0, hasEmblem: false },
  pt: { en: "Portugal", fr: "Portugal", ratio: 1.5, hasEmblem: true },
  pw: { en: "Palau", fr: "Palaos", ratio: 1.6, hasEmblem: true },
  py: { en: "Paraguay", fr: "Paraguay", ratio: 1.8182, hasEmblem: true },
  qa: { en: "Qatar", fr: "Qatar", ratio: 2.5455, hasEmblem: false },
  ro: { en: "Romania", fr: "Roumanie", ratio: 1.5, hasEmblem: false },
  rs: { en: "Serbia", fr: "Serbie", ratio: 1.5, hasEmblem: true },
  ru: { en: "Russia", fr: "Russie", ratio: 1.5, hasEmblem: false },
  rw: { en: "Rwanda", fr: "Rwanda", ratio: 1.5, hasEmblem: true },
  sa: { en: "Saudi Arabia", fr: "Arabie saoudite", ratio: 1.5, hasEmblem: true },
  sb: { en: "Solomon Islands", fr: "Îles Salomon", ratio: 2.0, hasEmblem: true },
  sc: { en: "Seychelles", fr: "Seychelles", ratio: 2.0, hasEmblem: false },
  sd: { en: "Sudan", fr: "Soudan", ratio: 2.0, hasEmblem: false },
  se: { en: "Sweden", fr: "Suède", ratio: 1.6, hasEmblem: true },
  sg: { en: "Singapore", fr: "Singapour", ratio: 1.5, hasEmblem: true },
  si: { en: "Slovenia", fr: "Slovénie", ratio: 2.0, hasEmblem: true },
  sk: { en: "Slovakia", fr: "Slovaquie", ratio: 1.5, hasEmblem: true },
  sl: { en: "Sierra Leone", fr: "Sierra Leone", ratio: 1.5, hasEmblem: true },
  sm: { en: "San Marino", fr: "Saint-Marin", ratio: 1.3333, hasEmblem: true },
  sn: { en: "Senegal", fr: "Sénégal", ratio: 1.5, hasEmblem: true },
  so: { en: "Somalia", fr: "Somalie", ratio: 1.5, hasEmblem: true },
  sr: { en: "Suriname", fr: "Suriname", ratio: 1.5, hasEmblem: true },
  ss: { en: "South Sudan", fr: "Soudan du Sud", ratio: 2.0, hasEmblem: true },
  st: { en: "São Tomé and Príncipe", fr: "Sao Tomé-et-Principe", ratio: 2.0, hasEmblem: true },
  sv: { en: "El Salvador", fr: "Salvador", ratio: 1.7725, hasEmblem: true },
  sx: { en: "Sint Maarten", fr: "Saint-Martin", ratio: 1.5, hasEmblem: false },
  sy: { en: "Syria", fr: "Syrie", ratio: 1.5, hasEmblem: true },
  sz: { en: "Eswatini", fr: "Eswatini", ratio: 1.5, hasEmblem: true },
  td: { en: "Chad", fr: "Tchad", ratio: 1.5, hasEmblem: false },
  tg: { en: "Togo", fr: "Togo", ratio: 1.618, hasEmblem: true },
  th: { en: "Thailand", fr: "Thaïlande", ratio: 1.5, hasEmblem: false },
  tj: { en: "Tajikistan", fr: "Tadjikistan", ratio: 2.0, hasEmblem: true },
  tl: { en: "East Timor", fr: "Timor oriental", ratio: 2.0, hasEmblem: true },
  tm: { en: "Turkmenistan", fr: "Turkménistan", ratio: 2.0, hasEmblem: true },
  tn: { en: "Tunisia", fr: "Tunisie", ratio: 1.5, hasEmblem: true },
  to: { en: "Tonga", fr: "Tonga", ratio: 2.0, hasEmblem: false },
  tr: { en: "Turkey", fr: "Turquie", ratio: 1.5, hasEmblem: true },
  tt: { en: "Trinidad and Tobago", fr: "Trinité-et-Tobago", ratio: 1.6667, hasEmblem: false },
  tv: { en: "Tuvalu", fr: "Tuvalu", ratio: 2.0, hasEmblem: true },
  tw: { en: "Taiwan", fr: "Taïwan", ratio: 1.5, hasEmblem: true },
  tz: { en: "Tanzania", fr: "Tanzanie", ratio: 1.5, hasEmblem: false },
  ua: { en: "Ukraine", fr: "Ukraine", ratio: 1.5, hasEmblem: false },
  ug: { en: "Uganda", fr: "Ouganda", ratio: 1.5, hasEmblem: true },
  us: { en: "United States", fr: "États-Unis", ratio: 1.9, hasEmblem: true },
  uy: { en: "Uruguay", fr: "Uruguay", ratio: 1.5, hasEmblem: true },
  uz: { en: "Uzbekistan", fr: "Ouzbékistan", ratio: 2.0, hasEmblem: true },
  va: { en: "Vatican City", fr: "Vatican", ratio: 1.0, hasEmblem: true },
  vc: { en: "Saint Vincent and the Grenadines", fr: "Saint-Vincent-et-les-Grenadines", ratio: 1.5, hasEmblem: true },
  ve: { en: "Venezuela", fr: "Venezuela", ratio: 1.5, hasEmblem: true },
  vn: { en: "Vietnam", fr: "Viêt Nam", ratio: 1.5, hasEmblem: true },
  vu: { en: "Vanuatu", fr: "Vanuatu", ratio: 1.9474, hasEmblem: true },
  ws: { en: "Samoa", fr: "Samoa", ratio: 2.0, hasEmblem: true },
  xk: { en: "Kosovo", fr: "Kosovo", ratio: 1.5, hasEmblem: true },
  ye: { en: "Yemen", fr: "Yémen", ratio: 1.5, hasEmblem: false },
  za: { en: "South Africa", fr: "Afrique du Sud", ratio: 1.5, hasEmblem: false },
  zm: { en: "Zambia", fr: "Zambie", ratio: 1.5, hasEmblem: true },
  zw: { en: "Zimbabwe", fr: "Zimbabwe", ratio: 2.0, hasEmblem: true },
}

const FLAG_KEYS = Object.keys(FLAG_DEFS)

// ratio numérique (W/H) -> libellé "W:H" (plus proche ratio de drapeau connu)
function ratioLabel(r) {
  const cands = [[1,1],[5,4],[4,3],[7,5],[3,2],[8,5],[5,3],[7,4],[9,5],[19,10],[2,1],[2,3],[3,5],[5,8],[1,2],[11,20],[28,37]]
  let best = cands[0], bd = Infinity
  for (const [w,h] of cands) { const d = Math.abs(w/h - r); if (d < bd) { bd = d; best = [w,h] } }
  return best[0] + ':' + best[1]
}
function _shuf(a){ const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]} return b }
// fréquence de chaque ratio (nb de drapeaux)
const RATIO_FREQ = (() => {
  const m = new Map()
  for (const k of FLAG_KEYS) {
    const r = FLAG_DEFS[k] && FLAG_DEFS[k].ratio
    if (!r) continue
    const lbl = ratioLabel(r)
    m.set(lbl, (m.get(lbl) || 0) + 1)
  }
  return m
})()
// ratios connus, triés du plus courant au moins courant (mode difficile)
const ALL_RATIOS = (() => {
  const seen = new Map()
  for (const k of FLAG_KEYS) {
    const r = FLAG_DEFS[k] && FLAG_DEFS[k].ratio
    if (!r) continue
    const lbl = ratioLabel(r)
    if (!seen.has(lbl)) seen.set(lbl, [lbl, r])
  }
  return Array.from(seen.values()).sort((a, b) => (RATIO_FREQ.get(b[0]) || 0) - (RATIO_FREQ.get(a[0]) || 0))
})()
const CANVAS_W = 480
const MAX_LIVES = 5
const SCREEN = { SETUP: 'setup', PLAYING: 'playing', RESULT: 'result', GAMEOVER: 'gameover' }
const TOOL = { FILL: 'fill', BRUSH: 'brush', ERASER: 'eraser' }

// ─── Color extraction — k-means++ for reliable palette ───────────────────────
function extractDominantColors(imageData, W, H) {
  const data = imageData.data

  // Sample pixels evenly across the image (skip every 12px for speed)
  const samples = []
  for (let i = 0; i < data.length; i += 48) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
    if (a < 200) continue
    samples.push([r, g, b])
  }
  if (samples.length === 0) return []

  // k-means++ initialization: first centroid random, then pick farthest from existing ones
  const K = 8
  const centroids = []
  centroids.push([...samples[Math.floor(samples.length / 2)]])
  while (centroids.length < K) {
    // For each sample, find distance to nearest centroid
    let maxD = -1, best = 0
    for (let si = 0; si < samples.length; si += 4) {  // stride for speed
      const [r, g, b] = samples[si]
      let minD = Infinity
      for (const [cr, cg, cb] of centroids) {
        const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2
        if (d < minD) minD = d
      }
      if (minD > maxD) { maxD = minD; best = si }
    }
    centroids.push([...samples[best]])
  }

  // k-means iterations
  for (let iter = 0; iter < 15; iter++) {
    const clusters = Array.from({length: K}, () => [])
    for (const [r, g, b] of samples) {
      let best = 0, bestD = Infinity
      for (let ci = 0; ci < K; ci++) {
        const [cr, cg, cb] = centroids[ci]
        const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2
        if (d < bestD) { bestD = d; best = ci }
      }
      clusters[best].push([r, g, b])
    }
    let changed = false
    for (let ci = 0; ci < K; ci++) {
      if (clusters[ci].length === 0) continue
      const n = clusters[ci].length
      const nr = Math.round(clusters[ci].reduce((s,c) => s+c[0], 0) / n)
      const ng = Math.round(clusters[ci].reduce((s,c) => s+c[1], 0) / n)
      const nb = Math.round(clusters[ci].reduce((s,c) => s+c[2], 0) / n)
      if (nr !== centroids[ci][0] || ng !== centroids[ci][1] || nb !== centroids[ci][2]) changed = true
      centroids[ci] = [nr, ng, nb]
    }
    if (!changed) break
  }

  // Count cluster sizes
  const counts = Array(K).fill(0)
  for (const [r, g, b] of samples) {
    let best = 0, bestD = Infinity
    for (let ci = 0; ci < K; ci++) {
      const [cr, cg, cb] = centroids[ci]
      const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2
      if (d < bestD) { bestD = d; best = ci }
    }
    counts[best]++
  }

  return centroids
    .map(([r, g, b], i) => ({ r, g, b, count: counts[i], hex: rgbToHex(r, g, b) }))
    .filter(c => c.count > samples.length * 0.015)  // at least 1.5% of pixels
    .sort((a, b) => b.count - a.count)
    // Deduplicate: keep only colours far enough apart (distance >= 25)
    .filter((c, i, arr) => {
      for (let j = 0; j < i; j++) {
        if (colorDistance(arr[j].r, arr[j].g, arr[j].b, c.r, c.g, c.b) < 25) return false
      }
      return true
    })
    .slice(0, 6)
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return [r, g, b]
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
}






// ─── Flood fill ───────────────────────────────────────────────────────────────
function floodFill(imageData, W, H, startX, startY, fillHex) {
  const [fr, fg, fb] = hexToRgb(fillHex)
  const d = imageData.data
  const idx = (x, y) => (y * W + x) * 4
  const si = idx(startX, startY)
  const tr = d[si], tg = d[si+1], tb = d[si+2]

  if (colorDistance(tr,tg,tb, fr,fg,fb) < 8) return

  const stack = [[startX, startY]]
  const visited = new Uint8Array(W * H)

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= W || y < 0 || y >= H) continue
    const vi = y * W + x
    if (visited[vi]) continue
    const pi = vi * 4
    const r = d[pi], g = d[pi+1], b = d[pi+2]
    if (colorDistance(r,g,b, tr,tg,tb) > 45) continue
    visited[vi] = 1
    d[pi] = fr; d[pi+1] = fg; d[pi+2] = fb; d[pi+3] = 255
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])
  }
}

// ─── Comparison ───────────────────────────────────────────────────────────────
// ─── Comparison — downscaled grid + CIELAB ΔE (spatially tolerant, perceptual) ─
function srgbToLab(r, g, b) {
  let R = r/255, G = g/255, B = b/255
  R = R > 0.04045 ? ((R+0.055)/1.055)**2.4 : R/12.92
  G = G > 0.04045 ? ((G+0.055)/1.055)**2.4 : G/12.92
  B = B > 0.04045 ? ((B+0.055)/1.055)**2.4 : B/12.92
  let X = (R*0.4124 + G*0.3576 + B*0.1805) / 0.95047
  let Y = (R*0.2126 + G*0.7152 + B*0.0722)
  let Z = (R*0.0193 + G*0.1192 + B*0.9505) / 1.08883
  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116)
  const fx = f(X), fy = f(Y), fz = f(Z)
  return [116*fy - 16, 500*(fx-fy), 200*(fy-fz)]
}

function comparePixels(drawData, refData, hasEmblem = false) {
  const W = drawData.width, H = drawData.height
  const d1 = drawData.data, d2 = refData.data
  const B = 10                                  // block size → spatial tolerance
  const gw = Math.max(1, Math.round(W / B))
  const gh = Math.max(1, Math.round(H / B))
  const FORGIVE = 24                            // ΔE en-dessous = même couleur (nuance) -> plein crédit
  const DE_SPAN = 60                            // au-delà de FORGIVE, descente jusqu'à 0 sur DE_SPAN
  let acc = 0, totalW = 0
  for (let gy = 0; gy < gh; gy++) {
    const y0 = Math.floor(gy*H/gh), y1 = Math.floor((gy+1)*H/gh)
    for (let gx = 0; gx < gw; gx++) {
      const x0 = Math.floor(gx*W/gw), x1 = Math.floor((gx+1)*W/gw)
      let r1=0,g1=0,b1=0,r2=0,g2=0,b2=0,n=0
      for (let y=y0; y<y1; y++) {
        for (let x=x0; x<x1; x++) {
          const i = (y*W+x)*4
          r1+=d1[i]; g1+=d1[i+1]; b1+=d1[i+2]
          r2+=d2[i]; g2+=d2[i+1]; b2+=d2[i+2]
          n++
        }
      }
      if (n === 0) continue
      const l1 = srgbToLab(r1/n, g1/n, b1/n)
      const l2 = srgbToLab(r2/n, g2/n, b2/n)
      const dE = Math.sqrt((l1[0]-l2[0])**2 + (l1[1]-l2[1])**2 + (l1[2]-l2[2])**2)
      const sim = dE <= FORGIVE ? 1 : Math.max(0, 1 - (dE - FORGIVE) / DE_SPAN)
      // Emblem flags: the central emblem is unreasonable to draw by hand → weight it down
      let w = 1
      if (hasEmblem) {
        const cx = (gx+0.5)/gw, cy = (gy+0.5)/gh
        if (Math.abs(cx-0.5) < 0.22 && Math.abs(cy-0.5) < 0.30) w = 0.35
      }
      acc += sim * w
      totalW += w
    }
  }
  if (totalW === 0) return 0
  return Math.min(100, Math.round((acc / totalW) * 100))
}

// ─── Score formula ────────────────────────────────────────────────────────────
const DIFF_MULT = { easy: 1, medium: 1.5, hard: 2, extreme: 3 }
function calcPoints(pct, streak, diff) {
  return Math.round(100 * (pct/100)**1.5 * Math.pow(1.1, streak) * (DIFF_MULT[diff]||1))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FlagDrawingV2() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen] = useState(SCREEN.SETUP)
  const screenRef = useRef(SCREEN.SETUP)
  useEffect(() => { screenRef.current = screen }, [screen])
  // Bouton/geste retour : revenir à la sélection de difficulté au lieu de quitter la page
  useEffect(() => {
    window.history.pushState({ kfGuard: true }, '')
    const onPop = () => {
      if (screenRef.current !== SCREEN.SETUP) {
        setScreen(SCREEN.SETUP)
        window.history.pushState({ kfGuard: true }, '')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const [difficulty, setDifficulty] = useState('easy')
  const [isMobile, setIsMobile] = useState(false)

  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [lastPts, setLastPts] = useState(null)
  const [currentKey, setCurrentKey] = useState(null)
  const [score, setScore] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshotUrl, setSnapshotUrl] = useState(null)

  const [activeTool, setActiveTool] = useState(TOOL.FILL)
  const [activeColor, setActiveColor] = useState('#CE1126')
  const [brushSize, setBrushSize] = useState(8)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lineStart, setLineStart] = useState(null)
  const [customColor, setCustomColor] = useState('#CE1126')

  const [user, setUser] = useState(null)
  const [diffStats, setDiffStats] = useState({})

  const [palette, setPalette] = useState([])
  const [flagLoading, setFlagLoading] = useState(false)

  const drawingCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const refCanvasRef = useRef(null)
  const refDataRef = useRef(null)   // ImageData du vrai drapeau (indépendant du canvas monté)
  const refDimsRef = useRef(null)
  const queueRef = useRef([])
  const livesRef = useRef(MAX_LIVES)
  const streakRef = useRef(0)
  const undoStack = useRef([])
  const [undoCount, setUndoCount] = useState(0)
  const [showShapesDrawer, setShowShapesDrawer] = useState(false)
  // showShapesDrawer kept for desktop compat but unused on mobile now
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const cfg = {
    easy:    { showName: true,  ghost: true  },
    medium:  { showName: true,  ghost: false },
    hard:    { showName: true,  ghost: false },
    extreme: { showName: true,  ghost: false },
  }[difficulty]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadDiffStats(supabase, u.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadDiffStats(supabase, u.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadDiffStats(supabase, userId) {
    const { data } = await supabase
      .from('game_scores')
      .select('mode, best_streak')
      .eq('user_id', userId)
      .like('mode', 'flag_drawing_%')
    if (data) {
      const map = {}
      data.forEach(row => {
        const diff = row.mode.replace('flag_drawing_', '')
        map[diff] = { best: row.best_streak }
      })
      setDiffStats(map)
    }
  }

  async function logScore(score) {
    if (!score || score <= 0) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({
        user_id:   user.id,
        game:      'flag-drawing',
        score:     score,
        played_at: new Date().toISOString(),
      })
    } catch (e) { console.error('logScore error:', e) }
  }

  async function saveDiffScore(diff, score) {
    if (!user || score === 0) return
    const supabase = createClient()
    const key = `flag_drawing_${diff}`
    const prev = diffStats[diff]?.best ?? 0
    if (score <= prev) return
    await supabase.from('game_scores').upsert({
      user_id: user.id,
      mode: key,
      best_streak: score,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,mode' })
    await logScore(score)
    setDiffStats(prev => ({ ...prev, [diff]: { best: score } }))
  }

  async function quitGame() {
    await saveDiffScore(difficulty, totalScore)
    setScreen(SCREEN.SETUP)
  }

  const loadFlag = useCallback((key) => {
    setCurrentKey(key)
    setScore(null)
    setSnapshotUrl(null)
    setFlagLoading(true)
    undoStack.current = []
    setUndoCount(0)
    setPalette([])

    const def = FLAG_DEFS[key]
    if (!def) return

    const W = CANVAS_W
    const H = Math.round(W / def.ratio)

    for (const ref of [drawingCanvasRef, overlayCanvasRef, refCanvasRef]) {
      if (ref.current) { ref.current.width = W; ref.current.height = H }
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const refCtx = refCanvasRef.current?.getContext('2d')
      if (refCtx) {
        refCtx.clearRect(0, 0, W, H)
        refCtx.drawImage(img, 0, 0, W, H)
      }

      const colorCanvas = document.createElement('canvas')
      colorCanvas.width = W; colorCanvas.height = H
      const colorCtx = colorCanvas.getContext('2d')
      colorCtx.drawImage(img, 0, 0, W, H)
      const imgData = colorCtx.getImageData(0, 0, W, H)
      refDataRef.current = imgData
      refDimsRef.current = { W, H }
      const extracted = extractDominantColors(imgData, W, H)
      // Use raw hex directly — vibrantHex over-saturates yellows into orange etc.
      const newPalette = extracted.map((c) => ({
        hex: c.hex,
        label: '',
      }))
      setPalette(newPalette)
      if (newPalette.length > 0) setActiveColor(newPalette[0].hex)

      const drawCtx = drawingCanvasRef.current?.getContext('2d')
      if (!drawCtx) { setFlagLoading(false); return }

      // Always start with a blank white canvas
      drawCtx.fillStyle = '#FFFFFF'
      drawCtx.fillRect(0, 0, W, H)

      const ov = overlayCanvasRef.current
      if (ov) ov.getContext('2d').clearRect(0, 0, W, H)

      setFlagLoading(false)
    }
    img.onerror = () => setFlagLoading(false)
    img.src = `https://flagcdn.com/w320/${key}.png`
  }, [difficulty, cfg])

  function startGame() {
    livesRef.current = MAX_LIVES
    streakRef.current = 0
    setLives(MAX_LIVES)
    setStreak(0)
    setTotalScore(0)
    setLastPts(null)
    setHistory([])
    const queue = shuffle(FLAG_KEYS)
    queueRef.current = queue
    setScreen(SCREEN.PLAYING)
    setTimeout(() => loadFlag(queue[0]), 80)
  }

  function nextFlag() {
    const queue = queueRef.current.slice(1)
    queueRef.current = queue
    if (queue.length === 0) {
      setScreen(SCREEN.GAMEOVER)
      return
    }
    setScreen(SCREEN.PLAYING)
    setTimeout(() => loadFlag(queue[0]), 80)
  }

  function retryFlag() {
    undoStack.current = []
    loadFlag(currentKey)
  }

  function saveUndo() {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.current = [...undoStack.current.slice(-19), snapshot]
    setUndoCount(undoStack.current.length)
  }

  function undo() {
    if (undoStack.current.length === 0) return
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const last = undoStack.current[undoStack.current.length - 1]
    undoStack.current = undoStack.current.slice(0, -1)
    ctx.putImageData(last, 0, 0)
    setUndoCount(undoStack.current.length)
  }

  function stampShape(shape) {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    saveUndo()
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = activeColor
    ctx.strokeStyle = activeColor

    switch (shape) {
      // ── Bandes horizontales (tiers) ──
      case 'h-stripe-top':
        ctx.fillRect(0, 0, W, Math.round(H / 3))
        break
      case 'h-stripe-mid':
        ctx.fillRect(0, Math.round(H / 3), W, Math.round(H / 3))
        break
      case 'h-stripe-bot':
        ctx.fillRect(0, Math.round(2 * H / 3), W, Math.round(H / 3))
        break
      // ── Bandes verticales (tiers) ──
      case 'v-stripe-left':
        ctx.fillRect(0, 0, Math.round(W / 3), H)
        break
      case 'v-stripe-mid':
        ctx.fillRect(Math.round(W / 3), 0, Math.round(W / 3), H)
        break
      case 'v-stripe-right':
        ctx.fillRect(Math.round(2 * W / 3), 0, Math.round(W / 3), H)
        break
      // ── Moitiés ──
      case 'left-half':
        ctx.fillRect(0, 0, Math.round(W / 2), H)
        break
      case 'right-half':
        ctx.fillRect(Math.round(W / 2), 0, Math.round(W / 2), H)
        break
      case 'top-half':
        ctx.fillRect(0, 0, W, Math.round(H / 2))
        break
      case 'bottom-half':
        ctx.fillRect(0, Math.round(H / 2), W, Math.round(H / 2))
        break
      // ── Bandes centrales (croix) ──
      case 'cross-h':
        ctx.fillRect(0, Math.round(H * 0.38), W, Math.round(H * 0.24))
        break
      case 'cross-v':
        ctx.fillRect(Math.round(W * 0.38), 0, Math.round(W * 0.24), H)
        break
      // ── Croix nordique (barre verticale décalée à 2/5 gauche) ──
      case 'cross-nordic': {
        const armW = Math.round(Math.min(W, H) * 0.18)
        const vx = Math.round(W * 0.38) - Math.round(armW / 2)  // décalée vers la gauche
        const hy = Math.round(H / 2) - Math.round(armW / 2)
        ctx.fillRect(0, hy, W, armW)           // barre horizontale pleine largeur
        ctx.fillRect(vx, 0, armW, H)           // barre verticale décalée gauche
        break
      }
      // ── Croix grecque (centrée, épaisseur ~20%) ──
      case 'cross-greek': {
        const arm = Math.round(Math.min(W, H) * 0.20)
        const cx = Math.round((W - arm) / 2)
        const cy = Math.round((H - arm) / 2)
        const size = Math.round(Math.min(W, H) * 0.6)
        const ox = Math.round((W - size) / 2)
        const oy = Math.round((H - size) / 2)
        ctx.fillRect(ox, cy, size, arm)
        ctx.fillRect(cx, oy, arm, size)
        break
      }
      // ── Diagonales ──
      case 'diag-left': {
        ctx.lineWidth = Math.round(Math.min(W, H) * 0.18)
        ctx.lineCap = 'square'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(W, H)
        ctx.stroke()
        break
      }
      case 'diag-right': {
        ctx.lineWidth = Math.round(Math.min(W, H) * 0.18)
        ctx.lineCap = 'square'
        ctx.beginPath()
        ctx.moveTo(W, 0)
        ctx.lineTo(0, H)
        ctx.stroke()
        break
      }
      // ── Saltire (croix de Saint-André) ──
      case 'saltire': {
        ctx.lineWidth = Math.round(Math.min(W, H) * 0.18)
        ctx.lineCap = 'square'
        ctx.beginPath()
        ctx.moveTo(0, 0); ctx.lineTo(W, H)
        ctx.moveTo(W, 0); ctx.lineTo(0, H)
        ctx.stroke()
        break
      }
      // ── Triangles ──
      case 'tri-left': {
        ctx.beginPath()
        ctx.moveTo(0, 0); ctx.lineTo(Math.round(W / 2), Math.round(H / 2)); ctx.lineTo(0, H)
        ctx.closePath(); ctx.fill()
        break
      }
      case 'tri-right': {
        ctx.beginPath()
        ctx.moveTo(W, 0); ctx.lineTo(Math.round(W / 2), Math.round(H / 2)); ctx.lineTo(W, H)
        ctx.closePath(); ctx.fill()
        break
      }
      case 'tri-top': {
        ctx.beginPath()
        ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(Math.round(W / 2), Math.round(H / 2))
        ctx.closePath(); ctx.fill()
        break
      }
      case 'tri-bot': {
        ctx.beginPath()
        ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(Math.round(W / 2), Math.round(H / 2))
        ctx.closePath(); ctx.fill()
        break
      }
      // ── Chevron gauche (triangle depuis le bord gauche, ~40% de largeur) ──
      case 'chevron-left': {
        const tip = Math.round(W * 0.42)
        ctx.beginPath()
        ctx.moveTo(0, 0); ctx.lineTo(tip, Math.round(H / 2)); ctx.lineTo(0, H)
        ctx.closePath(); ctx.fill()
        break
      }
      // ── Cercles ──
      case 'circle': {
        const r = Math.round(Math.min(W, H) * 0.22)
        ctx.beginPath()
        ctx.arc(Math.round(W / 2), Math.round(H / 2), r, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'circle-sm': {
        const r = Math.round(Math.min(W, H) * 0.13)
        ctx.beginPath()
        ctx.arc(Math.round(W / 2), Math.round(H / 2), r, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      default:
        break
    }
  }

  function validate() {
    const drawCanvas = drawingCanvasRef.current
    const refCanvas = refCanvasRef.current
    if (!drawCanvas || !refCanvas) return

    const W = drawCanvas.width, H = drawCanvas.height
    const snap = drawCanvas.toDataURL('image/png')

    const drawCtx = drawCanvas.getContext('2d')
    const refCtx = refCanvas.getContext('2d')
    const drawData = drawCtx.getImageData(0, 0, W, H)
    const refData = refCtx.getImageData(0, 0, W, H)

    const sim = comparePixels(drawData, refData, FLAG_DEFS[currentKey]?.hasEmblem)
    finishRound(sim, snap)
  }

  // Logique de score commune (dessin libre ET gabarit)
  function finishRound(sim, snap) {
    setScore(sim)
    const passed = sim >= 55
    const pts = passed ? calcPoints(sim, streakRef.current, difficulty) : 0
    let newTotal = totalScore
    if (passed) {
      newTotal = totalScore + pts
      setTotalScore(newTotal)
      streakRef.current++
      setStreak(streakRef.current)
    } else {
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setSnapshotUrl(snap)
        saveDiffScore(difficulty, newTotal)
        setTimeout(() => setScreen(SCREEN.GAMEOVER), 1800)
        return
      }
    }
    setLastPts(passed ? pts : null)
    setHistory(prev => [...prev, { key: currentKey, score: sim, passed, pts }])
    setSnapshotUrl(snap)
    setScreen(SCREEN.RESULT)
  }

  // Validation en mode gabarit : on rasterise le design puis on compare au vrai drapeau
  function handleTemplateValidate(design) {
    const refData = refDataRef.current, dims = refDimsRef.current
    if (!refData || !dims) return
    const { W, H } = dims
    const tmp = document.createElement('canvas')
    tmp.width = W; tmp.height = H
    renderDesignToCanvas(tmp, design, null)
    const drawData = tmp.getContext('2d').getImageData(0, 0, W, H)
    const sim = comparePixels(drawData, refData, FLAG_DEFS[currentKey]?.hasEmblem)
    finishRound(sim, tmp.toDataURL('image/png'))
  }

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    return { x: Math.round((cx - rect.left) * sx), y: Math.round((cy - rect.top) * sy) }
  }

  function handleDown(e) {
    e.preventDefault()
    if (score !== null || flagLoading) return
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)
    setIsDrawing(true)
    saveUndo()

    if (activeTool === TOOL.FILL) {
      const ctx = canvas.getContext('2d')
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      floodFill(imgData, canvas.width, canvas.height, pos.x, pos.y, activeColor)
      ctx.putImageData(imgData, 0, 0)
    } else if (activeTool === TOOL.BRUSH) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = activeColor
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, brushSize/2, 0, Math.PI*2)
      ctx.fill()
      setLineStart(pos)
    } else if (activeTool === TOOL.ERASER) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI*2)
      ctx.fill()
      setLineStart(pos)
    }
  }

  function handleMove(e) {
    e.preventDefault()
    if (!isDrawing || score !== null) return
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)

    if (activeTool === TOOL.BRUSH && lineStart) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = activeColor
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lineStart.x, lineStart.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setLineStart(pos)
    } else if (activeTool === TOOL.ERASER && lineStart) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = brushSize * 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lineStart.x, lineStart.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setLineStart(pos)
    }
  }

  function handleUp(e) {
    e.preventDefault()
    setIsDrawing(false)
    setLineStart(null)
    const ov = overlayCanvasRef.current
    if (ov) ov.getContext('2d').clearRect(0, 0, ov.width, ov.height)
  }

  const colors = {
    bg: '#F4F1E6',
    navy: '#16324F',
    accent: '#9EB7E5',
    green: '#426A5A',
    gold: '#806D40',
    card: '#FFFFFF',
    border: '#D9D5C9',
    muted: '#7A7568',
  }

  const def = currentKey ? FLAG_DEFS[currentKey] : null
  const flagName = def ? (locale === 'fr' ? def.fr : def.en) : ''

  // ── SETUP screen ──────────────────────────────────────────────────────────
  const quitModal = showQuitConfirm ? (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <div style={{ width: '36px', height: '4px', backgroundColor: colors.border, borderRadius: '99px', margin: '0 auto 20px' }} />
        <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: colors.navy, textAlign: 'center' }}>{t('Quit the game?', 'Quitter la partie ?')}</h3>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: colors.muted, lineHeight: 1.6, textAlign: 'center' }}>{t(`Your score of ${totalScore} pts will be saved.`, `Ton score de ${totalScore} pts sera sauvegardé.`)}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
          <button onClick={() => { setShowQuitConfirm(false); quitGame() }} style={{ width: '100%', padding: '16px', backgroundColor: colors.navy, color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>{t('Quit & save', 'Quitter et sauvegarder')}</button>
          <button onClick={() => setShowQuitConfirm(false)} style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: colors.navy, border: `1.5px solid ${colors.border}`, borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{t('Keep playing', 'Continuer')}</button>
        </div>
      </div>
    </div>
  ) : null

  if (screen === SCREEN.SETUP) {
    return (
      <div style={{ height: 'calc(100dvh - 60px)', background: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '8px' }}>🎨</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: colors.navy, margin: 0, fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
                {t('Flag Drawing', 'Dessin de drapeaux')}
              </h1>
              <span style={{ fontSize: '11px', background: colors.navy, color: '#FFF', borderRadius: '5px', padding: '2px 7px', fontFamily: 'var(--font-body), system-ui, sans-serif', fontWeight: 600 }}>v2</span>
            </div>
            <p style={{ color: colors.muted, fontSize: '13px', marginTop: '5px', marginBottom: 0 }}>
              {t('Colors auto-extracted from real flags', 'Couleurs extraites automatiquement des vrais drapeaux')}
            </p>
          </div>

          <p style={{ fontSize: '12px', fontWeight: '700', color: colors.navy, marginBottom: '10px', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('Difficulty', 'Difficulté')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { key: 'easy',    icon: '🟢', en: 'Easy',    fr: 'Facile',    descEn: 'Template + auto symbol', descFr: 'Gabarit + symbole auto' },
              { key: 'medium',  icon: '🟡', en: 'Medium',  fr: 'Moyen',     descEn: 'Template to color',   descFr: 'Gabarit à colorier' },
              { key: 'hard',    icon: '🟠', en: 'Hard',    fr: 'Difficile', descEn: 'Template, no help',   descFr: 'Gabarit, sans aide' },
              { key: 'extreme', icon: '🔴', en: 'Extreme', fr: 'Extrême',   descEn: 'Freehand, ×3 pts',    descFr: 'Dessin libre, ×3 pts' },
            ].filter(d => d.key !== 'extreme').map(d => {
              const best = diffStats[d.key]?.best
              const selected = difficulty === d.key
              return (
                <button key={d.key} onClick={() => setDifficulty(d.key)} style={{
                  padding: '14px', borderRadius: '14px',
                  border: selected ? `2px solid ${colors.navy}` : `2px solid ${colors.border}`,
                  background: selected ? colors.navy : colors.bg,
                  color: selected ? '#FFF' : colors.navy,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{d.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{locale === 'fr' ? d.fr : d.en}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '3px' }}>{locale === 'fr' ? d.descFr : d.descEn}</div>
                  {best > 0 && (
                    <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px', color: selected ? 'rgba(255,255,255,0.7)' : colors.muted }}>
                      ⭐ {best}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sticky start button */}
        <div style={{ padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: '#FFFFFF', borderTop: `1px solid ${colors.border}` }}>
          <button onClick={startGame} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: colors.navy, color: '#FFF', fontSize: '16px', fontWeight: '700',
            cursor: 'pointer', fontFamily: 'var(--font-body), system-ui, sans-serif',
          }}>
            {t('Start', 'Commencer')}
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYING screen ────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING) {
    if (difficulty !== 'extreme') {
      const tR = (FLAG_DEFS[currentKey] && FLAG_DEFS[currentKey].ratio) || 1.5
      const tLbl = ratioLabel(tR)
      let ratioChoices, showRatio
      if (difficulty === 'easy') {
        showRatio = false
        ratioChoices = [[tLbl, tR]]
      } else if (difficulty === 'medium') {
        showRatio = true
        const others = _shuf(ALL_RATIOS.filter(([l]) => l !== tLbl)).slice(0, 3)
        ratioChoices = [[tLbl, tR], ...others].sort((a, b) => (RATIO_FREQ.get(b[0]) || 0) - (RATIO_FREQ.get(a[0]) || 0))
      } else {
        showRatio = true
        ratioChoices = ALL_RATIOS
      }
      return (
        <>
          <FlagTemplateBuilder key={currentKey} locale={locale} countryName={flagName} symbolUrl={null}
            ratioChoices={ratioChoices} showRatio={showRatio}
            symbolAuto={difficulty === 'easy'} symbolPickColor={difficulty === 'hard'} symbolColor={'#F4B400'} hasSymbol={!!(FLAG_DEFS[currentKey] && FLAG_DEFS[currentKey].hasEmblem)}
            onValidate={handleTemplateValidate} onQuit={() => setShowQuitConfirm(true)} />
          {quitModal}
        </>
      )
    }
    const canvasH = def ? Math.round(CANVAS_W / def.ratio) : 320
    const canvasDisplayW = isMobile ? Math.min(CANVAS_W, window.innerWidth - 24) : CANVAS_W
    const canvasDisplayH = def ? Math.round(canvasDisplayW / def.ratio) : 320

    const SHAPES = [
      // ── Rectangles / bandes ──
      { key: 'h-stripe-top',      label: '▬ Haut',       labelEn: '▬ Top'          },
      { key: 'h-stripe-mid',      label: '▬ Milieu',     labelEn: '▬ Middle'       },
      { key: 'h-stripe-bot',      label: '▬ Bas',        labelEn: '▬ Bottom'       },
      { key: 'v-stripe-left',     label: '◼ Gauche',     labelEn: '◼ Left'         },
      { key: 'v-stripe-mid',      label: '◼ Centre',     labelEn: '◼ Center'       },
      { key: 'v-stripe-right',    label: '◼ Droite',     labelEn: '◼ Right'        },
      { key: 'left-half',         label: '◧ ½ Gauche',   labelEn: '◧ Left half'    },
      { key: 'right-half',        label: '◨ ½ Droite',   labelEn: '◨ Right half'   },
      { key: 'top-half',          label: '⬒ ½ Haut',     labelEn: '⬒ Top half'     },
      { key: 'bottom-half',       label: '⬓ ½ Bas',      labelEn: '⬓ Bottom half'  },
      // ── Croix ──
      { key: 'cross-h',           label: '— Bande H',    labelEn: '— H-Band'       },
      { key: 'cross-v',           label: '| Bande V',    labelEn: '| V-Band'       },
      { key: 'cross-nordic',      label: '✛ Croix Nord', labelEn: '✛ Nordic cross' },
      { key: 'cross-greek',       label: '✚ Croix Gr',   labelEn: '✚ Greek cross'  },
      // ── Diagonales ──
      { key: 'diag-left',         label: '╲ Diag ╲',     labelEn: '╲ Diag ╲'      },
      { key: 'diag-right',        label: '╱ Diag ╱',     labelEn: '╱ Diag ╱'      },
      { key: 'saltire',           label: '✕ Saltire',    labelEn: '✕ Saltire'      },
      // ── Triangles ──
      { key: 'tri-left',          label: '◀ Tri G',      labelEn: '◀ Left tri'     },
      { key: 'tri-right',         label: '▶ Tri D',      labelEn: '▶ Right tri'    },
      { key: 'tri-top',           label: '▲ Tri H',      labelEn: '▲ Top tri'      },
      { key: 'tri-bot',           label: '▼ Tri B',      labelEn: '▼ Bottom tri'   },
      { key: 'chevron-left',      label: '❮ Chevron',    labelEn: '❮ Chevron'      },
      // ── Cercle ──
      { key: 'circle',            label: '⭕ Cercle',     labelEn: '⭕ Circle'       },
      { key: 'circle-sm',         label: '🔵 Cercle S',  labelEn: '🔵 Small circle' },
    ]

    if (isMobile) {
      return (
        <div style={{ height: 'calc(100dvh - 60px)', background: colors.bg, fontFamily: 'var(--font-body), system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Lives */}
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({length: MAX_LIVES}).map((_, i) => (
                <GameIcon key={i} name="heart" filled size={16} color="#D62828" style={{ opacity: i < lives ? 1 : 0.25 }} />
              ))}
            </div>
            {/* Flag name */}
            {cfg.showName && flagName && (
              <span style={{ flex: 1, fontSize: '14px', fontWeight: '800', color: colors.navy, textAlign: 'center', fontFamily: 'var(--font-display), system-ui, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{flagName}</span>
            )}
            {(!cfg.showName || !flagName) && <div style={{ flex: 1 }} />}
            {/* Streak + score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {streak > 1 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: '800', color: '#E65C00' }}><GameIcon name="flame" filled size={13} color="#E65C00" />{streak}</span>}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: colors.navy, color: '#FFF', borderRadius: '99px', padding: '3px 10px', fontSize: '12px', fontWeight: '700' }}><GameIcon name="sparkle" filled size={12} color="#F4B400" />{totalScore}</div>
            </div>
            {/* Quit button */}
            <button onClick={() => setShowQuitConfirm(true)} aria-label="Quitter" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(11,31,59,0.08)', border: '1px solid rgba(11,31,59,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: colors.muted, flexShrink: 0 }}><GameIcon name="close" size={18} color={colors.muted} /></button>
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative', margin: '8px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: `${100 / (def?.ratio ?? 1.5)}%` }}>
              <canvas ref={drawingCanvasRef} width={CANVAS_W} height={canvasH}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '10px', border: `2px solid ${colors.border}`, touchAction: 'none', cursor: 'crosshair' }}
                onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp}
                onTouchStart={handleDown} onTouchMove={handleMove} onTouchEnd={handleUp}
              />
              <canvas ref={overlayCanvasRef} width={CANVAS_W} height={canvasH}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '10px', pointerEvents: 'none' }}
              />
              {cfg.ghost && currentKey && !flagLoading && (
                <img src={`https://flagcdn.com/w320/${currentKey}.png`} alt="" aria-hidden="true"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '10px', opacity: 0.22, pointerEvents: 'none', objectFit: 'fill' }} />
              )}
              {flagLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,241,230,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                  <span style={{ fontSize: '13px', color: colors.muted, fontWeight: 600 }}>{t('Analyzing…', 'Analyse…')}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0, background: colors.card, borderTop: `1px solid ${colors.border}`, padding: '8px 14px 10px' }}>

            {/* ── Shapes row — scrollable ── */}
            <div style={{ fontSize: '10px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
              {t('Shapes', 'Formes')}
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {SHAPES.map(s => (
                <button key={s.key} onClick={() => stampShape(s.key)} style={{
                  flexShrink: 0, padding: '5px 10px', borderRadius: '8px',
                  border: `1.5px solid ${colors.border}`, background: '#FAFAF7',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: '700', color: colors.navy, whiteSpace: 'nowrap',
                }}>
                  <span style={{ width: '10px', height: '10px', background: activeColor, borderRadius: '2px', flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                  {locale === 'fr' ? s.label : s.labelEn}
                </button>
              ))}
            </div>

            {/* ── Colours row ── */}
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '8px' }}>
              {palette.map(c => (
                <button key={c.hex} onClick={() => { setActiveColor(c.hex); setActiveTool(TOOL.FILL) }} style={{
                  width: '36px', height: '36px', borderRadius: '9px', background: c.hex, flexShrink: 0,
                  border: activeColor === c.hex ? `3px solid ${colors.navy}` : '1.5px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  boxShadow: activeColor === c.hex ? `0 0 0 2px white, 0 0 0 4px ${colors.navy}` : 'none',
                  transition: 'all 0.12s',
                }} />
              ))}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <input type="color" value={customColor}
                  onChange={e => { setCustomColor(e.target.value); setActiveColor(e.target.value); setActiveTool(TOOL.FILL) }}
                  style={{ width: '36px', height: '36px', borderRadius: '9px', border: `1.5px solid rgba(0,0,0,0.15)`, cursor: 'pointer', padding: '2px', background: customColor, opacity: 0, position: 'absolute', inset: 0 }}
                />
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: customColor, border: activeColor === customColor && !palette.find(p => p.hex === customColor) ? `3px solid ${colors.navy}` : '1.5px solid rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '14px', color: 'white', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>+</span>
                </div>
              </div>
              {(activeTool === TOOL.BRUSH || activeTool === TOOL.ERASER) && (
                <input type="range" min="2" max="24" value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ flex: 1 }} />
              )}
            </div>

            {/* ── Tools row ── */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
              {[
                { key: TOOL.FILL,   icon: 'bucket', label: t('Fill', 'Remplir') },
                { key: TOOL.BRUSH,  icon: 'brush',  label: t('Brush', 'Pinceau') },
                { key: TOOL.ERASER, icon: 'eraser', label: t('Erase', 'Effacer') },
              ].map(tool => (
                <button key={tool.key} onClick={() => setActiveTool(tool.key)} style={{
                  flex: 1, padding: '6px 4px', borderRadius: '10px', flexShrink: 0,
                  border: activeTool === tool.key ? `2px solid ${colors.navy}` : `1.5px solid ${colors.border}`,
                  background: activeTool === tool.key ? colors.navy : '#FAFAF7',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                }}>
                  <GameIcon name={tool.icon} size={19} color={activeTool === tool.key ? 'white' : colors.navy} />
                  <span style={{ fontSize: '10px', fontWeight: '700', color: activeTool === tool.key ? 'white' : colors.muted }}>{tool.label}</span>
                </button>
              ))}
              <button onClick={undo} disabled={undoCount === 0} style={{
                flex: 1, padding: '6px 4px', borderRadius: '10px',
                border: `1.5px solid ${undoCount > 0 ? '#9EB7E5' : colors.border}`,
                background: undoCount > 0 ? '#EEF4FF' : '#FAFAF7',
                cursor: undoCount > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1, color: undoCount > 0 ? colors.navy : '#B0A89E' }}>↩</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: undoCount > 0 ? colors.navy : '#B0A89E' }}>Undo</span>
              </button>
              <button onClick={retryFlag} style={{
                flex: 1, padding: '6px 4px', borderRadius: '10px',
                border: `1.5px solid ${colors.border}`, background: '#FAFAF7',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1, color: colors.navy }}>↺</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: colors.muted }}>Reset</span>
              </button>
              <button onClick={validate} disabled={flagLoading} style={{
                flex: 2, padding: '6px 8px', borderRadius: '10px', border: 'none',
                background: flagLoading ? colors.border : colors.navy,
                color: '#FFF', cursor: flagLoading ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}>
                <GameIcon name="check" size={19} color="#FFF" strokeWidth={2.6} />
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{t('Validate', 'Valider')}</span>
              </button>
            </div>
          </div>

          <canvas ref={refCanvasRef} style={{ display: 'none' }} />

          {/* Quit confirm bottom sheet */}
          {showQuitConfirm && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
                <div style={{ width: '36px', height: '4px', backgroundColor: colors.border, borderRadius: '99px', margin: '0 auto 20px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: colors.navy, textAlign: 'center' }}>
                  {t('Quit the game?', 'Quitter la partie ?')}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: colors.muted, lineHeight: 1.6, textAlign: 'center' }}>
                  {t(`Your score of ${totalScore} pts will be saved.`, `Ton score de ${totalScore} pts sera sauvegardé.`)}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setShowQuitConfirm(false); quitGame() }}
                    style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                    {t('Quit & save', 'Quitter et sauvegarder')}
                  </button>
                  <button onClick={() => setShowQuitConfirm(false)}
                    style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: colors.navy, border: `1.5px solid ${colors.border}`, borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    {t('Keep drawing', 'Continuer à dessiner')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // ── DESKTOP ──
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', background: colors.bg, fontFamily: 'var(--font-body), system-ui, sans-serif', paddingBottom: '32px' }}>
        <div style={{ background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({length: MAX_LIVES}).map((_, i) => (
              <GameIcon key={i} name="heart" filled size={20} color="#D62828" style={{ opacity: i < lives ? 1 : 0.25 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {streak > 1 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: '700', color: '#E65C00' }}><GameIcon name="flame" filled size={14} color="#E65C00" />{streak}</span>}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: colors.navy, color: '#FFF', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', fontWeight: '700' }}><GameIcon name="sparkle" filled size={14} color="#F4B400" />{totalScore}</div>
          </div>
        </div>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '16px' }}>
          {cfg.showName && flagName && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: colors.navy, margin: 0, fontFamily: 'var(--font-display), system-ui, sans-serif' }}>{flagName}</h2>
            </div>
          )}
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${colors.border}`, width: CANVAS_W, margin: '0 auto 16px', cursor: activeTool === TOOL.FILL ? 'crosshair' : 'default', touchAction: 'none' }}>
            <canvas ref={drawingCanvasRef} width={CANVAS_W} height={canvasH}
              style={{ display: 'block', width: '100%' }}
              onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp}
              onTouchStart={handleDown} onTouchMove={handleMove} onTouchEnd={handleUp}
            />
            <canvas ref={overlayCanvasRef} width={CANVAS_W} height={canvasH}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            {cfg.ghost && currentKey && !flagLoading && (
              <img src={`https://flagcdn.com/w320/${currentKey}.png`} alt="" aria-hidden="true"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.22, pointerEvents: 'none', objectFit: 'fill' }} />
            )}
            {flagLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,241,230,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', color: colors.muted, fontWeight: 600 }}>{t('Analyzing flag…', 'Analyse du drapeau…')}</span>
              </div>
            )}
          </div>
          {palette.length > 0 && (
            <div style={{ background: colors.card, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{t('Flag colors', 'Couleurs du drapeau')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {palette.map(c => (
                  <button key={c.hex} onClick={() => { setActiveColor(c.hex); setActiveTool(TOOL.FILL) }} style={{ width: '40px', height: '40px', borderRadius: '8px', background: c.hex, border: activeColor === c.hex ? `3px solid ${colors.navy}` : '2px solid rgba(0,0,0,0.15)', cursor: 'pointer', transform: activeColor === c.hex ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.12s' }} />
                ))}
                <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setActiveColor(e.target.value); setActiveTool(TOOL.FILL) }} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '2px solid rgba(0,0,0,0.15)', cursor: 'pointer', padding: '2px', background: 'none' }} />
              </div>
            </div>
          )}
          <div style={{ background: colors.card, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[{key:TOOL.FILL,icon:'bucket',label:t('Fill','Remplir')},{key:TOOL.BRUSH,icon:'brush',label:t('Brush','Pinceau')},{key:TOOL.ERASER,icon:'eraser',label:t('Erase','Effacer')}].map(tool => (
                <button key={tool.key} onClick={() => setActiveTool(tool.key)} style={{ padding: '8px 14px', borderRadius: '8px', border: activeTool===tool.key?`2px solid ${colors.navy}`:`2px solid ${colors.border}`, background: activeTool===tool.key?colors.navy:'#FAFAF7', color: activeTool===tool.key?'#FFF':colors.navy, fontWeight:'700', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                  <GameIcon name={tool.icon} size={17} color={activeTool===tool.key?'#FFF':colors.navy} /><span>{tool.label}</span>
                </button>
              ))}
              {(activeTool===TOOL.BRUSH||activeTool===TOOL.ERASER) && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto' }}>
                  <input type="range" min="2" max="30" value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ width:'80px' }} />
                  <span style={{ fontSize:'12px', fontWeight:700, color:colors.navy }}>{brushSize}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ background: colors.card, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{t('Shapes', 'Formes')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SHAPES.map(s => (
                <button key={s.key} onClick={() => stampShape(s.key)} style={{ padding: '5px 10px', borderRadius: '7px', border: `1.5px solid ${colors.border}`, background: '#FAFAF7', color: colors.navy, fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => { e.currentTarget.style.background=colors.navy; e.currentTarget.style.color='#FFF' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#FAFAF7'; e.currentTarget.style.color=colors.navy }}>
                  <span style={{ width:'14px', height:'14px', background:activeColor, borderRadius:'2px', flexShrink:0, border:'1px solid rgba(0,0,0,0.1)', display:'inline-block' }} />
                  {locale === 'fr' ? s.label : s.labelEn}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={retryFlag} style={{ flex:1, padding:'12px', borderRadius:'10px', border:`2px solid ${colors.border}`, background:'#FAFAF7', color:colors.navy, fontWeight:'700', fontSize:'14px', cursor:'pointer' }}>{t('Reset','Reset')} ↺</button>
            <button onClick={undo} disabled={undoCount===0} style={{ flex:1, padding:'12px', borderRadius:'10px', border:`2px solid ${undoCount>0?'#9EB7E5':colors.border}`, background:undoCount>0?'#EEF4FF':'#FAFAF7', color:undoCount>0?'#16324F':'#B0A89E', fontWeight:'700', fontSize:'14px', cursor:undoCount>0?'pointer':'not-allowed' }}>↩ {t('Undo','Annuler')}</button>
            <button onClick={validate} disabled={flagLoading} style={{ flex:2, padding:'12px', borderRadius:'10px', border:'none', background:flagLoading?colors.border:colors.navy, color:'#FFF', fontWeight:'700', fontSize:'14px', cursor:flagLoading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>{t('Validate','Valider')} <GameIcon name="check" size={17} color="#FFF" strokeWidth={2.6} /></button>
          </div>
        </div>
        <canvas ref={refCanvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  // ── RESULT screen ─────────────────────────────────────────────────────────
  if (screen === SCREEN.RESULT) {
    const passed = score >= 55
    const scoreColor = score >= 90 ? '#16a34a' : score >= 70 ? '#ca8a04' : '#dc2626'

    return (
      <div style={{ backgroundColor: colors.bg, height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body), system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Fixed header */}
        <div style={{ flexShrink: 0, padding: '20px 16px 0' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: colors.navy, fontFamily: 'var(--font-display), system-ui, sans-serif' }}>{flagName}</h2>
              <div style={{ fontSize: '48px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{score}%</div>
              {passed && lastPts && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: colors.navy, color: '#FFF', borderRadius: '20px', padding: '6px 14px', marginTop: '8px', fontWeight: '700', fontSize: '14px' }}>
                  ⭐ +{lastPts} pts
                </div>
              )}
              <div style={{ fontSize: '13px', color: colors.muted, marginTop: '8px' }}>
                {passed ? t('Great job! Flag validated ✓', 'Bravo ! Drapeau validé ✓') : t('Keep trying! Aim for 70%+', 'Continue ! Vise 70%+')}
              </div>
            </div>

            {/* Side by side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {[
                { label: t('YOUR DRAWING', 'VOTRE DESSIN'), src: snapshotUrl },
                { label: t('REAL FLAG', 'VRAI DRAPEAU'), src: `https://flagcdn.com/w320/${currentKey}.png` },
              ].map((panel, i) => (
                <div key={i}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{panel.label}</div>
                  <img src={panel.src} alt={panel.label} style={{ width: '100%', borderRadius: '10px', border: `2px solid ${colors.border}`, display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky buttons */}
        <div style={{ flexShrink: 0, marginTop: 'auto', padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: colors.bg, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%', display: 'flex', gap: '10px' }}>
            {!passed && lives > 0 && (
              <button onClick={() => { setScore(null); setScreen(SCREEN.PLAYING); retryFlag() }} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: `2px solid ${colors.border}`, background: '#FAFAF7', color: colors.navy, fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                {t('Retry', 'Réessayer')} ↺
              </button>
            )}
            <button onClick={nextFlag} style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: colors.navy, color: '#FFF', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              {t('Next flag', 'Drapeau suivant')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── GAMEOVER screen ───────────────────────────────────────────────────────
  const passedCount = history.filter(h => h.passed).length
  return (
    <div style={{ backgroundColor: colors.bg, height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body), system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Fixed: header + stats */}
      <div style={{ flexShrink: 0, padding: '20px 16px 0' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '900', color: colors.navy, letterSpacing: '-0.5px', fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
              {t('Game Over', 'Partie terminée')}
            </h2>
            <p style={{ margin: 0, color: colors.muted, fontSize: '13px' }}>
              {passedCount}/{history.length} {t('flags validated', 'drapeaux validés')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: t('Score', 'Score'),                 value: `⭐ ${totalScore}`,    color: colors.navy, bg: colors.card, border: colors.border },
              { label: t('Validated', 'Validés'),           value: `${passedCount}/${history.length}`, color: passedCount > 0 ? '#16a34a' : colors.muted, bg: passedCount > 0 ? '#f0fdf4' : colors.card, border: passedCount > 0 ? '#bbf7d0' : colors.border },
              { label: t('Best streak', 'Meilleure série'), value: `🔥 ${streak}`,        color: '#806D40', bg: '#fefce8', border: '#fde68a' },
              { label: t('Difficulty', 'Difficulté'),       value: difficulty,             color: colors.navy, bg: colors.card, border: colors.border },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: s.bg, borderRadius: '14px', border: `1px solid ${s.border}`, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: s.color, letterSpacing: '-0.3px', textTransform: i === 3 ? 'capitalize' : 'none' }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: colors.muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable: history */}
      {history.length > 0 && (
        <div style={{ flex: 1, minHeight: 0, padding: '0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: colors.card, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('History', 'Historique')}
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {history.map((h, i) => {
                  const hDef = FLAG_DEFS[h.key]
                  const hName = hDef ? (locale === 'fr' ? hDef.fr : hDef.en) : h.key
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '10px', backgroundColor: i % 2 === 0 ? '#FAFAF7' : 'white' }}>
                      <img src={`https://flagcdn.com/w80/${h.key}.png`} alt="" style={{ width: '40px', height: '27px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#e8e4d9', flexShrink: 0, padding: '2px', border: `1px solid ${colors.border}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: colors.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hName}</div>
                        <div style={{ fontSize: '11px', color: h.passed ? '#16a34a' : '#dc2626', marginTop: '1px' }}>{h.score}%{h.passed && h.pts ? ` · +${h.pts} pts` : ''}</div>
                      </div>
                      <span style={{ display: 'inline-flex' }}>{h.passed ? <GameIcon name="check" size={14} color="#16A34A" strokeWidth={2.6} /> : <GameIcon name="wrong" size={14} color="#D62828" />}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky buttons */}
      <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: colors.bg, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={() => setScreen(SCREEN.SETUP)} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: colors.navy, color: '#FFF', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
          {t('Play again', 'Rejouer')}
        </button>
      </div>
    </div>
  )
}
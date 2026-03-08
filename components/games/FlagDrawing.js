'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_LIVES = 3
const CANVAS_W = 480
const CANVAS_H = 320

const DIFFICULTY = {
  easy:    { key: 'easy',    en: 'Easy',    fr: 'Facile',   icon: '🟢' },
  medium:  { key: 'medium',  en: 'Medium',  fr: 'Moyen',    icon: '🟡' },
  hard:    { key: 'hard',    en: 'Hard',    fr: 'Difficile', icon: '🟠' },
  extreme: { key: 'extreme', en: 'Extreme', fr: 'Extrême',  icon: '🔴' },
}

// All possible flag colors (medium+ uses the full palette)
const ALL_COLORS = [
  { name: 'white',   hex: '#FFFFFF', label: 'Blanc' },
  { name: 'black',   hex: '#1a1a1a', label: 'Noir' },
  { name: 'red',     hex: '#D32F2F', label: 'Rouge' },
  { name: 'blue',    hex: '#1565C0', label: 'Bleu' },
  { name: 'green',   hex: '#2E7D32', label: 'Vert' },
  { name: 'yellow',  hex: '#F9A825', label: 'Jaune' },
  { name: 'orange',  hex: '#E65100', label: 'Orange' },
  { name: 'brown',   hex: '#6D4C41', label: 'Marron' },
  { name: 'pink',    hex: '#E91E63', label: 'Rose' },
  { name: 'violet',  hex: '#7B1FA2', label: 'Violet' },
  { name: 'gold',    hex: '#FFD700', label: 'Or' },
  { name: 'lightblue', hex: '#29B6F6', label: 'Bleu clair' },
  { name: 'darkgreen', hex: '#1B5E20', label: 'Vert foncé' },
  { name: 'darkblue',  hex: '#0D47A1', label: 'Bleu marine' },
  { name: 'gray',    hex: '#9E9E9E', label: 'Gris' },
]

// Simple flag definitions for the canvas renderer
// ratio = width:height as decimal (e.g. 2:3 → 1.5, 1:2 → 2.0)
// The canvas will be sized/letterboxed to match the real ratio
const FLAG_DEFS = {
  // ── Europe ──────────────────────────────────────────────────────────────────
  fr: {
    en: 'France', fr: 'France', ratio: 1.5, // 2:3
    colors: ['blue','white','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#002395' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#ED2939' },
    ]
  },
  de: {
    en: 'Germany', fr: 'Allemagne', ratio: 5/3, // 3:5
    colors: ['black','red','gold'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#000000' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#DD0000' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#FFCE00' },
    ]
  },
  it: {
    en: 'Italy', fr: 'Italie', ratio: 1.5, // 2:3
    colors: ['green','white','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#009246' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#CE2B37' },
    ]
  },
  be: {
    en: 'Belgium', fr: 'Belgique', ratio: 13/15, // 13:15 (presque carré)
    colors: ['black','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#000000' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FDDA24' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#EF3340' },
    ]
  },
  nl: {
    en: 'Netherlands', fr: 'Pays-Bas', ratio: 1.5, // 2:3
    colors: ['red','white','blue'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#AE1C28' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#21468B' },
    ]
  },
  ru: {
    en: 'Russia', fr: 'Russie', ratio: 1.5, // 2:3
    colors: ['white','blue','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#0039A6' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#D52B1E' },
    ]
  },
  ie: {
    en: 'Ireland', fr: 'Irlande', ratio: 2.0, // 1:2
    colors: ['green','white','orange'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#169B62' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#FF883E' },
    ]
  },
  ro: {
    en: 'Romania', fr: 'Roumanie', ratio: 1.5, // 2:3
    colors: ['blue','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#002B7F' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FCD116' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#CE1126' },
    ]
  },
  pl: {
    en: 'Poland', fr: 'Pologne', ratio: 5/8, // 5:8
    colors: ['white','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/2, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 1/2, w: 1, h: 1/2, color: '#DC143C' },
    ]
  },
  ua: {
    en: 'Ukraine', fr: 'Ukraine', ratio: 1.5, // 2:3
    colors: ['blue','yellow'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/2, color: '#005BBB' },
      { type: 'rect', x: 0, y: 1/2, w: 1, h: 1/2, color: '#FFD500' },
    ]
  },
  at: {
    en: 'Austria', fr: 'Autriche', ratio: 1.5, // 2:3
    colors: ['red','white','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#ED2939' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#ED2939' },
    ]
  },
  hu: {
    en: 'Hungary', fr: 'Hongrie', ratio: 2.0, // 1:2
    colors: ['red','white','green'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#CE2939' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#477050' },
    ]
  },
  ee: {
    en: 'Estonia', fr: 'Estonie', ratio: 7/11, // 7:11
    colors: ['blue','black','white'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#0072CE' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#000000' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#FFFFFF' },
    ]
  },
  lv: {
    en: 'Latvia', fr: 'Lettonie', ratio: 2.0, // 1:2
    colors: ['darkred','white','darkred'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 2/5, color: '#9E3039' },
      { type: 'rect', x: 0, y: 2/5, w: 1, h: 1/5, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 3/5, w: 1, h: 2/5, color: '#9E3039' },
    ]
  },
  id: {
    en: 'Indonesia', fr: 'Indonésie', ratio: 1.5, // 2:3
    colors: ['red','white'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/2, color: '#CE1126' },
      { type: 'rect', x: 0, y: 1/2, w: 1, h: 1/2, color: '#FFFFFF' },
    ]
  },
  // ── Africa ──────────────────────────────────────────────────────────────────
  ci: {
    en: 'Ivory Coast', fr: "Côte d'Ivoire", ratio: 1.5, // 2:3
    colors: ['orange','white','green'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#F77F00' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#009A44' },
    ]
  },
  ml: {
    en: 'Mali', fr: 'Mali', ratio: 1.5, // 2:3
    colors: ['green','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#14B53A' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FCD116' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#CE1126' },
    ]
  },
  td: {
    en: 'Chad', fr: 'Tchad', ratio: 1.5, // 2:3
    colors: ['blue','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#002664' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FECB00' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#C60C30' },
    ]
  },
  sn: {
    en: 'Senegal', fr: 'Sénégal', ratio: 1.5, // 2:3
    colors: ['green','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#00853F' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FDEF42' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#E31B23' },
    ]
  },
  cm: {
    en: 'Cameroon', fr: 'Cameroun', ratio: 1.5, // 2:3
    colors: ['green','red','yellow'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#007A5E' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#CE1126' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#FCD116' },
    ]
  },
  ng: {
    en: 'Nigeria', fr: 'Nigeria', ratio: 2.0, // 1:2
    colors: ['green','white','green'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#008751' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#008751' },
    ]
  },
  gh: {
    en: 'Ghana', fr: 'Ghana', ratio: 1.5, // 2:3
    colors: ['red','gold','green'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#006B3F' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FCD116' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#CE1126' },
    ]
  },
  // Ghana stripes actually R/G/G top-to-bottom, let me correct:
  // ── Americas ─────────────────────────────────────────────────────────────────
  co: {
    en: 'Colombia', fr: 'Colombie', ratio: 1.5, // 2:3
    colors: ['yellow','blue','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/2, color: '#FCD116' },
      { type: 'rect', x: 0, y: 1/2, w: 1, h: 1/4, color: '#003087' },
      { type: 'rect', x: 0, y: 3/4, w: 1, h: 1/4, color: '#CE1126' },
    ]
  },
  ar: {
    en: 'Argentina', fr: 'Argentine', ratio: 5/8, // 5:8
    colors: ['lightblue','white','lightblue'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#74ACDF' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#74ACDF' },
    ]
  },
  // ── Asia ─────────────────────────────────────────────────────────────────────
  jp: {
    en: 'Japan', fr: 'Japon', ratio: 1.5, // 2:3
    colors: ['white','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#FFFFFF' },
      { type: 'circle', cx: 0.5, cy: 0.5, r: 0.3, color: '#BC002D' },
    ]
  },
  th: {
    en: 'Thailand', fr: 'Thaïlande', ratio: 1.5, // 2:3
    colors: ['red','white','blue'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/6, color: '#A51931' },
      { type: 'rect', x: 0, y: 1/6, w: 1, h: 1/6, color: '#F4F5F8' },
      { type: 'rect', x: 0, y: 2/6, w: 1, h: 2/6, color: '#2D2A4A' },
      { type: 'rect', x: 0, y: 4/6, w: 1, h: 1/6, color: '#F4F5F8' },
      { type: 'rect', x: 0, y: 5/6, w: 1, h: 1/6, color: '#A51931' },
    ]
  },
  // ── Special shapes ───────────────────────────────────────────────────────────
  ch: {
    en: 'Switzerland', fr: 'Suisse', ratio: 1.0, // 1:1 square
    colors: ['red','white'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#FF0000' },
      { type: 'rect', x: 5/16, y: 3/16, w: 6/16, h: 10/16, color: '#FFFFFF' }, // vertical bar of cross
      { type: 'rect', x: 3/16, y: 5/16, w: 10/16, h: 6/16, color: '#FFFFFF' }, // horizontal bar
    ]
  },
  no: {
    en: 'Norway', fr: 'Norvège', ratio: 8/11, // 8:11
    colors: ['red','white','blue'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#EF2B2D' },
      { type: 'rect', x: 0, y: 4/16, w: 1, h: 3/16, color: '#FFFFFF' },
      { type: 'rect', x: 4/16, y: 0, w: 3/16, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 5/16, w: 1, h: 1/16+0.06, color: '#002868' },
      { type: 'rect', x: 5/16, y: 0, w: 1/16+0.06, h: 1, color: '#002868' },
    ]
  },
  dk: {
    en: 'Denmark', fr: 'Danemark', ratio: 28/34, // ~0.82, narrower flag
    colors: ['red','white'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#C60C30' },
      { type: 'rect', x: 0, y: 4/12, w: 1, h: 2/12, color: '#FFFFFF' },
      { type: 'rect', x: 3/12, y: 0, w: 2/12, h: 1, color: '#FFFFFF' },
    ]
  },
  se: {
    en: 'Sweden', fr: 'Suède', ratio: 5/8, // 5:8
    colors: ['blue','yellow'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#006AA7' },
      { type: 'rect', x: 0, y: 4/16, w: 1, h: 2.5/16, color: '#FECC02' },
      { type: 'rect', x: 4/16, y: 0, w: 2.5/16, h: 1, color: '#FECC02' },
    ]
  },
  fi: {
    en: 'Finland', fr: 'Finlande', ratio: 11/18, // 11:18
    colors: ['white','blue'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 4/18, w: 1, h: 3/18, color: '#003580' },
      { type: 'rect', x: 5/18, y: 0, w: 3/18, h: 1, color: '#003580' },
    ]
  },
}

const FLAG_KEYS = Object.keys(FLAG_DEFS)

// All real-world flag ratios from Wikipedia (sorted by decimal value)
const RATIOS = [
  { label: '1:1',   value: 1.000, en: 'Square',          fr: 'Carré'          }, // CH, VA
  { label: '13:15', value: 13/15, en: 'Near-square',     fr: 'Quasi-carré'    }, // BE
  { label: '8:11',  value: 8/11,  en: 'Tall-ish',        fr: 'Quasi-carré'    }, // NO, IL
  { label: '7:10',  value: 0.700, en: 'Compact',         fr: 'Compact'        }, // BR, AD
  { label: '3:4',   value: 0.750, en: 'Classic',         fr: 'Classique'      }, // GA, PNG
  { label: '5:8',   value: 0.625, en: 'European',        fr: 'Européen'       }, // PL, SE, AR
  { label: '7:11',  value: 7/11,  en: 'Nordic',          fr: 'Nordique'       }, // EE
  { label: '11:18', value: 11/18, en: 'Nordic',          fr: 'Nordique'       }, // FI
  { label: '2:3',   value: 1.500, en: 'Standard',        fr: 'Standard'       }, // FR, IT, RU…
  { label: '3:5',   value: 5/3,   en: 'Horizontal',      fr: 'Horizontal'     }, // DE, UK
  { label: '5:7',   value: 5/7,   en: 'Balkan',          fr: 'Balkanique'     }, // AL
  { label: '4:7',   value: 4/7,   en: 'Middle East',     fr: 'Moyen-Orient'   }, // MX
  { label: '1:2',   value: 2.000, en: 'Wide',            fr: 'Large'          }, // IE, HU, LV…
  { label: '10:19', value: 10/19, en: 'US-style',        fr: 'Style US'       }, // US
]
const SHAPES = ['rectangle', 'square', 'pennant']

// Difficulty score multipliers
const DIFF_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2, extreme: 3 }

// Difficulty config
const DIFF_CONFIG = {
  easy: {
    showLines: true,    // lines pre-drawn
    colorsRestricted: true,  // only flag's own colors
    showShape: true,
    showRatio: true,
  },
  medium: {
    showLines: true,
    colorsRestricted: false, // all colors
    showShape: true,
    showRatio: true,
  },
  hard: {
    showLines: false,   // must draw lines
    colorsRestricted: false,
    showShape: true,
    showRatio: true,
  },
  extreme: {
    showLines: false,
    colorsRestricted: false,
    showShape: false,   // must pick shape
    showRatio: false,   // must pick ratio
  },
}

const TOOL = { FILL: 'fill', LINE: 'line', ERASER: 'eraser' }
const SCREEN = { SETUP: 'setup', PLAYING: 'playing', RESULT: 'result', GAMEOVER: 'gameover' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return [r,g,b]
}

function colorDistance(r1,g1,b1,r2,g2,b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
}

// Draw the reference flag onto a canvas context
function drawReferenceFlagCtx(ctx, def, W, H) {
  ctx.clearRect(0, 0, W, H)
  for (const s of def.stripes) {
    ctx.fillStyle = s.color
    if (s.type === 'circle') {
      ctx.beginPath()
      ctx.arc(Math.round(s.cx * W), Math.round(s.cy * H), Math.round(s.r * Math.min(W, H)), 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(Math.round(s.x * W), Math.round(s.y * H), Math.round(s.w * W), Math.round(s.h * H))
    }
  }
}

// Compare two canvas ImageData and return similarity 0-100
function compareImages(data1, data2) {
  const len = data1.data.length
  let totalDist = 0
  const maxDist = 441.67 // sqrt(255^2 * 3)
  for (let i = 0; i < len; i += 4) {
    const d = colorDistance(data1.data[i],data1.data[i+1],data1.data[i+2], data2.data[i],data2.data[i+1],data2.data[i+2])
    totalDist += d / maxDist
  }
  const pixels = len / 4
  return Math.round((1 - totalDist / pixels) * 100)
}

// Flood fill algorithm
function floodFill(imageData, W, H, startX, startY, fillColorHex) {
  const [fr, fg, fb] = hexToRgb(fillColorHex)
  const data = imageData.data
  const idx = (y, x) => (y * W + x) * 4
  const start = idx(startY, startX)
  const tr = data[start], tg = data[start+1], tb = data[start+2]
  if (colorDistance(tr,tg,tb, fr,fg,fb) < 10) return imageData

  const stack = [[startX, startY]]
  const visited = new Uint8Array(W * H)

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= W || y < 0 || y >= H) continue
    const i = y * W + x
    if (visited[i]) continue
    const pi = i * 4
    if (colorDistance(data[pi],data[pi+1],data[pi+2], tr,tg,tb) > 30) continue
    visited[i] = 1
    data[pi] = fr; data[pi+1] = fg; data[pi+2] = fb; data[pi+3] = 255
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])
  }
  return imageData
}

// ─── Score formula ───────────────────────────────────────────────────────────
// points = base × (accuracy²) × streak_multiplier × difficulty_multiplier
// base = 100, accuracy² = (pct/100)², streak_mult = 1.1^streak, diff = 1/1.5/2/3
function calcPoints(accuracyPct, streak, diff) {
  const base = 100
  const accuracy = accuracyPct / 100
  const streakMult = Math.pow(1.1, streak)
  const diffMult = DIFF_MULTIPLIER[diff] || 1
  return Math.round(base * accuracy * accuracy * streakMult * diffMult)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlagDrawing() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen] = useState(SCREEN.SETUP)
  const [difficulty, setDifficulty] = useState('easy')
  const [isMobile, setIsMobile] = useState(false)

  // Game state
  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [lastPointsEarned, setLastPointsEarned] = useState(null) // for +pts animation
  const [currentFlagKey, setCurrentFlagKey] = useState(null)
  const [score, setScore] = useState(null) // null | 0-100
  const [history, setHistory] = useState([])
  const [queueRef] = useState({ current: [] })

  // Drawing state
  const [activeTool, setActiveTool] = useState(TOOL.FILL)
  const [activeColor, setActiveColor] = useState('#D32F2F')
  const [brushSize, setBrushSize] = useState(6)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lineStart, setLineStart] = useState(null)

  // Extreme mode selections
  const [selectedShape, setSelectedShape] = useState('rectangle')
  const [selectedRatio, setSelectedRatio] = useState('2:3')

  const drawingCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null) // for line preview
  const refCanvasRef = useRef(null)
  const livesRef = useRef(MAX_LIVES)
  const streakRef = useRef(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Compute canvas dimensions based on real flag ratio
  const maxW = isMobile ? 320 : CANVAS_W
  const flagRatio = currentFlagKey ? (FLAG_DEFS[currentFlagKey]?.ratio || 1.5) : 1.5
  // ratio = w/h → CW/CH = ratio, so CH = CW / ratio
  // But ratio stored as w/h decimal: 1.5 = wider flag (landscape)
  // When ratio < 1 (like BE=0.867), flag is taller than wide
  const CW = flagRatio >= 1 ? maxW : Math.round(maxW * flagRatio)
  const CH = flagRatio >= 1 ? Math.round(maxW / flagRatio) : maxW

  const cfg = DIFF_CONFIG[difficulty]

  function getAvailableColors() {
    if (cfg.colorsRestricted && currentFlagKey) {
      const def = FLAG_DEFS[currentFlagKey]
      return ALL_COLORS.filter(c => def.colors.some(fc => c.name === fc || c.hex.toLowerCase().includes(fc.toLowerCase().slice(0,3))))
    }
    return ALL_COLORS
  }

  function startGame() {
    livesRef.current = MAX_LIVES
    streakRef.current = 0
    setLives(MAX_LIVES)
    setStreak(0)
    setTotalScore(0)
    setLastPointsEarned(null)
    setHistory([])
    queueRef.current = shuffle(FLAG_KEYS)
    setScreen(SCREEN.PLAYING)
    loadNextFlag(shuffle(FLAG_KEYS))
  }

  function loadNextFlag(queue) {
    const key = queue[0]
    queueRef.current = queue.slice(1).length ? queue.slice(1) : shuffle(FLAG_KEYS)
    setCurrentFlagKey(key)
    setScore(null)
    setActiveTool(TOOL.FILL)
    setActiveColor('#D32F2F')
    setSelectedShape('rectangle')
    setSelectedRatio('2:3')
    // Clear drawing canvas after render
    setTimeout(() => {
      const canvas = drawingCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (cfg.showLines) drawGuideLines(ctx, key)
    }, 50)
  }

  function drawGuideLines(ctx, key) {
    const def = FLAG_DEFS[key]
    if (!def) return
    const W = ctx.canvas.width, H = ctx.canvas.height
    ctx.strokeStyle = '#C0BDB4'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4,4])
    for (const s of def.stripes) {
      if (s.type === 'circle') {
        ctx.beginPath()
        ctx.arc(Math.round(s.cx * W), Math.round(s.cy * H), Math.round(s.r * Math.min(W, H)), 0, Math.PI * 2)
        ctx.stroke()
      } else {
        ctx.strokeRect(Math.round(s.x * W) + 0.5, Math.round(s.y * H) + 0.5, Math.round(s.w * W), Math.round(s.h * H))
      }
    }
    ctx.setLineDash([])
  }

  function validate() {
    const drawCtx = drawingCanvasRef.current?.getContext('2d')
    const refCtx = refCanvasRef.current?.getContext('2d')
    if (!drawCtx || !refCtx) return

    const W = drawingCanvasRef.current.width
    const H = drawingCanvasRef.current.height

    // Draw reference flag onto hidden canvas
    const def = FLAG_DEFS[currentFlagKey]
    drawReferenceFlagCtx(refCtx, def, W, H)

    const drawData = drawCtx.getImageData(0, 0, W, H)
    const refData = refCtx.getImageData(0, 0, W, H)
    const sim = compareImages(drawData, refData)
    setScore(sim)

    const passed = sim >= 70

    // Compute points — streak used BEFORE incrementing (reward current streak)
    const currentStreak = streakRef.current
    const pts = passed ? calcPoints(sim, currentStreak, difficulty) : 0
    if (passed) setTotalScore(prev => prev + pts)
    setLastPointsEarned(passed ? pts : null)

    const newHistory = [...history, { key: currentFlagKey, score: sim, passed, pts }]
    setHistory(newHistory)

    if (passed) {
      const ns = currentStreak + 1
      streakRef.current = ns
      setStreak(ns)
      setBestStreak(prev => Math.max(prev, ns))
    } else {
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setTimeout(() => setScreen(SCREEN.GAMEOVER), 1800)
        return
      }
    }
    setScreen(SCREEN.RESULT)
  }

  function nextFlag() {
    setScreen(SCREEN.PLAYING)
    loadNextFlag(queueRef.current)
  }

  // ── Canvas drawing ──────────────────────────────────────────────────────────

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    }
  }

  function handleCanvasDown(e) {
    e.preventDefault()
    if (score !== null) return
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)
    setIsDrawing(true)

    if (activeTool === TOOL.FILL) {
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      floodFill(imageData, canvas.width, canvas.height, pos.x, pos.y, activeColor)
      ctx.putImageData(imageData, 0, 0)
    } else if (activeTool === TOOL.LINE) {
      setLineStart(pos)
    } else if (activeTool === TOOL.ERASER) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, brushSize * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function handleCanvasMove(e) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)

    if (activeTool === TOOL.LINE && lineStart) {
      // Show preview on overlay canvas
      const overlay = overlayCanvasRef.current
      if (overlay) {
        const octx = overlay.getContext('2d')
        octx.clearRect(0, 0, overlay.width, overlay.height)
        octx.strokeStyle = activeColor
        octx.lineWidth = brushSize
        octx.lineCap = 'round'
        octx.beginPath()
        octx.moveTo(lineStart.x, lineStart.y)
        octx.lineTo(pos.x, pos.y)
        octx.stroke()
      }
    } else if (activeTool === TOOL.ERASER) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, brushSize * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function handleCanvasUp(e) {
    e.preventDefault()
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)

    if (activeTool === TOOL.LINE && lineStart) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = activeColor
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lineStart.x, lineStart.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      // Clear overlay
      const overlay = overlayCanvasRef.current
      if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height)
      setLineStart(null)
    }
  }

  function clearCanvas() {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (cfg.showLines) drawGuideLines(ctx, currentFlagKey)
    setScore(null)
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const livesRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{t('lives', 'vies')}</span>
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 24 24"
          fill={i < lives ? '#ef4444' : '#e2e8f0'} stroke={i < lives ? '#ef4444' : '#e2e8f0'} strokeWidth="1">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ))}
      {/* Score counter */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: '800', color: streak > 0 ? '#806D40' : '#cbd5e1' }}>
          🔥 {streak}
        </span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#0B1F3B', borderRadius: '99px', padding: '4px 12px' }}>
          <span style={{ fontSize: '13px', color: '#9EB7E5', fontWeight: '900' }}>⭐</span>
          <span style={{ fontSize: '14px', fontWeight: '900', color: 'white', fontVariantNumeric: 'tabular-nums' }}>
            {totalScore.toLocaleString()}
          </span>
          {lastPointsEarned != null && (
            <span key={totalScore} style={{
              position: 'absolute', top: '-22px', right: '4px',
              fontSize: '13px', fontWeight: '900', color: '#426A5A',
              animation: 'floatUp 1.4s ease-out forwards',
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
              +{lastPointsEarned}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  // ─── SETUP SCREEN ───────────────────────────────────────────────────────────
  if (screen === SCREEN.SETUP) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✏️</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px' }}>
              {t('Flag Drawing', 'Dessin du Drapeau')}
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
              {t('Draw the flag from memory · 3 lives · infinite flags', 'Dessine le drapeau de mémoire · 3 vies · drapeaux infinis')}
            </p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '22px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('Difficulty', 'Difficulté')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(DIFFICULTY).map(d => {
                const descs = {
                  easy:    t('Colors restricted · lines pre-drawn', 'Couleurs du drapeau · lignes tracées'),
                  medium:  t('All colors · lines pre-drawn', 'Toutes les couleurs · lignes tracées'),
                  hard:    t('All colors · draw your own lines', 'Toutes les couleurs · tracé les lignes'),
                  extreme: t('Choose shape, ratio, draw lines & pick colors', 'Choisir forme, ratio, tracé + couleurs'),
                }
                const active = difficulty === d.key
                return (
                  <button key={d.key} onClick={() => setDifficulty(d.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '18px' }}>{d.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: active ? 'white' : '#0B1F3B' }}>{locale === 'fr' ? d.fr : d.en}</div>
                      <div style={{ fontSize: '12px', color: active ? 'rgba(255,255,255,0.6)' : '#94a3b8', marginTop: '1px' }}>{descs[d.key]}</div>
                    </div>
                    {active && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="#9EB7E5"/>
                        <polyline points="3.5,8 6.5,11 12.5,5" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={startGame}
            style={{ width: '100%', padding: '16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {t('Start Drawing', 'Commencer à dessiner')} ✏️
          </button>
        </div>
      </div>
    )
  }

  // ─── PLAYING SCREEN ─────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING && currentFlagKey) {
    const def = FLAG_DEFS[currentFlagKey]
    const availableColors = getAvailableColors()
    const flagName = locale === 'fr' ? def.fr : def.en

    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '12px 12px 24px' : '24px 24px 32px' }}>

          {/* Header */}
          <h1 style={{ textAlign: 'center', fontSize: isMobile ? '20px' : '26px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 14px', letterSpacing: '-0.8px' }}>
            {t('Flag Drawing', 'Dessin du Drapeau')}
            <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>
              {DIFFICULTY[difficulty].icon} {locale === 'fr' ? DIFFICULTY[difficulty].fr : DIFFICULTY[difficulty].en}
            </span>
          </h1>
          {livesRow}

          <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 240px', gap: isMobile ? '12px' : '20px', alignItems: 'flex-start' }}>

            {/* ── Left: canvas area ── */}
            <div>
              {/* Flag name prompt */}
              <div style={{ backgroundColor: '#0B1F3B', borderRadius: '12px', padding: '14px 20px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>
                    {t('Draw this flag', 'Dessine ce drapeau')}
                  </div>
                  <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '900', color: 'white' }}>
                    {flagName}
                  </div>
                </div>
                {/* Ratio badge — hidden on easy/medium (it's given info on hard+) */}
                {(difficulty === 'hard' || difficulty === 'extreme') ? (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1px' }}>{t('ratio', 'ratio')}</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#9EB7E5' }}>?</div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1px' }}>{t('ratio', 'ratio')}</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#9EB7E5' }}>
                      {RATIOS.find(r => Math.abs(r.value - (FLAG_DEFS[currentFlagKey]?.ratio || 1.5)) < 0.01)?.label || '2:3'}
                    </div>
                  </div>
                )}
              </div>

              {/* Extreme mode: shape + ratio picker */}
              {difficulty === 'extreme' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>{t('Shape', 'Forme')}</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {SHAPES.map(s => (
                        <button key={s} onClick={() => setSelectedShape(s)}
                          style={{ flex: 1, padding: '7px', borderRadius: '8px', border: selectedShape === s ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: selectedShape === s ? '#0B1F3B' : 'white', color: selectedShape === s ? 'white' : '#0B1F3B', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                          {s === 'rectangle' ? t('Rect.', 'Rect.') : t('Square', 'Carré')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>{t('Ratio', 'Ratio')}</p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {RATIOS.map(r => (
                        <button key={r.label} onClick={() => setSelectedRatio(r.label)}
                          style={{ padding: '6px 10px', borderRadius: '7px', border: selectedRatio === r.label ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: selectedRatio === r.label ? '#0B1F3B' : 'white', color: selectedRatio === r.label ? 'white' : '#0B1F3B', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Canvas wrapper */}
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #C0BDB4', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', cursor: activeTool === TOOL.FILL ? 'crosshair' : activeTool === TOOL.ERASER ? 'cell' : 'default', touchAction: 'none' }}>
                <canvas
                  ref={drawingCanvasRef}
                  width={CW} height={CH}
                  style={{ display: 'block', width: '100%', imageRendering: 'pixelated' }}
                  onMouseDown={handleCanvasDown}
                  onMouseMove={handleCanvasMove}
                  onMouseUp={handleCanvasUp}
                  onMouseLeave={handleCanvasUp}
                  onTouchStart={handleCanvasDown}
                  onTouchMove={handleCanvasMove}
                  onTouchEnd={handleCanvasUp}
                />
                {/* Overlay for line preview */}
                <canvas
                  ref={overlayCanvasRef}
                  width={CW} height={CH}
                  style={{ position: 'absolute', inset: 0, width: '100%', pointerEvents: 'none', imageRendering: 'pixelated' }}
                />
              </div>

              {/* Hidden ref canvas */}
              <canvas ref={refCanvasRef} width={CW} height={CH} style={{ display: 'none' }} />

              {/* Canvas action bar */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button onClick={clearCanvas}
                  style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  🗑️ {t('Clear', 'Effacer')}
                </button>
                <button onClick={validate}
                  style={{ flex: 2, padding: '10px', borderRadius: '9px', border: 'none', backgroundColor: '#426A5A', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                  ✓ {t('Validate', 'Valider')}
                </button>
              </div>
            </div>

            {/* ── Right: toolbar ── */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '12px', flexWrap: 'wrap' }}>

              {/* Tools */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', flex: isMobile ? '1' : 'initial' }}>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {t('Tools', 'Outils')}
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '6px' }}>
                  {[
                    { key: TOOL.FILL, icon: '🪣', label: t('Fill', 'Remplir') },
                    ...(cfg.showLines ? [] : [{ key: TOOL.LINE, icon: '📏', label: t('Line', 'Ligne') }]),
                    { key: TOOL.ERASER, icon: '🧹', label: t('Eraser', 'Gomme') },
                  ].map(tool => (
                    <button key={tool.key} onClick={() => setActiveTool(tool.key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', border: activeTool === tool.key ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: activeTool === tool.key ? '#0B1F3B' : '#fafafa', color: activeTool === tool.key ? 'white' : '#0B1F3B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: isMobile ? 1 : 'initial' }}>
                      <span>{tool.icon}</span>
                      {!isMobile && <span>{tool.label}</span>}
                    </button>
                  ))}
                </div>

                {/* Brush size (line/eraser) */}
                {(activeTool === TOOL.LINE || activeTool === TOOL.ERASER) && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>{t('Size', 'Taille')}: {brushSize}px</p>
                    <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#0B1F3B' }} />
                  </div>
                )}
              </div>

              {/* Color palette */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', flex: isMobile ? '2' : 'initial' }}>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {t('Colors', 'Couleurs')}
                  {cfg.colorsRestricted && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', color: '#426A5A', fontWeight: '700' }}>
                      {t('(flag only)', '(drapeau)')}
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableColors.map(c => (
                    <button key={c.hex} onClick={() => { setActiveColor(c.hex); setActiveTool(TOOL.FILL) }}
                      title={c.label}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: c.hex, border: activeColor === c.hex ? '3px solid #0B1F3B' : '2px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.1s', transform: activeColor === c.hex ? 'scale(1.2)' : 'scale(1)', boxShadow: c.hex === '#FFFFFF' ? 'inset 0 0 0 1px #e2e8f0' : 'none' }}
                    />
                  ))}
                </div>
                {/* Active color preview */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: activeColor, border: '2px solid #e2e8f0', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    {availableColors.find(c => c.hex === activeColor)?.label || activeColor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (screen === SCREEN.RESULT) {
    const def = FLAG_DEFS[currentFlagKey]
    const flagName = locale === 'fr' ? def.fr : def.en
    const passed = score >= 70
    const emoji = score >= 90 ? '🏆' : score >= 75 ? '🎉' : score >= 60 ? '😅' : '💪'

    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px 14px 32px' : '32px 24px 48px' }}>

          {livesRow}

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>{emoji}</div>
            <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '900', color: '#0B1F3B' }}>{flagName}</h2>
            <div style={{ fontSize: '48px', fontWeight: '900', color: passed ? '#426A5A' : '#dc2626', letterSpacing: '-1px' }}>{score}%</div>
            {passed && lastPointsEarned != null && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0B1F3B', borderRadius: '99px', padding: '6px 16px', margin: '8px auto 0' }}>
                <span style={{ fontSize: '13px', color: '#9EB7E5' }}>⭐</span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>+{lastPointsEarned} pts</span>
                {streak > 1 && (
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '2px' }}>
                    🔥×{streak} · {DIFFICULTY[difficulty].icon} ×{DIFF_MULTIPLIER[difficulty]}
                  </span>
                )}
              </div>
            )}
            <div style={{ fontSize: '15px', color: '#64748b', marginTop: '10px' }}>
              {passed
                ? t('Great job! Flag validated ✓', 'Bien joué ! Drapeau validé ✓')
                : t('Not quite — try again next time', 'Pas tout à fait — retente!')}
            </div>
          </div>

          {/* Side by side: your drawing vs real flag */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('Your drawing', 'Ton dessin')}</p>
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: `2px solid ${passed ? '#16a34a' : '#dc2626'}` }}>
                <canvas
                  ref={el => {
                    if (el && drawingCanvasRef.current) {
                      const ctx = el.getContext('2d')
                      ctx.drawImage(drawingCanvasRef.current, 0, 0, el.width, el.height)
                    }
                  }}
                  width={240} height={160}
                  style={{ display: 'block', width: '100%' }}
                />
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('Real flag', 'Vrai drapeau')}</p>
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                <img src={`https://flagcdn.com/w320/${currentFlagKey}.png`} alt={flagName}
                  style={{ display: 'block', width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={nextFlag}
              style={{ width: '100%', padding: '15px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
              {t('Next flag →', 'Prochain drapeau →')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── GAME OVER SCREEN ───────────────────────────────────────────────────────
  if (screen === SCREEN.GAMEOVER) {
    const total = history.length
    const passed = history.filter(h => h.passed).length
    const avgScore = total > 0 ? Math.round(history.reduce((s,h) => s + h.score, 0) / total) : 0

    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif', padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>🏁</div>
            <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '900', color: '#0B1F3B' }}>
              {t('Game Over', 'Partie terminée')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: t('Total score', 'Score total'), value: `⭐ ${totalScore.toLocaleString()}`, color: '#0B1F3B', bg: 'white' },
              { label: t('Validated', 'Validés'), value: passed, color: '#426A5A', bg: '#f0fdf4' },
              { label: t('Best streak', 'Meilleure série'), value: `🔥 ${bestStreak}`, color: '#806D40', bg: '#fefce8' },
              { label: t('Avg score', 'Score moy.'), value: `${avgScore}%`, color: '#64748b', bg: '#f8faff' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: s.bg, borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('Results', 'Résultats')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {history.map((h, i) => {
                  const fd = FLAG_DEFS[h.key]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', backgroundColor: h.passed ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${h.passed ? '#bbf7d0' : '#fecaca'}` }}>
                      <img src={`https://flagcdn.com/w80/${h.key}.png`} alt="" style={{ width: '40px', height: '27px', objectFit: 'contain', borderRadius: '3px', backgroundColor: '#e8e4d9', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{locale === 'fr' ? fd.fr : fd.en}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: h.passed ? '#16a34a' : '#dc2626' }}>{h.score}%</div>
                        {h.passed && h.pts != null && (
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9EB7E5' }}>+{h.pts} pts</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={startGame}
              style={{ width: '100%', padding: '15px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
              {t('Play Again', 'Rejouer')} 🔄
            </button>
            <button onClick={() => setScreen(SCREEN.SETUP)}
              style={{ width: '100%', padding: '13px', backgroundColor: 'white', color: '#0B1F3B', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              {t('Change difficulty', 'Changer la difficulté')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <style>{`
      @keyframes floatUp {
        0%   { opacity: 1; transform: translateY(0); }
        60%  { opacity: 1; transform: translateY(-14px); }
        100% { opacity: 0; transform: translateY(-22px); }
      }
    `}</style>
  )
}
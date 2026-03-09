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
  { name: 'white',      hex: '#FFFFFF', label: 'Blanc'       },
  { name: 'black',      hex: '#1a1a1a', label: 'Noir'        },
  { name: 'red',        hex: '#CE1126', label: 'Rouge'       }, // standard flag red
  { name: 'blue',       hex: '#003DA5', label: 'Bleu'        }, // standard flag blue
  { name: 'green',      hex: '#008751', label: 'Vert'        }, // Nigeria / standard flag green
  { name: 'yellow',     hex: '#FCD116', label: 'Jaune'       }, // standard flag yellow
  { name: 'orange',     hex: '#F77F00', label: 'Orange'      }, // Ivory Coast exact
  { name: 'lightblue',  hex: '#74ACDF', label: 'Bleu ciel'   }, // Argentina/Uruguay
  { name: 'navyblue',   hex: '#002395', label: 'Bleu marine' }, // France
  { name: 'royalblue',  hex: '#0032A0', label: 'Bleu royal'  }, // EU/Colombia
  { name: 'darkblue',   hex: '#0D47A1', label: 'Bleu foncé'  },
  { name: 'darkgreen',  hex: '#006600', label: 'Vert foncé'  },
  { name: 'emerald',    hex: '#169B62', label: 'Vert émeraude'}, // Ireland
  { name: 'gold',       hex: '#FFBE29', label: 'Or'          }, // Sri Lanka / Ghana
  { name: 'maroon',     hex: '#8D153A', label: 'Bordeaux'    }, // Sri Lanka
  { name: 'purple',     hex: '#6B2D8B', label: 'Violet'      }, // Dominica/Nicaragua
  { name: 'gray',       hex: '#9E9E9E', label: 'Gris'        },
  { name: 'brown',      hex: '#6D4C41', label: 'Marron'      },
  { name: 'cerulean',   hex: '#3D9BDC', label: 'Bleu ciel'   }, // Nicaragua/Honduras
  { name: 'teal',       hex: '#008080', label: 'Turquoise'   },
  { name: 'darkred',    hex: '#9E3039', label: 'Rouge foncé'  }, // Latvia
  { name: 'crimson',    hex: '#DC143C', label: 'Cramoisi'    }, // Poland
]

// Simple flag definitions for the canvas renderer
// ratio = width:height as decimal (e.g. 2:3 → 1.5, 1:2 → 2.0)
// The canvas will be sized/letterboxed to match the real ratio
const FLAG_DEFS = {
  // ── Europe ──────────────────────────────────────────────────────────────────
  fr: {
    en: 'France', fr: 'France', ratio: 1.5, // 2:3
    colors: ['navyblue','white','red'],
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
    en: 'Belgium', fr: 'Belgique', ratio: 15/13, // 13:15 official → W/H≈1.154
    colors: ['black','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#000000' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FDDA24' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#EF3340' },
    ]
  },
  nl: {
    en: 'Netherlands', fr: 'Pays-Bas', ratio: 1.5, // 2:3
    colors: ['red','white','royalblue'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/3, color: '#AE1C28' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#21468B' },
    ]
  },
  ru: {
    en: 'Russia', fr: 'Russie', ratio: 1.5, // 2:3
    colors: ['white','royalblue','red'],
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
    colors: ['navyblue','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#002395' }, // navyblue
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FCD116' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#CE1126' },
    ]
  },
  pl: {
    en: 'Poland', fr: 'Pologne', ratio: 8/5, // 5:8 official → W/H=1.6
    colors: ['white','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/2, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 1/2, w: 1, h: 1/2, color: '#DC143C' },
    ]
  },
  ua: {
    en: 'Ukraine', fr: 'Ukraine', ratio: 1.5, // 2:3
    colors: ['royalblue','yellow'],
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
    en: 'Estonia', fr: 'Estonie', ratio: 11/7, // 7:11 official → W/H≈1.571
    colors: ['royalblue','black','white'],
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
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#008751' },
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
    colors: ['navyblue','yellow','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1/3, h: 1, color: '#002395' }, // navyblue
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
    colors: ['green','white'],
    stripes: [
      { type: 'rect', x: 0,   y: 0, w: 1/3, h: 1, color: '#008751' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#008751' },
    ],
    zones: [
      { type: 'rect', x: 0,   y: 0, w: 1/3,  h: 1 }, // left green
      { type: 'rect', x: 1/3, y: 0, w: 1/3,  h: 1 }, // white center
      { type: 'rect', x: 2/3, y: 0, w: 1/3,  h: 1 }, // right green
    ]
  },
  gh: {
    en: 'Ghana', fr: 'Ghana', ratio: 1.5, // 2:3 — red/gold/green + black star
    colors: ['red','gold','green'],
    stripes: [
      { type: 'rect',   x: 0,    y: 0,   w: 1, h: 1/3, color: '#CE1126' },
      { type: 'rect',   x: 0,    y: 1/3, w: 1, h: 1/3, color: '#FCD116' },
      { type: 'rect',   x: 0,    y: 2/3, w: 1, h: 1/3, color: '#006B3F' },
      // Black star — pre-drawn, player paints the bands around it
      { type: 'image', src: 'https://flagcdn.com/w320/gh.png',
        clipX: 0.38, clipY: 0.36, clipW: 0.24, clipH: 0.28, fixed: true },
    ]
  },
  // ── Americas ─────────────────────────────────────────────────────────────────
  co: {
    en: 'Colombia', fr: 'Colombie', ratio: 1.5, // 2:3
    colors: ['yellow','royalblue','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1/2, color: '#FCD116' },
      { type: 'rect', x: 0, y: 1/2, w: 1, h: 1/4, color: '#003087' },
      { type: 'rect', x: 0, y: 3/4, w: 1, h: 1/4, color: '#CE1126' },
    ]
  },
  ar: {
    en: 'Argentina', fr: 'Argentine', ratio: 14/9, // 9:14 official (W/H=14/9≈1.556)
    colors: ['lightblue','white','gold'],
    stripes: [
      { type: 'rect',   x: 0,   y: 0,   w: 1,    h: 1/3,  color: '#74ACDF' },
      { type: 'rect',   x: 0,   y: 1/3, w: 1,    h: 1/3,  color: '#FFFFFF' },
      { type: 'rect',   x: 0,   y: 2/3, w: 1,    h: 1/3,  color: '#74ACDF' },
      // Sol de Mayo — cercle or central
      { type: 'circle', cx: 0.5, cy: 0.5, r: 0.08, color: '#F6B40E' },
    ]
  },
  // ── Asia ─────────────────────────────────────────────────────────────────────
  jp: {
    en: 'Japan', fr: 'Japon', ratio: 1.5, // 2:3
    colors: ['white','red'],
    stripes: [
      { type: 'rect',   x: 0,   y: 0,   w: 1,   h: 1,   color: '#FFFFFF' },
      { type: 'circle', cx: 0.5, cy: 0.5, r: 0.3, color: '#BC002D' },
    ],
    zones: [
      { type: 'rect',   x: 0,   y: 0,   w: 1,   h: 1  }, // white background
      { type: 'circle', cx: 0.5, cy: 0.5, r: 0.3       }, // red circle
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
      { type: 'rect', x: 0,    y: 0,    w: 1,     h: 1,     color: '#FF0000' },
      { type: 'rect', x: 5/16, y: 3/16, w: 6/16,  h: 10/16, color: '#FFFFFF' },
      { type: 'rect', x: 3/16, y: 5/16, w: 10/16, h: 6/16,  color: '#FFFFFF' },
    ],
    zones: [
      // 4 red corners
      { type: 'rect', x: 0,     y: 0,     w: 5/16,  h: 5/16  }, // TL red
      { type: 'rect', x: 11/16, y: 0,     w: 5/16,  h: 5/16  }, // TR red
      { type: 'rect', x: 0,     y: 11/16, w: 5/16,  h: 5/16  }, // BL red
      { type: 'rect', x: 11/16, y: 11/16, w: 5/16,  h: 5/16  }, // BR red
      // 4 red side rectangles (between cross arms and corners)
      { type: 'rect', x: 5/16,  y: 0,     w: 6/16,  h: 3/16  }, // red top
      { type: 'rect', x: 5/16,  y: 13/16, w: 6/16,  h: 3/16  }, // red bottom
      { type: 'rect', x: 0,     y: 5/16,  w: 3/16,  h: 6/16  }, // red left
      { type: 'rect', x: 13/16, y: 5/16,  w: 3/16,  h: 6/16  }, // red right
      // White cross: center + 4 arms
      { type: 'rect', x: 5/16,  y: 3/16,  w: 6/16,  h: 2/16  }, // white top arm
      { type: 'rect', x: 5/16,  y: 11/16, w: 6/16,  h: 2/16  }, // white bottom arm
      { type: 'rect', x: 3/16,  y: 5/16,  w: 2/16,  h: 6/16  }, // white left arm
      { type: 'rect', x: 11/16, y: 5/16,  w: 2/16,  h: 6/16  }, // white right arm
      { type: 'rect', x: 5/16,  y: 5/16,  w: 6/16,  h: 6/16  }, // white center
    ]
  },
  no: {
    en: 'Norway', fr: 'Norvège', ratio: 11/8, // 8:11 official → W/H=1.375
    colors: ['red','white','navyblue'],
    stripes: [
      { type: 'rect', x: 0,    y: 0,    w: 1,     h: 1,          color: '#EF2B2D' },
      { type: 'rect', x: 0,    y: 4/16, w: 1,     h: 3/16,       color: '#FFFFFF' },
      { type: 'rect', x: 4/16, y: 0,    w: 3/16,  h: 1,          color: '#FFFFFF' },
      { type: 'rect', x: 0,    y: 5/16, w: 1,     h: 1/16+0.062, color: '#002868' },
      { type: 'rect', x: 5/16, y: 0,    w: 1/16+0.062, h: 1,     color: '#002868' },
    ],
    zones: [
      // 4 red corners
      { type: 'rect', x: 0,    y: 0,    w: 4/16,  h: 4/16  }, // TL red
      { type: 'rect', x: 7/16, y: 0,    w: 9/16,  h: 4/16  }, // TR red
      { type: 'rect', x: 0,    y: 7/16, w: 4/16,  h: 9/16  }, // BL red
      { type: 'rect', x: 7/16, y: 7/16, w: 9/16,  h: 9/16  }, // BR red
      // blue cross center (vertical bar full height, minus white ring)
      { type: 'rect', x: 5/16, y: 0,    w: 2/16,  h: 1     }, // blue v-bar
      { type: 'rect', x: 0,    y: 5/16, w: 5/16,  h: 2/16  }, // blue h-bar left
      { type: 'rect', x: 7/16, y: 5/16, w: 9/16,  h: 2/16  }, // blue h-bar right
      // white ring segments
      { type: 'rect', x: 4/16, y: 0,    w: 1/16,  h: 5/16  }, // white v-left top
      { type: 'rect', x: 4/16, y: 7/16, w: 1/16,  h: 9/16  }, // white v-left bot
      { type: 'rect', x: 6/16, y: 0,    w: 1/16,  h: 5/16  }, // white v-right top
      { type: 'rect', x: 6/16, y: 7/16, w: 1/16,  h: 9/16  }, // white v-right bot
      { type: 'rect', x: 0,    y: 4/16, w: 5/16,  h: 1/16  }, // white h-top left
      { type: 'rect', x: 7/16, y: 4/16, w: 9/16,  h: 1/16  }, // white h-top right
      { type: 'rect', x: 0,    y: 6/16, w: 5/16,  h: 1/16  }, // white h-bot left
      { type: 'rect', x: 7/16, y: 6/16, w: 9/16,  h: 1/16  }, // white h-bot right
    ]
  },
  dk: {
    en: 'Denmark', fr: 'Danemark', ratio: 37/28, // 28:37 official → W/H≈1.321
    colors: ['red','white'],
    stripes: [
      { type: 'rect', x: 0,    y: 0,    w: 1,    h: 1,    color: '#C60C30' },
      { type: 'rect', x: 0,    y: 4/12, w: 1,    h: 2/12, color: '#FFFFFF' },
      { type: 'rect', x: 3/12, y: 0,    w: 2/12, h: 1,    color: '#FFFFFF' },
    ],
    zones: [
      { type: 'rect', x: 0,    y: 0,    w: 3/12,  h: 4/12  }, // TL red
      { type: 'rect', x: 5/12, y: 0,    w: 7/12,  h: 4/12  }, // TR red
      { type: 'rect', x: 0,    y: 6/12, w: 3/12,  h: 6/12  }, // BL red
      { type: 'rect', x: 5/12, y: 6/12, w: 7/12,  h: 6/12  }, // BR red
      { type: 'rect', x: 3/12, y: 0,    w: 2/12,  h: 4/12  }, // white v-bar top
      { type: 'rect', x: 3/12, y: 6/12, w: 2/12,  h: 6/12  }, // white v-bar bot
      { type: 'rect', x: 0,    y: 4/12, w: 3/12,  h: 2/12  }, // white h-bar left
      { type: 'rect', x: 5/12, y: 4/12, w: 7/12,  h: 2/12  }, // white h-bar right
    ]
  },
  se: {
    en: 'Sweden', fr: 'Suède', ratio: 8/5, // 5:8 official → W/H=1.6
    colors: ['royalblue','yellow'],
    stripes: [
      { type: 'rect', x: 0,    y: 0,    w: 1,       h: 1,       color: '#006AA7' },
      { type: 'rect', x: 0,    y: 4/16, w: 1,       h: 2.5/16,  color: '#FECC02' },
      { type: 'rect', x: 4/16, y: 0,    w: 2.5/16,  h: 1,       color: '#FECC02' },
    ],
    zones: [
      { type: 'rect', x: 0,       y: 0,       w: 4/16,    h: 4/16    }, // TL blue
      { type: 'rect', x: 6.5/16,  y: 0,       w: 9.5/16,  h: 4/16    }, // TR blue
      { type: 'rect', x: 0,       y: 6.5/16,  w: 4/16,    h: 9.5/16  }, // BL blue
      { type: 'rect', x: 6.5/16,  y: 6.5/16,  w: 9.5/16,  h: 9.5/16  }, // BR blue
      { type: 'rect', x: 4/16,    y: 0,       w: 2.5/16,  h: 4/16    }, // yellow v-bar top
      { type: 'rect', x: 4/16,    y: 6.5/16,  w: 2.5/16,  h: 9.5/16  }, // yellow v-bar bot
      { type: 'rect', x: 0,       y: 4/16,    w: 4/16,    h: 2.5/16  }, // yellow h-bar left
      { type: 'rect', x: 6.5/16,  y: 4/16,    w: 9.5/16,  h: 2.5/16  }, // yellow h-bar right
    ]
  },
  fi: {
    en: 'Finland', fr: 'Finlande', ratio: 18/11, // 11:18 official → W/H≈1.636
    colors: ['white','navyblue'],
    stripes: [
      { type: 'rect', x: 0,     y: 0,     w: 1,     h: 1,     color: '#FFFFFF' },
      { type: 'rect', x: 0,     y: 4/18,  w: 1,     h: 3/18,  color: '#003580' },
      { type: 'rect', x: 5/18,  y: 0,     w: 3/18,  h: 1,     color: '#003580' },
    ],
    // Non-overlapping zones for guide drawing & flood fill
    zones: [
      { type: 'rect', x: 0,     y: 0,     w: 5/18,  h: 4/18  }, // top-left white
      { type: 'rect', x: 8/18,  y: 0,     w: 10/18, h: 4/18  }, // top-right white
      { type: 'rect', x: 0,     y: 7/18,  w: 5/18,  h: 11/18 }, // bottom-left white
      { type: 'rect', x: 8/18,  y: 7/18,  w: 10/18, h: 11/18 }, // bottom-right white
      { type: 'rect', x: 5/18,  y: 0,     w: 3/18,  h: 1     }, // vertical blue bar
      { type: 'rect', x: 0,     y: 4/18,  w: 5/18,  h: 3/18  }, // left horizontal segment
      { type: 'rect', x: 8/18,  y: 4/18,  w: 10/18, h: 3/18  }, // right horizontal segment
    ]
  },

  // ── Asie ─────────────────────────────────────────────────────────────────
  lk: {
    en: 'Sri Lanka', fr: 'Sri Lanka', ratio: 2.0, // 1:2 → width:height
    hasEmblem: true,
    emblem: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Emblem_of_Sri_Lanka.svg/200px-Emblem_of_Sri_Lanka.svg.png', x: 0.28, y: 0.05, w: 0.44, h: 0.9 },
    emblemClip: { x: 0.45, y: 0.05, w: 0.5, h: 0.9 },
    colors: ['gold','maroon','orange','green'],
    stripes: [
      // Fond bordeaux
      { type: 'rect', x: 0,    y: 0, w: 1,    h: 1, color: '#8D153A' },
      // Bande orange à gauche
      { type: 'rect', x: 0,    y: 0, w: 0.10, h: 1, color: '#FF7300' },
      // Bande verte
      { type: 'rect', x: 0.10, y: 0, w: 0.10, h: 1, color: '#00534E' },
      { type: 'image', src: 'https://flagcdn.com/w320/lk.png',
        clipX: 0.22, clipY: 0.05, clipW: 0.78, clipH: 0.9, fixed: true },
    ]
  },

  // ── Caraïbes / Amériques ──────────────────────────────────────────────────
  ht: {
    en: 'Haiti', fr: 'Haïti', ratio: 1.667,
    hasEmblem: true,
    colors: ['navyblue','red'],
    stripes: [
      { type: 'rect', x: 0, y: 0,   w: 1, h: 0.5, color: '#00209F' },
      { type: 'rect', x: 0, y: 0.5, w: 1, h: 0.5, color: '#D21034' },
      // Coat of arms — drawn as image overlay (fixed)
      { type: 'image', src: 'https://flagcdn.com/w320/ht.png',
        clipX: 0.28, clipY: 0.18, clipW: 0.44, clipH: 0.64, fixed: true },
    ]
  },

  gt: {
    en: 'Guatemala', fr: 'Guatemala', ratio: 1.6, // 5:8 → width:height
    hasEmblem: true,
    emblem: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Coat_of_arms_of_Guatemala.svg/200px-Coat_of_arms_of_Guatemala.svg.png', x: 0.3, y: 0.1, w: 0.4, h: 0.8 },
    emblemClip: { x: 0.35, y: 0.15, w: 0.3, h: 0.7 },
    colors: ['blue','white'],
    stripes: [
      { type: 'rect', x: 0,   y: 0, w: 1/3, h: 1, color: '#4997D0' },
      { type: 'rect', x: 1/3, y: 0, w: 1/3, h: 1, color: '#FFFFFF' },
      { type: 'rect', x: 2/3, y: 0, w: 1/3, h: 1, color: '#4997D0' },
      { type: 'image', src: 'https://flagcdn.com/w320/gt.png',
        clipX: 0.3, clipY: 0.1, clipW: 0.4, clipH: 0.8, fixed: true },
    ]
  },

  dm: {
    en: 'Dominica', fr: 'Dominique', ratio: 2.0, // 1:2 → width:height
    hasEmblem: true,
    emblem: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Coat_of_arms_of_Dominica.svg/200px-Coat_of_arms_of_Dominica.svg.png', x: 0.32, y: 0.2, w: 0.36, h: 0.6 },
    emblemClip: { x: 0.3, y: 0.2, w: 0.4, h: 0.6 },
    colors: ['green','yellow','black','white','red','violet'],
    stripes: [
      // Fond vert
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, color: '#009E60' },
      // Croix jaune
      { type: 'rect', x: 0, y: 0.40, w: 1, h: 0.067, color: '#FCD116' },
      { type: 'rect', x: 0.46, y: 0, w: 0.08, h: 1, color: '#FCD116' },
      // Croix noire (intérieure)
      { type: 'rect', x: 0, y: 0.433, w: 1, h: 0.033, color: '#000000' },
      { type: 'rect', x: 0.483, y: 0, w: 0.033, h: 1, color: '#000000' },
      // Croix blanche (intérieure)
      { type: 'rect', x: 0, y: 0.453, w: 1, h: 0.013, color: '#FFFFFF' },
      { type: 'rect', x: 0.493, y: 0, w: 0.013, h: 1, color: '#FFFFFF' },
      // Disque central rouge
      { type: 'rect', x: 0.37, y: 0.28, w: 0.26, h: 0.44, color: '#CE1126' },
      { type: 'rect', x: 0.43, y: 0.34, w: 0.14, h: 0.24, color: '#6B2D8B' },
      { type: 'rect', x: 0.44, y: 0.32, w: 0.12, h: 0.08, color: '#009E60' },
      // Étoiles vertes (10) autour — simplifiées en petits carrés
      { type: 'rect', x: 0.38, y: 0.25, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.48, y: 0.23, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.58, y: 0.25, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.62, y: 0.35, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.62, y: 0.52, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.58, y: 0.62, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.48, y: 0.64, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.38, y: 0.62, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.34, y: 0.52, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'rect', x: 0.34, y: 0.35, w: 0.04, h: 0.04, color: '#009E60' },
      { type: 'image', src: 'https://flagcdn.com/w320/dm.png',
        clipX: 0.33, clipY: 0.22, clipW: 0.34, clipH: 0.56, fixed: true },
    ]
  },

  ni: {
    en: 'Nicaragua', fr: 'Nicaragua', ratio: 1.667, // 3:5 → width:height
    hasEmblem: true,
    emblem: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Coat_of_arms_of_Nicaragua.svg/200px-Coat_of_arms_of_Nicaragua.svg.png', x: 0.3, y: 0.15, w: 0.4, h: 0.7 },
    emblemClip: { x: 0.3, y: 0.25, w: 0.4, h: 0.5 },
    colors: ['cerulean','white'],
    stripes: [
      { type: 'rect', x: 0, y: 0,   w: 1, h: 1/3, color: '#3D9BDC' },
      { type: 'rect', x: 0, y: 1/3, w: 1, h: 1/3, color: '#FFFFFF' },
      { type: 'rect', x: 0, y: 2/3, w: 1, h: 1/3, color: '#3D9BDC' },
      { type: 'image', src: 'https://flagcdn.com/w320/ni.png',
        clipX: 0.33, clipY: 0.2, clipW: 0.34, clipH: 0.6, fixed: true },
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

// Replace dark border pixels with the average color of their non-dark neighbors
// so guide lines don't penalize the score
function flattenBorderPixels(imageData, W, H) {
  const data = imageData.data
  const DARK = 150 // threshold: r+g+b < DARK = border pixel
  const idx = (y, x) => (y * W + x) * 4

  // Two-pass: first identify borders, then replace with neighbor average
  const isBorder = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const pi = idx(y, x)
      if (data[pi] + data[pi+1] + data[pi+2] < DARK) {
        isBorder[y * W + x] = 1
      }
    }
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!isBorder[y * W + x]) continue
      // Find nearest non-border neighbor in a 3x3 window expanding to 7x7
      let r = 0, g = 0, b = 0, count = 0
      for (let radius = 1; radius <= 4 && count === 0; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
            if (isBorder[ny * W + nx]) continue
            const pi = idx(ny, nx)
            r += data[pi]; g += data[pi+1]; b += data[pi+2]
            count++
          }
        }
      }
      if (count > 0) {
        const pi = idx(y, x)
        data[pi]   = Math.round(r / count)
        data[pi+1] = Math.round(g / count)
        data[pi+2] = Math.round(b / count)
        data[pi+3] = 255
      }
    }
  }
  return imageData
}

// Compare two ImageData, skipping dark border pixels in the drawing (data1)
// so guide lines don't penalize the score → 100% possible when colors are correct
function compareImagesIgnoreBorders(data1, data2) {
  const len = data1.data.length
  let totalDist = 0
  let counted = 0
  const maxDist = 441.67
  // Tolerance: color differences below this Euclidean distance count as perfect
  // Accounts for palette vs real-flag slight shade differences
  const TOLERANCE = 50
  for (let i = 0; i < len; i += 4) {
    const r1 = data1.data[i], g1 = data1.data[i+1], b1 = data1.data[i+2]
    // Skip dark border pixels in the drawing (guide lines)
    if (r1 + g1 + b1 < 150) continue
    const r2 = data2.data[i], g2 = data2.data[i+1], b2 = data2.data[i+2]
    const d = colorDistance(r1,g1,b1, r2,g2,b2)
    // Within tolerance = treat as perfect match
    const penalised = Math.max(0, d - TOLERANCE)
    totalDist += penalised / maxDist
    counted++
  }
  if (counted === 0) return 0
  return Math.min(100, Math.round((1 - totalDist / counted) * 100))
}

// Compare two canvas ImageData and return similarity 0-100 (legacy, unused)
function compareImages(data1, data2) {
  return compareImagesIgnoreBorders(data1, data2)
}

// Flood fill algorithm
function floodFill(imageData, W, H, startX, startY, fillColorHex) {
  const [fr, fg, fb] = hexToRgb(fillColorHex)
  const data = imageData.data
  const idx = (y, x) => (y * W + x) * 4
  const start = idx(startY, startX)
  const tr = data[start], tg = data[start+1], tb = data[start+2]

  // Don't fill if clicking on a dark border line (r+g+b < 150 = very dark)
  if (tr + tg + tb < 150) return imageData
  // Don't fill if already same color
  if (colorDistance(tr,tg,tb, fr,fg,fb) < 10) return imageData

  const stack = [[startX, startY]]
  const visited = new Uint8Array(W * H)

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= W || y < 0 || y >= H) continue
    const i = y * W + x
    if (visited[i]) continue
    const pi = i * 4
    const pr = data[pi], pg = data[pi+1], pb = data[pi+2]
    // Stop at dark border pixels
    if (pr + pg + pb < 150) continue
    // Stop if pixel color differs too much from the target (already filled with another color)
    if (colorDistance(pr,pg,pb, tr,tg,tb) > 40) continue
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
  const [isMobile, setIsMobile] = useState(true)

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
  const [snapshotUrl, setSnapshotUrl] = useState(null) // captured drawing before result screen

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
      // Exact match only — show only the colors listed in the flag definition
      return ALL_COLORS.filter(c => def.colors.includes(c.name))
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
      // Guide lines on DRAWING canvas — dark borders act as flood-fill boundaries
      // compareImagesIgnoreBorders already skips dark pixels so score is unaffected
      if (cfg.showLines) drawGuideLines(ctx, key)
      // Fixed decorations (emblems) also on drawing canvas
      drawFixedDecorations(ctx, key)
      // Clear overlay (used only for line-tool preview)
      const overlay = overlayCanvasRef.current
      if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height)
    }, 50)
  }

  function drawGuideLines(ctx, key) {
    const def = FLAG_DEFS[key]
    if (!def) return
    const W = ctx.canvas.width, H = ctx.canvas.height

    const allZones = (def.zones || def.stripes).filter(s => !s.fixed)

    // Draw only dark border lines — NO tint fills
    // Canvas stays white so flood fill works cleanly
    // Dark lines act as natural flood-fill barriers
    // compareImagesIgnoreBorders skips dark pixels so lines don't penalize score
    ctx.strokeStyle = '#1A1A2E'
    ctx.lineWidth = 3
    ctx.setLineDash([])
    ctx.lineJoin = 'miter'
    allZones.filter(s => s.type !== 'circle').forEach(s => drawShape(ctx, s, W, H, 'stroke'))
  }

  function drawShape(ctx, s, W, H, mode) {
    if (s.type === 'circle') {
      ctx.beginPath()
      ctx.arc(Math.round(s.cx * W), Math.round(s.cy * H), Math.round(s.r * Math.min(W, H)), 0, Math.PI * 2)
      mode === 'fill' ? ctx.fill() : ctx.stroke()
    } else if (s.type === 'polygon') {
      ctx.beginPath()
      s.points.forEach(([px, py], i) => {
        const fn = i === 0 ? 'moveTo' : 'lineTo'
        ctx[fn](Math.round(px * W), Math.round(py * H))
      })
      ctx.closePath()
      mode === 'fill' ? ctx.fill() : ctx.stroke()
    } else {
      // rect
      const x = Math.round((s.x ?? 0) * W)
      const y = Math.round((s.y ?? 0) * H)
      const w = Math.round((s.w ?? 1) * W)
      const h = Math.round((s.h ?? 1) * H)
      if (mode === 'fill') ctx.fillRect(x, y, w, h)
      else ctx.strokeRect(x, y, w, h)
    }
  }

  // Draw all fixed decorations — handles both rect/circle stripes and image clips
  function drawFixedDecorations(ctx, key) {
    const def = FLAG_DEFS[key]
    if (!def) return
    const W = ctx.canvas.width, H = ctx.canvas.height
    const fixedStripes = def.stripes.filter(s => s.fixed)
    for (const s of fixedStripes) {
      if (s.type === 'image') {
        // Clip the real flag image to emblem region and draw at full opacity
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save()
          ctx.beginPath()
          ctx.rect(
            Math.round(s.clipX * W), Math.round(s.clipY * H),
            Math.round(s.clipW * W), Math.round(s.clipH * H)
          )
          ctx.clip()
          ctx.drawImage(img, 0, 0, W, H)
          ctx.restore()
        }
        img.src = s.src
      } else if (s.type === 'circle') {
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(Math.round(s.cx * W), Math.round(s.cy * H), Math.round(s.r * Math.min(W, H)), 0, Math.PI * 2)
        ctx.fill()
      } else if (s.type === 'polygon') {
        ctx.fillStyle = s.color
        ctx.beginPath()
        s.points.forEach(([px, py], i) => {
          i === 0 ? ctx.moveTo(Math.round(px * W), Math.round(py * H))
                  : ctx.lineTo(Math.round(px * W), Math.round(py * H))
        })
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillStyle = s.color
        ctx.fillRect(Math.round(s.x * W), Math.round(s.y * H), Math.round(s.w * W), Math.round(s.h * H))
      }
    }
  }

  function validate() {
    const drawCtx = drawingCanvasRef.current?.getContext('2d')
    const refCtx = refCanvasRef.current?.getContext('2d')
    if (!drawCtx || !refCtx) return

    const W = drawingCanvasRef.current.width
    const H = drawingCanvasRef.current.height
    const def = FLAG_DEFS[currentFlagKey]

    // 1. Snapshot FIRST — before any modification
    const snapshotDataUrl = drawingCanvasRef.current.toDataURL('image/png')

    const runComparison = () => {
      const drawData = drawCtx.getImageData(0, 0, W, H)
      const refData = refCtx.getImageData(0, 0, W, H)
      const sim = compareImagesIgnoreBorders(drawData, refData)
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
      setSnapshotUrl(snapshotDataUrl)
      setScreen(SCREEN.RESULT)
    } // end runComparison

    // Always use real flagcdn image as reference — guarantees pixel-perfect comparison
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      refCtx.clearRect(0, 0, W, H)
      refCtx.drawImage(img, 0, 0, W, H)
      runComparison()
    }
    img.onerror = () => {
      // Fallback: draw from stripes definition
      drawReferenceFlagCtx(refCtx, def, W, H)
      runComparison()
    }
    img.src = `https://flagcdn.com/w320/${currentFlagKey}.png`
  }

  function nextFlag() {
    setSnapshotUrl(null)
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
    drawFixedDecorations(ctx, currentFlagKey)
    const overlay = overlayCanvasRef.current
    if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height)
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
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body), system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
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
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body), system-ui, sans-serif" }}>
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
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body), system-ui, sans-serif" }}>
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
                {snapshotUrl
                  ? <img src={snapshotUrl} alt="your drawing" style={{ display: 'block', width: '100%' }} />
                  : <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>—</div>
                }
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
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body), system-ui, sans-serif", padding: '32px 16px 60px' }}>
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
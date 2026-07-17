'use client'

/*
 * FlagTemplateBuilder — Flag Draw, gabarits paramétrables (étape 2 + polish mobile).
 * Modèle "pot de peinture" : couleur active -> tap une zone pour la remplir.
 * Mobile = app-mode plein écran sans scroll, gros éléments tapables.
 */

import { useMemo, useState, useEffect } from 'react'

const W = 300, H = 200
const NEUTRAL = '#E8E6DF'
const STROKE = 'rgba(22,50,79,0.28)'
const DS = { navy: '#16324F', border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5', muted: '#6B7280', gold: '#F4B400', bg: '#F4F1E6', surface: '#FFFFFF', bgAlt: '#FAFAF7' }
const PALETTE = ['#D62828', '#2563EB', '#16A34A', '#F4C400', '#FFFFFF', '#111827', '#EA580C', '#6B21A8']
const RATIOS = [['3:2', '3 / 2'], ['2:1', '2 / 1'], ['5:3', '5 / 3'], ['4:3', '4 / 3'], ['1:1', '1 / 1']]
const SYMBOL_COLORS = ['#D62828', '#FFFFFF', '#F4B400', '#16A34A', '#2563EB', '#111827']
const ZONE_ASPECT = '3 / 2'   // zone de drapeau de taille fixe ; seul le drapeau varie dedans

const pts = (arr) => arr.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
const rect = (x, y, w, h) => ({ type: 'rect', x, y, w, h })
const poly = (points) => ({ type: 'poly', points })
function diagBand(x1, y1, x2, y2, t) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1
  const px = (-dy / len) * (t / 2), py = (dx / len) * (t / 2)
  return [[x1 + px, y1 + py], [x2 + px, y2 + py], [x2 - px, y2 - py], [x1 - px, y1 - py]]
}
function bandWidths(n, weights) { const ws = Array(n).fill(1); if (weights === 'center') ws[Math.floor(n / 2)] = 2; else if (weights === 'top') ws[0] = 2; else if (weights === 'bottom') ws[n - 1] = 2; return ws }

const STRUCTURES = [
  { id: 'bands', label: { en: 'Bands', fr: 'Bandes' },
    options: {
      dir: { label: { en: 'Direction', fr: 'Sens' }, choices: [['h', 'Horizontal'], ['v', 'Vertical']], default: 'h' },
      count: { label: { en: 'Count', fr: 'Nombre' }, choices: [[2, '2'], [3, '3'], [4, '4'], [5, '5']], default: 3 },
      weights: { label: { en: 'Widths', fr: 'Largeurs' }, choices: [['eq', 'Égales'], ['center', 'Centre'], ['top', 'Haut'], ['bottom', 'Bas']], default: 'eq' },
    },
    regions: (o) => {
      const n = Number(o.count), horiz = o.dir === 'h', ws = bandWidths(n, o.weights), tot = ws.reduce((a, b) => a + b, 0)
      const regs = []; let acc = 0
      for (let i = 0; i < n; i++) { const f0 = acc / tot, f1 = (acc + ws[i]) / tot; acc += ws[i]; regs.push({ id: 'b' + i, shapes: [horiz ? rect(0, f0 * H, W, (f1 - f0) * H) : rect(f0 * W, 0, (f1 - f0) * W, H)] }) }
      return regs
    } },
  { id: 'plain', label: { en: 'Plain', fr: 'Uni' },
    options: { canton: { label: { en: 'Canton', fr: 'Canton' }, choices: [['none', 'Aucun'], ['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'none' } },
    regions: (o) => {
      const base = [{ id: 'field', shapes: [rect(0, 0, W, H)] }]
      if (o.canton === 'none') return base
      const cw = { S: 0.34, M: 0.40, L: 0.50 }[o.canton] * W, ch = { S: 0.38, M: 0.54, L: 0.62 }[o.canton] * H
      return [...base, { id: 'canton', shapes: [rect(0, 0, cw, ch)] }]
    } },
  { id: 'canton', label: { en: 'Canton + field', fr: 'Canton + champ' },
    options: {
      stripes: { label: { en: 'Stripes', fr: 'Rayures' }, choices: [[1, '1'], [7, '7'], [9, '9'], [11, '11'], [13, '13']], default: 13 },
      size: { label: { en: 'Canton size', fr: 'Taille canton' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' },
    },
    regions: (o) => {
      const n = Number(o.stripes)
      const stripes = Array.from({ length: n }, (_, i) => ({ id: 's' + i, shapes: [rect(0, i * H / n, W, H / n)] }))
      const cw = { S: 0.34, M: 0.40, L: 0.50 }[o.size] * W, ch = { S: 0.38, M: 0.54, L: 0.62 }[o.size] * H
      return [...stripes, { id: 'canton', shapes: [rect(0, 0, cw, ch)] }]
    } },
  { id: 'cross', label: { en: 'Cross', fr: 'Croix' },
    options: {
      type: { label: { en: 'Type', fr: 'Type' }, choices: [['nordic', 'Nordique'], ['center', 'Centrée']], default: 'nordic' },
      thickness: { label: { en: 'Thickness', fr: 'Épaisseur' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' },
    },
    regions: (o) => {
      const t = { S: 26, M: 38, L: 52 }[o.thickness], vx = o.type === 'nordic' ? W * 0.34 - t / 2 : (W - t) / 2, vy = (H - t) / 2
      return [{ id: 'field', shapes: [rect(0, 0, W, H)] }, { id: 'cross', shapes: [rect(vx, 0, t, H), rect(0, vy, W, t)] }]
    } },
  { id: 'saltire', label: { en: 'Saltire', fr: 'Sautoir' },
    options: {
      count: { label: { en: 'Bands', fr: 'Bandes' }, choices: [[1, '1'], [2, '2 (X)']], default: 2 },
      dir: { label: { en: 'Direction', fr: 'Sens' }, choices: [['down', '↘'], ['up', '↗']], default: 'down' },
      thickness: { label: { en: 'Thickness', fr: 'Épaisseur' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' },
    },
    regions: (o) => {
      const t = { S: 26, M: 38, L: 52 }[o.thickness]
      if (Number(o.count) === 1) {
        if (o.dir === 'up') return [
          { id: 'ul', shapes: [poly([[0, 0], [W, 0], [0, H]])] },
          { id: 'lr', shapes: [poly([[W, 0], [W, H], [0, H]])] },
          { id: 'band', shapes: [poly(diagBand(0, H, W, 0, t))] },
        ]
        return [
          { id: 'ur', shapes: [poly([[0, 0], [W, 0], [W, H]])] },
          { id: 'll', shapes: [poly([[0, 0], [W, H], [0, H]])] },
          { id: 'band', shapes: [poly(diagBand(0, 0, W, H, t))] },
        ]
      }
      const c = [W / 2, H / 2]
      return [
        { id: 'top', shapes: [poly([[0, 0], [W, 0], c])] },
        { id: 'right', shapes: [poly([[W, 0], [W, H], c])] },
        { id: 'bot', shapes: [poly([[W, H], [0, H], c])] },
        { id: 'left', shapes: [poly([[0, H], [0, 0], c])] },
        { id: 'x', shapes: [poly(diagBand(0, 0, W, H, t)), poly(diagBand(0, H, W, 0, t))] },
      ]
    } },
  { id: 'triangle', label: { en: 'Hoist triangle', fr: 'Triangle hampe' },
    options: {
      bands: { label: { en: 'Bands', fr: 'Bandes' }, choices: [[1, '1'], [2, '2'], [3, '3']], default: 3 },
      depth: { label: { en: 'Depth', fr: 'Profondeur' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' },
    },
    regions: (o) => {
      const n = Number(o.bands), field = Array.from({ length: n }, (_, i) => ({ id: 'b' + i, shapes: [rect(0, i * H / n, W, H / n)] }))
      const d = { S: 0.28, M: 0.42, L: 0.58 }[o.depth] * W
      return [...field, { id: 'tri', shapes: [poly([[0, 0], [d, H / 2], [0, H]])] }]
    } },
  { id: 'diagonal', label: { en: 'Diagonal', fr: 'Diagonale' },
    options: { count: { label: { en: 'Splits', fr: 'Séparations' }, choices: [[1, '1'], [2, '2 (croix)']], default: 1 } },
    regions: (o) => {
      if (Number(o.count) === 2) { const c = [W / 2, H / 2]; return [{ id: 't', shapes: [poly([[0, 0], [W, 0], c])] }, { id: 'r', shapes: [poly([[W, 0], [W, H], c])] }, { id: 'b', shapes: [poly([[W, H], [0, H], c])] }, { id: 'l', shapes: [poly([[0, H], [0, 0], c])] }] }
      return [{ id: 'up', shapes: [poly([[0, 0], [W, 0], [W, H]])] }, { id: 'lo', shapes: [poly([[0, 0], [W, H], [0, H]])] }]
    } },
  { id: 'vband', label: { en: 'Hoist band', fr: 'Bande hampe' },
    options: {
      bands: { label: { en: 'Bands', fr: 'Bandes' }, choices: [[2, '2'], [3, '3'], [4, '4']], default: 3 },
      width: { label: { en: 'Band width', fr: 'Largeur bande' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' },
    },
    regions: (o) => {
      const bw = { S: 0.22, M: 0.30, L: 0.40 }[o.width] * W, n = Number(o.bands)
      const bands = Array.from({ length: n }, (_, i) => ({ id: 'b' + i, shapes: [rect(bw, i * H / n, W - bw, H / n)] }))
      return [...bands, { id: 'vband', shapes: [rect(0, 0, bw, H)] }]
    } },
  { id: 'chevron', label: { en: 'Chevron', fr: 'Chevron' },
    options: {
      dir: { label: { en: 'From', fr: 'Depuis' }, choices: [['hoist', 'Hampe'], ['top', 'Haut']], default: 'hoist' },
      depth: { label: { en: 'Depth', fr: 'Profondeur' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' },
    },
    regions: (o) => {
      const d = { S: 0.4, M: 0.6, L: 0.8 }[o.depth]
      if (o.dir === 'top') return [{ id: 'field', shapes: [rect(0, 0, W, H)] }, { id: 'chev', shapes: [poly([[0, 0], [W, 0], [W / 2, H * d]])] }]
      const apex = [W * d, H / 2]
      return [{ id: 'top', shapes: [poly([[0, 0], [W, 0], [W, H / 2], apex])] }, { id: 'bot', shapes: [poly([[0, H], [W, H], [W, H / 2], apex])] }, { id: 'chev', shapes: [poly([[0, 0], apex, [0, H]])] }]
    } },
  { id: 'rhombus', label: { en: 'Rhombus', fr: 'Losange' },
    options: { size: { label: { en: 'Size', fr: 'Taille' }, choices: [['S', 'S'], ['M', 'M'], ['L', 'L']], default: 'M' } },
    regions: (o) => {
      const ix = { S: 0.22, M: 0.16, L: 0.09 }[o.size] * W, iy = { S: 0.20, M: 0.13, L: 0.07 }[o.size] * H
      return [{ id: 'field', shapes: [rect(0, 0, W, H)] }, { id: 'rhomb', shapes: [poly([[W / 2, iy], [W - ix, H / 2], [W / 2, H - iy], [ix, H / 2]])] }]
    } },
  { id: 'serrated', label: { en: 'Serrated', fr: 'Bord dentelé' },
    options: { points: { label: { en: 'Points', fr: 'Pointes' }, choices: [[5, '5'], [8, '8'], [9, '9']], default: 9 } },
    regions: (o) => {
      const n = Number(o.points), bx = W * 0.30, amp = W * 0.06, boundary = [[bx, 0]]
      for (let i = 0; i < n; i++) { boundary.push([bx + amp, (i + 0.5) * H / n]); boundary.push([bx, (i + 1) * H / n]) }
      return [{ id: 'fly', shapes: [rect(0, 0, W, H)] }, { id: 'hoist', shapes: [poly([[0, 0], ...boundary, [0, H]])] }]
    } },
  { id: 'rays', label: { en: 'Rays', fr: 'Rayons' },
    options: {},
    regions: () => { const o0 = [0, H], targets = [[0, 0], [W * 0.5, 0], [W, 0], [W, H * 0.35], [W, H * 0.7], [W, H]]; return targets.slice(0, -1).map((tg, i) => ({ id: 'r' + i, shapes: [poly([o0, tg, targets[i + 1]])] })) } },
  { id: 'pall', label: { en: 'Y-pall', fr: 'Fourche Y' },
    options: {},
    regions: () => [
      { id: 'top', shapes: [poly([[0, 0], [W, 0], [W, 88], [128, 88]])] },
      { id: 'bot', shapes: [poly([[0, H], [W, H], [W, 112], [128, 112]])] },
      { id: 'hoist', shapes: [poly([[0, 32], [96, 100], [0, 168]])] },
      { id: 'ypall', shapes: [{ type: 'path', d: 'M0 0 L128 88 L300 88 L300 112 L128 112 L0 200 L0 168 L96 100 L0 32 Z' }] },
    ] },
  { id: 'nepal', label: { en: 'Nepal', fr: 'Népal' },
    options: {},
    regions: () => {
      const outer = [[12, 10], [188, 96], [110, 110], [290, 168], [12, 190]]
      const cx = outer.reduce((a, p) => a + p[0], 0) / outer.length
      const cy = outer.reduce((a, p) => a + p[1], 0) / outer.length
      const inner = outer.map(([x, y]) => [cx + (x - cx) * 0.82, cy + (y - cy) * 0.82])
      return [{ id: 'border', shapes: [poly(outer)] }, { id: 'field', shapes: [poly(inner)] }]
    } },
]

const byId = (id) => STRUCTURES.find(s => s.id === id)
const defaultOpts = (s) => Object.fromEntries(Object.entries(s.options).map(([k, v]) => [k, v.default]))
function symbolAnchor(id, o) {
  if (id === 'triangle') { const d = { S: 0.28, M: 0.42, L: 0.58 }[o.depth] * W; return { x: d * 0.36, y: H / 2, size: 46 } }
  if (id === 'vband') { const bw = { S: 0.22, M: 0.30, L: 0.40 }[o.width] * W; return { x: bw / 2, y: H / 2, size: 40 } }
  if (id === 'nepal') return { x: 60, y: 52, size: 24 }
  if (id === 'canton' || (id === 'plain' && o.canton !== 'none')) return { x: W / 2, y: H / 2, size: 58 }
  if (id === 'rhombus') return { x: W / 2, y: H / 2, size: 66 }
  return { x: W / 2, y: H / 2, size: 60 }
}
const starPts = (cx, cy, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]) } return p }

function useMobile() {
  const [m, setM] = useState(false)
  useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const on = () => setM(mq.matches); on(); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on) }, [])
  return m
}

function Shape({ shape, fill, onClick, thumb }) {
  const common = { fill, stroke: STROKE, strokeWidth: thumb ? 0.5 : 1, style: onClick ? { cursor: 'pointer' } : undefined, onClick }
  if (shape.type === 'rect') return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...common} />
  if (shape.type === 'path') return <path d={shape.d} {...common} />
  return <polygon points={pts(shape.points)} {...common} />
}
function StructureSVG({ structure, options, colors, onFill, thumb, symbol, symbolUrl, aspect, symbolColor }) {
  const regions = useMemo(() => structure.regions(options), [structure, options])
  const svgEl = (
    <svg viewBox={`0 0 ${W} ${H}`} width={aspect ? undefined : '100%'} preserveAspectRatio={aspect ? 'none' : undefined} style={{ display: 'block', ...(aspect ? { aspectRatio: aspect, maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' } : {}), borderRadius: thumb ? 4 : 10, border: thumb ? 'none' : `2px solid ${DS.borderSolid}`, background: NEUTRAL }}>
      {regions.map((rg, i) => {
        const neutral = thumb ? ['#DAD8D0', '#C9C7BE', '#BCBAB0', '#ADABA1'][i % 4] : NEUTRAL
        const fill = colors?.[rg.id] || neutral
        return <g key={rg.id}>{rg.shapes.map((sh, j) => <Shape key={j} shape={sh} fill={fill} thumb={thumb} onClick={onFill ? () => onFill(rg.id) : undefined} />)}</g>
      })}
      {!thumb && symbol && (symbolUrl
        ? <image href={symbolUrl} x={symbol.x - symbol.size / 2} y={symbol.y - symbol.size / 2} width={symbol.size} height={symbol.size} preserveAspectRatio="xMidYMid meet" />
        : <polygon points={pts(starPts(symbol.x, symbol.y, symbol.size / 2))} fill={symbolColor || DS.gold} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />)}
    </svg>
  )
  if (!aspect) return svgEl
  return (
    <div style={{ width: '100%', aspectRatio: ZONE_ASPECT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svgEl}</div>
  )
}

export default function FlagTemplateBuilder({ locale = 'fr', countryName = 'France', symbolUrl = null, onChange, onValidate, onQuit, ratioChoices = RATIOS, showRatio = true, symbolColor = '#F4B400', symbolAuto = false, symbolPickColor = false, hasSymbol = true }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const isMobile = useMobile()
  const [structureId, setStructureId] = useState('bands')
  const structure = byId(structureId)
  const [options, setOptions] = useState(() => defaultOpts(structure))
  const [colors, setColors] = useState({})
  const [active, setActive] = useState(PALETTE[0])
  const [custom, setCustom] = useState('#0055A4')
  const [showSymbol, setShowSymbol] = useState(symbolAuto && hasSymbol)
  const [symColor, setSymColor] = useState(symbolColor)
  const [ratio, setRatio] = useState(ratioChoices[0] ? ratioChoices[0][1] : '3 / 2')
  const symbol = showSymbol ? symbolAnchor(structureId, options) : null
  const symFill = symbolPickColor ? symColor : symbolColor

  function pickStructure(id) { const no = defaultOpts(byId(id)); setStructureId(id); setOptions(no); setColors({}); onChange?.({ structureId: id, options: no, colors: {}, symbol: showSymbol }) }
  function setOption(key, val) { const next = { ...options, [key]: val }; setOptions(next); setColors({}); onChange?.({ structureId, options: next, colors: {}, symbol: showSymbol }) }
  function fill(regionId) { const next = { ...colors, [regionId]: active }; setColors(next); onChange?.({ structureId, options, colors: next, symbol: showSymbol }) }

  const SW = isMobile ? 40 : 30
  const chip = (val, label, isOn, on) => (
    <button key={String(val)} onClick={on} style={{ padding: isMobile ? '10px 16px' : '6px 12px', borderRadius: 8, fontSize: isMobile ? 14 : 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: isOn ? `2px solid ${DS.navy}` : `1.5px solid ${DS.borderSolid}`, background: isOn ? DS.navy : DS.bgAlt, color: isOn ? '#fff' : DS.navy }}>{label}</button>
  )

  const nameText = (
    <div><div style={{ fontSize: 12, color: DS.muted }}>{t('Draw the flag of', 'Dessine le drapeau de')}</div>
      <div style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: DS.navy, fontFamily: 'var(--font-display, system-ui)' }}>{countryName}</div></div>
  )
  const quitBtn = (
    <button onClick={() => onQuit?.()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${DS.borderSolid}`, background: DS.surface, color: DS.navy, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      {t('Save & exit', 'Quitter')}
    </button>
  )
  const nameHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>{nameText}{quitBtn}</div>
  )
  const canvasEl = <StructureSVG structure={structure} options={options} colors={colors} onFill={fill} symbol={symbol} symbolUrl={symbolUrl} symbolColor={symFill} aspect={ratio} />
  const swatchBase = isMobile ? { flex: 1, minWidth: 0, aspectRatio: '1' } : { width: SW, height: SW }
  const paletteEl = (
    <div style={{ display: 'flex', gap: 6, flexWrap: isMobile ? 'nowrap' : 'wrap', alignItems: 'center' }}>
      {PALETTE.map(c => <button key={c} onClick={() => setActive(c)} aria-label={c} style={{ ...swatchBase, borderRadius: 8, background: c, cursor: 'pointer', border: c === '#FFFFFF' ? '1px solid rgba(0,0,0,0.15)' : 'none', outline: active === c ? `2.5px solid ${DS.navy}` : 'none', outlineOffset: 1 }} />)}
      <span style={{ ...swatchBase, position: 'relative', display: 'block' }}>
        <input type="color" value={custom} onChange={e => { setCustom(e.target.value); setActive(e.target.value) }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: 8, background: custom, border: active === custom && !PALETTE.includes(custom) ? `2.5px solid ${DS.navy}` : '1px dashed ' + DS.borderSolid, color: '#fff', fontSize: 16, fontWeight: 700 }}>+</span>
      </span>
    </div>
  )
  const ratioSection = (
    <div style={{ display: 'flex', gap: 5, ...(isMobile ? { flexWrap: 'nowrap', overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 } : { flexWrap: 'wrap' }) }}>{ratioChoices.map(([lbl, val]) => chip(val, lbl, ratio === val, () => setRatio(val)))}</div>
  )
  const templateThumb = (s, big) => (
    <button key={s.id} onClick={() => pickStructure(s.id)} style={{ flexShrink: 0, width: big ? 104 : '100%', scrollSnapAlign: 'start', padding: big ? 5 : 3, borderRadius: 8, cursor: 'pointer', background: DS.bgAlt, border: structureId === s.id ? `2px solid ${DS.navy}` : `1px solid ${DS.borderSolid}` }}>
      <StructureSVG structure={s} options={defaultOpts(s)} colors={{}} thumb />
      <div style={{ fontSize: big ? 13 : 9, fontWeight: 600, color: structureId === s.id ? DS.navy : DS.muted, marginTop: big ? 4 : 3, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label[locale] || s.label.en}</div>
    </button>
  )
  const OPT_ROWS = 3, OPT_ROW_H = 36, OPT_GAP = 7
  const optEntries = Object.entries(structure.options)
  const optionsEl = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: OPT_GAP, height: OPT_ROWS * OPT_ROW_H + (OPT_ROWS - 1) * OPT_GAP, overflow: 'hidden' }}>
      {optEntries.map(([key, opt]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, height: OPT_ROW_H, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: DS.muted, minWidth: 78, flexShrink: 0 }}>{opt.label[locale] || opt.label.en}</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>{opt.choices.map(([val, label]) => chip(val, label, String(options[key]) === String(val), () => setOption(key, val)))}</div>
        </div>
      ))}
      {Array.from({ length: Math.max(0, OPT_ROWS - optEntries.length) }).map((_, i) => (
        <div key={'ph' + i} aria-hidden="true" style={{ height: OPT_ROW_H, flexShrink: 0 }} />
      ))}
    </div>
  )
  const symbolRow = (!hasSymbol || symbolAuto) ? null : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: DS.muted, minWidth: 78, flexShrink: 0 }}>{t('Symbol', 'Symbole')}</span>
      <button onClick={() => { const v = !showSymbol; setShowSymbol(v); onChange?.({ structureId, options, colors, symbol: v }) }} style={{ flex: symbolPickColor ? '1 1 140px' : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 10, border: showSymbol ? `2px solid ${DS.navy}` : `1.5px solid ${DS.borderSolid}`, background: DS.surface, color: DS.navy, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 7 18.2l1.9-5.8L4 8.8h6.1z"/></svg>
        {showSymbol ? t('Remove symbol', 'Retirer le symbole') : t('Add a symbol', 'Ajouter un symbole')}
      </button>
      {symbolPickColor && (
        <div style={{ display: 'flex', gap: 4 }}>
          {SYMBOL_COLORS.map(c => <button key={c} onClick={() => setSymColor(c)} aria-label={c} style={{ width: 26, height: 26, borderRadius: 6, background: c, cursor: 'pointer', border: c === '#FFFFFF' ? '1px solid rgba(0,0,0,0.15)' : 'none', outline: symColor === c ? `2px solid ${DS.navy}` : 'none', outlineOffset: 1 }} />)}
        </div>
      )}
    </div>
  )
  const clearBtn = (
    <button onClick={() => { setColors({}); onChange?.({ structureId, options, colors: {}, symbol: showSymbol }) }} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1.5px solid ${DS.borderSolid}`, background: DS.surface, color: DS.navy, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{t('Clear', 'Effacer')}</button>
  )
  const validateBtn = (
    <button onClick={() => onValidate?.({ structureId, options, colors, symbol: showSymbol })} style={{ flex: 1.3, padding: 11, borderRadius: 10, border: 'none', background: DS.navy, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{t('Validate', 'Valider')}</button>
  )
  const card = (children, pad = '10px 12px') => <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: pad }}>{children}</div>
  const label = (txt) => <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{txt}</p>

  // ── MOBILE app-mode : overlay fixe sous le header, aucun scroll ──
  if (isMobile) {
    return (
      <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, zIndex: 5, display: 'flex', flexDirection: 'column', background: DS.bg, overflow: 'hidden', fontFamily: 'var(--font-body, system-ui)' }}>
        <div style={{ flexShrink: 0, padding: '10px 14px 0' }}>{nameHeader}</div>
        <div style={{ flex: 1, minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 14px' }}><div style={{ width: '100%', maxWidth: 380 }}>{canvasEl}</div></div>
        <div style={{ flexShrink: 0, maxHeight: '46vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: DS.surface, borderTop: `1px solid ${DS.border}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {showRatio && (<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, color: DS.muted, minWidth: 52, flexShrink: 0 }}>{t('Ratio', 'Ratio')}</span>{ratioSection}</div>)}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}>{STRUCTURES.map(s => templateThumb(s, true))}</div>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 2, width: 18, pointerEvents: 'none', background: `linear-gradient(to left, transparent, ${DS.surface})` }} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 2, width: 44, pointerEvents: 'none', background: `linear-gradient(to right, transparent, ${DS.surface})`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 2 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={DS.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
            </div>
          </div>
          {optionsEl}
          {symbolRow}
          {paletteEl}
        </div>
        <div style={{ flexShrink: 0, background: DS.surface, borderTop: `1px solid ${DS.border}`, padding: '10px 14px calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, boxShadow: '0 -4px 16px rgba(22,50,79,0.06)' }}>{clearBtn}{validateBtn}</div>
      </div>
    )
  }

  // ── DESKTOP : Ratio en haut, 3 colonnes égales (Gabarit / Options / Drapeau+Couleur) ──
  return (
    <div style={{ background: DS.bg, borderRadius: 14, padding: 14, fontFamily: 'var(--font-body, system-ui)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>{quitBtn}</div>
      <div style={{ display: 'grid', gridTemplateColumns: showRatio ? '0.62fr 1.35fr 1fr 1.1fr' : '1.35fr 1fr 1.1fr', gap: 12, alignItems: 'stretch' }}>

        {/* Col Ratio (moyen / difficile) */}
        {showRatio && card(<>{label(t('Ratio', 'Ratio'))}{ratioSection}</>)}

        {/* Col Gabarit (4 par ligne) */}
        {card(<>{label(t('Template', 'Gabarit'))}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>{STRUCTURES.map(s => templateThumb(s, false))}</div></>)}

        {/* Col 2 : Options (symbole inclus) + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
          {card(<>{label(t('Options', 'Options'))}{optionsEl}<div style={{ marginTop: 10 }}>{symbolRow}</div></>)}
          <div style={{ display: 'flex', gap: 8 }}>{clearBtn}{validateBtn}</div>
        </div>

        {/* Col 3 : Drapeau puis Couleur */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
          <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 10 }}>{nameText}</div>
            <div style={{ width: '100%', maxWidth: 260, margin: '0 auto' }}>{canvasEl}</div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: DS.muted, textAlign: 'center' }}>{t('Pick a color, then tap the zones.', 'Choisis une couleur, puis tape les zones.')}</p>
          </div>
          {card(<>{label(t('Active color', 'Couleur active'))}{paletteEl}</>)}
        </div>
      </div>
    </div>
  )
}


// Rasterise un design {structureId, options, colors, symbol} sur un <canvas>
// (pour la comparaison au vrai drapeau via l'algo LAB de FlagDrawing).
function renderDesignToCanvas(canvas, design, symbolImg) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const s = byId(design.structureId)
  if (!s) return
  ctx.save()
  ctx.scale(canvas.width / W, canvas.height / H)
  for (const rg of s.regions(design.options || {})) {
    const color = design.colors && design.colors[rg.id]
    if (!color) continue
    ctx.fillStyle = color
    for (const sh of rg.shapes) {
      if (sh.type === 'path') { ctx.fill(new Path2D(sh.d)); continue }
      ctx.beginPath()
      if (sh.type === 'rect') ctx.rect(sh.x, sh.y, sh.w, sh.h)
      else sh.points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
      ctx.fill()
    }
  }
  if (design.symbol && symbolImg) {
    const a = symbolAnchor(design.structureId, design.options || {})
    try { ctx.drawImage(symbolImg, a.x - a.size / 2, a.y - a.size / 2, a.size, a.size) } catch {}
  }
  ctx.restore()
}

export { STRUCTURES, byId, defaultOpts, symbolAnchor, renderDesignToCanvas }
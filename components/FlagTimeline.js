'use client'

// ── Évolution du drapeau (page pays) ──────────────────────────────────────────
// Remplace l'arbre de FlagHistoryModule (toujours dans le code, masqué dans
// CountryDetailPage). Un seul DOM, mis en page par CSS :
//   mobile (< 768 px)  : aperçu, frise compacte, commandes, arbre complet
//   tablette / desktop : aperçu en ligne, frise proportionnelle, grille de vignettes
// Les drapeaux utilisés en même temps qu'un autre vont sur un second couloir
// (frise) et sur une branche bleue (arbre mobile).

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'

const FlagSubmitModal = dynamic(() => import('@/components/FlagSubmitModal'), { ssr: false })

const C = {
  navy: '#16324F', navyLight: '#1E4976', text: '#0F1923', body: '#4B5563',
  muted: '#6B7280', light: '#9CA3AF', surface: '#FFFFFF', bgAlt: '#FAFAF7',
  secondary: '#EEF2F7', border: '#E2DDD5', gold: '#F4B400',
  green: '#16A34A', greenLight: '#DCFCE7', greenText: '#15803D',
  blue: '#2563EB', blueLight: '#DBEAFE', blueText: '#1E40AF',
  goldLight: '#FEF3C7', goldText: '#92400E',
}

const PLAY_MS = 2600
// Milieu de l'année en cours : même valeur côté serveur et navigateur (pas d'écart d'hydratation)
const NOW_Y = new Date().getUTCFullYear() + 0.5

// 'YYYY-MM-DD' → année décimale, sans fuseau horaire
function fracYear(d) {
  const [y, m = 1, day = 1] = String(d).slice(0, 10).split('-').map(Number)
  return y + ((m - 1) * 30.44 + (day - 1)) / 365.25
}

// Lignes triées par date, avec couloir : 0 = principal, 1+ = en parallèle.
// Les plus longues périodes prennent le couloir principal ; un chevauchement
// de quelques semaines (passation) n'ouvre pas de couloir.
function prepare(rows) {
  const items = (rows || [])
    .filter(r => r && r.date_start)
    .map(r => {
      const s = fracYear(r.date_start)
      let e = r.date_end ? fracYear(r.date_end) : NOW_Y
      if (!(e > s)) e = s + 0.1
      return {
        ...r, s, e, lane: 0,
        current: !r.date_end,
        y0: Number(String(r.date_start).slice(0, 4)),
        y1: r.date_end ? Number(String(r.date_end).slice(0, 4)) : null,
      }
    })
    .sort((a, b) => a.s - b.s || a.e - b.e)

  const lanes = []
  for (const it of [...items].sort((a, b) => (b.e - b.s) - (a.e - a.s))) {
    for (let lane = 0; ; lane++) {
      const occ = lanes[lane] || (lanes[lane] = [])
      const clash = occ.some(o => {
        const ov = Math.min(o.e, it.e) - Math.max(o.s, it.s)
        return ov > Math.max(0.25, 0.1 * Math.min(o.e - o.s, it.e - it.s))
      })
      if (!clash || lane >= 2) { occ.push(it); it.lane = lane; break }
    }
  }
  return items
}

// Échelle compressée : chaque intervalle entre deux dates pèse √(durée),
// les trous de 2 ans et plus gardent une petite place (pointillés).
function buildGeometry(items) {
  const pts = [...new Set(items.flatMap(i => [i.s, i.e]))].sort((a, b) => a - b)
  const parts = []
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1], d = b - a
    const covered = items.some(i => i.s < b - 1e-6 && i.e > a + 1e-6)
    const gap = !covered && d >= 2
    parts.push({ a, b, gap, w: covered ? Math.max(0.45, Math.sqrt(d)) : gap ? 1.4 : 0 })
  }
  const total = parts.reduce((t, p) => t + p.w, 0) || 1
  let acc = 0
  parts.forEach(p => { p.x0 = acc / total; acc += p.w; p.x1 = acc / total })
  const pos = (y) => {
    if (y <= pts[0]) return 0
    for (const p of parts) {
      if (y <= p.b) return p.b > p.a ? p.x0 + (p.x1 - p.x0) * ((y - p.a) / (p.b - p.a)) : p.x1
    }
    return 1
  }

  const segs = items.map((it, i) => ({ i, lane: it.lane, x0: pos(it.s), x1: pos(it.e) }))
  const lanesN = Math.max(...items.map(i => i.lane)) + 1
  for (let l = 0; l < lanesN; l++) {
    let prev = 0
    segs.filter(g => g.lane === l).sort((a, b) => a.x0 - b.x0).forEach(g => {
      if (g.x0 < prev) g.x0 = prev
      if (g.x1 < g.x0) g.x1 = g.x0
      prev = Math.max(prev, g.x1)
    })
  }
  // Position (0..1) → année, pour la bulle pendant le glissement
  const yearAt = (x) => {
    for (const p of parts) {
      if (p.w > 0 && x <= p.x1) return p.a + (p.b - p.a) * Math.max(0, (x - p.x0) / ((p.x1 - p.x0) || 1))
    }
    return pts[pts.length - 1]
  }
  return { segs, lanesN, gaps: parts.filter(p => p.gap), yearAt }
}

// Drapeau sous le curseur : d'abord dans le couloir visé, sinon le plus proche
function segAt(geo, x, lane) {
  const inLane = geo.segs.filter(s => s.lane === lane && x >= s.x0 && x <= s.x1)
  if (inLane.length) return inLane[0].i
  const any = geo.segs.filter(s => x >= s.x0 && x <= s.x1).sort((a, b) => a.lane - b.lane)
  if (any.length) return any[0].i
  let best = geo.segs[0], bd = Infinity
  for (const s of geo.segs) {
    const d = x < s.x0 ? s.x0 - x : x - s.x1
    if (d < bd - 1e-9 || (Math.abs(d - bd) < 1e-9 && s.lane < best.lane)) { bd = d; best = s }
  }
  return best.i
}

// Années sous la frise : la sélection et la fin d'abord, puis les débuts qui ont la place
function pickLabels(geo, items, sel, minGap, endText) {
  const out = [{ x: 1, text: endText, key: 'end' }]
  const cands = [
    { x: geo.segs[sel].x0, text: String(items[sel].y0), sel: true, key: `s${sel}` },
    ...items.map((it, i) => ({ x: geo.segs[i].x0, text: String(it.y0), key: `i${i}` })),
  ]
  for (const c of cands) {
    if (out.some(o => Math.abs(o.x - c.x) < minGap)) continue
    out.push(c)
  }
  return out
}

const pct = (x) => `${(x * 100).toFixed(3)}%`

function labelX(x) {
  if (x <= 0.02) return { left: 0 }
  if (x >= 0.98) return { right: 0 }
  return { left: pct(x), transform: 'translateX(-50%)' }
}

// ── Image (image_url, sinon fichier local {iso}-{année}.svg, sinon cartouche) ──
function HistImg({ flag, iso, alt = '', cover = false, eager = false }) {
  const local = iso && flag.y0 ? `/flags/history/${iso}-${flag.y0}.svg` : null
  const first = flag.image_url || local
  const [src, setSrc] = useState(first)
  useEffect(() => { setSrc(first) }, [first])
  if (!src) {
    return cover ? null : <span style={{ fontSize: '10px', fontWeight: 700, color: C.light }}>{flag.y0 || '?'}</span>
  }
  return (
    <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false}
      onError={() => setSrc(src !== local && local ? local : null)}
      style={cover ? { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } : undefined} />
  )
}

// ── Icônes (trait) ────────────────────────────────────────────────────────────
const IconPrev = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
const IconNext = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
const IconClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>

const CSS = `
.kft *{box-sizing:border-box}
.kft-feature{display:flex;flex-direction:column;gap:14px}
.kft-stage{height:180px;padding:18px;border-radius:12px;background:rgba(22,50,79,0.06);display:flex;align-items:center;justify-content:center;scroll-margin-top:80px}
.kft-stage img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:0 4px 16px rgba(22,50,79,0.18)}
.kft-info{display:flex;flex-direction:column;gap:8px;min-width:0}
.kft-year{display:none}
.kft-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.kft-head h3{margin:0;font-size:18px;font-weight:800;color:${C.navy};line-height:1.3;letter-spacing:-0.01em}
.kft-count{flex-shrink:0;font-size:13px;font-weight:700;color:${C.muted}}
.kft-chips{display:flex;flex-wrap:wrap;gap:6px}
.kft-chip{padding:3px 8px;border-radius:9999px;font-size:11px;font-weight:600;text-transform:uppercase;white-space:nowrap}
.kft-notes{margin:0;font-size:14px;line-height:1.6;color:${C.body}}
.kft-over{margin:0;font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:0.06em}

.kft-mctl{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:10px}
.kft-dctl{display:none;gap:8px;flex-shrink:0}
.kft-ibtn{width:44px;height:44px;flex-shrink:0;border-radius:10px;border:1.5px solid ${C.border};background:${C.surface};color:${C.navy};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background-color .12s ease,border-color .12s ease}
.kft-ibtn:hover:not(:disabled){background:${C.bgAlt};border-color:${C.navy}}
.kft-ibtn:disabled{opacity:.4;cursor:default}
.kft-pbtn{height:44px;padding:0 16px;border-radius:10px;border:none;background:${C.navy};color:#fff;font-family:inherit;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;box-shadow:0 2px 8px rgba(22,50,79,0.08);transition:background-color .12s ease}
.kft-pbtn:hover{background:${C.navyLight}}
.kft-sbtn{min-height:44px;padding:9px 20px;border-radius:10px;border:1.5px solid ${C.border};background:transparent;color:${C.navy};font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .12s ease}
.kft-sbtn:hover{border-color:${C.navy};background:${C.bgAlt}}
.kft-ibtn:focus-visible,.kft-pbtn:focus-visible,.kft-sbtn:focus-visible,.kft-item:focus-visible{outline:3px solid rgba(22,50,79,0.35);outline-offset:2px}

.kft-bar.multi{display:block}
.kft-lanelbl{display:none}
.kft-lanes{position:relative;display:flex;flex-direction:column;gap:4px}
.kft-lane{position:relative;height:22px}
.kft-lane.sub{height:12px}
.kft-track{position:relative;padding:14px 0;margin:-14px 0;border-radius:8px;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.kft-track.drag{cursor:grabbing}
.kft-track:focus-visible{outline:3px solid rgba(22,50,79,0.35);outline-offset:2px}
.kft-track img{pointer-events:none;-webkit-user-drag:none}
.kft-track.drag .kft-knob,.kft-track.drag .kft-cursor{transition:none}
.kft-bubble{position:absolute;top:-40px;padding:4px 9px;border-radius:6px;background:${C.navy};color:#fff;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 4px 12px rgba(22,50,79,0.25);pointer-events:none;z-index:4}
.kft-seg{position:absolute;top:0;bottom:0;min-width:2px;border-radius:3px;overflow:hidden;background:${C.secondary}}
.kft-seg::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(22,50,79,0.14);pointer-events:none}
.kft-seg.on{outline:2px solid ${C.navy};outline-offset:2px;z-index:2}
.kft-gap{position:absolute;top:50%;margin-top:-1px;border-top:2px dashed #C9C3B8}
.kft-knob{position:absolute;top:-5px;width:32px;height:32px;margin-left:-16px;border-radius:9999px;background:${C.gold};border:3px solid #fff;box-shadow:0 2px 8px rgba(22,50,79,0.3);z-index:3;pointer-events:none;transition:left .4s ease}
.kft-cursor{display:none}
.kft-labels{position:relative;height:16px;margin-top:10px;font-size:11px;font-weight:600;color:${C.muted}}
.kft-labels span{position:absolute;top:0;white-space:nowrap}
.kft-labels .sel{color:${C.navy};font-weight:800}
.kft-labels.d{display:none}

.kft-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.kft-row{position:relative}
.kft-row.par{padding-left:40px}
.kft-rail{position:absolute;left:31px;top:30px;bottom:-42px;width:2px;background:${C.border}}
.kft-fork,.kft-merge{position:absolute;left:32px;width:40px;border:0 solid ${C.blue};pointer-events:none}
.kft-fork{top:-6px;height:14px;border-top-width:2px;border-right-width:2px;border-top-right-radius:12px}
.kft-merge{top:52px;bottom:-6px;border-bottom-width:2px;border-right-width:2px;border-bottom-right-radius:12px}
.kft-item{width:100%;display:flex;align-items:flex-start;gap:12px;padding:0;border:none;border-radius:12px;background:transparent;color:inherit;font-family:inherit;text-align:left;cursor:pointer}
.kft-thumb{position:relative;z-index:1;width:64px;height:44px;margin-top:8px;flex-shrink:0;padding:3px;border-radius:8px;border:2px solid ${C.border};background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:border-color .18s ease,box-shadow .18s ease}
.kft-thumb img{max-width:100%;max-height:100%;object-fit:contain;display:block;border-radius:2px;box-shadow:0 0 0 1px rgba(22,50,79,0.12)}
.kft-card{flex:1;min-width:0;min-height:60px;padding:9px 12px;border:1.5px solid ${C.border};border-radius:12px;background:#fff;display:flex;flex-direction:column;justify-content:center;gap:2px;transition:background-color .18s ease,border-color .18s ease,transform .18s ease,box-shadow .18s ease}
.kft-title{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:14px;font-weight:700;color:${C.navy};line-height:1.35}
.kft-meta{font-size:12px;color:${C.muted}}
.kft-mini{padding:1px 6px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;white-space:nowrap}
.kft-item:hover .kft-card{border-color:${C.navy}}
.kft-row.cur .kft-thumb{border-color:${C.green}}
.kft-row.on .kft-thumb{border-color:${C.navy};box-shadow:0 4px 12px rgba(22,50,79,0.22)}
.kft-row.on .kft-card{background:${C.navy};border-color:${C.navy};transform:translateX(4px);box-shadow:0 8px 24px rgba(22,50,79,0.22)}
.kft-row.on .kft-title{color:#fff}
.kft-row.on .kft-meta{color:rgba(255,255,255,0.75)}
.kft-legend{margin:0;display:flex;align-items:center;gap:8px;font-size:12px;color:${C.muted}}

.kft-cta{display:flex;flex-direction:column;gap:10px;padding:14px;border:1.5px dashed ${C.border};border-radius:12px}
.kft-cta-text{display:flex;align-items:center;gap:12px;font-size:13px;line-height:1.5;color:${C.body}}
.kft-cta-ico{width:36px;height:36px;flex-shrink:0;border-radius:9999px;background:${C.secondary};color:${C.navy};display:flex;align-items:center;justify-content:center}
.kft-empty{padding:20px 16px;border-radius:12px;background:${C.bgAlt};display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.kft-ghosts{display:flex;gap:8px;flex-shrink:0}
.kft-ghosts span{width:60px;height:40px;border-radius:4px;border:1.5px dashed #C9C3B8;background:#fff}
.kft-empty h3{margin:0;font-size:16px;font-weight:800;color:${C.navy}}
.kft-empty p{margin:6px 0 0;font-size:14px;line-height:1.6;color:${C.body}}
.kft-empty .kft-pbtn{width:100%}

@media (min-width:768px){
  .kft-m{display:none!important}
  .kft-dctl{display:flex}
  .kft-feature{padding:24px;border-radius:12px;background:${C.bgAlt}}
  .kft-stage{height:220px}
  .kft-year{display:block;order:0;font-size:48px;font-weight:900;color:${C.navy};letter-spacing:-0.04em;line-height:1}
  .kft-year small{margin-left:8px;font-size:22px;font-weight:800;color:${C.light};letter-spacing:-0.02em}
  .kft-chips{order:1}
  .kft-head{order:2}
  .kft-notes{order:3;font-size:15px;max-width:560px}
  .kft-head h3{font-size:22px}
  .kft-count{display:none}

  .kft-bar.multi{display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px}
  .kft-lanelbl{display:flex;flex-direction:column;gap:4px}
  .kft-lanelbl span{height:40px;display:flex;align-items:center;font-size:12px;font-weight:700;color:${C.muted}}
  .kft-lanelbl span.sub{height:26px;color:${C.blueText}}
  .kft-lane{height:40px}
  .kft-lane.sub{height:26px}
  .kft-seg{border-radius:4px;transition:opacity .15s ease}
  .kft-seg:hover{opacity:.85}
  .kft-seg.on{outline-width:3px}
  .kft-knob{display:none}
  .kft-cursor{display:block;position:absolute;top:-8px;bottom:-8px;width:4px;margin-left:-2px;border-radius:2px;background:${C.gold};z-index:3;pointer-events:none;transition:left .4s ease}
  .kft-cursor::before{content:'';position:absolute;top:-8px;left:-8px;width:20px;height:20px;border-radius:9999px;background:${C.gold};border:2px solid #fff;box-sizing:border-box;box-shadow:0 2px 6px rgba(22,50,79,0.25)}
  .kft-bubble{top:-50px}
  .kft-labels{margin-top:14px;font-size:12px}
  .kft-labels.m{display:none}
  .kft-labels.d{display:block}

  .kft-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .kft-row.par{padding-left:0}
  .kft-rail,.kft-fork,.kft-merge{display:none}
  .kft-item{height:100%;flex-direction:column;gap:8px;padding:12px;border:1.5px solid ${C.border};background:#fff;transition:border-color .15s ease,background-color .15s ease}
  .kft-item:hover{border-color:${C.navy}}
  .kft-thumb{width:100%;height:auto;aspect-ratio:3/2;margin:0;padding:6px;border:none;border-radius:8px;background:rgba(22,50,79,0.06)}
  .kft-row.cur .kft-thumb,.kft-row.on .kft-thumb{box-shadow:none}
  .kft-card{min-height:0;padding:0;border:none;background:transparent;transform:none!important;box-shadow:none!important}
  .kft-title{order:2;font-size:12px;font-weight:500;color:${C.muted}}
  .kft-meta{order:1;font-size:13px;font-weight:700;color:${C.navy}}
  .kft-row.on .kft-item{padding:11.5px;border:2px solid ${C.navy};background:${C.secondary}}
  .kft-row.on .kft-card{background:transparent}
  .kft-row.on .kft-title{color:${C.navy}}
  .kft-row.on .kft-meta{color:${C.navy}}

  .kft-cta{flex-direction:row;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px}
  .kft-cta-text{font-size:14px}
  .kft-empty{flex-direction:row;align-items:center;gap:24px;padding:24px;text-align:left}
  .kft-empty .kft-txt{flex:1}
  .kft-empty .kft-pbtn{width:auto;padding:0 20px}
  .kft-ghosts span{width:72px;height:48px}
}
@media (min-width:1024px){
  .kft-feature{flex-direction:row;align-items:center;gap:32px}
  .kft-stage{flex:0 0 400px}
}
@media (prefers-reduced-motion:reduce){
  .kft *{transition:none!important}
}
`

// ── Composant ─────────────────────────────────────────────────────────────────
// initialFlags : lignes country_flag_history lues côté serveur (dans le HTML).
// null → chargement dans le navigateur.
export default function FlagTimeline({ countryCode, countryName, initialFlags = null }) {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const iso = (countryCode || '').toLowerCase()

  const [rows, setRows] = useState(initialFlags)
  const [idx, setIdx] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [scrub, setScrub] = useState(null)        // position libre du curseur (0..1) après un glissement
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef(null)
  const lanesRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    if (initialFlags || !iso) return
    let alive = true
    createClient()
      .from('country_flag_history')
      .select('*')
      .eq('iso_code', iso)
      .order('date_start', { ascending: true, nullsFirst: true })
      .then(({ data, error }) => { if (alive) setRows(error ? [] : (data || [])) })
    return () => { alive = false }
  }, [iso, initialFlags])

  const items = useMemo(() => prepare(rows || []), [rows])
  const n = items.length
  const defaultIdx = useMemo(() => {
    let k = -1
    items.forEach((it, i) => { if (it.current) k = i })
    return k >= 0 ? k : n - 1
  }, [items, n])
  const sel = n ? Math.min(idx ?? defaultIdx, n - 1) : -1
  const geo = useMemo(() => (n >= 2 ? buildGeometry(items) : null), [items, n])

  // Lecture : un drapeau toutes les PLAY_MS, arrêt sur le dernier
  useEffect(() => {
    if (!playing) return
    if (sel >= n - 1) { setPlaying(false); return }
    const id = setTimeout(() => { setScrub(null); setIdx(sel + 1) }, PLAY_MS)
    return () => clearTimeout(id)
  }, [playing, sel, n])

  const reveal = () => {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches) return
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.top < 70 || r.bottom > window.innerHeight) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
    }
  }
  const pick = (i) => { setPlaying(false); setScrub(null); setIdx(i); setTimeout(reveal, 30) }
  const step = (d) => { setPlaying(false); setScrub(null); setIdx(Math.max(0, Math.min(n - 1, sel + d))) }
  const togglePlay = () => {
    if (playing) { setPlaying(false); return }
    setScrub(null)
    if (sel >= n - 1) setIdx(0)
    setPlaying(true)
    setTimeout(reveal, 30)
  }

  // ── Glisser le curseur doré (souris, doigt, stylet) ──
  // Souris : le curseur suit dès l'appui. Doigt : il suit dès qu'on glisse à
  // l'horizontale (un geste vertical fait défiler la page) ; un simple toucher
  // place le curseur.
  const scrubTo = (e) => {
    const el = lanesRef.current
    if (!el || !geo) return
    const r = el.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    let lane = 0, best = Infinity
    el.querySelectorAll('.kft-lane').forEach((ln, l) => {
      const b = ln.getBoundingClientRect()
      const d = e.clientY < b.top ? b.top - e.clientY : e.clientY > b.bottom ? e.clientY - b.bottom : 0
      if (d < best) { best = d; lane = l }
    })
    setScrub(x)
    setIdx(segAt(geo, x, lane))
  }
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const active = e.pointerType !== 'touch'
    drag.current = { id: e.pointerId, x: e.clientX, active }
    if (active) {
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      setPlaying(false)
      setDragging(true)
      scrubTo(e)
    }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.active) {
      if (Math.abs(e.clientX - d.x) < 6) return
      d.active = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
      setPlaying(false)
      setDragging(true)
    }
    scrubTo(e)
  }
  const onPointerUp = (e) => {
    const d = drag.current
    if (d && d.id === e.pointerId && !d.active) { setPlaying(false); scrubTo(e) }   // toucher simple
    drag.current = null
    setDragging(false)
  }
  const onPointerCancel = () => { drag.current = null; setDragging(false) }
  const onTrackKey = (e) => {
    const k = e.key
    if (k === 'ArrowLeft' || k === 'ArrowDown') step(-1)
    else if (k === 'ArrowRight' || k === 'ArrowUp') step(1)
    else if (k === 'Home') { setPlaying(false); setScrub(null); setIdx(0) }
    else if (k === 'End') { setPlaying(false); setScrub(null); setIdx(n - 1) }
    else return
    e.preventDefault()
  }

  // ── Textes ──
  const label = (f) => (locale === 'fr' ? (f.label_fr || f.label_en) : (f.label_en || f.label_fr)) || ''
  const notes = (f) => (locale === 'fr' ? (f.notes_fr || f.notes_en) : (f.notes_en || f.notes_fr)) || ''
  const duration = (f) => {
    if (f.e - f.s < 1) return t('under a year', "moins d'un an")
    const y = Math.round(f.e - f.s)
    return t(`${y} year${y > 1 ? 's' : ''}`, `${y} an${y > 1 ? 's' : ''}`)
  }
  const years = (f) => (f.y1 && f.y1 !== f.y0 ? `${f.y0} – ${f.y1}` : String(f.y0))
  const range = (f) => (f.current ? t(`since ${f.y0}`, `depuis ${f.y0}`) : years(f))
  const rowMeta = (f) => `${f.current ? t(`Since ${f.y0}`, `Depuis ${f.y0}`) : years(f)} · ${duration(f)}`
  const today = t('today', 'auj.')

  const chip = (bg, fg, text, cls = '') => (
    <span className={`kft-chip ${cls}`} style={{ backgroundColor: bg, color: fg }}>{text}</span>
  )
  const statusMini = (f) => {
    if (f.current) return <span className="kft-mini" style={{ backgroundColor: C.greenLight, color: C.greenText }}>{t('Current', 'Actuel')}</span>
    if (f.lane > 0) return <span className="kft-mini" style={{ backgroundColor: C.blueLight, color: C.blueText }}>{t('In parallel', 'En parallèle')}</span>
    return null
  }

  const parallelCount = items.filter(i => i.lane > 0).length
  const title = n >= 2 ? t('Flag evolution', 'Évolution du drapeau') : t('Flag history', 'Histoire du drapeau')
  let subtitle = null
  if (n >= 2) {
    subtitle = t(`${n} flags since ${items[0].y0}`, `${n} drapeaux depuis ${items[0].y0}`)
    if (parallelCount) {
      subtitle += t(
        `, including ${parallelCount} used in parallel`,
        `, dont ${parallelCount} utilisé${parallelCount > 1 ? 's' : ''} en parallèle`,
      )
    }
  } else if (n === 1) {
    subtitle = t('A single national flag on record.', 'Un seul drapeau national enregistré.')
  }

  // ── Blocs ──
  const shell = (children) => (
    <section className="kft" aria-label={title}
      style={{ backgroundColor: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px', overflow: 'hidden' }}>
      <style>{CSS}</style>
      {children}
      {submitOpen && <FlagSubmitModal defaultCountry={iso} onClose={() => setSubmitOpen(false)} />}
    </section>
  )

  const header = (controls) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: subtitle ? '0 0 2px' : 0, fontSize: '17px', fontWeight: 900, color: C.navy, letterSpacing: '-0.2px' }}>{title}</h2>
        {subtitle && (
          <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: C.muted, lineHeight: 1.5 }}>{subtitle}</p>
        )}
      </div>
      {controls}
    </div>
  )

  const feature = (f) => (
    <div className="kft-feature">
      <div className="kft-stage" ref={stageRef}>
        <HistImg key={f.id} flag={f} iso={iso} alt={label(f)} />
      </div>
      <div className="kft-info">
        <div className="kft-year" aria-hidden="true">{f.y0}{(f.current || f.y1 !== f.y0) && <small>– {f.current ? today : f.y1}</small>}</div>
        <div className="kft-head">
          <h3 aria-live="polite">{label(f)}</h3>
          {n >= 2 && <span className="kft-count">{sel + 1} / {n}</span>}
        </div>
        <div className="kft-chips">
          {chip(C.secondary, C.navy, range(f), 'kft-m')}
          {chip(C.goldLight, C.goldText, duration(f))}
          {f.current && chip(C.greenLight, C.greenText, t('Current', 'Actuel'))}
          {f.lane > 0 && chip(C.blueLight, C.blueText, t('In parallel', 'En parallèle'))}
        </div>
        {notes(f) && <p className="kft-notes">{notes(f)}</p>}
      </div>
    </div>
  )

  const proposeLabel = t('Suggest a flag', 'Proposer un drapeau')

  // Chargement côté navigateur (requête serveur échouée)
  if (rows === null) return shell(<PageLoader inline label={t('Loading...', 'Chargement...')} />)

  // ── Aucun drapeau ──
  if (n === 0) {
    return shell(<>
      {header(null)}
      <div className="kft-empty">
        <div className="kft-ghosts" aria-hidden="true">
          <span /><span style={{ opacity: 0.7 }} /><span style={{ opacity: 0.4 }} />
        </div>
        <div className="kft-txt">
          <h3>{t('History being documented', 'Historique en cours de documentation')}</h3>
          <p>{t(
            "We haven't traced this country's earlier flags yet. Have a reliable source? Help us complete this page.",
            "Nous n'avons pas encore retracé les drapeaux précédents de ce pays. Une source fiable ? Aidez-nous à compléter cette page.",
          )}</p>
        </div>
        <button type="button" className="kft-pbtn" onClick={() => setSubmitOpen(true)}>{proposeLabel}</button>
      </div>
    </>)
  }

  // ── Un seul drapeau ──
  if (n === 1) {
    return shell(<>
      {header(null)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {feature(items[0])}
        <div className="kft-cta">
          <span className="kft-cta-text">
            <span className="kft-cta-ico"><IconClock /></span>
            {t('No other national flag is recorded for this country. Know an older one?',
              "Aucun autre drapeau national n'est enregistré pour ce pays. Vous connaissez un ancien drapeau ?")}
          </span>
          <button type="button" className="kft-sbtn" onClick={() => setSubmitOpen(true)}>{proposeLabel}</button>
        </div>
      </div>
    </>)
  }

  // ── Plusieurs drapeaux ──
  const f = items[sel]
  const sg = geo.segs[sel]
  const cx = scrub ?? (sg.x0 + sg.x1) / 2
  const scrubYear = Math.min(Math.floor(NOW_Y), Math.floor(geo.yearAt(cx)))
  const endText = items.some(i => i.current) ? today : String(Math.max(...items.map(i => i.y1 || i.y0)))
  const labelsM = pickLabels(geo, items, sel, 0.17, endText)
  const labelsD = pickLabels(geo, items, sel, 0.06, endText)
  const multi = geo.lanesN > 1
  const playText = playing ? t('Pause', 'Pause') : null

  const prevBtn = <button type="button" className="kft-ibtn" onClick={() => step(-1)} disabled={sel <= 0} aria-label={t('Previous flag', 'Drapeau précédent')}><IconPrev /></button>
  const nextBtn = <button type="button" className="kft-ibtn" onClick={() => step(1)} disabled={sel >= n - 1} aria-label={t('Next flag', 'Drapeau suivant')}><IconNext /></button>

  const labelRow = (list, cls) => (
    <div className={`kft-labels ${cls}`} aria-hidden="true">
      {list.map(l => <span key={l.key} className={l.sel ? 'sel' : undefined} style={labelX(l.x)}>{l.text}</span>)}
    </div>
  )

  return shell(<>
    {header(
      <div className="kft-dctl">
        <button type="button" className="kft-pbtn" onClick={togglePlay} aria-pressed={playing}>
          {playing ? <IconPause /> : <IconPlay />}{playText || t('Play', 'Lecture')}
        </button>
        {prevBtn}
        {nextBtn}
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {feature(f)}

      {/* Frise proportionnelle (échelle compressée) */}
      <div className={`kft-bar${multi ? ' multi' : ''}`}>
        {multi && (
          <div className="kft-lanelbl" aria-hidden="true">
            {Array.from({ length: geo.lanesN }, (_, l) => (
              <span key={l} className={l ? 'sub' : undefined}>{l ? t('In parallel', 'En parallèle') : t('Main flag', 'Drapeau principal')}</span>
            ))}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div className={`kft-track${dragging ? ' drag' : ''}`}
            role="slider" tabIndex={0}
            aria-label={t('Timeline: drag to travel through time', 'Frise : glisser pour remonter le temps')}
            aria-valuemin={1} aria-valuemax={n} aria-valuenow={sel + 1}
            aria-valuetext={`${label(f)}, ${range(f)}`}
            onKeyDown={onTrackKey}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
            <div className="kft-lanes" ref={lanesRef} aria-hidden="true">
              {Array.from({ length: geo.lanesN }, (_, l) => (
                <div key={l} className={`kft-lane${l ? ' sub' : ''}`}>
                  {l === 0 && geo.gaps.map((g, k) => (
                    <span key={`g${k}`} className="kft-gap" style={{ left: pct(g.x0), width: pct(g.x1 - g.x0) }} />
                  ))}
                  {geo.segs.filter(s => s.lane === l).map(s => (
                    <span key={items[s.i].id ?? s.i}
                      className={`kft-seg${s.i === sel ? ' on' : ''}`}
                      title={`${label(items[s.i])} · ${range(items[s.i])}`}
                      style={{ left: `calc(${pct(s.x0)} + 1px)`, width: `calc(${pct(s.x1 - s.x0)} - 2px)` }}>
                      <HistImg flag={items[s.i]} iso={iso} cover />
                    </span>
                  ))}
                </div>
              ))}
              <span className="kft-knob" style={{ left: pct(cx) }} />
              <span className="kft-cursor" style={{ left: pct(cx) }} />
              {dragging && (
                <span className="kft-bubble" style={{ left: pct(cx), transform: `translateX(-${Math.round(cx * 100)}%)` }}>{scrubYear}</span>
              )}
            </div>
          </div>
          {labelRow(labelsM, 'm')}
          {labelRow(labelsD, 'd')}
        </div>
      </div>

      {/* Commandes mobile, juste sous l'aperçu */}
      <div className="kft-mctl kft-m">
        {prevBtn}
        <button type="button" className="kft-pbtn" onClick={togglePlay} aria-pressed={playing}>
          {playing ? <IconPause /> : <IconPlay />}{playText || t('Play the story', "Lire l'histoire")}
        </button>
        {nextBtn}
      </div>

      {/* Tous les drapeaux : arbre (mobile) / grille (desktop) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p className="kft-over">{t('All flags', 'Tous les drapeaux')}</p>
        <ol className="kft-list">
          {items.map((it, i) => (
            <li key={it.id ?? i} className={`kft-row${it.lane > 0 ? ' par' : ''}${it.current ? ' cur' : ''}${i === sel ? ' on' : ''}`}>
              {i < n - 1 && <span className="kft-rail" aria-hidden="true" />}
              {it.lane > 0 && <><span className="kft-fork" aria-hidden="true" /><span className="kft-merge" aria-hidden="true" /></>}
              <button type="button" className="kft-item" onClick={() => pick(i)} aria-current={i === sel ? 'true' : undefined}>
                <span className="kft-thumb"><HistImg flag={it} iso={iso} alt="" /></span>
                <span className="kft-card">
                  <span className="kft-title">{label(it)}{statusMini(it)}</span>
                  <span className="kft-meta">{rowMeta(it)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {parallelCount > 0 && (
          <p className="kft-legend kft-m">
            <span aria-hidden="true" style={{ display: 'inline-block', width: '18px', height: '2px', borderRadius: '2px', backgroundColor: C.blue }} />
            {t('Blue branch: flag used at the same time as another', "Branche bleue : drapeau utilisé en même temps qu'un autre")}
          </p>
        )}
      </div>
    </div>
  </>)
}

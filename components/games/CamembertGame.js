'use client'

// The Camembert Game / Le jeu du camembert
// Deviner le drapeau d'après la répartition de ses couleurs, montrée en camembert.
// Données : data/games/camembert.json (part de chaque couleur, calculée depuis les SVG,
// voir scripts/games/build_camembert.js).
//
// Deux modes, sans fin :
//   Classique     3 cœurs. 3 essais par drapeau ; un drapeau raté coûte un cœur.
//                 Points = base selon l'essai (100 / 60 / 30) × multiplicateur de temps
//                 (≤ 10 s ×3, ≤ 20 s ×2, ≤ 30 s ×1,5, ensuite ×1) + bonus de série.
//   Entraînement  pas de cœurs, pas de chrono, pas de score : on joue tant qu'on veut.
// Indice (continent et première lettre) avant le 3e essai.
// Drapeaux « jumeaux » (même camembert, ex. France / Russie / Pays-Bas) : proposer un jumeau
// ne coûte pas d'essai.
//
// Mise en page « appli » : tout tient dans l'écran (calc(100dvh - 60px)), sans défilement.

import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import GameIcon from '@/components/games/GameIcon'
import GuestSaveCTA from '@/components/games/GuestSaveCTA'
import PALETTES from '@/data/games/camembert.json'

const GAME_KEY = 'camembert'
const MAX_LIVES = 3
const MAX_GUESSES = 3
const BASE_POINTS = [100, 60, 30]
const TIERS = [{ upTo: 10, mult: 3 }, { upTo: 20, mult: 2 }, { upTo: 30, mult: 1.5 }, { upTo: Infinity, mult: 1 }]
const STREAK_STEP = 10      // bonus de série : +10 par drapeau d'affilée au-delà du premier
const STREAK_CAP = 50

const C = {
  navy: '#16324F', navyLight: '#1E4976', gold: '#F4B400', goldLight: '#FEF3C7', goldDark: '#92400E',
  green: '#16A34A', greenLight: '#DCFCE7', red: '#D62828', redLight: '#FEE2E2',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF', steel: '#9EB7E5',
}

const CONTINENTS = [
  { key: 'Africa', en: 'Africa', fr: 'Afrique' },
  { key: 'Americas', en: 'Americas', fr: 'Amériques' },
  { key: 'Asia', en: 'Asia', fr: 'Asie' },
  { key: 'Europe', en: 'Europe', fr: 'Europe' },
  { key: 'Oceania', en: 'Oceania', fr: 'Océanie' },
]

const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
// Drapeau affiché sur le site quand il diffère de flagcdn (même source que le camembert)
const FLAG_OVERRIDES = { af: '/flags/history/af-2021.svg', 'gb-nir': 'gb' }
const flagSrc = (iso, w = 160) => {
  const o = FLAG_OVERRIDES[iso]
  if (o && o.startsWith('/')) return o
  return `https://flagcdn.com/w${w}/${o || iso}.png`
}
const nowMs = () => Date.now()   // appelé depuis les gestionnaires d'événements uniquement
const tierAt = (secs) => TIERS.find(x => secs <= x.upTo)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const normalize = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Couleurs ────────────────────────────────────────────────────────────────
const rgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
function colorDist(h1, h2) {
  const a = rgb(h1), b = rgb(h2)
  const rm = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
}
const isLight = (hex) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 160 }

// Deux camemberts indiscernables : mêmes couleurs (à la nuance près) dans les mêmes proportions
function sameSlices(a, b) {
  const big = (s) => s.filter(x => x[1] >= 3)
  const A = big(a), B = big(b)
  if (A.length !== B.length) return false
  const used = new Set()
  return A.every(([ha, pa]) => {
    const i = B.findIndex(([hb, pb], k) => !used.has(k) && colorDist(ha, hb) < 75 && Math.abs(pa - pb) < 3.5)
    if (i < 0) return false
    used.add(i); return true
  })
}

// ── Camembert SVG (s'adapte à la place disponible) ──────────────────────────
function Pie({ slices, size, labels = true, label, fill = false }) {
  const r = 50, cx = 50, cy = 50
  const parts = slices.reduce((acc, [hex, pct]) => {
    const a0 = acc.length ? acc[acc.length - 1].a1 : -Math.PI / 2
    const a1 = a0 + (pct / 100) * Math.PI * 2
    return [...acc, { hex, pct, a0, a1, mid: (a0 + a1) / 2 }]
  }, [])
  const pt = (a, rad = r) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]
  const style = fill
    ? { display: 'block', height: '100%', width: 'auto', maxWidth: '100%', aspectRatio: '1 / 1' }
    : { display: 'block', flexShrink: 0 }
  return (
    <svg viewBox="-2 -2 104 104" width={fill ? undefined : size} height={fill ? undefined : size} role="img" aria-label={label} style={style}>
      {parts.length === 1
        ? <circle cx={cx} cy={cy} r={r} fill={parts[0].hex} />
        : parts.map((p, i) => {
          const [x0, y0] = pt(p.a0), [x1, y1] = pt(p.a1)
          const large = p.a1 - p.a0 > Math.PI ? 1 : 0
          return <path key={i} d={`M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`} fill={p.hex} stroke="rgba(15,25,35,0.18)" strokeWidth="0.4" strokeLinejoin="round" />
        })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(15,25,35,0.25)" strokeWidth="0.8" />
      {labels && parts.filter(p => p.pct >= 7).map((p, i) => {
        const [x, y] = parts.length === 1 ? [cx, cy] : pt(p.mid, r * 0.62)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: '8px', fontWeight: 800, fill: isLight(p.hex) ? C.navy : '#FFFFFF', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
            {Math.round(p.pct)}%
          </text>
        )
      })}
    </svg>
  )
}

function Hearts({ lives, size = 18 }) {
  return (
    <span style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ transition: 'transform 0.2s ease', transform: i < lives ? 'scale(1)' : 'scale(0.85)' }}>
          <path d={HEART} fill={i < lives ? '#EF4444' : 'rgba(255,255,255,0.18)'} />
        </svg>
      ))}
    </span>
  )
}

const CSS = `
.kf-cam { height: calc(100dvh - 60px); overflow: hidden; overflow: clip; display: flex; flex-direction: column; box-sizing: border-box; font-family: var(--font-body), system-ui, sans-serif; }
.kf-cam *, .kf-cam *::before, .kf-cam *::after { box-sizing: border-box; }
.kf-cam-col { width: 100%; max-width: 560px; margin: 0 auto; }
.kf-cam-chips { scrollbar-width: none; } .kf-cam-chips::-webkit-scrollbar { display: none; }
.kf-cam-btn { transition: background-color 0.12s ease, transform 0.12s ease; }
.kf-cam-btn:active { transform: scale(0.98); }
.kf-cam-q { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (max-height: 720px) { .kf-cam-demo { display: none !important; } }
@media (max-height: 640px) { .kf-cam-rules, .kf-cam-scale { display: none !important; } }
@media (max-height: 600px) { .kf-cam-hero p { display: none; } }
@media (max-width: 360px) { .kf-cam-q { font-size: 15px !important; } }
@media (min-width: 768px) { .kf-cam-spacer { flex: 0 0 4px !important; } }
`

export default function CamembertGame() {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const nf = (n, d = 0) => Number(n).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: d })

  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState({})
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('classic')       // classic | training
  const [continent, setContinent] = useState('all')

  const [phase, setPhase] = useState('setup')       // setup | playing | result | gameover
  const [queue, setQueue] = useState([])
  const [target, setTarget] = useState(null)
  const [guesses, setGuesses] = useState([])        // [{ iso, twin }]
  const [lives, setLives] = useState(MAX_LIVES)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [history, setHistory] = useState([])        // [{ iso, found, tries, points, secs, mult, bonus }]
  const [startedAt, setStartedAt] = useState(0)
  const [gameStartedAt, setGameStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [typed, setTyped] = useState('')
  const [suggest, setSuggest] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [notice, setNotice] = useState(null)        // { kind: 'twin' | 'wrong', iso }
  const inputRef = useRef(null)
  const savedRef = useRef(false)

  useEffect(() => {
    const sb = createClient()
    sb.from('countries').select('iso_code, name_en, name_fr, region').then(({ data }) => {
      setCountries(Object.fromEntries((data || []).filter(c => PALETTES[c.iso_code]).map(c => [c.iso_code, c])))
      setLoading(false)
    })
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null))
  }, [])

  // Chrono du drapeau en cours (mode classique)
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'classic') return
    const id = setInterval(() => setNow(nowMs()), 250)
    return () => clearInterval(id)
  }, [phase, mode])

  const nameOf = (iso) => { const c = countries[iso]; return c ? ((locale === 'fr' ? c.name_fr : c.name_en) || c.name_en) : iso }
  const continentOf = (iso) => { const k = countries[iso]?.region; const c = CONTINENTS.find(x => x.key === k); return c ? t(c.en, c.fr) : k }

  const pool = useMemo(() => Object.keys(countries).filter(iso => continent === 'all' || countries[iso].region === continent), [countries, continent])

  const twinsOf = useMemo(() => {
    const isos = Object.keys(countries), out = {}
    for (const a of isos) out[a] = isos.filter(b => b !== a && sameSlices(PALETTES[a], PALETTES[b]))
    return out
  }, [countries])

  // Drapeau suivant : on parcourt le paquet mélangé, puis on le remélange (sans fin)
  function draw(q, prev) {
    let list = q
    if (!list.length) {
      list = shuffle(pool)
      if (list.length > 1 && list[0] === prev) list.push(list.shift())
    }
    const [head, ...rest] = list
    setQueue(rest); setTarget(head)
    setGuesses([]); setNotice(null); setTyped(''); setSuggest([])
    const ts = nowMs()
    setStartedAt(ts); setNow(ts)
    setPhase('playing')
  }

  function start(m = mode) {
    if (pool.length < 3) return
    setMode(m)
    savedRef.current = false
    setLives(MAX_LIVES); setScore(0); setStreak(0); setBestStreak(0); setHistory([])
    setGameStartedAt(nowMs())
    draw([], null)
  }

  const wrongCount = guesses.filter(g => !g.twin).length
  const elapsed = Math.max(0, (now - startedAt) / 1000)
  const tier = tierAt(elapsed)

  function finishRound(found, tries) {
    const secs = Math.round((nowMs() - startedAt) / 100) / 10
    let points = 0, mult = 1, bonus = 0
    const ns = found ? streak + 1 : 0
    if (mode === 'classic' && found) {
      mult = tierAt(secs).mult
      bonus = Math.min(STREAK_CAP, STREAK_STEP * (ns - 1))
      points = Math.round(BASE_POINTS[tries - 1] * mult) + bonus
    }
    setStreak(ns); setBestStreak(b => Math.max(b, ns))
    if (points) setScore(s => s + points)
    if (mode === 'classic' && !found) setLives(l => l - 1)
    setHistory(h => [...h, { iso: target, found, tries, points, secs, mult, bonus }])
    setPhase('result')
  }

  function guess(iso) {
    if (phase !== 'playing' || !iso || guesses.some(g => g.iso === iso)) return
    setTyped(''); setSuggest([])
    if (iso === target) {
      setGuesses(g => [...g, { iso }]); setNotice(null)
      finishRound(true, wrongCount + 1)
      return
    }
    const twin = twinsOf[target]?.includes(iso)
    setGuesses(g => [...g, { iso, twin }])
    setNotice({ kind: twin ? 'twin' : 'wrong', iso })
    if (!twin && wrongCount + 1 >= MAX_GUESSES) finishRound(false, MAX_GUESSES)
    else setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isOver = mode === 'classic' && lives <= 0
  function next() {
    if (isOver) { setPhase('gameover'); return }
    draw(queue, target)
  }
  function giveUp() {       // entraînement : passer le drapeau
    if (phase === 'playing') finishRound(false, wrongCount)
  }

  // ── Enregistrement (membre, mode classique) ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'gameover' || mode !== 'classic' || savedRef.current || !user) return
    savedRef.current = true
    const sb = createClient()
    const found = history.filter(h => h.found).length
    const duration = Math.round((nowMs() - gameStartedAt) / 1000)
    ;(async () => {
      try {
        if (score > 0) {
          await sb.from('game_scores_log').insert({
            user_id: user.id, game: GAME_KEY, score, played_at: new Date().toISOString(),
            details: { continent, found, played: history.length, best_streak: bestStreak },
          })
          const { data: gs } = await sb.from('game_scores').select('best_streak').eq('user_id', user.id).eq('mode', GAME_KEY).maybeSingle()
          await sb.from('game_scores').upsert({
            user_id: user.id, mode: GAME_KEY,
            best_streak: Math.max(gs?.best_streak ?? 0, score), updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,mode' })
        }
        const { data: ps } = await sb.from('player_stats').select('*').eq('user_id', user.id).eq('game', GAME_KEY).maybeSingle()
        const row = {
          streak_current: streak,
          streak_best: Math.max(ps?.streak_best || 0, bestStreak),
          flags_found: (ps?.flags_found || 0) + found,
          total_guesses: (ps?.total_guesses || 0) + history.reduce((a, h) => a + h.tries, 0),
          games_played: (ps?.games_played || 0) + 1,
          total_score: (ps?.total_score || 0) + score,
          longest_game: Math.max(ps?.longest_game || 0, duration),
          updated_at: new Date().toISOString(),
        }
        if (ps) await sb.from('player_stats').update(row).eq('id', ps.id)
        else await sb.from('player_stats').insert({ user_id: user.id, game: GAME_KEY, ...row })
      } catch (e) { console.error('Camembert save:', e?.message) }
    })()
  }, [phase, mode, user, score, history, continent, bestStreak, streak, gameStartedAt])

  function onType(val) {
    setTyped(val)
    if (val.trim().length < 2) { setSuggest([]); return }
    const q = normalize(val)
    const tried = new Set(guesses.map(g => g.iso))
    const list = Object.values(countries)
      .filter(c => !tried.has(c.iso_code) && (normalize(c.name_fr).includes(q) || normalize(c.name_en).includes(q)))
      .sort((a, b) => normalize(nameOf(a.iso_code)).indexOf(q) - normalize(nameOf(b.iso_code)).indexOf(q))
      .slice(0, 5)
    setSuggest(list); setActiveIdx(0)
  }

  if (loading) return <PageLoader label={t('Loading...', 'Chargement...')} />

  const title = t('The Camembert Game', 'Le jeu du camembert')
  const pieLabel = (iso) => t('Colour chart: ', 'Répartition des couleurs : ') + PALETTES[iso].map(s => `${Math.round(s[1])}%`).join(', ')
  const overline = (color) => ({ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color })
  const chip = (active) => ({
    padding: '0 14px', minHeight: '36px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
    border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`,
    backgroundColor: active ? C.navy : C.secondary, color: active ? 'white' : C.muted,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
  })
  const bigBtn = (bg, color) => ({
    width: '100%', minHeight: '50px', borderRadius: '12px', border: 'none', backgroundColor: bg, color,
    fontSize: '16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  })
  const tierLabel = (x) => `×${nf(x.mult, 1)}`

  // ════════════════════════════ RÉGLAGES ════════════════════════════
  if (phase === 'setup') {
    const modeCard = (key, label, desc, icon) => {
      const on = mode === key
      return (
        <button type="button" onClick={() => setMode(key)} aria-pressed={on} className="kf-cam-btn"
          style={{ flex: 1, minWidth: 0, minHeight: '64px', padding: '10px 12px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            border: on ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`, backgroundColor: on ? C.surface : C.bgAlt,
            boxShadow: on ? '0 2px 8px rgba(22,50,79,0.08)' : 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.navy : C.secondary }}>{icon(on ? 'white' : C.navy)}</span>
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: C.navy }}>{label}</span>
            <span style={{ fontSize: '12px', lineHeight: 1.35, color: C.muted }}>{desc}</span>
          </span>
        </button>
      )
    }
    return (
      <div className="kf-cam" style={{ backgroundColor: C.bg }}>
        <style>{CSS}</style>
        <div className="kf-cam-hero" style={{ backgroundColor: C.navy, color: 'white', padding: '14px 16px 16px', flexShrink: 0 }}>
          <div className="kf-cam-col" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <nav style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <Link prefetch={false} href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{t('Games', 'Jeux')}</Link>
              <span style={{ color: C.steel }}> / {title}</span>
            </nav>
            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>{title}</h1>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
              {t('Guess the flag from how much of each colour it uses.', 'Devine le drapeau à partir de la part de chacune de ses couleurs.')}
            </p>
          </div>
        </div>

        <div className="kf-cam-col" style={{ flex: 1, minHeight: 0, padding: '14px 16px calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <section className="kf-cam-demo" style={{ backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <Pie slices={PALETTES.gb} size={60} label={pieLabel('gb')} />
            <GameIcon name="arrowRight" size={18} color={C.light} />
            <img src={flagSrc('gb', 160)} alt="" style={{ width: '60px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${C.borderSolid}` }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>{t('United Kingdom', 'Royaume-Uni')}</span>
          </section>

          <ul className="kf-cam-rules" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
            {[
              t('3 guesses per flag, a hint before the 3rd.', '3 essais par drapeau, un indice avant le 3e.'),
              t('Twin flags (same chart) cost no guess.', 'Un drapeau jumeau (même camembert) ne coûte pas d’essai.'),
            ].map((line, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', lineHeight: 1.4, color: C.text }}>
                <GameIcon name="check" size={15} color={C.green} style={{ flexShrink: 0, marginTop: '2px' }} />
                {line}
              </li>
            ))}
          </ul>

          <p style={overline(C.green)}>{t('Mode', 'Mode')}</p>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {modeCard('classic', t('Classic', 'Classique'), t('3 hearts, speed bonus', '3 cœurs, bonus de vitesse'),
              (col) => <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} fill={col} /></svg>)}
            {modeCard('training', t('Training', 'Entraînement'), t('Endless, can’t lose', 'Sans fin, sans perdre'),
              (col) => <GameIcon name="target" size={16} color={col} />)}
          </div>

          <p style={overline(C.green)}>{t('Continent', 'Continent')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexShrink: 0 }}>
            <button type="button" style={chip(continent === 'all')} onClick={() => setContinent('all')}>{t('All', 'Tous')}</button>
            {CONTINENTS.map(c => (
              <button key={c.key} type="button" style={chip(continent === c.key)} onClick={() => setContinent(c.key)}>{t(c.en, c.fr)}</button>
            ))}
          </div>

          <div className="kf-cam-spacer" style={{ flex: 1, minHeight: 0 }} />
          {mode === 'classic' && (
            <p className="kf-cam-scale" style={{ margin: 0, fontSize: '12px', lineHeight: 1.4, color: C.muted, textAlign: 'center', flexShrink: 0 }}>
              {t('Found within 10 s ×3 · 20 s ×2 · 30 s ×1.5', 'Trouvé en moins de 10 s ×3 · 20 s ×2 · 30 s ×1,5')}
            </p>
          )}
          <button type="button" className="kf-cam-btn" style={bigBtn(C.navy, 'white')} onClick={() => start()}>{t('Play', 'Jouer')}</button>
        </div>
      </div>
    )
  }

  // ════════════════════════════ FIN DE PARTIE ════════════════════════════
  if (phase === 'gameover') {
    const found = history.filter(h => h.found).length
    const fastest = history.filter(h => h.found).reduce((m, h) => Math.min(m, h.secs), Infinity)
    return (
      <div className="kf-cam" style={{ backgroundColor: C.bg }}>
        <style>{CSS}</style>
        <div className="kf-cam-col" style={{ flex: 1, minHeight: 0, padding: '16px 16px calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <GameIcon name="trophy" size={34} color={C.gold} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={overline(C.green)}>{title}</p>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em' }}>{nf(score)} pts</h1>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', flexShrink: 0 }}>
            {[
              [found, t('flags found', 'drapeaux trouvés')],
              [bestStreak, t('best streak', 'meilleure série')],
              [Number.isFinite(fastest) ? `${nf(fastest, 1)} s` : '—', t('fastest', 'le plus rapide')],
            ].map(([v, l]) => (
              <div key={l} style={{ backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: C.navy }}>{v}</div>
                <div style={{ fontSize: '11px', color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ flexShrink: 0 }}>
            <GuestSaveCTA user={user} locale={locale} game={GAME_KEY} mode={GAME_KEY} score={score} bestStreak={bestStreak} correct={found} played={history.length} label={title} compact />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button type="button" className="kf-cam-btn" style={{ ...bigBtn(C.navy, 'white'), width: 'auto', flex: 1, minWidth: 0 }} onClick={() => start('classic')}>{t('Play again', 'Rejouer')}</button>
            <button type="button" className="kf-cam-btn" onClick={() => setPhase('setup')}
              style={{ ...bigBtn('transparent', C.navy), width: 'auto', flex: 1, minWidth: 0, border: `1.5px solid ${C.borderSolid}`, fontWeight: 700, fontSize: '15px' }}>
              {t('Settings', 'Réglages')}
            </button>
          </div>
          <ol style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: 0, padding: '4px 12px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            {[...history].reverse().map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderTop: i ? `1px solid ${C.borderSolid}` : 'none' }}>
                <Pie slices={PALETTES[r.iso]} size={26} labels={false} label={pieLabel(r.iso)} />
                <img loading="lazy" src={flagSrc(r.iso, 80)} alt="" style={{ width: '33px', height: '22px', objectFit: 'cover', borderRadius: '3px', border: `1px solid ${C.borderSolid}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(r.iso)}</div>
                  <div style={{ fontSize: '11px', color: r.found ? C.muted : C.red }}>
                    {r.found ? `${nf(r.secs, 1)} s · ${t(`guess ${r.tries}`, `essai ${r.tries}`)}` : t('Missed', 'Raté')}
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: r.found ? C.green : C.red }}>{r.found ? `+${nf(r.points)}` : '–1'}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  // ════════════════════════════ MANCHE / RÉPONSE ════════════════════════════
  const isResult = phase === 'result'
  const last = history[history.length - 1]
  const slices = PALETTES[target]
  const name = nameOf(target)
  const twins = (twinsOf[target] || []).filter(i => countries[i])
  const left = MAX_GUESSES - wrongCount
  const letters = name.replace(/[^\p{L}]/gu, '').length
  const showHint = !isResult && wrongCount >= MAX_GUESSES - 1
  const training = mode === 'training'
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const tierStart = TIERS.indexOf(tier) === 0 ? 0 : TIERS[TIERS.indexOf(tier) - 1].upTo
  const tierProgress = Number.isFinite(tier.upTo) ? 1 - (elapsed - tierStart) / (tier.upTo - tierStart) : 0
  const trainingFound = history.filter(h => h.found).length

  return (
    <div className="kf-cam" style={{ backgroundColor: C.navy, color: 'white' }}>
      <style>{CSS}</style>
      {/* Barre du haut : quitter · cœurs ou mode · score */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="kf-cam-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '4px 8px 4px 2px' }}>
          <button type="button" aria-label={t('Quit the game', 'Quitter la partie')} onClick={() => setPhase(training || history.length === 0 ? 'setup' : 'gameover')}
            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'white', cursor: 'pointer', flexShrink: 0 }}>
            <GameIcon name="close" size={22} color="white" />
          </button>
          {training
            ? <span style={{ padding: '4px 10px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 700, color: C.steel }}>{t('Training', 'Entraînement')}</span>
            : <span aria-label={t(`${lives} hearts left`, `${lives} cœurs restants`)}><Hearts lives={lives} /></span>}
          <span style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {training ? `${trainingFound} / ${history.length}` : `${nf(score)} pts`}
          </span>
        </div>
      </div>

      <div className="kf-cam-col" style={{ flex: 1, minHeight: 0, padding: '10px 16px calc(12px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Ligne d'état : question + essais restants + multiplicateur, ou verdict */}
        {!isResult ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <p className="kf-cam-q" style={{ margin: 0, flex: 1, minWidth: 0, fontSize: '16px', fontWeight: 800, lineHeight: 1.25 }}>{t('Which flag is it?', 'Quel est ce drapeau ?')}</p>
            <span aria-label={t(`${left} guesses left`, `${left} essais restants`)} style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                <span key={i} style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: i < left ? C.gold : 'rgba(255,255,255,0.15)' }} />
              ))}
            </span>
            {!training && (
              <span title={nextTier ? t(`${tierLabel(nextTier)} after ${tier.upTo} s`, `${tierLabel(nextTier)} après ${tier.upTo} s`) : ''}
                style={{ position: 'relative', overflow: 'hidden', minWidth: '62px', padding: '5px 10px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '13px', fontWeight: 800, textAlign: 'center', color: tier.mult > 1 ? C.gold : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, height: '3px', width: `${Math.max(0, tierProgress) * 100}%`, backgroundColor: C.gold, opacity: 0.8, transition: 'width 0.25s linear' }} />
                {tierLabel(tier)} <span style={{ fontWeight: 600, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{Math.floor(elapsed)} s</span>
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', flexShrink: 0, backgroundColor: last.found ? C.greenLight : C.redLight, color: last.found ? '#166534' : '#991B1B' }}>
            <GameIcon name={last.found ? 'check' : 'wrong'} size={20} color={last.found ? '#166534' : '#991B1B'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              {!training && last.found && (
                <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>
                  {BASE_POINTS[last.tries - 1]} × {nf(last.mult, 1)} ({nf(last.secs, 1)} s){last.bonus ? ` + ${last.bonus} ${t('streak', 'série')}` : ''}
                </div>
              )}
              {!training && !last.found && <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>{isOver ? t('No hearts left', 'Plus de cœurs') : t('One heart lost', 'Un cœur perdu')}</div>}
            </div>
            {!training && last.found && <span style={{ fontSize: '17px', fontWeight: 900 }}>+{nf(last.points)}</span>}
          </div>
        )}

        {/* Camembert (et drapeau une fois la manche finie) : prend toute la place libre */}
        <div style={{ flex: 1, minHeight: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ height: '100%', maxHeight: isResult ? '200px' : '300px', aspectRatio: '1 / 1', maxWidth: isResult ? '48%' : '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie slices={slices} fill label={pieLabel(target)} />
          </div>
          {isResult && (
            <img src={flagSrc(target, 320)} alt={t(`Flag of ${name}`, `Drapeau : ${name}`)}
              style={{ maxWidth: '46%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backgroundColor: 'white' }} />
          )}
        </div>

        {/* Légende des parts */}
        <div className="kf-cam-chips" style={{ display: 'flex', justifyContent: 'center', gap: '6px', overflowX: 'auto', flexShrink: 0 }}>
          {slices.map(([hex, pct], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px 3px 5px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ width: '13px', height: '13px', borderRadius: '9999px', backgroundColor: hex, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)' }} />
              {nf(pct, 1)} %
            </span>
          ))}
        </div>

        {/* Indice (avant le 3e essai) ou message */}
        {showHint && (
          <p style={{ margin: 0, flexShrink: 0, padding: '7px 12px', borderRadius: '10px', backgroundColor: 'rgba(244,180,0,0.14)', color: C.gold, fontSize: '13px', fontWeight: 700, lineHeight: 1.4 }}>
            {t('Hint: ', 'Indice : ')}
            {continent === 'all' ? `${continentOf(target)} · ` : ''}
            {t(`starts with ${name[0].toUpperCase()}, ${letters} letters`, `commence par ${name[0].toUpperCase()}, ${letters} lettres`)}
          </p>
        )}
        {!isResult && notice && (
          <p role="status" style={{ margin: 0, flexShrink: 0, fontSize: '13px', lineHeight: 1.4, color: notice.kind === 'twin' ? C.gold : '#FCA5A5' }}>
            {notice.kind === 'twin'
              ? t(`${nameOf(notice.iso)} has the very same chart, but it’s another flag. Free guess.`, `${nameOf(notice.iso)} a le même camembert, mais c’est un autre drapeau. Essai gratuit.`)
              : t(`Not ${nameOf(notice.iso)}.`, `Ce n’est pas : ${nameOf(notice.iso)}.`)}
          </p>
        )}
        {isResult && twins.length > 0 && (
          <p style={{ margin: 0, flexShrink: 0, fontSize: '12px', lineHeight: 1.4, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('Same chart as: ', 'Même camembert que : ')}{twins.map(nameOf).join(', ')}
          </p>
        )}

        {/* Essais : puces avec le camembert de chaque proposition */}
        {guesses.length > 0 && (
          <div className="kf-cam-chips" style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0 }}>
            {guesses.map(g => {
              const ok = g.iso === target
              return (
                <span key={g.iso} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px 4px 4px', borderRadius: '9999px', flexShrink: 0, fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                  backgroundColor: ok ? 'rgba(22,163,74,0.25)' : g.twin ? 'rgba(244,180,0,0.16)' : 'rgba(255,255,255,0.07)',
                  color: ok ? '#BBF7D0' : g.twin ? C.gold : 'rgba(255,255,255,0.85)' }}>
                  <Pie slices={PALETTES[g.iso]} size={22} labels={false} label={pieLabel(g.iso)} />
                  {!ok && !g.twin && <span aria-hidden="true" style={{ position: 'relative', top: '-0.5px' }}><GameIcon name="wrong" size={12} color="#FCA5A5" /></span>}
                  {nameOf(g.iso)}
                </span>
              )
            })}
          </div>
        )}

        {/* Saisie ou suite */}
        {!isResult ? (
          <div style={{ position: 'relative', flexShrink: 0, display: 'flex', gap: '8px' }}>
            {suggest.length > 0 && (
              <ul role="listbox" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, margin: 0, padding: '6px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 5 }}>
                {suggest.map((s, i) => (
                  <li key={s.iso_code} role="option" aria-selected={i === activeIdx}>
                    <button type="button" onMouseDown={e => { e.preventDefault(); guess(s.iso_code) }}
                      style={{ width: '100%', minHeight: '44px', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '8px', backgroundColor: i === activeIdx ? C.secondary : 'transparent', color: C.text, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {nameOf(s.iso_code)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="camembert-guess" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('Country', 'Pays')}</label>
            <input id="camembert-guess" ref={inputRef} value={typed} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
              placeholder={t('Type a country…', 'Tape un pays…')}
              onChange={e => onType(e.target.value)}
              onKeyDown={e => {
                if (!suggest.length) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggest.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
                else if (e.key === 'Enter') { e.preventDefault(); guess(suggest[activeIdx].iso_code) }
              }}
              style={{ flex: 1, minWidth: 0, height: '50px', padding: '0 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }} />
            {training && (
              <button type="button" onClick={giveUp} className="kf-cam-btn"
                style={{ height: '50px', padding: '0 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.22)', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                {t('Reveal', 'Voir')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <Link prefetch={false} href={`/${locale}/countries/${target}`} aria-label={t(`${name}: country page`, `Fiche du pays : ${name}`)}
              style={{ width: '50px', height: '50px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GameIcon name="eye" size={20} color="white" />
            </Link>
            <button type="button" onClick={next} autoFocus className="kf-cam-btn" style={{ ...bigBtn(C.gold, '#3A2A05'), width: 'auto', flex: 1, minWidth: 0 }}>
              {isOver ? t('See results', 'Voir les résultats') : t('Next flag', 'Drapeau suivant')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

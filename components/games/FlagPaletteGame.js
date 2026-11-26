'use client'

// Flag Palette : deviner le drapeau d'après la répartition de ses couleurs (camembert).
// Données : data/games/flag-palette.json (part de chaque couleur, calculée depuis les SVG,
// voir scripts/games/build_flag_palette.js).
//
// 10 manches, 3 essais par drapeau. Saisie libre du pays.
//   Après une erreur : le continent. Après deux : la première lettre et la longueur du nom.
//   Points : 10 au 1er essai, 6 au 2e, 3 au 3e.
// Drapeaux « jumeaux » (même camembert, ex. France / Russie / Pays-Bas) : proposer un jumeau
// ne coûte pas d'essai, on le signale et on laisse rejouer.

import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import GameIcon from '@/components/games/GameIcon'
import GuestSaveCTA from '@/components/games/GuestSaveCTA'
import PALETTES from '@/data/games/flag-palette.json'

const TOTAL_ROUNDS = 10
const MAX_GUESSES = 3
const POINTS = [10, 6, 3]

const C = {
  navy: '#16324F', navyLight: '#1E4976', gold: '#F4B400', goldDark: '#92400E',
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

const flagSrc = (iso, w = 160) => `https://flagcdn.com/w${w}/${iso}.png`

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

// ── Camembert SVG ───────────────────────────────────────────────────────────
function Pie({ slices, size = 220, labels = true, label }) {
  const r = 50, cx = 50, cy = 50
  const parts = slices.reduce((acc, [hex, pct]) => {
    const a0 = acc.length ? acc[acc.length - 1].a1 : -Math.PI / 2
    const a1 = a0 + (pct / 100) * Math.PI * 2
    return [...acc, { hex, pct, a0, a1, mid: (a0 + a1) / 2 }]
  }, [])
  const pt = (a, rad = r) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]
  return (
    <svg viewBox="-2 -2 104 104" width={size} height={size} role="img" aria-label={label} style={{ display: 'block', flexShrink: 0 }}>
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

export default function FlagPaletteGame() {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState({})   // iso -> { iso_code, name_en, name_fr, region }
  const [user, setUser] = useState(null)
  const [continent, setContinent] = useState('all')

  const [phase, setPhase] = useState('setup')      // setup | playing | result | gameover
  const [questions, setQuestions] = useState([])   // isos
  const [current, setCurrent] = useState(0)
  const [guesses, setGuesses] = useState([])       // [{ iso, twin }]
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [results, setResults] = useState([])      // [{ iso, found, tries, points, guesses }]
  const [typed, setTyped] = useState('')
  const [suggest, setSuggest] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [notice, setNotice] = useState(null)       // { kind: 'twin' | 'wrong', iso }
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

  const nameOf = (iso) => { const c = countries[iso]; return c ? ((locale === 'fr' ? c.name_fr : c.name_en) || c.name_en) : iso }
  const continentOf = (iso) => { const k = countries[iso]?.region; const c = CONTINENTS.find(x => x.key === k); return c ? t(c.en, c.fr) : k }

  const pool = useMemo(() => Object.keys(countries).filter(iso => continent === 'all' || countries[iso].region === continent), [countries, continent])
  const rounds = Math.min(TOTAL_ROUNDS, pool.length)

  // Jumeaux de chaque drapeau (calculés une fois)
  const twinsOf = useMemo(() => {
    const isos = Object.keys(countries), out = {}
    for (const a of isos) out[a] = isos.filter(b => b !== a && sameSlices(PALETTES[a], PALETTES[b]))
    return out
  }, [countries])

  function start() {
    if (rounds < 3) return
    savedRef.current = false
    setQuestions(shuffle(pool).slice(0, TOTAL_ROUNDS))
    setCurrent(0); setScore(0); setStreak(0); setBestStreak(0); setResults([])
    setGuesses([]); setTyped(''); setSuggest([]); setNotice(null)
    setPhase('playing')
  }

  const target = questions[current]
  const wrongCount = guesses.filter(g => !g.twin).length

  function finishRound(found, tries, allGuesses) {
    const pts = found ? POINTS[tries - 1] : 0
    const ns = found ? streak + 1 : 0
    setStreak(ns); setBestStreak(b => Math.max(b, ns))
    if (pts) setScore(s => s + pts)
    setResults(r => [...r, { iso: target, found, tries, points: pts, guesses: allGuesses }])
    setPhase('result')
  }

  function guess(iso) {
    if (phase !== 'playing' || !iso || guesses.some(g => g.iso === iso)) return
    setTyped(''); setSuggest([])
    if (iso === target) {
      const all = [...guesses, { iso }]
      setGuesses(all); setNotice(null)
      finishRound(true, wrongCount + 1, all)
      return
    }
    const twin = twinsOf[target]?.includes(iso)
    const all = [...guesses, { iso, twin }]
    setGuesses(all)
    setNotice({ kind: twin ? 'twin' : 'wrong', iso })
    if (!twin && wrongCount + 1 >= MAX_GUESSES) finishRound(false, MAX_GUESSES, all)
    else setTimeout(() => inputRef.current?.focus(), 50)
  }

  function next() {
    if (current + 1 >= questions.length) { setPhase('gameover'); return }
    setCurrent(c => c + 1)
    setGuesses([]); setNotice(null); setTyped(''); setSuggest([])
    setPhase('playing')
  }

  // ── Enregistrement du score (membre) ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'gameover' || savedRef.current || !user || score <= 0) return
    savedRef.current = true
    const sb = createClient()
    const correct = results.filter(r => r.found).length
    ;(async () => {
      try {
        await sb.from('game_scores_log').insert({
          user_id: user.id, game: 'flag-palette', score, played_at: new Date().toISOString(),
          details: { continent, correct, rounds: questions.length, best_streak: bestStreak },
        })
        const { data: existing } = await sb.from('game_scores').select('best_streak').eq('user_id', user.id).eq('mode', 'flag_palette').maybeSingle()
        await sb.from('game_scores').upsert({
          user_id: user.id, mode: 'flag_palette',
          best_streak: Math.max(existing?.best_streak ?? 0, score), updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,mode' })
      } catch (e) { console.error('FlagPalette save:', e?.message) }
    })()
  }, [phase, user, score, results, continent, questions.length, bestStreak])

  function onType(val) {
    setTyped(val)
    if (val.trim().length < 2) { setSuggest([]); return }
    const q = normalize(val)
    const tried = new Set(guesses.map(g => g.iso))
    const list = Object.values(countries)
      .filter(c => !tried.has(c.iso_code) && (normalize(c.name_fr).includes(q) || normalize(c.name_en).includes(q)))
      .sort((a, b) => normalize(nameOf(a.iso_code)).indexOf(q) - normalize(nameOf(b.iso_code)).indexOf(q))
      .slice(0, 6)
    setSuggest(list); setActiveIdx(0)
  }

  if (loading) return <PageLoader label={t('Loading...', 'Chargement...')} />

  const chip = (active) => ({
    padding: '7px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, minHeight: '36px',
    border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`,
    backgroundColor: active ? C.navy : C.secondary, color: active ? 'white' : C.muted,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
  })
  const primaryBtn = (enabled = true) => ({
    minHeight: '48px', padding: '0 20px', borderRadius: '10px', border: 'none', width: '100%',
    backgroundColor: enabled ? C.navy : C.light, color: 'white', fontSize: '15px', fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background-color 0.12s ease',
  })
  const overline = (color) => ({ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color })
  const pieLabel = (iso) => t('Colour chart: ', 'Répartition des couleurs : ') + PALETTES[iso].map(s => `${Math.round(s[1])}%`).join(', ')

  // ════════════════════════════ RÉGLAGES ════════════════════════════
  if (phase === 'setup') {
    const demo = PALETTES.gb
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.bg, fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div style={{ backgroundColor: C.navy, color: 'white', padding: '28px 16px 24px' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <nav style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              <Link prefetch={false} href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{t('Games', 'Jeux')}</Link>
              <span style={{ color: C.steel }}> / Flag Palette</span>
            </nav>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>Flag Palette</h1>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
              {t('Guess the flag from its colours alone: how much of each colour it uses.', 'Devine le drapeau à partir de ses seules couleurs : la part de chacune.')}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section style={{ backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Pie slices={demo} size={96} label={pieLabel('gb')} />
            <GameIcon name="arrowRight" size={20} color={C.light} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
              <img src={flagSrc('gb', 160)} alt="" style={{ width: '72px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${C.borderSolid}` }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.navy }}>{t('Example: United Kingdom', 'Exemple : Royaume-Uni')}</span>
            </div>
          </section>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              t(`${TOTAL_ROUNDS} flags, ${MAX_GUESSES} guesses each.`, `${TOTAL_ROUNDS} drapeaux, ${MAX_GUESSES} essais pour chacun.`),
              t('After a wrong guess: the continent. After two: the first letter.', 'Après une erreur : le continent. Après deux : la première lettre.'),
              t('Some flags share the exact same chart (France, Russia…): guessing a twin costs nothing.', 'Certains drapeaux ont exactement le même camembert (France, Russie…) : proposer un jumeau ne coûte rien.'),
              t(`${POINTS.join(' / ')} points on the 1st / 2nd / 3rd guess.`, `${POINTS.join(' / ')} points au 1er / 2e / 3e essai.`),
            ].map((line, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.5, color: C.text }}>
                <GameIcon name="check" size={16} color={C.green} style={{ flexShrink: 0, marginTop: '2px' }} />
                {line}
              </li>
            ))}
          </ul>

          <p style={overline(C.green)}>{t('Continent', 'Continent')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" style={chip(continent === 'all')} onClick={() => setContinent('all')}>{t('All', 'Tous')}</button>
            {CONTINENTS.map(c => (
              <button key={c.key} type="button" style={chip(continent === c.key)} onClick={() => setContinent(c.key)}>{t(c.en, c.fr)}</button>
            ))}
          </div>
          <button type="button" style={{ ...primaryBtn(rounds >= 3), marginTop: '8px' }} disabled={rounds < 3} onClick={start}>{t('Play', 'Jouer')}</button>
        </div>
      </div>
    )
  }

  // ════════════════════════════ FIN DE PARTIE ════════════════════════════
  if (phase === 'gameover') {
    const correct = results.filter(r => r.found).length
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.bg, fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <GameIcon name="trophy" size={40} color={C.gold} />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em' }}>{t('Game over', 'Partie terminée')}</h1>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: C.navy }}>{score} pts</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            {[[`${correct}/${questions.length}`, t('flags found', 'drapeaux trouvés')], [bestStreak, t('best streak', 'meilleure série')]].map(([v, l]) => (
              <div key={l} style={{ backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: C.navy }}>{v}</div>
                <div style={{ fontSize: '11px', color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>

          <ol style={{ margin: 0, padding: '6px 14px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            {results.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: i ? `1px solid ${C.borderSolid}` : 'none' }}>
                <GameIcon name={r.found ? 'check' : 'wrong'} size={16} color={r.found ? C.green : C.red} />
                <Pie slices={PALETTES[r.iso]} size={28} labels={false} label={pieLabel(r.iso)} />
                <img loading="lazy" src={flagSrc(r.iso, 80)} alt="" style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px', border: `1px solid ${C.borderSolid}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.navy }}>{nameOf(r.iso)}</div>
                  <div style={{ fontSize: '11px', color: r.found ? C.muted : C.red }}>
                    {r.found ? t(`Found on guess ${r.tries}`, `Trouvé au ${r.tries === 1 ? '1er' : `${r.tries}e`} essai`) : t('Not found', 'Non trouvé')}
                  </div>
                </div>
                {r.points > 0 && <span style={{ fontSize: '12px', fontWeight: 700, color: C.green }}>+{r.points}</span>}
              </li>
            ))}
          </ol>

          <GuestSaveCTA user={user} locale={locale} game="flag-palette" mode="flag_palette" score={score} bestStreak={bestStreak} correct={correct} played={questions.length} label="Flag Palette" />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" style={primaryBtn()} onClick={start}>{t('Play again', 'Rejouer')}</button>
            <button type="button" onClick={() => setPhase('setup')}
              style={{ width: '100%', minHeight: '48px', borderRadius: '10px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.navy, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('Change settings', 'Changer les réglages')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════ MANCHE / RÉPONSE ════════════════════════════
  const isResult = phase === 'result'
  const last = results[results.length - 1]
  const slices = PALETTES[target]
  const name = nameOf(target)
  const twins = (twinsOf[target] || []).filter(i => countries[i])
  const left = MAX_GUESSES - wrongCount
  const letters = name.replace(/[^\p{L}]/gu, '').length

  return (
    <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.navy, color: 'white', fontFamily: 'var(--font-body), system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px 8px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button type="button" aria-label={t('Quit the game', 'Quitter la partie')} onClick={() => setPhase('setup')}
          style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <GameIcon name="close" size={22} color="white" />
        </button>
        <span style={{ fontSize: '15px', fontWeight: 700 }}>{t('Flag', 'Drapeau')} {current + 1} / {questions.length}</span>
        <span style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 700 }}>{score} pts</span>
      </div>
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '4px', backgroundColor: C.gold, width: `${((current + (isResult ? 1 : 0)) / questions.length) * 100}%`, transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '18px 16px 28px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        {!isResult && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{t('Which flag has these colours?', 'Quel drapeau a ces couleurs ?')}</p>
            <span aria-label={t(`${left} guesses left`, `${left} essais restants`)} style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                <span key={i} style={{ width: '12px', height: '12px', borderRadius: '9999px', backgroundColor: i < left ? C.gold : 'rgba(255,255,255,0.15)' }} />
              ))}
            </span>
          </div>
        )}

        {isResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', backgroundColor: last.found ? C.greenLight : C.redLight, color: last.found ? '#166534' : '#991B1B' }}>
            <GameIcon name={last.found ? 'check' : 'wrong'} size={20} color={last.found ? '#166534' : '#991B1B'} />
            <span style={{ fontSize: '15px', fontWeight: 800 }}>{name} · {last.found ? t('found', 'trouvé') : t('not found', 'non trouvé')}</span>
            {last.points > 0 && <span style={{ marginLeft: 'auto', fontSize: '15px', fontWeight: 800 }}>+{last.points}</span>}
          </div>
        )}

        {/* Camembert + légende (et le drapeau une fois la manche finie) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Pie slices={slices} size={isResult ? 150 : 220} label={pieLabel(target)} />
          </div>
          {isResult && (
            <img src={flagSrc(target, 320)} alt={t(`Flag of ${name}`, `Drapeau : ${name}`)}
              style={{ maxWidth: '180px', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backgroundColor: 'white' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
          {slices.map(([hex, pct], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px 4px 6px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '9999px', backgroundColor: hex, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)' }} />
              {pct.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} %
            </span>
          ))}
        </div>

        {/* Indices */}
        {!isResult && wrongCount > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(244,180,0,0.15)', color: C.gold, fontSize: '13px', fontWeight: 700 }}>
              {t('Continent: ', 'Continent : ')}{continentOf(target)}
            </span>
            {wrongCount > 1 && (
              <span style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(244,180,0,0.15)', color: C.gold, fontSize: '13px', fontWeight: 700 }}>
                {t(`Starts with ${name[0].toUpperCase()} · ${letters} letters`, `Commence par ${name[0].toUpperCase()} · ${letters} lettres`)}
              </span>
            )}
          </div>
        )}

        {!isResult && notice && (
          <p role="status" style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: notice.kind === 'twin' ? C.gold : '#FCA5A5' }}>
            {notice.kind === 'twin'
              ? t(`${nameOf(notice.iso)} has the very same chart. Good eye, but it's another one: this guess is free.`, `${nameOf(notice.iso)} a exactement le même camembert. Bien vu, mais c’en est un autre : cet essai ne compte pas.`)
              : t(`Not ${nameOf(notice.iso)}.`, `Ce n’est pas : ${nameOf(notice.iso)}.`)}
          </p>
        )}

        {/* Saisie */}
        {!isResult && (
          <div style={{ position: 'relative' }}>
            {suggest.length > 0 && (
              <ul role="listbox" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, margin: 0, padding: '6px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 5 }}>
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
            <label htmlFor="flagpalette-guess" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('Country', 'Pays')}</label>
            <input id="flagpalette-guess" ref={inputRef} autoFocus value={typed} autoComplete="off" placeholder={t('Type a country…', 'Tape un pays…')}
              onChange={e => onType(e.target.value)}
              onKeyDown={e => {
                if (!suggest.length) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggest.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
                else if (e.key === 'Enter') { e.preventDefault(); guess(suggest[activeIdx].iso_code) }
              }}
              style={{ width: '100%', height: '48px', boxSizing: 'border-box', padding: '0 14px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {/* Essais : le camembert de chaque proposition, pour comparer */}
        {guesses.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={overline(C.steel)}>{t('Your guesses', 'Tes essais')}</p>
            {guesses.map((g, i) => {
              const ok = g.iso === target
              return (
                <div key={g.iso} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', backgroundColor: ok ? 'rgba(22,163,74,0.18)' : 'rgba(255,255,255,0.06)' }}>
                  <span style={{ width: '18px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                  <img src={flagSrc(g.iso, 80)} alt="" style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px', backgroundColor: 'white' }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(g.iso)}</span>
                  {g.twin && <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FEF3C7', color: C.goldDark, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t('Twin', 'Jumeau')}</span>}
                  <Pie slices={PALETTES[g.iso]} size={36} labels={false} label={pieLabel(g.iso)} />
                  <GameIcon name={ok ? 'check' : 'wrong'} size={16} color={ok ? '#4ADE80' : '#FCA5A5'} />
                </div>
              )
            })}
          </section>
        )}

        {isResult && twins.length > 0 && (
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }}>
            {t('Same chart as: ', 'Même camembert que : ')}{twins.map(nameOf).join(', ')}
          </p>
        )}

        {isResult && (
          <>
            <Link prefetch={false} href={`/${locale}/countries/${target}`} style={{ fontSize: '13px', fontWeight: 700, color: C.steel }}>
              {t('See the country page', 'Voir la fiche du pays')}
            </Link>
            <button type="button" onClick={next} autoFocus
              style={{ minHeight: '48px', borderRadius: '10px', border: 'none', backgroundColor: C.gold, color: '#3A2A05', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {current + 1 >= questions.length ? t('See results', 'Voir les résultats') : t('Next flag', 'Drapeau suivant')}
            </button>
          </>
        )}

        {!isResult && streak >= 3 && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t(`Streak: ${streak} flags in a row`, `Série en cours : ${streak} drapeaux d’affilée`)}
          </p>
        )}
      </div>
    </div>
  )
}

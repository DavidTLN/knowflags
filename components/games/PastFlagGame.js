'use client'

// PastFlag : retrouver le pays derrière un drapeau historique.
// Données : country_flag_history (drapeaux dont date_end n'est pas nulle), images locales.
//
// Réglages, un choix à la fois : difficulté, puis période, puis continent.
//   Facile    : 4 choix, drapeaux adoptés à partir de 1900
//   Normal    : 4 choix, toutes époques, bonus période
//   Difficile : saisie libre du pays, bonus période
// 10 manches de 20 s. Points = 10 + temps restant / 2. Bonus période : +5.
// Leurres pris dans le même continent que la bonne réponse.
//
// Bonus période (Normal et Difficile, seulement si toutes les périodes sont jouées) :
// « adopté en quelle période ? », les 5 périodes + « Je ne sais pas ». Les dates du
// drapeau (fiche, frise du pays) ne s'affichent qu'une fois le bonus répondu.

import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import GameIcon from '@/components/games/GameIcon'
import GuestSaveCTA from '@/components/games/GuestSaveCTA'

const TOTAL_ROUNDS = 10
const TIME_PER_ROUND = 20
const PERIOD_BONUS = 5

const C = {
  navy: '#16324F', navyLight: '#1E4976', gold: '#F4B400', goldDark: '#92400E',
  green: '#16A34A', greenLight: '#DCFCE7', red: '#D62828', redLight: '#FEE2E2',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF', steel: '#9EB7E5',
}

const DIFFICULTIES = [
  { key: 'easy',   en: 'Easy',   fr: 'Facile',    descEn: '4 choices · flags from 1900 on',          descFr: '4 choix · drapeaux après 1900' },
  { key: 'normal', en: 'Normal', fr: 'Normal',    descEn: '4 choices · all eras · period bonus +5',   descFr: '4 choix · toutes époques · bonus période +5' },
  { key: 'hard',   en: 'Hard',   fr: 'Difficile', descEn: 'Type the country · period bonus +5',       descFr: 'Saisie libre du pays · bonus période +5' },
]

// Bornes incluses, sans chevauchement : chaque année n'appartient qu'à une période.
const PERIODS = [
  { key: 'p1', from: -9999, to: 1799, en: 'Before 1800',    fr: 'Avant 1800' },
  { key: 'p2', from: 1800,  to: 1913, en: '1800 to 1913',   fr: '1800 à 1913' },
  { key: 'p3', from: 1914,  to: 1944, en: '1914 to 1944',   fr: '1914 à 1944' },
  { key: 'p4', from: 1945,  to: 1989, en: '1945 to 1989',   fr: '1945 à 1989' },
  { key: 'p5', from: 1990,  to: 9999, en: '1990 and after', fr: '1990 et après' },
]

const CONTINENTS = [
  { key: 'Africa', en: 'Africa', fr: 'Afrique' },
  { key: 'Americas', en: 'Americas', fr: 'Amériques' },
  { key: 'Asia', en: 'Asia', fr: 'Asie' },
  { key: 'Europe', en: 'Europe', fr: 'Europe' },
  { key: 'Oceania', en: 'Oceania', fr: 'Océanie' },
]

const yearOf = (d) => (d ? parseInt(String(d).slice(0, 4), 10) : null)
const periodIndex = (year) => PERIODS.findIndex(p => year >= p.from && year <= p.to)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalize(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function PastFlagGame() {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])       // toutes les lignes (passées et actuelles)
  const [countries, setCountries] = useState({})   // iso -> { iso_code, name_en, name_fr, region }
  const [user, setUser] = useState(null)

  // Réglages
  const [step, setStep] = useState(0)              // 0 difficulté, 1 période, 2 continent
  const [difficulty, setDifficulty] = useState('normal')
  const [period, setPeriod] = useState('all')
  const [continent, setContinent] = useState('all')

  // Partie
  const [phase, setPhase] = useState('setup')      // setup | playing | result | gameover
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)   // iso choisi, ou '' si temps écoulé
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [results, setResults] = useState([])
  const [bonusPick, setBonusPick] = useState(null)   // index de période, 'skip', ou null (pas encore répondu)
  const [imgError, setImgError] = useState(false)
  const [typed, setTyped] = useState('')
  const [suggest, setSuggest] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const savedRef = useRef(false)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('country_flag_history').select('id, iso_code, image_url, date_start, date_end, label_en, label_fr, notes_en, notes_fr').order('date_start'),
      sb.from('countries').select('iso_code, name_en, name_fr, region'),
    ]).then(([{ data: h }, { data: c }]) => {
      setHistory(h || [])
      setCountries(Object.fromEntries((c || []).map(x => [x.iso_code, x])))
      setLoading(false)
    })
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null))
  }, [])

  const nameOf = (iso) => { const c = countries[iso]; return c ? (locale === 'fr' ? c.name_fr : c.name_en) : iso }

  // Drapeaux jouables selon les réglages
  const pool = useMemo(() => history.filter(h => {
    if (!h.date_end || !countries[h.iso_code]) return false
    if (!h.image_url || !h.image_url.startsWith('/flags/history/')) return false   // pas l'image du drapeau actuel
    const y = yearOf(h.date_start)
    if (y == null) return false
    if (difficulty === 'easy' && y < 1900) return false
    if (period !== 'all') { const p = PERIODS.find(x => x.key === period); if (y < p.from || y > p.to) return false }
    if (continent !== 'all' && countries[h.iso_code].region !== continent) return false
    return true
  }), [history, countries, difficulty, period, continent])

  const rounds = Math.min(TOTAL_ROUNDS, pool.length)

  // ── Chrono ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { answer(''); return }
    const id = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  function buildQuestions() {
    const allIsos = Object.keys(countries)
    // Un drapeau par pays au maximum dans une partie, pour varier
    const seen = new Set()
    const picked = []
    for (const h of shuffle(pool)) {
      if (seen.has(h.iso_code)) continue
      seen.add(h.iso_code); picked.push(h)
      if (picked.length >= TOTAL_ROUNDS) break
    }
    if (picked.length < TOTAL_ROUNDS) {
      for (const h of shuffle(pool)) {
        if (picked.length >= TOTAL_ROUNDS) break
        if (!picked.includes(h)) picked.push(h)
      }
    }
    return picked.map(flag => {
      const region = countries[flag.iso_code].region
      const sameRegion = shuffle(allIsos.filter(i => i !== flag.iso_code && countries[i].region === region))
      const others = shuffle(allIsos.filter(i => i !== flag.iso_code && countries[i].region !== region))
      const decoys = [...sameRegion, ...others].slice(0, 3)
      return { flag, choices: shuffle([flag.iso_code, ...decoys]) }
    })
  }

  function start() {
    if (rounds < 4) return
    savedRef.current = false
    setQuestions(buildQuestions())
    setCurrent(0); setScore(0); setStreak(0); setBestStreak(0); setResults([])
    setSelected(null); setBonusPick(null); setImgError(false); setTyped(''); setSuggest([])
    setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  function answer(iso) {
    if (phase !== 'playing') return
    const q = questions[current]
    const correct = iso === q.flag.iso_code
    const pts = correct ? 10 + Math.floor(timeLeft / 2) : 0
    const ns = correct ? streak + 1 : 0
    setSelected(iso)
    setStreak(ns); setBestStreak(b => Math.max(b, ns))
    if (pts) setScore(s => s + pts)
    setResults(r => [...r, { q, choice: iso, correct, points: pts, bonus: 0 }])
    setBonusPick(null); setSuggest([]); setTyped('')
    setPhase('result')
  }

  function pickBonus(idx) {
    if (bonusPick != null) return
    const q = questions[current]
    const right = periodIndex(yearOf(q.flag.date_start))
    setBonusPick(idx)
    if (idx !== 'skip' && idx === right) {
      setScore(s => s + PERIOD_BONUS)
      setResults(r => r.map((x, i) => (i === r.length - 1 ? { ...x, bonus: PERIOD_BONUS } : x)))
    }
  }

  function next() {
    if (current + 1 >= questions.length) { setPhase('gameover'); return }
    setCurrent(c => c + 1)
    setSelected(null); setBonusPick(null); setImgError(false)
    setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  // ── Enregistrement du score (membre) ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'gameover' || savedRef.current || !user || score <= 0) return
    savedRef.current = true
    const sb = createClient()
    const correct = results.filter(r => r.correct).length
    ;(async () => {
      try {
        await sb.from('game_scores_log').insert({
          user_id: user.id, game: 'past-flag', score, played_at: new Date().toISOString(),
          details: { difficulty, period, continent, correct, rounds: questions.length, best_streak: bestStreak },
        })
        const { data: existing } = await sb.from('game_scores').select('best_streak').eq('user_id', user.id).eq('mode', 'past_flag').maybeSingle()
        await sb.from('game_scores').upsert({
          user_id: user.id, mode: 'past_flag',
          best_streak: Math.max(existing?.best_streak ?? 0, score), updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,mode' })
      } catch (e) { console.error('PastFlag save:', e?.message) }
    })()
  }, [phase, user, score, results, difficulty, period, continent, questions.length, bestStreak])

  // ── Saisie libre (Difficile) ───────────────────────────────────────────────
  function onType(val) {
    setTyped(val)
    if (val.trim().length < 2) { setSuggest([]); return }
    const q = normalize(val)
    const list = Object.values(countries)
      .filter(c => normalize(c.name_fr).includes(q) || normalize(c.name_en).includes(q))
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

  // ════════════════════════════ RÉGLAGES ════════════════════════════
  if (phase === 'setup') {
    const periodsForDiff = difficulty === 'easy' ? PERIODS.filter(p => p.to >= 1900) : PERIODS
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.bg, fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div style={{ backgroundColor: C.navy, color: 'white', padding: '28px 16px 24px' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <nav style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              <Link prefetch={false} href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{t('Games', 'Jeux')}</Link>
              <span style={{ color: C.steel }}> / PastFlag</span>
            </nav>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>PastFlag</h1>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
              {t('Find the country behind a flag from the past.', 'Retrouve le pays derrière un drapeau d’autrefois.')}
            </p>
            <span style={{ alignSelf: 'flex-start', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FEF3C7', color: C.goldDark, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              {t(`${pool.length} flags available`, `${pool.length} drapeaux disponibles`)}
            </span>
          </div>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <p style={overline(C.green)}>
              {t(`Step ${step + 1} of 3`, `Étape ${step + 1} sur 3`)} · {[t('Difficulty', 'Difficulté'), t('Period', 'Période'), t('Continent', 'Continent')][step]}
            </p>
            <span style={{ fontSize: '13px', color: C.muted }}>{t(`${TOTAL_ROUNDS} rounds · ${TIME_PER_ROUND} s`, `${TOTAL_ROUNDS} manches · ${TIME_PER_ROUND} s`)}</span>
          </div>

          {step === 0 && DIFFICULTIES.map(d => {
            const active = difficulty === d.key
            return (
              <button key={d.key} type="button" onClick={() => { setDifficulty(d.key); if (d.key === 'easy' && period === 'p1') setPeriod('all') }}
                style={{ textAlign: 'left', padding: '16px', borderRadius: '12px', border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface, boxShadow: active ? '0 0 0 3px rgba(22,50,79,0.12)' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'inherit', transition: 'all 0.12s ease' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 800, color: C.navy }}>
                  {t(d.en, d.fr)}
                  {active && <GameIcon name="check" size={18} color={C.navy} />}
                </span>
                <span style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>{t(d.descEn, d.descFr)}</span>
              </button>
            )
          })}

          {step === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button type="button" style={chip(period === 'all')} onClick={() => setPeriod('all')}>{t('All', 'Toutes')}</button>
              {periodsForDiff.map(p => (
                <button key={p.key} type="button" style={chip(period === p.key)} onClick={() => setPeriod(p.key)}>
                  {difficulty === 'easy' && p.key === 'p2' ? t('1900 to 1913', '1900 à 1913') : t(p.en, p.fr)}
                </button>
              ))}
            </div>
          )}
          {step === 1 && difficulty !== 'easy' && (
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: C.muted }}>
              {period === 'all'
                ? t(`Period bonus (+${PERIOD_BONUS}) after each answer: guess when the flag was adopted.`, `Bonus période (+${PERIOD_BONUS}) après chaque réponse : devine quand le drapeau a été adopté.`)
                : t('No period bonus when you pick a single period: you already know the answer.', 'Pas de bonus période quand tu choisis une seule période : tu connais déjà la réponse.')}
            </p>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button type="button" style={chip(continent === 'all')} onClick={() => setContinent('all')}>{t('All', 'Tous')}</button>
              {CONTINENTS.map(c => (
                <button key={c.key} type="button" style={chip(continent === c.key)} onClick={() => setContinent(c.key)}>{t(c.en, c.fr)}</button>
              ))}
            </div>
          )}

          {step > 0 && rounds < 4 && (
            <p style={{ margin: 0, fontSize: '13px', color: C.red }}>
              {t('Not enough flags with these settings. Widen the period or the continent.', 'Pas assez de drapeaux avec ces réglages. Élargis la période ou le continent.')}
            </p>
          )}
          {step > 0 && rounds >= 4 && rounds < TOTAL_ROUNDS && (
            <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
              {t(`Only ${rounds} flags match: the game will have ${rounds} rounds.`, `Seuls ${rounds} drapeaux correspondent : la partie comptera ${rounds} manches.`)}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                style={{ minHeight: '48px', padding: '0 20px', borderRadius: '10px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.navy, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('Back', 'Retour')}
              </button>
            )}
            {step < 2
              ? <button type="button" style={primaryBtn()} onClick={() => setStep(s => s + 1)}>{t('Continue', 'Continuer')}</button>
              : <button type="button" style={primaryBtn(rounds >= 4)} disabled={rounds < 4} onClick={start}>{t('Play', 'Jouer')}</button>}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════ FIN DE PARTIE ════════════════════════════
  if (phase === 'gameover') {
    const correct = results.filter(r => r.correct).length
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.bg, fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <GameIcon name="trophy" size={40} color={C.gold} />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em' }}>{t('Game over', 'Partie terminée')}</h1>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: C.navy }}>{score} pts</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            {[[`${correct}/${questions.length}`, t('correct', 'bonnes réponses')], [bestStreak, t('best streak', 'meilleure série')]].map(([v, l]) => (
              <div key={l} style={{ backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: C.navy }}>{v}</div>
                <div style={{ fontSize: '11px', color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>

          <ol style={{ margin: 0, padding: '6px 14px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            {results.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: i ? `1px solid ${C.borderSolid}` : 'none' }}>
                <GameIcon name={r.correct ? 'check' : 'wrong'} size={16} color={r.correct ? C.green : C.red} />
                <img loading="lazy" src={r.q.flag.image_url} alt="" style={{ width: '36px', height: '24px', objectFit: 'contain', borderRadius: '3px', border: `1px solid ${C.borderSolid}`, backgroundColor: C.bgAlt }} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.navy }}>{nameOf(r.q.flag.iso_code)} · {yearOf(r.q.flag.date_start)}</div>
                  {!r.correct && r.choice && <div style={{ fontSize: '11px', color: C.red }}>{t('Your answer: ', 'Ta réponse : ')}{nameOf(r.choice)}</div>}
                  {!r.correct && !r.choice && <div style={{ fontSize: '11px', color: C.red }}>{t('Time ran out', 'Temps écoulé')}</div>}
                </div>
                {(r.points + r.bonus) > 0 && <span style={{ fontSize: '12px', fontWeight: 700, color: C.green }}>+{r.points + r.bonus}</span>}
              </li>
            ))}
          </ol>

          <GuestSaveCTA user={user} locale={locale} game="past-flag" mode="past_flag" score={score} bestStreak={bestStreak} correct={correct} played={questions.length} label="PastFlag" />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" style={primaryBtn()} onClick={start}>{t('Play again', 'Rejouer')}</button>
            <button type="button" onClick={() => { setPhase('setup'); setStep(0) }}
              style={{ width: '100%', minHeight: '48px', borderRadius: '10px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.navy, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('Change settings', 'Changer les réglages')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════ MANCHE / RÉPONSE ════════════════════════════
  const q = questions[current]
  const flag = q.flag
  const isResult = phase === 'result'
  const wasCorrect = isResult && selected === flag.iso_code
  const lastResult = results[results.length - 1]
  const y = yearOf(flag.date_start)
  const rightPeriod = periodIndex(y)
  // Toutes les périodes proposées, dans l'ordre : la bonne n'a pas de place fixe.
  const bonusChoices = PERIODS.map((_, i) => i)
  const showBonus = isResult && difficulty !== 'easy' && period === 'all' && rightPeriod >= 0
  // Tant que le bonus n'est pas répondu, rien ne trahit la date du drapeau.
  const bonusPending = showBonus && bonusPick == null
  const countryFlags = history.filter(h => h.iso_code === flag.iso_code)

  return (
    <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.navy, color: 'white', fontFamily: 'var(--font-body), system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px 8px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button type="button" aria-label={t('Quit the game', 'Quitter la partie')} onClick={() => { setPhase('setup'); setStep(0) }}
          style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <GameIcon name="close" size={22} color="white" />
        </button>
        <span style={{ fontSize: '15px', fontWeight: 700 }}>{t('Round', 'Manche')} {current + 1} / {questions.length}</span>
        <span style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 700 }}>{score} pts</span>
      </div>
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '4px', backgroundColor: C.gold, width: `${(timeLeft / TIME_PER_ROUND) * 100}%`, transition: 'width 1s linear' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '20px 16px 28px', display: 'flex', flexDirection: 'column', gap: '18px', boxSizing: 'border-box' }}>
        {!isResult && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{t('Which country used this flag?', 'À quel pays appartenait ce drapeau ?')}</p>
            <span role="timer" aria-label={t(`${timeLeft} seconds left`, `${timeLeft} secondes restantes`)}
              style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '9999px', border: `3px solid ${timeLeft <= 5 ? C.red : C.gold}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: timeLeft <= 5 ? '#FCA5A5' : C.gold }}>
              {timeLeft}
            </span>
          </div>
        )}

        {isResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', backgroundColor: wasCorrect ? C.greenLight : C.redLight, color: wasCorrect ? '#166534' : '#991B1B' }}>
            <GameIcon name={wasCorrect ? 'check' : 'wrong'} size={20} color={wasCorrect ? '#166534' : '#991B1B'} />
            <span style={{ fontSize: '15px', fontWeight: 800 }}>
              {nameOf(flag.iso_code)} · {wasCorrect ? t('correct', 'bonne réponse') : selected ? t('wrong answer', 'mauvaise réponse') : t('time ran out', 'temps écoulé')}
            </span>
            {lastResult?.points > 0 && <span style={{ marginLeft: 'auto', fontSize: '15px', fontWeight: 800 }}>+{lastResult.points}</span>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', padding: isResult ? 0 : '8px 0' }}>
          {!imgError ? (
            <img src={flag.image_url} alt={t('Historical flag to identify', 'Drapeau historique à identifier')} onError={() => setImgError(true)}
              style={{ maxWidth: '100%', maxHeight: isResult ? '140px' : '220px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backgroundColor: 'white' }} />
          ) : (
            <div style={{ width: '100%', height: '160px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              {t('Image unavailable', 'Image indisponible')}
            </div>
          )}
        </div>

        {/* Réponses */}
        {!isResult && difficulty !== 'hard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            {q.choices.map(iso => (
              <button key={iso} type="button" onClick={() => answer(iso)}
                style={{ minHeight: '56px', padding: '8px 12px', borderRadius: '12px', border: 'none', backgroundColor: C.surface, color: C.navy, fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.12s ease' }}>
                {nameOf(iso)}
              </button>
            ))}
          </div>
        )}

        {!isResult && difficulty === 'hard' && (
          <div style={{ position: 'relative' }}>
            {suggest.length > 0 && (
              <ul role="listbox" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, margin: 0, padding: '6px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 5 }}>
                {suggest.map((s, i) => (
                  <li key={s.iso_code} role="option" aria-selected={i === activeIdx}>
                    <button type="button" onMouseDown={e => { e.preventDefault(); answer(s.iso_code) }}
                      style={{ width: '100%', minHeight: '44px', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '8px', backgroundColor: i === activeIdx ? C.secondary : 'transparent', color: C.text, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {nameOf(s.iso_code)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="pastflag-guess" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('Country', 'Pays')}</label>
            <input id="pastflag-guess" autoFocus value={typed} autoComplete="off" placeholder={t('Type a country…', 'Tape un pays…')}
              onChange={e => onType(e.target.value)}
              onKeyDown={e => {
                if (!suggest.length) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggest.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
                else if (e.key === 'Enter') { e.preventDefault(); answer(suggest[activeIdx].iso_code) }
              }}
              style={{ width: '100%', height: '48px', boxSizing: 'border-box', padding: '0 14px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {/* Après la réponse */}
        {isResult && (
          <>
            {showBonus && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={overline(C.gold)}>{t(`Bonus · adopted in which period? (+${PERIOD_BONUS})`, `Bonus · adopté en quelle période ? (+${PERIOD_BONUS})`)}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {bonusChoices.map(i => {
                    const picked = bonusPick === i
                    const reveal = bonusPick != null
                    const isRight = i === rightPeriod
                    const bg = reveal ? (isRight ? C.green : picked ? C.red : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.12)'
                    return (
                      <button key={i} type="button" disabled={reveal} onClick={() => pickBonus(i)}
                        style={{ minHeight: '44px', padding: '7px 14px', borderRadius: '9999px', border: 'none', backgroundColor: bg, color: reveal && !isRight && !picked ? 'rgba(255,255,255,0.5)' : 'white', fontSize: '13px', fontWeight: 700, cursor: reveal ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background-color 0.15s ease' }}>
                        {t(PERIODS[i].en, PERIODS[i].fr)}{reveal && isRight && picked ? ` +${PERIOD_BONUS}` : ''}
                      </button>
                    )
                  })}
                  <button type="button" disabled={bonusPick != null} onClick={() => pickBonus('skip')}
                    style={{ minHeight: '44px', padding: '7px 14px', borderRadius: '9999px', border: '1.5px solid rgba(255,255,255,0.3)', backgroundColor: bonusPick === 'skip' ? 'rgba(255,255,255,0.18)' : 'transparent', color: bonusPick != null && bonusPick !== 'skip' ? 'rgba(255,255,255,0.4)' : 'white', fontSize: '13px', fontWeight: 600, cursor: bonusPick != null ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background-color 0.15s ease' }}>
                    {t('I don’t know', 'Je ne sais pas')}
                  </button>
                </div>
                {bonusPending ? (
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                    {t('Answer to see the story of this flag.', 'Réponds pour découvrir l’histoire de ce drapeau.')}
                  </p>
                ) : bonusPick !== rightPeriod && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                    {t('Adopted in', 'Adopté en')} {y} · {t(PERIODS[rightPeriod].en, PERIODS[rightPeriod].fr)}
                  </p>
                )}
              </section>
            )}

            {!bonusPending && (
              <section style={{ backgroundColor: C.surface, color: C.text, borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: C.navy }}>{locale === 'fr' ? flag.label_fr : flag.label_en}</span>
                <span style={{ fontSize: '13px', color: C.muted }}>{yearOf(flag.date_start)} {t('to', 'à')} {yearOf(flag.date_end)}</span>
                {(locale === 'fr' ? flag.notes_fr : flag.notes_en) && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.6, color: C.text }}>{locale === 'fr' ? flag.notes_fr : flag.notes_en}</p>
                )}
              </section>
            )}

            {!bonusPending && countryFlags.length > 1 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={overline(C.steel)}>{t(`The ${countryFlags.length} flags of ${nameOf(flag.iso_code)}`, `Les ${countryFlags.length} drapeaux : ${nameOf(flag.iso_code)}`)}</p>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {countryFlags.map(h => {
                    const on = h.id === flag.id
                    return (
                      <span key={h.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px', borderRadius: '8px', backgroundColor: on ? C.gold : 'rgba(255,255,255,0.08)' }}>
                        <img loading="lazy" src={h.image_url} alt="" style={{ width: '44px', height: '28px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '2px' }} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                        <span style={{ fontSize: '11px', fontWeight: on ? 800 : 600, color: on ? '#3A2A05' : 'white' }}>{h.date_end ? yearOf(h.date_start) : t('Today', 'Actuel')}</span>
                      </span>
                    )
                  })}
                </div>
                <Link prefetch={false} href={`/${locale}/countries/${flag.iso_code}`} style={{ fontSize: '13px', fontWeight: 700, color: C.steel }}>
                  {t('See the country page', 'Voir la fiche du pays')}
                </Link>
              </section>
            )}

            {!bonusPending && (
              <button type="button" onClick={next}
                style={{ minHeight: '48px', borderRadius: '10px', border: 'none', backgroundColor: C.gold, color: '#3A2A05', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {current + 1 >= questions.length ? t('See results', 'Voir les résultats') : t('Next round', 'Manche suivante')}
              </button>
            )}
          </>
        )}

        {!isResult && streak >= 3 && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t(`Streak: ${streak} correct answers`, `Série en cours : ${streak} bonnes réponses`)}
          </p>
        )}
      </div>
    </div>
  )
}

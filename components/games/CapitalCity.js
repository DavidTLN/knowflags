'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'

const MAX_LIVES     = 3
const POINTS_CORRECT  = 50
const POINTS_TIMER_BONUS = 2
const STREAK_MULTIPLIER = (streak) => {
  if (streak >= 20) return 3
  if (streak >= 10) return 2
  if (streak >= 5)  return 1.5
  return 1
}
const TIMER_SECONDS = 15
const SCREEN        = { SETUP: 'setup', PLAYING: 'playing', GAME_OVER: 'gameover' }
const REGIONS = [
  { key: 'Africa',   en: 'Africa',   fr: 'Afrique'   },
  { key: 'Americas', en: 'Americas', fr: 'Amériques' },
  { key: 'Asia',     en: 'Asia',     fr: 'Asie'      },
  { key: 'Europe',   en: 'Europe',   fr: 'Europe'    },
  { key: 'Oceania',  en: 'Oceania',  fr: 'Océanie'   },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestion(pool, questionMode, answerMode) {
  const qMode = questionMode === 'both'
    ? (['flag', 'capital-flag', 'name'][Math.floor(Math.random() * 3)])
    : questionMode
  const forcedAMode = qMode === 'capital-flag' ? 'mcq' : null
  const aMode = forcedAMode ?? (answerMode === 'both'
    ? (Math.random() > 0.5 ? 'mcq' : 'type')
    : answerMode)
  const shuffled  = shuffle(pool)
  const correct   = shuffled[0]
  const distractors = shuffle(shuffled.slice(1)).slice(0, 3)
  const options   = shuffle([correct, ...distractors])
  return { correct, options, qMode, aMode }
}

function scoreKey(questionMode, answerMode) {
  return `capital_city_${questionMode}_${answerMode}`
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function CapitalCity() {
  const locale    = useLocale()
  const t         = (en, fr) => locale === 'fr' ? fr : en

  const [screen,       setScreen]       = useState(SCREEN.SETUP)
  const [questionMode, setQuestionMode] = useState('flag')
  const [answerMode,   setAnswerMode]   = useState('mcq')
  const [regionFilter, setRegionFilter] = useState([])
  const [isMobile,     setIsMobile]     = useState(false)
  const [countries,    setCountries]    = useState([])
  const [countriesLoading, setCountriesLoading] = useState(true)

  const [lives,      setLives]      = useState(MAX_LIVES)
  const [streak,     setStreak]     = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastPoints, setLastPoints] = useState(null)
  const [question,   setQuestion]   = useState(null)
  const [answered,   setAnswered]   = useState(null)
  const [history,    setHistory]    = useState([])
  const [timer,      setTimer]      = useState(TIMER_SECONDS)
  const [typeInput,  setTypeInput]  = useState('')
  const [typeResult, setTypeResult] = useState(null)
  const [score,      setScore]      = useState(0)
  const [bestScore,  setBestScore]  = useState(0)
  const scoreRef   = useRef(0)
  const [elapsed,     setElapsed]     = useState(0)
  const [showQuitTip, setShowQuitTip] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const sessionTimerRef = useRef(null)
  const sessionStartRef = useRef(null)
  const [user,       setUser]       = useState(null)
  const [bestScores, setBestScores] = useState({})
  const timerRef  = useRef(null)
  const livesRef  = useRef(MAX_LIVES)
  const streakRef = useRef(0)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (!document.getElementById('capitalcity-anim')) {
      const style = document.createElement('style')
      style.id = 'capitalcity-anim'
      style.textContent = '@keyframes floatUpCC { 0% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; transform:translateX(-50%) translateY(-28px); } } @keyframes popInCC { 0%{transform:scale(0.92);opacity:0} 100%{transform:scale(1);opacity:1} }'
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setCountriesLoading(false), 8000)
    const supabase = createClient()
    supabase.from('countries').select('iso_code, name_en, name_fr, region, capital, capital_fr').not('capital', 'is', null).order('name_en')
      .then(({ data }) => {
        if (data) setCountries(data.map(c => ({ code: c.iso_code, en: c.name_en, fr: c.name_fr, region: c.region, capital: c.capital })))
        setCountriesLoading(false)
      })
      .catch(() => setCountriesLoading(false))
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null; setUser(u)
      if (u) await loadBestScores(supabase, u.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      const u = s?.user ?? null; setUser(u)
      if (u) await loadBestScores(createClient(), u.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadBestScores(supabase, userId) {
    const { data } = await supabase.from('game_scores').select('mode, best_streak').eq('user_id', userId).like('mode', 'capital_city_%')
    if (data) {
      const map = {}
      data.forEach(row => { map[row.mode] = row.best_streak })
      setBestScores(map)
    }
  }

  async function logScore(s) {
    if (!s || s <= 0) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({ user_id: user.id, game: 'capital-city', score: s, played_at: new Date().toISOString() })
    } catch (e) { console.error('logScore error:', e) }
  }

  async function saveBestScore(newStreak) {
    if (!user) return
    const key = scoreKey(questionMode, answerMode)
    const prev = bestScores[key] ?? 0
    if (newStreak <= prev) return
    const supabase = createClient()
    await supabase.from('game_scores').upsert({ user_id: user.id, mode: key, best_streak: newStreak, updated_at: new Date().toISOString() }, { onConflict: 'user_id,mode' })
    setBestScores(p => ({ ...p, [key]: newStreak }))
  }

  function startSessionTimer() {
    clearInterval(sessionTimerRef.current)
    sessionStartRef.current = Date.now()
    sessionTimerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000)), 1000)
  }
  function stopSessionTimer() { clearInterval(sessionTimerRef.current) }

  async function quitGame() {
    stopSessionTimer()
    const correctCount = history.filter(h => h.isCorrect).length
    await saveBestScore(Math.max(bestStreak, streakRef.current))
    await saveStats(correctCount, Math.max(bestStreak, streakRef.current))
    setScreen(SCREEN.GAME_OVER)
  }

  async function saveStats(correctCount, bestStreakVal) {
    if (!user) return
    const supabase = createClient()
    const { data: existing } = await supabase.from('player_stats').select('*').eq('user_id', user.id).eq('game', 'capital-city').single()
    if (existing) {
      await supabase.from('player_stats').update({ game: 'capital-city', games_played: (existing.games_played || 0) + 1, flags_found: (existing.flags_found || 0) + correctCount, streak_best: Math.max(existing.streak_best || 0, bestStreakVal), streak_current: 0, updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('game', 'capital-city')
    } else {
      await supabase.from('player_stats').insert({ user_id: user.id, game: 'capital-city', games_played: 1, flags_found: correctCount, streak_best: bestStreakVal, streak_current: 0 })
    }
  }

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update(); window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const getPool = useCallback(() => {
    const base = regionFilter.length > 0 ? countries.filter(c => regionFilter.includes(c.region)) : countries
    return base.length >= 4 ? base : countries
  }, [regionFilter, countries])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  const makeNextQuestion = useCallback(() => {
    const q = buildQuestion(getPool(), questionMode, answerMode)
    setQuestion(q); setAnswered(null); setTypeInput(''); setTypeResult(null); setTimer(TIMER_SECONDS)
  }, [getPool, questionMode, answerMode])

  function startGame() {
    livesRef.current = MAX_LIVES; streakRef.current = 0
    setLives(MAX_LIVES); setStreak(0); setBestStreak(0); setScore(0); setLastPoints(null); setHistory([])
    setScreen(SCREEN.PLAYING)
    const q = buildQuestion(getPool(), questionMode, answerMode)
    setQuestion(q); setAnswered(null); setTypeInput(''); setTypeResult(null); setTimer(TIMER_SECONDS)
    scoreRef.current = 0; setScore(0); setBestScore(0); setElapsed(0)
    startSessionTimer()
  }

  useEffect(() => {
    if (screen !== SCREEN.PLAYING || answered !== null || !question) return
    if (timer <= 0) { handleAnswer(null); return }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timer, screen, answered, question])

  function handleAnswer(selected) {
    clearTimeout(timerRef.current)
    const isCorrect = selected !== null && selected.code === question.correct.code
    setAnswered({ selected, correct: question.correct, isCorrect })
    setHistory(prev => [...prev, { question, selected, isCorrect }])
    if (isCorrect) {
      const ns = streakRef.current + 1; streakRef.current = ns; setStreak(ns); setBestStreak(p => Math.max(p, ns))
      const pts = Math.round((POINTS_CORRECT + timer * POINTS_TIMER_BONUS) * STREAK_MULTIPLIER(ns))
      const newScore = scoreRef.current + pts; scoreRef.current = newScore; setScore(newScore); setBestScore(b => Math.max(b, newScore))
      setLastPoints({ pts, multiplier: STREAK_MULTIPLIER(ns) }); setTimeout(() => setLastPoints(null), 1500)
    } else {
      streakRef.current = 0; setStreak(0)
      const nl = livesRef.current - 1; livesRef.current = nl; setLives(nl)
      if (nl <= 0) {
        setTimeout(async () => {
          stopSessionTimer()
          const finalBest = Math.max(bestStreak, streakRef.current)
          const correctCount = history.filter(h => h.isCorrect).length
          await saveBestScore(finalBest); await saveStats(correctCount, finalBest)
          setScreen(SCREEN.GAME_OVER)
        }, 2000); return
      }
    }
    setTimeout(() => makeNextQuestion(), 1800)
  }

  function handleTypeSubmit() {
    if (answered !== null || typeResult !== null) return
    const input = typeInput.trim().toLowerCase()
    const correct = question.correct.capital.toLowerCase()
    const isCorrect = input === correct || correct.includes(input) && input.length >= 3
    setTypeResult(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) { handleAnswer(question.correct) } else {
      setAnswered({ selected: null, correct: question.correct, isCorrect: false })
      clearTimeout(timerRef.current)
      setHistory(prev => [...prev, { question, selected: null, isCorrect: false }])
      streakRef.current = 0; setStreak(0)
      const nl = livesRef.current - 1; livesRef.current = nl; setLives(nl)
      if (nl <= 0) {
        setTimeout(async () => {
          stopSessionTimer()
          const correctCount = history.filter(h => h.isCorrect).length
          await saveBestScore(bestStreak); await saveStats(correctCount, bestStreak)
          setScreen(SCREEN.GAME_OVER)
        }, 1200); return
      }
      setTimeout(() => makeNextQuestion(), 2000)
    }
  }

  const C = { navy: '#0B1F3B', cream: '#F4F1E6', green: '#426A5A', red: '#C0392B', border: '#E2DDD5', muted: '#8A8278' }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (countriesLoading) return <PageLoader label={locale === 'fr' ? 'Chargement…' : 'Loading…'} />

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (screen === SCREEN.SETUP) return (
    <div style={{ backgroundColor: C.cream, height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>🏙️</div>
            <h1 style={{ margin: '0 0 3px', fontSize: '24px', fontWeight: '900', color: C.navy, letterSpacing: '-1px' }}>{t('Capital City', 'Capitale')}</h1>
            <p style={{ margin: 0, color: C.muted, fontSize: '13px' }}>{t('3 lives · infinite questions · beat your streak', '3 vies · questions infinies · bats ton record')}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '12px', marginBottom: '10px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('Question mode', 'Mode de question')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              {[
                { key: 'flag', icon: '🏳️', label: t('Flag → Capital', 'Drapeau → Capitale') },
                { key: 'capital-flag', icon: '🏙️', label: t('Capital → Flag', 'Capitale → Drapeau') },
                { key: 'name', icon: '🗺️', label: t('Country → Capital', 'Pays → Capitale') },
                { key: 'both', icon: '🔀', label: t('Mixed', 'Mixte') },
              ].map(m => (
                <button key={m.key} onClick={() => setQuestionMode(m.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', border: questionMode === m.key ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: questionMode === m.key ? C.navy : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: questionMode === m.key ? 'white' : C.navy, lineHeight: 1.3 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '12px', marginBottom: '10px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('Answer mode', 'Mode de réponse')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px' }}>
              {[
                { key: 'mcq', icon: '☑️', label: t('Multiple choice', 'Choix multiple') },
                { key: 'type', icon: '⌨️', label: t('Type', 'Taper') },
                { key: 'both', icon: '🔀', label: t('Mixed', 'Mixte') },
              ].map(m => (
                <button key={m.key} onClick={() => setAnswerMode(m.key)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 8px', borderRadius: '10px', border: answerMode === m.key ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: answerMode === m.key ? C.navy : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{m.icon}</span>
                  <span style={{ fontWeight: '700', fontSize: '11px', color: answerMode === m.key ? 'white' : C.navy, lineHeight: 1.3 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '12px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('Region (optional)', 'Région (optionnel)')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {REGIONS.map(r => {
                const active = regionFilter.includes(r.key)
                return (
                  <button key={r.key} onClick={() => setRegionFilter(prev => active ? prev.filter(x => x !== r.key) : [...prev, r.key])}
                    style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: active ? C.navy : 'white', color: active ? 'white' : C.navy, transition: 'all 0.15s' }}>
                    {locale === 'fr' ? r.fr : r.en}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: C.cream, borderTop: `1px solid ${C.border}` }}>
        <button onClick={startGame} style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: C.navy, color: 'white', fontSize: '16px', fontWeight: '900', border: 'none', cursor: 'pointer', letterSpacing: '-0.3px' }}>
          {t('Start Game', 'Lancer le jeu')}
        </button>
      </div>
    </div>
  )

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING && question) {
    const isAnswered = answered !== null
    const timerPct   = (timer / TIMER_SECONDS) * 100
    const timerColor = timer > 8 ? '#4ade80' : timer > 4 ? '#FEB12F' : '#f87171'
    const isCapitalFlag = question.qMode === 'capital-flag'
    const isCorrect  = answered?.isCorrect

    const answerArea = (
      <>
        {question.aMode === 'mcq' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {question.options.map((opt, i) => {
              const isCorrectOpt = opt.code === question.correct.code
              const isSelected = answered?.selected?.code === opt.code
              let bg = 'rgba(255,255,255,0.07)', border = '1.5px solid rgba(255,255,255,0.1)', color = 'white'
              if (isAnswered) {
                if (isCorrectOpt)    { bg = 'rgba(74,222,128,0.18)'; border = '2px solid #4ade80'; color = '#4ade80' }
                else if (isSelected) { bg = 'rgba(248,113,113,0.18)'; border = '2px solid #f87171'; color = '#f87171' }
                else                 { bg = 'rgba(255,255,255,0.03)'; color = 'rgba(255,255,255,0.25)' }
              }
              return (
                <button key={i} onClick={() => !isAnswered && handleAnswer(opt)} disabled={isAnswered}
                  style={{ padding: isCapitalFlag ? '10px' : '14px 12px', borderRadius: '14px', border, backgroundColor: bg, color, fontSize: '14px', fontWeight: '700', cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.3, WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
                  {isCapitalFlag ? (
                    <div>
                      <div style={{ width: '100%', aspectRatio: '3/2', overflow: 'hidden', borderRadius: '8px', marginBottom: isAnswered ? '8px' : '0', backgroundColor: '#1a2a40' }}>
                        <img src={`https://flagcdn.com/w320/${opt.code}.png`} alt={getName(opt)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                      </div>
                      {isAnswered && <div style={{ fontSize: '12px', fontWeight: '700', color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(opt)}</div>}
                    </div>
                  ) : opt.capital}
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input ref={inputRef} type="text" value={typeInput}
                onChange={e => setTypeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isAnswered && handleTypeSubmit()}
                placeholder={t('Type the capital city…', 'Tapez la capitale…')}
                disabled={isAnswered} autoFocus
                style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: `2px solid ${typeResult === 'correct' ? '#4ade80' : typeResult === 'wrong' ? '#f87171' : 'rgba(255,255,255,0.15)'}`, fontSize: '15px', outline: 'none', backgroundColor: typeResult === 'correct' ? 'rgba(74,222,128,0.1)' : typeResult === 'wrong' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: '600' }} />
              <button onClick={handleTypeSubmit} disabled={isAnswered || !typeInput.trim()}
                style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: '#9EB7E5', color: '#0B1F3B', border: 'none', fontSize: '14px', fontWeight: '800', cursor: isAnswered || !typeInput.trim() ? 'not-allowed' : 'pointer', opacity: isAnswered || !typeInput.trim() ? 0.5 : 1 }}>
                {t('Go', 'OK')}
              </button>
            </div>
            {isAnswered && !answered?.isCorrect && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', fontSize: '14px', color: '#f87171', fontWeight: '700' }}>
                {t('Correct answer: ', 'Bonne réponse : ')}<strong>{question.correct.capital}</strong>
              </div>
            )}
          </div>
        )}
        {isAnswered && answered.isCorrect && (
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#4ade80' }}>
            ✓ {t('Correct!', 'Correct !')} 🔥 {streakRef.current}
          </div>
        )}
      </>
    )

    // ── MOBILE ──────────────────────────────────────────────────────────────
    if (isMobile) {
      return (
        <div style={{ backgroundColor: '#0B1F3B', height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px 6px', gap: '8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : 'rgba(255,255,255,0.15)'}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            {streak > 0 && (
              <div style={{ backgroundColor: 'rgba(254,177,47,0.15)', border: '1px solid rgba(254,177,47,0.3)', borderRadius: '20px', padding: '3px 10px', fontSize: '13px', fontWeight: '800', color: '#FEB12F' }}>🔥 {streak}</div>
            )}
            <div style={{ position: 'relative' }}>
              <div style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '20px', padding: '3px 12px', fontSize: '14px', fontWeight: '900', color: '#4ade80' }}>
                {score.toLocaleString()}
              </div>
              {lastPoints && (
                <span style={{ position: 'absolute', top: '-20px', left: '50%', fontSize: '13px', fontWeight: '900', color: '#4ade80', animation: 'floatUpCC 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  +{lastPoints.pts}
                </span>
              )}
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '3px 12px', fontSize: '14px', fontWeight: '900', color: timerColor, minWidth: '44px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {timer}s
            </div>
            <button onClick={() => setShowQuitConfirm(true)} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>✕</button>
          </div>

          {/* Timer bar */}
          <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 14px' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, transition: 'width 1s linear, background-color 0.3s', borderRadius: '99px' }} />
          </div>

          {/* Question label */}
          <div style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {question.qMode === 'flag' ? t('What is the capital?', 'Quelle est la capitale ?')
                : question.qMode === 'capital-flag' ? t('Which flag?', 'Quel drapeau ?')
                : t('What is the capital of…', 'Quelle est la capitale de…')}
            </p>
          </div>

          {/* Stimulus with feedback overlay */}
          <div style={{ flex: '0 0 auto', padding: '0 14px 10px', flexShrink: 0 }}>
            {question.qMode === 'flag' ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#1a2a40', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isAnswered ? `0 0 0 3px ${isCorrect ? '#4ade80' : '#f87171'}, 0 4px 24px rgba(0,0,0,0.3)` : '0 4px 24px rgba(0,0,0,0.3)', transition: 'box-shadow 0.15s', animation: 'popInCC 0.2s ease' }}>
                <img src={`https://flagcdn.com/w640/${question.correct.code}.png`} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '16px' }} />
                {isAnswered && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: isCorrect ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'popInCC 0.15s ease' }}>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: '12px', padding: '8px 18px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: isCorrect ? '#4ade80' : '#f87171' }}>
                        {answered.selected === null ? t("Time's up!", 'Temps écoulé !') : isCorrect ? (streak > 1 ? `${t('Correct!', 'Correct !')} 🔥×${streak}` : t('Correct!', 'Correct !')) : `${t("It's", 'Réponse :')} ${question.correct.capital}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : question.qMode === 'capital-flag' ? (
              <div style={{ position: 'relative', width: '100%', padding: '20px 24px', backgroundColor: isAnswered ? (isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)') : 'rgba(255,255,255,0.06)', borderRadius: '16px', border: `1px solid ${isAnswered ? (isCorrect ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)') : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', animation: 'popInCC 0.2s ease' }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', textAlign: 'center' }}>{question.correct.capital}</span>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', padding: '20px 24px', backgroundColor: isAnswered ? (isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)') : 'rgba(255,255,255,0.06)', borderRadius: '16px', border: `1px solid ${isAnswered ? (isCorrect ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)') : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', animation: 'popInCC 0.2s ease' }}>
                <span style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', textAlign: 'center' }}>{getName(question.correct)}</span>
              </div>
            )}
          </div>

          {/* Answers */}
          <div style={{ flex: 1, padding: '0 14px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', overflowY: 'auto' }}>
            {answerArea}
          </div>

          {/* Quit confirm bottom sheet */}
          {showQuitConfirm && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
                <div style={{ width: '36px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '99px', margin: '0 auto 20px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#0B1F3B', textAlign: 'center' }}>
                  {t('Quit the game?', 'Quitter la partie ?')}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6, textAlign: 'center' }}>
                  {t(`Your score of ${score.toLocaleString()} pts will be saved.`, `Ton score de ${score.toLocaleString()} pts sera sauvegardé.`)}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setShowQuitConfirm(false); quitGame() }}
                    style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                    {t('Quit & save', 'Quitter et sauvegarder')}
                  </button>
                  <button onClick={() => setShowQuitConfirm(false)}
                    style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: '#0B1F3B', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    {t('Keep playing', 'Continuer à jouer')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // ── DESKTOP ──────────────────────────────────────────────────────────────
    const hud = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{locale === 'fr' ? 'Vies' : 'Lives'}</div>
          <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : 'rgba(255,255,255,0.15)'}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: streak > 0 ? 'rgba(254,177,47,0.15)' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: streak > 0 ? '1px solid rgba(254,177,47,0.3)' : 'none' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: streak > 0 ? 'rgba(254,177,47,0.7)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Streak</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: streak > 0 ? '#FEB12F' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>🔥 {streak}</div>
        </div>
        <div style={{ position: 'relative', backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(74,222,128,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Score</div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80', lineHeight: 1, whiteSpace: 'nowrap' }}>{score.toLocaleString()} pts</div>
          {lastPoints && (
            <span style={{ position: 'absolute', top: '-22px', left: '50%', fontSize: '14px', fontWeight: '900', color: '#4ade80', animation: 'floatUpCC 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none', backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: '99px', padding: '2px 8px' }}>
              +{lastPoints.pts} pts
            </span>
          )}
        </div>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>⏱</div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{formatTime(elapsed)}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowQuitConfirm(true)} onMouseEnter={() => setShowQuitTip(true)} onMouseLeave={() => setShowQuitTip(false)}
            style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🚪 {locale === 'fr' ? 'Quitter' : 'Quit'}
          </button>
          {showQuitTip && (
            <div style={{ position: 'absolute', bottom: '110%', right: 0, backgroundColor: '#1e293b', color: 'white', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {locale === 'fr' ? 'Sauvegarde ton score et quitte' : 'Saves your score and quits'}
            </div>
          )}
        </div>
      </div>
    )

    const timerBar = (
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, borderRadius: '99px', transition: 'width 1s linear, background-color 0.3s' }} />
      </div>
    )

    const stimulus = (
      <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', minHeight: '200px' }}>
        {question.qMode === 'flag' ? (
          <img src={`https://flagcdn.com/w640/${question.correct.code}.png`} alt="flag" style={{ maxWidth: '420px', width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'block' }} />
        ) : question.qMode === 'capital-flag' ? (
          <div style={{ fontSize: '34px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', textAlign: 'center' }}>{question.correct.capital}</div>
        ) : (
          <div style={{ fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '-1px', textAlign: 'center' }}>{getName(question.correct)}</div>
        )}
      </div>
    )

    return (
      <div style={{ backgroundColor: '#0B1F3B', minHeight: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body)', padding: '12px 24px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>🏙️ {t('Capital City', 'Capitale')}</h1>
            {hud}
          </div>
          {timerBar}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
            <div style={{ flex: '0 0 55%', minWidth: 0 }}>{stimulus}</div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {question.qMode === 'flag' ? t('What is the capital?', 'Quelle est la capitale ?') : question.qMode === 'capital-flag' ? t('Which flag?', 'Quel drapeau ?') : t('What is the capital of…', 'Quelle est la capitale de…')}
              </p>
              {answerArea}
            </div>
          </div>
        </div>

        {/* Desktop quit confirm modal */}
        {showQuitConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚪</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#0B1F3B' }}>
                {t('Quit the game?', 'Quitter la partie ?')}
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                {t(`Your score of ${score.toLocaleString()} pts will be saved.`, `Ton score de ${score.toLocaleString()} pts sera sauvegardé.`)}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowQuitConfirm(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#F4F1E6', color: '#0B1F3B', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {t('Keep playing', 'Continuer')}
                </button>
                <button onClick={() => { setShowQuitConfirm(false); quitGame() }} style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {t('Quit', 'Quitter')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (screen === SCREEN.GAME_OVER) {
    const total   = history.length
    const correct = history.filter(h => h.isCorrect).length
    const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
    const wrong   = history.filter(h => !h.isCorrect)

    return (
      <div style={{ backgroundColor: C.cream, height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Fixed: header + stats */}
        <div style={{ flexShrink: 0, padding: '20px 16px 0' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '900', color: C.navy, letterSpacing: '-0.5px' }}>{t('Game Over', 'Partie terminée')}</h2>
              <p style={{ margin: 0, color: C.muted, fontSize: '13px' }}>{total} {t('questions', 'questions')} · {formatTime(elapsed)}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: t('Correct', 'Corrects'),            value: `${correct}/${total}`,          color: C.green,   bg: '#f0fdf4', border: '#bbf7d0' },
                { label: t('Best streak', 'Meilleure série'), value: `🔥 ${bestStreak}`,             color: '#806D40', bg: '#fefce8', border: '#fde68a' },
                { label: t('Accuracy', 'Précision'),          value: `${pct}%`,                      color: C.navy,    bg: 'white',   border: '#e2e8f0' },
                { label: t('Score', 'Score'),                 value: `⭐ ${score.toLocaleString()}`, color: C.green,   bg: '#f0fdf4', border: '#bbf7d0' },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, borderRadius: '14px', border: `1px solid ${s.border}`, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable: missed only */}
        {wrong.length > 0 && (
          <div style={{ flex: 1, minHeight: 0, padding: '0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('Missed', 'Manqués')} ({wrong.length})
                </p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {wrong.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '10px', backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                      <img src={`https://flagcdn.com/w80/${h.question.correct.code}.png`} alt="" style={{ width: '40px', height: '27px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#e8e4d9', flexShrink: 0, padding: '2px', border: `1px solid ${C.border}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(h.question.correct)}</div>
                        <div style={{ fontSize: '11px', color: C.red, marginTop: '1px' }}>
                          {t('Capital:', 'Capitale :')} <strong>{h.question.correct.capital}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky buttons */}
        <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: C.cream, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={startGame} style={{ width: '100%', padding: '16px', backgroundColor: C.navy, color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {t('Play Again', 'Rejouer')}
          </button>
          <button onClick={() => setScreen(SCREEN.SETUP)} style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: C.navy, border: `1.5px solid ${C.border}`, borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            {t('Change settings', 'Modifier les réglages')}
          </button>
        </div>
      </div>
    )
  }

  return null
}
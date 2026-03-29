'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Data ────────────────────────────────────────────────────────────────────

// COUNTRIES loaded from Supabase — see useEffect below

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }
const MAX_LIVES = 3
const TIMER_SECONDS = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestion(pool, mode) {
  const shuffled = shuffle(pool)
  const correct = shuffled[0]
  const distractors = shuffle(shuffled.slice(1)).slice(0, 3)
  const options = shuffle([correct, ...distractors])
  return { correct, options, mode }
}

const SCREEN = { SETUP: 'setup', PLAYING: 'playing', GAME_OVER: 'gameover' }

export default function FlagQuiz() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen] = useState(SCREEN.SETUP)
  const [mode, setMode] = useState('name')
  const [regionFilter, setRegionFilter] = useState([])
  const [isMobile, setIsMobile] = useState(true)
  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [user, setUser] = useState(null)

  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [score,      setScore]      = useState(0)
  const [bestScore,  setBestScore]  = useState(0)
  const scoreRef   = useRef(0)
  const [elapsed,   setElapsed]   = useState(0)
  const [showQuitTip, setShowQuitTip] = useState(false)
  const sessionTimerRef = useRef(null)
  const sessionStartRef = useRef(null)
  const [lastPts, setLastPts] = useState(null)
  const [question, setQuestion] = useState(null)
  const [answered, setAnswered] = useState(null)
  const [history, setHistory] = useState([])
  const [timer, setTimer] = useState(TIMER_SECONDS)
  const [availableH, setAvailableH] = useState(600)
  const timerRef = useRef(null)
  const livesRef = useRef(MAX_LIVES)
  const streakRef = useRef(0)

  // ── Float-up animation CSS ──────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById('flagquiz-anim')) {
      const style = document.createElement('style')
      style.id = 'flagquiz-anim'
      style.textContent = '@keyframes floatUp { 0% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; transform:translateX(-50%) translateY(-28px); } }'
      document.head.appendChild(style)
    }
  }, [])

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function startSessionTimer() {
    clearInterval(sessionTimerRef.current)
    sessionStartRef.current = Date.now()
    sessionTimerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000))
    }, 1000)
  }

  function stopSessionTimer() {
    clearInterval(sessionTimerRef.current)
  }

  async function quitGame() {
    stopSessionTimer()
    await saveScore(scoreRef.current, bestStreak)
    await saveStats(
      history.filter(h => h.isCorrect).length,
      history.length,
      Math.max(bestStreak, streakRef.current)
    )
    setScreen(SCREEN.GAME_OVER)
  }

  async function saveStats(correct, total, bestStreakVal) {
    if (!user) return
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('player_stats').select('*').eq('user_id', user.id).eq('game', 'flag-quiz').single()
    if (existing) {
      await supabase.from('player_stats').update({
        game:           'flag-quiz',
        games_played:   (existing.games_played || 0) + 1,
        flags_found:    (existing.flags_found || 0) + correct,
        streak_best:    Math.max(existing.streak_best || 0, bestStreakVal),
        streak_current: 0,
        updated_at:     new Date().toISOString(),
      }).eq('user_id', user.id).eq('game', 'flag-quiz')
    } else {
      await supabase.from('player_stats').insert({
        user_id:        user.id,
        game:           'flag-quiz',
        games_played:   1,
        flags_found:    correct,
        streak_best:    bestStreakVal,
        streak_current: 0,
      })
    }
  }

  async function saveScore(finalScore, bestStreakVal) {
    if (!user || finalScore === 0) return
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('game_scores').select('best_streak, best_duration')
      .eq('user_id', user.id).eq('mode', 'flag_quiz').single()
    await supabase.from('game_scores').upsert({
      user_id:       user.id,
      mode:          'flag_quiz',
      best_streak:   Math.max(existing?.best_streak ?? 0, finalScore),
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,mode' })
  }

  // ── Load countries from Supabase ────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('Countries fetch timeout — unblocking game')
      setCountriesLoading(false)
    }, 8000)

    const supabase = createClient()
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr, region')
      .order('name_en')
      .then(({ data, error }) => {
        clearTimeout(timeout)
        if (error) console.error('Supabase error:', error.message)
        if (data) setCountries(data.map(c => ({ code: c.iso_code, en: c.name_en, fr: c.name_fr, region: c.region })))
        setCountriesLoading(false)
      })
      .catch(err => {
        clearTimeout(timeout)
        console.error('Countries fetch failed:', err)
        setCountriesLoading(false)
      })
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 640)
      const header = document.querySelector('header, nav[data-header], [data-site-header]')
      const headerH = header ? header.offsetHeight : 60
      setAvailableH(window.innerHeight - headerH)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  const getPool = useCallback(() => {
    const base = regionFilter.length > 0 ? countries.filter(c => regionFilter.includes(c.region)) : countries
    return base.length >= 4 ? base : countries
  }, [regionFilter, countries])

  const pickMode = useCallback(() => {
    if (mode === 'both') return Math.random() > 0.5 ? 'name' : 'flag'
    return mode
  }, [mode])

  const makeNextQuestion = useCallback(() => {
    const pool = getPool()
    const q = buildQuestion(pool, pickMode())
    setQuestion(q)
    setAnswered(null)
    setTimer(TIMER_SECONDS)
  }, [getPool, pickMode])

  function startGame() {
    livesRef.current = MAX_LIVES
    streakRef.current = 0
    scoreRef.current = 0
    setLives(MAX_LIVES)
    setStreak(0)
    setBestStreak(0)
    setScore(0)
    setBestScore(0)
    setElapsed(0)
    setLastPts(null)
    setHistory([])
    setScreen(SCREEN.PLAYING)
    startSessionTimer()
    const pool = getPool()
    const q = buildQuestion(pool, pickMode())
    setQuestion(q)
    setAnswered(null)
    setTimer(TIMER_SECONDS)
  }

  // Timer
  useEffect(() => {
    if (screen !== SCREEN.PLAYING || answered !== null || !question) return
    if (timer <= 0) { handleAnswer(null); return }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timer, screen, answered, question])

  function handleAnswer(selected) {
    clearTimeout(timerRef.current)
    const isCorrect = selected && selected.code === question.correct.code

    setAnswered({ selected, correct: question.correct })
    setHistory(prev => [...prev, { question, selected, isCorrect }])

    if (isCorrect) {
      const ns = streakRef.current + 1
      streakRef.current = ns
      setStreak(ns)
      setBestStreak(prev => Math.max(prev, ns))
      const pts = Math.round((POINTS_CORRECT + timer * POINTS_TIMER_BONUS) * STREAK_MULTIPLIER(ns))
      const newScore = scoreRef.current + pts
      scoreRef.current = newScore
      setScore(newScore)
      setBestScore(b => Math.max(b, newScore))
      setLastPts(pts)
      setTimeout(() => setLastPts(null), 1500)
    } else {
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setTimeout(async () => {
          stopSessionTimer()
          const correctCount = history.filter(h => h.isCorrect).length
          const finalStreak = Math.max(bestStreak, streakRef.current)
          await saveStats(correctCount, history.length + 1, finalStreak)
          await saveScore(scoreRef.current, finalStreak)
          setScreen(SCREEN.GAME_OVER)
        }, 1400)
        return
      }
    }
    // User clicks Next button to advance
  }

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (countriesLoading) {
    return (
      <div style={{ backgroundColor: '#0B1F3B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>❓</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (screen === SCREEN.SETUP) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body)", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>🎯</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px' }}>
              {t('Flag Quiz', 'Quiz Drapeaux')}
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
              {t('3 lives · infinite questions · beat your streak', '3 vies · questions infinies · bats ton record')}
            </p>
          </div>

          {/* Mode */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '14px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('Game mode', 'Mode de jeu')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'name', icon: '🏳️', label: t('Flag → Country', 'Drapeau → Pays'), desc: t('See a flag, find the country', 'Voir un drapeau, trouver le pays') },
                { key: 'flag', icon: '🗺️', label: t('Country → Flag', 'Pays → Drapeau'), desc: t('See a country name, find the flag', 'Voir un pays, trouver le drapeau') },
                { key: 'both', icon: '🔀', label: t('Mixed', 'Mixte'), desc: t('Both modes alternating randomly', 'Les deux modes en alternance') },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: mode === m.key ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: mode === m.key ? '#0B1F3B' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: mode === m.key ? 'white' : '#0B1F3B' }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: mode === m.key ? 'rgba(255,255,255,0.6)' : '#94a3b8', marginTop: '1px' }}>{m.desc}</div>
                  </div>
                  {mode === m.key && (
                    <svg style={{ flexShrink: 0 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="#9EB7E5"/>
                      <polyline points="3.5,8 6.5,11 12.5,5" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('Region', 'Région')}
              </p>
              {regionFilter.length > 0 && (
                <button onClick={() => setRegionFilter([])} style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                  {t('All', 'Tout')}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {REGIONS.map(r => {
                const active = regionFilter.includes(r)
                return (
                  <button key={r} onClick={() => setRegionFilter(prev => active ? prev.filter(x => x !== r) : [...prev, r])}
                    style={{ padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : '#fafafa', color: active ? 'white' : '#475569', transition: 'all 0.15s' }}>
                    {t(r, REGION_LABELS[r])}
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={startGame}
            style={{ width: '100%', padding: '16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {t('Start Quiz', 'Lancer le quiz')} →
          </button>
        </div>
      </div>
    )
  }

  // ─── PLAYING SCREEN ────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING && question) {
    const { correct, options, mode: qMode } = question
    const isAnswered = answered !== null
    const timerPct = (timer / TIMER_SECONDS) * 100
    const timerColor = timer > 6 ? '#4ade80' : timer > 3 ? '#FEB12F' : '#f87171'
    const isCorrectAnswer = answered?.selected?.code === correct.code

    // ── Shared answer options ─────────────────────────────────────────────────
    const renderOptions = () => qMode === 'name' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((opt, idx) => {
          const isCorrectOpt = opt.code === correct.code
          const isSelected = answered?.selected?.code === opt.code
          let bg = 'rgba(255,255,255,0.08)', borderColor = 'rgba(255,255,255,0.12)', color = 'white', opacity = 1
          if (isAnswered) {
            if (isCorrectOpt)       { bg = 'rgba(74,222,128,0.15)'; borderColor = '#4ade80'; color = '#4ade80' }
            else if (isSelected)    { bg = 'rgba(248,113,113,0.15)'; borderColor = '#f87171'; color = '#f87171' }
            else                    { opacity = 0.35 }
          }
          return (
            <button key={opt.code} onClick={() => !isAnswered && handleAnswer(opt)} disabled={isAnswered}
              style={{ padding: '12px 14px', borderRadius: '12px', border: `2px solid ${borderColor}`, backgroundColor: bg, color, fontWeight: '700', fontSize: '15px', cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', opacity, transition: 'all 0.10s', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', userSelect: 'none' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', backgroundColor: isAnswered && isCorrectOpt ? '#4ade80' : isAnswered && isSelected ? '#f87171' : 'rgba(255,255,255,0.15)', color: isAnswered && (isCorrectOpt || isSelected) ? '#0B1F3B' : 'white' }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ flex: 1 }}>{getName(opt)}</span>
              {isAnswered && isCorrectOpt && <span>✓</span>}
              {isAnswered && isSelected && !isCorrectOpt && <span>✗</span>}
            </button>
          )
        })}
      </div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {options.map(opt => {
          const isCorrectOpt = opt.code === correct.code
          const isSelected = answered?.selected?.code === opt.code
          let borderColor = 'rgba(255,255,255,0.12)', borderWidth = '2px', overlayBg = 'transparent'
          if (isAnswered) {
            if (isCorrectOpt)    { borderColor = '#4ade80'; borderWidth = '3px' }
            else if (isSelected) { borderColor = '#f87171'; borderWidth = '3px' }
            else                 { overlayBg = 'rgba(11,31,59,0.6)' }
          }
          return (
            <button key={opt.code} onClick={() => !isAnswered && handleAnswer(opt)} disabled={isAnswered}
              style={{ position: 'relative', aspectRatio: '3/2', borderRadius: '12px', border: `${borderWidth} solid ${borderColor}`, overflow: 'hidden', cursor: isAnswered ? 'default' : 'pointer', padding: 0, backgroundColor: '#1a2a40', transition: 'all 0.10s', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
              <img src={`https://flagcdn.com/w320/${opt.code}.png`} alt={getName(opt)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }} />
              {isAnswered && overlayBg !== 'transparent' && <div style={{ position: 'absolute', inset: 0, backgroundColor: overlayBg }} />}
              {isAnswered && (isCorrectOpt || isSelected) && (
                <div style={{ position: 'absolute', top: '7px', right: '7px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: isCorrectOpt ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#0B1F3B', fontSize: '12px', fontWeight: '900' }}>{isCorrectOpt ? '✓' : '✗'}</span>
                </div>
              )}
              {/* Show name only after answered */}
              {isAnswered && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 7px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: isCorrectOpt ? '#4ade80' : isSelected ? '#f87171' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{getName(opt)}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    )

    // ── HUD ───────────────────────────────────────────────────────────────────
    const hud = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Lives */}
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
        {/* Per-question timer */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{locale === 'fr' ? 'Temps' : 'Time'}</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: timerColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{timer}s</div>
        </div>
        {/* Session clock */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>⏱</div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{formatTime(elapsed)}</div>
        </div>
        {/* Streak */}
        <div style={{ backgroundColor: streak > 0 ? 'rgba(254,177,47,0.15)' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: streak > 0 ? '1px solid rgba(254,177,47,0.3)' : 'none' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: streak > 0 ? 'rgba(254,177,47,0.7)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Streak</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: streak > 0 ? '#FEB12F' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>🔥 {streak}</div>
        </div>
        {/* Score */}
        <div style={{ position: 'relative', backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(74,222,128,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Score</div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80', lineHeight: 1, whiteSpace: 'nowrap' }}>{score.toLocaleString()} pts</div>
          {lastPts && (
            <span style={{ position: 'absolute', top: '-22px', left: '50%', fontSize: '14px', fontWeight: '900', color: '#4ade80', animation: 'floatUp 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none', backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: '99px', padding: '2px 8px' }}>
              +{lastPts} pts
            </span>
          )}
        </div>
        {/* Quit button — in HUD to avoid misclicks near answers */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={quitGame}
            onMouseEnter={() => setShowQuitTip(true)}
            onMouseLeave={() => setShowQuitTip(false)}
            style={{ padding: '8px 12px', backgroundColor: 'transparent', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🚪
          </button>
          {showQuitTip && (
            <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: '#1e293b', color: 'white', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {locale === 'fr' ? 'Quitter et sauvegarder' : 'Quit and save score'}
              <div style={{ position: 'absolute', top: '-5px', right: '12px', width: '10px', height: '10px', backgroundColor: '#1e293b', transform: 'rotate(45deg)' }} />
            </div>
          )}
        </div>
      </div>
    )

    // ── Timer bar ─────────────────────────────────────────────────────────────
    const timerBar = (
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, transition: 'width 1s linear, background-color 0.3s', borderRadius: '99px' }} />
      </div>
    )

    // ── Feedback ──────────────────────────────────────────────────────────────
    const feedback = isAnswered && (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: isCorrectAnswer ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${isCorrectAnswer ? '#4ade80' : '#f87171'}`, textAlign: 'center', marginBottom: '10px' }}>
          {answered.selected === null ? (
            <span style={{ fontWeight: '800', fontSize: '13px', color: '#f87171' }}>⏱ {t("Time's up!", 'Temps écoulé !')} — {getName(correct)}</span>
          ) : isCorrectAnswer ? (
            <span style={{ fontWeight: '800', fontSize: '13px', color: '#4ade80' }}>✓ {t('Correct!', 'Correct !')} {streak > 1 ? `🔥 ×${streak}` : ''}</span>
          ) : (
            <span style={{ fontWeight: '800', fontSize: '13px', color: '#f87171' }}>✗ {t('It was', "C'était")} {getName(correct)}</span>
          )}
        </div>
        <button onClick={makeNextQuestion}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: isCorrectAnswer ? '#4ade80' : '#9EB7E5', color: '#0B1F3B', border: 'none', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
          {t('Next →', 'Suivant →')}
        </button>
      </div>
    )

    // ── Question label ────────────────────────────────────────────────────────
    const questionLabel = (
      <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {qMode === 'name' ? t('Which country?', 'Quel pays ?') : t('Which flag?', 'Quel drapeau ?')}
      </p>
    )

    if (isMobile) {
      return (
        <div style={{ backgroundColor: '#0B1F3B', minHeight: '100dvh', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', padding: '16px 14px 24px' }}>
          {hud}
          {timerBar}
          {/* Stimulus */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {qMode === 'name' ? (
              <div style={{ width: '100%', maxWidth: '340px', aspectRatio: '3/2', backgroundColor: '#1a2a40', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <img src={`https://flagcdn.com/w640/${correct.code}.png`} alt="?" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
            ) : (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{getName(correct)}</span>
              </div>
            )}
          </div>
          {feedback}
          {questionLabel}
          {renderOptions()}
        </div>
      )
    }

    // ── DESKTOP ───────────────────────────────────────────────────────────────
    return (
      <div style={{ backgroundColor: '#0B1F3B', minHeight: '100vh', fontFamily: 'var(--font-body)', padding: '24px 24px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Title + HUD */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>
              ❓ {t('Flag Quiz', 'Quiz Drapeaux')}
            </h1>
            {hud}
          </div>
          {timerBar}

          {/* Main: flag left, answers right */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Left: flag or country name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {qMode === 'name' ? (
                <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: '#1a2a40', borderRadius: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <img src={`https://flagcdn.com/w640/${correct.code}.png`} alt="?" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: '#1a2a40', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '48px', fontWeight: '900', color: 'white', letterSpacing: '-1px', textAlign: 'center', padding: '0 24px' }}>{getName(correct)}</span>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ width: '320px', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {questionLabel}
              {feedback}
              {renderOptions()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── GAME OVER SCREEN ──────────────────────────────────────────────────────
  if (screen === SCREEN.GAME_OVER) {
    const total = history.length
    const correct = history.filter(h => h.isCorrect).length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const wrong = history.filter(h => !h.isCorrect)

    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body)", padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '💪'}</div>
            <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '900', color: '#0B1F3B' }}>
              {t('Game Over', 'Partie terminée')}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {total} {t('questions', 'questions')}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: t('Correct', 'Corrects'),             value: correct,                          color: '#426A5A', bg: '#f0fdf4' },
              { label: t('Best streak', 'Meilleure série'),  value: `🔥 ${bestStreak}`,               color: '#806D40', bg: '#fefce8' },
              { label: t('Score', 'Score'),                  value: `${pct}%`,                        color: '#0B1F3B', bg: 'white' },
              { label: t('Total Points', 'Points totaux'),   value: `⭐ ${bestScore.toLocaleString()}`, color: '#166534', bg: '#f0fdf4' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: s.bg, borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Wrong answers */}
          {wrong.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('Missed', 'Manqués')} ({wrong.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wrong.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                    <img src={`https://flagcdn.com/w80/${h.question.correct.code}.png`} alt=""
                      style={{ width: '44px', height: '30px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#e8e4d9', flexShrink: 0, padding: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{getName(h.question.correct)}</div>
                      <div style={{ fontSize: '11px', color: h.selected ? '#dc2626' : '#f59e0b', marginTop: '1px' }}>
                        {h.selected ? `${t('You said:', 'Ta réponse :')} ${getName(h.selected)}` : `⏱ ${t('No answer', 'Temps écoulé')}`}
                      </div>
                    </div>
                  </div>
                ))}
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
              {t('Change settings', 'Modifier les réglages')}
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}
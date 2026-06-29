'use client'

import { useState, useEffect, useRef } from 'react'
import GameIcon from '@/components/games/GameIcon'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'

const MAX_LIVES    = 3
const TIMER_SECS   = 15
const POINTS_BASE  = 1000

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function calcPoints(timeLeft) {
  return Math.round(POINTS_BASE * (timeLeft / TIMER_SECS))
}

export default function FlagClue() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen]           = useState('intro')
  const [mode, setMode]               = useState(null)
  const [pendingMode, setPendingMode] = useState('clue2flag')
  const [countries, setCountries]     = useState([])
  const [facts, setFacts]             = useState({})
  const [loading, setLoading]         = useState(true)
  const [isMobile, setIsMobile]       = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const [score, setScore]           = useState(0)
  const [lives, setLives]           = useState(MAX_LIVES)
  const [streak, setStreak]         = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [question, setQuestion]     = useState(null)
  const [answered, setAnswered]     = useState(null)
  const [timer, setTimer]           = useState(TIMER_SECS)
  const [lastPts, setLastPts]       = useState(null)
  const [history, setHistory]       = useState([])
  const timerRef  = useRef(null)
  const livesRef  = useRef(MAX_LIVES)
  const scoreRef  = useRef(0)
  const streakRef = useRef(0)

  useEffect(() => {
    if (!document.getElementById('flagclue-anim')) {
      const style = document.createElement('style')
      style.id = 'flagclue-anim'
      style.textContent = '@keyframes fadeUpFC { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-20px)} } @keyframes popInFC { 0%{transform:scale(0.92);opacity:0} 100%{transform:scale(1);opacity:1} }'
      document.head.appendChild(style)
    }
    const update = () => setIsMobile(window.innerWidth < 640)
    update(); window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('countries').select('iso_code, name_en, name_fr, region').order('name_en'),
      supabase.from('country_facts').select('country_code, fact_en, fact_fr, category'),
    ]).then(([{ data: c }, { data: f }]) => {
      if (c) setCountries(c)
      if (f) {
        const idx = {}
        for (const fact of f) {
          if (!idx[fact.country_code]) idx[fact.country_code] = []
          idx[fact.country_code].push(fact)
        }
        setFacts(idx)
      }
      setLoading(false)
    })
  }, [])

  function startGame(m) {
    setMode(m); setScore(0); scoreRef.current = 0
    setLives(MAX_LIVES); livesRef.current = MAX_LIVES
    setStreak(0); streakRef.current = 0
    setBestStreak(0); setHistory([])
    nextQuestion(m); setScreen('playing')
  }

  function nextQuestion(m) {
    setAnswered(null); setLastPts(null); clearInterval(timerRef.current)
    const eligible = countries.filter(c => facts[c.iso_code]?.length >= 4)
    if (eligible.length < 4) return
    const shuffled = shuffle(eligible)
    const correct  = shuffled[0]
    const correctFacts = shuffle(facts[correct.iso_code] || [])
    let q
    if (m === 'clue2flag') {
      const fact = correctFacts[0]
      const distractors = shuffle(shuffled.slice(1)).slice(0, 3)
      const options = shuffle([correct, ...distractors])
      q = { type: 'clue2flag', fact, correct, options }
    } else {
      const wrongCountries = shuffle(shuffled.slice(1)).slice(0, 3)
      const correctFact  = correctFacts[0]
      const wrongFacts   = wrongCountries.map(wc => { const wf = facts[wc.iso_code]; return wf ? shuffle(wf)[0] : null }).filter(Boolean)
      const options = shuffle([correctFact, ...wrongFacts])
      q = { type: 'flag2clue', correct, correctFact, options }
    }
    setQuestion(q); setTimer(TIMER_SECS)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function handleTimeout() {
    if (answered) return
    setAnswered('timeout')
    const newLives = livesRef.current - 1; livesRef.current = newLives; setLives(newLives)
    streakRef.current = 0; setStreak(0)
    if (newLives <= 0) { setTimeout(() => setScreen('gameover'), 1800) }
    else { setTimeout(() => nextQuestion(mode), 2200) }
  }

  function handleAnswer(chosen) {
    if (answered) return
    clearInterval(timerRef.current)
    const isCorrect = question.type === 'clue2flag'
      ? chosen.iso_code === question.correct.iso_code
      : chosen === question.correctFact
    if (isCorrect) {
      const pts = calcPoints(timer)
      scoreRef.current += pts; streakRef.current += 1
      setScore(scoreRef.current); setStreak(streakRef.current)
      setBestStreak(prev => Math.max(prev, streakRef.current))
      setLastPts(pts); setAnswered('correct')
      setHistory(h => [...h, { correct: true, country: question.correct, pts }])
      setTimeout(() => nextQuestion(mode), 1800)
    } else {
      livesRef.current -= 1; streakRef.current = 0
      setLives(livesRef.current); setStreak(0); setLastPts(0); setAnswered('wrong')
      setHistory(h => [...h, { correct: false, country: question.correct, pts: 0 }])
      if (livesRef.current <= 0) { logScore(scoreRef.current); setTimeout(() => setScreen('gameover'), 1800) }
      else { setTimeout(() => nextQuestion(mode), 2200) }
    }
  }

  async function logScore(s) {
    if (!s || s <= 0) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({ user_id: user.id, game: 'flag-clue', score: s, played_at: new Date().toISOString() })
    } catch (e) { console.error('logScore error:', e) }
  }

  async function quitGame() {
    clearInterval(timerRef.current)
    await logScore(scoreRef.current)
    setScreen('gameover')
  }

  const getName = (c) => locale === 'fr' ? c.name_fr : c.name_en

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    const MODES = [
      { id: 'clue2flag', icon: '💡', en: 'Clue → Country', fr: 'Anecdote → Pays', color: '#8b5cf6',
        descEn: 'Read a fact. Guess the country — flag stays hidden until you answer!',
        descFr: "Lisez une anecdote. Devinez le pays — le drapeau reste masqué jusqu'à votre réponse !" },
      { id: 'flag2clue', icon: '🏳️', en: 'Country → Clue', fr: 'Pays → Anecdote', color: '#0ea5e9',
        descEn: 'See a country name and flag. Which of the 4 facts is true?',
        descFr: "Voyez un nom de pays et son drapeau. Quelle anecdote est vraie ?" },
    ]
    return (
      <div style={{ backgroundColor: '#F4F1E6', height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body, system-ui)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 8px' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            {loading ? (
              <PageLoader inline label={t('Loading facts…', 'Chargement des anecdotes…')} />
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '44px', marginBottom: '8px' }}>🔍</div>
                  <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#16324F', margin: '0 0 6px', letterSpacing: '-1px' }}>FlagClue</h1>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                    {t('Test your knowledge of flags and countries through fun facts!', 'Testez vos connaissances sur les drapeaux et pays grâce à des anecdotes !')}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => setPendingMode(m.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '14px', border: `2px solid ${pendingMode === m.id ? m.color : '#E2DDD5'}`, backgroundColor: pendingMode === m.id ? `${m.color}15` : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '26px' }}>{m.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#16324F' }}>{locale === 'fr' ? m.fr : m.en}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', lineHeight: 1.4 }}>{locale === 'fr' ? m.descFr : m.descEn}</div>
                        </div>
                      </div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: pendingMode === m.id ? m.color : '#E2DDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', flexShrink: 0 }}>▶</div>
                    </button>
                  ))}
                </div>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2DDD5', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{t('Rules', 'Règles')}</div>
                  {[
                    { icon: '⏱️', en: `${TIMER_SECS}s per question — faster = more points`, fr: `${TIMER_SECS}s par question — plus rapide = plus de points` },
                    { icon: '❤️', en: `${MAX_LIVES} lives — wrong answer or timeout costs 1`, fr: `${MAX_LIVES} vies — mauvaise réponse ou timeout = −1 vie` },
                    { icon: '🔥', en: 'Build streaks for bonus points', fr: 'Enchaînez les bonnes réponses pour des bonus' },
                    { icon: '🙈', en: 'Clue mode: no flag shown until you answer!', fr: "Mode anecdote : drapeau masqué jusqu'à votre réponse !" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280', padding: '3px 0' }}>
                      <span>{r.icon}</span><span>{locale === 'fr' ? r.fr : r.en}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {!loading && (
          <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: '#F4F1E6', borderTop: '1px solid #E2DDD5' }}>
            <button onClick={() => startGame(pendingMode)} style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: '#16324F', color: 'white', fontSize: '16px', fontWeight: '900', border: 'none', cursor: 'pointer', letterSpacing: '-0.3px' }}>
              {t('Start Game', 'Lancer le jeu')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (screen === 'gameover') {
    const correctCount = history.filter(h => h.correct).length
    const total   = history.length
    const pct     = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const wrong   = history.filter(h => !h.correct)

    return (
      <div style={{ backgroundColor: '#F4F1E6', height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body, system-ui)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Fixed: header + stats */}
        <div style={{ flexShrink: 0, padding: '20px 16px 0' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '900', color: '#16324F', letterSpacing: '-0.5px' }}>{t('Game Over!', 'Partie terminée !')}</h2>
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: '13px' }}>{total} {t('questions', 'questions')}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: t('Correct', 'Correctes'), value: `${correctCount}/${total}`, color: '#426A5A', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: t('Accuracy', 'Précision'), value: `${pct}%`,                color: '#16324F', bg: 'white',   border: '#E2DDD5' },
                { label: t('Best streak', 'Meilleure série'), value: `🔥${bestStreak}`, color: '#806D40', bg: '#fefce8', border: '#fde68a' },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, borderRadius: '14px', border: `1px solid ${s.border}`, padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0', padding: '14px 12px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#166534', letterSpacing: '-1px' }}>{score.toLocaleString()}</div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>pts</div>
            </div>
          </div>
        </div>

        {/* Scrollable: history */}
        {wrong.length > 0 && (
          <div style={{ flex: 1, minHeight: 0, padding: '0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #E2DDD5', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('Missed', 'Manqués')} ({wrong.length})
                </p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {wrong.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 8px', borderRadius: '10px', backgroundColor: i % 2 === 0 ? '#FAFAF7' : 'white' }}>
                      <img src={`https://flagcdn.com/w40/${h.country.iso_code}.png`} style={{ height: '20px', borderRadius: '3px', border: '1px solid #E2DDD5' }} alt="" />
                      <span style={{ fontSize: '13px', color: '#16324F', fontWeight: '700', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {locale === 'fr' ? h.country.name_fr : h.country.name_en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky buttons */}
        <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: '#F4F1E6', borderTop: '1px solid #E2DDD5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => startGame(mode)} style={{ width: '100%', padding: '16px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {t('Play Again', 'Rejouer')}
          </button>
          <button onClick={() => setScreen('intro')} style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: '#16324F', border: '1.5px solid #cbd5e1', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            {t('Change mode', 'Changer de mode')}
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (!question) return null

  const isClueMode = mode === 'clue2flag'
  const timerPct   = (timer / TIMER_SECS) * 100
  const timerColor = timerPct > 60 ? '#22c55e' : timerPct > 30 ? '#f59e0b' : '#ef4444'
  const isAnsweredCorrect = answered === 'correct'

  const optionsEl = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {question.options.map((opt, i) => {
        const isThis = isClueMode ? opt.iso_code === question.correct.iso_code : opt === question.correctFact
        let bg = answered ? (isThis ? '#f0fdf4' : 'white') : 'white'
        let border = answered ? (isThis ? '#22c55e' : '#E2DDD5') : '#E2DDD5'
        let color  = answered ? (isThis ? '#15803d' : '#9CA3AF') : '#16324F'
        if (isMobile) {
          bg = answered ? (isThis ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.04)') : 'rgba(255,255,255,0.07)'
          border = answered ? (isThis ? '#4ade80' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.1)'
          color  = answered ? (isThis ? '#4ade80' : 'rgba(255,255,255,0.3)') : 'white'
        }
        return (
          <button key={i} onClick={() => handleAnswer(opt)} disabled={!!answered}
            style={{ padding: '12px 16px', borderRadius: '12px', border: `2px solid ${border}`, backgroundColor: bg, color, fontSize: isClueMode ? '14px' : '13px', fontWeight: '700', cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', lineHeight: 1.5, WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
            {isClueMode
              ? <span>{locale === 'fr' ? opt.name_fr : opt.name_en}</span>
              : <span>"{locale === 'fr' ? opt.fact_fr : opt.fact_en}"</span>}
          </button>
        )
      })}
    </div>
  )

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ backgroundColor: '#16324F', height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body, system-ui)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px 6px', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <GameIcon key={i} name="heart" filled size={17} color="#D62828" style={{ opacity: i < lives ? 1 : 0.25 }} />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {streak >= 2 && (
            <div style={{ backgroundColor: 'rgba(254,177,47,0.15)', border: '1px solid rgba(254,177,47,0.3)', borderRadius: '20px', padding: '3px 10px', fontSize: '13px', fontWeight: '800', color: '#F4B400' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><GameIcon name="flame" filled size={13} />×{streak}</span></div>
          )}
          <div style={{ position: 'relative' }}>
            <div style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '20px', padding: '3px 12px', fontSize: '14px', fontWeight: '900', color: '#4ade80' }}>
              {score.toLocaleString()}
            </div>
            {lastPts !== null && answered === 'correct' && (
              <span style={{ position: 'absolute', top: '-20px', left: '50%', fontSize: '13px', fontWeight: '900', color: '#22c55e', animation: 'fadeUpFC 1s ease forwards', whiteSpace: 'nowrap', pointerEvents: 'none' }}>+{lastPts}</span>
            )}
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '3px 12px', fontSize: '14px', fontWeight: '900', color: timerColor, minWidth: '44px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{timer}s</div>
            <button onClick={() => setShowQuitConfirm(true)} aria-label="Quitter" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><GameIcon name="close" size={17} color="rgba(255,255,255,0.7)" /></button>
        </div>

        {/* Timer bar */}
        <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 14px' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, transition: 'width 1s linear, background-color 0.3s', borderRadius: '99px' }} />
        </div>

        {/* Question card */}
        <div style={{ flex: '0 0 auto', padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ position: 'relative', backgroundColor: answered ? (isAnsweredCorrect ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)') : 'rgba(255,255,255,0.06)', borderRadius: '16px', border: `1px solid ${answered ? (isAnsweredCorrect ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') : 'rgba(255,255,255,0.08)'}`, padding: '16px', transition: 'all 0.15s', animation: 'popInFC 0.2s ease' }}>
            {isClueMode ? (
              <>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  💡 {t('Which country?', 'Quel pays ?')}
                </div>
                <div style={{ fontSize: '15px', color: 'white', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid #8b5cf6', paddingLeft: '12px' }}>
                  "{locale === 'fr' ? question.fact.fact_fr : question.fact.fact_en}"
                </div>
                {answered && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={`https://flagcdn.com/w160/${question.correct.iso_code}.png`} alt="" style={{ height: '36px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: isAnsweredCorrect ? '#4ade80' : '#f87171' }}>
                        {locale === 'fr' ? question.correct.name_fr : question.correct.name_en}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>
                        {answered === 'correct' ? t('Correct!', 'Correct !') : answered === 'timeout' ? t("Time's up!", 'Temps écoulé !') : t('Wrong answer', 'Mauvaise réponse')}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  🏳️ {t('Which fact is true?', 'Quelle anecdote est vraie ?')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={`https://flagcdn.com/w160/${question.correct.iso_code}.png`} alt="" style={{ height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                  <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                    {locale === 'fr' ? question.correct.name_fr : question.correct.name_en}
                  </div>
                </div>
              </>
            )}
            <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '12px', fontWeight: '700', color: timerColor }}>{timer}s</div>
          </div>
        </div>

        {/* Options */}
        <div style={{ flex: 1, padding: '0 14px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', overflowY: 'auto' }}>
          {optionsEl}
          {answered === 'timeout' && (
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>
              ⏱️ {t('Too slow!', 'Trop lent !')}
            </div>
          )}
        </div>

        {/* Mobile quit confirm bottom sheet */}
        {showQuitConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              <div style={{ width: '36px', height: '4px', backgroundColor: '#E2DDD5', borderRadius: '99px', margin: '0 auto 20px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#16324F', textAlign: 'center' }}>
                {t('Quit the game?', 'Quitter la partie ?')}
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280', lineHeight: 1.6, textAlign: 'center' }}>
                {t(`Your score of ${score.toLocaleString()} pts will be saved.`, `Ton score de ${score.toLocaleString()} pts sera sauvegardé.`)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => { setShowQuitConfirm(false); quitGame() }}
                  style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                  {t('Quit & save', 'Quitter et sauvegarder')}
                </button>
                <button onClick={() => setShowQuitConfirm(false)}
                  style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: '#16324F', border: '1.5px solid #E2DDD5', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {t('Keep playing', 'Continuer à jouer')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body, system-ui)', paddingTop: '28px', paddingBottom: '48px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <GameIcon key={i} name="heart" filled size={19} color="#D62828" style={{ opacity: i < lives ? 1 : 0.25 }} />
            ))}
          </div>
          <div style={{ backgroundColor: '#16324F', borderRadius: '10px', padding: '6px 14px' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{score.toLocaleString()}</div>
          </div>
          {streak >= 2 && (
            <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: '700', color: '#EA580C' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><GameIcon name="flame" filled size={13} />×{streak}</span></div>
          )}
        </div>
        <div style={{ height: '5px', backgroundColor: '#E2DDD5', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, borderRadius: '3px', transition: 'width 1s linear, background-color 0.3s' }} />
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2DDD5', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {isClueMode ? (
            <>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                💡 {t('Which country does this describe?', 'Quel pays cela décrit-il ?')}
              </div>
              <div style={{ fontSize: '16px', color: '#16324F', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid #8b5cf6', paddingLeft: '14px' }}>
                "{locale === 'fr' ? question.fact.fact_fr : question.fact.fact_en}"
              </div>
              {answered && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: answered === 'correct' ? '#f0fdf4' : '#fef2f2', borderRadius: '10px', border: `1px solid ${answered === 'correct' ? '#bbf7d0' : '#fecaca'}` }}>
                  <img src={`https://flagcdn.com/w160/${question.correct.iso_code}.png`} alt="" style={{ height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#16324F' }}>{locale === 'fr' ? question.correct.name_fr : question.correct.name_en}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {answered === 'correct' ? t('✅ Correct!', '✅ Correct !') : answered === 'timeout' ? t("⏱️ Time's up!", '⏱️ Temps écoulé !') : t("❌ That was the answer", "❌ C'était la bonne réponse")}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                🏳️ {t('Which fact is true about this country?', 'Quelle anecdote est vraie sur ce pays ?')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={`https://flagcdn.com/w160/${question.correct.iso_code}.png`} alt="" style={{ height: '52px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #E2DDD5', flexShrink: 0 }} />
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#16324F' }}>{locale === 'fr' ? question.correct.name_fr : question.correct.name_en}</div>
              </div>
            </>
          )}
          <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '13px', fontWeight: '700', color: timerColor }}>{timer}s</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((opt, i) => {
            const isThis = isClueMode ? opt.iso_code === question.correct.iso_code : opt === question.correctFact
            let bg = 'white', border = '#E2DDD5', color = '#16324F'
            if (answered) {
              if (isThis) { bg = '#f0fdf4'; border = '#22c55e'; color = '#15803d' }
              else { bg = 'white'; border = '#E2DDD5'; color = '#9CA3AF' }
            }
            return (
              <button key={i} onClick={() => handleAnswer(opt)} disabled={!!answered}
                style={{ padding: '12px 16px', borderRadius: '12px', border: `2px solid ${border}`, backgroundColor: bg, color, fontSize: isClueMode ? '14px' : '13px', fontWeight: '700', cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', lineHeight: 1.5 }}>
                {isClueMode ? <span>{locale === 'fr' ? opt.name_fr : opt.name_en}</span> : <span>"{locale === 'fr' ? opt.fact_fr : opt.fact_en}"</span>}
              </button>
            )
          })}
        </div>
        {lastPts !== null && answered === 'correct' && (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '20px', fontWeight: '900', color: '#22c55e', animation: 'fadeUpFC 1s ease forwards' }}>+{lastPts} pts</div>
        )}
        {answered === 'timeout' && (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>⏱️ {t('Too slow!', 'Trop lent !')}</div>
        )}
      </div>

      {/* Desktop quit confirm modal */}
      {showQuitConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚪</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#16324F' }}>
              {t('Quit the game?', 'Quitter la partie ?')}
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
              {t(`Your score of ${score.toLocaleString()} pts will be saved.`, `Ton score de ${score.toLocaleString()} pts sera sauvegardé.`)}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowQuitConfirm(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#F4F1E6', color: '#16324F', border: '1px solid #E2DDD5', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
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
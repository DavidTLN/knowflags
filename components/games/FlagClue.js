'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

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

  const [screen, setScreen]       = useState('intro')  // intro | playing | gameover
  const [mode, setMode]           = useState(null)     // 'clue2flag' | 'flag2clue'
  const [countries, setCountries] = useState([])
  const [facts, setFacts]         = useState([])        // all facts indexed by code
  const [loading, setLoading]     = useState(true)

  // Game state
  const [score, setScore]         = useState(0)
  const [lives, setLives]         = useState(MAX_LIVES)
  const [streak, setStreak]       = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [question, setQuestion]   = useState(null)
  const [answered, setAnswered]   = useState(null)     // null | 'correct' | 'wrong'
  const [timer, setTimer]         = useState(TIMER_SECS)
  const [lastPts, setLastPts]     = useState(null)
  const [history, setHistory]     = useState([])
  const timerRef  = useRef(null)
  const livesRef  = useRef(MAX_LIVES)
  const scoreRef  = useRef(0)
  const streakRef = useRef(0)

  // Load data
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('countries').select('iso_code, name_en, name_fr, region').order('name_en'),
      supabase.from('country_facts').select('country_code, fact_en, fact_fr, category'),
    ]).then(([{ data: c }, { data: f }]) => {
      if (c) setCountries(c)
      if (f) {
        // Index facts by country code
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
    setMode(m)
    setScore(0); scoreRef.current = 0
    setLives(MAX_LIVES); livesRef.current = MAX_LIVES
    setStreak(0); streakRef.current = 0
    setBestStreak(0)
    setHistory([])
    nextQuestion(m)
    setScreen('playing')
  }

  function nextQuestion(m) {
    setAnswered(null)
    setLastPts(null)
    clearInterval(timerRef.current)

    // Pick a country that has facts
    const eligible = countries.filter(c => facts[c.iso_code]?.length >= 4)
    if (eligible.length < 4) return

    const shuffled = shuffle(eligible)
    const correct  = shuffled[0]
    const correctFacts = shuffle(facts[correct.iso_code] || [])

    let q
    if (m === 'clue2flag') {
      // Show 1 fact → choose correct country from 4
      const fact = correctFacts[0]
      const distractors = shuffle(shuffled.slice(1)).slice(0, 3)
      const options = shuffle([correct, ...distractors])
      q = { type: 'clue2flag', fact, correct, options }
    } else {
      // Show country name → choose correct fact from 4
      // Distractors: facts from 3 other countries
      const wrongCountries = shuffle(shuffled.slice(1)).slice(0, 3)
      const correctFact  = correctFacts[0]
      const wrongFacts   = wrongCountries.map(wc => {
        const wf = facts[wc.iso_code]
        return wf ? shuffle(wf)[0] : null
      }).filter(Boolean)
      const options = shuffle([correctFact, ...wrongFacts])
      q = { type: 'flag2clue', correct, correctFact, options }
    }

    setQuestion(q)
    setTimer(TIMER_SECS)

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleTimeout() {
    if (answered) return
    setAnswered('timeout')
    const newLives = livesRef.current - 1
    livesRef.current = newLives
    setLives(newLives)
    streakRef.current = 0
    setStreak(0)
    if (newLives <= 0) {
      setTimeout(() => setScreen('gameover'), 1800)
    } else {
      setTimeout(() => nextQuestion(mode), 2000)
    }
  }

  function handleAnswer(chosen) {
    if (answered) return
    clearInterval(timerRef.current)

    const isCorrect = question.type === 'clue2flag'
      ? chosen.iso_code === question.correct.iso_code
      : chosen === question.correctFact

    if (isCorrect) {
      const pts = calcPoints(timer)
      const newScore  = scoreRef.current + pts
      const newStreak = streakRef.current + 1
      scoreRef.current  = newScore
      streakRef.current = newStreak
      setScore(newScore)
      setStreak(newStreak)
      setBestStreak(prev => Math.max(prev, newStreak))
      setLastPts(pts)
      setAnswered('correct')
      setHistory(h => [...h, { correct: true, country: question.correct, pts }])
      setTimeout(() => nextQuestion(mode), 1800)
    } else {
      const newLives = livesRef.current - 1
      livesRef.current = newLives
      streakRef.current = 0
      setLives(newLives)
      setStreak(0)
      setLastPts(0)
      setAnswered('wrong')
      setHistory(h => [...h, { correct: false, country: question.correct, pts: 0 }])
      if (newLives <= 0) {
        setTimeout(() => setScreen('gameover'), 1800)
      } else {
        setTimeout(() => nextQuestion(mode), 2000)
      }
    }
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (screen === 'intro') return (
    <div style={S.page}>
      <div style={S.card}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '15px', color: '#64748b' }}>{t('Loading facts...', 'Chargement des anecdotes...')}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <h1 style={S.title}>FlagClue</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              {t('Test your knowledge of flags and countries through fun facts!', 'Testez vos connaissances sur les drapeaux et pays grâce à des anecdotes !')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {[
                { id: 'clue2flag', icon: '💡', en: 'Clue → Country', fr: 'Anecdote → Pays',
                  descEn: 'Read a fun fact about a flag or country. Find which country it refers to.',
                  descFr: 'Lisez une anecdote sur un drapeau ou pays. Trouvez de quel pays il s\'agit.' },
                { id: 'flag2clue', icon: '🏳️', en: 'Country → Clue', fr: 'Pays → Anecdote',
                  descEn: 'See a country name and flag. Choose which of the 4 facts is actually true.',
                  descFr: 'Voyez un nom de pays et son drapeau. Choisissez laquelle des 4 anecdotes est vraie.' },
              ].map(m => (
                <button key={m.id} onClick={() => startGame(m.id)}
                  style={{ ...S.modeBtn, borderColor: m.id === 'clue2flag' ? '#8b5cf6' : '#0ea5e9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '26px' }}>{m.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0B1F3B' }}>{locale === 'fr' ? m.fr : m.en}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{locale === 'fr' ? m.descFr : m.descEn}</div>
                    </div>
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: m.id === 'clue2flag' ? '#8b5cf6' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', flexShrink: 0 }}>▶</div>
                </button>
              ))}
            </div>

            {/* Rules */}
            <div style={S.rulesBox}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                {t('Rules', 'Règles')}
              </div>
              {[
                { icon: '⏱️', en: `${TIMER_SECS}s per question — faster = more points`, fr: `${TIMER_SECS}s par question — plus rapide = plus de points` },
                { icon: '❤️', en: `${MAX_LIVES} lives — wrong answer or timeout costs 1`, fr: `${MAX_LIVES} vies — mauvaise réponse ou timeout = −1 vie` },
                { icon: '🔥', en: 'Build streaks for bonus points', fr: 'Enchaînez les bonnes réponses pour des bonus' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', padding: '3px 0' }}>
                  <span>{r.icon}</span><span>{locale === 'fr' ? r.fr : r.en}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (screen === 'gameover') {
    const correct = history.filter(h => h.correct).length
    const total   = history.length
    const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
    const grade   = pct >= 90 ? '🏆' : pct >= 70 ? '🥇' : pct >= 50 ? '🥈' : pct >= 30 ? '🥉' : '🎯'
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>{grade}</div>
          <h1 style={S.title}>{t('Game Over!', 'Partie terminée !')}</h1>
          <div style={{ fontSize: '52px', fontWeight: '900', color: '#0B1F3B', margin: '16px 0 4px', letterSpacing: '-2px' }}>{score.toLocaleString()}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>pts</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '28px' }}>
            {[
              { label: t('Correct', 'Correctes'), value: `${correct}/${total}` },
              { label: t('Accuracy', 'Précision'), value: `${pct}%` },
              { label: t('Best streak', 'Meilleure série'), value: `🔥${bestStreak}` },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#F8F7F4', borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3B' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Last answers */}
          <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[...history].reverse().slice(0, 8).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', backgroundColor: h.correct ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${h.correct ? '#bbf7d0' : '#fecaca'}` }}>
                <span style={{ fontSize: '14px' }}>{h.correct ? '✅' : '❌'}</span>
                <img src={`https://flagcdn.com/w40/${h.country.iso_code}.png`} style={{ height: '14px', borderRadius: '2px' }} alt="" />
                <span style={{ fontSize: '12px', color: '#0B1F3B', fontWeight: '600', flex: 1 }}>
                  {locale === 'fr' ? h.country.name_fr : h.country.name_en}
                </span>
                {h.correct && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>+{h.pts}</span>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setScreen('intro')} style={S.btnSec}>{t('Change mode', 'Changer de mode')}</button>
            <button onClick={() => startGame(mode)} style={S.btn}>{t('Play again', 'Rejouer')}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (!question) return null

  const isCorrectMode = mode === 'clue2flag'
  const timerPct = (timer / TIMER_SECS) * 100
  const timerColor = timerPct > 60 ? '#22c55e' : timerPct > 30 ? '#f59e0b' : '#ef4444'

  return (
    <div style={S.page}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>

        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
          {/* Lives */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span key={i} style={{ fontSize: '20px', opacity: i < lives ? 1 : 0.25 }}>❤️</span>
            ))}
          </div>
          {/* Score */}
          <div style={{ backgroundColor: '#0B1F3B', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{score.toLocaleString()}</div>
          </div>
          {/* Streak */}
          {streak >= 2 && (
            <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: '700', color: '#EA580C' }}>
              🔥 ×{streak}
            </div>
          )}
        </div>

        {/* Timer bar */}
        <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, borderRadius: '3px', transition: 'width 1s linear, background-color 0.3s' }} />
        </div>

        {/* Question card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {isCorrectMode ? (
            /* Clue → Flag: show the fact */
            <>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                💡 {t('Which country does this describe?', 'Quel pays cela décrit-il ?')}
              </div>
              <div style={{ fontSize: '16px', color: '#0B1F3B', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid #8b5cf6', paddingLeft: '14px' }}>
                "{locale === 'fr' ? question.fact.fact_fr : question.fact.fact_en}"
              </div>
            </>
          ) : (
            /* Flag → Clue: show country flag + name */
            <>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                🏳️ {t('Which fact is true about this country?', 'Quelle anecdote est vraie sur ce pays ?')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={`https://flagcdn.com/w160/${question.correct.iso_code}.png`}
                  alt={question.correct.name_en}
                  style={{ height: '52px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }}
                />
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0B1F3B' }}>
                  {locale === 'fr' ? question.correct.name_fr : question.correct.name_en}
                </div>
              </div>
            </>
          )}

          {/* Timer digit */}
          <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '13px', fontWeight: '700', color: timerColor }}>
            {timer}s
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((opt, i) => {
            let bg = 'white', border = '#e2e8f0', color = '#0B1F3B', shadow = '0 1px 4px rgba(0,0,0,0.05)'

            if (answered) {
              const isThis = isCorrectMode
                ? opt.iso_code === question.correct.iso_code
                : opt === question.correctFact
              const wasChosen = isCorrectMode
                ? (answered !== 'timeout' && opt.iso_code === question.correct.iso_code && answered === 'correct')
                : (answered !== 'timeout' && opt === question.correctFact && answered === 'correct')

              if (isThis) { bg = '#f0fdf4'; border = '#22c55e'; color = '#15803d' }
              else if (answered === 'wrong' && (
                isCorrectMode ? opt.iso_code !== question.correct.iso_code : opt !== question.correctFact
              )) { bg = '#fef2f2'; border = '#ef4444'; color = '#dc2626' }
            }

            return (
              <button key={i} onClick={() => handleAnswer(opt)}
                disabled={!!answered}
                style={{ padding: '12px 16px', borderRadius: '12px', border: `2px solid ${border}`, backgroundColor: bg, color, fontSize: isCorrectMode ? '14px' : '13px', fontWeight: '700', cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: shadow, lineHeight: 1.5 }}>
                {isCorrectMode ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={`https://flagcdn.com/w40/${opt.iso_code}.png`} style={{ height: '20px', borderRadius: '2px', flexShrink: 0 }} alt="" />
                    {locale === 'fr' ? opt.name_fr : opt.name_en}
                  </div>
                ) : (
                  <span>"{locale === 'fr' ? opt.fact_fr : opt.fact_en}"</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Points float */}
        {lastPts !== null && answered === 'correct' && (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '20px', fontWeight: '900', color: '#22c55e', animation: 'fadeUp 1s ease forwards' }}>
            +{lastPts} pts
          </div>
        )}
        {answered === 'timeout' && (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>
            ⏱️ {t('Too slow!', 'Trop lent !')}
          </div>
        )}

        {/* After answer: show flag reveal */}
        {answered && (
          <div style={{ marginTop: '16px', backgroundColor: '#F8F7F4', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={`https://flagcdn.com/w160/${question.correct.iso_code}.png`}
              style={{ height: '44px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }} alt="" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0B1F3B' }}>
                {locale === 'fr' ? question.correct.name_fr : question.correct.name_en}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {answered === 'correct'
                  ? t('✅ Correct!', '✅ Correct !')
                  : t('❌ Wrong — here is the flag', '❌ Faux — voici le drapeau')}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-20px)} }`}</style>
    </div>
  )
}

const S = {
  page:    { minHeight: '100vh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body, system-ui)', paddingTop: '28px', paddingBottom: '48px' },
  card:    { maxWidth: '480px', margin: '0 auto', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '36px 32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' },
  title:   { fontSize: '28px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 8px', letterSpacing: '-1px' },
  modeBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '14px', border: '2px solid', backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.15s' },
  rulesBox:{ backgroundColor: '#F8F7F4', borderRadius: '12px', padding: '14px 16px', textAlign: 'left', marginTop: '4px' },
  btn:     { backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  btnSec:  { backgroundColor: 'white', color: '#0B1F3B', border: '2px solid #0B1F3B', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
}
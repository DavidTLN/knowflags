'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'

const TOTAL_ROUNDS = 10
const TIME_PER_ROUND = 20

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PastFlagGame() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [phase, setPhase]           = useState('intro')    // intro | playing | result | gameover
  const [questions, setQuestions]   = useState([])
  const [current, setCurrent]       = useState(0)
  const [selected, setSelected]     = useState(null)
  const [score, setScore]           = useState(0)
  const [streak, setStreak]         = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft]     = useState(TIME_PER_ROUND)
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [imgError, setImgError]     = useState(false)

  // Load questions from country_flag_history
  useEffect(() => {
    const supabase = createClient()
    // Get historical flags (not current ones = date_end is not null)
    supabase
      .from('country_flag_history')
      .select('id, iso_code, image_url, date_start, date_end, label_en, label_fr')
      .not('date_end', 'is', null)
      .order('id')
      .then(async ({ data: histData }) => {
        if (!histData || histData.length < 4) { setLoading(false); return }

        // Get country names
        const { data: countries } = await supabase
          .from('countries')
          .select('iso_code, name_en, name_fr')

        if (!countries) { setLoading(false); return }

        const countryMap = {}
        countries.forEach(c => { countryMap[c.iso_code] = c })

        // Filter to entries that have a country and an image or local path
        const valid = histData.filter(h => countryMap[h.iso_code])
        if (valid.length < 4) { setLoading(false); return }

        const allIsoCodes = [...new Set(valid.map(h => h.iso_code))]

        // Build questions
        const pool = shuffle(valid).slice(0, TOTAL_ROUNDS)
        const qs = pool.map(flag => {
          const correct = countryMap[flag.iso_code]
          // 3 wrong answers from other countries
          const others = shuffle(allIsoCodes.filter(c => c !== flag.iso_code)).slice(0, 3)
          const wrongChoices = others.map(iso => countryMap[iso]).filter(Boolean)
          const choices = shuffle([correct, ...wrongChoices])
          return { flag, correct, choices }
        })

        setQuestions(qs)
        setLoading(false)
      })
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      handleAnswer(null)
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft, current])

  function startGame() {
    setCurrent(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setResults([])
    setSelected(null)
    setImgError(false)
    setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  function handleAnswer(choice) {
    if (selected !== null) return
    const q = questions[current]
    const correct = choice?.iso_code === q.correct.iso_code
    const newStreak = correct ? streak + 1 : 0
    const newBest   = Math.max(bestStreak, newStreak)
    const points    = correct ? (10 + Math.floor(timeLeft / 2)) : 0

    setSelected(choice)
    setStreak(newStreak)
    setBestStreak(newBest)
    if (correct) setScore(s => s + points)
    setResults(r => [...r, { q, choice, correct, points }])
    setPhase('result')
  }

  function nextQuestion() {
    const next = current + 1
    if (next >= questions.length) {
      setPhase('gameover')
      saveScore()
    } else {
      setCurrent(next)
      setSelected(null)
      setImgError(false)
      setTimeLeft(TIME_PER_ROUND)
      setPhase('playing')
    }
  }

  async function saveScore() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores').insert({
        user_id: user.id,
        game: 'past-flag',
        score,
        details: { streak: bestStreak, rounds: TOTAL_ROUNDS }
      })
    } catch {}
  }

  function getImageSrc(flag) {
    if (flag.image_url) return flag.image_url
    const year = flag.date_start ? new Date(flag.date_start).getFullYear() : '?'
    return `/flags/history/${flag.iso_code}-${year}.png`
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6' }}>
      <p style={{ color: '#0B1F3B', fontSize: '18px', fontWeight: '700' }}>{t('Loading flags…', 'Chargement des drapeaux…')}</p>
    </div>
  )

  if (questions.length < 4) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: '#0B1F3B', fontSize: '18px', fontWeight: '700', textAlign: 'center', padding: '0 24px' }}>
        {t('Not enough historical flag data yet.', 'Pas encore assez de données historiques.')}
      </p>
      <Link href={`/${locale}/games`} style={{ color: '#4a7fd4', fontWeight: '700' }}>{t('← Back to games', '← Retour aux jeux')}</Link>
    </div>
  )

  // ── INTRO ──
  if (phase === 'intro') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏳️</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 12px' }}>Past Flag</h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
          {t(
            'A historical flag appears. Which country did it belong to?',
            'Un drapeau historique apparaît. À quel pays appartenait-il ?'
          )}
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⏱</span>
            <span style={{ fontSize: '14px', color: '#475569' }}>{t(`${TIME_PER_ROUND}s per flag`, `${TIME_PER_ROUND}s par drapeau`)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <span style={{ fontSize: '14px', color: '#475569' }}>{t(`${TOTAL_ROUNDS} rounds`, `${TOTAL_ROUNDS} manches`)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ fontSize: '14px', color: '#475569' }}>{t('Bonus points for fast answers', 'Points bonus pour réponses rapides')}</span>
          </div>
        </div>
        <button onClick={startGame} style={{ width: '100%', padding: '16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}>
          {t('Start', 'Commencer')}
        </button>
      </div>
    </div>
  )

  // ── GAMEOVER ──
  if (phase === 'gameover') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{score >= 100 ? '🏆' : score >= 60 ? '🥈' : '🎖️'}</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 8px' }}>{t('Game Over!', 'Partie terminée !')}</h1>
        <p style={{ fontSize: '48px', fontWeight: '900', color: '#4a7fd4', margin: '16px 0' }}>{score} pts</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0B1F3B' }}>{results.filter(r => r.correct).length}/{TOTAL_ROUNDS}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{t('Correct', 'Corrects')}</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0B1F3B' }}>{bestStreak}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{t('Best streak', 'Meilleure série')}</div>
          </div>
        </div>

        {/* Results recap */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
          {results.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < results.length - 1 ? '1px solid #f0ede4' : 'none' }}>
              <span style={{ fontSize: '16px' }}>{r.correct ? '✅' : '❌'}</span>
              <img src={getImageSrc(r.q.flag)} alt="" style={{ width: '32px', height: '22px', objectFit: 'contain', borderRadius: '3px', border: '1px solid #e2e8f0' }} onError={e => e.target.style.display = 'none'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>
                  {locale === 'fr' ? r.q.correct.name_fr : r.q.correct.name_en}
                </div>
                {!r.correct && r.choice && (
                  <div style={{ fontSize: '11px', color: '#ef4444' }}>
                    {t('You said: ', 'Votre réponse : ')}{locale === 'fr' ? r.choice.name_fr : r.choice.name_en}
                  </div>
                )}
              </div>
              {r.correct && <span style={{ fontSize: '12px', fontWeight: '700', color: '#22c55e' }}>+{r.points}</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={startGame} style={{ flex: 1, padding: '14px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
            {t('Play again', 'Rejouer')}
          </button>
          <Link href={`/${locale}/games`} style={{ flex: 1, padding: '14px', backgroundColor: 'white', color: '#0B1F3B', border: '2px solid #0B1F3B', borderRadius: '12px', fontSize: '16px', fontWeight: '800', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t('Games', 'Jeux')}
          </Link>
        </div>
      </div>
    </div>
  )

  // ── PLAYING / RESULT ──
  const q = questions[current]
  const progress = (current / questions.length) * 100

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#0B1F3B', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>← {t('Games', 'Jeux')}</Link>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>Past Flag</span>
        <span style={{ color: '#9EB7E5', fontWeight: '700', fontSize: '16px' }}>{score} pts</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', backgroundColor: '#e2e8f0' }}>
        <div style={{ height: '100%', backgroundColor: '#4a7fd4', width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '24px' }}>

        {/* Question counter + timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '480px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{current + 1} / {questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {streak >= 3 && <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '99px' }}>🔥 x{streak}</span>}
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: `3px solid ${timeLeft <= 5 ? '#ef4444' : '#4a7fd4'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '16px',
              color: timeLeft <= 5 ? '#ef4444' : '#0B1F3B',
              transition: 'all 0.3s',
            }}>
              {phase === 'playing' ? timeLeft : '–'}
            </div>
          </div>
        </div>

        {/* Flag card */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '600' }}>
            {t('Which country used this flag?', 'Quel pays utilisait ce drapeau ?')}
          </p>
          {!imgError ? (
            <img
              src={getImageSrc(q.flag)}
              alt="Historical flag"
              onError={() => setImgError(true)}
              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div style={{ height: '150px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>🏳️</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {q.flag.date_start ? new Date(q.flag.date_start).getFullYear() : '?'}
                {q.flag.date_end ? ` – ${new Date(q.flag.date_end).getFullYear()}` : ''}
              </span>
            </div>
          )}
          {phase === 'result' && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f8f5ed', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                {locale === 'fr' ? q.flag.label_fr : q.flag.label_en}
                {q.flag.date_start && ` · ${new Date(q.flag.date_start).getFullYear()}${q.flag.date_end ? `–${new Date(q.flag.date_end).getFullYear()}` : ''}`}
              </p>
            </div>
          )}
        </div>

        {/* Choices */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '480px' }}>
          {q.choices.map((choice) => {
            const isCorrect   = choice.iso_code === q.correct.iso_code
            const isSelected  = selected?.iso_code === choice.iso_code
            const revealed    = phase === 'result'
            let bg = 'white', border = '#e2e8f0', color = '#0B1F3B'
            if (revealed) {
              if (isCorrect)        { bg = '#dcfce7'; border = '#22c55e'; color = '#166534' }
              else if (isSelected)  { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b' }
            }
            return (
              <button
                key={choice.iso_code}
                onClick={() => phase === 'playing' && handleAnswer(choice)}
                disabled={phase !== 'playing'}
                style={{
                  padding: '14px 16px', borderRadius: '12px', border: `2px solid ${border}`,
                  backgroundColor: bg, color, fontWeight: '700', fontSize: '14px',
                  cursor: phase === 'playing' ? 'pointer' : 'default',
                  transition: 'all 0.2s', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
              >
                <img
                  src={`https://flagcdn.com/w40/${choice.iso_code}.png`}
                  alt=""
                  style={{ width: '28px', height: '20px', objectFit: 'contain', borderRadius: '2px', flexShrink: 0 }}
                  onError={e => e.target.style.display = 'none'}
                />
                {locale === 'fr' ? choice.name_fr : choice.name_en}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        {phase === 'result' && (
          <button
            onClick={nextQuestion}
            style={{ width: '100%', maxWidth: '480px', padding: '16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}
          >
            {current + 1 >= questions.length ? t('See results', 'Voir les résultats') : t('Next →', 'Suivant →')}
          </button>
        )}
      </div>
    </div>
  )
}
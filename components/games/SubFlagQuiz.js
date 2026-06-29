'use client'

import { useState, useEffect } from 'react'
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

export default function SubFlagQuiz() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [phase, setPhase]         = useState('intro')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [selected, setSelected]   = useState(null)
  const [score, setScore]         = useState(0)
  const [streak, setStreak]       = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft]   = useState(TIME_PER_ROUND)
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('subnational_flags').select('*').limit(200),
      supabase.from('countries').select('iso_code, name_en, name_fr'),
    ]).then(([{ data: subFlags }, { data: countries }]) => {
      if (!subFlags || subFlags.length < 4 || !countries) {
        setLoading(false)
        return
      }

      const countryMap = {}
      countries.forEach(c => { countryMap[c.iso_code] = c })

      const valid = subFlags.filter(f => countryMap[f.country_code] && f.image_url)
      if (valid.length < 4) { setLoading(false); return }

      const allCountryCodes = [...new Set(valid.map(f => f.country_code))]
      const pool = shuffle(valid).slice(0, TOTAL_ROUNDS)

      const qs = pool.map(flag => {
        const correct = countryMap[flag.country_code]
        const others  = shuffle(allCountryCodes.filter(c => c !== flag.country_code)).slice(0, 3)
        const wrongChoices = others.map(iso => countryMap[iso]).filter(Boolean)
        const choices = shuffle([correct, ...wrongChoices])
        return { flag, correct, choices }
      })

      setQuestions(qs)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { handleAnswer(null); return }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft, current])

  function startGame() {
    setCurrent(0); setScore(0); setStreak(0); setBestStreak(0)
    setResults([]); setSelected(null); setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  function handleAnswer(choice) {
    if (selected !== null) return
    const q = questions[current]
    const correct     = choice?.iso_code === q.correct.iso_code
    const newStreak   = correct ? streak + 1 : 0
    const newBest     = Math.max(bestStreak, newStreak)
    const points      = correct ? (10 + Math.floor(timeLeft / 2)) : 0
    setSelected(choice); setStreak(newStreak); setBestStreak(newBest)
    if (correct) setScore(s => s + points)
    setResults(r => [...r, { q, choice, correct, points }])
    setPhase('result')
  }

  function nextQuestion() {
    const next = current + 1
    if (next >= questions.length) { setPhase('gameover'); saveScore() }
    else { setCurrent(next); setSelected(null); setTimeLeft(TIME_PER_ROUND); setPhase('playing') }
  }

  async function saveScore() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({
        user_id: user.id, game: 'subflag-quiz', score, played_at: new Date().toISOString(),
      })
      await supabase.from('game_scores').insert({
        user_id: user.id, game: 'subflag-quiz', score,
        details: { streak: bestStreak, rounds: TOTAL_ROUNDS }
      })
    } catch {}
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6' }}>
      <p style={{ color: '#16324F', fontSize: '18px', fontWeight: '700' }}>{t('Loading…', 'Chargement…')}</p>
    </div>
  )

  if (questions.length < 4) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
      <span style={{ fontSize: '48px' }}>🗺️</span>
      <p style={{ color: '#16324F', fontSize: '18px', fontWeight: '700' }}>
        {t('Not enough subnational flag data yet.', 'Pas encore assez de drapeaux infranationaux.')}
      </p>
      <p style={{ color: '#6B7280', fontSize: '14px' }}>
        {t('This game needs data in the subnational_flags table.', 'Ce jeu nécessite des données dans la table subnational_flags.')}
      </p>
      <Link href={`/${locale}/games`} style={{ color: '#4a7fd4', fontWeight: '700' }}>← {t('Back to games', 'Retour aux jeux')}</Link>
    </div>
  )

  if (phase === 'intro') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#16324F', margin: '0 0 12px' }}>SubFlag Quiz</h1>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          {t('You see a regional or city flag. Find which country it belongs to!', 'Vous voyez un drapeau régional ou de ville. Trouvez à quel pays il appartient !')}
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⏱</span>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>{t(`${TIME_PER_ROUND}s per flag`, `${TIME_PER_ROUND}s par drapeau`)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>{t(`${TOTAL_ROUNDS} rounds`, `${TOTAL_ROUNDS} manches`)}</span>
          </div>
        </div>
        <button onClick={startGame} style={{ width: '100%', padding: '16px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}>
          {t('Start', 'Commencer')}
        </button>
      </div>
    </div>
  )

  if (phase === 'gameover') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{score >= 100 ? '🏆' : '🎖️'}</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#16324F', margin: '0 0 8px' }}>{t('Game Over!', 'Partie terminée !')}</h1>
        <p style={{ fontSize: '48px', fontWeight: '900', color: '#4a7fd4', margin: '16px 0' }}>{score} pts</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16324F' }}>{results.filter(r => r.correct).length}/{TOTAL_ROUNDS}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{t('Correct', 'Corrects')}</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16324F' }}>{bestStreak}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{t('Best streak', 'Meilleure série')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={startGame} style={{ flex: 1, padding: '14px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
            {t('Play again', 'Rejouer')}
          </button>
          <Link href={`/${locale}/games`} style={{ flex: 1, padding: '14px', backgroundColor: 'white', color: '#16324F', border: '2px solid #16324F', borderRadius: '12px', fontSize: '16px', fontWeight: '800', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t('Games', 'Jeux')}
          </Link>
        </div>
      </div>
    </div>
  )

  const q = questions[current]
  const progress = (current / questions.length) * 100

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#16324F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>← {t('Games', 'Jeux')}</Link>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>SubFlag Quiz</span>
        <span style={{ color: '#9EB7E5', fontWeight: '700', fontSize: '16px' }}>{score} pts</span>
      </div>
      <div style={{ height: '4px', backgroundColor: '#E2DDD5' }}>
        <div style={{ height: '100%', backgroundColor: '#4a7fd4', width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '480px' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>{current + 1} / {questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {streak >= 3 && <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '99px' }}>🔥 x{streak}</span>}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${timeLeft <= 5 ? '#ef4444' : '#4a7fd4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px', color: timeLeft <= 5 ? '#ef4444' : '#16324F' }}>
              {phase === 'playing' ? timeLeft : '–'}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px', fontWeight: '600' }}>
            {t('Which country is this regional flag from?', 'De quel pays vient ce drapeau régional ?')}
          </p>
          {q.flag.region_name_en && (
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '16px' }}>
              {locale === 'fr' ? (q.flag.region_name_fr || q.flag.region_name_en) : q.flag.region_name_en}
            </p>
          )}
          <img
            src={q.flag.image_url}
            alt="Regional flag"
            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
            onError={e => { e.target.src = `https://flagcdn.com/w320/${q.flag.country_code}.png` }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '480px' }}>
          {q.choices.map((choice) => {
            const isCorrect  = choice.iso_code === q.correct.iso_code
            const isSelected = selected?.iso_code === choice.iso_code
            const revealed   = phase === 'result'
            let bg = 'white', border = '#E2DDD5', color = '#16324F'
            if (revealed) {
              if (isCorrect)       { bg = '#dcfce7'; border = '#22c55e'; color = '#166534' }
              else if (isSelected) { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b' }
            }
            return (
              <button key={choice.iso_code} onClick={() => phase === 'playing' && handleAnswer(choice)} disabled={phase !== 'playing'}
                style={{ padding: '14px 16px', borderRadius: '12px', border: `2px solid ${border}`, backgroundColor: bg, color, fontWeight: '700', fontSize: '14px', cursor: phase === 'playing' ? 'pointer' : 'default', transition: 'all 0.2s', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={`https://flagcdn.com/w40/${choice.iso_code}.png`} alt="" style={{ width: '28px', height: '20px', objectFit: 'contain', borderRadius: '2px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                {locale === 'fr' ? choice.name_fr : choice.name_en}
              </button>
            )
          })}
        </div>

        {phase === 'result' && (
          <button onClick={nextQuestion} style={{ width: '100%', maxWidth: '480px', padding: '16px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
            {current + 1 >= questions.length ? t('See results', 'Voir les résultats') : t('Next →', 'Suivant →')}
          </button>
        )}
      </div>
    </div>
  )
}
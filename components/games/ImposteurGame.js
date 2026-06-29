'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'

// Solo version: shown 4 flags, 3 are from the same continent/color group, 1 is the impostor.
// Player must find which one doesn't belong.

const TOTAL_ROUNDS = 10
const TIME_PER_ROUND = 15

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Generate a round: pick a category (color or region), 3 that match, 1 that doesn't
function buildRound(countries, locale) {
  const strategies = ['color', 'region', 'symbol']
  const strategy   = strategies[Math.floor(Math.random() * strategies.length)]

  if (strategy === 'region') {
    const regions   = [...new Set(countries.map(c => c.region).filter(Boolean))]
    const region    = regions[Math.floor(Math.random() * regions.length)]
    const matching  = shuffle(countries.filter(c => c.region === region))
    const different = shuffle(countries.filter(c => c.region !== region))
    if (matching.length < 3 || different.length < 1) return null
    const group    = matching.slice(0, 3)
    const impostor = different[0]
    const flags    = shuffle([...group, impostor])
    return {
      category: locale === 'fr' ? `Région : ${region}` : `Region: ${region}`,
      hint: locale === 'fr' ? `3 pays partagent la même région. Lequel est l'imposteur ?` : `3 countries share the same region. Which one is the impostor?`,
      flags,
      impostor,
      group,
    }
  }

  if (strategy === 'color') {
    const colors    = ['red', 'blue', 'green', 'yellow', 'white', 'black']
    const color     = colors[Math.floor(Math.random() * colors.length)]
    const matching  = shuffle(countries.filter(c => Array.isArray(c.colors) && c.colors.includes(color)))
    const different = shuffle(countries.filter(c => !Array.isArray(c.colors) || !c.colors.includes(color)))
    if (matching.length < 3 || different.length < 1) return null
    const group    = matching.slice(0, 3)
    const impostor = different[0]
    const flags    = shuffle([...group, impostor])
    return {
      category: locale === 'fr' ? `Couleur : ${color}` : `Color: ${color}`,
      hint: locale === 'fr' ? `3 drapeaux ont la couleur ${color}. Lequel est l'imposteur ?` : `3 flags contain the color ${color}. Which one is the impostor?`,
      flags,
      impostor,
      group,
    }
  }

  if (strategy === 'symbol') {
    const symbols   = ['Star', 'Cross', 'Crescent', 'Eagle', 'Sun']
    const symbol    = symbols[Math.floor(Math.random() * symbols.length)]
    const matching  = shuffle(countries.filter(c => Array.isArray(c.symbols) && c.symbols.map(s => s.toLowerCase()).includes(symbol.toLowerCase())))
    const different = shuffle(countries.filter(c => !Array.isArray(c.symbols) || !c.symbols.map(s => s.toLowerCase()).includes(symbol.toLowerCase())))
    if (matching.length < 3 || different.length < 1) return null
    const group    = matching.slice(0, 3)
    const impostor = different[0]
    const flags    = shuffle([...group, impostor])
    return {
      category: locale === 'fr' ? `Symbole : ${symbol}` : `Symbol: ${symbol}`,
      hint: locale === 'fr' ? `3 drapeaux ont un ${symbol}. Lequel est l'imposteur ?` : `3 flags have a ${symbol}. Which one is the impostor?`,
      flags,
      impostor,
      group,
    }
  }

  return null
}

export default function ImposteurGame() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [phase, setPhase]         = useState('intro')
  const [countries, setCountries] = useState([])
  const [rounds, setRounds]       = useState([])
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
    supabase.from('countries').select('iso_code, name_en, name_fr, region, colors, symbols').then(({ data }) => {
      if (data) setCountries(data.filter(c => c.colors && c.region))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { handlePick(null); return }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft, current])

  function startGame() {
    // Build rounds
    const pool  = []
    let attempts = 0
    while (pool.length < TOTAL_ROUNDS && attempts < 100) {
      const r = buildRound(countries, locale)
      if (r) pool.push(r)
      attempts++
    }
    setRounds(pool)
    setCurrent(0); setScore(0); setStreak(0); setBestStreak(0)
    setResults([]); setSelected(null); setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  function handlePick(country) {
    if (selected !== null) return
    const round     = rounds[current]
    const correct   = country?.iso_code === round.impostor.iso_code
    const newStreak = correct ? streak + 1 : 0
    const newBest   = Math.max(bestStreak, newStreak)
    const points    = correct ? (15 + Math.floor(timeLeft * 1.5)) : 0

    setSelected(country)
    setStreak(newStreak)
    setBestStreak(newBest)
    if (correct) setScore(s => s + points)
    setResults(r => [...r, { round, picked: country, correct, points }])
    setPhase('result')
  }

  function nextRound() {
    const next = current + 1
    if (next >= rounds.length) { setPhase('gameover'); saveScore() }
    else { setCurrent(next); setSelected(null); setTimeLeft(TIME_PER_ROUND); setPhase('playing') }
  }

  async function saveScore() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({
        user_id: user.id, game: 'imposteur', score, played_at: new Date().toISOString(),
      })
      await supabase.from('game_scores').insert({
        user_id: user.id, game: 'imposteur', score,
        details: { streak: bestStreak, rounds: rounds.length }
      })
    } catch {}
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6' }}>
      <p style={{ color: '#16324F', fontWeight: '700' }}>{t('Loading…', 'Chargement…')}</p>
    </div>
  )

  if (phase === 'intro') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#16324F', margin: '0 0 12px' }}>
          {t('Impostor Flag', 'Drapeau Imposteur')}
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          {t(
            '3 flags share a common trait. 1 is the impostor. Find which one doesn\'t belong!',
            '3 drapeaux partagent un trait commun. 1 est l\'imposteur. Trouvez lequel n\'appartient pas au groupe !'
          )}
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
          {[
            [t('Color', 'Couleur'), t('3 flags have the same color', '3 drapeaux ont la même couleur')],
            [t('Region', 'Région'), t('3 flags from the same continent', '3 drapeaux du même continent')],
            [t('Symbol', 'Symbole'), t('3 flags share a symbol', '3 drapeaux partagent un symbole')],
          ].map(([cat, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 2 ? '12px' : 0 }}>
              <span style={{ fontSize: '20px' }}>{['🎨', '🌍', '⭐'][i]}</span>
              <div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#16324F' }}>{cat}: </span>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{desc}</span>
              </div>
            </div>
          ))}
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
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{score >= 150 ? '🏆' : score >= 80 ? '🥈' : '🎖️'}</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#16324F', margin: '0 0 8px' }}>{t('Game Over!', 'Partie terminée !')}</h1>
        <p style={{ fontSize: '48px', fontWeight: '900', color: '#4a7fd4', margin: '16px 0' }}>{score} pts</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16324F' }}>{results.filter(r => r.correct).length}/{rounds.length}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{t('Found', 'Trouvés')}</div>
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

  const round    = rounds[current]
  const progress = (current / rounds.length) * 100

  if (!round) return null

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#16324F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>← {t('Games', 'Jeux')}</Link>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>🔍 {t('Impostor', 'Imposteur')}</span>
        <span style={{ color: '#9EB7E5', fontWeight: '700', fontSize: '16px' }}>{score} pts</span>
      </div>
      <div style={{ height: '4px', backgroundColor: '#E2DDD5' }}>
        <div style={{ height: '100%', backgroundColor: '#4a7fd4', width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '20px' }}>

        {/* Counter + timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '520px' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>{current + 1} / {rounds.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {streak >= 3 && <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '99px' }}>🔥 x{streak}</span>}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${timeLeft <= 5 ? '#ef4444' : '#4a7fd4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px', color: timeLeft <= 5 ? '#ef4444' : '#16324F' }}>
              {phase === 'playing' ? timeLeft : '–'}
            </div>
          </div>
        </div>

        {/* Hint card */}
        <div style={{ backgroundColor: '#16324F', borderRadius: '16px', padding: '16px 24px', width: '100%', maxWidth: '520px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '15px' }}>{round.hint}</p>
          <p style={{ margin: '4px 0 0', color: '#9EB7E5', fontSize: '12px' }}>{round.category}</p>
        </div>

        {/* 4 flags grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', maxWidth: '520px' }}>
          {round.flags.map((flag) => {
            const isImpostor  = flag.iso_code === round.impostor.iso_code
            const isPicked    = selected?.iso_code === flag.iso_code
            const revealed    = phase === 'result'
            let border = '3px solid #E2DDD5', bg = 'white', overlay = null

            if (revealed) {
              if (isImpostor)       { border = '3px solid #ef4444'; bg = '#fee2e2' }
              else if (isPicked)    { border = '3px solid #f97316'; bg = '#fff7ed' }
              else                  { border = '3px solid #E2DDD5'; bg = 'white' }
            } else if (isPicked) {
              border = '3px solid #4a7fd4'; bg = '#eff6ff'
            }

            return (
              <button
                key={flag.iso_code}
                onClick={() => phase === 'playing' && handlePick(flag)}
                disabled={phase !== 'playing'}
                style={{
                  backgroundColor: bg, border, borderRadius: '16px',
                  padding: '16px 12px', cursor: phase === 'playing' ? 'pointer' : 'default',
                  transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Impostor badge */}
                {revealed && isImpostor && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '99px' }}>
                    {t('IMPOSTOR', 'IMPOSTEUR')}
                  </div>
                )}
                <img
                  src={`https://flagcdn.com/w160/${flag.iso_code}.png`}
                  alt={locale === 'fr' ? flag.name_fr : flag.name_en}
                  style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', borderRadius: '6px' }}
                  onError={e => e.target.style.opacity = '0.3'}
                />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#16324F', textAlign: 'center' }}>
                  {locale === 'fr' ? flag.name_fr : flag.name_en}
                </span>
                {revealed && !isImpostor && (
                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: '700' }}>{round.category}</span>
                )}
              </button>
            )
          })}
        </div>

        {phase === 'result' && (
          <div style={{ width: '100%', maxWidth: '520px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '14px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>{results[results.length - 1]?.correct ? '✅' : '❌'}</span>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#16324F' }}>
                  {results[results.length - 1]?.correct
                    ? t('Correct! You found the impostor.', 'Correct ! Vous avez trouvé l\'imposteur.')
                    : t(`The impostor was ${locale === 'fr' ? round.impostor.name_fr : round.impostor.name_en}`, `L'imposteur était ${locale === 'fr' ? round.impostor.name_fr : round.impostor.name_en}`)}
                </p>
                {results[results.length - 1]?.correct && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>+{results[results.length - 1]?.points} pts</p>
                )}
              </div>
            </div>
            <button onClick={nextRound} style={{ width: '100%', padding: '16px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
              {current + 1 >= rounds.length ? t('See results', 'Voir les résultats') : t('Next →', 'Suivant →')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
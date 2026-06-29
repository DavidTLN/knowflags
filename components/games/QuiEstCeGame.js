'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'

// Questions about flags / countries
const QUESTIONS_EN = [
  { id: 'continent_europe',    text: 'Is this country in Europe?',               key: 'region',  value: 'Europe' },
  { id: 'continent_africa',    text: 'Is this country in Africa?',               key: 'region',  value: 'Africa' },
  { id: 'continent_asia',      text: 'Is this country in Asia?',                 key: 'region',  value: 'Asia' },
  { id: 'continent_americas',  text: 'Is this country in the Americas?',         key: 'region',  value: 'Americas' },
  { id: 'continent_oceania',   text: 'Is this country in Oceania?',              key: 'region',  value: 'Oceania' },
  { id: 'color_red',           text: 'Does the flag contain red?',               key: 'colors',  value: 'red' },
  { id: 'color_blue',          text: 'Does the flag contain blue?',              key: 'colors',  value: 'blue' },
  { id: 'color_green',         text: 'Does the flag contain green?',             key: 'colors',  value: 'green' },
  { id: 'color_yellow',        text: 'Does the flag contain yellow or gold?',    key: 'colors',  value: 'yellow' },
  { id: 'color_white',         text: 'Does the flag contain white?',             key: 'colors',  value: 'white' },
  { id: 'color_black',         text: 'Does the flag contain black?',             key: 'colors',  value: 'black' },
  { id: 'symbol_star',         text: 'Does the flag have a star?',               key: 'symbols', value: 'Star' },
  { id: 'symbol_cross',        text: 'Does the flag have a cross?',              key: 'symbols', value: 'Cross' },
  { id: 'symbol_crescent',     text: 'Does the flag have a crescent moon?',      key: 'symbols', value: 'Crescent' },
  { id: 'symbol_eagle',        text: 'Does the flag have an eagle?',             key: 'symbols', value: 'Eagle' },
  { id: 'symbol_arms',         text: 'Does the flag have a coat of arms?',       key: 'symbols', value: 'Coat of arms' },
  { id: 'symbol_sun',          text: 'Does the flag have a sun?',                key: 'symbols', value: 'Sun' },
  { id: 'ratio_2_3',           text: 'Is the flag ratio 2:3?',                   key: 'ratio',   value: '2:3' },
  { id: 'ratio_1_2',           text: 'Is the flag ratio 1:2?',                   key: 'ratio',   value: '1:2' },
  { id: 'shape_square',        text: 'Is the flag square?',                      key: 'shape',   value: 'square' },
]

const QUESTIONS_FR = [
  { id: 'continent_europe',    text: 'Ce pays est-il en Europe ?',               key: 'region',  value: 'Europe' },
  { id: 'continent_africa',    text: 'Ce pays est-il en Afrique ?',              key: 'region',  value: 'Africa' },
  { id: 'continent_asia',      text: 'Ce pays est-il en Asie ?',                 key: 'region',  value: 'Asia' },
  { id: 'continent_americas',  text: 'Ce pays est-il dans les Amériques ?',      key: 'region',  value: 'Americas' },
  { id: 'continent_oceania',   text: 'Ce pays est-il en Océanie ?',              key: 'region',  value: 'Oceania' },
  { id: 'color_red',           text: 'Le drapeau contient-il du rouge ?',        key: 'colors',  value: 'red' },
  { id: 'color_blue',          text: 'Le drapeau contient-il du bleu ?',         key: 'colors',  value: 'blue' },
  { id: 'color_green',         text: 'Le drapeau contient-il du vert ?',         key: 'colors',  value: 'green' },
  { id: 'color_yellow',        text: 'Le drapeau contient-il du jaune/or ?',     key: 'colors',  value: 'yellow' },
  { id: 'color_white',         text: 'Le drapeau contient-il du blanc ?',        key: 'colors',  value: 'white' },
  { id: 'color_black',         text: 'Le drapeau contient-il du noir ?',         key: 'colors',  value: 'black' },
  { id: 'symbol_star',         text: 'Le drapeau a-t-il une étoile ?',           key: 'symbols', value: 'Star' },
  { id: 'symbol_cross',        text: 'Le drapeau a-t-il une croix ?',            key: 'symbols', value: 'Cross' },
  { id: 'symbol_crescent',     text: 'Le drapeau a-t-il un croissant ?',         key: 'symbols', value: 'Crescent' },
  { id: 'symbol_eagle',        text: 'Le drapeau a-t-il un aigle ?',             key: 'symbols', value: 'Eagle' },
  { id: 'symbol_arms',         text: 'Le drapeau a-t-il un blason ?',            key: 'symbols', value: 'Coat of arms' },
  { id: 'symbol_sun',          text: 'Le drapeau a-t-il un soleil ?',            key: 'symbols', value: 'Sun' },
  { id: 'ratio_2_3',           text: 'Le ratio du drapeau est-il 2:3 ?',         key: 'ratio',   value: '2:3' },
  { id: 'ratio_1_2',           text: 'Le ratio du drapeau est-il 1:2 ?',         key: 'ratio',   value: '1:2' },
  { id: 'shape_square',        text: 'Le drapeau est-il carré ?',                key: 'shape',   value: 'square' },
]

function checkAnswer(country, q) {
  if (q.key === 'region')  return country.region === q.value
  if (q.key === 'colors')  return Array.isArray(country.colors)  && country.colors.map(c => c.toLowerCase()).includes(q.value.toLowerCase())
  if (q.key === 'symbols') return Array.isArray(country.symbols) && country.symbols.map(s => s.toLowerCase()).includes(q.value.toLowerCase())
  if (q.key === 'ratio')   return country.ratio === q.value
  if (q.key === 'shape')   return country.shape === q.value
  return false
}

function getSmartQuestion(remaining, asked, questions) {
  // Pick question that best splits remaining countries
  let best = null, bestScore = -1
  for (const q of questions) {
    if (asked.includes(q.id)) continue
    const yes = remaining.filter(c => checkAnswer(c, q)).length
    const no  = remaining.length - yes
    // Good question splits ~50/50
    const score = Math.min(yes, no)
    if (score > bestScore) { bestScore = score; best = q }
  }
  return best
}

export default function QuiEstCeGame() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en
  const QUESTIONS = locale === 'fr' ? QUESTIONS_FR : QUESTIONS_EN

  const [phase, setPhase]         = useState('intro')
  const [allCountries, setAll]    = useState([])
  const [target, setTarget]       = useState(null)
  const [remaining, setRemaining] = useState([])
  const [asked, setAsked]         = useState([])
  const [history, setHistory]     = useState([])
  const [currentQ, setCurrentQ]   = useState(null)
  const [guess, setGuess]         = useState('')
  const [guessMode, setGuessMode] = useState(false)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [maxQuestions] = useState(20)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr, region, colors, symbols, ratio, shape')
      .then(({ data }) => {
        if (data) setAll(data)
        setLoading(false)
      })
  }, [])

  function startGame() {
    const pool = allCountries.filter(c => c.colors && c.region)
    const t    = pool[Math.floor(Math.random() * pool.length)]
    setTarget(t)
    setRemaining([...pool])
    setAsked([])
    setHistory([])
    setGuess('')
    setGuessMode(false)
    setResult(null)
    const q = getSmartQuestion(pool, [], QUESTIONS)
    setCurrentQ(q)
    setPhase('playing')
  }

  function handleYesNo(answer) {
    if (!currentQ || !target) return
    const correct = checkAnswer(target, currentQ)
    const wasYes  = answer === 'yes'
    const matched = wasYes === correct

    const newHistory = [...history, { q: currentQ, answer, correct: matched }]
    const askedIds   = [...asked, currentQ.id]
    setHistory(newHistory)
    setAsked(askedIds)

    // Filter remaining countries
    const newRemaining = remaining.filter(c => checkAnswer(c, currentQ) === wasYes)
    setRemaining(newRemaining)

    // Win if 1 left or max questions reached
    if (newRemaining.length === 1) {
      setGuessMode(true)
      setCurrentQ(null)
      return
    }
    if (askedIds.length >= maxQuestions || newRemaining.length === 0) {
      setGuessMode(true)
      setCurrentQ(null)
      return
    }

    const nextQ = getSmartQuestion(newRemaining, askedIds, QUESTIONS)
    setCurrentQ(nextQ || null)
    if (!nextQ) setGuessMode(true)
  }

  function handleGuess() {
    if (!target) return
    const guessLower   = guess.toLowerCase().trim()
    const correctEn    = target.name_en.toLowerCase()
    const correctFr    = target.name_fr.toLowerCase()
    const isCorrect    = guessLower === correctEn || guessLower === correctFr || guessLower === target.iso_code
    setResult({ isCorrect, target })
    setPhase('result')
  }

  function skipToGuess() { setGuessMode(true); setCurrentQ(null) }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6' }}>
      <p style={{ color: '#16324F', fontWeight: '700' }}>{t('Loading…', 'Chargement…')}</p>
    </div>
  )

  if (phase === 'intro') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🕵️</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#16324F', margin: '0 0 12px' }}>
          {t('Qui est-ce?', 'Qui est-ce ?')}
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          {t(
            'A secret country is chosen. Ask yes/no questions to narrow it down, then guess!',
            'Un pays secret est choisi. Posez des questions oui/non pour le trouver, puis devinez !'
          )}
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>❓</span>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>{t(`Up to ${maxQuestions} questions`, `Jusqu'à ${maxQuestions} questions`)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>🌍</span>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>{t(`${allCountries.length} possible countries`, `${allCountries.length} pays possibles`)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>{t('Smart questions narrow down options', 'Les questions intelligentes réduisent les options')}</span>
          </div>
        </div>
        <button onClick={startGame} style={{ width: '100%', padding: '16px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}>
          {t('Start', 'Commencer')}
        </button>
      </div>
    </div>
  )

  if (phase === 'result') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {result?.isCorrect ? '🎉' : '😔'}
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#16324F', margin: '0 0 16px' }}>
          {result?.isCorrect ? t('Correct!', 'Correct !') : t('Not quite…', 'Pas tout à fait…')}
        </h1>
        {result?.target && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <img
              src={`https://flagcdn.com/w320/${result.target.iso_code}.png`}
              alt={result.target.name_en}
              style={{ maxWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginBottom: '16px' }}
            />
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#16324F', margin: 0 }}>
              {locale === 'fr' ? result.target.name_fr : result.target.name_en}
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
              {t(`Found in ${history.length} questions`, `Trouvé en ${history.length} questions`)}
              {' · '}{remaining.length} {t('countries left', 'pays restants')}
            </p>
          </div>
        )}
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

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#16324F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>← {t('Games', 'Jeux')}</Link>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>🕵️ {t('Qui est-ce?', 'Qui est-ce ?')}</span>
        <span style={{ color: '#9EB7E5', fontSize: '13px', fontWeight: '600' }}>{remaining.length} {t('left', 'restants')}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '20px' }}>

        {/* Progress */}
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
              {t(`Question ${history.length + 1}`, `Question ${history.length + 1}`)}
            </span>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
              {remaining.length} {t('countries remaining', 'pays restants')}
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#E2DDD5', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: '#4a7fd4', borderRadius: '99px', width: `${((maxQuestions - remaining.length) / maxQuestions) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Question history (last 3) */}
        {history.length > 0 && (
          <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.slice(-3).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '10px', fontSize: '13px', opacity: 0.7 + (i * 0.15) }}>
                <span>{h.answer === 'yes' ? '✅' : '❌'}</span>
                <span style={{ flex: 1, color: '#6B7280' }}>{h.q.text}</span>
                <span style={{ fontWeight: '700', color: h.answer === 'yes' ? '#22c55e' : '#ef4444' }}>{h.answer === 'yes' ? t('Yes', 'Oui') : t('No', 'Non')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Current question or guess mode */}
        {!guessMode && currentQ ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
              {t('Question', 'Question')} {history.length + 1}
            </p>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#16324F', margin: '0 0 32px', lineHeight: 1.4 }}>
              {currentQ.text}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => handleYesNo('yes')} style={{ flex: 1, padding: '16px', backgroundColor: '#dcfce7', border: '2px solid #22c55e', borderRadius: '12px', fontSize: '18px', fontWeight: '800', color: '#166534', cursor: 'pointer', transition: 'all 0.15s' }}>
                ✅ {t('Yes', 'Oui')}
              </button>
              <button onClick={() => handleYesNo('no')} style={{ flex: 1, padding: '16px', backgroundColor: '#fee2e2', border: '2px solid #ef4444', borderRadius: '12px', fontSize: '18px', fontWeight: '800', color: '#991b1b', cursor: 'pointer', transition: 'all 0.15s' }}>
                ❌ {t('No', 'Non')}
              </button>
            </div>
            <button onClick={skipToGuess} style={{ marginTop: '16px', background: 'none', border: 'none', fontSize: '13px', color: '#9CA3AF', cursor: 'pointer', textDecoration: 'underline' }}>
              {t('I already know → Guess now', 'Je sais déjà → Deviner maintenant')}
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#16324F', margin: '0 0 8px' }}>
              {remaining.length === 1
                ? t(`Is it ${locale === 'fr' ? remaining[0]?.name_fr : remaining[0]?.name_en}?`, `Est-ce ${locale === 'fr' ? remaining[0]?.name_fr : remaining[0]?.name_en} ?`)
                : t('What country is it?', 'Quel est ce pays ?')}
            </p>
            {remaining.length === 1 && (
              <img src={`https://flagcdn.com/w160/${remaining[0]?.iso_code}.png`} alt="" style={{ maxWidth: '120px', borderRadius: '6px', margin: '12px auto 16px', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            )}
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 20px' }}>
              {remaining.length > 1 && `${remaining.length} ${t('possible countries left', 'pays possibles restants')}`}
            </p>
            <input
              type="text"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && guess.trim() && handleGuess()}
              placeholder={t('Type country name…', 'Nom du pays…')}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #E2DDD5', fontSize: '16px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
              autoFocus
            />
            {remaining.length <= 5 && remaining.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                {remaining.map(c => (
                  <button key={c.iso_code} onClick={() => { setGuess(locale === 'fr' ? c.name_fr : c.name_en) }}
                    style={{ padding: '6px 12px', borderRadius: '99px', border: '1.5px solid #E2DDD5', backgroundColor: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={`https://flagcdn.com/w20/${c.iso_code}.png`} alt="" style={{ width: '16px', height: '11px', objectFit: 'contain' }} />
                    {locale === 'fr' ? c.name_fr : c.name_en}
                  </button>
                ))}
              </div>
            )}
            <button onClick={handleGuess} disabled={!guess.trim()} style={{ width: '100%', padding: '14px', backgroundColor: guess.trim() ? '#16324F' : '#E2DDD5', color: guess.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: guess.trim() ? 'pointer' : 'default' }}>
              {t('Guess!', 'Deviner !')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'

// Solo Gartic Phone: 
// Round 1: Given a flag → write a description
// Round 2: Given the description → draw the flag (canvas)
// Round 3: Given the drawing → guess the country
// Scoring based on final guess accuracy

const COLORS = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#16324F','#9EB7E5','#14b8a6']
const BRUSH_SIZES = [2, 5, 10, 20]

export default function GarticPhoneGame() {
  const locale  = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [phase, setPhase]           = useState('intro')    // intro | describe | draw | guess | result
  const [country, setCountry]       = useState(null)
  const [description, setDescription] = useState('')
  const [guess, setGuess]           = useState('')
  const [score, setScore]           = useState(0)
  const [allCountries, setAll]      = useState([])
  const [loading, setLoading]       = useState(true)
  const [round, setRound]           = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [results, setResults]       = useState([])
  const [drawingUrl, setDrawingUrl] = useState(null)

  // Canvas state
  const canvasRef        = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor]         = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool]           = useState('pen')  // pen | eraser
  const lastPos = useRef(null)

  const TOTAL_ROUNDS = 5

  useEffect(() => {
    const supabase = createClient()
    supabase.from('countries').select('iso_code, name_en, name_fr, region, colors').then(({ data }) => {
      if (data) setAll(data)
      setLoading(false)
    })
  }, [])

  function pickCountry(pool) {
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function startGame() {
    const pool = allCountries.filter(c => c.colors)
    setCountry(pickCountry(pool))
    setRound(0)
    setTotalScore(0)
    setResults([])
    setDescription('')
    setGuess('')
    setDrawingUrl(null)
    setPhase('describe')
  }

  function submitDescription() {
    if (!description.trim()) return
    setPhase('draw')
    setTimeout(() => initCanvas(), 100)
  }

  function initCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Canvas drawing
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e) {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    lastPos.current = getPos(e, canvas)
  }

  function draw(e) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineWidth   = tool === 'eraser' ? brushSize * 3 : brushSize
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function stopDraw(e) {
    e.preventDefault()
    setIsDrawing(false)
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function submitDrawing() {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    setDrawingUrl(url)
    setGuess('')
    setPhase('guess')
  }

  function submitGuess() {
    if (!guess.trim() || !country) return
    const guessL   = guess.toLowerCase().trim()
    const correctEn = country.name_en.toLowerCase()
    const correctFr = country.name_fr.toLowerCase()
    const isCorrect = guessL === correctEn || guessL === correctFr || guessL === country.iso_code

    const pts = isCorrect ? 100 : 0
    const newTotal = totalScore + pts

    setResults(r => [...r, {
      country,
      description,
      drawingUrl,
      guess,
      isCorrect,
      pts,
    }])
    setTotalScore(newTotal)

    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('result')
      saveScore(newTotal)
    } else {
      const pool = allCountries.filter(c => c.colors)
      setCountry(pickCountry(pool))
      setDescription('')
      setGuess('')
      setDrawingUrl(null)
      setRound(r => r + 1)
      setPhase('describe')
    }
  }

  async function saveScore(finalScore) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({
        user_id: user.id, game: 'gartic-phone', score: finalScore, played_at: new Date().toISOString(),
      })
      await supabase.from('game_scores').insert({
        user_id: user.id, game: 'gartic-phone', score: finalScore,
        details: { rounds: TOTAL_ROUNDS }
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
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎨</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#16324F', margin: '0 0 12px' }}>Flag Phone</h1>
        <p style={{ fontSize: '15px', color: '#6B7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          {t(
            'Inspired by Gartic Phone. Describe a flag → draw from the description → guess the country!',
            'Inspiré de Gartic Phone. Décrivez un drapeau → dessinez depuis la description → devinez le pays !'
          )}
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
          {[
            ['👁️', t('Step 1', 'Étape 1'), t('You see a flag → describe it in words', 'Vous voyez un drapeau → décrivez-le en mots')],
            ['✏️', t('Step 2', 'Étape 2'), t('You see only your description → draw the flag', 'Vous voyez seulement votre description → dessinez le drapeau')],
            ['🎯', t('Step 3', 'Étape 3'), t('You see your drawing → guess the country', 'Vous voyez votre dessin → devinez le pays')],
          ].map(([icon, step, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 2 ? '16px' : 0 }}>
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#16324F' }}>{step}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>{desc}</div>
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

  if (phase === 'result') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎨</div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#16324F' }}>{t('Flag Phone — Results', 'Flag Phone — Résultats')}</h1>
          <p style={{ fontSize: '40px', fontWeight: '900', color: '#4a7fd4', margin: '12px 0' }}>{totalScore} pts</p>
          <p style={{ fontSize: '16px', color: '#6B7280' }}>{results.filter(r => r.isCorrect).length}/{TOTAL_ROUNDS} {t('correct', 'corrects')}</p>
        </div>

        {results.map((r, i) => (
          <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: `2px solid ${r.isCorrect ? '#22c55e' : '#E2DDD5'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>{r.isCorrect ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontWeight: '800', color: '#16324F' }}>{locale === 'fr' ? r.country.name_fr : r.country.name_en}</div>
                <div style={{ fontSize: '12px', color: r.isCorrect ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
                  {r.isCorrect ? `+${r.pts} pts` : t(`You guessed: ${r.guess || 'nothing'}`, `Votre réponse : ${r.guess || 'rien'}`)}
                </div>
              </div>
              <img src={`https://flagcdn.com/w80/${r.country.iso_code}.png`} alt="" style={{ marginLeft: 'auto', height: '30px', objectFit: 'contain', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>{t('Your description', 'Votre description')}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, backgroundColor: '#f8f5ed', borderRadius: '8px', padding: '10px', margin: 0 }}>{r.description}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>{t('Your drawing', 'Votre dessin')}</p>
                <img src={r.drawingUrl} alt="drawing" style={{ width: '100%', borderRadius: '8px', border: '1px solid #E2DDD5' }} />
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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

  // ── DESCRIBE PHASE ──
  if (phase === 'describe') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#16324F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}/games`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>← {t('Games', 'Jeux')}</Link>
        <span style={{ color: 'white', fontWeight: '900' }}>🎨 Flag Phone</span>
        <span style={{ color: '#9EB7E5', fontSize: '13px' }}>{round + 1}/{TOTAL_ROUNDS}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '20px' }}>
        <div style={{ backgroundColor: '#4a7fd4', color: 'white', borderRadius: '12px', padding: '10px 20px', fontWeight: '800', fontSize: '14px' }}>
          👁️ {t('Step 1 — Describe the flag', 'Étape 1 — Décrivez le drapeau')}
        </div>

        {country && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px', fontWeight: '600' }}>
              {t('Memorize this flag, then describe it. You won\'t see it in the next step!', 'Mémorisez ce drapeau, puis décrivez-le. Vous ne le verrez plus à l\'étape suivante !')}
            </p>
            <img
              src={`https://flagcdn.com/w320/${country.iso_code}.png`}
              alt="flag"
              style={{ maxWidth: '220px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginBottom: '20px' }}
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('Describe the flag: colors, shapes, symbols…', 'Décrivez le drapeau : couleurs, formes, symboles…')}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #E2DDD5', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
          </div>
        )}

        <button onClick={submitDescription} disabled={!description.trim()} style={{ width: '100%', maxWidth: '480px', padding: '16px', backgroundColor: description.trim() ? '#16324F' : '#E2DDD5', color: description.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: description.trim() ? 'pointer' : 'default' }}>
          {t('Next: Draw →', 'Suivant : Dessiner →')}
        </button>
      </div>
    </div>
  )

  // ── DRAW PHASE ──
  if (phase === 'draw') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#16324F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Flag Phone</span>
        <span style={{ color: 'white', fontWeight: '900' }}>✏️ {t('Draw', 'Dessiner')}</span>
        <span style={{ color: '#9EB7E5', fontSize: '13px' }}>{round + 1}/{TOTAL_ROUNDS}</span>
      </div>

      <div style={{ backgroundColor: '#f8f5ed', padding: '12px 24px', borderBottom: '1px solid #E2DDD5' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', fontStyle: 'italic', textAlign: 'center' }}>
          "{description}"
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', gap: '12px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: 'white', borderRadius: '12px', padding: '10px 14px', border: '1px solid #E2DDD5', maxWidth: '520px', width: '100%' }}>
          {/* Colors */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => { setColor(c); setTool('pen') }}
                style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, border: color === c && tool === 'pen' ? '3px solid #4a7fd4' : '2px solid #E2DDD5', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
            ))}
          </div>
          <div style={{ width: '1px', backgroundColor: '#E2DDD5' }} />
          {/* Brush sizes */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {BRUSH_SIZES.map(s => (
              <button key={s} onClick={() => { setBrushSize(s); setTool('pen') }}
                style={{ width: `${s * 1.8 + 16}px`, height: `${s * 1.8 + 16}px`, borderRadius: '50%', backgroundColor: brushSize === s && tool === 'pen' ? '#16324F' : '#f1f5f9', border: '2px solid #E2DDD5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <div style={{ width: s, height: s, borderRadius: '50%', backgroundColor: brushSize === s && tool === 'pen' ? 'white' : '#9CA3AF' }} />
              </button>
            ))}
          </div>
          <div style={{ width: '1px', backgroundColor: '#E2DDD5' }} />
          <button onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
            style={{ padding: '4px 10px', borderRadius: '8px', border: `2px solid ${tool === 'eraser' ? '#ef4444' : '#E2DDD5'}`, backgroundColor: tool === 'eraser' ? '#fee2e2' : 'white', cursor: 'pointer', fontSize: '16px' }}>
            🧹
          </button>
          <button onClick={clearCanvas}
            style={{ padding: '4px 10px', borderRadius: '8px', border: '2px solid #E2DDD5', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#6B7280' }}>
            {t('Clear', 'Effacer')}
          </button>
        </div>

        {/* Canvas */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '2px solid #E2DDD5', overflow: 'hidden', maxWidth: '520px', width: '100%', touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            width={520}
            height={340}
            style={{ display: 'block', width: '100%', height: 'auto', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        <button onClick={submitDrawing} style={{ width: '100%', maxWidth: '520px', padding: '16px', backgroundColor: '#16324F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
          {t('Next: Guess →', 'Suivant : Deviner →')}
        </button>
      </div>
    </div>
  )

  // ── GUESS PHASE ──
  if (phase === 'guess') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F4F1E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#16324F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Flag Phone</span>
        <span style={{ color: 'white', fontWeight: '900' }}>🎯 {t('Guess', 'Deviner')}</span>
        <span style={{ color: '#9EB7E5', fontSize: '13px' }}>{round + 1}/{TOTAL_ROUNDS}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '20px' }}>
        <div style={{ backgroundColor: '#22c55e', color: 'white', borderRadius: '12px', padding: '10px 20px', fontWeight: '800', fontSize: '14px' }}>
          🎯 {t('Step 3 — What country is this?', 'Étape 3 — Quel est ce pays ?')}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px' }}>
          <img src={drawingUrl} alt="your drawing" style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ width: '100%', maxWidth: '480px' }}>
          <input
            type="text"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guess.trim() && submitGuess()}
            placeholder={t('Country name…', 'Nom du pays…')}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #E2DDD5', fontSize: '16px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
            autoFocus
          />
          <button onClick={submitGuess} disabled={!guess.trim()} style={{ width: '100%', padding: '16px', backgroundColor: guess.trim() ? '#16324F' : '#E2DDD5', color: guess.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: guess.trim() ? 'pointer' : 'default' }}>
            {t('Submit guess', 'Soumettre ma réponse')}
          </button>
        </div>
      </div>
    </div>
  )

  return null
}
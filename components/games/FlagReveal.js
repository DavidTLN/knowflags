'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

function normalize(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const GUESS_POINTS = { 1: 100, 2: 75, 3: 50, 4: 35, 5: 20 }
const STREAK_MULTIPLIER = (streak) => {
  if (streak >= 20) return 3
  if (streak >= 10) return 2
  if (streak >= 5)  return 1.5
  return 1
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const MAX_GUESSES = 5
const MAX_LIVES = 3
const TILE_SIZE = 20
const CANVAS_W = 480
const CANVAS_H = 320

export default function FlagReveal() {
  const t = useTranslations('game')
  const locale = useLocale()

  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const inputRef = useRef(null)

  const [target, setTarget] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [input, setInput] = useState('')
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameState, setGameState] = useState('playing')
  const [revealedTiles, setRevealedTiles] = useState(new Set())
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)
  const [difficulty, setDifficulty] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const activeIdxRef = useRef(0)
  const suggestionsRef = useRef([])
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [user, setUser] = useState(null)
  const [myStats, setMyStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [flags, setFlags] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [allFacts, setAllFacts] = useState({})
  const [revealFact, setRevealFact] = useState(null)
  const [score, setScore] = useState(0)
  const [lastPts, setLastPts] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [showQuitTip, setShowQuitTip] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  // history for game over screen
  const [gameHistory, setGameHistory] = useState([]) // [{flag, won, guessCount}]
  const scoreRef  = useRef(0)
  const timerRef2 = useRef(null)
  const sessionStart = useRef(null)

  useEffect(() => {
    const timeout = setTimeout(() => setCountriesLoading(false), 8000)
    const supabase = createClient()
    Promise.all([
      supabase.from('countries').select('iso_code, name_en, name_fr').order('name_en'),
      supabase.from('country_facts').select('country_code, fact_en, fact_fr, category'),
    ]).then(([{ data, error }, { data: factsData }]) => {
      clearTimeout(timeout)
      if (data && data.length > 0) setFlags(data.map(c => ({ code: c.iso_code, en: c.name_en, fr: c.name_fr })))
      if (factsData) {
        const idx = {}
        for (const f of factsData) {
          if (!idx[f.country_code]) idx[f.country_code] = []
          idx[f.country_code].push(f)
        }
        setAllFacts(idx)
      }
      setCountriesLoading(false)
    }).catch(() => setCountriesLoading(false))
    return () => clearTimeout(timeout)
  }, [])

  const getName = (flag) => flag ? (locale === 'fr' ? flag.fr : flag.en) : ''

  useEffect(() => {
    if (!document.getElementById('flagreveal-anim')) {
      const style = document.createElement('style')
      style.id = 'flagreveal-anim'
      style.textContent = '@keyframes floatUp { 0% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; transform:translateX(-50%) translateY(-28px); } }'
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadStats(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadStats(session.user.id)
    })
    loadLeaderboard()
    return () => subscription.unsubscribe()
  }, [])

  async function loadStats(userId) {
    const supabase = createClient()
    const { data } = await supabase.from('player_stats').select('streak_current, streak_best, flags_found, games_played').eq('user_id', userId).eq('game', 'flag-reveal').single()
    if (data) setMyStats(data)
  }

  async function loadLeaderboard() {
    const supabase = createClient()
    const { data } = await supabase.from('player_stats').select('user_id, streak_best, flags_found, profiles(username)').eq('game', 'flag-reveal').order('streak_best', { ascending: false }).limit(5)
    if (data) setLeaderboard(data)
  }

  async function saveStats(won, newStreak) {
    if (!user) return
    const supabase = createClient()
    const { data: existing } = await supabase.from('player_stats').select('*').eq('user_id', user.id).eq('game', 'flag-reveal').single()
    if (existing) {
      await supabase.from('player_stats').update({
        game: 'flag-reveal', streak_current: won ? newStreak : 0,
        streak_best: Math.max(existing.streak_best || 0, newStreak),
        flags_found: won ? (existing.flags_found || 0) + 1 : existing.flags_found,
        games_played: (existing.games_played || 0) + 1,
        longest_game: Math.max(existing.longest_game || 0, elapsed),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('game', 'flag-reveal')
    } else {
      await supabase.from('player_stats').insert({
        user_id: user.id, game: 'flag-reveal',
        streak_current: won ? newStreak : 0, streak_best: won ? newStreak : 0,
        flags_found: won ? 1 : 0, games_played: 1, longest_game: elapsed,
      })
    }
    loadStats(user.id); loadLeaderboard()
  }

  async function saveScore(finalScore) {
    if (!user || finalScore === 0) return
    const supabase = createClient()
    const { data: existing } = await supabase.from('game_scores').select('best_streak, best_duration').eq('user_id', user.id).eq('mode', 'flag_reveal').single()
    await supabase.from('game_scores').upsert({
      user_id: user.id, mode: 'flag_reveal',
      best_streak: Math.max(existing?.best_streak ?? 0, finalScore),
      best_duration: Math.max(existing?.best_duration ?? 0, elapsed),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,mode' })
  }

  async function logScore(s) {
    if (!s || s <= 0) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('game_scores_log').insert({ user_id: user.id, game: 'flag-reveal', score: s, played_at: new Date().toISOString() })
    } catch (e) { console.error('logScore error:', e) }
  }

  // ── endGame: save + go to game over screen ────────────────────────────────
  async function endGame() {
    stopSessionTimer()
    await saveScore(scoreRef.current)
    await logScore(scoreRef.current)
    await saveStats(false, 0)
    setGameState('gameover')
  }

  function giveUpFlag() {
    revealAll()
    const newLives = lives - 1
    setLives(newLives)
    setStreak(0)
    if (newLives <= 0) { endGame() }
    else { setGameState('lost'); saveStats(false, 0) }
  }

  useEffect(() => {
    if (!difficulty) return
    setGameHistory([])
    startNewFlag()
    startSessionTimer()
    return () => stopSessionTimer()
  }, [difficulty])

  useEffect(() => { if (imageLoaded) drawCanvas() }, [imageLoaded, revealedTiles])

  function startSessionTimer() {
    clearInterval(timerRef2.current)
    sessionStart.current = Date.now()
    timerRef2.current = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000)), 1000)
  }
  function stopSessionTimer() { clearInterval(timerRef2.current) }

  function startNewFlag() {
    const random = flags[Math.floor(Math.random() * flags.length)]
    setTarget(random); setRevealFact(null); setGuesses([]); setInput('')
    setRevealedTiles(new Set()); setGameState('playing'); setImageLoaded(false)
    setSuggestions([]); setActiveIdx(0)
    setTimeout(() => inputRef.current?.focus(), 150)
  }

  useEffect(() => {
    if (!target) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = 'https://flagcdn.com/w640/' + target.code + '.png'
    img.onload = () => { imgRef.current = img; setImageLoaded(true) }
  }, [target])

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current) return
    const ctx = canvas.getContext('2d')
    const W = CANVAS_W; const H = CANVAS_H
    const cols = Math.floor(W / TILE_SIZE); const rows = Math.floor(H / TILE_SIZE)
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, W, H)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE_SIZE; const y = r * TILE_SIZE
        if (revealedTiles.has(r + '-' + c)) {
          ctx.drawImage(imgRef.current, (x/W)*imgRef.current.naturalWidth, (y/H)*imgRef.current.naturalHeight, (TILE_SIZE/W)*imgRef.current.naturalWidth, (TILE_SIZE/H)*imgRef.current.naturalHeight, x, y, TILE_SIZE, TILE_SIZE)
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#c8c4bc' : '#bab6ae'
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        }
      }
    }
  }

  function computeSimilarity(guessCode) {
    return new Promise((resolve) => {
      const W = CANVAS_W; const H = CANVAS_H
      const tC = document.createElement('canvas'); tC.width = W; tC.height = H
      tC.getContext('2d').drawImage(imgRef.current, 0, 0, W, H)
      const tData = tC.getContext('2d').getImageData(0, 0, W, H).data
      const gImg = new Image(); gImg.crossOrigin = 'anonymous'
      gImg.src = 'https://flagcdn.com/w640/' + guessCode + '.png'
      gImg.onload = () => {
        const gC = document.createElement('canvas'); gC.width = W; gC.height = H
        gC.getContext('2d').drawImage(gImg, 0, 0, W, H)
        const gData = gC.getContext('2d').getImageData(0, 0, W, H).data
        const cols = Math.floor(W / TILE_SIZE); const rows = Math.floor(H / TILE_SIZE)
        const newRevealed = new Set(revealedTiles)
        let matched = 0; const total = cols * rows
        const potentialReveal = new Set()
        const guessPalette = []
        for (let i = 0; i < gData.length; i += 16) {
          if (gData[i+3] > 128) guessPalette.push([gData[i], gData[i+1], gData[i+2]])
        }
        const PALETTE_MANHATTAN = 150; const POSITIONAL_THRESHOLD = 65
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = (r*TILE_SIZE + Math.floor(TILE_SIZE/2))*W + (c*TILE_SIZE + Math.floor(TILE_SIZE/2))
            const i = px * 4
            if (tData[i+3] < 128 || gData[i+3] < 128) continue
            const tR = tData[i], tG = tData[i+1], tB = tData[i+2]
            const inPalette = guessPalette.some(([pR,pG,pB]) => Math.abs(tR-pR)+Math.abs(tG-pG)+Math.abs(tB-pB) < PALETTE_MANHATTAN)
            if (!inPalette) continue
            const dist = Math.sqrt(Math.pow(tR-gData[i],2)+Math.pow(tG-gData[i+1],2)+Math.pow(tB-gData[i+2],2))
            if (dist < POSITIONAL_THRESHOLD) { matched++; potentialReveal.add(r+'-'+c) }
          }
        }
        const pct = Math.round((matched/total)*100)
        if (pct >= 5) potentialReveal.forEach(key => newRevealed.add(key))
        resolve({ newRevealed, pct })
      }
    })
  }

  function revealAll() {
    const all = new Set()
    for (let r = 0; r < Math.floor(CANVAS_H/TILE_SIZE); r++)
      for (let c = 0; c < Math.floor(CANVAS_W/TILE_SIZE); c++)
        all.add(r+'-'+c)
    setRevealedTiles(all)
  }

  function handleInputChange(val) {
    setInput(val)
    if (val.length < 2) { setSuggestions([]); suggestionsRef.current = []; setActiveIdx(0); activeIdxRef.current = 0; return }
    const filtered = flags.filter(f => normalize(getName(f)).includes(normalize(val)) && !guesses.find(g => g.code === f.code)).slice(0, 6)
    setSuggestions(filtered); suggestionsRef.current = filtered; setActiveIdx(0); activeIdxRef.current = 0
  }

  function handleKeyDown(e) {
    if (suggestionsRef.current.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.min(activeIdxRef.current+1, suggestionsRef.current.length-1); activeIdxRef.current = next; setActiveIdx(next) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const prev = Math.max(activeIdxRef.current-1, 0); activeIdxRef.current = prev; setActiveIdx(prev) }
    else if (e.key === 'Enter') { e.preventDefault(); const flag = suggestionsRef.current[activeIdxRef.current]; if (flag) handleGuess(flag) }
  }

  async function handleGuess(flag) {
    if (gameState !== 'playing') return
    setSuggestions([]); setInput(''); setActiveIdx(0)
    const isCorrect = flag.code === target.code
    const { newRevealed, pct } = await computeSimilarity(flag.code)
    const newGuesses = [...guesses, { ...flag, correct: isCorrect, similarity: pct }]
    setGuesses(newGuesses)
    if (isCorrect) {
      revealAll()
      const newStreak = streak + 1; setStreak(newStreak); setGameState('won')
      const targetFacts = allFacts[target.code]
      if (targetFacts && targetFacts.length > 0) setRevealFact(targetFacts[Math.floor(Math.random()*targetFacts.length)])
      if (difficulty !== 'easy') {
        const basePts = GUESS_POINTS[newGuesses.length] ?? 10
        const pts = Math.round(basePts * STREAK_MULTIPLIER(newStreak))
        const newScore = scoreRef.current + pts; scoreRef.current = newScore; setScore(newScore)
        setLastPts(pts); setTimeout(() => setLastPts(null), 1500)
      }
      setGameHistory(h => [...h, { flag: target, won: true, guessCount: newGuesses.length }])
      await saveStats(true, newStreak)
    } else {
      setRevealedTiles(newRevealed)
      if (newGuesses.length >= MAX_GUESSES) {
        revealAll()
        const newLives = lives - 1; setLives(newLives); setStreak(0)
        setGameHistory(h => [...h, { flag: target, won: false, guessCount: MAX_GUESSES }])
        if (newLives <= 0) { endGame() }
        else {
          const targetFacts = allFacts[target.code]
          if (targetFacts && targetFacts.length > 0) setRevealFact(targetFacts[Math.floor(Math.random()*targetFacts.length)])
          setGameState('lost'); await saveStats(false, 0)
        }
      }
    }
  }

  const emptyRows = Math.max(0, MAX_GUESSES - guesses.length)

  const canvasBlock = (
    <div style={{ position: 'relative', lineHeight: 0, flex: 1, minHeight: 0 }}>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: '10px', border: '1px solid #E2DDD5', backgroundColor: '#e8e4dc' }} />
      {gameState !== 'playing' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', lineHeight: 1 }}>{gameState === 'won' ? '🎉' : gameState === 'lost' ? '😔' : '💀'}</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: gameState === 'won' ? '#FCD116' : '#ef4444', lineHeight: 1.2 }}>
              {gameState === 'gameover' ? t('gameOver') : getName(target)}
            </div>
            {(gameState === 'lost' || gameState === 'gameover') && (
              <div style={{ fontSize: '15px', color: '#F4F1E6', lineHeight: 1.2 }}>{t('itWas')} {getName(target)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const isDone = gameState === 'won' || gameState === 'lost' || gameState === 'gameover'

  const factBlock = revealFact && isDone && gameState !== 'gameover' ? (
    <div style={{ backgroundColor: '#FFF8E7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>💡</span>
      <div>
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>
          {locale === 'fr' ? 'Le saviez-vous ?' : 'Did you know?'}
        </div>
        <div style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.6 }}>
          {locale === 'fr' ? revealFact.fact_fr : revealFact.fact_en}
        </div>
      </div>
    </div>
  ) : null

  const actionButton = (
    <button
      onClick={isDone ? (gameState === 'gameover' ? () => { setLives(MAX_LIVES); setStreak(0); scoreRef.current = 0; setScore(0); setElapsed(0); setGameHistory([]); setDifficulty(null) } : startNewFlag) : undefined}
      disabled={!isDone}
      style={{ width: '100%', padding: '13px', backgroundColor: isDone ? (gameState === 'won' ? '#426A5A' : gameState === 'gameover' ? '#9EB7E5' : '#0B1F3B') : '#E2DDD5', color: isDone ? 'white' : '#A0998F', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: isDone ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}>
      {gameState === 'gameover' ? t('playAgain') : isDone ? t('nextFlag') : locale === 'fr' ? 'Drapeau suivant' : 'Next flag'}
    </button>
  )

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (countriesLoading) return (
    <div style={{ backgroundColor: '#0B1F3B', height: 'calc(100dvh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏳️</div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{locale === 'fr' ? 'Chargement des drapeaux...' : 'Loading flags...'}</p>
      </div>
    </div>
  )

  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (!difficulty) return (
    <div style={{ backgroundColor: '#F4F1E6', height: 'calc(100dvh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏳️</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '30px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px' }}>Flag Reveal</h1>
          <p style={{ margin: 0, color: '#8A8278', fontSize: '15px' }}>{locale === 'fr' ? 'Choisis ta difficulté' : 'Choose your difficulty'}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { key: 'easy', icon: '🎓', label: locale === 'fr' ? 'Entraînement' : 'Training', desc: locale === 'fr' ? 'Le drapeau du pays est affiché dans la liste de suggestions' : 'The country flag is shown in the suggestion list', color: '#426A5A', bg: '#f0fdf4', border: '#86efac' },
            { key: 'normal', icon: '💪', label: 'Normal', desc: locale === 'fr' ? 'Seul le nom du pays apparaît — pas de drapeau dans les suggestions' : 'Only the country name appears — no flag in suggestions', color: '#0B1F3B', bg: '#f8f5ed', border: '#E2DDD5' },
          ].map(d => (
            <button key={d.key} onClick={() => setDifficulty(d.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderRadius: '14px', border: `2px solid ${d.border}`, backgroundColor: d.bg, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>{d.icon}</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: d.color, marginBottom: '4px' }}>{d.label}</div>
                <div style={{ fontSize: '13px', color: '#8A8278', lineHeight: 1.5 }}>{d.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '20px', color: d.border, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── GAME OVER SCREEN ─────────────────────────────────────────────────────────
  if (gameState === 'gameover') {
    const wonCount = gameHistory.filter(h => h.won).length
    const total    = gameHistory.length

    return (
      <div style={{ backgroundColor: '#F4F1E6', height: 'calc(100dvh - 60px)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Fixed: header + stats */}
        <div style={{ flexShrink: 0, padding: '20px 16px 0' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-0.5px' }}>{t('gameOver')}</h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{total} {locale === 'fr' ? 'drapeaux' : 'flags'} · {formatTime(elapsed)}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: locale === 'fr' ? 'Trouvés' : 'Found',            value: `${wonCount}/${total}`,           color: '#426A5A', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: locale === 'fr' ? 'Meilleure série' : 'Best streak', value: `🔥 ${streak}`,                color: '#806D40', bg: '#fefce8', border: '#fde68a' },
                { label: locale === 'fr' ? 'Temps' : 'Time',               value: formatTime(elapsed),             color: '#0B1F3B', bg: 'white',   border: '#e2e8f0' },
                { label: 'Score',                                            value: `⭐ ${score.toLocaleString()}`,  color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, borderRadius: '14px', border: `1px solid ${s.border}`, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable: flag history */}
        {gameHistory.length > 0 && (
          <div style={{ flex: 1, minHeight: 0, padding: '0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {locale === 'fr' ? 'Historique' : 'History'}
                </p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {gameHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '10px', backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                      <img src={`https://flagcdn.com/w80/${h.flag.code}.png`} alt="" style={{ width: '40px', height: '27px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#e8e4d9', flexShrink: 0, padding: '2px', border: '1px solid #e2e8f0' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(h.flag)}</div>
                        <div style={{ fontSize: '11px', color: h.won ? '#16a34a' : '#dc2626', marginTop: '1px' }}>
                          {h.won ? `${locale === 'fr' ? 'Trouvé en' : 'Found in'} ${h.guessCount} ${locale === 'fr' ? 'essai(s)' : 'guess(es)'}` : locale === 'fr' ? 'Non trouvé' : 'Not found'}
                        </div>
                      </div>
                      <span style={{ fontSize: '16px' }}>{h.won ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky buttons */}
        <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: '#F4F1E6', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => { setLives(MAX_LIVES); setStreak(0); scoreRef.current = 0; setScore(0); setElapsed(0); setGameHistory([]); startNewFlag(); setGameState('playing'); startSessionTimer() }}
            style={{ width: '100%', padding: '16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {locale === 'fr' ? 'Rejouer' : 'Play Again'}
          </button>
          <button onClick={() => { setLives(MAX_LIVES); setStreak(0); scoreRef.current = 0; setScore(0); setElapsed(0); setGameHistory([]); setDifficulty(null) }}
            style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: '#0B1F3B', border: '1.5px solid #cbd5e1', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            {locale === 'fr' ? 'Changer de mode' : 'Change mode'}
          </button>
        </div>
      </div>
    )
  }

  // ── MOBILE PLAYING ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', height: 'calc(100dvh - 60px)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', overflow: 'hidden', position: 'relative' }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px 0', flexShrink: 0 }}>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0B1F3B' }}>{t('title')}</span>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', backgroundColor: difficulty === 'easy' ? 'rgba(74,222,128,0.15)' : 'rgba(254,177,47,0.15)', color: difficulty === 'easy' ? '#4ade80' : '#FEB12F', border: `1px solid ${difficulty === 'easy' ? 'rgba(74,222,128,0.3)' : 'rgba(254,177,47,0.3)'}` }}>
            {difficulty === 'easy' ? (locale === 'fr' ? 'Entraînement' : 'Training') : 'Normal'}
          </span>
        </div>

        <div style={{ flex: '0 0 8px' }} />

        {/* HUD pills */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '5px', padding: '0 12px 6px', flexShrink: 0, overflowX: 'auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', border: '1px solid #E2DDD5', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#8A8278', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{locale === 'fr' ? 'Vies' : 'Lives'}</div>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : '#E2DDD5'}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', border: '1px solid #E2DDD5', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#8A8278', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Time</div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#0B1F3B', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</div>
          </div>
          <div style={{ backgroundColor: streak > 0 ? 'rgba(254,177,47,0.12)' : 'white', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', border: `1px solid ${streak > 0 ? 'rgba(254,177,47,0.3)' : '#E2DDD5'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: streak > 0 ? 'rgba(254,177,47,0.8)' : '#8A8278', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Streak</div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: streak > 0 ? '#FEB12F' : '#CBD5E1' }}>🔥 {streak}</div>
          </div>
          {difficulty !== 'easy' && (
            <div style={{ position: 'relative', backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(74,222,128,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Score</div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#16a34a', whiteSpace: 'nowrap' }}>{score} pts</div>
              {lastPts && (
                <span style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '900', color: '#4ade80', animation: 'floatUp 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none' }}>+{lastPts}</span>
              )}
            </div>
          )}
          {/* Quit button — opens confirm modal */}
          <button onClick={() => setShowQuitConfirm(true)}
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{locale === 'fr' ? 'Quitter' : 'Quit'}</div>
            <div style={{ fontSize: '14px', lineHeight: 1 }}>🚪</div>
          </button>
        </div>

        {/* Flag */}
        <div style={{ flex: 1, minHeight: 0, margin: '0 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {canvasBlock}

          {/* Guess chips — just below the canvas */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flexShrink: 0 }}>
            {guesses.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '99px', backgroundColor: g.correct ? '#f0fdf4' : '#fff1f2', border: '1px solid '+(g.correct ? '#86efac' : '#fca5a5') }}>
                <img src={'https://flagcdn.com/w40/'+g.code+'.png'} width="18" height="12" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                <span style={{ fontSize: '11px', fontWeight: '700', color: g.correct ? '#166534' : '#991b1b' }}>{g.similarity}%</span>
              </div>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <div key={'e'+i} style={{ width: '32px', height: '22px', borderRadius: '99px', backgroundColor: '#E2DDD5' }} />
            ))}
          </div>
        </div>

        {/* Bottom panel */}
        <div style={{ flexShrink: 0, backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '7px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>

          {/* Current input display + suggestions */}
          <div style={{ position: 'relative' }}>
            {/* Typed word display */}
            <div style={{ padding: '9px 14px', borderRadius: '12px', border: '2px solid #E2DDD5', backgroundColor: gameState === 'playing' ? 'white' : '#F4F1E6', minHeight: '42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: input ? '#0B1F3B' : '#B0A89E', letterSpacing: '0.5px' }}>
                {input || (gameState === 'playing' ? (locale === 'fr' ? 'Tape un pays…' : 'Type a country…') : '')}
              </span>
              {input.length > 0 && gameState === 'playing' && (
                <button onClick={() => { setInput(''); setSuggestions([]); suggestionsRef.current = [] }}
                  style={{ background: '#E2DDD5', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px', color: '#8A8278', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
              )}
            </div>

            {/* Suggestions — above keyboard */}
            {suggestions.length > 0 && gameState === 'playing' && (
              <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2DDD5', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 20, marginBottom: '4px' }}>
                {suggestions.map((f, i) => (
                  <button key={f.code} onMouseDown={e => { e.preventDefault(); handleGuess(f) }}
                    style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: i === activeIdx ? '#dbeafe' : 'transparent', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: '14px', fontWeight: '600', color: '#0B1F3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {difficulty === 'easy' && <img src={'https://flagcdn.com/w40/'+f.code+'.png'} width="26" height="17" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(f)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AZERTY / QWERTY keyboard */}
          {gameState === 'playing' && (() => {
            const isAzerty = locale === 'fr'
            const rows = isAzerty
              ? [
                  { keys: ['A','Z','E','R','T','Y','U','I','O','P'], offset: 0 },
                  { keys: ['Q','S','D','F','G','H','J','K','L','M'], offset: 0.5 },
                  { keys: ['W','X','C','V','B','N','←'],             offset: 1.5 },
                ]
              : [
                  { keys: ['Q','W','E','R','T','Y','U','I','O','P'], offset: 0 },
                  { keys: ['A','S','D','F','G','H','J','K','L'],     offset: 0.5 },
                  { keys: ['Z','X','C','V','B','N','M','←'],         offset: 1 },
                ]
            const KEY_W = 30   // approx key width in px — used for offset calculation
            const GAP   = 4
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {rows.map(({ keys, offset }, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: `${GAP}px`, paddingLeft: `${offset * (KEY_W + GAP)}px` }}>
                    {keys.map(key => {
                      const isBack = key === '←'
                      return (
                        <button key={key}
                          onMouseDown={e => {
                            e.preventDefault()
                            if (isBack) {
                              const next = input.slice(0, -1)
                              setInput(next)
                              if (next.length < 2) { setSuggestions([]); suggestionsRef.current = []; setActiveIdx(0); activeIdxRef.current = 0; return }
                              const filtered = flags.filter(f => normalize(getName(f)).includes(normalize(next)) && !guesses.find(g => g.code === f.code)).slice(0, 6)
                              setSuggestions(filtered); suggestionsRef.current = filtered; setActiveIdx(0); activeIdxRef.current = 0
                            } else {
                              const next = input + key
                              setInput(next)
                              if (next.length < 2) { setSuggestions([]); suggestionsRef.current = []; return }
                              const filtered = flags.filter(f => normalize(getName(f)).includes(normalize(next)) && !guesses.find(g => g.code === f.code)).slice(0, 6)
                              setSuggestions(filtered); suggestionsRef.current = filtered; setActiveIdx(0); activeIdxRef.current = 0
                            }
                          }}
                          style={{
                            width: isBack ? `${KEY_W * 2 + GAP}px` : `${KEY_W}px`,
                            flexShrink: 0,
                            padding: '9px 0',
                            borderRadius: '8px',
                            border: '1px solid #E2DDD5',
                            backgroundColor: isBack ? '#F4F1E6' : 'white',
                            color: isBack ? '#8A8278' : '#0B1F3B',
                            fontSize: isBack ? '14px' : '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            textAlign: 'center',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            userSelect: 'none',
                          }}>
                          {key}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })()}

          {factBlock}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setHowToPlayOpen(true)} style={{ padding: '8px 12px', background: '#F4F1E6', border: '1px solid #E2DDD5', borderRadius: '10px', color: '#8A8278', cursor: 'pointer', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
              {t('howToPlay')}
            </button>
            <div style={{ flex: 1 }}>{actionButton}</div>
          </div>
        </div>

        {/* Quit confirm modal */}
        {showQuitConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', padding: '0' }}>
            <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              <div style={{ width: '36px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '99px', margin: '0 auto 20px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#0B1F3B', textAlign: 'center' }}>
                {locale === 'fr' ? 'Quitter la partie ?' : 'Quit the game?'}
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6, textAlign: 'center' }}>
                {locale === 'fr' ? `Ton score de ${score} pts sera sauvegardé.` : `Your score of ${score} pts will be saved.`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => { setShowQuitConfirm(false); endGame() }}
                  style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                  {locale === 'fr' ? 'Quitter et sauvegarder' : 'Quit & save'}
                </button>
                <button onClick={() => setShowQuitConfirm(false)}
                  style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', color: '#0B1F3B', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {locale === 'fr' ? 'Continuer à jouer' : 'Keep playing'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How to play modal */}
        {howToPlayOpen && (
          <div onClick={() => setHowToPlayOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.85)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '20px', maxWidth: '480px', width: '100%', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button onClick={() => setHowToPlayOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '99px', width: '28px', height: '28px', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[['🏳️', t('rules.1')], ['🔍', t('rules.2')], ['🔥', t('rules.3')], ['❤️', t('rules.4')]].map(([icon, text], i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px' }}>{icon}</span>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── DESKTOP ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#F4F1E6', height: 'calc(100vh - 60px)', overflow: 'hidden', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '12px 24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1F3B', margin: 0, letterSpacing: '-0.5px' }}>{t('title')}</h1>
            <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '99px', backgroundColor: difficulty === 'easy' ? 'rgba(74,222,128,0.15)' : 'rgba(254,177,47,0.15)', color: difficulty === 'easy' ? '#4ade80' : '#FEB12F', border: `1px solid ${difficulty === 'easy' ? 'rgba(74,222,128,0.3)' : 'rgba(254,177,47,0.3)'}` }}>
              {difficulty === 'easy' ? (locale === 'fr' ? 'Entraînement' : 'Training') : 'Normal'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            {[
              { label: locale === 'fr' ? 'Vies' : 'Lives', content: <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>{Array.from({ length: MAX_LIVES }).map((_, i) => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : '#E2DDD5'}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>)}</div> },
              { label: 'Time', content: <div style={{ fontSize: '16px', fontWeight: '900', color: '#0B1F3B', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</div> },
              { label: 'Streak', content: <div style={{ fontSize: '16px', fontWeight: '900', color: streak > 0 ? '#FEB12F' : '#CBD5E1' }}>🔥 {streak}</div>, highlight: streak > 0 },
            ].map((pill, i) => (
              <div key={i} style={{ backgroundColor: pill.highlight ? 'rgba(254,177,47,0.15)' : 'white', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: pill.highlight ? '1px solid rgba(254,177,47,0.3)' : '1px solid #E2DDD5', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: pill.highlight ? 'rgba(254,177,47,0.7)' : '#8A8278', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{pill.label}</div>
                {pill.content}
              </div>
            ))}
            {difficulty !== 'easy' && (
              <div style={{ position: 'relative', backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.4)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(74,222,128,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Score</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80', whiteSpace: 'nowrap' }}>{score.toLocaleString()} pts</div>
                {lastPts && <span style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', fontSize: '14px', fontWeight: '900', color: '#4ade80', animation: 'floatUp 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none', backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: '99px', padding: '2px 8px' }}>+{lastPts} pts</span>}
              </div>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
              <button onClick={() => setShowQuitConfirm(true)} onMouseEnter={() => setShowQuitTip(true)} onMouseLeave={() => setShowQuitTip(false)}
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: '60px', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{locale === 'fr' ? 'Quitter' : 'Quit'}</div>
                <div style={{ fontSize: '16px', lineHeight: 1 }}>🚪</div>
              </button>
              {showQuitTip && (
                <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: '#1e293b', color: 'white', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  {locale === 'fr' ? 'Quitter et sauvegarder' : 'Quit and save score'}
                  <div style={{ position: 'absolute', top: '-5px', right: '12px', width: '10px', height: '10px', backgroundColor: '#1e293b', transform: 'rotate(45deg)' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{canvasBlock}</div>
          <div style={{ width: '300px', flexShrink: 0, backgroundColor: 'white', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #E2DDD5', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ position: 'relative' }}>
              <input ref={inputRef} type="text" value={input}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={gameState === 'playing' ? t('placeholder') : ''}
                disabled={gameState !== 'playing'}
                autoComplete="off"
                style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '2px solid #E2DDD5', backgroundColor: gameState === 'playing' ? 'white' : '#F4F1E6', color: '#0B1F3B', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              {suggestions.length > 0 && gameState === 'playing' && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2DDD5', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 20, marginTop: '4px' }}>
                  {suggestions.map((f, i) => (
                    <button key={f.code} onMouseDown={e => { e.preventDefault(); handleGuess(f) }}
                      style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: i === activeIdx ? '#dbeafe' : 'transparent', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: '14px', fontWeight: '600', color: '#0B1F3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {difficulty === 'easy' && <img src={'https://flagcdn.com/w40/'+f.code+'.png'} width="28" height="18" style={{ borderRadius: '2px', objectFit: 'cover' }} />}
                      {getName(f)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {guesses.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', backgroundColor: g.correct ? '#f0fdf4' : '#fff1f2', border: '1px solid '+(g.correct ? '#86efac' : '#fca5a5') }}>
                  <img src={'https://flagcdn.com/w40/'+g.code+'.png'} width="30" height="20" style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(g)}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: g.correct ? '#4ade80' : '#f87171' }}>{g.similarity}%</span>
                </div>
              ))}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div key={'e'+i} style={{ padding: '9px 12px', borderRadius: '10px', backgroundColor: '#F8F7F4', border: '1px solid #E2DDD5', height: '42px' }} />
              ))}
            </div>
            <button onClick={() => setHowToPlayOpen(true)} style={{ width: '100%', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0B1F3B', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
              <span>{t('howToPlay')}</span><span style={{ fontSize: '12px', opacity: 0.7 }}>→</span>
            </button>
            {factBlock}
            <div style={{ marginTop: '4px' }}>{actionButton}</div>
          </div>
        </div>
      </div>

      {/* Quit confirm modal — desktop */}
      {showQuitConfirm && (
        <div style={{ position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚪</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#0B1F3B' }}>{locale === 'fr' ? 'Quitter la partie ?' : 'Quit the game?'}</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              {locale === 'fr' ? `Ton score actuel de ${score} pts sera sauvegardé.` : `Your current score of ${score} pts will be saved.`}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowQuitConfirm(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#F4F1E6', color: '#0B1F3B', border: '1px solid #E2DDD5', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {locale === 'fr' ? 'Continuer' : 'Keep playing'}
              </button>
              <button onClick={() => { setShowQuitConfirm(false); endGame() }} style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {locale === 'fr' ? 'Quitter' : 'Quit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to play modal — desktop */}
      {howToPlayOpen && (
        <div onClick={() => setHowToPlayOpen(false)} style={{ position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,31,59,0.85)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '20px', maxWidth: '480px', width: '100%', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button onClick={() => setHowToPlayOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '99px', width: '28px', height: '28px', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['🏳️', t('rules.1')], ['🔍', t('rules.2')], ['🔥', t('rules.3')], ['❤️', t('rules.4')]].map(([icon, text], i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>{icon}</span>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
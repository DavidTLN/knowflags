'use client'

// Drapeau du jour : un drapeau par jour, le même pour tout le monde, 5 essais.
// Chaque essai affiche un % de ressemblance et révèle les tuiles de couleur proche
// (même moteur que FlagReveal). Une seule partie par jour.
// Visiteur : résultats gardés dans le navigateur. Membre : en base (daily_flag_results),
// avec la série, les statistiques et le classement du jour.
//
// Archives (comme le puzzle du jour de chess.com) : un calendrier permet de jouer
// les jours manqués (?day=YYYY-MM-DD). Un jour terminé reçoit une coche. Un jour
// rattrapé plus tard est marqué late : il ne compte ni dans la série ni au classement.

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import GameIcon from '@/components/games/GameIcon'
import {
  DAILY_EPOCH, DAILY_MAX_GUESSES, zurichDayKey, dayIndex, dayNumber, dailyIso, secondsToNextDay,
  readLocal, writeLocalDay, computeStats, shareText, shiftDayKey, dayKeyToDate, isPlayableDay,
} from '@/lib/dailyFlag'

const C = {
  navy: '#16324F', navyLight: '#1E4976', gold: '#F4B400', goldDark: '#92400E',
  green: '#16A34A', greenLight: '#DCFCE7', red: '#D62828', redLight: '#FEE2E2',
  bg: '#F4F1E6', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF', steel: '#9EB7E5',
}

const TILE = 20
const W = 480
const H = 320
const COLS = W / TILE
const ROWS = H / TILE

function normalize(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function allTiles() {
  const s = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) s.push(`${r}-${c}`)
  return s
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const flagSrc = (iso) => `https://flagcdn.com/w640/${iso}.png`

function formatCountdown(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h} h ${String(m).padStart(2, '0')} min`
}

export default function DailyFlag() {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const canvasRef = useRef(null)
  const targetImg = useRef(null)
  const inputRef = useRef(null)

  const [todayKey, setTodayKey] = useState(() => zurichDayKey())
  const [activeKey, setActiveKey] = useState(() => zurichDayKey())   // jour joué (aujourd'hui ou archive)
  const [view, setView] = useState('game')                            // game | archive
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [dbResults, setDbResults] = useState([])
  const [day, setDay] = useState(null)          // { iso, guesses, revealed, won, done }
  const [imgReady, setImgReady] = useState(false)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [fact, setFact] = useState(null)
  const [board, setBoard] = useState([])
  const [countdown, setCountdown] = useState(() => secondsToNextDay())
  const [copied, setCopied] = useState(false)
  const [howTo, setHowTo] = useState(false)

  const isArchive = activeKey !== todayKey
  const number = dayNumber(activeKey)
  const isoList = useMemo(() => countries.map(c => c.iso_code), [countries])
  const targetIso = useMemo(() => (isoList.length ? dailyIso(isoList, activeKey) : null), [isoList, activeKey])
  const byIso = useMemo(() => Object.fromEntries(countries.map(c => [c.iso_code, c])), [countries])
  const nameOf = (iso) => { const c = byIso[iso]; return c ? (locale === 'fr' ? c.name_fr : c.name_en) : iso }

  // ── Chargement : pays souverains + session ─────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    sb.from('countries').select('iso_code, name_en, name_fr').eq('entity_type', 'sovereign')
      .then(({ data }) => { setCountries(data || []); setLoading(false) })
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
    // Lien direct vers un jour des archives : ?day=YYYY-MM-DD
    const fromUrl = new URLSearchParams(window.location.search).get('day')
    if (isPlayableDay(fromUrl, zurichDayKey())) setActiveKey(fromUrl)
    return () => subscription.unsubscribe()
  }, [])

  // ── Résultats du membre + envoi des parties jouées en visiteur ─────────────
  useEffect(() => {
    if (!user) { setDbResults([]); return }
    const sb = createClient()
    let cancelled = false
    ;(async () => {
      const { data } = await sb.from('daily_flag_results')
        .select('day, iso_code, guesses, won, late').eq('user_id', user.id).order('day')
      const rows = data || []
      // Parties terminées en visiteur dans les 60 derniers jours, absentes de la base
      const have = new Set(rows.map(r => r.day))
      const local = readLocal().days
      const minKey = shiftDayKey(zurichDayKey(), -60)
      const missing = Object.entries(local)
        .filter(([k, d]) => d?.done && k >= minKey && !have.has(k) && d.guesses?.length)
        .map(([k, d]) => ({ user_id: user.id, day: k, iso_code: d.iso, guesses: d.guesses.length, won: !!d.won, late: !!d.late }))
      if (missing.length) {
        await sb.from('daily_flag_results').upsert(missing, { onConflict: 'user_id,day', ignoreDuplicates: true })
        rows.push(...missing.map(({ user_id, ...r }) => r))
      }
      if (!cancelled) setDbResults(rows)
    })()
    return () => { cancelled = true }
  }, [user])

  // ── État du jour : partie locale, sinon résultat en base, sinon nouvelle partie ─
  useEffect(() => {
    if (!targetIso) return
    const local = readLocal().days[activeKey]
    if (local && local.iso === targetIso) { setDay(local); return }
    const fromDb = dbResults.find(r => r.day === activeKey)
    if (fromDb) {
      setDay({ iso: targetIso, guesses: [], revealed: allTiles(), won: fromDb.won, done: true, guessCount: fromDb.guesses, late: !!fromDb.late })
      return
    }
    setDay({ iso: targetIso, guesses: [], revealed: [], won: false, done: false, late: activeKey !== zurichDayKey() })
  }, [targetIso, activeKey, dbResults])

  // ── Image du drapeau cible ─────────────────────────────────────────────────
  useEffect(() => {
    if (!targetIso) return
    setImgReady(false)
    loadImage(flagSrc(targetIso)).then(img => { targetImg.current = img; setImgReady(true) }).catch(() => {})
  }, [targetIso])

  // ── Dessin des tuiles ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgReady || !day) return
    const ctx = canvas.getContext('2d')
    const img = targetImg.current
    const shown = new Set(day.revealed)
    ctx.clearRect(0, 0, W, H)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE, y = r * TILE
        if (shown.has(`${r}-${c}`)) {
          ctx.drawImage(img, (x / W) * img.naturalWidth, (y / H) * img.naturalHeight,
            (TILE / W) * img.naturalWidth, (TILE / H) * img.naturalHeight, x, y, TILE, TILE)
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1E4976' : '#21507F'
          ctx.fillRect(x, y, TILE, TILE)
        }
      }
    }
  }, [imgReady, day])

  // ── Fin de partie : anecdote + classement du jour ──────────────────────────
  useEffect(() => {
    if (!day?.done || !targetIso) return
    const sb = createClient()
    sb.from('country_facts').select('fact_en, fact_fr').eq('country_code', targetIso)
      .then(({ data }) => { if (data?.length) setFact(data[Math.floor(Math.random() * data.length)]) })
    if (!isArchive) loadBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.done, targetIso])

  async function loadBoard() {
    const sb = createClient()
    const { data } = await sb.from('daily_flag_results')
      .select('user_id, guesses, created_at').eq('day', todayKey).eq('won', true).eq('late', false)
      .order('guesses').order('created_at').limit(10)
    if (!data?.length) { setBoard([]); return }
    const { data: profiles } = await sb.from('profiles').select('user_id, username').in('user_id', data.map(d => d.user_id))
    const names = Object.fromEntries((profiles || []).map(p => [p.user_id, p.username]))
    setBoard(data.map(d => ({ ...d, username: names[d.user_id] || t('Player', 'Joueur') })))
  }

  // ── Compte à rebours, et bascule au jour suivant ───────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(secondsToNextDay())
      const k = zurichDayKey()
      if (k !== todayKey) {
        // Minuit : celui qui était sur le drapeau du jour passe au nouveau
        if (activeKey === todayKey) { setActiveKey(k); setFact(null); setBoard([]) }
        setTodayKey(k)
      }
    }, 30000)
    return () => clearInterval(id)
  }, [todayKey, activeKey])

  // ── Changer de jour (calendrier des archives) ──────────────────────────────
  function openDay(key) {
    if (!isPlayableDay(key, todayKey)) return
    setView('game')
    if (key !== activeKey) {
      setDay(null); setFact(null); setBoard([]); setInput(''); setSuggestions([])
      setActiveKey(key)
    }
    try {
      const url = new URL(window.location.href)
      if (key === todayKey) url.searchParams.delete('day'); else url.searchParams.set('day', key)
      window.history.replaceState(window.history.state, '', url)
    } catch { /* l'URL reste celle du jour */ }
    window.scrollTo({ top: 0 })
  }

  // État de chaque jour pour le calendrier : won | lost | progress
  const dayStatus = useMemo(() => {
    const m = {}
    for (const r of dbResults) m[r.day] = r.won ? 'won' : 'lost'
    const local = readLocal().days
    for (const [k, d] of Object.entries(local)) {
      if (!d || m[k]) continue
      if (d.done) m[k] = d.won ? 'won' : 'lost'
      else if (d.guesses?.length) m[k] = 'progress'
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbResults, day])

  // ── Ressemblance (même moteur que FlagReveal) ──────────────────────────────
  async function similarity(guessIso) {
    const tc = document.createElement('canvas'); tc.width = W; tc.height = H
    tc.getContext('2d').drawImage(targetImg.current, 0, 0, W, H)
    const tData = tc.getContext('2d').getImageData(0, 0, W, H).data
    const gImg = await loadImage(flagSrc(guessIso))
    const gc = document.createElement('canvas'); gc.width = W; gc.height = H
    gc.getContext('2d').drawImage(gImg, 0, 0, W, H)
    const gData = gc.getContext('2d').getImageData(0, 0, W, H).data

    const palette = []
    for (let i = 0; i < gData.length; i += 16) if (gData[i + 3] > 128) palette.push([gData[i], gData[i + 1], gData[i + 2]])
    const hits = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = ((r * TILE + TILE / 2) * W + (c * TILE + TILE / 2)) * 4
        if (tData[i + 3] < 128 || gData[i + 3] < 128) continue
        const [tR, tG, tB] = [tData[i], tData[i + 1], tData[i + 2]]
        if (!palette.some(([pR, pG, pB]) => Math.abs(tR - pR) + Math.abs(tG - pG) + Math.abs(tB - pB) < 150)) continue
        const dist = Math.hypot(tR - gData[i], tG - gData[i + 1], tB - gData[i + 2])
        if (dist < 65) hits.push(`${r}-${c}`)
      }
    }
    const pct = Math.round((hits.length / (ROWS * COLS)) * 100)
    return { pct, hits: pct >= 5 ? hits : [] }
  }

  // ── Essai ──────────────────────────────────────────────────────────────────
  async function guess(iso) {
    if (!day || day.done || busy || !imgReady) return
    if (day.guesses.some(g => g.code === iso)) return
    setBusy(true); setInput(''); setSuggestions([])
    const correct = iso === day.iso
    let pct = 100, hits = []
    if (!correct) {
      try { ({ pct, hits } = await similarity(iso)) } catch { pct = 0 }
    }
    const guesses = [...day.guesses, { code: iso, pct, correct }]
    const done = correct || guesses.length >= DAILY_MAX_GUESSES
    const revealed = done ? allTiles() : [...new Set([...day.revealed, ...hits])]
    // Un jour terminé après sa date compte comme rattrapé (archives)
    const late = !!day.late || activeKey !== zurichDayKey()
    const next = { ...day, guesses, revealed, won: correct, done, late }
    setDay(next)
    writeLocalDay(activeKey, next)
    if (done && user) {
      const sb = createClient()
      const row = { user_id: user.id, day: activeKey, iso_code: day.iso, guesses: guesses.length, won: correct, late }
      await sb.from('daily_flag_results').upsert(row, { onConflict: 'user_id,day', ignoreDuplicates: true })
      setDbResults(r => r.some(x => x.day === activeKey) ? r : [...r, { day: activeKey, iso_code: day.iso, guesses: guesses.length, won: correct, late }])
    }
    setBusy(false)
    if (!done) setTimeout(() => inputRef.current?.focus(), 50)
  }

  function onInput(val) {
    setInput(val)
    if (val.trim().length < 2) { setSuggestions([]); return }
    const q = normalize(val)
    const tried = new Set((day?.guesses || []).map(g => g.code))
    const list = countries
      .filter(c => !tried.has(c.iso_code) && (normalize(c.name_fr).includes(q) || normalize(c.name_en).includes(q)))
      .sort((a, b) => normalize(nameOf(a.iso_code)).indexOf(q) - normalize(nameOf(b.iso_code)).indexOf(q))
      .slice(0, 6)
    setSuggestions(list); setActiveIdx(0)
  }

  function onKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); const s = suggestions[activeIdx]; if (s) guess(s.iso_code) }
  }

  // ── Statistiques ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (user) return computeStats(dbResults.map(r => ({ day: r.day, won: r.won, late: !!r.late })), todayKey)
    const local = readLocal().days
    return computeStats(Object.entries(local).filter(([, d]) => d?.done).map(([k, d]) => ({ day: k, won: !!d.won, late: !!d.late })), todayKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dbResults, day, todayKey])

  async function share() {
    const text = shareText({ number, guesses: day.guesses.length ? day.guesses : Array.from({ length: day.guessCount || 1 }, (_, i) => ({ correct: day.won && i === (day.guessCount || 1) - 1, pct: 0 })), won: day.won, locale, dayKey: isArchive ? activeKey : null })
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { await navigator.share({ text }); return }
      await navigator.clipboard.writeText(text)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch { /* partage annulé */ }
  }

  if (loading) return <PageLoader label={t('Loading...', 'Chargement...')} />

  const calendar = (
    <DayCalendar todayKey={todayKey} activeKey={activeKey} status={dayStatus} onPick={openDay} locale={locale} t={t} />
  )

  // ════════════════════════════ ARCHIVES ════════════════════════════
  if (view === 'archive') {
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.bg, fontFamily: 'var(--font-body), system-ui, sans-serif', color: C.text }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '12px 16px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button type="button" onClick={() => setView('game')}
            style={{ alignSelf: 'flex-start', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, color: C.navy, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <GameIcon name="chevronLeft" size={18} color={C.navy} />
            {isArchive ? t('Back to the game', 'Retour à la partie') : t('Flag of the day', 'Drapeau du jour')}
          </button>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.green, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: C.green, borderRadius: '2px' }} />
              {t('Archive', 'Archives')}
            </p>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em' }}>{t('Previous days', 'Jours précédents')}</h1>
            <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: 1.6, color: C.muted }}>
              {t(
                'Play the flags you missed. Each finished day gets a check. Days caught up later do not count in your streak.',
                'Rejoue les drapeaux que tu as manqués. Chaque jour terminé reçoit une coche. Les jours rattrapés ne comptent pas dans ta série.'
              )}
            </p>
          </div>
          {calendar}
        </div>
      </div>
    )
  }

  if (!day) return <PageLoader label={t('Loading...', 'Chargement...')} />

  const dateLabel = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(dayKeyToDate(activeKey))
  const guessCount = day.guesses.length || day.guessCount || 0
  const linkBtn = { minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

  // ════════════════════════════ EN JEU ════════════════════════════
  if (!day.done) {
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.navy, color: 'white', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold }}>
                {isArchive ? t('Flag of the day · archive', 'Drapeau du jour · archives') : t('Flag of the day', 'Drapeau du jour')}
              </p>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
                {t('No.', 'n°')} {number} · {dateLabel}
              </h1>
            </div>
            {isArchive ? (
              <button type="button" onClick={() => openDay(todayKey)}
                style={{ minHeight: '36px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9999px', border: 'none', backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('Today', 'Aujourd’hui')}
              </button>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(244,180,0,0.16)', color: C.gold, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                <GameIcon name="flame" size={15} color={C.gold} />
                {t('Streak', 'Série')} {stats.current}
              </span>
            )}
          </div>
          {isArchive && (
            <p style={{ margin: '-8px 0 0', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' }}>
              {t('Catch-up day: it earns a check, not a streak.', 'Jour rattrapé : il te donne une coche, pas de série.')}
            </p>
          )}

          <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 2' }}>
            <canvas ref={canvasRef} width={W} height={H} aria-label={t('Mystery flag', 'Drapeau mystère')}
              style={{ width: '100%', height: '100%', display: 'block', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', backgroundColor: C.navyLight }} />
            {!imgReady && <div style={{ position: 'absolute', inset: 0 }}><PageLoader inline /></div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {t(`Guess ${guessCount + 1} of ${DAILY_MAX_GUESSES}`, `Essai ${guessCount + 1} sur ${DAILY_MAX_GUESSES}`)}
            </span>
            <div style={{ display: 'flex', gap: '6px' }} aria-hidden="true">
              {Array.from({ length: DAILY_MAX_GUESSES }).map((_, i) => (
                <span key={i} style={{ width: '12px', height: '12px', borderRadius: '9999px', boxSizing: 'border-box', ...(i < guessCount ? { backgroundColor: C.gold } : { border: '2px solid rgba(255,255,255,0.4)' }) }} />
              ))}
            </div>
          </div>

          {day.guesses.length > 0 && (
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {day.guesses.map((g, i) => (
                <li key={g.code} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 600 }}>
                    <span>{i + 1}. {nameOf(g.code)}</span>
                    <span style={{ color: g.pct >= 60 ? C.gold : 'rgba(255,255,255,0.7)' }}>{g.pct} %</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    <div style={{ width: `${g.pct}%`, height: '6px', borderRadius: '9999px', backgroundColor: g.pct >= 60 ? C.gold : C.steel, transition: 'width 0.4s ease' }} />
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div style={{ position: 'relative' }}>
            {suggestions.length > 0 && (
              <ul role="listbox" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, margin: 0, padding: '6px', listStyle: 'none', backgroundColor: C.surface, borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 5 }}>
                {suggestions.map((s, i) => (
                  <li key={s.iso_code} role="option" aria-selected={i === activeIdx}>
                    <button type="button" onMouseDown={e => { e.preventDefault(); guess(s.iso_code) }}
                      style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: 'none', borderRadius: '8px', backgroundColor: i === activeIdx ? C.secondary : 'transparent', color: C.text, fontSize: '15px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      {nameOf(s.iso_code)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={e => { e.preventDefault(); const s = suggestions[activeIdx]; if (s) guess(s.iso_code) }} style={{ display: 'flex', gap: '8px' }}>
              <label htmlFor="daily-guess" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('Your country', 'Ton pays')}</label>
              <input id="daily-guess" ref={inputRef} value={input} autoComplete="off" disabled={busy || !imgReady}
                onChange={e => onInput(e.target.value)} onKeyDown={onKeyDown}
                placeholder={t('Type a country…', 'Tape un pays…')}
                style={{ flex: 1, minWidth: 0, height: '48px', boxSizing: 'border-box', padding: '0 14px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }} />
              <button type="submit" disabled={busy || !suggestions.length}
                style={{ height: '48px', padding: '0 20px', borderRadius: '10px', border: 'none', backgroundColor: suggestions.length ? C.gold : 'rgba(255,255,255,0.15)', color: suggestions.length ? '#3A2A05' : 'rgba(255,255,255,0.5)', fontSize: '15px', fontWeight: 700, cursor: suggestions.length ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background-color 0.12s ease' }}>
                {busy ? '…' : t('Guess', 'Valider')}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button type="button" onClick={() => setHowTo(v => !v)} style={{ ...linkBtn, color: C.steel }}>
              {t('How to play?', 'Comment jouer ?')}
            </button>
            <button type="button" onClick={() => setView('archive')} style={{ ...linkBtn, color: C.steel }}>
              <GameIcon name="calendar" size={16} color={C.steel} />
              {t('Previous days', 'Jours précédents')}
            </button>
          </div>
          {howTo && (
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
              {t(
                'One flag a day, the same for everyone. You have 5 guesses. Each guess shows how close its flag is, and reveals the tiles whose colours match. A new flag arrives at midnight (Swiss time). Missed a day? Play it from Previous days.',
                'Un drapeau par jour, le même pour tout le monde. Tu as 5 essais. Chaque essai indique à quel point son drapeau ressemble au drapeau mystère et révèle les tuiles de couleur proche. Nouveau drapeau à minuit (heure suisse). Un jour manqué ? Rejoue-le depuis Jours précédents.'
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════ FIN DE PARTIE ════════════════════════════
  const card = { backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)' }
  return (
    <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.bg, fontFamily: 'var(--font-body), system-ui, sans-serif', color: C.text }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isArchive && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.muted }}>
              {t('Archive', 'Archives')} · {t('No.', 'n°')} {number} · {dateLabel}
            </span>
            <button type="button" onClick={() => openDay(todayKey)} style={{ ...linkBtn, color: C.navy, padding: 0 }}>
              {t('Flag of the day', 'Drapeau du jour')}
              <GameIcon name="chevronRight" size={16} color={C.navy} />
            </button>
          </div>
        )}
        <section style={{ ...card, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: day.won ? C.green : C.red }}>
            {day.won
              ? t(`Found in ${guessCount} ${guessCount > 1 ? 'guesses' : 'guess'}`, `Trouvé en ${guessCount} essai${guessCount > 1 ? 's' : ''}`)
              : isArchive ? t('Not found', 'Pas trouvé') : t('Not found today', 'Pas trouvé aujourd’hui')}
          </p>
          <img src={`https://flagcdn.com/w320/${day.iso}.png`} alt={nameOf(day.iso)}
            style={{ width: '180px', height: 'auto', borderRadius: '6px', boxShadow: '0 2px 8px rgba(22,50,79,0.15)' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em' }}>{nameOf(day.iso)}</h1>
          {fact && <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: C.muted }}>{locale === 'fr' ? fact.fact_fr : fact.fact_en}</p>}
          <Link prefetch={false} href={`/${locale}/countries/${day.iso}`} style={{ fontSize: '13px', fontWeight: 700, color: C.navy, minHeight: '44px', display: 'flex', alignItems: 'center' }}>
            {t('See the country page', 'Voir la fiche du pays')}
          </Link>
        </section>

        {!isArchive && <section aria-label={t('Statistics', 'Statistiques')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
          {[
            [stats.current, t('day streak', 'jours de série')],
            [stats.best, t('best streak', 'meilleure série')],
            [stats.played, t('played', 'parties')],
            [`${stats.winRate} %`, t('win rate', 'réussite')],
          ].map(([v, l]) => (
            <div key={l} style={{ ...card, boxShadow: 'none', padding: '10px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: C.navy }}>{v}</div>
              <div style={{ fontSize: '11px', color: C.muted }}>{l}</div>
            </div>
          ))}
        </section>}

        <section style={{ ...card, padding: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
            {(day.guesses.length ? day.guesses : []).map((g, i) => {
              const n = g.correct ? 5 : Math.max(0, Math.min(4, Math.round((g.pct || 0) / 20)))
              return (
                <div key={i} style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: g.correct ? C.green : j < n ? C.gold : C.borderSolid }} />
                  ))}
                </div>
              )
            })}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: C.muted }}>KnowFlags #{number} · {day.won ? guessCount : 'X'}/{DAILY_MAX_GUESSES}</span>
            <button type="button" onClick={share}
              style={{ minHeight: '44px', borderRadius: '10px', border: 'none', backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', transition: 'background-color 0.12s ease' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
              {copied ? t('Copied!', 'Copié !') : t('Share my result', 'Partager mon résultat')}
            </button>
          </div>
        </section>

        {!isArchive && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', color: C.muted }}>
            {t('Next flag in', 'Prochain drapeau dans')} <strong style={{ color: C.navy }}>{formatCountdown(countdown)}</strong>
          </p>
        )}

        {board.length > 0 && (
          <section style={{ ...card, padding: '14px 16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.green, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: C.green, borderRadius: '2px' }} />
              {t("Today's ranking", 'Classement du jour')}
            </p>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {board.map((b, i) => (
                <li key={b.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: i ? `1px solid ${C.borderSolid}` : 'none', fontSize: '14px', fontWeight: b.user_id === user?.id ? 800 : 500 }}>
                  <span style={{ width: '20px', color: C.muted }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.username}</span>
                  <span style={{ color: C.muted }}>{b.guesses}/{DAILY_MAX_GUESSES}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.green, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: C.green, borderRadius: '2px' }} />
            {t('Previous days', 'Jours précédents')}
          </p>
          {calendar}
        </section>

        {!user && (
          <section style={{ backgroundColor: '#FEF3C7', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: C.goldDark }}>
              {t(
                'Guest: your streak is only kept on this device. Create an account to keep it everywhere and appear in today’s ranking.',
                'Visiteur : ta série n’est gardée que sur cet appareil. Crée un compte pour la conserver partout et apparaître au classement du jour.'
              )}
            </p>
            <Link prefetch={false} href={`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/games/daily`)}`}
              style={{ alignSelf: 'flex-start', padding: '10px 18px', borderRadius: '10px', backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              {t('Create an account', 'Créer un compte')}
            </Link>
          </section>
        )}

        <Link prefetch={false} href={`/${locale}/games`} style={{ alignSelf: 'center', fontSize: '13px', fontWeight: 600, color: C.navy, minHeight: '44px', display: 'flex', alignItems: 'center' }}>
          {t('More games', 'Plus de jeux')}
        </Link>
      </div>
    </div>
  )
}

// ── Calendrier des archives ─────────────────────────────────────────────────
// Grille du mois (lundi en premier). Coche verte : trouvé. Coche grise : terminé
// sans trouver. Point doré : partie commencée. Jours avant le n° 1 et futurs grisés.
function DayCalendar({ todayKey, activeKey, status, onPick, locale, t }) {
  const [month, setMonth] = useState(() => (activeKey || todayKey).slice(0, 7))
  const firstMonth = DAILY_EPOCH.slice(0, 7)
  const lastMonth = todayKey.slice(0, 7)
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ]
  const loc = locale === 'fr' ? 'fr-FR' : 'en-GB'
  const monthLabel = new Intl.DateTimeFormat(loc, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, 1)))
  const fullDate = (k) => new Intl.DateTimeFormat(loc, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(dayKeyToDate(k))
  const shift = (d) => setMonth(new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7))
  const weekdays = locale === 'fr' ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const total = dayIndex(todayKey) + 1
  const finished = Object.entries(status)
    .filter(([k, s]) => (s === 'won' || s === 'lost') && k >= DAILY_EPOCH && k <= todayKey).length

  const navBtn = (enabled) => ({
    width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', border: 'none', background: 'none', cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.3,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" aria-label={t('Previous month', 'Mois précédent')} disabled={month <= firstMonth} onClick={() => shift(-1)} style={navBtn(month > firstMonth)}>
          <GameIcon name="chevronLeft" size={18} color={C.navy} />
        </button>
        <span style={{ fontSize: '15px', fontWeight: 800, color: C.navy, textTransform: 'capitalize' }}>{monthLabel}</span>
        <button type="button" aria-label={t('Next month', 'Mois suivant')} disabled={month >= lastMonth} onClick={() => shift(1)} style={navBtn(month < lastMonth)}>
          <GameIcon name="chevronRight" size={18} color={C.navy} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
        {weekdays.map((w, i) => (
          <span key={i} aria-hidden="true" style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: C.light }}>{w}</span>
        ))}
        {cells.map((k, i) => {
          if (!k) return <span key={`e${i}`} />
          const playable = k >= DAILY_EPOCH && k <= todayKey
          const s = status[k]
          const isToday = k === todayKey
          const isActive = k === activeKey
          const label = `${fullDate(k)}${isToday ? ` (${t('today', 'aujourd’hui')})` : ''}, ${
            s === 'won' ? t('found', 'trouvé') : s === 'lost' ? t('finished, not found', 'terminé, pas trouvé')
              : s === 'progress' ? t('in progress', 'en cours') : t('not played', 'pas joué')}`
          if (!playable) {
            return (
              <span key={k} aria-hidden="true" style={{ aspectRatio: '1 / 1', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: C.light }}>
                {Number(k.slice(8))}
              </span>
            )
          }
          return (
            <button key={k} type="button" aria-label={label} aria-current={isActive ? 'date' : undefined} onClick={() => onPick(k)}
              style={{
                aspectRatio: '1 / 1', minHeight: '40px', padding: 0, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                border: isToday ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                backgroundColor: isActive ? C.navy : s === 'won' ? C.greenLight : C.surface,
                color: isActive ? 'white' : C.navy, fontSize: '14px', fontWeight: 700,
                transition: 'background-color 0.12s ease',
              }}>
              <span>{Number(k.slice(8))}</span>
              <span style={{ height: '14px', display: 'flex', alignItems: 'center' }} aria-hidden="true">
                {s === 'won' && <GameIcon name="check" size={14} color={isActive ? C.greenLight : C.green} />}
                {s === 'lost' && <GameIcon name="check" size={14} color={isActive ? C.steel : C.light} />}
                {s === 'progress' && <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: C.gold }} />}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: C.muted }}>
        <span style={{ fontWeight: 700, color: C.navy }}>
          {t(`${finished} of ${total} days finished`, `${finished} jour${finished > 1 ? 's' : ''} terminé${finished > 1 ? 's' : ''} sur ${total}`)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><GameIcon name="check" size={12} color={C.green} />{t('found', 'trouvé')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><GameIcon name="check" size={12} color={C.light} />{t('not found', 'pas trouvé')}</span>
        </span>
      </div>
    </div>
  )
}

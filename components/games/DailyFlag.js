'use client'

// Drapeau du jour : un drapeau par jour, le même pour tout le monde, 5 essais.
// Chaque essai affiche un % de ressemblance et révèle les tuiles de couleur proche
// (même moteur que FlagReveal). Une seule partie par jour.
// Visiteur : résultats gardés dans le navigateur. Membre : en base (daily_flag_results),
// avec la série, les statistiques et le classement du jour.

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import GameIcon from '@/components/games/GameIcon'
import {
  DAILY_MAX_GUESSES, zurichDayKey, dayNumber, dailyIso, secondsToNextDay,
  readLocal, writeLocalDay, computeStats, shareText, shiftDayKey,
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

  const number = dayNumber(todayKey)
  const isoList = useMemo(() => countries.map(c => c.iso_code), [countries])
  const targetIso = useMemo(() => (isoList.length ? dailyIso(isoList, todayKey) : null), [isoList, todayKey])
  const byIso = useMemo(() => Object.fromEntries(countries.map(c => [c.iso_code, c])), [countries])
  const nameOf = (iso) => { const c = byIso[iso]; return c ? (locale === 'fr' ? c.name_fr : c.name_en) : iso }

  // ── Chargement : pays souverains + session ─────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    sb.from('countries').select('iso_code, name_en, name_fr').eq('entity_type', 'sovereign')
      .then(({ data }) => { setCountries(data || []); setLoading(false) })
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
    return () => subscription.unsubscribe()
  }, [])

  // ── Résultats du membre + envoi des parties jouées en visiteur ─────────────
  useEffect(() => {
    if (!user) { setDbResults([]); return }
    const sb = createClient()
    let cancelled = false
    ;(async () => {
      const { data } = await sb.from('daily_flag_results')
        .select('day, iso_code, guesses, won').eq('user_id', user.id).order('day')
      const rows = data || []
      // Parties terminées en visiteur dans les 60 derniers jours, absentes de la base
      const have = new Set(rows.map(r => r.day))
      const local = readLocal().days
      const minKey = shiftDayKey(zurichDayKey(), -60)
      const missing = Object.entries(local)
        .filter(([k, d]) => d?.done && k >= minKey && !have.has(k) && d.guesses?.length)
        .map(([k, d]) => ({ user_id: user.id, day: k, iso_code: d.iso, guesses: d.guesses.length, won: !!d.won }))
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
    const local = readLocal().days[todayKey]
    if (local && local.iso === targetIso) { setDay(local); return }
    const fromDb = dbResults.find(r => r.day === todayKey)
    if (fromDb) {
      setDay({ iso: targetIso, guesses: [], revealed: allTiles(), won: fromDb.won, done: true, guessCount: fromDb.guesses })
      return
    }
    setDay({ iso: targetIso, guesses: [], revealed: [], won: false, done: false })
  }, [targetIso, todayKey, dbResults])

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
    loadBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.done, targetIso])

  async function loadBoard() {
    const sb = createClient()
    const { data } = await sb.from('daily_flag_results')
      .select('user_id, guesses, created_at').eq('day', todayKey).eq('won', true)
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
      if (k !== todayKey) { setTodayKey(k); setFact(null); setBoard([]) }
    }, 30000)
    return () => clearInterval(id)
  }, [todayKey])

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
    const next = { ...day, guesses, revealed, won: correct, done }
    setDay(next)
    writeLocalDay(todayKey, next)
    if (done && user) {
      const sb = createClient()
      const row = { user_id: user.id, day: todayKey, iso_code: day.iso, guesses: guesses.length, won: correct }
      await sb.from('daily_flag_results').upsert(row, { onConflict: 'user_id,day', ignoreDuplicates: true })
      setDbResults(r => r.some(x => x.day === todayKey) ? r : [...r, { day: todayKey, iso_code: day.iso, guesses: guesses.length, won: correct }])
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
    if (user) return computeStats(dbResults.map(r => ({ day: r.day, won: r.won })), todayKey)
    const local = readLocal().days
    return computeStats(Object.entries(local).filter(([, d]) => d?.done).map(([k, d]) => ({ day: k, won: !!d.won })), todayKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dbResults, day, todayKey])

  async function share() {
    const text = shareText({ number, guesses: day.guesses.length ? day.guesses : Array.from({ length: day.guessCount || 1 }, (_, i) => ({ correct: day.won && i === (day.guessCount || 1) - 1, pct: 0 })), won: day.won, locale })
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { await navigator.share({ text }); return }
      await navigator.clipboard.writeText(text)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch { /* partage annulé */ }
  }

  if (loading || !day) return <PageLoader label={t('Loading...', 'Chargement...')} />

  const dateLabel = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'Europe/Zurich', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const guessCount = day.guesses.length || day.guessCount || 0

  // ════════════════════════════ EN JEU ════════════════════════════
  if (!day.done) {
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: C.navy, color: 'white', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold }}>
                {t('Flag of the day', 'Drapeau du jour')}
              </p>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
                {t('No.', 'n°')} {number} · {dateLabel}
              </h1>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9999px', backgroundColor: 'rgba(244,180,0,0.16)', color: C.gold, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <GameIcon name="flame" size={15} color={C.gold} />
              {t('Streak', 'Série')} {stats.current}
            </span>
          </div>

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

          <button type="button" onClick={() => setHowTo(v => !v)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: C.steel, fontSize: '13px', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}>
            {t('How to play?', 'Comment jouer ?')}
          </button>
          {howTo && (
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
              {t(
                'One flag a day, the same for everyone. You have 5 guesses. Each guess shows how close its flag is, and reveals the tiles whose colours match. A new flag arrives at midnight (Swiss time).',
                'Un drapeau par jour, le même pour tout le monde. Tu as 5 essais. Chaque essai indique à quel point son drapeau ressemble au drapeau mystère et révèle les tuiles de couleur proche. Nouveau drapeau à minuit (heure suisse).'
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
        <section style={{ ...card, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: day.won ? C.green : C.red }}>
            {day.won
              ? t(`Found in ${guessCount} ${guessCount > 1 ? 'guesses' : 'guess'}`, `Trouvé en ${guessCount} essai${guessCount > 1 ? 's' : ''}`)
              : t('Not found today', 'Pas trouvé aujourd’hui')}
          </p>
          <img src={`https://flagcdn.com/w320/${day.iso}.png`} alt={nameOf(day.iso)}
            style={{ width: '180px', height: 'auto', borderRadius: '6px', boxShadow: '0 2px 8px rgba(22,50,79,0.15)' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em' }}>{nameOf(day.iso)}</h1>
          {fact && <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: C.muted }}>{locale === 'fr' ? fact.fact_fr : fact.fact_en}</p>}
          <Link prefetch={false} href={`/${locale}/countries/${day.iso}`} style={{ fontSize: '13px', fontWeight: 700, color: C.navy, minHeight: '44px', display: 'flex', alignItems: 'center' }}>
            {t('See the country page', 'Voir la fiche du pays')}
          </Link>
        </section>

        <section aria-label={t('Statistics', 'Statistiques')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
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
        </section>

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

        <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', color: C.muted }}>
          {t('Next flag in', 'Prochain drapeau dans')} <strong style={{ color: C.navy }}>{formatCountdown(countdown)}</strong>
        </p>

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

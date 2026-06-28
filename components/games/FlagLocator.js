'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import { COUNTRY_DATA, CONTINENTS, NUM_TO_CODE, codesForZone } from '@/lib/flagLocatorData'

const DS = {
  navy: '#16324F', navyDark: '#0F1923', gold: '#F4B400', red: '#D62828',
  green: '#16A34A', bg: '#F4F1E6', surface: '#FFFFFF', border: '#E2DDD5',
  muted: '#6B7280', white: '#FFFFFF',
}

// Map state colors
const MAP = {
  ocean:       '#16324F',           // background
  locked:      '#243B55',           // not in play (normal mode) — non-clickable
  selectable:  '#E8ECF2',           // clickable, not yet found
  selectableHover: '#FFFFFF',
  validated:   '#5B6B7E',           // found (greyed)
  stroke:      'rgba(15,25,35,0.55)',
  wrong:       '#D62828',
  reveal:      '#16A34A',
}

const COUNT_OPTIONS = [12, 24, 48, 'all']
const MODES = [
  { key: 'normal',  en: 'Normal',  fr: 'Normal',  descEn: 'Only the picked countries are clickable', descFr: 'Seuls les pays tirés sont cliquables' },
  { key: 'hard',    en: 'Hard',    fr: 'Difficile', descEn: 'Whole map clickable; found ones grey out', descFr: 'Toute la carte cliquable ; les trouvés se grisent' },
  { key: 'extreme', en: 'Extreme', fr: 'Extrême',  descEn: 'Whole map clickable; no visual feedback', descFr: 'Toute la carte cliquable ; aucun retour visuel' },
]
const MAX_ERRORS = 3

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function FlagLocator() {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [screen, setScreen]   = useState('setup')   // setup | playing | result
  const [zone, setZone]       = useState('africa')
  const [count, setCount]     = useState(12)
  const [mode, setMode]       = useState('normal')

  // world-atlas
  const [features, setFeatures] = useState(null)     // all country features
  const [mapLoading, setMapLoading] = useState(true)

  // game state
  const [targets, setTargets]   = useState([])       // ordered codes to find
  const [idx, setIdx]           = useState(0)
  const [found, setFound]       = useState([])       // codes found (in order)
  const [errors, setErrors]     = useState(0)
  const [elapsed, setElapsed]   = useState(0)
  const [revealCode, setRevealCode] = useState(null) // flash green on game over

  const foundSet   = useRef(new Set())
  const timerRef   = useRef(null)
  const svgRef     = useRef(null)
  const gRef       = useRef(null)
  const pathByCode = useRef({})       // code -> SVGPathElement
  const zoomRef    = useRef(null)
  const stateRef   = useRef({})       // latest game state for click handler

  const current = targets[idx] || null

  // ── Load world-atlas once ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
      .then(r => r.json())
      .then(world => {
        if (cancelled) return
        const feats = topojson.feature(world, world.objects.countries).features
        setFeatures(feats)
        setMapLoading(false)
      })
      .catch(() => { if (!cancelled) setMapLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ── Timer ──────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }, [])
  const stopTimer = useCallback(() => clearInterval(timerRef.current), [])
  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── Start a game ─────────────────────────────────────────────────────────
  function startGame() {
    const zoneCodes = codesForZone(zone).filter(c => COUNTRY_DATA[c])
    const n = count === 'all' ? zoneCodes.length : Math.min(count, zoneCodes.length)
    const picked = shuffle(zoneCodes).slice(0, n)
    foundSet.current = new Set()
    setTargets(picked); setIdx(0); setFound([]); setErrors(0); setElapsed(0); setRevealCode(null)
    setScreen('playing')
    startTimer()
  }

  // ── Build the SVG map when entering play / zone known ────────────────────
  useEffect(() => {
    if (screen !== 'playing' || !features || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    pathByCode.current = {}

    const wrap = svgRef.current.parentElement
    const W = wrap.clientWidth, H = wrap.clientHeight
    svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)

    const zoneCodes = new Set(codesForZone(zone))
    // numeric ids in zone -> show those features; project fit to zone
    const zoneFeatures = features.filter(f => {
      const code = NUM_TO_CODE[parseInt(f.id)]
      return code && zoneCodes.has(code)
    })
    if (zoneFeatures.length === 0) return

    const proj = d3.geoMercator()
    const fc = { type: 'FeatureCollection', features: zoneFeatures }
    proj.fitExtent([[12, 12], [W - 12, H - 12]], fc)
    const pathGen = d3.geoPath().projection(proj)

    const g = svg.append('g')
    gRef.current = g.node()

    zoneFeatures.forEach(f => {
      const code = NUM_TO_CODE[parseInt(f.id)]
      const p = g.append('path')
        .attr('d', pathGen(f) || '')
        .attr('stroke', MAP.stroke)
        .attr('stroke-width', 0.5)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('cursor', 'default')
        .on('click', (ev) => { ev.stopPropagation(); handleClick(code) })
      pathByCode.current[code] = p.node()
    })

    // zoom / pan
    const zoom = d3.zoom().scaleExtent([1, 9]).on('zoom', (ev) => {
      g.attr('transform', ev.transform)
    })
    zoomRef.current = zoom
    svg.call(zoom).on('dblclick.zoom', null)

    recolor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, features, zone])

  // keep latest state for the imperative click handler
  useEffect(() => {
    stateRef.current = { current, mode, targetsSet: new Set(targets), revealCode }
    recolor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, targets, found, revealCode, errors])

  // ── Recolor all paths based on state ─────────────────────────────────────
  function recolor() {
    const tg = new Set(targets)
    Object.entries(pathByCode.current).forEach(([code, node]) => {
      if (!node) return
      const isFound = foundSet.current.has(code)
      const inPlay  = mode === 'normal' ? tg.has(code) : true
      let fill, clickable
      if (revealCode && code === revealCode) { fill = MAP.reveal; clickable = false }
      else if (isFound) {
        fill = mode === 'extreme' ? MAP.selectable : MAP.validated
        clickable = mode === 'extreme'   // extreme: still clickable (no feedback)
      } else if (inPlay) { fill = MAP.selectable; clickable = true }
      else { fill = MAP.locked; clickable = false }
      node.setAttribute('fill', fill)
      node.style.pointerEvents = clickable ? 'auto' : 'none'
      node.style.cursor = clickable ? 'pointer' : 'default'
    })
  }

  // ── Click handling ───────────────────────────────────────────────────────
  function handleClick(code) {
    const st = stateRef.current
    if (!st.current || screen !== 'playing') return
    if (code === st.current) {
      // correct
      foundSet.current.add(code)
      const nextFound = [...found, code]
      setFound(nextFound)
      flash(code, MAP.validated)
      if (idx + 1 >= targets.length) endGame(nextFound, errors)   // all found
      else setIdx(i => i + 1)
    } else {
      // wrong
      flash(code, MAP.wrong)
      const e = errors + 1
      setErrors(e)
      if (e >= MAX_ERRORS) {
        setRevealCode(st.current)   // show the right answer
        setTimeout(() => endGame(found, e), 1400)
      }
    }
  }

  function flash(code, color) {
    const node = pathByCode.current[code]
    if (!node) return
    const prev = node.getAttribute('fill')
    node.setAttribute('fill', color)
    setTimeout(() => { if (!revealCode) recolor(); else node.setAttribute('fill', prev) }, 350)
  }

  function endGame(foundList, errs) {
    stopTimer()
    const pct = targets.length ? Math.round((foundList.length / targets.length) * 100) : 0
    saveRun(pct, elapsed, foundList.length, targets.length, errs)
    setScreen('result')
  }

  function quitGame() { endGame(found, errors) }

  // ── Persistence (aligned with game_scores_log pattern) ───────────────────
  async function saveRun(pct, time, foundN, total, errs) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const score = pct                                  // 0–100
      await supabase.from('game_scores_log').insert({
        user_id: user.id, game: 'flag-locator', score, played_at: new Date().toISOString(),
      })
      // best run per zone/mode (optional refinement later)
      await supabase.from('game_scores').upsert({
        user_id: user.id, mode: `flag_locator_${zone}_${mode}`,
        best_streak: foundN, best_duration: time,
      })
    } catch (e) { /* not signed in / offline — silent */ }
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  if (mapLoading) return <PageLoader label={t('Loading map…', 'Chargement de la carte…')} />

  // SETUP
  if (screen === 'setup') {
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: DS.bg, padding: '24px 16px 48px', fontFamily: 'var(--font-body)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: DS.green, margin: '0 0 6px' }}>
            {t('Geography Game', 'Jeu de géographie')}
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: DS.navy, letterSpacing: '-0.02em', margin: '0 0 8px' }}>FlagLocator</h1>
          <p style={{ fontSize: '15px', color: DS.muted, lineHeight: 1.6, margin: '0 0 24px' }}>
            {t('See a flag, click the right country on the map. Fastest with fewest errors wins.',
               'Tu vois un drapeau, clique le bon pays sur la carte. Le plus rapide avec le moins d\u2019erreurs gagne.')}
          </p>

          {/* Zone */}
          <Label>{t('Zone', 'Zone')}</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            <Chip active={zone === 'world'} onClick={() => setZone('world')}>{t('World', 'Monde')} · 197</Chip>
            {CONTINENTS.map(c => (
              <Chip key={c.slug} active={zone === c.slug} onClick={() => setZone(c.slug)}>
                {t(c.en, c.fr)} · {c.count}
              </Chip>
            ))}
          </div>

          {/* Count */}
          <Label>{t('How many flags', 'Combien de drapeaux')}</Label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {COUNT_OPTIONS.map(n => (
              <Chip key={n} active={count === n} onClick={() => setCount(n)}>
                {n === 'all' ? t('All', 'Tous') : n}
              </Chip>
            ))}
          </div>

          {/* Mode */}
          <Label>{t('Mode', 'Mode')}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            {MODES.map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                  border: mode === m.key ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
                  backgroundColor: mode === m.key ? DS.navy : DS.surface,
                  color: mode === m.key ? '#fff' : DS.navy, transition: 'all 0.15s',
                }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>{t(m.en, m.fr)}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>{t(m.descEn, m.descFr)}</div>
              </button>
            ))}
          </div>

          <button onClick={startGame}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: DS.navy, color: '#fff',
                     fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
            {t('Start', 'Commencer')}
          </button>
        </div>
      </div>
    )
  }

  // RESULT
  if (screen === 'result') {
    const pct = targets.length ? Math.round((found.length / targets.length) * 100) : 0
    return (
      <div style={{ minHeight: 'calc(100dvh - 60px)', backgroundColor: DS.bg, padding: '40px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: DS.navy, margin: '0 0 4px' }}>
            {found.length === targets.length ? t('Completed!', 'Terminé !') : t('Game over', 'Partie terminée')}
          </h2>
          <p style={{ color: DS.muted, margin: '0 0 24px' }}>
            {t(CONTINENTS.find(c => c.slug === zone)?.en || 'World', CONTINENTS.find(c => c.slug === zone)?.fr || 'Monde')} · {MODES.find(m => m.key === mode)[locale === 'fr' ? 'fr' : 'en']}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            <Stat label={t('Found', 'Trouvés')} value={`${found.length}/${targets.length}`} />
            <Stat label={t('Accuracy', 'Réussite')} value={`${pct}%`} color={DS.green} />
            <Stat label={t('Time', 'Temps')} value={fmtTime(elapsed)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setScreen('setup')}
              style={{ flex: 1, padding: '13px', borderRadius: '12px', backgroundColor: DS.navy, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
              {t('Play again', 'Rejouer')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PLAYING
  const flagCode = current
  return (
    <div style={{ height: 'calc(100dvh - 60px)', display: 'flex', flexDirection: 'column', backgroundColor: MAP.navy, overflow: 'hidden', fontFamily: 'var(--font-body)', touchAction: 'none' }}>
      {/* Fixed top HUD: flag + counters */}
      <div style={{ flexShrink: 0, backgroundColor: DS.navyDark, color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', zIndex: 5 }}>
        <div style={{ width: '64px', height: '43px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {flagCode && <img src={`https://flagcdn.com/w160/${flagCode}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: DS.gold, textTransform: 'uppercase' }}>{t('Find on the map', 'Trouve sur la carte')}</div>
          <div style={{ fontSize: '18px', fontWeight: 900, lineHeight: 1.1 }}>
            {t('Which country?', 'Quel pays ?')}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{Math.min(idx + 1, targets.length)}/{targets.length}</div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{fmtTime(elapsed)}</div>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: DS.red }}>
            {'✕'.repeat(errors)}{'·'.repeat(MAX_ERRORS - errors)}
          </div>
        </div>
      </div>

      {/* Map fills the rest */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, backgroundColor: MAP.ocean }}>
        <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />
        {/* Quit */}
        <button onClick={quitGame}
          style={{ position: 'absolute', top: '10px', right: '10px', padding: '7px 14px', borderRadius: '9999px',
                   backgroundColor: 'rgba(255,255,255,0.92)', color: DS.navy, fontWeight: 700, fontSize: '13px',
                   border: 'none', cursor: 'pointer', zIndex: 6 }}>
          {t('Quit', 'Quitter')}
        </button>
      </div>
    </div>
  )
}

// ── small UI helpers ──
function Label({ children }) {
  return <p style={{ fontSize: '12px', fontWeight: 800, color: DS.navy, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{children}</p>
}
function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
               border: active ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
               backgroundColor: active ? DS.navy : DS.surface, color: active ? '#fff' : DS.muted, cursor: 'pointer', transition: 'all 0.15s' }}>
      {children}
    </button>
  )
}
function Stat({ label, value, color }) {
  return (
    <div style={{ backgroundColor: DS.surface, border: `1px solid ${DS.border}`, borderRadius: '12px', padding: '12px 8px' }}>
      <div style={{ fontSize: '18px', fontWeight: 900, color: color || DS.navy }}>{value}</div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{label}</div>
    </div>
  )
}
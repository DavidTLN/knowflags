'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

const ATTRIBUTES = [
  { key: 'area',       icon: '🗺️',  higher_wins: true,  en: 'Largest area',            fr: 'Plus grande superficie',         format: v => (v/1000).toFixed(0)+'k km²' },
  { key: 'area',       icon: '🔬',  higher_wins: false, en: 'Smallest area',           fr: 'Plus petite superficie',         format: v => v.toLocaleString()+' km²' },
  { key: 'population', icon: '👥',  higher_wins: true,  en: 'Largest population',      fr: 'Plus grande population',         format: v => (v/1e6).toFixed(1)+'M' },
  { key: 'population', icon: '🏝️', higher_wins: false, en: 'Smallest population',     fr: 'Plus petite population',         format: v => v.toLocaleString() },
  { key: 'gdp',        icon: '💰',  higher_wins: true,  en: 'Highest GDP/capita',      fr: 'PIB/hab le plus élevé',          format: v => '$'+v.toLocaleString() },
  { key: 'gdp',        icon: '📉',  higher_wins: false, en: 'Lowest GDP/capita',       fr: 'PIB/hab le plus faible',         format: v => '$'+v.toLocaleString() },
  { key: 'life',       icon: '❤️',  higher_wins: true,  en: 'Highest life expectancy', fr: 'Espérance de vie la plus haute', format: v => v.toFixed(1)+' yrs' },
  { key: 'life',       icon: '⚠️',  higher_wins: false, en: 'Lowest life expectancy',  fr: 'Espérance de vie la plus basse', format: v => v.toFixed(1)+' yrs' },
  { key: 'alcohol',    icon: '🍺',  higher_wins: true,  en: 'Most alcohol consumed',   fr: 'Plus haute conso d\'alcool',     format: v => v.toFixed(1)+' L/yr' },
  { key: 'alcohol',    icon: '🚱',  higher_wins: false, en: 'Least alcohol consumed',  fr: 'Moins de conso d\'alcool',       format: v => v.toFixed(1)+' L/yr' },
  { key: 'crime',      icon: '🚨',  higher_wins: true,  en: 'Highest crime index',     fr: 'Criminalité la plus haute',      format: v => v.toFixed(1) },
  { key: 'crime',      icon: '🕊️', higher_wins: false, en: 'Lowest crime index',      fr: 'Criminalité la plus basse',      format: v => v.toFixed(1) },
  { key: 'density',    icon: '🏙️', higher_wins: true,  en: 'Most densely populated',  fr: 'Plus grande densité',            format: v => v.toFixed(1)+'/km²' },
  { key: 'density',    icon: '🏜️', higher_wins: false, en: 'Least densely populated', fr: 'Plus faible densité',            format: v => v.toFixed(1)+'/km²' },
  { key: 'alt',        icon: '🏔️', higher_wins: true,  en: 'Highest avg altitude',    fr: 'Altitude moy. la plus haute',    format: v => v.toLocaleString()+' m' },
  { key: 'alt',        icon: '🌊',  higher_wins: false, en: 'Lowest avg altitude',     fr: 'Altitude moy. la plus basse',    format: v => v.toLocaleString()+' m' },
  { key: 'coast',      icon: '⛵',  higher_wins: true,  en: 'Longest coastline',       fr: 'Plus long littoral',             format: v => v.toLocaleString()+' km' },
  { key: 'tz',         icon: '🕐',  higher_wins: true,  en: 'Most time zones',         fr: 'Plus de fuseaux horaires',       format: v => v+' zones' },
]

function getWorldRank(country, attr, allC) {
  if (!allC || !allC.length) return 100
  const sorted = [...allC].sort((a, b) => attr.higher_wins ? b[attr.key] - a[attr.key] : a[attr.key] - b[attr.key])
  return sorted.findIndex(c => c.code === country.code) + 1
}

function scoreFromRank(rank, n = 195) {
  return Math.round(100 * (1 - Math.pow((rank - 1) / n, 0.5)))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRound(allC) {
  if (!allC || allC.length < 5) return { countries: [], attrs: [] }
  const countries = shuffle(allC).slice(0, 5)
  const attrs = shuffle(ATTRIBUTES).filter((a, i, arr) => arr.findIndex(b => b.en === a.en) === i).slice(0, 5)
  return { countries, attrs }
}

export default function FlagRanker() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen]             = useState('intro')
  const [mode, setMode]                 = useState(null)
  const [round, setRound]               = useState(1)
  const [totalScore, setTotalScore]     = useState(0)
  const [roundScore, setRoundScore]     = useState(0)
  const [countries, setCountries]       = useState([])
  const [attrs, setAttrs]               = useState([])
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [placements, setPlacements]     = useState({})
  const [openOrder, setOpenOrder]       = useState([])
  const [openAttr, setOpenAttr]         = useState(null)
  const [results, setResults]           = useState([])
  const [revealStep, setRevealStep]     = useState(0)
  const [dragOver, setDragOver]         = useState(null)
  const [dragging, setDragging]         = useState(false)
  const [openDragIdx, setOpenDragIdx]   = useState(null)
  const [showHelp, setShowHelp]         = useState(false)
  const [allCountries, setAllCountries] = useState([])
  const [dataLoading, setDataLoading]   = useState(true)
  const [isMobile, setIsMobile]         = useState(false)
  // Mobile tap-to-place: null or slotIdx waiting for a flag tap
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('country_stats').select('*').then(({ data }) => {
      if (data) setAllCountries(data)
      setDataLoading(false)
    })
  }, [])

  function startGame(m) {
    setMode(m); setRound(1); setTotalScore(0); beginRound(m)
  }

  function beginRound(m) {
    const { countries: c, attrs: a } = pickRound(allCountries)
    setCountries(c); setCurrentIdx(0); setPlacements({})
    setResults([]); setRevealStep(0); setDragging(false); setDragOver(null)
    setSelectedSlot(null)
    const isOpen = m === 'open'
    if (isOpen) {
      setOpenAttr(a[0]); setOpenOrder(c.map(x => x.code)); setAttrs([a[0]])
    } else {
      setAttrs(a)
    }
    setScreen('playing')
  }

  function handleSlotDrop(slotIdx) {
    if (placements[slotIdx]) return
    const country = countries[currentIdx]
    const attr    = attrs[currentIdx]
    const next    = { ...placements, [slotIdx]: { country, attr } }
    setPlacements(next)
    setSelectedSlot(null)
    if (currentIdx < 4) { setCurrentIdx(currentIdx + 1) }
    else { computeResults(next) }
  }

  // Mobile: tap slot to select it, then tap flag to place
  function handleSlotTap(slotIdx) {
    if (placements[slotIdx]) return
    if (isMobile) {
      setSelectedSlot(slotIdx === selectedSlot ? null : slotIdx)
    }
  }

  function handleFlagTapMobile() {
    if (!isMobile || selectedSlot === null) return
    handleSlotDrop(selectedSlot)
  }

  function computeResults(fp) {
    let rScore = 0
    const res = Object.entries(fp).map(([, { country, attr }]) => {
      const worldRank = getWorldRank(country, attr, allCountries)
      const rawPts    = scoreFromRank(worldRank)
      const pts       = mode === 'minimize' ? (100 - rawPts) : rawPts
      rScore += pts
      return { country, attr, worldRank, pts, rawPts }
    })
    setResults(res); setRoundScore(rScore); setScreen('reveal')
    let step = 0
    const iv = setInterval(() => { step++; setRevealStep(step); if (step >= res.length) clearInterval(iv) }, 500)
  }

  // Open mode reorder
  function openDrop(targetIdx) {
    if (openDragIdx === null || openDragIdx === targetIdx) return
    const next = [...openOrder]
    const [moved] = next.splice(openDragIdx, 1)
    next.splice(targetIdx, 0, moved)
    setOpenOrder(next); setOpenDragIdx(null); setDragOver(null)
  }

  function moveOpenItem(fromIdx, dir) {
    const toIdx = fromIdx + dir
    if (toIdx < 0 || toIdx >= openOrder.length) return
    const next = [...openOrder]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setOpenOrder(next)
  }

  function submitOpen() {
    let rScore = 0
    const res = openOrder.map((code) => {
      const country   = countries.find(c => c.code === code)
      const attr      = openAttr
      const worldRank = getWorldRank(country, attr, allCountries)
      const pts       = scoreFromRank(worldRank)
      rScore += pts
      return { country, attr, worldRank, pts, rawPts: pts }
    })
    setResults(res); setRoundScore(rScore); setScreen('reveal')
    let step = 0
    const iv = setInterval(() => { step++; setRevealStep(step); if (step >= res.length) clearInterval(iv) }, 500)
  }

  function finishReveal() {
    const nt = totalScore + roundScore
    setTotalScore(nt)
    setScreen('roundflash')
    setTimeout(() => {
      setRound(r => r + 1)
      setRoundScore(0)
      beginRound(mode)
    }, 1400)
  }

  const isMin = mode === 'minimize'
  const currentCountry = countries[currentIdx]
  const currentAttr    = attrs[currentIdx]

  // ── LOADING ────────────────────────────────────────────────────────────
  if (dataLoading) return (
    <div style={S.page}>
      <div style={{ ...S.card, padding: '60px 32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌍</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0B1F3B' }}>
          {t('Loading country data...', 'Chargement des données pays...')}
        </div>
      </div>
    </div>
  )

  // ── INTRO ──────────────────────────────────────────────────────────────
  if (screen === 'intro') return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>🏆</div>
        <h1 style={S.title}>FlagRanker</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px' }}>
          {t('5 flags · 2 rounds · Based on real world data', '5 drapeaux · 2 manches · Données mondiales réelles')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'maximize', icon: '📈', en: 'Maximize', fr: 'Maximiser', color: '#22c55e',
              descEn: 'Place flags to get the HIGHEST score.',
              descFr: 'Place les drapeaux pour obtenir le PLUS GRAND score.' },
            { id: 'minimize', icon: '📉', en: 'Minimize', fr: 'Minimiser', color: '#3b82f6',
              descEn: 'Place flags to get the LOWEST score.',
              descFr: 'Place les drapeaux pour obtenir le PLUS PETIT score.' },
            { id: 'open', icon: '🔓', en: 'Open', fr: 'Ouvert', color: '#f59e0b',
              descEn: 'See all 5 flags + 1 attribute. Rank them, then validate.',
              descFr: 'Vois les 5 drapeaux + 1 attribut. Classe-les, puis valide.' },
          ].map(m => (
            <button key={m.id} onClick={() => startGame(m.id)} style={{ ...S.modeBtn, borderColor: m.color }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{ fontSize: '26px' }}>{m.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0B1F3B' }}>{locale === 'fr' ? m.fr : m.en}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{locale === 'fr' ? m.descFr : m.descEn}</div>
                </div>
              </div>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', flexShrink: 0 }}>▶</div>
            </button>
          ))}
        </div>
        <button onClick={() => setShowHelp(true)} style={{ background: 'none', border: 'none', color: '#9EB7E5', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}>
          ❓ {t('How to play', 'Comment jouer ?')}
        </button>
      </div>
    </div>
  )

  // ── END ────────────────────────────────────────────────────────────────
  if (screen === 'end') {
    const max  = 1000
    const pct  = isMin ? Math.round((1 - totalScore / max) * 100) : Math.round((totalScore / max) * 100)
    const grade = pct >= 90 ? '🏆' : pct >= 70 ? '🥇' : pct >= 50 ? '🥈' : pct >= 30 ? '🥉' : '🎯'
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>{grade}</div>
          <h1 style={S.title}>{t('Game Over!', 'Partie terminée !')}</h1>
          <div style={{ fontSize: '52px', fontWeight: '900', color: '#0B1F3B', margin: '16px 0 4px', letterSpacing: '-2px' }}>{totalScore}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px' }}>/ {max} pts ({pct}%)</div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setScreen('intro')} style={S.btnSec}>{t('Change mode', 'Changer de mode')}</button>
            <button onClick={() => startGame(mode)} style={S.btn}>{t('Play again', 'Rejouer')}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── ROUND FLASH ────────────────────────────────────────────────────────
  if (screen === 'roundflash') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1F3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#9EB7E5', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
          {t('Get ready', 'Prépare-toi')}
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', color: 'white', letterSpacing: '-3px', lineHeight: 1 }}>
          {t(`Round ${round + 1}`, `Manche ${round + 1}`)}
        </div>
        <div style={{ fontSize: '16px', color: '#9EB7E5', marginTop: '16px' }}>{totalScore.toLocaleString()} pts</div>
      </div>
    </div>
  )

  // ── REVEAL ─────────────────────────────────────────────────────────────
  if (screen === 'reveal') return (
    <div style={S.page}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px' }}>
        <div style={S.header}>
          <div>
            <div style={S.roundLabel}>{t(`Round ${round}`, `Manche ${round}`)}</div>
            <h2 style={S.pageTitle}>{t('Results', 'Résultats')}</h2>
          </div>
          <div style={S.scorePill}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{roundScore}</div>
            <div style={{ fontSize: '10px', color: '#9EB7E5' }}>pts</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
          {results.map((r, i) => {
            const revealed = i < revealStep
            const color = isMin
              ? (r.rawPts <= 30 ? '#22c55e' : r.rawPts <= 60 ? '#f59e0b' : '#ef4444')
              : (r.pts >= 80 ? '#22c55e' : r.pts >= 50 ? '#f59e0b' : r.pts >= 20 ? '#3b82f6' : '#ef4444')
            return (
              <div key={i} style={{ ...S.resultCard, opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.35s ease', borderLeftColor: color }}>
                <img src={`https://flagcdn.com/w80/${r.country.code}.png`} style={S.resultFlag} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#0B1F3B' }}>{locale === 'fr' ? r.country.fr : r.country.en}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{r.attr.icon} {locale === 'fr' ? r.attr.fr : r.attr.en}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    {t('Value', 'Valeur')}: <strong>{r.attr.format(r.country[r.attr.key])}</strong>
                    {' · '}{t('World rank', 'Rang mondial')}: <strong>#{r.worldRank}/195</strong>
                  </div>
                </div>
                <div style={{ ...S.ptsBadge, backgroundColor: color }}>+{r.pts}</div>
              </div>
            )
          })}
        </div>
        {revealStep >= results.length && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={finishReveal} style={S.btn}>{t('Next Round →', 'Manche suivante →')}</button>
          </div>
        )}
      </div>
    </div>
  )

  // ── PLAYING — OPEN ─────────────────────────────────────────────────────
  if (screen === 'playing' && mode === 'open') return (
    <div style={S.page}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px' }}>
        <div style={S.header}>
          <div>
            <div style={S.roundLabel}>{t(`Round ${round}`, `Manche ${round}`)}</div>
            <h2 style={S.pageTitle}>{t('Rank all 5 flags', 'Classe les 5 drapeaux')}</h2>
          </div>
          <div style={S.scorePill}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{totalScore}</div>
            <div style={{ fontSize: '10px', color: '#9EB7E5' }}>total</div>
          </div>
        </div>

        {/* Attribute banner */}
        <div style={{ backgroundColor: '#0B1F3B', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>{openAttr?.icon}</span>
          <div>
            <div style={{ fontSize: '10px', color: '#9EB7E5', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('Attribute', 'Attribut')}</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginTop: '2px' }}>{openAttr ? (locale === 'fr' ? openAttr.fr : openAttr.en) : ''}</div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', textAlign: 'center' }}>
          {isMobile
            ? t('#1 = highest value · use ↑↓ to reorder', '#1 = valeur la plus haute · utilisez ↑↓ pour réordonner')
            : t('#1 = highest value · drag to reorder', '#1 = valeur la plus haute · glisse pour réordonner')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {openOrder.map((code, idx) => {
            const country = countries.find(c => c.code === code)
            if (!country) return null
            const isOver = dragOver === idx

            return (
              <div key={code}
                draggable={!isMobile}
                onDragStart={() => !isMobile && setOpenDragIdx(idx)}
                onDragOver={e => { e.preventDefault(); !isMobile && setDragOver(idx) }}
                onDragLeave={() => !isMobile && setDragOver(null)}
                onDrop={() => !isMobile && openDrop(idx)}
                onDragEnd={() => { !isMobile && setOpenDragIdx(null); !isMobile && setDragOver(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: isOver ? '#EFF6FF' : 'white', border: `2px solid ${isOver ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '10px 14px', cursor: isMobile ? 'default' : 'grab', userSelect: 'none', opacity: openDragIdx === idx ? 0.6 : 1, transition: 'all 0.12s' }}>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#0B1F3B', minWidth: '26px' }}>#{idx+1}</span>
                <img src={`https://flagcdn.com/w80/${code}.png`} style={{ height: '30px', borderRadius: '3px', objectFit: 'cover' }} alt="" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0B1F3B', flex: 1 }}>{locale === 'fr' ? country.fr : country.en}</span>
                {isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <button onClick={() => moveOpenItem(idx, -1)} disabled={idx === 0}
                      style={{ width: '30px', height: '24px', backgroundColor: idx === 0 ? '#f1f5f9' : '#0B1F3B', color: idx === 0 ? '#cbd5e1' : 'white', border: 'none', borderRadius: '6px', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                    <button onClick={() => moveOpenItem(idx, +1)} disabled={idx === openOrder.length - 1}
                      style={{ width: '30px', height: '24px', backgroundColor: idx === openOrder.length - 1 ? '#f1f5f9' : '#0B1F3B', color: idx === openOrder.length - 1 ? '#cbd5e1' : 'white', border: 'none', borderRadius: '6px', cursor: idx === openOrder.length - 1 ? 'default' : 'pointer', fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '16px' }}>⠿</span>
                )}
              </div>
            )
          })}
        </div>
        <button onClick={submitOpen} style={{ ...S.btn, width: '100%', padding: '14px' }}>
          ✓ {t('Validate ranking', 'Valider le classement')}
        </button>
      </div>
    </div>
  )

  // ── PLAYING — MINIMIZE / MAXIMIZE ──────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 16px' }}>
        <div style={S.header}>
          <div>
            <div style={S.roundLabel}>{isMin ? '📉' : '📈'} {t(`Round ${round} · ${currentIdx+1}/5`, `Manche ${round} · ${currentIdx+1}/5`)}</div>
            <h2 style={S.pageTitle}>
              {isMobile
                ? t('Tap a slot, then tap the flag', 'Tape un slot, puis le drapeau')
                : t('Drag & drop the flag in a slot', 'Glisse-dépose le drapeau dans un slot')}
            </h2>
          </div>
          <div style={S.scorePill}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{totalScore}</div>
            <div style={{ fontSize: '10px', color: '#9EB7E5' }}>total</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '22px' }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', backgroundColor: i < currentIdx ? '#0B1F3B' : i === currentIdx ? '#9EB7E5' : '#e2e8f0', transition: 'all 0.3s' }} />)}
        </div>

        {isMobile ? (
          /* ── MOBILE LAYOUT: stacked ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Current flag — tap to place when a slot is selected */}
            <div>
              <div style={S.panelLabel}>{t('Current flag', 'Drapeau actuel')}</div>
              <div
                onClick={handleFlagTapMobile}
                style={{
                  ...S.flagCard,
                  cursor: selectedSlot !== null ? 'pointer' : 'default',
                  border: selectedSlot !== null ? '2px solid #9EB7E5' : '1px solid #e2e8f0',
                  boxShadow: selectedSlot !== null ? '0 0 0 3px rgba(158,183,229,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.15s',
                }}>
                <img src={`https://flagcdn.com/w320/${currentCountry?.code}.png`} alt={currentCountry?.en} style={S.flagImg} />
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0B1F3B' }}>{currentCountry ? (locale === 'fr' ? currentCountry.fr : currentCountry.en) : ''}</div>
                  {selectedSlot !== null && (
                    <div style={{ fontSize: '11px', color: '#9EB7E5', marginTop: '4px', fontWeight: '700' }}>
                      👆 {t(`Tap to place in slot #${selectedSlot + 1}`, `Tape pour placer dans le slot #${selectedSlot + 1}`)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slots — tap to select */}
            <div>
              <div style={S.panelLabel}>
                {selectedSlot !== null
                  ? t(`Slot #${selectedSlot + 1} selected — now tap the flag above`, `Slot #${selectedSlot + 1} sélectionné — tape le drapeau ci-dessus`)
                  : t('Tap a slot to select it', 'Tape un slot pour le sélectionner')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attrs.map((attr, slotIdx) => {
                  const placed   = placements[slotIdx]
                  const isSelected = selectedSlot === slotIdx
                  const taken    = !!placed
                  return (
                    <div key={slotIdx}
                      onClick={() => handleSlotTap(slotIdx)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', minHeight: '58px', cursor: taken ? 'default' : 'pointer', transition: 'all 0.12s',
                        border: taken ? '2px solid #0B1F3B' : isSelected ? '2px solid #9EB7E5' : '2px solid #e2e8f0',
                        backgroundColor: taken ? '#0B1F3B' : isSelected ? '#EFF6FF' : 'white',
                        boxShadow: isSelected ? '0 0 0 3px rgba(158,183,229,0.25)' : 'none',
                      }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: taken ? 'rgba(255,255,255,0.15)' : isSelected ? '#BFDBFE' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: taken ? 'white' : '#0B1F3B', flexShrink: 0 }}>#{slotIdx+1}</div>
                      {taken ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <img src={`https://flagcdn.com/w80/${placed.country.code}.png`} style={{ height: '26px', borderRadius: '3px', objectFit: 'cover' }} alt="" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{locale === 'fr' ? placed.country.fr : placed.country.en}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '1px' }}>{placed.attr.icon} {locale === 'fr' ? placed.attr.fr : placed.attr.en}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ fontSize: '17px' }}>{attr.icon}</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#1d4ed8' : '#0B1F3B' }}>{locale === 'fr' ? attr.fr : attr.en}</div>
                            <div style={{ fontSize: '10px', color: isSelected ? '#3b82f6' : '#94a3b8', marginTop: '1px' }}>
                              {isSelected ? t('Now tap the flag ↑', 'Tape le drapeau ↑') : t('Tap to select', 'Tape pour sélectionner')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── DESKTOP LAYOUT: side by side ── */
          <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left — current flag */}
            <div style={{ width: '190px', flexShrink: 0 }}>
              <div style={S.panelLabel}>{t('Drag this flag', 'Glisse ce drapeau')}</div>
              <div draggable onDragStart={() => setDragging(true)} onDragEnd={() => { setDragging(false); setDragOver(null) }}
                style={{ ...S.flagCard, cursor: 'grab', opacity: dragging ? 0.5 : 1, transform: dragging ? 'scale(0.95) rotate(-1deg)' : 'scale(1)', transition: 'all 0.15s', boxShadow: dragging ? '0 20px 48px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.08)' }}>
                <img src={`https://flagcdn.com/w320/${currentCountry?.code}.png`} alt={currentCountry?.en} style={S.flagImg} draggable={false} />
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0B1F3B' }}>{currentCountry ? (locale === 'fr' ? currentCountry.fr : currentCountry.en) : ''}</div>
                </div>
              </div>
              {Object.keys(placements).length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={S.panelLabel}>{t('Placed', 'Placés')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(placements).map(([slot, { country, attr }]) => (
                      <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', backgroundColor: 'white', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#0B1F3B', minWidth: '14px' }}>#{+slot+1}</span>
                        <img src={`https://flagcdn.com/w40/${country.code}.png`} style={{ height: '13px', borderRadius: '2px' }} alt="" />
                        <span style={{ fontSize: '10px', color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locale === 'fr' ? country.fr : country.en}</span>
                        <span style={{ fontSize: '11px' }}>{attr.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — slots */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={S.panelLabel}>
                {isMin ? t('Slot 1 = lowest rank scores best', 'Slot 1 = rang le plus bas = meilleur') : t('Slot 1 = best attribute score', 'Slot 1 = meilleur score attribut')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attrs.map((attr, slotIdx) => {
                  const placed = placements[slotIdx]
                  const isOver = dragOver === slotIdx
                  const taken  = !!placed
                  return (
                    <div key={slotIdx}
                      onDragOver={e => { e.preventDefault(); if (!taken) setDragOver(slotIdx) }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => { e.preventDefault(); setDragOver(null); if (!taken) handleSlotDrop(slotIdx) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', minHeight: '58px',
                        border: `2px solid ${taken ? '#0B1F3B' : isOver ? '#9EB7E5' : '#e2e8f0'}`,
                        backgroundColor: taken ? '#0B1F3B' : isOver ? '#EFF6FF' : 'white',
                        transform: isOver && !taken ? 'scale(1.01)' : 'scale(1)', transition: 'all 0.12s' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: taken ? 'rgba(255,255,255,0.15)' : isOver ? '#BFDBFE' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: taken ? 'white' : '#0B1F3B', flexShrink: 0 }}>#{slotIdx+1}</div>
                      {taken ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <img src={`https://flagcdn.com/w80/${placed.country.code}.png`} style={{ height: '26px', borderRadius: '3px', objectFit: 'cover' }} alt="" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{locale === 'fr' ? placed.country.fr : placed.country.en}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '1px' }}>{placed.attr.icon} {locale === 'fr' ? placed.attr.fr : placed.attr.en}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ fontSize: '17px' }}>{attr.icon}</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0B1F3B' }}>{locale === 'fr' ? attr.fr : attr.en}</div>
                            <div style={{ fontSize: '10px', color: isOver ? '#3b82f6' : '#94a3b8', marginTop: '1px' }}>{isOver ? t('Drop here!', 'Dépose ici !') : t('Drag & drop the flag here', 'Glisse-dépose le drapeau ici')}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help modal */}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowHelp(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px 28px', maxWidth: '440px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1F3B', margin: 0 }}>❓ {t('How to play', 'Comment jouer')}</h2>
              <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: '🏳️', en: 'A flag appears with an attribute. Place it in the matching slot.', fr: 'Un drapeau apparaît avec un attribut. Placez-le dans le bon slot.' },
                { icon: '📱', en: 'On mobile: tap a slot to select it, then tap the flag to place it.', fr: 'Sur mobile : tape un slot pour le sélectionner, puis tape le drapeau.' },
                { icon: '🖥️', en: 'On desktop: drag and drop the flag directly into a slot.', fr: 'Sur desktop : glisse-dépose le drapeau dans un slot.' },
                { icon: '📈', en: 'Maximize: place flags with extreme values (rank #1 = 100 pts).', fr: 'Maximiser : place les drapeaux aux valeurs extrêmes.' },
                { icon: '📉', en: 'Minimize: place flags with average values.', fr: 'Minimiser : place les drapeaux aux valeurs moyennes.' },
                { icon: '🔓', en: 'Open: rank all 5 flags for a single attribute using ↑↓ on mobile.', fr: 'Ouvert : classe les 5 drapeaux avec ↑↓ sur mobile.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{locale === 'fr' ? item.fr : item.en}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)} style={{ ...S.btn, width: '100%', marginTop: '24px', padding: '12px' }}>
              {t('Got it!', 'Compris !')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  page:       { minHeight: '100vh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body, system-ui)', paddingTop: '28px', paddingBottom: '48px' },
  card:       { maxWidth: '480px', margin: '0 auto', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '36px 32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' },
  title:      { fontSize: '28px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 8px', letterSpacing: '-1px' },
  modeBtn:    { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '14px', border: '2px solid', backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.15s' },
  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' },
  roundLabel: { fontSize: '11px', fontWeight: '700', color: '#9EB7E5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' },
  pageTitle:  { fontSize: isMobile => isMobile ? '18px' : '22px', fontWeight: '900', color: '#0B1F3B', margin: 0, letterSpacing: '-0.5px' },
  scorePill:  { backgroundColor: '#0B1F3B', borderRadius: '12px', padding: '10px 14px', textAlign: 'center', flexShrink: 0 },
  panelLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  flagCard:   { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', userSelect: 'none' },
  flagImg:    { width: '100%', aspectRatio: '3/2', objectFit: 'contain', display: 'block', backgroundColor: '#f0ede4', padding: '6px' },
  resultCard: { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' },
  resultFlag: { height: '30px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 },
  ptsBadge:   { borderRadius: '7px', padding: '5px 10px', fontSize: '13px', fontWeight: '900', color: 'white', flexShrink: 0 },
  btn:        { backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', letterSpacing: '-0.3px' },
  btnSec:     { backgroundColor: 'white', color: '#0B1F3B', border: '2px solid #0B1F3B', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
}
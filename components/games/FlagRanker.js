'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

// ── ATTRIBUTES ────────────────────────────────────────────────────────────────
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

// ── SCORING ────────────────────────────────────────────────────────────────
function getWorldRank(country, attr, allC) {
  if (!allC || !allC.length) return 100
  const sorted = [...allC].sort((a, b) =>
    attr.higher_wins ? b[attr.key] - a[attr.key] : a[attr.key] - b[attr.key]
  )
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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function FlagRanker() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen]           = useState('intro')
  const [mode, setMode]               = useState(null)
  const [round, setRound]             = useState(1)
  const [totalScore, setTotalScore]   = useState(0)
  const [roundScore, setRoundScore]   = useState(0)
  const [countries, setCountries]     = useState([])
  const [attrs, setAttrs]             = useState([])
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [placements, setPlacements]   = useState({})
  const [openOrder, setOpenOrder]     = useState([])
  const [openAttr, setOpenAttr]       = useState(null)
  const [results, setResults]         = useState([])
  const [revealStep, setRevealStep]   = useState(0)
  const [dragOver, setDragOver]       = useState(null)
  const [dragging, setDragging]       = useState(false)
  const [openDragIdx, setOpenDragIdx] = useState(null)
  const [showHelp, setShowHelp]       = useState(false)
  const [allCountries, setAllCountries] = useState([])
  const [dataLoading, setDataLoading]   = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('country_stats')
      .select('*')
      .then(({ data }) => {
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
    const isOpen = m === 'open'
    if (isOpen) {
      setOpenAttr(a[0]); setOpenOrder(c.map(x => x.code)); setAttrs([a[0]])
    } else {
      setAttrs(a)
    }
    setScreen('playing')
  }

  // Minimize/Maximize drop
  function handleSlotDrop(slotIdx) {
    if (placements[slotIdx]) return
    const country = countries[currentIdx]
    const attr    = attrs[currentIdx]
    const next    = { ...placements, [slotIdx]: { country, attr } }
    setPlacements(next)
    if (currentIdx < 4) { setCurrentIdx(currentIdx + 1) }
    else { computeResults(next) }
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

  // Open mode drag
  function openDrop(targetIdx) {
    if (openDragIdx === null || openDragIdx === targetIdx) return
    const next = [...openOrder]
    const [moved] = next.splice(openDragIdx, 1)
    next.splice(targetIdx, 0, moved)
    setOpenOrder(next); setOpenDragIdx(null); setDragOver(null)
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
    setScreen('roundflash')  // brief animated flash then auto-start next round
    setTimeout(() => {
      setRound(r => r + 1)
      setRoundScore(0)
      beginRound(mode)
    }, 1400)
  }



  const isMin = mode === 'minimize'
  const currentCountry = countries[currentIdx]
  const currentAttr    = attrs[currentIdx]

  // ── INTRO ──────────────────────────────────────────────────────────────
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
              descEn: 'Place flags to get the HIGHEST score. Countries with extreme values score more.',
              descFr: 'Place les drapeaux pour obtenir le PLUS GRAND score. Les pays aux valeurs extrêmes rapportent plus.' },
            { id: 'minimize', icon: '📉', en: 'Minimize', fr: 'Minimiser', color: '#3b82f6',
              descEn: 'Place flags to get the LOWEST score. Countries with average values score less.',
              descFr: 'Place les drapeaux pour obtenir le PLUS PETIT score. Les pays moyens rapportent moins.' },
            { id: 'open', icon: '🔓', en: 'Open', fr: 'Ouvert', color: '#f59e0b',
              descEn: 'See all 5 flags + 1 attribute. Drag to rank them, then validate.',
              descFr: 'Vois les 5 drapeaux + 1 attribut. Glisse pour classer, puis valide.' },
          ].map(m => (
            <button key={m.id} onClick={() => startGame(m.id)}
              style={{ ...S.modeBtn, borderColor: m.color }}>
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
        <div style={{ marginTop: '16px', backgroundColor: '#F8F7F4', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            {t('Score based on world rank (195 countries)', 'Score basé sur le rang mondial (195 pays)')}
          </div>
          {[[1,100],[10,77],[50,50],[100,29],[195,0]].map(([rank, score]) => (
            <div key={rank} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', padding: '2px 0' }}>
              <span>{t(`Rank #${rank}`, `Rang #${rank}`)}</span>
              <span style={{ fontWeight: '700', color: score > 70 ? '#22c55e' : score > 40 ? '#f59e0b' : '#ef4444' }}>{score} pts</span>
            </div>
          ))}
        </div>
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
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: isMin ? '8px' : '28px' }}>/ {max} pts ({pct}%)</div>
          {isMin && <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', marginBottom: '24px' }}>💡 {t('Lower = better in Minimize!', 'Plus bas = mieux en Minimiser !')}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setScreen('intro')} style={S.btnSec}>{t('Change mode', 'Changer de mode')}</button>
            <button onClick={() => startGame(mode)} style={S.btn}>{t('Play again', 'Rejouer')}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── BETWEEN ────────────────────────────────────────────────────────────
  if (screen === 'roundflash') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1F3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', animation: 'roundIn 0.4s ease' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#9EB7E5', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
          {t('Get ready', 'Prépare-toi')}
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', color: 'white', letterSpacing: '-3px', lineHeight: 1 }}>
          {t(`Round ${round + 1}`, `Manche ${round + 1}`)}
        </div>
        <div style={{ fontSize: '16px', color: '#9EB7E5', marginTop: '16px' }}>
          {totalScore.toLocaleString()} pts
        </div>
      </div>
      <style>{`@keyframes roundIn { 0%{opacity:0;transform:scale(0.8)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }`}</style>
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
          <div style={S.scorePill}><div style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{roundScore}</div><div style={{ fontSize: '10px', color: '#9EB7E5' }}>pts</div></div>
        </div>
        {isMin && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#1d4ed8', fontWeight: '600' }}>
            💡 {t('Minimize: lower raw score = you did better!', 'Minimiser : score brut plus bas = tu as mieux fait !')}
          </div>
        )}
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
                    {isMin && <span style={{ color: '#3b82f6' }}> · {t('Raw pts', 'Pts bruts')}: {r.rawPts}</span>}
                  </div>
                </div>
                <div style={{ ...S.ptsBadge, backgroundColor: color }}>+{r.pts}</div>
              </div>
            )
          })}
        </div>
        {revealStep >= results.length && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={finishReveal} style={S.btn}>
              {t('Next Round →', 'Manche suivante →')}
            </button>
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
          <div style={S.scorePill}><div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{totalScore}</div><div style={{ fontSize: '10px', color: '#9EB7E5' }}>total</div></div>
        </div>
        <div style={{ backgroundColor: '#0B1F3B', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>{openAttr?.icon}</span>
          <div>
            <div style={{ fontSize: '10px', color: '#9EB7E5', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('Attribute', 'Attribut')}</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginTop: '2px' }}>{openAttr ? (locale === 'fr' ? openAttr.fr : openAttr.en) : ''}</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', textAlign: 'center' }}>
          {t('#1 = highest value · drag to reorder', '#1 = valeur la plus haute · glisse pour réordonner')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {openOrder.map((code, idx) => {
            const country = countries.find(c => c.code === code)
            if (!country) return null
            const isOver = dragOver === idx
            return (
              <div key={code} draggable
                onDragStart={() => setOpenDragIdx(idx)}
                onDragOver={e => { e.preventDefault(); setDragOver(idx) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => openDrop(idx)}
                onDragEnd={() => { setOpenDragIdx(null); setDragOver(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: isOver ? '#EFF6FF' : 'white', border: `2px solid ${isOver ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '10px 14px', cursor: 'grab', userSelect: 'none', opacity: openDragIdx === idx ? 0.6 : 1, transform: openDragIdx === idx ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.12s' }}>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#0B1F3B', minWidth: '26px' }}>#{idx+1}</span>
                <img src={`https://flagcdn.com/w80/${code}.png`} style={{ height: '30px', borderRadius: '3px', objectFit: 'cover' }} alt="" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0B1F3B', flex: 1 }}>{locale === 'fr' ? country.fr : country.en}</span>
                <span style={{ color: '#94a3b8', fontSize: '16px' }}>⠿</span>
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
            <h2 style={S.pageTitle}>{t('Drag & drop the flag in a slot', 'Glisse-dépose le drapeau dans un slot')}</h2>
          </div>
          <div style={S.scorePill}><div style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{totalScore}</div><div style={{ fontSize: '10px', color: '#9EB7E5' }}>total</div></div>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '22px' }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', backgroundColor: i < currentIdx ? '#0B1F3B' : i === currentIdx ? '#9EB7E5' : '#e2e8f0', transition: 'all 0.3s' }} />)}
        </div>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Left — current flag */}
          <div style={{ width: '190px', flexShrink: 0 }}>
            <div style={S.panelLabel}>{t('Drag this flag', 'Glisse ce drapeau')}</div>
            <div draggable onDragStart={() => setDragging(true)} onDragEnd={() => { setDragging(false); setDragOver(null) }}
              style={{ ...S.flagCard, cursor: 'grab', opacity: dragging ? 0.5 : 1, transform: dragging ? 'scale(0.95) rotate(-1deg)' : 'scale(1)', transition: 'all 0.15s', boxShadow: dragging ? '0 20px 48px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.08)' }}>
              <img src={`https://flagcdn.com/w320/${currentCountry?.code}.png`} alt={currentCountry?.en} style={S.flagImg} draggable={false} />
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0B1F3B', marginBottom: '8px' }}>{currentCountry ? (locale === 'fr' ? currentCountry.fr : currentCountry.en) : ''}</div>

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
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', minHeight: '58px', border: `2px solid ${taken ? '#0B1F3B' : isOver ? '#9EB7E5' : '#e2e8f0'}`, backgroundColor: taken ? '#0B1F3B' : isOver ? '#EFF6FF' : 'white', transform: isOver && !taken ? 'scale(1.01)' : 'scale(1)', transition: 'all 0.12s' }}>
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

        {/* How to play modal */}
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
                  { icon: '🏳️', en: 'A flag appears on the left with an attribute (e.g. Highest GDP).', fr: 'Un drapeau apparaît à gauche avec un attribut (ex : PIB le plus élevé).' },
                  { icon: '🎯', en: 'Drag and drop the flag into one of the 5 ranking slots on the right.', fr: "Glisse-dépose le drapeau dans l'un des 5 slots de classement à droite." },
                  { icon: '📊', en: "Each slot has its own attribute. Your score is based on the country's real world rank for that attribute.", fr: 'Chaque slot a son propre attribut. Ton score est basé sur le vrai rang mondial du pays pour cet attribut.' },
                  { icon: '📈', en: 'Maximize: place flags with extreme values (rank #1 = 100 pts).', fr: 'Maximiser : place les drapeaux aux valeurs extrêmes (rang #1 = 100 pts).' },
                  { icon: '📉', en: 'Minimize: place flags with average values (the lower the rank, the better).', fr: "Minimiser : place les drapeaux aux valeurs moyennes (plus le rang est bas, mieux c'est)." },
                  { icon: '🔓', en: 'Open: see all 5 flags at once and rank them for a single attribute.', fr: "Ouvert : vois les 5 drapeaux d'un coup et classe-les pour un seul attribut." },
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
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────
const S = {
  page:       { minHeight: '100vh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body, system-ui)', paddingTop: '28px', paddingBottom: '48px' },
  card:       { maxWidth: '480px', margin: '0 auto', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '36px 32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' },
  title:      { fontSize: '28px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 8px', letterSpacing: '-1px' },
  modeBtn:    { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '14px', border: '2px solid', backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.15s' },
  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' },
  roundLabel: { fontSize: '11px', fontWeight: '700', color: '#9EB7E5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' },
  pageTitle:  { fontSize: '22px', fontWeight: '900', color: '#0B1F3B', margin: 0, letterSpacing: '-0.5px' },
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
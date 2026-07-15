'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'
import Footer from '@/components/Footer'

const GAMES = [
  { key: 'all',          en: 'All games',    fr: 'Tous les jeux' },
  { key: 'flag-reveal',  en: 'Flag Reveal',  fr: 'Flag Reveal' },
  { key: 'flag-quiz',    en: 'Flag Quiz',    fr: 'Flag Quiz' },
  { key: 'past-flag',    en: 'Past Flag',    fr: 'Past Flag' },
  { key: 'capital-clue', en: 'Capital Clue', fr: 'Capital Clue' },
  { key: 'flag-drawing', en: 'Flag Draw',    fr: 'Flag Draw' },
  { key: 'flag-ranker',  en: 'Flag Rank',    fr: 'Flag Rank' },
  { key: 'flag-clue',    en: 'Flag Clue',    fr: 'Flag Clue' },
  { key: 'flag-locator', en: 'Flag Locator', fr: 'Flag Locator' },
]

const MEDALS = ['🥇', '🥈', '🥉']

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function getCurrentPeriodKey(type) {
  const now = new Date()
  if (type === 'week')  return `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, '0')}`
  if (type === 'month') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (type === 'year')  return `${now.getFullYear()}`
  return 'alltime'
}

function getPeriodStart(type, key) {
  if (type === 'alltime') return null
  if (type === 'week') {
    const [year, week] = key.split('-W').map(Number)
    const jan4 = new Date(year, 0, 4)
    const dayOfWeek = jan4.getDay() || 7
    const monday = new Date(jan4)
    monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7)
    return monday
  }
  if (type === 'month') {
    const [year, month] = key.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }
  if (type === 'year') return new Date(parseInt(key), 0, 1)
  return null
}

function getPeriodEnd(type, key) {
  const start = getPeriodStart(type, key)
  if (!start) return null
  const end = new Date(start)
  if (type === 'week')  end.setDate(end.getDate() + 7)
  if (type === 'month') end.setMonth(end.getMonth() + 1)
  if (type === 'year')  end.setFullYear(end.getFullYear() + 1)
  return end
}

function formatPeriodLabel(type, key, locale) {
  if (type === 'alltime') return locale === 'fr' ? 'Tous les temps' : 'All time'
  if (type === 'week') {
    const [year, week] = key.split('-W')
    return locale === 'fr' ? `Semaine ${parseInt(week)}, ${year}` : `Week ${parseInt(week)}, ${year}`
  }
  if (type === 'month') {
    const [year, month] = key.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })
  }
  if (type === 'year') return key
  return key
}

function getPrevPeriodKey(type, key) {
  if (type === 'alltime') return null
  if (type === 'week') {
    const [year, week] = key.split('-W').map(Number)
    if (week > 1) return `${year}-W${String(week - 1).padStart(2, '0')}`
    return `${year - 1}-W52`
  }
  if (type === 'month') {
    const [year, month] = key.split('-').map(Number)
    if (month > 1) return `${year}-${String(month - 1).padStart(2, '0')}`
    return `${year - 1}-12`
  }
  if (type === 'year') return `${parseInt(key) - 1}`
  return null
}

function getNextPeriodKey(type, key) {
  const current = getCurrentPeriodKey(type)
  if (key === current) return null
  if (type === 'week') {
    const [year, week] = key.split('-W').map(Number)
    if (week < 52) return `${year}-W${String(week + 1).padStart(2, '0')}`
    return `${year + 1}-W01`
  }
  if (type === 'month') {
    const [year, month] = key.split('-').map(Number)
    if (month < 12) return `${year}-${String(month + 1).padStart(2, '0')}`
    return `${year + 1}-01`
  }
  if (type === 'year') return `${parseInt(key) + 1}`
  return null
}

function isCurrentPeriod(type, key) {
  return key === getCurrentPeriodKey(type)
}

function Avatar({ name, size = 40 }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const hue = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, backgroundColor: `hsl(${hue}, 55%, 65%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: size * 0.4, color: 'white' }}>
      {initial}
    </div>
  )
}

function LeaderboardRow({ entry, rank, isMe, game, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const displayName = entry.username || `User #${(entry.email_hash || '??????').slice(0, 6)}`
  const gameLabel = GAMES.find(g => g.key === entry.game)?.[locale] || entry.game

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: isMe ? '#EEF4FF' : 'transparent', borderBottom: '1px solid #f8f5ed', transition: 'background 0.15s' }}>
      <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
        {rank <= 3
          ? <span style={{ fontSize: '20px' }}>{MEDALS[rank - 1]}</span>
          : <span style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8' }}>#{rank}</span>
        }
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={displayName} size={38} />
        {entry.country && (
          <img
            src={`https://flagcdn.com/w20/${entry.country.toLowerCase()}.png`}
            alt={entry.country}
            style={{ position: 'absolute', bottom: '-2px', right: '-4px', width: '16px', height: '11px', objectFit: 'contain', borderRadius: '2px', border: '1px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          {isMe && <span style={{ fontSize: '10px', backgroundColor: '#4a7fd4', color: 'white', padding: '1px 6px', borderRadius: '99px', fontWeight: '700', flexShrink: 0 }}>{t('You', 'Vous')}</span>}
        </div>
        {game === 'all' && entry.game && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{gameLabel}</div>}
        {entry.played_at && <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '1px' }}>{new Date(entry.played_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: '900', color: rank === 1 ? '#d97706' : '#0B1F3B', lineHeight: 1 }}>{(entry.score || 0).toLocaleString()}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>pts</div>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [activeTab, setActiveTab] = useState('alltime')
  const [periodKey, setPeriodKey] = useState(() => getCurrentPeriodKey('alltime'))
  const [game, setGame]           = useState('all')
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [myUserId, setMyUserId]   = useState(null)
  const [myRank, setMyRank]       = useState(null)

  const TABS = [
    { key: 'week',    en: 'Weekly',   fr: 'Semaine' },
    { key: 'month',   en: 'Monthly',  fr: 'Mensuel' },
    { key: 'year',    en: 'Yearly',   fr: 'Annuel' },
    { key: 'alltime', en: 'All time', fr: 'Global' },
  ]

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setMyUserId(user.id) })
  }, [])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setPeriodKey(getCurrentPeriodKey(tab))
  }

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const isCurrent = isCurrentPeriod(activeTab, periodKey)

      let data = null, error = null

      if (activeTab === 'alltime' || isCurrent) {
        // Live via RPC
        const res = await supabase.rpc('get_live_leaderboard', { p_period_type: activeTab, p_game: game })
        data = res.data; error = res.error
      } else {
        // Historical snapshot
        const res = await supabase
          .from('leaderboard_snapshots')
          .select('*')
          .eq('period_type', activeTab)
          .eq('period_key', periodKey)
          .eq('game', game)
          .order('rank', { ascending: true })
          .limit(30)
        data = res.data; error = res.error
      }

      if (!error && data) {
        setEntries(data)
        if (myUserId) {
          const myIdx = data.findIndex(e => e.user_id === myUserId)
          setMyRank(myIdx >= 0 ? myIdx + 1 : null)
        }
      } else {
        setEntries([])
      }
    } catch { setEntries([]) }
    setLoading(false)
  }, [activeTab, periodKey, game, myUserId])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const prevKey = getPrevPeriodKey(activeTab, periodKey)
  const nextKey = getNextPeriodKey(activeTab, periodKey)
  const isCurrent = isCurrentPeriod(activeTab, periodKey)

  return (
    <>
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Hero */}
      <div style={{ backgroundColor: '#0B1F3B', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
            🏆 {t('Leaderboard', 'Classement')}
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.6)' }}>
            {t('Top 30 players on KnowFlags', 'Top 30 joueurs sur KnowFlags')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Period tabs */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '6px', display: 'flex', gap: '4px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.15s', backgroundColor: activeTab === tab.key ? '#0B1F3B' : 'transparent', color: activeTab === tab.key ? 'white' : '#64748b' }}>
              {t(tab.en, tab.fr)}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        {activeTab !== 'alltime' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Dropdowns row */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <button onClick={() => prevKey && setPeriodKey(prevKey)} disabled={!prevKey}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', cursor: prevKey ? 'pointer' : 'default', fontSize: '13px', color: prevKey ? '#0B1F3B' : '#cbd5e1', fontWeight: '700', opacity: prevKey ? 1 : 0.4, flexShrink: 0 }}>
                ←
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                {/* Year selector */}
                <select
                  value={periodKey.split('-W')[0].split('-')[0]}
                  onChange={e => {
                    const year = e.target.value
                    if (activeTab === 'year') { setPeriodKey(year); return }
                    if (activeTab === 'month') {
                      const month = periodKey.split('-')[1] || '01'
                      setPeriodKey(`${year}-${month}`)
                    } else {
                      const week = periodKey.split('-W')[1] || '01'
                      setPeriodKey(`${year}-W${week}`)
                    }
                  }}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: 'white', color: '#0B1F3B', outline: 'none' }}>
                  {Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* Week selector (only for 'week' tab) */}
                {activeTab === 'week' && (
                  <select
                    value={periodKey.split('-W')[1] || '01'}
                    onChange={e => {
                      const year = periodKey.split('-W')[0]
                      setPeriodKey(`${year}-W${e.target.value}`)
                    }}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: 'white', color: '#0B1F3B', outline: 'none' }}>
                    {Array.from({ length: 52 }, (_, i) => String(i + 1).padStart(2, '0')).map(w => (
                      <option key={w} value={w}>{t(`Week ${parseInt(w)}`, `Semaine ${parseInt(w)}`)}</option>
                    ))}
                  </select>
                )}

                {/* Month selector (only for 'month' tab) */}
                {activeTab === 'month' && (
                  <select
                    value={periodKey.split('-')[1] || '01'}
                    onChange={e => {
                      const year = periodKey.split('-')[0]
                      setPeriodKey(`${year}-${e.target.value}`)
                    }}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: 'white', color: '#0B1F3B', outline: 'none' }}>
                    {[
                      ['01', 'Janvier', 'January'], ['02', 'Février', 'February'], ['03', 'Mars', 'March'],
                      ['04', 'Avril', 'April'], ['05', 'Mai', 'May'], ['06', 'Juin', 'June'],
                      ['07', 'Juillet', 'July'], ['08', 'Août', 'August'], ['09', 'Septembre', 'September'],
                      ['10', 'Octobre', 'October'], ['11', 'Novembre', 'November'], ['12', 'Décembre', 'December'],
                    ].map(([val, fr, en]) => (
                      <option key={val} value={val}>{locale === 'fr' ? fr : en}</option>
                    ))}
                  </select>
                )}

                {isCurrent && (
                  <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '99px', fontWeight: '700', flexShrink: 0 }}>
                    {t('Live', 'En cours')}
                  </span>
                )}
              </div>

              <button onClick={() => nextKey && setPeriodKey(nextKey)} disabled={!nextKey}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', cursor: nextKey ? 'pointer' : 'default', fontSize: '13px', color: nextKey ? '#0B1F3B' : '#cbd5e1', fontWeight: '700', opacity: nextKey ? 1 : 0.4, flexShrink: 0 }}>
                →
              </button>
            </div>

            {/* Date range label */}
            <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F3B' }}>
                {formatPeriodLabel(activeTab, periodKey, locale)}
              </span>
              {activeTab === 'week' && (() => {
                const start = getPeriodStart(activeTab, periodKey)
                const end   = getPeriodEnd(activeTab, periodKey)
                if (!start || !end) return null
                const fmt = d => d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
                const endDisplay = new Date(end); endDisplay.setDate(endDisplay.getDate() - 1)
                return <span style={{ fontSize: '12px', color: '#94a3b8' }}>{fmt(start)} → {fmt(endDisplay)}</span>
              })()}
            </div>
          </div>
        )}

        {/* Game filter pills */}
        <div style={{ marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
            {GAMES.map(g => (
              <button key={g.key} onClick={() => setGame(g.key)}
                style={{ padding: '6px 14px', borderRadius: '99px', border: `1.5px solid ${game === g.key ? '#0B1F3B' : '#e2e8f0'}`, backgroundColor: game === g.key ? '#0B1F3B' : 'white', color: game === g.key ? 'white' : '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {t(g.en, g.fr)}
              </button>
            ))}
          </div>
        </div>

        {/* My rank banner */}
        {myRank && myUserId && (
          <div style={{ backgroundColor: '#0B1F3B', borderRadius: '12px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{t('Your rank', 'Votre classement')}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                {entries.find(e => e.user_id === myUserId)?.score?.toLocaleString()} pts
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#9EB7E5' }}>#{myRank}</div>
          </div>
        )}

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0ede4', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{t('Player', 'Joueur')}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{t('Score', 'Score')}</span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0B1F3B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#0B1F3B', margin: '0 0 6px' }}>
                {isCurrent ? t('No scores yet — be first!', 'Aucun score — soyez le premier !') : t('No scores recorded', 'Aucun score enregistré')}
              </p>
              {isCurrent && (
                <Link href={`/${locale}/games`} style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
                  🎮 {t('Play now', 'Jouer maintenant')}
                </Link>
              )}
            </div>
          ) : (
            entries.map((entry, i) => (
              <LeaderboardRow key={(entry.user_id || i) + String(i)} entry={entry} rank={entry.rank || i + 1} isMe={entry.user_id === myUserId} game={game} locale={locale} />
            ))
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
          {activeTab !== 'alltime' && isCurrent
            ? t('Live rankings — updated in real time', 'Classement en direct — mis à jour en temps réel')
            : activeTab !== 'alltime'
              ? t('Historical snapshot — scores frozen at end of period', 'Snapshot historique — scores figés en fin de période')
              : t('Global all-time rankings', 'Classement mondial tous les temps')
          }
        </p>

        {/* CTA */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href={`/${locale}/games`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '12px', fontWeight: '800', fontSize: '15px', textDecoration: 'none' }}>
            🎮 {t('Play to earn points', 'Jouer pour gagner des points')}
          </Link>
        </div>

      </div>
    </div>
    <Footer />
  </>
  )
}
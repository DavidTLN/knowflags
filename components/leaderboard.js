'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'

const PERIODS = ['week', 'month', 'year', 'alltime']
const GAMES = ['all', 'flag-reveal', 'flag-quiz', 'past-flag', 'subflag-quiz', 'capital-clue', 'flag-draw']

const GAME_LABELS = {
  'all':          { en: 'All games',     fr: 'Tous les jeux' },
  'flag-reveal':  { en: 'Flag Reveal',   fr: 'Flag Reveal' },
  'flag-quiz':    { en: 'Flag Quiz',     fr: 'Flag Quiz' },
  'past-flag':    { en: 'Past Flag',     fr: 'Past Flag' },
  'subflag-quiz': { en: 'SubFlag Quiz',  fr: 'SubFlag Quiz' },
  'capital-clue': { en: 'Capital Clue',  fr: 'Capital Clue' },
  'flag-draw':    { en: 'Flag Draw',     fr: 'Flag Draw' },
}

const PERIOD_LABELS = {
  week:    { en: 'This week',   fr: 'Cette semaine' },
  month:   { en: 'This month',  fr: 'Ce mois' },
  year:    { en: 'This year',   fr: 'Cette année' },
  alltime: { en: 'All time',    fr: 'Tous les temps' },
}

const MEDALS = ['🥇', '🥈', '🥉']

function getPeriodStart(period) {
  const now = new Date()
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  }
  if (period === 'month') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    return d.toISOString()
  }
  if (period === 'year') {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString()
  }
  return null
}

export default function LeaderboardPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [period, setPeriod]   = useState('alltime')
  const [game, setGame]       = useState('all')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank]   = useState(null)
  const [myEntry, setMyEntry] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [period, game])

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      let query = supabase
        .from('leaderboard_view')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(100)

      if (game !== 'all') {
        query = query.eq('game', game)
      }

      const start = getPeriodStart(period)
      if (start) {
        query = query.gte('created_at', start)
      }

      const { data } = await query

      if (data) {
        setEntries(data)
        if (user) {
          const myIdx = data.findIndex(e => e.user_id === user.id)
          if (myIdx >= 0) {
            setMyRank(myIdx + 1)
            setMyEntry(data[myIdx])
          } else {
            setMyRank(null)
            setMyEntry(null)
          }
        }
      }
    } catch (err) {
      console.error('Leaderboard error:', err)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ backgroundColor: '#0B1F3B', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
            🏆 {t('Global Leaderboard', 'Classement mondial')}
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.6)' }}>
            {t('Top players across all KnowFlags games', 'Les meilleurs joueurs sur tous les jeux KnowFlags')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {/* Period tabs */}
          <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0' }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                backgroundColor: period === p ? '#0B1F3B' : 'transparent',
                color: period === p ? 'white' : '#64748b',
                transition: 'all 0.15s',
              }}>
                {PERIOD_LABELS[p][locale] || PERIOD_LABELS[p].en}
              </button>
            ))}
          </div>

          {/* Game selector */}
          <select value={game} onChange={e => setGame(e.target.value)} style={{ padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', color: '#0B1F3B', cursor: 'pointer', outline: 'none' }}>
            {GAMES.map(g => (
              <option key={g} value={g}>{GAME_LABELS[g]?.[locale] || GAME_LABELS[g]?.en || g}</option>
            ))}
          </select>
        </div>

        {/* My rank banner */}
        {myEntry && myRank && (
          <div style={{ backgroundColor: '#0B1F3B', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#9EB7E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#0B1F3B', fontSize: '16px', flexShrink: 0 }}>
              {myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{t('Your rank', 'Votre classement')}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{myEntry.total_score} pts</div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#9EB7E5' }}>#{myRank}</div>
          </div>
        )}

        {/* Leaderboard table */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              {t('Loading…', 'Chargement…')}
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎮</div>
              <p style={{ color: '#64748b', fontWeight: '600' }}>{t('No scores yet for this period.', 'Aucun score pour cette période.')}</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const isMe = entry.user_id === myEntry?.user_id
              const rank = i + 1
              return (
                <div key={entry.user_id + i} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 20px',
                  borderBottom: i < entries.length - 1 ? '1px solid #f8f5ed' : 'none',
                  backgroundColor: isMe ? '#f0f7ff' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  {/* Rank */}
                  <div style={{ width: '36px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: rank <= 3 ? '#d97706' : '#94a3b8', flexShrink: 0 }}>
                    {rank <= 3 ? MEDALS[rank - 1] : `#${rank}`}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: `hsl(${(entry.username?.charCodeAt(0) || 65) * 137 % 360}, 60%, 70%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: '16px', color: 'white', flexShrink: 0,
                    border: isMe ? '3px solid #4a7fd4' : '2px solid transparent',
                  }}>
                    {(entry.username || entry.email || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.username || entry.email?.split('@')[0] || t('Anonymous', 'Anonyme')}
                      {isMe && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#4a7fd4', color: 'white', padding: '1px 6px', borderRadius: '99px' }}>YOU</span>}
                    </div>
                    {entry.game && game === 'all' && (
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{GAME_LABELS[entry.game]?.[locale] || entry.game}</div>
                    )}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '900', fontSize: '18px', color: rank === 1 ? '#d97706' : '#0B1F3B' }}>
                      {entry.total_score?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>pts</div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CTA to play */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>{t('Want to climb the rankings?', 'Vous voulez grimper dans le classement ?')}</p>
          <Link href={`/${locale}/games`} style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '12px', fontWeight: '800', fontSize: '16px', textDecoration: 'none' }}>
            🎮 {t('Play now', 'Jouer maintenant')}
          </Link>
        </div>
      </div>
    </div>
  )
}
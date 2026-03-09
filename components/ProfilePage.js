'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────

const NAVY  = '#0B1F3B'
const BLUE  = '#9EB7E5'
const CREAM = '#F4F1E6'
const GREEN = '#426A5A'
const GOLD  = '#806D40'

// Badges definitions — unlocked based on stats thresholds
const BADGE_DEFS = [
  // Games played
  { id: 'first_game',     icon: '🎮', en: 'First Game',       fr: 'Première Partie',    descEn: 'Play your first game',              descFr: 'Joue ta première partie',           check: s => s.total_games >= 1 },
  { id: 'ten_games',      icon: '🕹️',  en: 'Regular',          fr: 'Habitué',            descEn: 'Play 10 games',                     descFr: 'Joue 10 parties',                   check: s => s.total_games >= 10 },
  { id: 'fifty_games',    icon: '🏅', en: 'Veteran',           fr: 'Vétéran',            descEn: 'Play 50 games',                     descFr: 'Joue 50 parties',                   check: s => s.total_games >= 50 },
  { id: 'hundred_games',  icon: '💯', en: 'Centurion',         fr: 'Centurion',          descEn: 'Play 100 games',                    descFr: 'Joue 100 parties',                  check: s => s.total_games >= 100 },
  // Streaks
  { id: 'streak_3',       icon: '🔥', en: 'On Fire',           fr: 'En Feu',             descEn: 'Reach a streak of 3',               descFr: 'Atteins une série de 3',            check: s => s.best_streak >= 3 },
  { id: 'streak_10',      icon: '🌋', en: 'Unstoppable',       fr: 'Inarrêtable',        descEn: 'Reach a streak of 10',              descFr: 'Atteins une série de 10',           check: s => s.best_streak >= 10 },
  { id: 'streak_25',      icon: '⚡', en: 'Lightning',         fr: 'Éclair',             descEn: 'Reach a streak of 25',              descFr: 'Atteins une série de 25',           check: s => s.best_streak >= 25 },
  // Flags found
  { id: 'flags_10',       icon: '🏳️', en: 'Explorer',          fr: 'Explorateur',        descEn: 'Find 10 flags',                     descFr: 'Trouve 10 drapeaux',                check: s => s.flags_found >= 10 },
  { id: 'flags_50',       icon: '🌍', en: 'Geographer',        fr: 'Géographe',          descEn: 'Find 50 flags',                     descFr: 'Trouve 50 drapeaux',                check: s => s.flags_found >= 50 },
  { id: 'flags_100',      icon: '🗺️', en: 'Cartographer',      fr: 'Cartographe',        descEn: 'Find 100 flags',                    descFr: 'Trouve 100 drapeaux',               check: s => s.flags_found >= 100 },
  { id: 'flags_all',      icon: '👑', en: 'World Master',      fr: 'Maître du Monde',    descEn: 'Find all 196 flags',                descFr: 'Trouve les 196 drapeaux',           check: s => s.flags_found >= 196 },
  // Score
  { id: 'score_1k',       icon: '⭐', en: 'Scorer',            fr: 'Marqueur',           descEn: 'Earn 1,000 points',                 descFr: 'Gagne 1 000 points',                check: s => s.total_score >= 1000 },
  { id: 'score_10k',      icon: '🌟', en: 'High Scorer',       fr: 'Grand Marqueur',     descEn: 'Earn 10,000 points',                descFr: 'Gagne 10 000 points',               check: s => s.total_score >= 10000 },
  { id: 'score_100k',     icon: '💎', en: 'Legend',            fr: 'Légende',            descEn: 'Earn 100,000 points',               descFr: 'Gagne 100 000 points',              check: s => s.total_score >= 100000 },
  // Drawing
  { id: 'draw_first',     icon: '✏️', en: 'Artist',            fr: 'Artiste',            descEn: 'Complete a Flag Drawing game',      descFr: 'Termine une partie Dessin',         check: s => s.drawing_games >= 1 },
  { id: 'draw_perfect',   icon: '🎨', en: 'Perfectionist',     fr: 'Perfectionniste',    descEn: 'Score 95%+ on a drawing',           descFr: 'Score 95%+ sur un dessin',          check: s => s.drawing_best_score >= 95 },
  // Multi-game
  { id: 'all_games',      icon: '🎯', en: 'All-Rounder',       fr: 'Touche-à-Tout',      descEn: 'Play all 3 games',                  descFr: 'Joue les 3 jeux',                   check: s => s.reveal_games >= 1 && s.quiz_games >= 1 && s.drawing_games >= 1 },
]

// Sample mastered flags for the display (would come from Supabase in production)
const SAMPLE_FLAGS = [
  'fr','de','it','es','gb','us','jp','br','ca','au',
  'cn','ru','in','mx','za','ng','eg','tr','sa','ar',
]

// ── ErmineMark (inline, no import needed) ────────────────────────────────────
function ErmineMark({ size = 28, color = BLUE }) {
  const s = size
  const w = s * 0.62
  const ox = (s - w) / 2
  const headHW  = w * 0.42
  const headTop = s * 0.01
  const barY    = s * 0.40
  const barH    = s * 0.07
  const barW    = w * 1.05
  const dropW   = w * 0.28
  const dropH   = s * 0.30
  const gapY    = barY + barH + s * 0.03
  const dxL = ox + w * 0.12, dxC = s / 2, dxR = ox + w * 0.88
  const headBot = barY - s * 0.02

  const hp = [
    `M ${dxC - headHW} ${headTop + headHW}`,
    `Q ${dxC - headHW} ${headTop} ${dxC} ${headTop}`,
    `Q ${dxC + headHW} ${headTop} ${dxC + headHW} ${headTop + headHW}`,
    `L ${dxC + headHW} ${headBot - headHW * 0.5}`,
    `Q ${dxC + headHW} ${headBot} ${dxC} ${headBot + s * 0.03}`,
    `Q ${dxC - headHW} ${headBot} ${dxC - headHW} ${headBot - headHW * 0.5}`, 'Z'
  ].join(' ')

  const drop = (cx, cy, dw, dh) => {
    const hw = dw / 2
    return [`M ${cx-hw} ${cy}`,`L ${cx-hw} ${cy+dh-hw}`,`Q ${cx-hw} ${cy+dh} ${cx} ${cy+dh}`,`Q ${cx+hw} ${cy+dh} ${cx+hw} ${cy+dh-hw}`,`L ${cx+hw} ${cy}`,'Z'].join(' ')
  }

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ flexShrink: 0 }}>
      <path d={hp} fill={color}/>
      <rect x={s/2-barW/2} y={barY} width={barW} height={barH} rx={barH/2} fill={color}/>
      <path d={drop(dxL, gapY,          dropW,        dropH)}        fill={color}/>
      <path d={drop(dxC, gapY+s*0.04,   dropW*0.95,   dropH*0.92)}   fill={color}/>
      <path d={drop(dxR, gapY,          dropW,        dropH)}        fill={color}/>
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const locale  = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [user,        setUser]        = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [stats,       setStats]       = useState(null)
  const [gameStats,   setGameStats]   = useState(null) // per-game breakdown
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState('overview') // overview | history | flags | badges | settings
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const u = session.user
      setUser(u)

      // Load profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, avatar_url, created_at')
        .eq('user_id', u.id)
        .single()
      setProfile(prof)

      // Load aggregated stats from player_stats (all games combined)
      const { data: allStats } = await supabase
        .from('player_stats')
        .select('game, streak_current, streak_best, flags_found, games_played, total_score, drawing_best_score')
        .eq('user_id', u.id)

      if (allStats) {
        setGameStats(allStats)
        // Aggregate across games
        const agg = allStats.reduce((acc, row) => ({
          total_games:         (acc.total_games || 0)         + (row.games_played || 0),
          flags_found:         (acc.flags_found || 0)         + (row.flags_found || 0),
          best_streak:         Math.max(acc.best_streak || 0,    row.streak_best || 0),
          current_streak:      Math.max(acc.current_streak || 0, row.streak_current || 0),
          total_score:         (acc.total_score || 0)         + (row.total_score || 0),
          reveal_games:        row.game === 'flag-reveal'  ? (row.games_played || 0) : (acc.reveal_games || 0),
          quiz_games:          row.game === 'flag-quiz'    ? (row.games_played || 0) : (acc.quiz_games || 0),
          drawing_games:       row.game === 'flag-drawing' ? (row.games_played || 0) : (acc.drawing_games || 0),
          drawing_best_score:  row.game === 'flag-drawing' ? (row.drawing_best_score || 0) : (acc.drawing_best_score || 0),
        }), {})
        setStats(agg)
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Mock data for empty state (shown when no real Supabase data yet) ─────────
  const mockStats = {
    total_games: 47, flags_found: 83, best_streak: 12, current_streak: 4,
    total_score: 8420, reveal_games: 22, quiz_games: 18, drawing_games: 7,
    drawing_best_score: 88,
  }
  const mockProfile = { username: 'flaglover42', created_at: '2024-11-15T00:00:00Z' }

  const displayStats   = stats   || mockStats
  const displayProfile = profile || mockProfile
  const isMock         = !stats

  const unlockedBadges = BADGE_DEFS.filter(b => b.check(displayStats))
  const lockedBadges   = BADGE_DEFS.filter(b => !b.check(displayStats))

  const joinedDate = displayProfile?.created_at
    ? new Date(displayProfile.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long' })
    : ''

  const TABS = [
    { key: 'overview', icon: '📊', label: t('Overview', 'Vue d\'ensemble') },
    { key: 'flags',    icon: '🏳️', label: t('Flags',    'Drapeaux') },
    { key: 'badges',   icon: '🏅', label: t('Badges',   'Badges') },
    { key: 'settings', icon: '⚙️', label: t('Settings', 'Paramètres') },
  ]

  // ── Shared styles ────────────────────────────────────────────────────────────
  const card = (extra = {}) => ({
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    ...extra,
  })

  const sectionTitle = (text) => (
    <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{text}</p>
  )

  if (loading) return (
    <div style={{ backgroundColor: CREAM, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <ErmineMark size={40} color={BLUE}/>
        <p style={{ color: '#94a3b8', marginTop: '16px', fontFamily: 'Arial', fontSize: '14px' }}>{t('Loading…', 'Chargement…')}</p>
      </div>
    </div>
  )

  if (!user) return (
    <div style={{ backgroundColor: CREAM, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', maxWidth: '340px', padding: '0 24px' }}>
        <ErmineMark size={48} color={BLUE}/>
        <h2 style={{ color: NAVY, margin: '20px 0 10px', fontSize: '22px', fontWeight: '900' }}>{t('Sign in to see your profile', 'Connecte-toi pour voir ton profil')}</h2>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>{t('Track your streaks, badges and flag mastery.', 'Suis tes séries, badges et drapeaux maîtrisés.')}</p>
        <Link href={`/${locale}/auth/login`}
          style={{ display: 'inline-block', backgroundColor: NAVY, color: 'white', padding: '13px 32px', borderRadius: '10px', textDecoration: 'none', fontWeight: '800', fontSize: '15px' }}>
          {t('Sign in', 'Se connecter')}
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: CREAM, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* ── Mock data banner ── */}
      {isMock && (
        <div style={{ backgroundColor: '#fef9c3', borderBottom: '1px solid #fde047', padding: '10px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#854d0e', fontWeight: '600' }}>
            👁️ {t('Preview mode — connect Supabase to see real data', 'Mode aperçu — connecte Supabase pour voir tes vraies données')}
          </span>
        </div>
      )}

      {/* ── Hero header ── */}
      <div style={{ backgroundColor: NAVY, padding: isMobile ? '28px 16px 0' : '36px 40px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '28px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: isMobile ? 72 : 88, height: isMobile ? 72 : 88, borderRadius: '99px', backgroundColor: '#1e3a5f', border: `3px solid ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {displayProfile?.avatar_url
                  ? <img src={displayProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <span style={{ fontSize: isMobile ? 28 : 36, fontWeight: '900', color: BLUE }}>
                      {(displayProfile?.username || user?.email || '?')[0].toUpperCase()}
                    </span>
                }
              </div>
              {/* Streak badge */}
              {displayStats.current_streak > 0 && (
                <div style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: GOLD, borderRadius: '99px', padding: '2px 7px', fontSize: '11px', fontWeight: '900', color: 'white', border: `2px solid ${NAVY}` }}>
                  🔥{displayStats.current_streak}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, paddingBottom: '6px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                {displayProfile?.username || user?.email?.split('@')[0]}
              </h1>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>📅 {t('Joined', 'Membre depuis')} {joinedDate}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>🏅 {unlockedBadges.length}/{BADGE_DEFS.length} {t('badges', 'badges')}</span>
              </div>
            </div>

            {/* Total score pill */}
            <div style={{ flexShrink: 0, textAlign: 'center', paddingBottom: '6px' }}>
              <div style={{ backgroundColor: 'rgba(158,183,229,0.15)', borderRadius: '12px', padding: '10px 16px', border: `1px solid rgba(158,183,229,0.3)` }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>⭐ {displayStats.total_score.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{t('Total score', 'Score total')}</div>
              </div>
            </div>
          </div>

          {/* Quick stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', overflow: 'hidden', marginBottom: '-1px' }}>
            {[
              { value: displayStats.total_games,   label: t('Games', 'Parties'),          icon: '🎮' },
              { value: displayStats.flags_found,    label: t('Flags found', 'Drapeaux'),   icon: '🏳️' },
              { value: `🔥 ${displayStats.best_streak}`, label: t('Best streak', 'Meilleure série'), icon: null },
              { value: `${Math.round((displayStats.flags_found / 196) * 100)}%`, label: t('World coverage', 'Couverture'), icon: '🌍' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '900', color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', marginTop: '1px' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, padding: '12px 8px', border: 'none', backgroundColor: activeTab === tab.key ? CREAM : 'transparent', color: activeTab === tab.key ? NAVY : 'rgba(255,255,255,0.5)', fontWeight: activeTab === tab.key ? '800' : '500', fontSize: isMobile ? '11px' : '13px', cursor: 'pointer', borderRadius: activeTab === tab.key ? '8px 8px 0 0' : '0', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                <span style={{ marginRight: '5px' }}>{tab.icon}</span>
                {!isMobile && tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '20px 14px 48px' : '28px 40px 60px' }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Per-game stats */}
            <div style={card()}>
              {sectionTitle(t('Games breakdown', 'Par jeu'))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'flag-reveal',  icon: '🏳️', en: 'Flag Reveal',  fr: 'Révèle le Drapeau', games: displayStats.reveal_games,  href: `/${locale}/games/flag-reveal`  },
                  { key: 'flag-quiz',    icon: '❓', en: 'Flag Quiz',    fr: 'Quiz Drapeaux',       games: displayStats.quiz_games,    href: `/${locale}/games/flag-quiz`    },
                  { key: 'flag-drawing', icon: '✏️', en: 'Flag Drawing', fr: 'Dessin du Drapeau',   games: displayStats.drawing_games, href: `/${locale}/games/flag-drawing` },
                ].map(g => {
                  const pct = displayStats.total_games > 0 ? Math.round((g.games / displayStats.total_games) * 100) : 0
                  const gameRow = gameStats?.find(r => r.game === g.key)
                  return (
                    <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', backgroundColor: '#f8faff', borderRadius: '12px', border: '1px solid #e8edf8' }}>
                      <span style={{ fontSize: '22px', width: '32px', textAlign: 'center', flexShrink: 0 }}>{g.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: NAVY }}>{locale === 'fr' ? g.fr : g.en}</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: GOLD }}>🔥 {gameRow?.streak_best || 0}</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: BLUE, borderRadius: '99px', transition: 'width 0.6s ease' }}/>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{g.games} {t('games', 'parties')}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{pct}%</span>
                        </div>
                      </div>
                      <Link href={g.href}
                        style={{ flexShrink: 0, padding: '8px 14px', backgroundColor: NAVY, color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '800' }}>
                        {t('Play', 'Jouer')}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Streak history */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div style={card()}>
                {sectionTitle(t('Current streak', 'Série actuelle'))}
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: '52px', fontWeight: '900', color: displayStats.current_streak > 0 ? GOLD : '#cbd5e1' }}>
                    🔥 {displayStats.current_streak}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                    {displayStats.current_streak > 0
                      ? t('Keep it going!', 'Continue comme ça !')
                      : t('Start a new streak', 'Lance une nouvelle série')}
                  </div>
                </div>
              </div>
              <div style={card()}>
                {sectionTitle(t('Best streak ever', 'Meilleure série'))}
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: '52px', fontWeight: '900', color: GOLD }}>
                    🔥 {displayStats.best_streak}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                    {t('Personal record', 'Record personnel')}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent badges preview */}
            <div style={card()}>
              {sectionTitle(t(`Badges (${unlockedBadges.length}/${BADGE_DEFS.length})`, `Badges (${unlockedBadges.length}/${BADGE_DEFS.length})`))}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {unlockedBadges.slice(0, 8).map(b => (
                  <div key={b.id} title={locale === 'fr' ? b.fr : b.en}
                    style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {b.icon}
                  </div>
                ))}
                {unlockedBadges.length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{t('No badges yet — start playing!', 'Aucun badge — commence à jouer !')}</p>
                )}
              </div>
              <button onClick={() => setActiveTab('badges')}
                style={{ fontSize: '13px', color: BLUE, fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {t('See all badges →', 'Voir tous les badges →')}
              </button>
            </div>

          </div>
        )}

        {/* ── FLAGS ── */}
        {activeTab === 'flags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Progress */}
            <div style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: NAVY }}>{t('World coverage', 'Couverture mondiale')}</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: GREEN }}>{Math.round((displayStats.flags_found / 196) * 100)}%</span>
              </div>
              <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${(displayStats.flags_found / 196) * 100}%`, background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`, borderRadius: '99px', transition: 'width 0.8s ease' }}/>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {displayStats.flags_found} / 196 {t('flags found', 'drapeaux trouvés')}
              </div>
            </div>

            {/* Mastered flags grid */}
            <div style={card()}>
              {sectionTitle(t('Mastered flags', 'Drapeaux maîtrisés'))}
              {displayStats.flags_found > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SAMPLE_FLAGS.slice(0, displayStats.flags_found).map(code => (
                    <div key={code} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '2px solid #e2e8f0', flexShrink: 0 }}>
                      <img src={`https://flagcdn.com/w80/${code}.png`} alt={code}
                        style={{ display: 'block', width: '56px', height: '37px', objectFit: 'cover' }}/>
                    </div>
                  ))}
                  {displayStats.flags_found > SAMPLE_FLAGS.length && (
                    <div style={{ width: '56px', height: '37px', backgroundColor: '#f8faff', borderRadius: '6px', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>
                      +{displayStats.flags_found - SAMPLE_FLAGS.length}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>{t('No flags found yet — start playing!', 'Aucun drapeau encore — commence à jouer !')}</p>
              )}
            </div>

            {/* To discover */}
            <div style={card()}>
              {sectionTitle(t('Still to discover', 'Encore à découvrir'))}
              <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#64748b' }}>
                {196 - displayStats.flags_found} {t('flags left to master across all games.', 'drapeaux restants à maîtriser dans tous les jeux.')}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link href={`/${locale}/games/flag-reveal`}
                  style={{ padding: '10px 18px', backgroundColor: NAVY, color: 'white', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: '800' }}>
                  {t('Play Flag Reveal', 'Jouer à Flag Reveal')} →
                </Link>
                <Link href={`/${locale}/games/flag-quiz`}
                  style={{ padding: '10px 18px', backgroundColor: 'white', color: NAVY, borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', border: '1.5px solid #e2e8f0' }}>
                  {t('Play Flag Quiz', 'Jouer au Quiz')} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── BADGES ── */}
        {activeTab === 'badges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Unlocked */}
            {unlockedBadges.length > 0 && (
              <div style={card()}>
                {sectionTitle(t(`Unlocked · ${unlockedBadges.length}`, `Débloqués · ${unlockedBadges.length}`))}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {unlockedBadges.map(b => (
                    <div key={b.id} style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1.5px solid #bbf7d0', padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '7px' }}>{b.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: NAVY, marginBottom: '3px' }}>{locale === 'fr' ? b.fr : b.en}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{locale === 'fr' ? b.descFr : b.descEn}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            <div style={card()}>
              {sectionTitle(t(`Locked · ${lockedBadges.length}`, `Verrouillés · ${lockedBadges.length}`))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                {lockedBadges.map(b => (
                  <div key={b.id} style={{ backgroundColor: '#f8faff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '14px 12px', textAlign: 'center', opacity: 0.6 }}>
                    <div style={{ fontSize: '32px', marginBottom: '7px', filter: 'grayscale(1)' }}>{b.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>{locale === 'fr' ? b.fr : b.en}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>{locale === 'fr' ? b.descFr : b.descEn}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Account info */}
            <div style={card()}>
              {sectionTitle(t('Account', 'Compte'))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: t('Email', 'Email'),       value: user?.email || '—',                    icon: '📧' },
                  { label: t('Username', 'Pseudo'),    value: displayProfile?.username || '—',        icon: '👤' },
                  { label: t('Member since', 'Membre depuis'), value: joinedDate,                    icon: '📅' },
                  { label: t('Language', 'Langue'),   value: locale === 'fr' ? 'Français 🇫🇷' : 'English 🇬🇧', icon: '🌐' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: '#f8faff', borderRadius: '10px' }}>
                    <span style={{ fontSize: '18px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{row.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{row.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: NAVY }}>{row.value}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>{t('Read only', 'Lecture seule')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ ...card(), border: '1.5px solid #fecaca' }}>
              {sectionTitle(t('Danger zone', 'Zone dangereuse'))}
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                {t('These actions are irreversible. Please be careful.', 'Ces actions sont irréversibles. Sois prudent.')}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.href = `/${locale}`
                  }}
                  style={{ padding: '10px 20px', backgroundColor: 'white', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {t('Sign out', 'Se déconnecter')}
                </button>
                <button style={{ padding: '10px 20px', backgroundColor: 'white', color: '#94a3b8', border: '1.5px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {t('Delete account', 'Supprimer le compte')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  navy:   '#0B1F3B',
  blue:   '#9EB7E5',
  cream:  '#F4F1E6',
  green:  '#426A5A',
  gold:   '#806D40',
  red:    '#C0392B',
  bg:     '#F7F5EF',
  border: '#E2DDD5',
  muted:  '#8A8278',
  white:  '#FFFFFF',
}

// ── ErmineMark ────────────────────────────────────────────────────────────────
function ErmineMark({ size = 28, color = C.blue }) {
  const s = size, w = s * 0.62, ox = (s - w) / 2
  const headHW = w * 0.42, headTop = s * 0.01
  const barY = s * 0.40, barH = s * 0.07, barW = w * 1.05
  const dropW = w * 0.28, dropH = s * 0.30
  const gapY = barY + barH + s * 0.03
  const dxL = ox + w * 0.12, dxC = s / 2, dxR = ox + w * 0.88
  const headBot = barY - s * 0.02
  const headPath = [
    `M ${dxC - headHW} ${headTop + headHW}`,
    `Q ${dxC - headHW} ${headTop} ${dxC} ${headTop}`,
    `Q ${dxC + headHW} ${headTop} ${dxC + headHW} ${headTop + headHW}`,
    `L ${dxC + headHW} ${headBot - headHW * 0.5}`,
    `Q ${dxC + headHW} ${headBot} ${dxC} ${headBot + s * 0.03}`,
    `Q ${dxC - headHW} ${headBot} ${dxC - headHW} ${headBot - headHW * 0.5}`,
    'Z'
  ].join(' ')
  function drop(cx, cy, dw, dh) {
    const hw = dw / 2, r = hw
    return [`M ${cx-hw} ${cy}`,`L ${cx-hw} ${cy+dh-r}`,
            `Q ${cx-hw} ${cy+dh} ${cx} ${cy+dh}`,
            `Q ${cx+hw} ${cy+dh} ${cx+hw} ${cy+dh-r}`,
            `L ${cx+hw} ${cy}`,'Z'].join(' ')
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ flexShrink: 0 }}>
      <path d={headPath} fill={color}/>
      <rect x={s/2-barW/2} y={barY} width={barW} height={barH} rx={barH/2} fill={color}/>
      <path d={drop(dxL, gapY,        dropW,      dropH)}      fill={color}/>
      <path d={drop(dxC, gapY+s*0.04, dropW*0.95, dropH*0.92)} fill={color}/>
      <path d={drop(dxR, gapY,        dropW,      dropH)}      fill={color}/>
    </svg>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────
const BADGES = [
  { id: 'first_game',    icon: '🎮', en: 'First Game',     fr: 'Première Partie',  en_d: 'Played your first game',         fr_d: 'Première partie jouée',          condition: s => s.total_games >= 1   },
  { id: 'streak_5',      icon: '🔥', en: 'On Fire',        fr: 'En Feu',           en_d: '5-game win streak',              fr_d: 'Série de 5 victoires',           condition: s => s.best_streak >= 5   },
  { id: 'streak_10',     icon: '💥', en: 'Unstoppable',    fr: 'Inarrêtable',      en_d: '10-game win streak',             fr_d: 'Série de 10 victoires',          condition: s => s.best_streak >= 10  },
  { id: 'flags_10',      icon: '🏳️', en: 'Flag Collector', fr: 'Collectionneur',   en_d: '10 flags mastered',              fr_d: '10 drapeaux maîtrisés',          condition: s => s.mastered >= 10     },
  { id: 'flags_50',      icon: '🌍', en: 'World Explorer', fr: 'Explorateur',      en_d: '50 flags mastered',              fr_d: '50 drapeaux maîtrisés',          condition: s => s.mastered >= 50     },
  { id: 'flags_100',     icon: '🌐', en: 'Vexillologist',  fr: 'Vexillologue',     en_d: '100 flags mastered',             fr_d: '100 drapeaux maîtrisés',         condition: s => s.mastered >= 100    },
  { id: 'games_50',      icon: '🎯', en: 'Dedicated',      fr: 'Assidu',           en_d: '50 games played',                fr_d: '50 parties jouées',              condition: s => s.total_games >= 50  },
  { id: 'games_100',     icon: '🏆', en: 'Champion',       fr: 'Champion',         en_d: '100 games played',               fr_d: '100 parties jouées',             condition: s => s.total_games >= 100 },
  { id: 'artist',        icon: '🎨', en: 'Artist',         fr: 'Artiste',          en_d: 'Drew a flag with 90%+ accuracy', fr_d: 'Dessiné un drapeau à 90%+',      condition: s => s.best_drawing >= 90 },
  { id: 'perfectionist', icon: '✨', en: 'Perfectionist',  fr: 'Perfectionniste',  en_d: 'Drew a flag with 100% accuracy', fr_d: 'Dessiné un drapeau à 100%',      condition: s => s.best_drawing >= 100},
  { id: 'scholar',       icon: '📚', en: 'Scholar',        fr: 'Érudit',           en_d: 'Played all 3 game types',        fr_d: 'Joué aux 3 types de jeux',       condition: s => s.games_per_type >= 3},
  { id: 'polyglot',      icon: '🗣️', en: 'Polyglot',       fr: 'Polyglotte',       en_d: 'Used the app in both languages', fr_d: 'Utilisé les deux langues',       condition: s => s.used_both_locales  },
]

const GAMES_META = {
  'flag-reveal':    { icon: '🏳️', en: 'Flag Reveal',   fr: 'Révèle le Drapeau', color: C.blue,  href: 'flag-reveal'  },
  'flag-quiz':      { icon: '❓', en: 'Flag Quiz',      fr: 'Quiz Drapeaux',     color: C.green, href: 'flag-quiz'    },
  'capital-city':   { icon: '🏙️', en: 'Capital City',  fr: 'Capitale',          color: '#e07c3a', href: 'capital-city' },
  'flag-drawing':   { icon: '✏️', en: 'Flag Drawing',  fr: 'Dessin du Drapeau', color: C.gold,  href: 'flag-drawing' },
}

// Capital City mode labels
const CAPITAL_MODES = {
  'capital_city_flag_mcq':    { en: 'Flag → Capital (MCQ)',    fr: 'Drapeau → Capitale (QCM)' },
  'capital_city_flag_type':   { en: 'Flag → Capital (Type)',   fr: 'Drapeau → Capitale (Saisie)' },
  'capital_city_flag_both':   { en: 'Flag → Capital (Mixed)',  fr: 'Drapeau → Capitale (Mixte)' },
  'capital_city_name_mcq':    { en: 'Country → Capital (MCQ)', fr: 'Pays → Capitale (QCM)' },
  'capital_city_name_type':   { en: 'Country → Capital (Type)',fr: 'Pays → Capitale (Saisie)' },
  'capital_city_name_both':   { en: 'Country → Capital (Mixed)',fr: 'Pays → Capitale (Mixte)' },
  'capital_city_both_mcq':    { en: 'Mixed → Capital (MCQ)',   fr: 'Mixte → Capitale (QCM)' },
  'capital_city_both_type':   { en: 'Mixed → Capital (Type)',  fr: 'Mixte → Capitale (Saisie)' },
  'capital_city_both_both':   { en: 'Mixed → Capital (Mixed)', fr: 'Mixte → Capitale (Mixte)' },
}

// ── Helpers ──────────────────────────────────────────────
function formatDuration(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ username, avatarUrl, size = 80, onClick }) {
  const initials = (username || '?').slice(0, 2).toUpperCase()
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: C.navy, border: `3px solid ${C.blue}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 4px 20px rgba(11,31,59,0.2)',
      position: 'relative',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : <span style={{ fontSize: size * 0.32, fontWeight: '800', color: C.blue, fontFamily: "var(--font-display)" }}>{initials}</span>
      }
    </div>
  )
}

function StatCard({ icon, value, label, accent }) {
  return (
    <div style={{
      backgroundColor: C.white, borderRadius: '14px', padding: '20px 16px',
      border: `1px solid ${C.border}`, textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: '800', color: accent || C.navy, fontFamily: "var(--font-display)", lineHeight: 1, marginBottom: '5px' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: C.muted }}>
        {label}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
      <div style={{ width: '4px', height: '20px', backgroundColor: C.blue, borderRadius: '2px', flexShrink: 0 }}/>
      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: C.navy, fontFamily: "var(--font-display)" }}>{children}</h2>
    </div>
  )
}

function FlagCell({ code, mastered }) {
  return (
    <div title={code.toUpperCase()} style={{
      borderRadius: '5px', overflow: 'hidden',
      border: mastered ? `2px solid ${C.green}` : `1px solid ${C.border}`,
      opacity: mastered ? 1 : 0.35,
      boxShadow: mastered ? `0 2px 8px rgba(66,106,90,0.2)` : 'none',
      position: 'relative',
    }}>
      <img
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={code}
        style={{ width: '100%', display: 'block', aspectRatio: '3/2', objectFit: 'cover' }}
      />
      {mastered && <div style={{ position: 'absolute', bottom: '1px', right: '2px', fontSize: '8px' }}>✅</div>}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [stats, setStats]         = useState([])
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing]     = useState(false)
  const [editForm, setEditForm]   = useState({ username: '', locale: 'en' })
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [gameScores, setGameScores] = useState([])
  const fileRef = useRef(null)

  // ── Load ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    async function load(uid) {
      const [pR, sR, hR, gR] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', uid).single(),
        supabase.from('player_stats').select('*').eq('user_id', uid),
        supabase.from('flag_history').select('*').eq('user_id', uid)
          .order('played_at', { ascending: false }).limit(200),
        supabase.from('game_scores').select('*').eq('user_id', uid),
      ])
      if (pR.data) setProfile(pR.data)
      if (sR.data) setStats(sR.data)
      if (hR.data) setHistory(hR.data)
      if (gR.data) setGameScores(gR.data)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); load(session.user.id) }
      else setLoading(false)
    })
  }, [])

  // ── Computed ──────────────────────────────────────────────
  const totalGames  = stats.reduce((a, s) => a + (s.games_played || 0), 0)
  const totalFlags  = stats.reduce((a, s) => a + (s.flags_found  || 0), 0)
  const totalScore  = stats.reduce((a, s) => a + (s.total_score  || 0), 0)
  const bestStreak  = Math.max(0, ...stats.map(s => s.streak_best    || 0))
  const curStreak   = Math.max(0, ...stats.map(s => s.streak_current || 0))
  const bestDrawing = Math.max(0, ...stats.filter(s => s.game === 'flag-drawing').map(s => s.drawing_best_score || 0))
  const gamesPerType = new Set(stats.filter(s => s.games_played > 0).map(s => s.game)).size

  const masteredSet = new Set(history.filter(h => h.won).map(h => h.flag_code))
  const masteredArr = [...masteredSet]
  const allPlayed   = [...new Set(history.map(h => h.flag_code))]
  const toLearn     = allPlayed.filter(c => !masteredSet.has(c))

  const agg = { total_games: totalGames, best_streak: bestStreak, mastered: masteredArr.length,
    used_both_locales: false, best_drawing: bestDrawing, games_per_type: gamesPerType }

  const unlocked = BADGES.filter(b => b.condition(agg))
  const locked   = BADGES.filter(b => !b.condition(agg))

  // ── Actions ───────────────────────────────────────────────
  function startEdit() {
    setEditForm({ username: profile?.username || '', locale: profile?.locale || 'en' })
    setEditing(true)
  }

  async function saveProfile() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles')
      .update({ username: editForm.username.trim(), locale: editForm.locale })
      .eq('user_id', user.id)
    if (!error) {
      setProfile(p => ({ ...p, username: editForm.username.trim(), locale: editForm.locale }))
      setSaveMsg(t('Saved!', 'Enregistré !'))
      setTimeout(() => { setSaveMsg(''); setEditing(false) }, 1500)
    } else {
      setSaveMsg(t('Error saving.', 'Erreur lors de la sauvegarde.'))
    }
    setSaving(false)
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarBusy(true)
    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', user.id)
      setProfile(p => ({ ...p, avatar_url: data.publicUrl }))
    }
    setAvatarBusy(false)
  }

  const TABS = [
    { id: 'overview',  en: 'Overview',   fr: 'Résumé'      },
    { id: 'games',     en: 'Games',      fr: 'Jeux'        },
    { id: 'history',   en: 'History',    fr: 'Historique'  },
    { id: 'flags',     en: 'Flags',      fr: 'Drapeaux'    },
    { id: 'badges',    en: 'Badges',     fr: 'Badges'      },
    { id: 'settings',  en: 'Settings',   fr: 'Paramètres'  },
  ]

  // ── Guards ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <ErmineMark size={48} color={C.blue}/>
        <div style={{ marginTop: '16px', fontSize: '14px', color: C.muted, fontFamily: "var(--font-display)" }}>
          {t('Loading your profile…', 'Chargement de votre profil…')}
        </div>
      </div>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <ErmineMark size={56} color={C.navy}/>
        <h2 style={{ marginTop: '20px', fontSize: '22px', fontWeight: '700', color: C.navy, fontFamily: "var(--font-display)" }}>
          {t('Sign in to see your profile', 'Connectez-vous pour voir votre profil')}
        </h2>
        <p style={{ color: C.muted, fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
          {t('Track your streaks, badges, and flag mastery.', 'Suivez vos séries, badges et drapeaux maîtrisés.')}
        </p>
        <a href={`/${locale}/login`} style={{
          display: 'inline-block', padding: '12px 28px',
          backgroundColor: C.navy, color: C.cream, borderRadius: '10px',
          textDecoration: 'none', fontWeight: '700', fontSize: '14px',
        }}>
          {t('Sign in', 'Se connecter')}
        </a>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: "var(--font-body)" }}>

      {/* ── Hero header ─────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #162d4a 100%)`, padding: '40px 24px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '22px', marginBottom: '28px', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar}/>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} size={84}/>
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: C.blue, border: `2px solid ${C.navy}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px',
              }}>
                {avatarBusy ? '⏳' : '✏️'}
              </div>
            </div>

            {/* Identity */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: C.cream, fontFamily: "var(--font-display)", letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {profile?.username || user.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(244,241,230,0.45)', marginTop: '4px' }}>
                {user.email}
              </div>
              <div style={{ display: 'flex', gap: '7px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', backgroundColor: 'rgba(224,124,58,0.2)', color: '#f0a060', padding: '3px 10px', borderRadius: '99px', fontWeight: '700' }}>
                  🔥 ×{curStreak}
                </span>
                <span style={{ fontSize: '11px', backgroundColor: 'rgba(66,106,90,0.25)', color: '#7ec4a7', padding: '3px 10px', borderRadius: '99px', fontWeight: '700' }}>
                  ✅ {masteredArr.length} {t('mastered', 'maîtrisés')}
                </span>
                <span style={{ fontSize: '11px', backgroundColor: 'rgba(128,109,64,0.25)', color: '#d4a96a', padding: '3px 10px', borderRadius: '99px', fontWeight: '700' }}>
                  ⭐ {totalScore.toLocaleString()} pts
                </span>
              </div>
            </div>

            <button onClick={startEdit} style={{
              padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)',
              color: C.cream, border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '9px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              ✏️ {t('Edit profile', 'Modifier le profil')}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '11px 18px', border: 'none', background: 'transparent',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeTab === tab.id ? C.cream : 'rgba(244,241,230,0.4)',
                borderBottom: activeTab === tab.id ? `2px solid ${C.blue}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                {t(tab.en, tab.fr)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (<>
          <SectionTitle>{t('Your Stats', 'Vos statistiques')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '11px', marginBottom: '36px' }}>
            <StatCard icon="🎮" value={totalGames}                   label={t('Games', 'Parties')}           accent={C.navy}  />
            <StatCard icon="🔥" value={curStreak}                    label={t('Streak', 'Série actuelle')}   accent="#e07c3a" />
            <StatCard icon="💥" value={bestStreak}                   label={t('Best streak', 'Meilleure')}   accent="#e07c3a" />
            <StatCard icon="✅" value={masteredArr.length}           label={t('Mastered', 'Maîtrisés')}      accent={C.green} />
            <StatCard icon="⭐" value={totalScore.toLocaleString()}  label={t('Score', 'Score total')}       accent={C.gold}  />
            <StatCard icon="🏅" value={`${unlocked.length}/${BADGES.length}`} label={t('Badges', 'Badges')} accent={C.blue}  />
          </div>

          <SectionTitle>{t('By Game', 'Par jeu')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
            {Object.entries(GAMES_META).map(([key, meta]) => {
              const s = stats.find(x => x.game === key)
              return (
                <div key={key} style={{
                  backgroundColor: C.white, borderRadius: '13px', padding: '16px 20px',
                  border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}>
                  <span style={{ fontSize: '26px', width: '34px', textAlign: 'center', flexShrink: 0 }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: C.navy, marginBottom: '5px', fontFamily: "var(--font-display)" }}>
                      {t(meta.en, meta.fr)}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {[
                        [t('Games', 'Parties'),           s?.games_played   || 0],
                        [t('Flags found', 'Drapeaux'),    s?.flags_found    || 0],
                        [t('Best streak', 'Meilleure série'), s?.streak_best || 0],
                        ...(key === 'flag-drawing' ? [[t('Best accuracy', 'Meilleure précision'), `${s?.drawing_best_score || 0}%`]] : []),
                      ].map(([lbl, val]) => (
                        <span key={lbl} style={{ fontSize: '12px', color: C.muted }}>
                          <span style={{ fontWeight: '700', color: meta.color }}>{val}</span> {lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(s?.streak_current > 0) && (
                    <span style={{ fontSize: '12px', backgroundColor: '#fff4e8', color: '#e07c3a', padding: '4px 10px', borderRadius: '99px', fontWeight: '700', flexShrink: 0 }}>
                      🔥 ×{s.streak_current}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <SectionTitle>{t('Recent Activity', 'Activité récente')}</SectionTitle>
          {history.length === 0
            ? <div style={{ color: C.muted, fontSize: '14px', padding: '16px 0' }}>{t('No games played yet.', 'Aucune partie jouée.')}</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {history.slice(0, 15).map((h, i) => {
                  const meta = GAMES_META[h.game] || {}
                  const date = new Date(h.played_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      backgroundColor: C.white, borderRadius: '9px', padding: '10px 14px',
                      border: `1px solid ${C.border}`,
                    }}>
                      <img src={`https://flagcdn.com/w40/${h.flag_code?.toLowerCase()}.png`} alt={h.flag_code}
                        style={{ width: '32px', height: '21px', objectFit: 'cover', borderRadius: '3px', border: `1px solid ${C.border}`, flexShrink: 0 }}/>
                      <span style={{ fontSize: '14px', color: h.won ? C.green : C.red, fontWeight: '700' }}>{h.won ? '✓' : '✗'}</span>
                      <span style={{ fontSize: '12px', color: C.muted, flex: 1 }}>{meta.icon} {t(meta.en, meta.fr)}</span>
                      {h.score > 0 && <span style={{ fontSize: '12px', fontWeight: '700', color: C.gold }}>+{h.score} pts</span>}
                      <span style={{ fontSize: '11px', color: C.muted, flexShrink: 0 }}>{date}</span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </>)}

        {/* ══ GAMES ══ */}
        {activeTab === 'games' && (<>
          <SectionTitle>{t('Games Statistics', 'Statistiques par jeu')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
            {Object.entries(GAMES_META).map(([key, meta]) => {
              const s = stats.find(x => x.game === key)
              const capitalModeScores = gameScores.filter(g => g.mode?.startsWith('capital_city_'))
              const singleScore = gameScores.find(g => g.mode === key.replace('-', '_'))
              return (
                <div key={key} style={{ backgroundColor: C.white, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ backgroundColor: meta.color + '18', borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: C.navy }}>{t(meta.en, meta.fr)}</div>
                    </div>
                    <a href={`/${locale}/games/${meta.href}`} style={{ fontSize: '12px', fontWeight: '700', color: meta.color, textDecoration: 'none', padding: '6px 12px', border: `1px solid ${meta.color}`, borderRadius: '99px' }}>
                      {t('Play →', 'Jouer →')}
                    </a>
                  </div>
                  {key !== 'capital-city' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', backgroundColor: C.border }}>
                      {[
                        { label: t('Games played', 'Parties jouées'),      value: s?.games_played || 0,             icon: '🎮' },
                        { label: t('Best streak', 'Meilleure série'),       value: s?.streak_best || 0,              icon: '🔥' },
                        { label: t('Flags found', 'Drapeaux trouvés'),      value: s?.flags_found || 0,              icon: '✅' },
                        { label: t('Longest game', 'Partie la plus longue'),value: formatDuration(s?.longest_game),  icon: '⏱' },
                        ...(key === 'flag-reveal' || key === 'flag-quiz' ? [
                          { label: t('Best score', 'Meilleur score'), value: singleScore?.best_streak ? `${singleScore.best_streak} pts` : '—', icon: '⭐' },
                        ] : []),
                        ...(key === 'flag-drawing' ? [
                          { label: t('Best accuracy', 'Meilleure précision'), value: `${s?.drawing_best_score || 0}%`, icon: '🎨' },
                        ] : []),
                      ].map((item, i) => (
                        <div key={i} style={{ backgroundColor: C.white, padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: meta.color }}>{item.value}</div>
                          <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '16px 20px' }}>
                      {capitalModeScores.length === 0 ? (
                        <p style={{ color: C.muted, fontSize: '14px', textAlign: 'center', margin: '12px 0' }}>
                          {t('No games played yet', 'Aucune partie jouée')}
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {capitalModeScores.map(gs => {
                            const modeLabel = CAPITAL_MODES[gs.mode]
                            return (
                              <div key={gs.mode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: C.bg, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: C.navy }}>
                                  {modeLabel ? t(modeLabel.en, modeLabel.fr) : gs.mode}
                                </span>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                  <span style={{ fontSize: '13px', color: C.muted }}>
                                    🔥 <strong style={{ color: '#e07c3a' }}>{gs.best_streak}</strong> {t('best streak', 'meilleure série')}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>)}

        {/* ══ HISTORY ══ */}
        {activeTab === 'history' && (<>
          <SectionTitle>{t(`Game History (${history.length} entries)`, `Historique (${history.length} entrées)`)}</SectionTitle>
          {history.length === 0
            ? <div style={{ color: C.muted, fontSize: '14px', padding: '16px 0' }}>{t('No games played yet.', 'Aucune partie jouée.')}</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {history.slice(0, 50).map((h, i) => {
                  const meta = GAMES_META[h.game] || {}
                  const d = new Date(h.played_at)
                  const date = d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '13px',
                      backgroundColor: h.won ? 'rgba(66,106,90,0.04)' : C.white,
                      borderRadius: '10px', padding: '11px 15px',
                      border: `1px solid ${h.won ? 'rgba(66,106,90,0.2)' : C.border}`,
                    }}>
                      <img src={`https://flagcdn.com/w40/${h.flag_code?.toLowerCase()}.png`} alt={h.flag_code}
                        style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px', border: `1px solid ${C.border}`, flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy }}>{h.flag_code?.toUpperCase()}</div>
                        <div style={{ fontSize: '11px', color: C.muted }}>{meta.icon} {t(meta.en, meta.fr)} · {date} {time}</div>
                      </div>
                      {h.score > 0 && <span style={{ fontSize: '13px', fontWeight: '700', color: C.gold, flexShrink: 0 }}>+{h.score} pts</span>}
                      <span style={{ fontSize: '18px' }}>{h.won ? '✅' : '❌'}</span>
                    </div>
                  )
                })}
                {history.length > 50 && (
                  <div style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: C.muted }}>
                    {t(`Showing 50 of ${history.length} games`, `Affichage de 50 sur ${history.length} parties`)}
                  </div>
                )}
              </div>
            )
          }
        </>)}

        {/* ══ FLAGS ══ */}
        {activeTab === 'flags' && (<>
          <SectionTitle>✅ {masteredArr.length} {t('flags mastered', 'drapeaux maîtrisés')}</SectionTitle>
          {masteredArr.length === 0
            ? <div style={{ color: C.muted, fontSize: '14px', marginBottom: '32px' }}>{t('No flags mastered yet — start playing!', 'Aucun drapeau maîtrisé — jouez !')}</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: '7px', marginBottom: '36px' }}>
                {masteredArr.map(code => <FlagCell key={code} code={code} mastered={true}/>)}
              </div>
          }
          {toLearn.length > 0 && (<>
            <SectionTitle>📚 {toLearn.length} {t('flags to master', 'drapeaux à maîtriser')}</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: '7px', marginBottom: '36px' }}>
              {toLearn.map(code => <FlagCell key={code} code={code} mastered={false}/>)}
            </div>
          </>)}
          {masteredArr.length === 0 && toLearn.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>🏳️</div>
              <div style={{ fontSize: '15px', color: C.muted }}>{t('Play games to build your flag collection!', 'Jouez pour constituer votre collection de drapeaux !')}</div>
            </div>
          )}
        </>)}

        {/* ══ BADGES ══ */}
        {activeTab === 'badges' && (<>
          <SectionTitle>{t(`${unlocked.length} badge${unlocked.length !== 1 ? 's' : ''} unlocked`, `${unlocked.length} badge${unlocked.length !== 1 ? 's' : ''} débloqué${unlocked.length !== 1 ? 's' : ''}`)}</SectionTitle>
          {unlocked.length === 0
            ? <div style={{ color: C.muted, fontSize: '14px', marginBottom: '32px' }}>{t('No badges yet — keep playing!', 'Aucun badge — continuez à jouer !')}</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '36px' }}>
                {unlocked.map(b => (
                  <div key={b.id} style={{
                    backgroundColor: C.white, borderRadius: '12px', padding: '16px',
                    border: `1.5px solid ${C.green}`, boxShadow: '0 2px 8px rgba(66,106,90,0.1)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <span style={{ fontSize: '26px', flexShrink: 0 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy }}>{t(b.en, b.fr)}</div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{t(b.en_d, b.fr_d)}</div>
                    </div>
                  </div>
                ))}
              </div>
          }

          <SectionTitle>{t('Locked badges', 'Badges verrouillés')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {locked.map(b => (
              <div key={b.id} style={{
                backgroundColor: C.white, borderRadius: '12px', padding: '16px',
                border: `1px solid ${C.border}`, opacity: 0.45,
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '26px', filter: 'grayscale(1)', flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy }}>{t(b.en, b.fr)}</div>
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{t(b.en_d, b.fr_d)}</div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ══ SETTINGS ══ */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '480px' }}>
            <SectionTitle>{t('Account Settings', 'Paramètres du compte')}</SectionTitle>

            <div style={{ backgroundColor: C.white, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: '20px' }}>

              {/* Avatar */}
              <div style={{ padding: '20px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar}/>
                <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} size={56}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy, marginBottom: '2px' }}>{t('Profile picture', 'Photo de profil')}</div>
                  <div style={{ fontSize: '11px', color: C.muted }}>{t('JPG or PNG, max 2MB', 'JPG ou PNG, max 2Mo')}</div>
                </div>
                <button onClick={() => fileRef.current?.click()} style={{
                  padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: '8px',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: C.bg, color: C.navy,
                }}>
                  {avatarBusy ? '⏳' : t('Change', 'Changer')}
                </button>
              </div>

              {/* Username */}
              <div style={{ padding: '20px 22px', borderBottom: `1px solid ${C.border}` }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: C.navy, marginBottom: '8px' }}>
                  {t('Username', 'Nom d\'utilisateur')}
                </label>
                <input
                  value={editing ? editForm.username : (profile?.username || '')}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  onFocus={() => !editing && startEdit()}
                  placeholder={t('Your username', 'Votre nom d\'utilisateur')}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '9px 13px',
                    borderRadius: '8px', border: `1.5px solid ${editing ? C.blue : C.border}`,
                    fontSize: '14px', color: C.navy, backgroundColor: C.white, outline: 'none',
                  }}
                />
              </div>

              {/* Email read-only */}
              <div style={{ padding: '20px 22px', borderBottom: `1px solid ${C.border}` }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: C.navy, marginBottom: '8px' }}>Email</label>
                <div style={{ padding: '9px 13px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '14px', color: C.muted, backgroundColor: C.bg }}>
                  {user.email}
                </div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '5px' }}>
                  {t('To change your email, go to Supabase auth settings.', 'Pour changer l\'email, utilisez les paramètres Supabase.')}
                </div>
              </div>

              {/* Language */}
              <div style={{ padding: '20px 22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: C.navy, marginBottom: '10px' }}>
                  {t('Preferred language', 'Langue préférée')}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[{ val: 'en', flag: '🇬🇧', label: 'English' }, { val: 'fr', flag: '🇫🇷', label: 'Français' }].map(opt => {
                    const current = editing ? editForm.locale : (profile?.locale || 'en')
                    return (
                      <button key={opt.val}
                        onClick={() => { if (!editing) startEdit(); setEditForm(f => ({ ...f, locale: opt.val })) }}
                        style={{
                          flex: 1, padding: '11px', borderRadius: '10px',
                          border: `2px solid ${current === opt.val ? C.blue : C.border}`,
                          backgroundColor: current === opt.val ? 'rgba(158,183,229,0.1)' : C.white,
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: C.navy,
                        }}>
                        {opt.flag} {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Save */}
            {editing && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={saveProfile} disabled={saving} style={{
                  padding: '11px 26px', backgroundColor: C.navy, color: C.cream,
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? t('Saving…', 'Enregistrement…') : t('Save changes', 'Enregistrer')}
                </button>
                <button onClick={() => setEditing(false)} style={{
                  padding: '11px 18px', backgroundColor: 'transparent', color: C.muted,
                  border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
                }}>
                  {t('Cancel', 'Annuler')}
                </button>
                {saveMsg && <span style={{ fontSize: '13px', color: C.green, fontWeight: '600' }}>{saveMsg}</span>}
              </div>
            )}

            {/* Danger zone */}
            <div style={{ padding: '18px 20px', borderRadius: '12px', border: `1px solid rgba(192,57,43,0.2)`, backgroundColor: 'rgba(192,57,43,0.02)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: C.red, marginBottom: '5px' }}>
                {t('Danger zone', 'Zone dangereuse')}
              </div>
              <div style={{ fontSize: '12px', color: C.muted, marginBottom: '12px', lineHeight: '1.5' }}>
                {t('Permanently deletes your account and all associated data.', 'Supprime définitivement votre compte et toutes vos données.')}
              </div>
              <button style={{
                padding: '7px 14px', backgroundColor: 'transparent', color: C.red,
                border: `1px solid ${C.red}`, borderRadius: '7px',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
                {t('Delete account', 'Supprimer le compte')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
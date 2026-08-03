'use client'

import Link from 'next/link'

const C = {
  navy: '#16324F', gold: '#F4B400', green: '#16A34A', red: '#D62828', blue: '#2563EB',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

function initials(n) { return n ? n.trim().slice(0, 2).toUpperCase() : '?' }
function fmtDate(iso, locale) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })
}

function roleBadge(role, isAdminFallback, locale) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  if (role === 'admin' || isAdminFallback) return { text: t('Admin', 'Admin'), bg: '#FEE2E2', color: C.red }
  if (role === 'moderator') return { text: t('Moderator', 'Modérateur'), bg: '#DCFCE7', color: C.green }
  return { text: t('Member', 'Membre'), bg: '#EEF2F7', color: C.navy }
}

export default function ForumMemberProfile({ stats, badges, topics, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const role = roleBadge(stats.forum_role, false, locale)

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Hero */}
      <div style={{ backgroundColor: C.navy, padding: '32px 24px 28px', color: 'white' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', alignItems: 'center', marginBottom: '18px' }}>
            <Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Forum</Link>
            <span>›</span><span style={{ color: '#9EB7E5' }}>{stats.username}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            {stats.avatar_url
              ? <img src={stats.avatar_url} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)' }} />
              : <span style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800 }}>{initials(stats.username)}</span>
            }
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>{stats.username}</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: '9999px' }}>{role.text}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                {t('Member since', 'Membre depuis')} {fmtDate(stats.joined_at, locale)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: C.surface, borderRadius: '14px', padding: '18px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: C.navy }}>{stats.topic_count ?? 0}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginTop: '2px' }}>{t('Topics', 'Sujets')}</div>
          </div>
          <div style={{ backgroundColor: C.surface, borderRadius: '14px', padding: '18px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: C.navy }}>{stats.reply_count ?? 0}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginTop: '2px' }}>{t('Replies', 'Réponses')}</div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>{t('Badges', 'Badges')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {badges.map(fb => {
                const b = fb.forum_badges || {}
                return (
                  <div key={fb.badge_id} title={t(b.name_en, b.name_fr)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '9999px', padding: '7px 15px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: b.color || C.blue }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.navy }}>{t(b.name_en, b.name_fr)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Derniers sujets */}
        <p style={{ fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>{t('Recent topics', 'Sujets récents')}</p>
        {topics.length === 0 ? (
          <div style={{ backgroundColor: C.surface, borderRadius: '14px', border: `1px solid ${C.border}`, textAlign: 'center', padding: '40px 24px', color: C.muted, fontSize: '14px' }}>
            {t('No topics started yet.', 'Aucun sujet créé pour le moment.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topics.map(tp => {
              const cat = tp.forum_categories || {}
              return (
                <Link key={tp.id} href={`/${locale}/forum/${cat.slug}/${tp.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: C.surface, borderRadius: '12px', padding: '13px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.title}</div>
                    <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                      {cat.slug ? `${t(cat.name_en, cat.name_fr)} · ` : ''}{new Date(tp.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')} · {tp.reply_count || 0} {t('replies', 'réponses')}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
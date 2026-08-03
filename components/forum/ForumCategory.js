'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForumIcon from '@/components/forum/ForumIcon'

const C = {
  navy: '#16324F', navyLt: '#1E4976', gold: '#F4B400', green: '#16A34A',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

function timeAgo(iso, locale) {
  if (!iso) return null
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  const fr = locale === 'fr'
  if (s < 60) return fr ? "à l'instant" : 'just now'
  const m = Math.floor(s / 60); if (m < 60) return fr ? `il y a ${m} min` : `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return fr ? `il y a ${h}h` : `${h}h ago`
  const j = Math.floor(h / 24); if (j < 30) return fr ? `il y a ${j}j` : `${j}d ago`
  return d.toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
}

function initials(name) {
  if (!name) return '?'
  return name.trim().slice(0, 2).toUpperCase()
}

function Avatar({ profile, size = 34 }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundColor: '#EEF2F7', color: C.navy,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 700,
    }}>{initials(profile?.username)}</span>
  )
}

function TopicRow({ topic, locale, isLast }) {
  const [hover, setHover] = useState(false)
  const t = (en, fr) => locale === 'fr' ? fr : en
  const pinned = topic.is_pinned

  return (
    <Link
      href={`/${locale}/forum/${topic._catSlug}/${topic.slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        backgroundColor: pinned ? '#F7F9FC' : (hover ? C.bgAlt : 'transparent'),
        transition: 'background-color 0.12s ease',
      }}>
        {pinned
          ? <span style={{ color: C.navy, flexShrink: 0, display: 'flex' }}><ForumIcon name="pin" size={18} /></span>
          : <Avatar profile={topic.author} />
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: C.navy }}>{topic.title}</span>
            {topic.status === 'closed' && (
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#FEE2E2', color: '#D62828', padding: '2px 7px', borderRadius: '9999px' }}>{t('Closed', 'Clôturé')}</span>
            )}
            {topic.is_resolved && (
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#DCFCE7', color: C.green, padding: '2px 7px', borderRadius: '9999px' }}>{t('Solved', 'Résolu')}</span>
            )}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.muted }}>
            {topic.author?.username ? `${t('by', 'par')} ${topic.author.username} · ` : ''}
            {pinned ? t('pinned', 'épinglé') : timeAgo(topic.last_post_at, locale)}
          </p>
        </div>

        <div style={{ textAlign: 'center', width: '58px', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.navy }}>{topic.reply_count ?? 0}</p>
          <p style={{ margin: 0, fontSize: '11px', color: C.light }}>{t('replies', 'réponses')}</p>
        </div>
        <div style={{ textAlign: 'center', width: '54px', flexShrink: 0 }} className="forum-views-col">
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.navy }}>{topic.view_count ?? 0}</p>
          <p style={{ margin: 0, fontSize: '11px', color: C.light }}>{t('views', 'vues')}</p>
        </div>
      </div>
    </Link>
  )
}

function timeAgoShort(iso, locale) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const fr = locale === 'fr'
  if (s < 60) return fr ? "à l'instant" : 'just now'
  const m = Math.floor(s / 60); if (m < 60) return fr ? `il y a ${m} min` : `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return fr ? `il y a ${h}h` : `${h}h ago`
  const j = Math.floor(h / 24); if (j < 30) return fr ? `il y a ${j}j` : `${j}d ago`
  return new Date(iso).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
}

function CatMetaIcon({ name }) {
  const p = {
    doc:   <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
    chat:  <><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }[name]
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>{p}</svg>
}
function CatMetaItem({ icon, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><CatMetaIcon name={icon} />{children}</span>
}

export default function ForumCategory({ category, topics, stats, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const name = t(category.name_en, category.name_fr)
  const desc = t(category.description_en, category.description_fr)
  const parentName = category.parent ? t(category.parent.name_en, category.parent.name_fr) : null
  const s = stats || { topicCount: topics.length, replyCount: 0, lastActivity: null }

  // injecter le slug de catégorie dans chaque sujet (pour l'URL)
  const rows = topics.map(tp => ({ ...tp, _catSlug: category.slug }))

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Hero navy */}
      <div style={{ backgroundColor: C.navy, padding: '32px 24px 28px', color: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Forum</Link>
            {parentName && (<><span>›</span><Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{parentName}</Link></>)}
            <span>›</span>
            <span style={{ color: '#9EB7E5' }}>{name}</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
              <ForumIcon name={category.icon} size={24} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, color: '#FFFFFF' }}>{name}</h1>
              {desc && <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{desc}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                <CatMetaItem icon="doc">{s.topicCount} {s.topicCount === 1 ? t('topic', 'sujet') : t('topics', 'sujets')}</CatMetaItem>
                <CatMetaItem icon="chat">{s.replyCount} {s.replyCount === 1 ? t('reply', 'réponse') : t('replies', 'réponses')}</CatMetaItem>
                {s.lastActivity && <CatMetaItem icon="clock">{t('Last activity', 'Dernière activité')} {timeAgoShort(s.lastActivity, locale)}</CatMetaItem>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* Barre d'action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
            {rows.length} {rows.length === 1 ? t('topic', 'sujet') : t('topics', 'sujets')}
          </p>
          <Link href={`/${locale}/forum/${category.slug}/new`} style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', borderRadius: '10px',
              backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600,
              boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
            }}>
              <ForumIcon name="plus" size={16} />{t('New topic', 'Nouveau sujet')}
            </span>
          </Link>
        </div>

        {/* Liste */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(22,50,79,0.06)' }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: C.muted }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: C.light }}>
                <ForumIcon name="messages" size={36} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>{t('No topics yet', 'Aucun sujet pour le moment')}</p>
              <p style={{ fontSize: '13px', margin: 0 }}>{t('Be the first to start a discussion.', 'Lancez la première discussion.')}</p>
            </div>
          ) : (
            rows.map((tp, i) => <TopicRow key={tp.id} topic={tp} locale={locale} isLast={i === rows.length - 1} />)
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) { .forum-views-col { display: none !important; } }
      `}</style>
    </div>
  )
}
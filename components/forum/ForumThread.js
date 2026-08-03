'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import ForumIcon from '@/components/forum/ForumIcon'
import RichText from '@/components/forum/RichText'
import RichTextEditor from '@/components/forum/RichTextEditor'

// Vrai vide d'un contenu HTML : on regarde le texte réel (ignore <br>, <div>).
function isEmptyHtml(html) {
  if (!html) return true
  const txt = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return txt.length === 0
}

const C = {
  navy: '#16324F', navyLt: '#1E4976', gold: '#F4B400', green: '#16A34A',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF', red: '#D62828',
}

function fmtDate(iso, locale) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtShort(iso, locale) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' })
}
function timeAgoShort(iso, locale) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const fr = locale === 'fr'
  if (s < 60) return fr ? "à l'instant" : 'just now'
  const m = Math.floor(s / 60); if (m < 60) return fr ? `il y a ${m} min` : `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return fr ? `il y a ${h}h` : `${h}h ago`
  const j = Math.floor(h / 24); if (j < 30) return fr ? `il y a ${j}j` : `${j}d ago`
  return fmtShort(iso, locale)
}

// Petite icône inline pour la ligne de métadonnées du hero.
function MetaIcon({ name }) {
  const p = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    chat:     <><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" /></>,
    clock:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    eye:      <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></>,
  }[name]
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>{p}</svg>
}
function MetaItem({ icon, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><MetaIcon name={icon} />{children}</span>
}
function yearOf(iso) { return iso ? new Date(iso).getFullYear() : null }
function initials(n) { return n ? n.trim().slice(0, 2).toUpperCase() : '?' }

function Avatar({ profile, size }) {
  if (profile?.avatar_url) return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#EEF2F7', color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, margin: '0 auto' }}>
      {initials(profile?.username)}
    </span>
  )
}

function roleLabel(role, locale) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  if (role === 'admin') return { text: t('Admin', 'Admin'), color: C.red }
  if (role === 'moderator') return { text: t('Moderator', 'Modérateur'), color: C.green }
  return { text: t('Member', 'Membre'), color: C.muted }
}

function PostCard({ post, locale, currentUserId }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const role = roleLabel(post.authorRole, locale)

  // savoir si l'utilisateur courant a déjà liké
  useEffect(() => {
    let active = true
    if (!currentUserId) return
    const sb = createClient()
    sb.from('forum_post_likes').select('post_id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle()
      .then(({ data }) => { if (active && data) setLiked(true) })
    return () => { active = false }
  }, [currentUserId, post.id])

  async function toggleLike() {
    if (!currentUserId) return
    const sb = createClient()
    if (liked) {
      setLiked(false); setLikeCount(c => Math.max(0, c - 1))
      await sb.from('forum_post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
    } else {
      setLiked(true); setLikeCount(c => c + 1)
      await sb.from('forum_post_likes').insert({ post_id: post.id, user_id: currentUserId })
    }
  }

  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 1px 4px rgba(22,50,79,0.05)' }}>
      <div style={{ display: 'flex' }}>
        {/* Colonne profil */}
        <div style={{ width: '132px', flexShrink: 0, backgroundColor: C.bgAlt, borderRight: `1px solid ${C.border}`, padding: '16px 12px', textAlign: 'center' }} className="forum-profile-col">
          <Avatar profile={post.author} size={52} />
          <p style={{ margin: '8px 0 2px', fontWeight: 700, fontSize: '13px' }}>
            {post.author?.username
              ? <Link href={`/${locale}/forum/u/${encodeURIComponent(post.author.username)}`} style={{ color: C.navy, textDecoration: 'none' }}>{post.author.username}</Link>
              : <span style={{ color: C.muted }}>{t('Deleted', 'Supprimé')}</span>}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: role.color, fontWeight: 600 }}>{role.text}</p>
          <p style={{ margin: 0, fontSize: '11px', color: C.light, lineHeight: 1.5 }}>
            {yearOf(post.author?.created_at) ? `${t('since', 'depuis')} ${yearOf(post.author.created_at)}` : ''}
          </p>
        </div>

        {/* Corps du message */}
        <div style={{ flex: 1, padding: '14px 18px', minWidth: 0 }}>
          {/* Profil condensé (mobile) */}
          <div style={{ display: 'none', alignItems: 'center', gap: '8px', marginBottom: '10px' }} className="forum-profile-inline">
            <Avatar profile={post.author} size={30} />
            {post.author?.username
              ? <Link href={`/${locale}/forum/u/${encodeURIComponent(post.author.username)}`} style={{ fontWeight: 700, fontSize: '13px', color: C.navy, textDecoration: 'none' }}>{post.author.username}</Link>
              : <span style={{ fontWeight: 700, fontSize: '13px', color: C.muted }}>{t('Deleted', 'Supprimé')}</span>}
            <span style={{ fontSize: '11px', color: role.color, fontWeight: 600 }}>{role.text}</span>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: '11px', color: C.light }}>
            {fmtDate(post.created_at, locale)}{post.edited_at ? ` · ${t('edited', 'modifié')}` : ''}
          </p>
          <RichText html={post.body} />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: '10px', marginTop: '12px' }}>
            <button onClick={toggleLike} disabled={!currentUserId}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', border: `1px solid ${liked ? C.navy : C.borderSolid}`, backgroundColor: liked ? '#EEF2F7' : 'transparent', color: liked ? C.navy : C.muted, fontSize: '12px', fontWeight: 600, cursor: currentUserId ? 'pointer' : 'default' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11M2 13v6a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-1.6l1.3-6.5a1.6 1.6 0 0 0-1.6-2H14l1-4.5A2 2 0 0 0 13 4l-6 6H4a2 2 0 0 0-2 2z"/></svg>
              {likeCount > 0 ? likeCount : ''} {t('Like', "J'aime")}
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', border: `1px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
              <ForumIcon name="flag" size={13} />{t('Report', 'Signaler')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForumThread({ category, parent, topic, initialPosts, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const pathname = usePathname()
  const loginHref = `/${locale}/auth/login?next=${encodeURIComponent(pathname)}`
  const [posts, setPosts] = useState(initialPosts || [])
  const [user, setUser] = useState(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const parentName = parent ? t(parent.name_en, parent.name_fr) : null
  const isClosed = topic.status === 'closed'
  // Métadonnées dérivées des messages (restent à jour quand on répond)
  const messageCount = posts.length
  const starter = posts.find(p => p.is_first_post)?.author || posts[0]?.author || null
  const lastAt = posts.length ? posts[posts.length - 1].created_at : topic.created_at

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null))
  }, [])

  async function submitReply() {
    if (isEmptyHtml(body) || submitting) return
    setSubmitting(true); setError(null)
    const sb = createClient()
    const { data, error: err } = await sb
      .from('forum_posts')
      .insert({ topic_id: topic.id, author_id: user.id, body })
      .select('id, author_id, body, is_first_post, edited_at, created_at')
      .single()
    if (err) {
      setError(t('Could not post your reply.', "Impossible de publier votre réponse."))
      setSubmitting(false)
      return
    }
    // récupérer le profil courant pour l'affichage immédiat
    const { data: prof } = await sb.from('public_profiles').select('user_id, username, avatar_url, created_at').eq('user_id', user.id).maybeSingle()
    setPosts(prev => [...prev, { ...data, author: prof || null, authorRole: null, likeCount: 0 }])
    setBody(''); setSubmitting(false)
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Hero */}
      <div style={{ backgroundColor: C.navy, padding: '30px 24px 26px', color: 'white' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Forum</Link>
            {parentName && (<><span>›</span><Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{parentName}</Link></>)}
            <span>›</span>
            <Link href={`/${locale}/forum/${category.slug}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{t(category.name_en, category.name_fr)}</Link>
          </nav>

          {/* Titre en grand */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, color: '#FFFFFF' }}>{topic.title}</h1>
            {isClosed && <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(214,40,40,0.2)', color: '#FCA5A5', padding: '3px 9px', borderRadius: '9999px', marginTop: '6px' }}>{t('Closed', 'Clôturé')}</span>}
            {topic.is_resolved && <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(22,163,74,0.2)', color: '#86EFAC', padding: '3px 9px', borderRadius: '9999px', marginTop: '6px' }}>{t('Solved', 'Résolu')}</span>}
          </div>

          {/* Ligne de métadonnées */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            {starter?.username && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Avatar profile={starter} size={22} />
                <Link href={`/${locale}/forum/u/${encodeURIComponent(starter.username)}`} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textDecoration: 'none' }}>{starter.username}</Link>
              </span>
            )}
            <MetaItem icon="calendar">{t('Started', 'Créé le')} {fmtShort(topic.created_at, locale)}</MetaItem>
            <MetaItem icon="chat">{messageCount} {messageCount === 1 ? t('message', 'message') : t('messages', 'messages')}</MetaItem>
            {lastAt && <MetaItem icon="clock">{t('Last reply', 'Dernier message')} {timeAgoShort(lastAt, locale)}</MetaItem>}
            <MetaItem icon="eye">{topic.view_count ?? 0} {t('views', 'vues')}</MetaItem>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 24px 80px' }}>
        {posts.map(p => <PostCard key={p.id} post={p} locale={locale} currentUserId={user?.id} />)}

        {/* Zone de réponse */}
        {isClosed ? (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '18px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
            {t('This topic is closed. New replies are disabled.', 'Ce sujet est clôturé. Les réponses sont désactivées.')}
          </div>
        ) : user ? (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: C.navy }}>{t('Reply', 'Répondre')}</p>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={t('Share your reply…', 'Partagez votre réponse…')}
              minHeight={110}
            />
            {error && <p style={{ margin: '8px 0 0', fontSize: '12px', color: C.red }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={submitReply} disabled={submitting || isEmptyHtml(body)}
                style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: (submitting || isEmptyHtml(body)) ? '#9CA3AF' : C.navy, color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: (submitting || isEmptyHtml(body)) ? 'default' : 'pointer', boxShadow: '0 2px 8px rgba(22,50,79,0.08)' }}>
                {submitting ? t('Posting…', 'Publication…') : t('Post reply', 'Publier la réponse')}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontSize: '14px', color: C.muted }}>{t('Sign in to join the discussion.', 'Connectez-vous pour participer à la discussion.')}</p>
            <Link href={loginHref} style={{ display: 'inline-block', padding: '9px 18px', borderRadius: '10px', backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              {t('Sign in', 'Se connecter')}
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .forum-profile-col { display: none !important; }
          .forum-profile-inline { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
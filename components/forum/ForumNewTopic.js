'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import RichTextEditor from '@/components/forum/RichTextEditor'

const C = {
  navy: '#16324F', gold: '#F4B400', green: '#16A34A',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF', red: '#D62828',
}

// Vrai vide d'un contenu HTML (ignore <br>, <div> vides)
function isEmptyHtml(html) {
  if (!html) return true
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0
}

// slug simple depuis un titre (translit basique + tirets)
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // enlève les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'sujet'
}

export default function ForumNewTopic({ category, parent, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const router = useRouter()
  const pathname = usePathname()
  const loginHref = `/${locale}/auth/login?next=${encodeURIComponent(pathname)}`
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const parentName = parent ? t(parent.name_en, parent.name_fr) : null
  const catName = t(category.name_en, category.name_fr)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => { setUser(data?.user || null); setChecking(false) })
  }, [])

  async function submit() {
    if (!title.trim() || isEmptyHtml(body) || submitting || !user) return
    setSubmitting(true); setError(null)
    const sb = createClient()

    // slug unique : base + suffixe court si déjà pris
    let slug = slugify(title)
    const { data: existing } = await sb
      .from('forum_topics').select('id').eq('category_id', category.id).eq('slug', slug).maybeSingle()
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

    // 1) créer le sujet
    const { data: topic, error: e1 } = await sb
      .from('forum_topics')
      .insert({ category_id: category.id, author_id: user.id, title: title.trim(), slug })
      .select('id, slug')
      .single()
    if (e1 || !topic) {
      setError(t('Could not create the topic.', 'Impossible de créer le sujet.'))
      setSubmitting(false); return
    }

    // 2) créer le premier message (corps du sujet)
    const { error: e2 } = await sb
      .from('forum_posts')
      .insert({ topic_id: topic.id, author_id: user.id, body, is_first_post: true })
    if (e2) {
      setError(t('Topic created but the message failed.', 'Sujet créé mais le message a échoué.'))
      setSubmitting(false); return
    }

    router.push(`/${locale}/forum/${category.slug}/${topic.slug}`)
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <div style={{ backgroundColor: C.navy, padding: '28px 24px 24px', color: 'white' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Forum</Link>
            {parentName && (<><span>›</span><Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{parentName}</Link></>)}
            <span>›</span>
            <Link href={`/${locale}/forum/${category.slug}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{catName}</Link>
          </nav>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, letterSpacing: '-0.02em' }}>{t('New topic', 'Nouveau sujet')}</h1>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 24px 80px' }}>
        {checking ? null : !user ? (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: C.muted }}>{t('Sign in to start a topic.', 'Connectez-vous pour créer un sujet.')}</p>
            <Link href={loginHref} style={{ display: 'inline-block', padding: '9px 18px', borderRadius: '10px', backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              {t('Sign in', 'Se connecter')}
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(22,50,79,0.06)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{t('Title', 'Titre')}</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} maxLength={140}
              placeholder={t('A clear, specific title', 'Un titre clair et précis')}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface, fontSize: '15px', color: C.text, outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{t('Message', 'Message')}</label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={t('Write your first message…', 'Rédigez votre premier message…')}
              minHeight={180}
            />

            {error && <p style={{ margin: '12px 0 0', fontSize: '13px', color: C.red }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Link href={`/${locale}/forum/${category.slug}`} style={{ padding: '10px 18px', borderRadius: '10px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.navy, fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                {t('Cancel', 'Annuler')}
              </Link>
              <button onClick={submit} disabled={submitting || !title.trim() || isEmptyHtml(body)}
                style={{ padding: '10px 22px', borderRadius: '10px', backgroundColor: (submitting || !title.trim() || isEmptyHtml(body)) ? '#9CA3AF' : C.navy, color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: (submitting || !title.trim() || isEmptyHtml(body)) ? 'default' : 'pointer', boxShadow: '0 2px 8px rgba(22,50,79,0.08)' }}>
                {submitting ? t('Publishing…', 'Publication…') : t('Publish topic', 'Publier le sujet')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
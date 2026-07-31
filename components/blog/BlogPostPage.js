'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import RelatedPostsCarousel from '@/components/blog/RelatedPostsCarousel'
import Footer from '@/components/Footer'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy:        '#16324F',
  gold:        '#F4B400',
  green:       '#16A34A',
  blue:        '#2563EB',
  bg:          '#F4F1E6',
  bgAlt:       '#FAFAF7',
  surface:     '#FFFFFF',
  secondary:   '#EEF2F7',
  border:      'rgba(22,50,79,0.12)',
  borderSolid: '#E2DDD5',
  text:        '#0F1923',
  muted:       '#6B7280',
  light:       '#9CA3AF',
}

// ── Icons (SVG line — no emoji) ────────────────────────────────────────────
function IconCalendar({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function IconClock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function IconArrowLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function IconDocument({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  )
}

// ── Rich text renderer ─────────────────────────────────────────────────────
function RichText({ node }) {
  if (!node) return null

  if (node.nodeType === 'document') {
    return <>{node.content.map((n, i) => <RichText key={i} node={n} />)}</>
  }

  if (node.nodeType === 'text') {
    let el = <>{node.value}</>
    if (node.marks?.some(m => m.type === 'bold'))    el = <strong>{el}</strong>
    if (node.marks?.some(m => m.type === 'italic'))  el = <em>{el}</em>
    if (node.marks?.some(m => m.type === 'code'))    el = <code style={{ backgroundColor: C.secondary, padding: '2px 6px', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', color: C.navy }}>{el}</code>
    return el
  }

  const children = node.content?.map((n, i) => <RichText key={i} node={n} />)

  switch (node.nodeType) {
    case 'paragraph':
      return <p style={{ margin: '0 0 20px', lineHeight: 1.8, color: C.text }}>{children}</p>
    case 'heading-1':
      return <h1 style={{ fontSize: '32px', fontWeight: 900, color: C.navy, margin: '36px 0 16px', letterSpacing: '-0.02em' }}>{children}</h1>
    case 'heading-2':
      return <h2 style={{ fontSize: '26px', fontWeight: 800, color: C.navy, margin: '32px 0 14px', letterSpacing: '-0.02em' }}>{children}</h2>
    case 'heading-3':
      return <h3 style={{ fontSize: '20px', fontWeight: 700, color: C.navy, margin: '28px 0 12px' }}>{children}</h3>
    case 'heading-4':
      return <h4 style={{ fontSize: '17px', fontWeight: 700, color: C.navy, margin: '24px 0 10px' }}>{children}</h4>
    case 'unordered-list':
      return <ul style={{ margin: '0 0 20px', paddingLeft: '24px', lineHeight: 1.8, color: C.text }}>{children}</ul>
    case 'ordered-list':
      return <ol style={{ margin: '0 0 20px', paddingLeft: '24px', lineHeight: 1.8, color: C.text }}>{children}</ol>
    case 'list-item':
      return <li style={{ marginBottom: '6px' }}>{children}</li>
    case 'blockquote':
      return <blockquote style={{ borderLeft: `4px solid ${C.navy}`, paddingLeft: '20px', margin: '24px 0', color: C.muted, fontStyle: 'italic' }}>{children}</blockquote>
    case 'hr':
      return <hr style={{ border: 'none', borderTop: `1px solid ${C.borderSolid}`, margin: '36px 0' }} />
    case 'hyperlink':
      return <a href={node.data?.uri} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: 'underline' }}>{children}</a>
    case 'embedded-asset-block': {
      const file = node.data?.target?.fields?.file
      const alt  = node.data?.target?.fields?.title || ''
      if (!file?.url) return null
      return (
        <figure style={{ margin: '28px 0' }}>
          <img src={'https:' + file.url} alt={alt} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
          {alt && <figcaption style={{ textAlign: 'center', fontSize: '13px', color: C.light, marginTop: '8px' }}>{alt}</figcaption>}
        </figure>
      )
    }
    default:
      return <>{children}</>
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function BlogPostPage({ post, relatedPosts = [] }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  if (!post) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.light, marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <IconDocument size={48} />
          </div>
          <h1 style={{ color: C.navy, fontWeight: 900, fontSize: '22px', margin: '0 0 16px' }}>
            {t('Article not found', 'Article introuvable')}
          </h1>
          <Link href={`/${locale}/blog`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: C.navy, textDecoration: 'none', fontWeight: 600, fontSize: '15px',
            padding: '10px 20px', border: `1.5px solid ${C.borderSolid}`,
            borderRadius: '10px', backgroundColor: C.surface,
          }}>
            <IconArrowLeft />
            {t('Back to blog', 'Retour au blog')}
          </Link>
        </div>
      </div>
    )
  }

  const hasRelated = relatedPosts.length > 0

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === 'fr' ? 'fr-FR' : 'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : null

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 24px 0' }}>
        <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: C.muted, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={`/${locale}`} style={{ color: C.navy, textDecoration: 'none', fontWeight: 600 }}>
            {t('Home', 'Accueil')}
          </Link>
          <span style={{ color: C.light }}>›</span>
          <Link href={`/${locale}/blog`} style={{ color: C.navy, textDecoration: 'none', fontWeight: 600 }}>
            Blog
          </Link>
          <span style={{ color: C.light }}>›</span>
          <span style={{ color: C.muted }}>{post.title}</span>
        </nav>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '16px 24px 0' }}>
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '9999px',
                backgroundColor: C.secondary, color: C.navy,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Cover image */}
        {post.coverImage && (
          <div style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(22,50,79,0.12)' }}>
            <img
              src={post.coverImage}
              alt={post.coverAlt || post.title}
              style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Meta (under image) */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: C.muted, marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {formattedDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconCalendar /> {formattedDate}
            </span>
          )}
          {post.readingTime && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconClock /> {post.readingTime} min {t('read', 'de lecture')}
            </span>
          )}
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: '18px', color: C.muted, lineHeight: 1.7, marginBottom: '32px', fontStyle: 'italic', borderLeft: `4px solid ${C.gold}`, paddingLeft: '18px' }}>
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Article body */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ fontSize: '17px', lineHeight: 1.8 }}>
          {post.body ? <RichText node={post.body} /> : (
            <p style={{ color: C.muted }}>{t('No content available.', 'Aucun contenu disponible.')}</p>
          )}
        </div>
      </div>

      {/* Related posts carousel */}
      <div style={{ marginTop: '48px' }}>
        <RelatedPostsCarousel posts={relatedPosts} />
      </div>

      {/* Back link */}
      <div style={{
        maxWidth: '760px', margin: '0 auto',
        padding: hasRelated ? '24px 24px 64px' : '0 24px 64px',
        marginTop: hasRelated ? 0 : '48px',
        paddingTop: hasRelated ? '24px' : '28px',
        borderTop: hasRelated ? 'none' : `1px solid ${C.borderSolid}`,
        display: 'flex', justifyContent: 'center',
      }}>
        <Link href={`/${locale}/blog`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: C.navy, textDecoration: 'none', fontWeight: 600, fontSize: '15px',
          padding: '12px 20px', border: `1.5px solid ${C.borderSolid}`,
          borderRadius: '10px', backgroundColor: C.surface,
          boxShadow: '0 1px 3px rgba(22,50,79,0.06)',
          minHeight: '44px', boxSizing: 'border-box',
        }}>
          <IconArrowLeft />
          {t('Back to all articles', 'Retour à tous les articles')}
        </Link>
      </div>
      <Footer />
    </div>
  )
}
'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'

// ── Rich text renderer ─────────────────────────────────────────────────────
function RichText({ node }) {
  if (!node) return null

  if (node.nodeType === 'document') {
    return <>{node.content.map((n, i) => <RichText key={i} node={n} />)}</>
  }

  if (node.nodeType === 'text') {
    let el = <>{node.value}</>
    if (node.marks?.some(m => m.type === 'bold'))   el = <strong>{el}</strong>
    if (node.marks?.some(m => m.type === 'italic'))  el = <em>{el}</em>
    if (node.marks?.some(m => m.type === 'code'))    el = <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace' }}>{el}</code>
    return el
  }

  const children = node.content?.map((n, i) => <RichText key={i} node={n} />)

  switch (node.nodeType) {
    case 'paragraph':
      return <p style={{ margin: '0 0 20px', lineHeight: 1.8, color: '#374151' }}>{children}</p>
    case 'heading-1':
      return <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0B1F3B', margin: '36px 0 16px', letterSpacing: '-0.5px' }}>{children}</h1>
    case 'heading-2':
      return <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0B1F3B', margin: '32px 0 14px', letterSpacing: '-0.3px' }}>{children}</h2>
    case 'heading-3':
      return <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0B1F3B', margin: '28px 0 12px' }}>{children}</h3>
    case 'heading-4':
      return <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0B1F3B', margin: '24px 0 10px' }}>{children}</h4>
    case 'unordered-list':
      return <ul style={{ margin: '0 0 20px', paddingLeft: '24px', lineHeight: 1.8, color: '#374151' }}>{children}</ul>
    case 'ordered-list':
      return <ol style={{ margin: '0 0 20px', paddingLeft: '24px', lineHeight: 1.8, color: '#374151' }}>{children}</ol>
    case 'list-item':
      return <li style={{ marginBottom: '6px' }}>{children}</li>
    case 'blockquote':
      return <blockquote style={{ borderLeft: '4px solid #9EB7E5', paddingLeft: '20px', margin: '24px 0', color: '#64748b', fontStyle: 'italic' }}>{children}</blockquote>
    case 'hr':
      return <hr style={{ border: 'none', borderTop: '1px solid #E2DDD5', margin: '36px 0' }} />
    case 'hyperlink':
      return <a href={node.data?.uri} target="_blank" rel="noopener noreferrer" style={{ color: '#9EB7E5', textDecoration: 'underline' }}>{children}</a>
    case 'embedded-asset-block': {
      const file = node.data?.target?.fields?.file
      const alt  = node.data?.target?.fields?.title || ''
      if (!file?.url) return null
      return (
        <figure style={{ margin: '28px 0' }}>
          <img src={'https:' + file.url} alt={alt} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
          {alt && <figcaption style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>{alt}</figcaption>}
        </figure>
      )
    }
    default:
      return <>{children}</>
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function BlogPostPage({ post }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  if (!post) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📰</div>
          <h1 style={{ color: '#0B1F3B', fontWeight: '900' }}>{t('Article not found', 'Article introuvable')}</h1>
          <Link href={`/${locale}/blog`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            ← {t('Back to blog', 'Retour au blog')}
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === 'fr' ? 'fr-FR' : 'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : null

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 24px 0' }}>
        <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#8A8278', alignItems: 'center' }}>
          <Link href={`/${locale}`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            {t('Home', 'Accueil')}
          </Link>
          <span>›</span>
          <Link href={`/${locale}/blog`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            Blog
          </Link>
          <span>›</span>
          <span style={{ color: '#64748b' }}>{post.title}</span>
        </nav>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px 0' }}>
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '99px', backgroundColor: '#9EB7E520', color: '#0B1F3B', border: '1px solid #9EB7E540', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '900', color: '#0B1F3B', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#8A8278', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
          {formattedDate && <span>📅 {formattedDate}</span>}
          {post.readingTime && <span>⏱ {post.readingTime} min {t('read', 'de lecture')}</span>}
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div style={{ marginBottom: '36px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(11,31,59,0.1)' }}>
            <img
              src={post.coverImage}
              alt={post.coverAlt || post.title}
              style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: '18px', color: '#4B5563', lineHeight: 1.7, marginBottom: '32px', fontStyle: 'italic', borderLeft: '4px solid #FEB12F', paddingLeft: '18px' }}>
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Article body */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ fontSize: '17px', lineHeight: 1.8 }}>
          {post.body ? <RichText node={post.body} /> : (
            <p style={{ color: '#8A8278' }}>{t('No content available.', 'Aucun contenu disponible.')}</p>
          )}
        </div>

        {/* Back link */}
        <div style={{ marginTop: '56px', paddingTop: '28px', borderTop: '1px solid #E2DDD5', marginBottom: '48px' }}>
          <Link href={`/${locale}/blog`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0B1F3B', textDecoration: 'none', fontWeight: '700', fontSize: '15px', padding: '10px 20px', border: '2px solid #E2DDD5', borderRadius: '10px', backgroundColor: 'white' }}>
            ← {t('Back to all articles', 'Retour à tous les articles')}
          </Link>
        </div>
      </div>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr, locale) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Rich Text Renderer ────────────────────────────────────────────────────────
// Renders Contentful rich text JSON without any extra library
function RichText({ document }) {
  if (!document?.content) return null
  return <>{document.content.map((node, i) => <RichNode key={i} node={node} />)}</>
}

function RichNode({ node }) {
  const s = {
    p:    { fontSize: '17px', lineHeight: 1.8, color: '#2d3748', marginBottom: '20px' },
    h2:   { fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: '#0B1F3B', margin: '40px 0 16px', letterSpacing: '-0.4px', lineHeight: 1.2 },
    h3:   { fontSize: 'clamp(17px, 2.5vw, 21px)', fontWeight: '800', color: '#0B1F3B', margin: '32px 0 12px', letterSpacing: '-0.3px' },
    h4:   { fontSize: '18px', fontWeight: '700', color: '#0B1F3B', margin: '24px 0 10px' },
    hr:   { border: 'none', borderTop: '2px solid #E2DDD5', margin: '40px 0' },
    ul:   { paddingLeft: '24px', marginBottom: '20px' },
    ol:   { paddingLeft: '24px', marginBottom: '20px' },
    li:   { fontSize: '17px', lineHeight: 1.8, color: '#2d3748', marginBottom: '6px' },
    blockquote: {
      borderLeft: '4px solid #9EB7E5', margin: '28px 0', padding: '16px 24px',
      backgroundColor: '#f0f5ff', borderRadius: '0 10px 10px 0',
      fontSize: '18px', fontStyle: 'italic', color: '#0B1F3B', lineHeight: 1.7,
    },
  }

  switch (node.nodeType) {
    case 'paragraph':
      return <p style={s.p}><RichInlines nodes={node.content} /></p>
    case 'heading-2':
      return <h2 style={s.h2}><RichInlines nodes={node.content} /></h2>
    case 'heading-3':
      return <h3 style={s.h3}><RichInlines nodes={node.content} /></h3>
    case 'heading-4':
      return <h4 style={s.h4}><RichInlines nodes={node.content} /></h4>
    case 'hr':
      return <hr style={s.hr} />
    case 'unordered-list':
      return <ul style={s.ul}>{node.content.map((li, i) => <li key={i} style={s.li}><RichInlines nodes={li.content?.[0]?.content} /></li>)}</ul>
    case 'ordered-list':
      return <ol style={s.ol}>{node.content.map((li, i) => <li key={i} style={s.li}><RichInlines nodes={li.content?.[0]?.content} /></li>)}</ol>
    case 'blockquote':
      return <blockquote style={s.blockquote}><RichInlines nodes={node.content?.[0]?.content} /></blockquote>
    case 'embedded-asset-block': {
      const file  = node.data?.target?.fields?.file
      const title = node.data?.target?.fields?.title ?? ''
      if (!file?.url) return null
      return (
        <div style={{ margin: '32px 0', borderRadius: '12px', overflow: 'hidden' }}>
          <img src={'https:' + file.url} alt={title}
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }} />
          {title && <p style={{ fontSize: '13px', color: '#8A8278', textAlign: 'center', marginTop: '8px', fontStyle: 'italic' }}>{title}</p>}
        </div>
      )
    }
    default:
      return null
  }
}

function RichInlines({ nodes }) {
  if (!nodes) return null
  return (
    <>
      {nodes.map((node, i) => {
        if (node.nodeType === 'text') {
          let el = <>{node.value}</>
          if (node.marks?.some(m => m.type === 'bold'))   el = <strong key={i}>{el}</strong>
          if (node.marks?.some(m => m.type === 'italic'))  el = <em key={i}>{el}</em>
          if (node.marks?.some(m => m.type === 'code'))    el = <code key={i} style={{ backgroundColor: '#f0ede4', padding: '2px 6px', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace' }}>{node.value}</code>
          return <span key={i}>{el}</span>
        }
        if (node.nodeType === 'hyperlink') {
          return (
            <a key={i} href={node.data?.uri} target="_blank" rel="noopener noreferrer"
              style={{ color: '#9EB7E5', textDecoration: 'underline', fontWeight: '600' }}>
              <RichInlines nodes={node.content} />
            </a>
          )
        }
        return null
      })}
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BlogPostPage({ post }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  if (!post) return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#8A8278' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#0B1F3B' }}>{t('Article not found', 'Article introuvable')}</div>
        <Link href={`/${locale}/blog`} style={{ color: '#9EB7E5', textDecoration: 'none', marginTop: '12px', display: 'inline-block', fontWeight: '600' }}>
          ← {t('Back to blog', 'Retour au blog')}
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh' }}>

      {/* Cover image hero */}
      {post.coverImage && (
        <div style={{ width: '100%', maxHeight: '480px', overflow: 'hidden', position: 'relative' }}>
          <img src={post.coverImage} alt={post.coverAlt}
            style={{ width: '100%', height: '480px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(11,31,59,0.7) 100%)' }} />
        </div>
      )}

      {/* Article container */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Back link */}
        <div style={{ padding: '24px 0 0' }}>
          <Link href={`/${locale}/blog`} style={{ color: '#8A8278', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            ← {t('All articles', 'Tous les articles')}
          </Link>
        </div>

        {/* Header */}
        <header style={{ paddingTop: '32px', marginBottom: '40px', borderBottom: '2px solid #E2DDD5', paddingBottom: '32px' }}>

          {/* Category + tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
  
            {post.tags?.map(tag => (
              <span key={tag} style={{ fontSize: '11px', fontWeight: '600', color: '#8A8278', backgroundColor: '#fff', border: '1px solid #E2DDD5', padding: '4px 10px', borderRadius: '99px' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px', lineHeight: 1.15 }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{ margin: '0 0 20px', fontSize: '18px', color: '#8A8278', lineHeight: 1.65, fontStyle: 'italic' }}>
              {post.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#8A8278' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              📅 {t('Published', 'Publié le')} {formatDate(post.publishedAt, locale)}
            </span>
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                🔄 {t('Updated', 'Mis à jour le')} {formatDate(post.updatedAt, locale)}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              ⏱ {post.readingTime} {t('min read', 'min de lecture')}
            </span>
          </div>
        </header>

        {/* Body */}
        <div style={{ fontSize: '17px', lineHeight: 1.8, color: '#2d3748' }}>
          <RichText document={post.body} />
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '2px solid #E2DDD5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Link href={`/${locale}/blog`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', backgroundColor: '#0B1F3B', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
            ← {t('Back to blog', 'Retour au blog')}
          </Link>
          <div style={{ fontSize: '13px', color: '#8A8278' }}>
            {post.tags?.map(tag => (
              <span key={tag} style={{ marginRight: '8px' }}>#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
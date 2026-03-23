'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr, locale) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ post, locale }) {
  const [hovered, setHovered] = useState(false)
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <Link href={`/${locale}/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `2px solid ${hovered ? '#0B1F3B' : '#E2DDD5'}`,
          transition: 'all 0.22s ease',
          transform: hovered ? 'translateY(-4px)' : 'none',
          boxShadow: hovered ? '0 12px 32px rgba(11,31,59,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cover image */}
        {post.coverImage ? (
          <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f0ede4', flexShrink: 0 }}>
            <img
              src={post.coverImage}
              alt={post.coverAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
            />
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#0B1F3B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '40px' }}>🌍</span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Category + tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>

            {post.tags?.slice(0, 2).map(tag => (
              <span key={tag} style={{ fontSize: '11px', fontWeight: '600', color: '#8A8278', backgroundColor: '#F4F1E6', padding: '3px 8px', borderRadius: '99px' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#0B1F3B', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#8A8278', lineHeight: 1.6, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.excerpt}
          </p>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E2DDD5' }}>
            <span style={{ fontSize: '12px', color: '#8A8278' }}>
              {formatDate(post.publishedAt, locale)}
            </span>
            <span style={{ fontSize: '12px', color: '#8A8278', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⏱ {post.readingTime} {t('min read', 'min de lecture')}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BlogListPage({ posts }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [search,          setSearch]          = useState('')
  const [activeTag,       setActiveTag]        = useState(null)

  // Derive tags
  const tags = useMemo(() => [...new Set(posts.flatMap(p => p.tags ?? []))].slice(0, 12), [posts])

  const filtered = useMemo(() => {
    let list = posts
    if (activeTag)      list = list.filter(p => p.tags.includes(activeTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [posts, activeTag, search])

  // Featured = first post
  const featured = filtered[0]
  const rest     = filtered.slice(1)

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ backgroundColor: '#0B1F3B', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>📖</span>
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FEB12F' }}>
              {t('KnowFlags Blog', 'Blog KnowFlags')}
            </span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', lineHeight: 1.1 }}>
            {t('Explore the World,', 'Explore le monde,')}
            <br />
            <span style={{ color: '#9EB7E5' }}>{t('One Flag at a Time', 'un drapeau à la fois')}</span>
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '520px', lineHeight: 1.65 }}>
            {t('Stories, history, and curiosities about flags, countries, and the world.',
               'Histoires, anecdotes et curiosités sur les drapeaux, les pays et le monde.')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E2DDD5', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search articles…', 'Rechercher des articles…')}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '2px solid #E2DDD5', fontSize: '14px', outline: 'none', minWidth: '200px', flex: '1' }}
          />

          {/* Tags */}
          {tags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{ padding: '8px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: `2px solid ${activeTag === tag ? '#9EB7E5' : '#E2DDD5'}`, backgroundColor: activeTag === tag ? '#9EB7E5' : '#fff', color: activeTag === tag ? '#0B1F3B' : '#8A8278', transition: 'all 0.15s' }}>
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8A8278' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{t('No articles found', 'Aucun article trouvé')}</div>
          </div>
        )}

        {/* Featured article */}
        {featured && (
          <Link href={`/${locale}/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '40px' }}>
            <article style={{
              backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden',
              border: '2px solid #E2DDD5', display: 'grid',
              gridTemplateColumns: featured.coverImage ? '1fr 1fr' : '1fr',
            }}>
              {featured.coverImage && (
                <div style={{ overflow: 'hidden', minHeight: '280px' }}>
                  <img src={featured.coverImage} alt={featured.coverAlt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '36px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', backgroundColor: '#FEB12F', padding: '4px 10px', borderRadius: '99px' }}>
                    ✨ {t('Featured', 'À la une')}
                  </span>

                </div>
                <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                  {featured.title}
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#8A8278', lineHeight: 1.7 }}>
                  {featured.excerpt}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#8A8278' }}>
                  <span>{formatDate(featured.publishedAt, locale)}</span>
                  <span>⏱ {featured.readingTime} {t('min read', 'min')}</span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {rest.map(post => (
              <ArticleCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
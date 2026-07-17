'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

export default function LatestArticles({ posts = [], locale = 'en' }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const scroller = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!posts || posts.length === 0) return null

  const scrollStep = (dir) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : ''

  const chevron = (dir) => (
    <button
      onClick={() => scrollStep(dir)}
      aria-label={dir < 0 ? t('Previous', 'Précédent') : t('Next', 'Suivant')}
      style={{
        width: '38px', height: '38px', borderRadius: '50%',
        border: '1.5px solid #E2DDD5', backgroundColor: '#FFFFFF', color: '#16324F',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(22,50,79,0.08)', transition: 'background-color 0.12s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAFAF7')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {dir < 0 ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  )

  return (
    <section style={{ backgroundColor: '#F4F1E6', padding: isMobile ? '32px 0 40px' : '48px 24px' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px',
          marginBottom: isMobile ? '20px' : '28px', padding: isMobile ? '0 16px' : 0,
        }}>
          <div>
            <p style={{
              margin: '0 0 6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: '0.15em', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ display: 'inline-block', width: '18px', height: '2px', backgroundColor: '#16A34A', borderRadius: '2px' }} />
              {t('Blog', 'Blog')}
            </p>
            <h2 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#16324F', letterSpacing: '-0.02em' }}>
              {t('Latest articles', 'Derniers articles')}
            </h2>
          </div>
          {!isMobile && posts.length > 3 && (
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{chevron(-1)}{chevron(1)}</div>
          )}
        </div>

        {/* Carousel */}
        <div
          ref={scroller}
          style={{
            display: 'flex', gap: isMobile ? '12px' : '16px', overflowX: 'auto',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            padding: isMobile ? '0 16px 6px' : '0 0 6px',
          }}
        >
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/blog/${post.slug}`}
              style={{
                textDecoration: 'none', flexShrink: 0,
                width: isMobile ? '82vw' : '330px', maxWidth: '360px', scrollSnapAlign: 'start',
              }}
            >
              <article style={{
                backgroundColor: '#FFFFFF', borderRadius: '16px',
                border: '1px solid rgba(22,50,79,0.12)', boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
                overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
              }}>
                {post.coverImage ? (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', backgroundColor: '#FAFAF7' }}>
                    <img src={post.coverImage} alt={post.coverAlt || post.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', backgroundColor: '#16324F' }} />
                )}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {post.tags && post.tags.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16A34A' }}>
                      {post.tags[0]}
                    </span>
                  )}
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#16324F', lineHeight: 1.3 }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p style={{
                      margin: 0, fontSize: '13px', color: '#6B7280', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: '6px', fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{fmtDate(post.publishedAt)}</span>
                    {post.readingTime ? (<><span>·</span><span>{post.readingTime} {t('min read', 'min de lecture')}</span></>) : null}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Voir tout */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? '24px' : '28px', padding: isMobile ? '0 16px' : 0 }}>
          <Link
            href={`/${locale}/blog`}
            style={{
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', borderRadius: '10px', backgroundColor: '#16324F', color: '#FFFFFF',
              fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
            }}
          >
            {t('See all articles', 'Voir tout')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
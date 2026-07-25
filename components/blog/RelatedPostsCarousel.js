'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy:        '#16324F',
  navyLight:   '#1E4976',
  green:       '#16A34A',
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
function IconChevron({ dir = 'right', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

function IconClock({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function IconGlobe({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z" />
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr, locale) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Card ───────────────────────────────────────────────────────────────────
function CarouselCard({ post, locale, isMobile }) {
  const [hovered, setHovered] = useState(false)
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      style={{
        textDecoration: 'none',
        flex: '0 0 auto',
        width: isMobile ? '78vw' : '300px',
        maxWidth: '320px',
        scrollSnapAlign: 'start',
      }}
    >
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: C.surface,
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${hovered ? C.navy : C.border}`,
          boxShadow: hovered
            ? '0 8px 32px rgba(22,50,79,0.12)'
            : '0 2px 8px rgba(22,50,79,0.08)',
          transform: hovered && !isMobile ? 'translateY(-4px)' : 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
        }}
      >
        {/* Cover */}
        {post.coverImage ? (
          <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: C.bgAlt, flexShrink: 0 }}>
            <img
              src={post.coverImage}
              alt={post.coverAlt || post.title}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform 0.4s ease',
                transform: hovered && !isMobile ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          </div>
        ) : (
          <div style={{
            width: '100%', aspectRatio: '16/9', backgroundColor: C.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.35)', flexShrink: 0,
          }}>
            <IconGlobe size={40} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {post.tags.slice(0, 2).map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '9999px',
                  backgroundColor: C.secondary, color: C.navy,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h3 style={{
            margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: C.navy,
            lineHeight: 1.35, letterSpacing: '-0.01em',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {post.title}
          </h3>

          {post.excerpt && (
            <p style={{
              margin: '0 0 14px', fontSize: '13px', color: C.muted, lineHeight: 1.6, flex: 1,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px', paddingTop: '12px', borderTop: `1px solid ${C.borderSolid}`,
            marginTop: 'auto',
          }}>
            <span style={{ fontSize: '12px', color: C.light }}>
              {formatDate(post.publishedAt, locale)}
            </span>
            {post.readingTime && (
              <span style={{ fontSize: '12px', color: C.light, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <IconClock size={13} />
                {post.readingTime} {t('min read', 'min')}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

// ── Carousel ───────────────────────────────────────────────────────────────
export default function RelatedPostsCarousel({ posts = [] }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const scrollerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < max - 4)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows, posts.length])

  const scrollBy = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector('[data-carousel-item]')
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  if (!posts.length) return null

  const arrowStyle = (enabled) => ({
    width: '44px', height: '44px', borderRadius: '9999px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: enabled ? C.navy : C.secondary,
    color: enabled ? '#FFFFFF' : C.light,
    border: enabled ? 'none' : `1.5px solid ${C.borderSolid}`,
    cursor: enabled ? 'pointer' : 'default',
    boxShadow: enabled ? '0 2px 8px rgba(22,50,79,0.08)' : 'none',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    padding: 0,
  })

  return (
    <section
      aria-label={t('Continue reading', 'Continuer la lecture')}
      style={{
        borderTop: `1px solid ${C.borderSolid}`,
        padding: isMobile ? '32px 0 8px' : '48px 0 16px',
      }}
    >
      <style>{`
        .kf-carousel-scroller::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: '1120px', margin: '0 auto',
        padding: isMobile ? '0 16px' : '0 24px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: '16px', marginBottom: '20px',
      }}>
        <div>
          <p style={{
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.15em', color: C.green,
            display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px',
          }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: C.green, borderRadius: '2px' }} />
            {t('Keep exploring', 'Continuez à explorer')}
          </p>
          <h2 style={{
            fontSize: isMobile ? '22px' : '28px', fontWeight: 900, color: C.navy,
            letterSpacing: '-0.02em', margin: 0,
          }}>
            {t('More articles', 'Autres articles')}
          </h2>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              aria-label={t('Previous articles', 'Articles précédents')}
              style={arrowStyle(canLeft)}
              onMouseEnter={e => { if (canLeft) e.currentTarget.style.backgroundColor = C.navyLight }}
              onMouseLeave={e => { if (canLeft) e.currentTarget.style.backgroundColor = C.navy }}
            >
              <IconChevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label={t('Next articles', 'Articles suivants')}
              style={arrowStyle(canRight)}
              onMouseEnter={e => { if (canRight) e.currentTarget.style.backgroundColor = C.navyLight }}
              onMouseLeave={e => { if (canRight) e.currentTarget.style.backgroundColor = C.navy }}
            >
              <IconChevron dir="right" />
            </button>
          </div>
        )}
      </div>

      {/* Scroller */}
      <div style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative' }}>
        <div
          ref={scrollerRef}
          className="kf-carousel-scroller"
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            padding: isMobile ? '4px 16px' : '4px 24px',
            scrollPaddingLeft: isMobile ? '16px' : '24px',
          }}
        >
          {posts.map(post => (
            <div key={post.id || post.slug} data-carousel-item style={{ display: 'flex', flex: '0 0 auto' }}>
              <CarouselCard post={post} locale={locale} isMobile={isMobile} />
            </div>
          ))}

          {/* All articles tile */}
          <div data-carousel-item style={{ flex: '0 0 auto', display: 'flex', scrollSnapAlign: 'start' }}>
            <Link
              href={`/${locale}/blog`}
              style={{
                textDecoration: 'none',
                width: isMobile ? '60vw' : '220px',
                display: 'flex',
              }}
            >
              <div style={{
                width: '100%',
                backgroundColor: C.bgAlt,
                border: `1.5px dashed ${C.borderSolid}`,
                borderRadius: '12px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '12px', padding: '24px', minHeight: '160px',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.secondary; e.currentTarget.style.borderColor = C.navy }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.bgAlt; e.currentTarget.style.borderColor = C.borderSolid }}
              >
                <span style={{
                  width: '44px', height: '44px', borderRadius: '9999px',
                  backgroundColor: C.navy, color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconChevron dir="right" size={20} />
                </span>
                <span style={{
                  fontSize: '14px', fontWeight: 700, color: C.navy, textAlign: 'center', lineHeight: 1.4,
                }}>
                  {t('See all articles', 'Voir tous les articles')}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
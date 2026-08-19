'use client'

// components/blog/CountryRelatedPosts.js
//
// Bloc « Pour aller plus loin » : articles de blog lies au pays affiche.
// Alimente par getPostsForCountry(), qui lit le champ Contentful
// `relatedCountries` (liste de codes ISO minuscules, ou le litteral `all`).
//
// MISE EN PAGE
// Un seul article -> carte horizontale, vignette bornee a 260 px. En grille
// pleine largeur, une vignette 16:9 montait a pres de 500 px de haut et
// ecrasait le reste de la page.
// Deux ou trois articles -> colonnes, vignette 16:9 naturelle.
// Sur mobile, tout passe en rangees compactes.
//
// Le bloc ne se rend pas du tout quand aucun article ne correspond.

import Link from 'next/link'
import { useState, useEffect } from 'react'

const DS = {
  navy: '#16324F', surface: '#FFFFFF', bgAlt: '#FAFAF7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  muted: '#6B7280', light: '#9CA3AF', text: '#0F1923',
  green: '#16A34A', secondary: '#EEF2F7', steel: '#9EB7E5',
}

function Arrow({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Cover({ post, width, height, ratio }) {
  return (
    <div style={{
      flexShrink: 0,
      ...(ratio ? { width: '100%', aspectRatio: ratio } : { width, height }),
      backgroundColor: DS.secondary, overflow: 'hidden',
    }}>
      {post.coverImage && (
        <img src={post.coverImage} alt={post.coverAlt || ''} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
    </div>
  )
}

function Meta({ post, locale, titleSize = 14, excerpt = false }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  return (
    <>
      {post.tags?.[0] && (
        <span style={{
          display: 'inline-block', marginBottom: '6px',
          fontSize: '11px', fontWeight: '600', padding: '3px 8px',
          borderRadius: '9999px', backgroundColor: DS.secondary, color: DS.navy,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>{post.tags[0]}</span>
      )}
      <p style={{
        margin: '0 0 4px', fontSize: `${titleSize}px`, fontWeight: '700',
        color: DS.navy, lineHeight: 1.3,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{post.title}</p>

      {excerpt && post.excerpt && (
        <p style={{
          margin: '0 0 8px', fontSize: '13px', color: DS.muted, lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{post.excerpt}</p>
      )}

      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', color: DS.light,
      }}>
        {post.readingTime} {t('min read', 'min de lecture')}
        <span style={{ color: DS.steel, display: 'inline-flex' }}><Arrow size={13} /></span>
      </span>
    </>
  )
}

export default function CountryRelatedPosts({ posts, locale }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setIsMobile(mq.matches)
    on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  if (!posts || posts.length === 0) return null

  const n = posts.length
  const single = n === 1
  const cardBase = {
    border: `1px solid ${DS.border}`, borderRadius: '12px',
    overflow: 'hidden', backgroundColor: DS.surface,
    textDecoration: 'none', color: 'inherit',
  }

  return (
    <section style={{
      backgroundColor: DS.surface, borderRadius: '16px',
      border: `1px solid ${DS.border}`, padding: '20px', overflow: 'hidden',
    }}>
      <p style={{
        margin: '0 0 6px', fontSize: '11px', fontWeight: '800',
        textTransform: 'uppercase', letterSpacing: '0.15em', color: DS.green,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: DS.green, borderRadius: '2px' }} />
        {t('On the blog', 'Sur le blog')}
      </p>

      <h2 style={{
        margin: '0 0 2px', fontSize: '17px', fontWeight: '900',
        color: DS.navy, letterSpacing: '-0.2px',
      }}>
        {t('Read more', 'Pour aller plus loin')}
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: '13px', fontStyle: 'italic', color: DS.muted, lineHeight: 1.5 }}>
        {single
          ? t('One article covers this flag.', 'Un article parle de ce drapeau.')
          : t(`${n} articles cover this flag.`, `${n} articles parlent de ce drapeau.`)}
      </p>

      {/* Un article : carte horizontale, vignette bornee. */}
      {single ? (
        <Link href={`/${locale}/blog/${posts[0].slug}`}
          style={{ ...cardBase, display: 'flex', alignItems: 'stretch' }}>
          <Cover post={posts[0]}
            width={isMobile ? '104px' : '260px'}
            height={isMobile ? '78px' : '146px'} />
          <div style={{
            flex: 1, minWidth: 0,
            padding: isMobile ? '10px 12px' : '16px 18px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <Meta post={posts[0]} locale={locale}
              titleSize={isMobile ? 14 : 16} excerpt={!isMobile} />
          </div>
        </Link>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(n, 3)}, minmax(0, 1fr))`,
          gap: '12px',
        }}>
          {posts.map(p => (
            <Link key={p.id} href={`/${locale}/blog/${p.slug}`}
              style={{
                ...cardBase,
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'stretch' : undefined,
              }}>
              {isMobile
                ? <Cover post={p} width="104px" height="78px" />
                : <Cover post={p} ratio="16 / 9" />}
              <div style={{
                flex: 1, minWidth: 0,
                padding: isMobile ? '10px 12px' : '10px 12px 12px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <Meta post={p} locale={locale} titleSize={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
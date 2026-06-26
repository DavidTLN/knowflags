'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'

// ── Contentful fetch (unchanged logic) ──────────────────────────────────────
const SPACE  = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID
const TOKEN  = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN
const ENV    = 'master'

async function fetchFeatured(isFr) {
  if (!SPACE || !TOKEN) return null
  const url = `https://cdn.contentful.com/spaces/${SPACE}/environments/${ENV}/entries?content_type=featuredFlag&limit=1&order=-sys.createdAt`
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!res.ok) return null
  const json = await res.json()
  const entry = json?.items?.[0]
  if (!entry) return null
  const f = entry.fields
  const get = (field) => {
    if (!field) return ''
    if (typeof field === 'string') return field
    return isFr ? (field['fr'] || field['en-US'] || '') : (field['en-US'] || '')
  }
  return {
    tag:         get(f.tag),
    title:       get(f.title),
    description: get(f.description),
    buttonText:  get(f.buttonText),
    buttonLink:  get(f.buttonLink) || '/',
    imageUrl:    f.image?.fields?.file?.url ? 'https:' + f.image.fields.file.url : null,
    imageAlt:    f.image?.fields?.title || get(f.title) || '',
  }
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{
      display: 'flex',
      gap: '48px',
      alignItems: 'center',
      padding: '0 0 56px',
    }}>
      <div style={{ flex: '0 0 auto', width: 'min(440px, 48%)', aspectRatio: '3/2', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-xl)', opacity: 0.4 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '80px', height: '12px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', opacity: 0.5 }} />
        <div style={{ width: '70%', height: '40px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', opacity: 0.4 }} />
        <div style={{ width: '90%', height: '16px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', opacity: 0.3 }} />
        <div style={{ width: '60%', height: '16px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', opacity: 0.3 }} />
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────
export default function FeaturedFlag() {
  const locale   = useLocale()
  const isFr     = locale === 'fr'
  const t        = (en, fr) => isFr ? fr : en
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetchFeatured(isFr).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [isFr])

  if (loading) return <Skeleton />
  if (!data)   return null

  return (
    <section style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '28px' : '56px',
      alignItems: isMobile ? 'stretch' : 'center',
      padding: isMobile ? '0 0 40px' : '0 0 64px',
    }}>

      {/* ── Flag image ── */}
      {data.imageUrl && (
        <div style={{
          flex: '0 0 auto',
          width: isMobile ? '100%' : 'min(460px, 50%)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-alt)',
        }}>
          <img
            src={data.imageUrl}
            alt={data.imageAlt}
            style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Tag label */}
        {data.tag && (
          <p style={{
            margin: '0 0 14px',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--fw-extrabold)',
            color: 'var(--color-green)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--ls-widest)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {/* Decorative line */}
            <span style={{ display: 'inline-block', width: '24px', height: '2px', backgroundColor: 'var(--color-green)', borderRadius: '2px' }} />
            {data.tag}
          </p>
        )}

        {/* Title */}
        <h1 style={{
          margin: '0 0 18px',
          fontSize: isMobile ? '30px' : '44px',
          fontWeight: 'var(--fw-black)',
          color: 'var(--color-navy)',
          letterSpacing: 'var(--ls-tight)',
          lineHeight: 'var(--lh-tight)',
          fontFamily: 'var(--font-display, system-ui)',
        }}>
          {data.title}
        </h1>

        {/* Description */}
        <p style={{
          margin: '0 0 32px',
          fontSize: isMobile ? 'var(--text-base)' : 'var(--text-md)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--lh-relaxed)',
          maxWidth: '480px',
        }}>
          {data.description}
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href={data.buttonLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '14px 20px' : '14px 24px',
              backgroundColor: 'var(--color-navy)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-bold)',
              textDecoration: 'none',
              transition: 'background-color var(--transition-fast)',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-navy-light)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-navy)'}
          >
            {data.buttonText || t('Explore Gallery', 'Explorer la galerie')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link
            href={`/${locale}/countries`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: 'var(--color-navy)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              display: isMobile ? 'none' : 'inline-flex',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.backgroundColor = 'var(--color-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {t('All countries', 'Tous les pays')}
          </Link>
        </div>
      </div>
    </section>
  )
}
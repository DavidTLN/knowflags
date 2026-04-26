'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from 'contentful'

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap', padding: '0 0 56px', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ flex: '0 0 auto', width: 'min(440px, 100%)', aspectRatio: '3/2', borderRadius: '16px', backgroundColor: '#e2ddd5' }} />
      <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ height: '12px', width: '120px', borderRadius: '6px', backgroundColor: '#e2ddd5' }} />
        <div style={{ height: '36px', width: '80%', borderRadius: '8px', backgroundColor: '#e2ddd5' }} />
        <div style={{ height: '36px', width: '60%', borderRadius: '8px', backgroundColor: '#e2ddd5' }} />
        <div style={{ height: '14px', width: '90%', borderRadius: '6px', backgroundColor: '#e2ddd5' }} />
        <div style={{ height: '48px', width: '160px', borderRadius: '12px', backgroundColor: '#e2ddd5', marginTop: '8px' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}

export default function FeaturedFlag() {
  const locale   = useLocale()
  const isFr     = locale === 'fr'
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // ── Client created INSIDE useEffect so env vars are available ──
    const space       = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID
    const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN

    if (!space || !accessToken) {
      console.warn('FeaturedFlag: missing Contentful env vars')
      setLoading(false)
      return
    }

    const client = createClient({ space, accessToken })

    client
      .getEntries({ content_type: 'featuredFlag', limit: 1 })
      .then(res => {
        if (res.items.length > 0) {
          const f = res.items[0].fields
          // Support both localized and non-localized field access
          const get = (field) => {
            if (!field) return ''
            if (typeof field === 'object' && (field['en-US'] || field['fr'])) {
              return isFr ? (field['fr'] || field['en-US'] || '') : (field['en-US'] || '')
            }
            return field
          }
          setData({
            tag:         get(f.tag),
            title:       get(f.title),
            description: get(f.description),
            buttonText:  get(f.buttonText),
            buttonLink:  get(f.buttonLink) || '/',
            imageUrl:    f.image?.fields?.file?.url
                           ? 'https:' + f.image.fields.file.url
                           : null,
            imageAlt:    f.image?.fields?.title || get(f.title) || '',
          })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('FeaturedFlag fetch error:', err)
        setLoading(false)
      })
  }, [isFr])

  if (loading) return <Skeleton />
  if (!data)   return null

  return (
    <section style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '24px' : '48px',
      alignItems: isMobile ? 'stretch' : 'center',
      padding: isMobile ? '0 0 40px' : '0 0 56px',
    }}>

      {/* Flag image */}
      {data.imageUrl && (
        <div style={{
          flex: '0 0 auto',
          width: isMobile ? '100%' : 'min(440px, 48%)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #e2ddd5',
          backgroundColor: '#f8f5ed',
        }}>
          <img src={data.imageUrl} alt={data.imageAlt}
            style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {data.tag && (
          <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: '#426A5A', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            {data.tag}
          </p>
        )}
        <h2 style={{ margin: '0 0 16px', fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px', lineHeight: 1.15, fontFamily: 'var(--font-display, system-ui)' }}>
          {data.title}
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: isMobile ? '14px' : '16px', color: '#475569', lineHeight: 1.7, maxWidth: '480px' }}>
          {data.description}
        </p>
        {data.buttonText && data.buttonLink && (
          <Link href={data.buttonLink}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '800', letterSpacing: '-0.3px', transition: 'background 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a3a6b'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0B1F3B'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {data.buttonText}
          </Link>
        )}
      </div>
    </section>
  )
}
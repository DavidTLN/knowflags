'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const categories = [
  { id: 1, slug: 'europe',           en: 'Europe',          fr: 'Europe',          count: 44, color: '#1a3a6b', accent: '#4a7fd4', light: '#EBF1FB', svg: '/europe.svg' },
  { id: 2, slug: 'africa',           en: 'Africa',          fr: 'Afrique',         count: 54, color: '#6b2a1a', accent: '#e07840', light: '#FDF0E8', svg: '/africa.svg' },
  { id: 3, slug: 'asia',             en: 'Asia',            fr: 'Asie',            count: 48, color: '#1a5c3a', accent: '#4ab870', light: '#E8F5EE', svg: '/asia.svg' },
  { id: 4, slug: 'north-americas',   en: 'North America',   fr: 'Amér. du Nord',  count: 4,  color: '#3b0764', accent: '#a855d4', light: '#F5E8FD', svg: '/north-america.svg' },
  { id: 5, slug: 'central-americas', en: 'Central America', fr: 'Amér. centrale', count: 20, color: '#581c87', accent: '#c084fc', light: '#F3E8FF', svg: '/central-america.svg' },
  { id: 6, slug: 'south-americas',   en: 'South America',   fr: 'Amér. du Sud',   count: 12, color: '#4a044e', accent: '#e879f9', light: '#FDF4FF', svg: '/south-america.svg' },
  { id: 7, slug: 'oceania',          en: 'Oceania',         fr: 'Océanie',        count: 14, color: '#1a4a6b', accent: '#38b2d4', light: '#E8F6FC', svg: '/oceania.svg' },
]

function ContinentCard({ cat, locale }) {
  const [hovered, setHovered] = useState(false)
  const title = locale === 'fr' ? cat.fr : cat.en

  return (
    <Link href={`/${locale}/continents/${cat.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `2px solid ${hovered ? cat.accent : '#E2DDD5'}`,
          backgroundColor: hovered ? cat.color : cat.light,
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? '0 8px 24px rgba(11,31,59,0.18)' : '0 1px 4px rgba(11,31,59,0.06)',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          {/* SVG continent */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 8px' }}>
            <img
              src={cat.svg}
              alt={title}
              style={{
                width: '75%', maxHeight: '100%', objectFit: 'contain',
                opacity: hovered ? 0.22 : 0.62,
                filter: hovered ? 'brightness(0) invert(1)' : 'brightness(0) opacity(0.55)',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
          {/* Label — fixed height so all tiles stay uniform even with 2-line names */}
          <div style={{
            flexShrink: 0,
            minHeight: '48px',
            padding: '8px 14px 12px',
            borderTop: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px',
          }}>
            <span style={{
              fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em',
              color: hovered ? 'white' : cat.color,
              transition: 'color 0.2s ease', lineHeight: 1.25, flex: 1,
            }}>
              {title}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px', flexShrink: 0,
              backgroundColor: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)',
              color: hovered ? 'white' : cat.color,
              transition: 'all 0.2s ease',
            }}>
              {cat.count}
            </span>
          </div>
        </div>
        {hovered && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function CategoryGrid() {
  const [isMobile, setIsMobile] = useState(false)
  const locale = useLocale()

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section style={{
      backgroundColor: '#F4F1E6',
      padding: isMobile ? '32px 16px' : '48px 24px',
    }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ marginBottom: isMobile ? '20px' : '28px' }}>
          <p style={{
            margin: '0 0 6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: '#16A34A',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ display: 'inline-block', width: '18px', height: '2px', backgroundColor: '#16A34A', borderRadius: '2px' }} />
            {locale === 'fr' ? 'Géographie' : 'Geography'}
          </p>
          <h2 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#16324F', letterSpacing: '-0.02em' }}>
            {locale === 'fr' ? 'Explorer par continent' : 'Browse by Continent'}
          </h2>
        </div>

        {/*
          Mobile  : 2 columns → big tiles, 4 rows (4×2 = 8 slots for 7 items, last row has 1 centered)
          Desktop : 7 columns → single row
        */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(7, 1fr)',
          gap: isMobile ? '14px' : '14px',
        }}>
          {categories.map(cat => (
            <ContinentCard key={cat.id} cat={cat} locale={locale} />
          ))}
        </div>

      </div>
    </section>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const categories = [
  {
    id: 1, slug: 'europe',
    titleEn: 'Europe',         titleFr: 'Europe',
    countryCount: 44, color: '#1a3a6b', accent: '#4a7fd4',
    svg: '/europe.svg',
  },
  {
    id: 2, slug: 'africa',
    titleEn: 'Africa',         titleFr: 'Afrique',
    countryCount: 54, color: '#6b2a1a', accent: '#e07840',
    svg: '/africa.svg',
  },
  {
    id: 3, slug: 'asia',
    titleEn: 'Asia',           titleFr: 'Asie',
    countryCount: 48, color: '#1a5c3a', accent: '#4ab870',
    svg: '/asia.svg',
  },
  {
    id: 4, slug: 'north-americas',
    titleEn: 'North America',  titleFr: 'Amérique du Nord',
    countryCount: 4,  color: '#3b0764', accent: '#a855d4',
    svg: '/north-america.svg',
  },
  {
    id: 5, slug: 'central-americas',
    titleEn: 'Central America', titleFr: 'Amérique centrale',
    countryCount: 20, color: '#581c87', accent: '#c084fc',
    svg: '/central-america.svg',
  },
  {
    id: 6, slug: 'south-americas',
    titleEn: 'South America',  titleFr: 'Amérique du Sud',
    countryCount: 12, color: '#4a044e', accent: '#e879f9',
    svg: '/south-america.svg',
  },
  {
    id: 7, slug: 'oceania',
    titleEn: 'Oceania',        titleFr: 'Océanie',
    countryCount: 14, color: '#1a4a6b', accent: '#38b2d4',
    svg: '/oceania.svg',
  },
]

export default function CategoryGrid() {
  const [isMobile, setIsMobile] = useState(false)
  const [hovered, setHovered] = useState(null)
  const locale = useLocale()

  useEffect(() => {
    function checkMobile() { setIsMobile(window.innerWidth < 768) }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section style={{ backgroundColor: '#F4F1E6', padding: isMobile ? '32px 24px' : '48px 24px' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#0B1F3B', marginBottom: '24px' }}>
          {locale === 'fr' ? 'Explorer par continent' : 'Explore by Continent'}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '20px',
        }}>
          {categories.map((cat) => {
            const isHovered = hovered === cat.id
            const title = locale === 'fr' ? cat.titleFr : cat.titleEn
            return (
              <Link key={cat.id} href={`/${locale}/continents/${cat.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  onMouseEnter={() => setHovered(cat.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    borderRadius: '12px', overflow: 'hidden',
                    border: `2px solid ${isHovered ? cat.accent : '#e5e0d0'}`,
                    transition: 'all 0.25s ease',
                    transform: isHovered ? 'translateY(-4px)' : 'none',
                    boxShadow: isHovered ? `0 12px 32px ${cat.color}44` : '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '1/1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: isHovered ? cat.color : '#f8f5ed',
                    transition: 'background-color 0.25s ease',
                  }}>
                    <img src={cat.svg} alt={title} style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      transition: 'filter 0.25s ease',
                      filter: isHovered ? 'brightness(0) invert(1)' : 'brightness(0) opacity(0.75)',
                    }} />
                  </div>
                  <div style={{
                    padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: isHovered ? cat.color : '#fff',
                    transition: 'background-color 0.25s ease',
                  }}>
                    <div>
                      <div style={{
                        fontSize: '13px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: isHovered ? '#fff' : '#0B1F3B', transition: 'color 0.25s ease',
                      }}>{title}</div>
                      <div style={{
                        fontSize: '11px', marginTop: '2px', transition: 'color 0.25s ease',
                        color: isHovered ? 'rgba(255,255,255,0.7)' : '#888',
                      }}>
                        {cat.countryCount} {locale === 'fr' ? 'pays' : 'countries'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '18px', display: 'inline-block',
                      color: isHovered ? 'rgba(255,255,255,0.8)' : '#aaa',
                      transition: 'color 0.25s ease, transform 0.25s ease',
                      transform: isHovered ? 'translateX(3px)' : 'none',
                    }}>›</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function TrueSizeModule() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '40px 16px' : '72px 24px' }}>
      <div style={{
        maxWidth: '1152px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.05fr',
        gap: isMobile ? '28px' : '56px',
        alignItems: 'center',
      }}>

        {/* Text — left */}
        <div>
          <p style={{
            margin: '0 0 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: '#16A34A',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ display: 'inline-block', width: '18px', height: '2px', backgroundColor: '#16A34A', borderRadius: '2px' }} />
            {t('True Size Map', 'Carte taille réelle')}
          </p>

          <h2 style={{ margin: '0 0 16px', fontSize: isMobile ? '26px' : '36px', fontWeight: '900', color: '#16324F', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {t('How big is China, really?', "C'est quoi la vraie taille de la Chine ?")}
          </h2>

          <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#6B7280', lineHeight: 1.7, maxWidth: '460px' }}>
            {t(
              "Most world maps distort the size of countries. Our interactive tool lets you drag any country and compare its true size anywhere on the globe — no more Mercator lies.",
              "La plupart des cartes déforment la taille des pays. Notre outil interactif te permet de déplacer n'importe quel pays pour comparer sa vraie taille sur le globe — fini les mensonges de Mercator."
            )}
          </p>

          <Link href={`/${locale}/true-size`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#16324F', color: 'white',
            padding: '13px 24px', borderRadius: '10px', textDecoration: 'none',
            fontSize: '14px', fontWeight: '700', letterSpacing: '-0.2px',
            boxShadow: '0 2px 8px rgba(22,50,79,0.08)', transition: 'background-color 0.15s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E4976' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#16324F' }}
          >
            {t('Explore the map', 'Explorer la carte')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* Image — right */}
        <div>
          <img
            src="/true-size-hero.png"
            alt={t('Countries compared in true size on a map', 'Pays comparés à leur taille réelle sur une carte')}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

      </div>
    </section>
  )
}
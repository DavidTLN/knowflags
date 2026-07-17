'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function TrueSizeModule() {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '32px 16px' : '48px 24px' }}>
      <div style={{
        maxWidth: '1152px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '22px' : '52px',
        alignItems: 'center',
      }}>

        {/* Text */}
        <div>
          <p style={{
            margin: '0 0 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: '#16A34A',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ display: 'inline-block', width: '18px', height: '2px', backgroundColor: '#16A34A', borderRadius: '2px' }} />
            {t('True Size Map', 'Carte taille réelle')}
          </p>

          <h2 style={{
            margin: '0 0 12px', fontSize: isMobile ? '25px' : '32px', fontWeight: '900',
            color: '#16324F', letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            {t('How big is China, really?', "C'est quoi la vraie taille de la Chine ?")}
          </h2>

          <p style={{ margin: '0 0 18px', fontSize: '15px', color: '#6B7280', lineHeight: 1.6, maxWidth: '460px' }}>
            {t(
              'Most world maps distort country sizes. Drag any country across the globe and compare its true size — no more Mercator lies.',
              "La plupart des cartes déforment la taille des pays. Déplace n'importe quel pays sur le globe pour comparer sa vraie taille — fini les mensonges de Mercator."
            )}
          </p>

          {/* Points clés */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
            {[
              t('Drag & drop', 'Glisser-déposer'),
              t('Real areas', 'Surfaces réelles'),
              t('197 countries', '197 pays'),
            ].map((label) => (
              <span key={label} style={{
                fontSize: '12px', fontWeight: '600', color: '#16324F',
                backgroundColor: '#EEF2F7', padding: '5px 11px', borderRadius: '9999px',
              }}>
                {label}
              </span>
            ))}
          </div>

          <Link href={`/${locale}/true-size`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#16324F', color: '#FFFFFF',
            padding: '12px 22px', borderRadius: '10px', textDecoration: 'none',
            fontSize: '14px', fontWeight: '700',
            boxShadow: '0 2px 8px rgba(22,50,79,0.08)', transition: 'background-color 0.15s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E4976' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16324F' }}
          >
            {t('Explore the map', 'Explorer la carte')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* Image sur fond texturé (graticule de carte) */}
        <div style={{
          order: isMobile ? -1 : 0,
          position: 'relative', overflow: 'hidden',
          borderRadius: '20px', border: '1px solid rgba(22,50,79,0.10)',
          background: 'radial-gradient(120% 120% at 72% 22%, #E9EFF7 0%, #F4F1E6 68%)',
          padding: isMobile ? '16px' : '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* grille type carte, estompée sur les bords */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(22,50,79,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(22,50,79,0.06) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            WebkitMaskImage: 'radial-gradient(circle at center, #000 55%, transparent 100%)',
            maskImage: 'radial-gradient(circle at center, #000 55%, transparent 100%)',
          }} />
          {/* halo doux */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-30%', right: '-20%', width: '70%', height: '70%',
            background: 'radial-gradient(circle, rgba(158,183,229,0.35), transparent 70%)',
            filter: 'blur(8px)',
          }} />
          <img
            src="/true-size-hero.png"
            alt={t('Countries compared at their true size on a map', 'Pays comparés à leur taille réelle sur une carte')}
            loading="lazy"
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', height: 'auto', maxHeight: isMobile ? '200px' : '270px',
              objectFit: 'contain', display: 'block',
              borderRadius: '10px',
              filter: 'drop-shadow(0 8px 20px rgba(22,50,79,0.18))',
            }}
          />
        </div>

      </div>
    </section>
  )
}
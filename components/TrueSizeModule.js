'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function TrueSizeModule() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <section style={{ backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 80px' }}>
      <div style={{
        // DS: flat navy → navyDark, no off-DS teal
        background: 'linear-gradient(135deg, #16324F 0%, #0F1923 100%)',
        borderRadius: '20px',                 // DS 2xl
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        minHeight: '340px',
        boxShadow: '0 16px 48px rgba(22,50,79,0.18)',  // DS shadow xl
      }}
        className="truesize-module"
      >

        {/* Left: Hero image */}
        <div style={{
          flex: '0 0 48%',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '300px',
        }}
          className="truesize-img-side"
        >
          <img
            src="/true-size-hero.png"
            alt={t('Countries compared in true size on a map', 'Pays comparés à leur taille réelle sur une carte')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          {/* Gradient fade on the right edge to blend into the navy card */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: '80px',
            background: 'linear-gradient(to right, transparent, #16324F)',
          }} />
          {/* Bottom gradient */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '60px',
            background: 'linear-gradient(to top, rgba(15,25,35,0.6), transparent)',
          }} />
        </div>

        {/* Right: content */}
        <div style={{
          flex: 1,
          padding: '44px 40px 44px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '18px',
        }}
          className="truesize-content-side"
        >
          {/* Overline — DS pattern: bar + uppercase gold label, no emoji */}
          <p style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#F4B400',
          }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: '#F4B400', borderRadius: '2px' }} />
            {t('True Size Map', 'Carte Taille Réelle')}
          </p>

          {/* Title */}
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(24px, 2.8vw, 34px)',
            fontWeight: '900',
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.8px',
          }}>
            {t(
              <>How big <em style={{ fontStyle: 'normal', color: '#F4B400' }}>really</em> is China?</>,
              <>C&apos;est quoi la vraie taille de la <em style={{ fontStyle: 'normal', color: '#F4B400' }}>Chine</em> ?</>
            )}
          </h2>

          {/* Description */}
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.7,
            maxWidth: '380px',
          }}>
            {t(
              "Most world maps distort the size of countries. Our interactive tool lets you drag any country and compare its true size anywhere on the globe — no more Mercator lies.",
              "La plupart des cartes déforment la taille des pays. Notre outil interactif te permet de déplacer n'importe quel pays pour comparer sa vraie taille sur le globe — fini les mensonges de Mercator."
            )}
          </p>

          {/* CTA — white on navy, DS radius 10px, SVG arrow */}
          <div>
            <Link href={`/${locale}/true-size`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              color: '#16324F',
              padding: '13px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '-0.2px',
              boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
              transition: 'background-color 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F4F1E6' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
            >
              {t('Explore the map', 'Explorer la carte')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .truesize-module { flex-direction: column !important; }
          .truesize-img-side { flex: 0 0 220px !important; min-height: 220px !important; }
          .truesize-content-side { padding: 28px 24px 36px !important; }
        }
      `}</style>
    </section>
  )
}
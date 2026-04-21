'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function TrueSizeModule() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <section style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px 80px',  // bottom padding adds space before footer
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0B1F3B 0%, #1a3a5c 60%, #0d4a4a 100%)',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        minHeight: '340px',
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
            alt="Countries compared in true size on a map"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          {/* Gradient fade on the right edge to blend into the dark card */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: '80px',
            background: 'linear-gradient(to right, transparent, #1a3a5c)',
          }} />
          {/* Bottom gradient */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '60px',
            background: 'linear-gradient(to top, rgba(11,31,59,0.6), transparent)',
          }} />

          {/* Badges */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'flex',
            gap: '6px',
          }}>
            <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '99px', backgroundColor: 'rgba(158,183,229,0.25)', border: '1px solid rgba(158,183,229,0.5)', color: '#9EB7E5', textTransform: 'uppercase' }}>
              {t('Interactive', 'Interactif')}
            </span>
            <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
              {t('Free', 'Gratuit')}
            </span>
          </div>
        </div>

        {/* Right: content */}
        <div style={{
          flex: 1,
          padding: '44px 40px 44px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '20px',
        }}
          className="truesize-content-side"
        >
          {/* Label */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#FEB12F',
          }}>
            <span>🗺️</span>
            {t('True Size Map', 'Carte Taille Réelle')}
          </div>

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
              <>How big <em style={{ fontStyle: 'normal', color: '#9EB7E5' }}>really</em> is Russia?</>,
              <>C'est quoi la vraie taille de la <em style={{ fontStyle: 'normal', color: '#9EB7E5' }}>Russie</em> ?</>
            )}
          </h2>

          {/* Description */}
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.75,
            maxWidth: '360px',
          }}>
            {t(
              "Most world maps distort the size of countries. Our interactive tool lets you drag any country and compare its true size anywhere on the globe — no more Mercator lies.",
              "La plupart des cartes déforment la taille des pays. Notre outil interactif te permet de déplacer n'importe quel pays pour comparer sa vraie taille sur le globe — fini les mensonges de Mercator."
            )}
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { value: '195', label: t('Countries', 'Pays') },
              { value: '100%', label: t('Accurate', 'Précis') },
              { value: t('Free', 'Gratuit'), label: t('Always', 'Toujours') },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div>
            <Link href={`/${locale}/true-size`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              color: '#0B1F3B',
              padding: '13px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '800',
              letterSpacing: '-0.2px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#9EB7E5' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
            >
              {t('Explore the map', 'Explorer la carte')}
              <span style={{ fontSize: '16px' }}>→</span>
            </Link>
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
'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function TrueSizeModule() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0B1F3B 0%, #1a3a5c 60%, #0d4a4a 100%)',
      borderRadius: '20px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'row',
      minHeight: '280px',
    }}>

      {/* Left: Globe illustration */}
      <div style={{
        flex: '0 0 45%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 60%, rgba(158,183,229,0.15) 0%, transparent 70%)',
        }} />

        {/* SVG Globe */}
        <svg viewBox="0 0 280 280" style={{ width: '85%', maxWidth: '260px', filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.4))' }}>
          {/* Ocean circle */}
          <defs>
            <radialGradient id="globeGrad" cx="45%" cy="40%">
              <stop offset="0%" stopColor="#2d6a8a" />
              <stop offset="100%" stopColor="#0d3a5a" />
            </radialGradient>
            <radialGradient id="glowGrad" cx="50%" cy="50%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
            </radialGradient>
            <clipPath id="globeClip">
              <circle cx="140" cy="140" r="118" />
            </clipPath>
          </defs>

          {/* Globe base */}
          <circle cx="140" cy="140" r="120" fill="url(#globeGrad)" />

          {/* Continents — simplified but recognizable */}
          <g clipPath="url(#globeClip)" fill="#c8b89a" opacity="0.85">
            {/* Europe */}
            <path d="M128 68 Q142 60 155 65 Q165 70 162 82 Q158 92 148 95 Q138 98 128 90 Q120 82 128 68Z" />
            {/* Africa */}
            <path d="M130 100 Q148 95 160 105 Q170 120 168 145 Q165 165 155 175 Q142 182 130 172 Q118 158 115 140 Q112 118 130 100Z" />
            {/* Asia */}
            <path d="M158 60 Q185 50 215 58 Q238 65 240 85 Q242 105 225 115 Q205 122 185 118 Q165 112 160 95 Q155 78 158 60Z" />
            {/* North America */}
            <path d="M48 72 Q70 58 92 65 Q108 72 110 90 Q112 108 98 118 Q82 126 65 120 Q48 110 42 92 Q38 78 48 72Z" />
            {/* South America */}
            <path d="M72 132 Q88 125 100 132 Q110 142 108 162 Q105 182 95 195 Q82 205 70 198 Q58 188 55 168 Q52 148 72 132Z" />
            {/* Australia */}
            <path d="M205 155 Q222 148 235 158 Q245 170 240 185 Q232 196 218 196 Q204 194 197 182 Q192 168 205 155Z" />
          </g>

          {/* Globe shadow overlay */}
          <circle cx="140" cy="140" r="120" fill="url(#glowGrad)" />

          {/* Highlight */}
          <ellipse cx="108" cy="100" rx="28" ry="18" fill="white" opacity="0.06" transform="rotate(-20 108 100)" />

          {/* Border */}
          <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(158,183,229,0.3)" strokeWidth="1.5" />

          {/* Latitude lines */}
          <g clipPath="url(#globeClip)" stroke="rgba(158,183,229,0.12)" strokeWidth="0.8" fill="none">
            <ellipse cx="140" cy="140" rx="118" ry="28" />
            <ellipse cx="140" cy="105" rx="98" ry="20" />
            <ellipse cx="140" cy="175" rx="98" ry="20" />
          </g>
        </svg>

        {/* INTERACTIVE badge */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
        }}>
          <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '99px', backgroundColor: 'rgba(158,183,229,0.2)', border: '1px solid rgba(158,183,229,0.4)', color: '#9EB7E5', textTransform: 'uppercase' }}>
            {t('Interactive', 'Interactif')}
          </span>
          <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
            {t('Educational', 'Éducatif')}
          </span>
        </div>
      </div>

      {/* Right: content */}
      <div style={{
        flex: 1,
        padding: '36px 32px 36px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '16px',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 'clamp(22px, 2.5vw, 30px)',
          fontWeight: '900',
          color: 'white',
          lineHeight: 1.15,
          letterSpacing: '-0.5px',
        }}>
          {t('True World Map Size', 'Vraie Taille des Pays')}
        </h2>

        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.7,
          maxWidth: '340px',
        }}>
          {t(
            "Explore how maps distort the true scale of our planet. Interact with our map to see the actual size of countries by moving them across the globe.",
            "Découvrez comment les cartes déforment la vraie taille des pays. Déplacez n'importe quel pays sur le globe pour voir sa taille réelle."
          )}
        </p>

        <Link href={`/${locale}/true-size`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'white',
          color: '#0B1F3B',
          padding: '12px 22px',
          borderRadius: '12px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '800',
          alignSelf: 'flex-start',
          transition: 'all 0.2s',
          letterSpacing: '-0.2px',
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#9EB7E5'; e.currentTarget.style.color = '#0B1F3B' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#0B1F3B' }}
        >
          {t('Start Exploring', 'Explorer la carte')}
          <span style={{ fontSize: '16px' }}>→</span>
        </Link>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 640px) {
          .truesize-module { flex-direction: column !important; }
          .truesize-module .globe-side { flex: 0 0 200px !important; min-height: 200px !important; }
          .truesize-module .content-side { padding: 20px 20px 28px !important; }
        }
      `}</style>
    </div>
  )
}
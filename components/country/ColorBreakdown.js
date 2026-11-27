'use client'

// Bloc « Couleurs » de la fiche pays (dans Conception et Symbolisme) :
//   - le camembert de la surface du drapeau (countries.color_distribution) ;
//   - les lignes de couleurs existantes, triées comme le camembert ;
//     survoler une ligne met sa part en avant dans le camembert ;
//   - les 3 drapeaux au camembert le plus proche (countries.similar_palettes),
//     avec un lien discret vers The Camembert Game.
// Sans données de répartition, le composant n'est pas utilisé (ancienne liste).

import { useState } from 'react'
import Link from 'next/link'

const DS = {
  navy: '#16324F', bg: '#F4F1E6', surface: '#FFFFFF', border: '#E2DDD5',
  muted: '#6B7280', light: '#9CA3AF', track: '#EEF2F7',
  gold: '#F4B400', goldLight: '#FEF3C7', goldDark: '#92400E',
}

const CSS = `
.kf-cb-top { display: grid; grid-template-columns: 196px minmax(0, 1fr); gap: 22px; align-items: start; }
.kf-cb-near { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.kf-cb-near a { transition: border-color 0.15s ease, transform 0.15s ease; }
.kf-cb-near a:hover { border-color: #16324F55 !important; transform: translateY(-1px); }
.kf-cb-game:hover { color: #16324F !important; text-decoration: underline !important; }
@media (max-width: 640px) {
  .kf-cb-top { grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .kf-cb-pie { flex-direction: row !important; text-align: left !important; }
}
`

const fmt = (n, locale) => Number(n).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 })
const isLight = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}

export function ColorPie({ slices, size = 176, labels = true, focus = null, label }) {
  const parts = slices.reduce((acc, s) => {
    const a0 = acc.length ? acc[acc.length - 1].a1 : -Math.PI / 2
    const a1 = a0 + (s.pct / 100) * Math.PI * 2
    return [...acc, { ...s, a0, a1, mid: (a0 + a1) / 2 }]
  }, [])
  // Arrondi : le serveur et le navigateur ne calculent pas cos/sin au même dernier chiffre
  const pt = (a, r = 50) => [+(50 + r * Math.cos(a)).toFixed(3), +(50 + r * Math.sin(a)).toFixed(3)]
  return (
    <svg viewBox="-2 -2 104 104" width={size} height={size} role="img" aria-label={label} style={{ display: 'block', flexShrink: 0 }}>
      {parts.length === 1
        ? <circle cx="50" cy="50" r="50" fill={parts[0].hex} />
        : parts.map((p, i) => {
          const [x0, y0] = pt(p.a0), [x1, y1] = pt(p.a1)
          const dim = focus && p.key !== focus
          return (
            <path key={i} d={`M50,50 L${x0},${y0} A50,50 0 ${p.a1 - p.a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`}
              fill={p.hex} stroke="rgba(15,25,35,0.16)" strokeWidth="0.4" strokeLinejoin="round"
              style={{ opacity: dim ? 0.22 : 1, transition: 'opacity 0.2s ease' }} />
          )
        })}
      <circle cx="50" cy="50" r="50" fill="none" stroke="rgba(15,25,35,0.22)" strokeWidth="0.8" />
      {labels && parts.filter(p => p.pct >= 8).map((p, i) => {
        const [x, y] = parts.length === 1 ? [50, 50] : pt(p.mid, 31)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: '8px', fontWeight: 800, fill: isLight(p.hex) ? DS.navy : '#FFFFFF', fontFamily: 'var(--font-body), system-ui, sans-serif', opacity: focus && p.key !== focus ? 0 : 1, transition: 'opacity 0.2s ease', pointerEvents: 'none' }}>
            {Math.round(p.pct)}%
          </text>
        )
      })}
    </svg>
  )
}

// renderRow(couleur) : rend une ligne de couleur existante (pastille, nom, sens dépliable).
export default function ColorBreakdown({ country, locale, renderRow }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [focus, setFocus] = useState(null)
  const dist = country.colorDistribution || []

  // Couleurs officielles, triées comme le camembert (part décroissante)
  const share = Object.fromEntries(dist.map(d => [String(d.key).toLowerCase(), d]))
  const colors = [...(country.colors || [])].sort((a, b) => (share[String(b).toLowerCase()]?.pct || 0) - (share[String(a).toLowerCase()]?.pct || 0))
  const pieLabel = t('Colour breakdown of the flag: ', 'Part de chaque couleur du drapeau : ') +
    dist.map(d => `${locale === 'fr' ? d.fr : d.en} ${fmt(d.pct, locale)} %`).join(', ')
  const near = (country.similarPalettes || []).filter(s => Array.isArray(s.slices) && s.slices.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <style>{CSS}</style>
      <div className="kf-cb-top">
        <div className="kf-cb-pie" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <ColorPie slices={dist} focus={focus} label={pieLabel} size={160} />
          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: DS.muted }}>
            {t('Share of each colour', 'Part de chaque couleur')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}
          onMouseLeave={() => setFocus(null)}>
          {colors.map(c => {
            const key = String(c).toLowerCase()
            return (
              <div key={key} onMouseEnter={() => setFocus(key)} onFocus={() => setFocus(key)} onBlur={() => setFocus(null)}>
                {renderRow(c)}
              </div>
            )
          })}
        </div>
      </div>

      {near.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('Closest colour charts', 'Camemberts les plus proches')}
            </p>
            <Link prefetch={false} href={`/${locale}/games/camembert`} className="kf-cb-game"
              style={{ fontSize: '12px', fontWeight: 600, color: DS.muted, textDecoration: 'none' }}>
              {t('Play The Camembert Game →', 'Jouer au jeu du camembert →')}
            </Link>
          </div>
          <div className="kf-cb-near">
            {near.map(s => {
              const nm = locale === 'fr' ? (s.fr || s.en) : (s.en || s.fr)
              return (
                <Link prefetch={false} key={s.code} href={`/${locale}/countries/${s.code}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px 10px', borderRadius: '12px', border: `1px solid ${DS.border}`, backgroundColor: DS.surface, textDecoration: 'none', minWidth: 0 }}>
                  <ColorPie slices={s.slices} size={52} labels={false} label={t(`Colour chart of ${nm}`, `Camembert : ${nm}`)} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '100%' }}>
                    <img src={`https://flagcdn.com/w40/${s.code}.png`} alt="" loading="lazy" style={{ width: '18px', height: '12px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(15,25,35,0.12)', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: DS.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

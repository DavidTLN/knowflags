'use client'

import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import FlagHistoryModule from '@/components/FlagHistoryModule'
import { useLocale } from 'next-intl'
import { labelColor, labelSymbol, labelShape } from '@/lib/flagSymbolsFr'
import Footer from '@/components/Footer'
import PageLoader from '@/components/PageLoader'
import ReportModal from '@/components/ReportModal'

// ── DS Tokens ─────────────────────────────────────────────────────────────────
const DS = {
  navy:    '#16324F',
  bg:      '#F4F1E6',   // Page — warm beige   // Page background — white
  bgAlt:   '#FAFAF7',
  surface: '#FFFFFF',   // Cards — white   // Card/bloc — beige
  surfaceAlt: '#FAFAF7', // Inputs — near white
  border:  '#E2DDD5',
  muted:   '#6B7280',
  light:   '#9CA3AF',
  steel:   '#9EB7E5',
  gold:    '#F4B400',
  green:   '#16A34A',
}

const REGION_LABELS    = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }
const REGION_TO_CONTINENT = { Africa: 'africa', Americas: 'north-americas', Asia: 'asia', Europe: 'europe', Oceania: 'oceania' }

const COLOR_HEX = {
  red: '#D62828', blue: '#2563EB', green: '#16A34A', yellow: '#CA8A04',
  white: '#E5E7EB', black: '#1F2937', orange: '#EA580C', purple: '#7C3AED',
  maroon: '#7F1D1D', gold: '#B45309', brown: '#92400E', pink: '#DB2777',
}

// ── CountryFlagsSection (sub-national) ──────────────────────────────────────
function CountryFlagsSection({ countryIso2 }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [regions, setRegions] = useState([])
  const [cities,  setCities]  = useState([])
  const [activeTab, setActiveTab] = useState('regions')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!countryIso2) return
    const supabase = createClient()
    supabase
      .from('flag_taxonomy').select('id')
      .eq('flag_type', 'country').eq('metadata->>iso2', countryIso2.toLowerCase()).single()
      .then(({ data: country }) => {
        if (!country) { setLoading(false); return }
        supabase
          .from('flag_taxonomy')
          .select('id, slug, name_en, name_fr, flag_type, image_path, sort_order, parent:parent_id(name_en, name_fr)')
          .eq('country_id', country.id).neq('id', country.id).order('sort_order')
          .then(({ data }) => {
            const all = data ?? []
            setRegions(all.filter(f => f.flag_type === 'region'))
            setCities(all.filter(f => f.flag_type === 'city'))
            setLoading(false)
          })
      })
  }, [countryIso2])

  const items = activeTab === 'regions' ? regions : cities
  if (loading || (regions.length === 0 && cities.length === 0)) return null

  return (
    <section style={{ padding: '0 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: DS.navy, letterSpacing: '-0.3px' }}>
          {t('Subnational Flags', 'Drapeaux régionaux')}
        </h2>
        {regions.length > 0 && cities.length > 0 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['regions', t('Regions','Régions')], ['cities', t('Cities','Villes')]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: `1.5px solid ${activeTab === tab ? DS.navy : DS.border}`, backgroundColor: activeTab === tab ? DS.navy : 'transparent', color: activeTab === tab ? 'white' : DS.muted, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
        {items.slice(0, 12).map(f => {
          const fname = locale === 'fr' ? f.name_fr : f.name_en
          return (
            <div key={f.id} style={{ backgroundColor: DS.surface, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
              <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.image_path && <img src={f.image_path} alt={fname} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                  onError={e => {
                    const img = e.currentTarget
                    if (img.dataset.tried !== '1' && /\.svg$/i.test(img.src)) { img.dataset.tried = '1'; img.src = img.src.replace(/\.svg$/i, '.png') }
                    else if (img.dataset.tried !== '1' && /\.png$/i.test(img.src)) { img.dataset.tried = '1'; img.src = img.src.replace(/\.png$/i, '.svg') }
                    else { img.style.display = 'none' }
                  }} />}
              </div>
              <div style={{ padding: '6px 8px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fname}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── FlagHero ─────────────────────────────────────────────────────────────────
function FlagHero({ countryCode, countryName, locale, flagUrl }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [src, setSrc] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [hover, setHover] = useState(false)
  const [isCdn, setIsCdn] = useState(false)
  const iso = (countryCode || '').toLowerCase()
  const cdn = (w) => `https://flagcdn.com/w${w}/${iso}.webp`

  useEffect(() => {
    if (!countryCode) return
    // 1) explicit override on the country (flag_url) wins everywhere
    if (flagUrl) { setSrc(flagUrl); setIsCdn(false); setLoaded(true); return }
    // 2) otherwise the current flag-history entry, 3) else flagcdn
    const supabase = createClient()
    supabase.from('country_flag_history').select('image_url')
      .eq('iso_code', countryCode.toLowerCase()).is('date_end', null)
      .order('date_start', { ascending: false }).limit(1).single()
      .then(({ data }) => {
        if (data?.image_url) { setSrc(data.image_url); setIsCdn(false) }
        else { setSrc(cdn(2560)); setIsCdn(true) }
        setLoaded(true)
      })
      .catch(() => {
        setSrc(cdn(2560)); setIsCdn(true)
        setLoaded(true)
      })
  }, [countryCode, flagUrl])

  async function downloadPng() {
    const url = flagUrl || `https://flagcdn.com/w2560/${countryCode.toLowerCase()}.png`
    const ext = flagUrl && flagUrl.toLowerCase().endsWith('.svg') ? 'svg' : 'png'
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const obj = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = obj
      a.download = `flag-${countryCode.toLowerCase()}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(obj)
    } catch {
      window.open(url, '_blank', 'noopener')
    }
  }

  if (!loaded) return (
    <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: DS.bg }} />
  )

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        src={src}
        alt={countryName}
        onError={() => { setSrc(cdn(2560)); setIsCdn(true) }}
        style={{ width: '100%', display: 'block', aspectRatio: '3/2', objectFit: 'contain', backgroundColor: DS.bg, padding: '16px' }}
      />
      <button
        onClick={downloadPng}
        aria-label={t('Download flag', 'Télécharger le drapeau')}
        title={t('Download flag', 'Télécharger le drapeau')}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'absolute', top: '10px', right: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: `1px solid ${DS.border}`, backgroundColor: hover ? DS.surface : 'rgba(255,255,255,0.82)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', color: DS.navy, cursor: 'pointer', boxShadow: '0 1px 3px rgba(22,50,79,0.10)', transition: 'background-color 0.12s ease' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>
  )
}

// ── ContinentNavModule ────────────────────────────────────────────────────────
// Mirrors CategoryGrid (homepage): green overline + title, 2-col mobile / 7-col desktop big tiles
function ContinentNavModule({ currentContinent, locale }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const CONTINENTS = [
    { slug: 'europe',           en: 'Europe',          fr: 'Europe',          count: 44, color: '#1a3a6b', accent: '#4a7fd4', light: '#EBF1FB', svg: '/europe.svg' },
    { slug: 'africa',           en: 'Africa',          fr: 'Afrique',         count: 54, color: '#6b2a1a', accent: '#e07840', light: '#FDF0E8', svg: '/africa.svg' },
    { slug: 'asia',             en: 'Asia',            fr: 'Asie',            count: 48, color: '#1a5c3a', accent: '#4ab870', light: '#E8F5EE', svg: '/asia.svg'   },
    { slug: 'north-americas',   en: 'North America',   fr: 'Amér. du Nord',  count: 4,  color: '#3b0764', accent: '#a855d4', light: '#F5E8FD', svg: '/north-america.svg' },
    { slug: 'central-americas', en: 'Central America', fr: 'Amér. centrale', count: 20, color: '#581c87', accent: '#c084fc', light: '#F3E8FF', svg: '/central-america.svg' },
    { slug: 'south-americas',   en: 'South America',   fr: 'Amér. du Sud',   count: 12, color: '#4a044e', accent: '#e879f9', light: '#FDF4FF', svg: '/south-america.svg' },
    { slug: 'oceania',          en: 'Oceania',         fr: 'Océanie',        count: 14, color: '#1a4a6b', accent: '#38b2d4', light: '#E8F6FC', svg: '/oceania.svg' },
  ]

  return (
    <section style={{ marginTop: isMobile ? '8px' : '12px' }}>
      <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#16324F', letterSpacing: '-0.02em' }}>
          {locale === 'fr' ? 'Explorer par continent' : 'Browse by Continent'}
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(7, 1fr)',
        gap: isMobile ? '10px' : '14px',
      }}>
        {CONTINENTS.map(c => (
          <ContinentTile key={c.slug} c={c} active={c.slug === currentContinent} locale={locale} />
        ))}
      </div>
    </section>
  )
}

function ContinentTile({ c, active, locale }) {
  const [hovered, setHovered] = useState(false)
  const isHighlighted = active || hovered
  const title = locale === 'fr' ? c.fr : c.en

  return (
    <Link href={`/${locale}/continents/${c.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '100%',
          borderRadius: '14px',
          overflow: 'hidden',
          border: `2px solid ${isHighlighted ? c.accent : '#E2DDD5'}`,
          backgroundColor: isHighlighted ? c.color : c.light,
          transition: 'all 0.2s ease',
          transform: hovered && !active ? 'translateY(-2px)' : 'none',
          boxShadow: isHighlighted ? '0 8px 24px rgba(11,31,59,0.18)' : '0 1px 4px rgba(11,31,59,0.06)',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 14px 6px' }}>
            <img
              src={c.svg}
              alt={title}
              style={{
                width: '72%', maxHeight: '100%', objectFit: 'contain',
                opacity: isHighlighted ? 0.22 : 0.62,
                filter: isHighlighted ? 'brightness(0) invert(1)' : 'brightness(0) opacity(0.55)',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
          <div style={{
            flexShrink: 0,
            minHeight: '40px',
            padding: '6px 10px 9px',
            borderTop: `1px solid ${isHighlighted ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '5px',
          }}>
            <span style={{
              fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em',
              color: isHighlighted ? 'white' : c.color,
              transition: 'color 0.2s ease', lineHeight: 1.2, flex: 1,
            }}>
              {title}
            </span>
            <span style={{
              fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '999px', flexShrink: 0,
              backgroundColor: isHighlighted ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)',
              color: isHighlighted ? 'white' : c.color,
              transition: 'all 0.2s ease',
            }}>
              {c.count}
            </span>
          </div>
        </div>
        {active && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)' }} />
        )}
      </div>
    </Link>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <section style={{ backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, padding: '20px', overflow: 'hidden' }}>
      {title && (
        <h2 style={{ margin: subtitle ? '0 0 2px' : '0 0 16px', fontSize: '17px', fontWeight: '900', color: DS.navy, letterSpacing: '-0.2px' }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p style={{ margin: '0 0 16px', fontSize: '13px', fontStyle: 'italic', color: DS.muted, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  )
}

// ── Flag etiquette card ───────────────────────────────────────────────────────
const ETIQUETTE_COMMON_EN = [
  'Keep the flag clean and never let it touch the ground.',
  'Never fly a torn or faded flag — repair or replace it.',
  'Illuminate the flag if it stays up at night.',
  'Never use the flag as clothing, packaging or advertising.',
  'Dispose of a worn flag respectfully, not in the trash.',
]
const ETIQUETTE_COMMON_FR = [
  'Garder le drapeau propre et ne jamais le laisser toucher le sol.',
  'Ne jamais hisser un drapeau déchiré ou délavé — le réparer ou le remplacer.',
  'Éclairer le drapeau s\u2019il reste hissé la nuit.',
  'Ne jamais l\u2019utiliser comme vêtement, emballage ou publicité.',
  'Se débarrasser d\u2019un drapeau usé de façon respectueuse, pas à la poubelle.',
]

function EtiquetteList({ items }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((r, i) => (
        <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span style={{ marginTop: '7px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: DS.steel, flexShrink: 0 }} />
          <span style={{ fontSize: '14px', color: DS.navy, lineHeight: 1.55 }}>{r}</span>
        </li>
      ))}
    </ul>
  )
}

function FlagEtiquette({ country, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const common = locale === 'fr' ? ETIQUETTE_COMMON_FR : ETIQUETTE_COMMON_EN
  const specific = (locale === 'fr' ? (country.etiquette_fr || country.etiquette_en) : (country.etiquette_en || country.etiquette_fr)) || []
  const overline = { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }
  return (
    <Section title={t('Flag etiquette', "Règles d'utilisation des drapeaux")} subtitle={t('How the flag should be used and displayed with respect.', 'Comment utiliser et afficher le drapeau avec respect.')}>
      {specific.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <p style={overline}>{t('Specific rules', 'Règles spécifiques')} — {locale === 'fr' ? country.fr : country.en}</p>
          <EtiquetteList items={specific} />
        </div>
      )}
      <div>
        <p style={overline}>{t('Common conventions', 'Conventions courantes')}</p>
        <EtiquetteList items={common} />
      </div>
    </Section>
  )
}

// ── Design / Specifications card ──────────────────────────────────────────────
// Real flag-symbol glyphs (SVG), white on the navy chip. Falls back to a letter if unknown.
function symbolGlyph(name) {
  const k = String(name || '').toLowerCase().trim()
  const has = (...arr) => arr.some(w => k.includes(w))
  const wrap = (children, opts = {}) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={opts.fill || 'none'} stroke={opts.stroke || 'currentColor'} strokeWidth={opts.sw || 2} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
  if (has('david'))                                  return wrap(<><polygon points="12,3 18.5,18 5.5,18" fill="none" /><polygon points="12,21 5.5,6 18.5,6" fill="none" /></>, { sw: 1.7 })
  if (has('crescent', 'moon'))                       return wrap(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" stroke="none" />)
  if (has('star'))                                   return wrap(<polygon points="12,2.5 14.6,9 21.5,9.2 16,13.4 18,20.2 12,16.2 6,20.2 8,13.4 2.5,9.2 9.4,9" fill="currentColor" stroke="none" />)
  if (has('sun'))                                    return wrap(<><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /><line x1="5" y1="5" x2="7" y2="7" /><line x1="17" y1="17" x2="19" y2="19" /><line x1="19" y1="5" x2="17" y2="7" /><line x1="7" y1="17" x2="5" y2="19" /></>)
  if (has('crown', 'tiara'))                         return wrap(<><path d="M4 17l1.2-8 4 4L12 6l2.8 7 4-4 1.2 8z" fill="currentColor" stroke="none" /><rect x="4" y="17.5" width="16" height="2.6" rx="1" fill="currentColor" stroke="none" /></>)
  if (has('cross'))                                  return wrap(<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="currentColor" stroke="none" />)
  if (has('triangle'))                               return wrap(<polygon points="12,4 21,20 3,20" fill="currentColor" stroke="none" />)
  if (has('diamond', 'lozenge'))                     return wrap(<path d="M12 3l9 9-9 9-9-9z" fill="currentColor" stroke="none" />)
  if (has('wheel'))                                  return wrap(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /><line x1="12" y1="3.5" x2="12" y2="20.5" /><line x1="3.5" y1="12" x2="20.5" y2="12" /><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>, { sw: 1.4 })
  if (has('armillary', 'sphere', 'globe'))           return wrap(<><circle cx="12" cy="12" r="8.5" /><ellipse cx="12" cy="12" rx="3.4" ry="8.5" /><line x1="3.5" y1="12" x2="20.5" y2="12" /><line x1="12" y1="3.5" x2="12" y2="20.5" /></>, { sw: 1.4 })
  if (has('wreath', 'laurel'))                       return wrap(<g fill="none"><path d="M12 21c-3.5-2-5.5-6-5.5-10 0-2 .4-3.5 1.2-5" /><path d="M12 21c3.5-2 5.5-6 5.5-10 0-2-.4-3.5-1.2-5" /></g>, { sw: 1.8 })
  if (has('olive', 'branch', 'fern', 'leaves', 'leaf', 'maple'))
                                                     return wrap(<><path d="M5 19c0-9 7-14 14-14 0 9-5 14-14 14z" /><line x1="6" y1="18" x2="14" y2="10" /></>)
  if (has('cedar', 'tree', 'palm'))                  return wrap(<><path d="M12 3l4 6h-3l3.5 5h-3l3.5 5H7l3.5-5h-3L11 9H8z" fill="currentColor" stroke="none" /><line x1="12" y1="19" x2="12" y2="22" /></>)
  if (has('mountain', 'volcano'))                    return wrap(<path d="M3 19l5-9 3 4 3-6 7 11z" fill="currentColor" stroke="none" />)
  if (has('snake', 'serpent'))                       return wrap(<path d="M17 5c-3 0-3 3-5 3S9 5 6 5 4 8 7 9s5 1 5 4-3 3-5 3" fill="none" />)
  if (has('trident'))                                return wrap(<><line x1="12" y1="8" x2="12" y2="21" /><path d="M7 5v3.5M12 4v4.5M17 5v3.5" /><path d="M7 8.5a5 5 0 0 0 10 0" /></>)
  if (has('ship', 'boat', 'vessel'))                 return wrap(<><path d="M4 14h16l-2.2 5H6.2z" fill="currentColor" stroke="none" /><line x1="12" y1="3" x2="12" y2="14" /><path d="M12.5 4.5l5 2-5 2z" fill="currentColor" stroke="none" /></>)
  if (has('mosque'))                                 return wrap(<><path d="M6 20v-6a6 6 0 0 1 12 0v6" /><path d="M12 3.5c1.2.9 1.2 2.6 0 3.5-1.2-.9-1.2-2.6 0-3.5z" fill="currentColor" stroke="none" /><line x1="4.5" y1="20" x2="19.5" y2="20" /></>)
  if (has('book', 'bible', 'scroll', 'koran'))       return wrap(<><path d="M12 6.5C10.5 5.2 8 5 6 5v12c2 0 4.5.2 6 1.5" /><path d="M12 6.5C13.5 5.2 16 5 18 5v12c-2 0-4.5.2-6 1.5" /></>)
  if (has('shahada', 'inscription', 'script', 'calligraph', 'text', 'arabic', 'takbir'))
                                                     return wrap(<><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="12" x2="15" y2="12" /><line x1="4" y1="16" x2="18" y2="16" /></>, { sw: 2.2 })
  if (has('wave', 'sea'))                            return wrap(<g fill="none"><path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></g>)
  if (has('gear', 'cog'))                            return wrap(<><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2" /></>, { sw: 1.8 })
  if (has('anchor'))                                 return wrap(<><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="21" /><path d="M5 13a7 7 0 0 0 14 0" /><line x1="8.5" y1="11" x2="15.5" y2="11" /></>)
  if (has('key'))                                    return wrap(<><circle cx="8" cy="8" r="3.5" /><line x1="10.5" y1="10.5" x2="20" y2="20" /><line x1="17" y1="17" x2="19" y2="15" /><line x1="14" y1="14" x2="16" y2="12" /></>)
  if (has('arrow'))                                  return wrap(<><line x1="5" y1="19" x2="19" y2="5" /><path d="M11 5h8v8" /></>)
  if (has('sword', 'sabre', 'saber', 'scimitar', 'dagger', 'khanjar', 'machete', 'spear', 'lance', 'blade', 'knife'))
                                                     return wrap(<><line x1="6" y1="18" x2="18" y2="6" /><line x1="17" y1="4" x2="20" y2="7" /><line x1="13.5" y1="6.5" x2="17.5" y2="10.5" /><line x1="5" y1="17" x2="7" y2="19" /></>)
  if (has('shield', 'arms', 'crest', 'escutcheon', 'emblem'))
                                                     return wrap(<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />)
  if (has('circle', 'disc', 'disk', 'roundel'))      return wrap(<circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" />)
  if (has('square', 'canton'))                       return wrap(<rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor" stroke="none" />)
  if (has('stripe', 'band', 'bar'))                  return wrap(<><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="16" x2="20" y2="16" /></>, { sw: 2.4 })
  if (has('chevron'))                                return wrap(<path d="M4 16l8-7 8 7" />, { sw: 2.4 })
  if (has('eagle', 'bird', 'dove', 'falcon', 'condor', 'crane', 'parrot', 'phoenix', 'quetzal', 'owl', 'hawk'))
                                                     return wrap(<path d="M3 9c4 0 6 4 9 4s5-4 9-4c-3 4-5 8-9 8S6 13 3 9z" />)
  if (has('lion', 'horse', 'llama', 'animal', 'mammal', 'cattle', 'bull', 'elephant', 'leopard'))
                                                     return wrap(<g fill="currentColor" stroke="none"><circle cx="7.5" cy="10" r="1.7" /><circle cx="11" cy="8" r="1.8" /><circle cx="15" cy="8" r="1.8" /><circle cx="16.5" cy="11" r="1.7" /><path d="M12 11.5c2.8 0 5 1.8 5 4 0 1.7-1.6 2.5-5 2.5s-5-.8-5-2.5c0-2.2 2.2-4 5-4z" /></g>)
  return null
}

// slugify a symbol name → file-name fragment (e.g. "Coat of arms" → "coat-of-arms")
function symbolSlug(name) {
  return String(name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Symbol icon: a custom uploaded icon (/flags/symbols/{slug}.svg|png, forced white on the navy tile),
// falling back to the generated glyph, then the first letter.
function SymbolBadge({ slug, fallback }) {
  const exts = ['svg', 'png']
  const [idx, setIdx] = useState(0)
  const src = slug && idx < exts.length ? `/flags/symbols/${slug}.${exts[idx]}` : null
  return (
    <span style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: DS.navy, color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '800' }}>
      {src
        ? <img src={src} alt="" onError={() => setIdx(i => i + 1)} style={{ width: '30px', height: '30px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        : fallback}
    </span>
  )
}

// Optional construction sheet: /flags/construction/{iso}-construction-{locale}.svg
// Shows the current locale, falls back to the other language, then self-hides if neither file exists.
function ConstructionSheet({ iso, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const primary = locale === 'fr' ? 'fr' : 'en'
  const secondary = primary === 'fr' ? 'en' : 'fr'
  const candidates = [
    `/flags/construction/${iso}-construction-${primary}.svg`,
    `/flags/construction/${iso}-construction-${secondary}.svg`,
  ]
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(true)
  if (!iso || !ok) return null
  return (
    <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: '16px', paddingTop: '14px' }}>
      <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Construction sheet', 'Planche de construction')}</p>
      <div style={{ border: `1px solid ${DS.border}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FAFAF7' }}>
        <img
          src={candidates[i]}
          alt={t('Construction sheet', 'Planche de construction')}
          onError={() => (i + 1 < candidates.length ? setI(i + 1) : setOk(false))}
          style={{ width: '100%', display: 'block' }}
        />
      </div>
    </div>
  )
}

function DesignSpecs({ country, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const colors = country.colors || []
  const symbols = country.symbols || []
  const colorMeanings = country.color_meanings || {}
  const symbolMeanings = country.symbol_meanings || {}
  const displaySymbols = Array.isArray(country.display_symbols) ? country.display_symbols : []
  const hasDisplaySymbols = displaySymbols.length > 0
  const spec = locale === 'fr' ? (country.spec_fr || country.spec_en) : (country.spec_en || country.spec_fr)
  const designer = locale === 'fr' ? (country.designer_fr || country.designer_en) : (country.designer_en || country.designer_fr)
  const facts = [country.ratio && { label: t('Proportions', 'Proportions'), value: country.ratio }, country.shape && { label: t('Shape', 'Forme'), value: labelShape(country.shape, locale) }].filter(Boolean)

  const [open, setOpen] = useState(() => new Set())
  const toggle = (key) => setOpen(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })
  const meaningOf = (map, key) => {
    const m = map && map[key]
    if (!m) return null
    return locale === 'fr' ? (m.fr || m.en) : (m.en || m.fr)
  }
  const plusBtn = (isOpen) => (
    <span aria-hidden="true" style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isOpen ? DS.navy : DS.surface, border: `1px solid ${isOpen ? DS.navy : DS.border}`, color: isOpen ? '#fff' : DS.navy, transition: 'all 0.18s ease' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.18s ease' }}>
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </span>
  )
  const disclosure = (key, meaning, headerInner) => {
    const isOpen = open.has(key)
    const clickable = !!meaning
    return (
      <div key={key} style={{ backgroundColor: DS.bg, borderRadius: '10px', border: `1px solid ${isOpen ? DS.navy + '55' : DS.border}`, overflow: 'hidden', transition: 'border-color 0.18s ease' }}>
        <div
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          aria-expanded={clickable ? isOpen : undefined}
          onClick={clickable ? () => toggle(key) : undefined}
          onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(key) } } : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', minHeight: '44px', boxSizing: 'border-box', cursor: clickable ? 'pointer' : 'default' }}
        >
          {headerInner}
          {clickable && plusBtn(isOpen)}
        </div>
        {clickable && (
          <div style={{ maxHeight: isOpen ? '360px' : '0', opacity: isOpen ? 1 : 0, transition: 'max-height 0.28s ease, opacity 0.2s ease', overflow: 'hidden' }}>
            <p style={{ margin: 0, padding: '0 14px 13px 54px', fontSize: '13px', color: DS.navy, lineHeight: 1.6 }}>{meaning}</p>
          </div>
        )}
      </div>
    )
  }

  if (!facts.length && !colors.length && !symbols.length && !displaySymbols.length && !spec && !designer) return null
  return (
    <Section
      title={t('Design & Symbolism', 'Conception et Symbolisme')}
      subtitle={t('Specs plus what each color and emblem means on this flag — tap an element to reveal its meaning.', 'Les spécifications et la signification de chaque couleur et emblème sur ce drapeau — touchez un élément pour révéler son sens.')}
    >
      {facts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}`, marginBottom: (colors.length || symbols.length || hasDisplaySymbols || spec) ? '18px' : 0 }}>
          {facts.map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', backgroundColor: DS.surface, borderRight: i % 2 === 0 && i < facts.length - 1 ? `1px solid ${DS.border}` : 'none' }}>
              <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {colors.length > 0 && (
        <div style={{ marginBottom: (symbols.length || hasDisplaySymbols || spec) ? '18px' : 0 }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Colors', 'Couleurs')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {colors.map(c => {
              const hex = colorMeanings[String(c).toLowerCase()]?.hex || COLOR_HEX[String(c).toLowerCase()] || '#cccccc'
              const header = (
                <>
                  <span style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: hex, border: String(c).toLowerCase() === 'white' ? `1px solid ${DS.border}` : 'none', flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: DS.navy }}>{labelColor(c, locale)}</span>
                    <code style={{ fontSize: '11px', fontFamily: 'monospace', color: DS.muted, textTransform: 'uppercase' }}>{hex}</code>
                  </span>
                </>
              )
              return disclosure('c:' + c, meaningOf(colorMeanings, c), header)
            })}
          </div>
        </div>
      )}

      {(hasDisplaySymbols ? displaySymbols.length > 0 : symbols.length > 0) && (
        <div style={{ marginBottom: spec ? '18px' : 0 }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Symbols & elements', 'Symboles & éléments')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hasDisplaySymbols
              ? displaySymbols.map((d, i) => {
                  const label = locale === 'fr' ? (d.fr || d.en) : (d.en || d.fr)
                  const meaning = d.meaning ? (locale === 'fr' ? (d.meaning.fr || d.meaning.en) : (d.meaning.en || d.meaning.fr)) : null
                  const slug = d.icon || `${country.code}-${symbolSlug(d.glyph || label)}`
                  const header = (
                    <>
                      <SymbolBadge slug={slug} fallback={symbolGlyph(d.glyph || label) || String(label).charAt(0).toUpperCase()} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: DS.navy, flex: 1 }}>{label}</span>
                    </>
                  )
                  return disclosure('d:' + i, meaning, header)
                })
              : symbols.map(sy => {
                  const label = labelSymbol(sy, locale)
                  const header = (
                    <>
                      <SymbolBadge slug={`${country.code}-${symbolSlug(sy)}`} fallback={symbolGlyph(sy) || String(label).charAt(0).toUpperCase()} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: DS.navy, flex: 1 }}>{label}</span>
                    </>
                  )
                  return disclosure('s:' + sy, meaningOf(symbolMeanings, sy), header)
                })}
          </div>
        </div>
      )}

      {spec && (
        <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: '14px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Construction details', 'Détails de construction')}</p>
          <p style={{ margin: 0, fontSize: '13px', color: DS.navy, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{spec}</p>
        </div>
      )}

      {designer && (
        <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: '16px', paddingTop: '14px', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{t('Designed by', 'Conçu par')}</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: DS.navy, lineHeight: 1.5 }}>{designer}</span>
        </div>
      )}

      <ConstructionSheet iso={country.code} locale={locale} />
    </Section>
  )
}

// ── Fact/Did you know card ────────────────────────────────────────────────────
function DidYouKnow({ facts }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [idx, setIdx] = useState(0)
  if (!facts || facts.length === 0) return null
  const fact = facts[idx]
  return (
    <div style={{ backgroundColor: '#EFF6FF', border: `1px solid ${DS.steel}`, borderLeft: `4px solid ${DS.steel}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DS.steel} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8' }}>
          {t('Did you know?', 'Le saviez-vous ?')}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '14px', color: '#1E3A5F', lineHeight: 1.6 }}>{fact}</p>
      {facts.length > 1 && (
        <button onClick={() => setIdx((idx + 1) % facts.length)}
          style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#2563EB', padding: 0 }}>
          {t('Next fact →', 'Anecdote suivante →')}
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CountryDetailPage({ code }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [country, setCountry]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [relatedCountries, setRelated]  = useState([])
  const [facts, setFacts]               = useState([])
  const [isMobile, setIsMobile]         = useState(false)
  const [reportOpen, setReportOpen]     = useState(false)
  const [children, setChildren]         = useState([])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!code) return
    const supabase = createClient()

    // Country data
    supabase.from('countries')
      .select('iso_code, name_en, name_fr, region, capital, capital_fr, colors, symbols, ratio, shape, population, area_km2, adopted_year, median_age, last_flag_change, spec_en, spec_fr, etiquette_en, etiquette_fr, color_meanings, symbol_meanings, display_symbols, designer_en, designer_fr, adopted_note_fr, adopted_note_en, adopted_detail_fr, adopted_detail_en, flag_url, entity_type, parent_iso, sovereignty_note_en, sovereignty_note_fr')
      .eq('iso_code', code.toLowerCase()).single()
      .then(({ data }) => {
        if (data) {
          setCountry({
            code:             data.iso_code,
            en:               data.name_en,
            fr:               data.name_fr,
            region:           data.region,
            capital:          { en: data.capital, fr: data.capital_fr || data.capital },
            colors:           data.colors || [],
            symbols:          data.symbols || [],
            population:       data.population,
            area_km2:         data.area_km2,
            adopted_year:     data.adopted_year,
            median_age:       data.median_age,
            last_flag_change: data.last_flag_change,
            ratio:            data.ratio,
            shape:            data.shape,
            spec_en:          data.spec_en,
            spec_fr:          data.spec_fr,
            designer_en:      data.designer_en,
            designer_fr:      data.designer_fr,
            adopted_note_fr:  data.adopted_note_fr,
            adopted_note_en:  data.adopted_note_en,
            adopted_detail_fr: data.adopted_detail_fr,
            adopted_detail_en: data.adopted_detail_en,
            flag_url: data.flag_url,
            etiquette_en:     data.etiquette_en || [],
            etiquette_fr:     data.etiquette_fr || [],
            color_meanings:   data.color_meanings || {},
            symbol_meanings:  data.symbol_meanings || {},
            display_symbols:  data.display_symbols || [],
            entityType:       data.entity_type,
            parentIso:        data.parent_iso,
            sovNoteEn:        data.sovereignty_note_en,
            sovNoteFr:        data.sovereignty_note_fr,
          })
          // Related countries
          supabase.from('countries').select('iso_code, name_en, name_fr').eq('region', data.region).eq('entity_type', 'sovereign').neq('iso_code', data.iso_code)
            .then(({ data: rel }) => {
              if (rel) setRelated([...rel].sort(() => Math.random() - 0.5).slice(0, 6).map(r => ({ code: r.iso_code, en: r.name_en, fr: r.name_fr })))
            })
          // Constituent / child entities (shown on the parent page)
          supabase.from('countries').select('iso_code, name_en, name_fr').eq('parent_iso', data.iso_code).order('iso_code')
            .then(({ data: kids }) => {
              if (kids && kids.length) setChildren(kids.map(k => ({ code: k.iso_code, en: k.name_en, fr: k.name_fr })))
            })
        }
        setLoading(false)
      })

    // Country facts
    supabase.from('country_facts')
      .select('fact_en, fact_fr, category')
      .eq('country_code', code.toLowerCase())
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFacts(data.map(f => locale === 'fr' ? f.fact_fr : f.fact_en).filter(Boolean))
        }
      })
  }, [code, locale])

  if (loading) return <PageLoader label={t('Loading...', 'Chargement...')} />

  if (!country) return (
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <h1 style={{ color: DS.navy, fontWeight: '900', fontSize: '24px', marginBottom: '12px' }}>{t('Country not found', 'Pays introuvable')}</h1>
        <Link href={`/${locale}/countries`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>
          ← {t('Back to all countries', 'Retour aux pays')}
        </Link>
      </div>
    </div>
  )

  const name         = locale === 'fr' ? country.fr : country.en
  const capital      = country.capital ? (locale === 'fr' ? country.capital.fr : country.capital.en) : '—'
  const region       = locale === 'fr' ? REGION_LABELS[country.region] : country.region
  const continentSlug = REGION_TO_CONTINENT[country.region] || null

  const sovNote = country.entityType && country.entityType !== 'sovereign'
    ? (locale === 'fr' ? country.sovNoteFr : country.sovNoteEn)
    : null
  const badgePillStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '5px 12px', borderRadius: '9999px', backgroundColor: DS.secondary, color: DS.navy, fontSize: '12px', fontWeight: '600', textDecoration: 'none', border: `1px solid ${DS.border}`, width: 'fit-content' }
  const statusBadge = sovNote ? (
    country.parentIso ? (
      <Link href={`/${locale}/countries/${country.parentIso}`} style={badgePillStyle}>
        {sovNote}<span aria-hidden="true">→</span>
      </Link>
    ) : (
      <span style={badgePillStyle}>{sovNote}</span>
    )
  ) : null
  const childrenSection = children.length > 0 ? (
    <Section title={t('Constituent countries', 'Nations constitutives')}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {children.map(ch => {
          const cName = locale === 'fr' ? ch.fr : ch.en
          return (
            <Link key={ch.code} href={`/${locale}/countries/${ch.code}`}
              style={{ textDecoration: 'none', display: 'block', backgroundColor: DS.surface, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
              <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg }}>
                <img src={`https://flagcdn.com/w160/${ch.code}.png`} alt={cName} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cName}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </Section>
  ) : null

  function formatPop(n) {
    if (!n) return '—'
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'K'
    return n.toString()
  }

  // Auto-updating age relative to the CURRENT year
  function yearsLabel(n) {
    if (locale === 'fr') return `${n} ${n <= 1 ? 'an' : 'ans'}`
    return `${n} ${n <= 1 ? 'year' : 'years'}`
  }
  // " (X ans)" suffix from a year, recomputed every year. Empty if no year.
  function yearsSuffix(year) {
    return year ? ` (${yearsLabel(new Date().getFullYear() - year)})` : ''
  }
  function formatFlagSince(dateStr) {
    if (!dateStr) return null
    const year = new Date(dateStr).getFullYear()
    return `${year}${yearsSuffix(year)}`
  }
  // Replace {{since:YYYY}} tokens with a live age (e.g. 81 ans), recomputed every year
  function expandSince(str) {
    return str.replace(/\{\{since:(\d{1,4})\}\}/g, (_, y) => yearsLabel(new Date().getFullYear() - parseInt(y, 10)))
  }
  // Render a Quick-Fact value: bullet list when flagged and multi-part (" · "), else plain text
  function renderFactValue(item) {
    const value = item.value
    if (typeof value !== 'string') return value
    if (item.bullets && value.includes(' · ')) {
      const parts = value.split(' · ')
      return (
        <ul style={{ margin: 0, paddingLeft: '15px' }}>
          {parts.map((p, idx) => (
            <li key={idx} style={{ marginBottom: idx < parts.length - 1 ? '3px' : 0 }}>{expandSince(p)}</li>
          ))}
        </ul>
      )
    }
    return expandSince(value)
  }

  const density = (country.population && country.area_km2)
    ? (country.population / country.area_km2)
    : null
  const densityValue = density === null
    ? null
    : (density < 1 ? '< 1' : Math.round(density).toLocaleString()) + (locale === 'fr' ? ' hab./km²' : ' /km²')

  const adoptedNote   = locale === 'fr' ? country.adopted_note_fr   : country.adopted_note_en
  const adoptedDetail = locale === 'fr' ? country.adopted_detail_fr : country.adopted_detail_en
  // Detail-page adoption value. A live "(X ans)" is appended for EVERY country (recomputed each year);
  // the only exception is a self-contained detail override, which carries its own {{since}} tokens.
  let adoptionValue
  if (adoptedDetail) {
    adoptionValue = adoptedDetail
  } else if (country.adopted_year && adoptedNote) {
    adoptionValue = `${country.adopted_year}${yearsSuffix(country.adopted_year)} ${adoptedNote}`
  } else if (country.last_flag_change) {
    adoptionValue = formatFlagSince(country.last_flag_change)
  } else if (country.adopted_year) {
    adoptionValue = `${country.adopted_year}${yearsSuffix(country.adopted_year)}`
  } else {
    adoptionValue = null
  }

  const quickFacts = [
    { label: t('Capital',      'Capitale'),      value: capital,                                  },
    { label: t('Population',   'Population'),    value: formatPop(country.population),            },
    ...(country.area_km2 ? [{ label: t('Area', 'Superficie'), value: country.area_km2.toLocaleString() + ' km²' }] : []),
    ...(densityValue ? [{ label: t('Density', 'Densité'), value: densityValue }] : []),
    { label: t('Adoption date','Date adoption'), value: adoptionValue, bullets: true },
    ...(country.median_age ? [{ label: t('Median age','Âge médian'), value: country.median_age + (locale === 'fr' ? ' ans' : ' yrs') }] : []),
  ].filter(f => f.value && f.value !== '—')

  // ── MOBILE layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
      <div style={{ backgroundColor: DS.bg, minHeight: '100vh', fontFamily: 'var(--font-body, system-ui)' }}>

        {/* ── Breadcrumb — above flag, near header ── */}
        <div style={{ padding: '12px 16px 8px', backgroundColor: DS.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: DS.muted }}>
            <Link href={`/${locale}/countries`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>
              {t('Flags', 'Drapeaux')}
            </Link>
            <span style={{ color: DS.muted }}>›</span>
            <Link href={`/${locale}/continents/${continentSlug || ''}`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>
              {region}
            </Link>
          </div>
        </div>

        {/* ── Country name ── */}
        <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: '0 0 1px', fontSize: '30px', fontWeight: '900', color: DS.navy, letterSpacing: '-0.8px', lineHeight: 1.1 }}>{name}</h1>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: DS.muted }}>{region}</p>
            {statusBadge}
          </div>
          <button onClick={() => setReportOpen(true)} aria-label={t('Report an issue', 'Signaler un problème')}
            style={{ flexShrink: 0, minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 14px', borderRadius: '10px', backgroundColor: 'transparent', color: DS.navy, border: `1.5px solid ${DS.border}`, fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            {t('Report', 'Signaler')}
          </button>
        </div>

        {/* ── Flag hero — full width ── */}
        <div style={{ backgroundColor: DS.surface, borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}` }}>
          <FlagHero countryCode={country.code} countryName={name} locale={locale} flagUrl={country.flag_url} />
        </div>

        {/* ── Page content — spaced sections ── */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Quick Facts */}
          {quickFacts.length > 0 && (
            <Section title={t('Quick Facts', 'Chiffres clés')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
                {quickFacts.map((item, i) => (
                  <div key={i} style={{
                    padding: '12px 14px',
                    borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none',
                    borderBottom: i < quickFacts.length - 2 ? `1px solid ${DS.border}` : 'none',
                    backgroundColor: DS.surface,
                  }}>
                    <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                    <div style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy, lineHeight: 1.3 }}>{renderFactValue(item)}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {childrenSection}

          {/* Design & Symbolism (merged section) */}
          <DesignSpecs country={country} locale={locale} />

          {/* Flag etiquette */}
          <FlagEtiquette country={country} locale={locale} />

          {/* Did you know */}
          {facts.length > 0 && <DidYouKnow facts={facts} />}

          {/* Historical Timeline */}
          <FlagHistoryModule countryCode={country.code} countryName={name} />

          {/* Sub-national flags */}
          <div style={{ backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, padding: '20px' }}>
            <CountryFlagsSection countryIso2={country.code} />
          </div>

          {/* CTA — Test your knowledge */}
          <Link href={`/${locale}/games/flag-reveal`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ backgroundColor: DS.navy, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '900', color: 'white', letterSpacing: '-0.2px' }}>
                  {t('Test your knowledge!', 'Testez vos connaissances !')}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: DS.steel, lineHeight: 1.4 }}>
                  {t('Can you recognize this flag?', 'Reconnaissez-vous ce drapeau ?')}
                </p>
              </div>
              <div style={{ backgroundColor: DS.steel, borderRadius: '10px', padding: '10px 16px', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: DS.navy }}>
                  {t('Play', 'Jouer')}
                </span>
              </div>
            </div>
          </Link>

          {/* Related flags */}
          {relatedCountries.length > 0 && (
            <Section title={t(`More from ${region}`, `Autres pays — ${region}`)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {relatedCountries.map(c => {
                  const cName = locale === 'fr' ? c.fr : c.en
                  return (
                    <Link key={c.code} href={`/${locale}/countries/${c.code}`}
                      style={{ textDecoration: 'none', display: 'block', backgroundColor: DS.bg, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
                      <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg }}>
                        <img src={`https://flagcdn.com/w160/${c.code}.png`} alt={cName} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                      </div>
                      <div style={{ padding: '6px 8px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cName}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Continent nav */}
          <ContinentNavModule currentContinent={continentSlug} locale={locale} />

        </div>
      </div>
      <Footer />
      {reportOpen && <ReportModal countryCode={country.code} countryName={name} onClose={() => setReportOpen(false)} />}
      </>
    )
  }

  // ── DESKTOP layout — matches mobile card-based design ────────────────────
  return (
    <>
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', fontFamily: 'var(--font-body, system-ui)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: '13px', color: DS.muted }}>
          <Link href={`/${locale}/countries`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>
            {t('Flags', 'Drapeaux')}
          </Link>
          <span>›</span>
          <Link href={`/${locale}/continents/${continentSlug || ''}`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>{region}</Link>
          <span>›</span>
          <span style={{ color: DS.navy, fontWeight: '600' }}>{name}</span>
        </div>

        {/* ── Title banner — full width ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: DS.navy, margin: '0 0 2px', letterSpacing: '-1px' }}>{name}</h1>
            <p style={{ margin: 0, fontSize: '15px', color: DS.muted }}>
              {region}
            </p>
            {statusBadge}
          </div>
          <button onClick={() => setReportOpen(true)}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = DS.bgAlt }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', backgroundColor: 'transparent', color: DS.navy, border: `1.5px solid ${DS.border}`, fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 0.12s ease' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            {t('Report an issue', 'Signaler un probl\u00e8me')}
          </button>
        </div>

        {/* ── Hero row: flag + quick facts (aligned heights) ── */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', marginBottom: '24px', flexWrap: 'wrap' }}>

          {/* Flag card */}
          <div style={{ flex: '1 1 380px', maxWidth: '440px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(22,50,79,0.12)', border: `1px solid ${DS.border}`, backgroundColor: DS.surface, display: 'flex', alignItems: 'center' }}>
            <FlagHero countryCode={country.code} countryName={name} locale={locale} flagUrl={country.flag_url} />
          </div>

          {/* Quick Facts card */}
          {quickFacts.length > 0 && (
            <div style={{ flex: '1 1 360px', minWidth: 0, backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: '800', color: DS.navy, letterSpacing: '-0.01em' }}>{t('Quick Facts', 'Chiffres cl\u00e9s')}</p>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
                {quickFacts.map((item, i) => (
                  <div key={i} style={{
                    padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    backgroundColor: DS.surface,
                    borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none',
                    borderBottom: i < quickFacts.length - 2 ? `1px solid ${DS.border}` : 'none',
                  }}>
                    <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                    <div style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: DS.navy }}>{renderFactValue(item)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Content sections — same card pattern as mobile ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {childrenSection}

          {/* Design & Symbolism (merged section) */}
          <DesignSpecs country={country} locale={locale} />

          {/* Flag etiquette */}
          <FlagEtiquette country={country} locale={locale} />

          {/* Did you know */}
          {facts.length > 0 && <DidYouKnow facts={facts} />}

          {/* Historical Timeline */}
          <FlagHistoryModule countryCode={country.code} countryName={name} />

          {/* Sub-national flags */}
          <div style={{ backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, padding: '20px' }}>
            <CountryFlagsSection countryIso2={country.code} />
          </div>

          {/* CTA */}
          <div style={{ backgroundColor: DS.navy, borderRadius: '16px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: 'white' }}>{t('Test your knowledge!', 'Testez vos connaissances !')}</h2>
              <p style={{ margin: 0, fontSize: '14px', color: DS.steel }}>{t('Can you recognize this flag in Flag Reveal?', 'Reconnaîtrez-vous ce drapeau dans Flag Reveal ?')}</p>
            </div>
            <Link href={`/${locale}/games/flag-reveal`} style={{ backgroundColor: DS.steel, color: DS.navy, padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
              {t('Play Flag Reveal', 'Jouer à Flag Reveal')}
            </Link>
          </div>

          {/* Related countries */}
          {relatedCountries.length > 0 && (
            <Section title={t(`More from ${region}`, `Autres pays — ${region}`)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {relatedCountries.map(rc => {
                  const cName = locale === 'fr' ? rc.fr : rc.en
                  return (
                    <Link key={rc.code} href={`/${locale}/countries/${rc.code}`}
                      style={{ textDecoration: 'none', display: 'block', backgroundColor: DS.surface, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}`, transition: 'transform 0.15s, box-shadow 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(22,50,79,0.10)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg }}>
                        <img src={`https://flagcdn.com/w160/${rc.code}.png`} alt={cName} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cName}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Continent nav */}
          <ContinentNavModule currentContinent={continentSlug} locale={locale} />

        </div>
      </div>
    </div>
    <Footer />
    {reportOpen && <ReportModal countryCode={country.code} countryName={name} onClose={() => setReportOpen(false)} />}
    </>
  )
}
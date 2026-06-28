'use client'

import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import FlagHistoryModule from '@/components/FlagHistoryModule'
import { useLocale } from 'next-intl'
import { labelColor, labelSymbol, labelShape } from '@/lib/flagSymbolsFr'
import Footer from '@/components/Footer'
import PageLoader from '@/components/PageLoader'

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
function FlagHero({ countryCode, countryName, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [src, setSrc] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (!countryCode) return
    const supabase = createClient()
    supabase.from('country_flag_history').select('image_url')
      .eq('iso_code', countryCode.toUpperCase()).is('date_end', null)
      .order('date_start', { ascending: false }).limit(1).single()
      .then(({ data }) => {
        setSrc(data?.image_url || `https://flagcdn.com/w640/${countryCode.toLowerCase()}.png`)
        setLoaded(true)
      })
      .catch(() => {
        setSrc(`https://flagcdn.com/w640/${countryCode.toLowerCase()}.png`)
        setLoaded(true)
      })
  }, [countryCode])

  async function downloadPng() {
    const url = `https://flagcdn.com/w1280/${countryCode.toLowerCase()}.png`
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const obj = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = obj
      a.download = `flag-${countryCode.toLowerCase()}.png`
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
    <>
      <img
        src={src}
        alt={countryName}
        onError={() => setSrc(`https://flagcdn.com/w640/${countryCode.toLowerCase()}.png`)}
        style={{ width: '100%', display: 'block', aspectRatio: '3/2', objectFit: 'contain', backgroundColor: DS.bg, padding: '16px' }}
      />
      <button
        onClick={downloadPng}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 16px', border: 'none', borderTop: `1px solid ${DS.border}`, backgroundColor: hover ? DS.bg : DS.surface, color: DS.navy, fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.12s ease' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {t('Download PNG image', 'Télécharger l’image PNG')}
      </button>
    </>
  )
}

// ── ContinentNavModule ────────────────────────────────────────────────────────
// Uses the same grid pattern as CategoryGrid (homepage) — no scroll, multi-line
function ContinentNavModule({ currentContinent, locale }) {
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
    <section>
      <h2 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: '900', color: DS.navy, letterSpacing: '-0.3px' }}>
        {locale === 'fr' ? 'Explorer par continent' : 'Browse by Continent'}
      </h2>
      {/* 4-col grid on mobile → 2 rows (4+3), 7-col on desktop → 1 row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {CONTINENTS.map(c => {
          const active = c.slug === currentContinent
          return (
            <ContinentTile key={c.slug} c={c} active={active} locale={locale} />
          )
        })}
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
          borderRadius: '12px',
          overflow: 'hidden',
          border: `2px solid ${isHighlighted ? c.accent : DS.border}`,
          backgroundColor: isHighlighted ? c.color : c.light,
          transition: 'all 0.2s ease',
          transform: hovered && !active ? 'translateY(-2px)' : 'none',
          boxShadow: isHighlighted ? '0 6px 20px rgba(11,31,59,0.18)' : '0 1px 3px rgba(11,31,59,0.06)',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 10px 4px' }}>
            <img
              src={c.svg}
              alt={title}
              style={{
                width: '70%', maxHeight: '100%', objectFit: 'contain',
                opacity: isHighlighted ? 0.22 : 0.6,
                filter: isHighlighted ? 'brightness(0) invert(1)' : 'brightness(0) opacity(0.5)',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
          <div style={{
            flexShrink: 0,
            minHeight: '34px',
            padding: '4px 8px 7px',
            borderTop: `1px solid ${isHighlighted ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3px',
          }}>
            <span style={{
              fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em',
              color: isHighlighted ? 'white' : c.color,
              transition: 'color 0.2s ease', lineHeight: 1.25, flex: 1,
            }}>
              {title}
            </span>
            {active && (
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.7)',
              }} />
            )}
          </div>
        </div>
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
function DesignSpecs({ country, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const colors = country.colors || []
  const symbols = country.symbols || []
  const spec = locale === 'fr' ? (country.spec_fr || country.spec_en) : (country.spec_en || country.spec_fr)
  const facts = [country.ratio && { label: t('Proportions', 'Proportions'), value: country.ratio }, country.shape && { label: t('Shape', 'Forme'), value: labelShape(country.shape, locale) }].filter(Boolean)
  if (!facts.length && !colors.length && !symbols.length && !spec) return null
  return (
    <Section title={t('Design & Specifications', 'Conception & spécifications')} subtitle={t('Technical reference to reproduce the flag faithfully.', 'Référence technique pour reproduire fidèlement le drapeau.')}>
      {facts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${DS.border}`, marginBottom: (colors.length || symbols.length || spec) ? '16px' : 0 }}>
          {facts.map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', backgroundColor: DS.surface, borderRight: i % 2 === 0 && i < facts.length - 1 ? `1px solid ${DS.border}` : 'none' }}>
              <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
      {colors.length > 0 && (
        <div style={{ marginBottom: (symbols.length || spec) ? '16px' : 0 }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Colors & hex codes', 'Couleurs & codes hexa')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {colors.map(c => {
              const hex = COLOR_HEX[String(c).toLowerCase()] || '#cccccc'
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', backgroundColor: DS.bg, borderRadius: '8px', border: `1px solid ${DS.border}` }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: hex, border: String(c).toLowerCase() === 'white' ? `1px solid ${DS.border}` : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: DS.navy, flex: 1 }}>{labelColor(c, locale)}</span>
                  <code style={{ fontSize: '12px', fontFamily: 'monospace', color: DS.muted, textTransform: 'uppercase' }}>{hex}</code>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {symbols.length > 0 && (
        <div style={{ marginBottom: spec ? '16px' : 0 }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Elements', 'Éléments')}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {symbols.map(sy => (
              <span key={sy} style={{ padding: '6px 12px', backgroundColor: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '99px', fontSize: '13px', fontWeight: '600', color: DS.navy }}>{labelSymbol(sy, locale)}</span>
            ))}
          </div>
        </div>
      )}
      {spec && (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Specifications', 'Spécifications')}</p>
          <p style={{ margin: 0, fontSize: '13px', color: DS.navy, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{spec}</p>
        </div>
      )}
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
      .select('iso_code, name_en, name_fr, region, capital, capital_fr, colors, symbols, ratio, shape, population, area_km2, adopted_year, median_age, last_flag_change, spec_en, spec_fr, etiquette_en, etiquette_fr')
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
            etiquette_en:     data.etiquette_en || [],
            etiquette_fr:     data.etiquette_fr || [],
          })
          // Related countries
          supabase.from('countries').select('iso_code, name_en, name_fr').eq('region', data.region).neq('iso_code', data.iso_code)
            .then(({ data: rel }) => {
              if (rel) setRelated([...rel].sort(() => Math.random() - 0.5).slice(0, 6).map(r => ({ code: r.iso_code, en: r.name_en, fr: r.name_fr })))
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

  function formatPop(n) {
    if (!n) return '—'
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'K'
    return n.toString()
  }

  function formatFlagSince(dateStr) {
    if (!dateStr) return null
    const year  = new Date(dateStr).getFullYear()
    const years = new Date().getFullYear() - year
    return `${year} (${years} ${locale === 'fr' ? 'ans' : 'yrs'})`
  }

  const quickFacts = [
    { label: t('Capital',      'Capitale'),      value: capital,                                  },
    { label: t('Population',   'Population'),    value: formatPop(country.population),            },
    { label: t('Adoption date','Date adoption'), value: formatFlagSince(country.last_flag_change) },
    { label: t('Aspect ratio', 'Proportions'),   value: country.ratio || '—'                      },
    ...(country.area_km2   ? [{ label: t('Area', 'Superficie'), value: country.area_km2.toLocaleString() + ' km²' }] : []),
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

        {/* ── Flag hero — full width ── */}
        <div style={{ backgroundColor: DS.surface, borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}` }}>
          <FlagHero countryCode={country.code} countryName={name} locale={locale} />
        </div>

        {/* ── Country name ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <h1 style={{ margin: '0 0 1px', fontSize: '30px', fontWeight: '900', color: DS.navy, letterSpacing: '-0.8px', lineHeight: 1.1 }}>{name}</h1>
          <p style={{ margin: '0 0 4px', fontSize: '14px', color: DS.muted }}>{region}</p>
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
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy, lineHeight: 1.3 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Colors + Symbols — Symbolism section */}
          {(country.colors.length > 0 || country.symbols.length > 0) && (
            <Section title={t('Symbolism', 'Symbolisme')} subtitle={t('What the colors and emblems on the flag represent.', 'Ce que représentent les couleurs et emblèmes du drapeau.')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {country.colors.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('Colors', 'Couleurs')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {country.colors.map(c => (
                        <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: DS.bg, borderRadius: '10px', border: `1px solid ${DS.border}` }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: COLOR_HEX[c] || '#ccc', border: c === 'white' ? `1.5px solid ${DS.border}` : 'none', flexShrink: 0 }} />
                          <span style={{ fontSize: '14px', fontWeight: '700', color: DS.navy }}>
                            {labelColor(c, locale)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {country.symbols.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('Symbols', 'Symboles')}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {country.symbols.map(s => (
                        <span key={s} style={{ padding: '6px 14px', backgroundColor: DS.navy, color: 'white', borderRadius: '99px', fontSize: '13px', fontWeight: '600' }}>
                          {labelSymbol(s, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Design & specifications */}
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
      </>
    )
  }

  // ── DESKTOP layout — matches mobile card-based design ────────────────────
  return (
    <>
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', fontFamily: 'var(--font-body, system-ui)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 48px' }}>

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

        {/* ── Hero row: flag left, title + quick facts right ── */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '24px' }}>

          {/* Flag card */}
          <div style={{ flex: '0 0 auto', width: 'min(360px, 44%)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(22,50,79,0.12)', border: `1px solid ${DS.border}`, backgroundColor: DS.surface }}>
            <FlagHero countryCode={country.code} countryName={name} locale={locale} />
          </div>

          {/* Title + facts */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: DS.navy, margin: '0 0 1px', letterSpacing: '-1px' }}>{name}</h1>
              <p style={{ margin: 0, fontSize: '14px', color: DS.muted }}>{region}</p>
            </div>

            {/* Quick Facts card */}
            {quickFacts.length > 0 && (
              <Section title={t('Quick Facts', 'Chiffres clés')}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
                  {quickFacts.map((item, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      backgroundColor: DS.surface,
                      borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none',
                      borderBottom: i < quickFacts.length - 2 ? `1px solid ${DS.border}` : 'none',
                    }}>
                      <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* ── Content sections — same card pattern as mobile ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Symbolism */}
          {(country.colors.length > 0 || country.symbols.length > 0) && (
            <Section title={t('Symbolism', 'Symbolisme')} subtitle={t('What the colors and emblems on the flag represent.', 'Ce que représentent les couleurs et emblèmes du drapeau.')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {country.colors.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('Flag Colors', 'Couleurs du drapeau')}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {country.colors.map(col => (
                        <div key={col} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', backgroundColor: DS.bg, borderRadius: '99px', border: `1px solid ${DS.border}`, fontSize: '13px', fontWeight: '600', color: DS.navy }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLOR_HEX[col] || '#ccc', border: col === 'white' ? `1px solid ${DS.border}` : 'none', flexShrink: 0 }} />
                          {labelColor(col, locale)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {country.symbols.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('Symbols', 'Symboles')}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {country.symbols.map(s => (
                        <span key={s} style={{ padding: '6px 14px', backgroundColor: DS.navy, color: 'white', borderRadius: '99px', fontSize: '13px', fontWeight: '600' }}>
                          {labelSymbol(s, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Design & specifications */}
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
    </>
  )
}
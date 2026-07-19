'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import FlagImage from '@/components/FlagImage'
import Footer from '@/components/Footer'

const CONTINENTS = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania']
const CONTINENT_FR = { Europe: 'Europe', 'North America': 'Amerique du Nord', 'South America': 'Amerique du Sud', Asia: 'Asie', Africa: 'Afrique', Oceania: 'Oceanie' }

const DS = {
  navy: '#16324F', bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: '#E2DDD5', muted: '#6B7280', light: '#9CA3AF',
}

const COLOR_OPTIONS = [
  { key: 'red',    label: { en: 'Red',    fr: 'Rouge'  }, hex: '#ef4444' },
  { key: 'blue',   label: { en: 'Blue',   fr: 'Bleu'   }, hex: '#3b82f6' },
  { key: 'green',  label: { en: 'Green',  fr: 'Vert'   }, hex: '#22c55e' },
  { key: 'yellow', label: { en: 'Yellow', fr: 'Jaune'  }, hex: '#eab308' },
  { key: 'white',  label: { en: 'White',  fr: 'Blanc'  }, hex: '#f1f5f9', border: true },
  { key: 'black',  label: { en: 'Black',  fr: 'Noir'   }, hex: '#1f2937' },
  { key: 'orange', label: { en: 'Orange', fr: 'Orange' }, hex: '#f97316' },
  { key: 'purple', label: { en: 'Purple', fr: 'Violet' }, hex: '#7c3aed' },
]

const SYMBOL_OPTIONS = [
  { key: 'cross',       label: { en: 'Cross',       fr: 'Croix'    } },
  { key: 'star',        label: { en: 'Star',         fr: 'Etoile'   } },
  { key: 'sun',         label: { en: 'Sun',          fr: 'Soleil'   } },
  { key: 'crescent',    label: { en: 'Crescent',     fr: 'Croissant'} },
  { key: 'eagle',       label: { en: 'Eagle',        fr: 'Aigle'    } },
  { key: 'lion',        label: { en: 'Lion',         fr: 'Lion'     } },
  { key: 'bear',        label: { en: 'Bear',         fr: 'Ours'     } },
  { key: 'coat_of_arms',label: { en: 'Coat of Arms', fr: 'Blason'   } },
  { key: 'stripes',     label: { en: 'Stripes',      fr: 'Rayures'  } },
  { key: 'weapon',      label: { en: 'Weapon',       fr: 'Arme'     } },
]

const SHAPE_OPTIONS = [
  { key: 'rectangle', label: { en: 'Rectangle', fr: 'Rectangle' } },
  { key: 'square',    label: { en: 'Square',    fr: 'Carre'     } },
  { key: 'pennant',   label: { en: 'Pennant',   fr: 'Pennon'    } },
]

function FilterSection({ title, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: '4px', borderBottom: '1px solid #f0f0f0' }}>
      <button onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#0B1F3B' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {title}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="2,4 7,10 12,4"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
      border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0',
      backgroundColor: active ? '#0B1F3B' : '#fafafa',
      color: active ? 'white' : '#475569',
    }}>
      {children}
    </button>
  )
}

function CityCard({ flag, name, regionName, countryName, locale }) {
  return (
    <Link href={`/${locale}/flags/cities/${flag.slug}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FlagImage slug={flag.slug} prefix="/flags/cities" name={name} color="#0B1F3B" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
      </div>

      {/* ── bloc texte centré ── */}
      <div style={{ padding: '12px 14px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '4px', marginTop: '3px', minHeight: '32px',
        }}>
          {flag.country && flag.country.image_path && (
            <img src={flag.country.image_path} width="14" height="10" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.35 }}>
            {regionName ? regionName + ', ' + countryName : countryName}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function CitiesClient({ flags = [] }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [isMobile, setIsMobile] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openSections, setOpenSections] = useState({ continent: false, country: false, region: false, colors: false, symbols: false, ratio: false, shape: false })

  const [search, setSearch]                   = useState('')
  const [sortOrder, setSortOrder]             = useState('az')
  const [activeCountry, setActiveCountry]     = useState('all')
  const [activeContinent, setActiveContinent] = useState('all')
  const [activeRegion, setActiveRegion]       = useState('all')
  const [activeColors, setActiveColors]       = useState([])
  const [activeSymbols, setActiveSymbols]     = useState([])
  const [activeRatios, setActiveRatios]       = useState([])
  const [activeShapes, setActiveShapes]       = useState([])

  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }))
  const toggle = (arr, setter, val) => setter(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const countries = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const f of flags) {
      if (f.country && !seen.has(f.country.slug)) {
        seen.add(f.country.slug)
        result.push(f.country)
      }
    }
    return result.sort((a, b) => (locale === 'fr' ? a.name_fr : a.name_en).localeCompare(locale === 'fr' ? b.name_fr : b.name_en))
  }, [flags, locale])

  const regions = useMemo(() => {
    if (activeCountry === 'all') return []
    const seen = new Set()
    const result = []
    for (const f of flags) {
      if (f.country && f.country.slug === activeCountry && f.parent && !seen.has(f.parent.slug)) {
        seen.add(f.parent.slug)
        result.push(f.parent)
      }
    }
    return result.sort((a, b) => (locale === 'fr' ? a.name_fr : a.name_en).localeCompare(locale === 'fr' ? b.name_fr : b.name_en))
  }, [flags, activeCountry, locale])

  const ratioOptions = useMemo(() => {
    const freq = {}
    flags.forEach(f => { const r = f.metadata && f.metadata.ratio; if (r) freq[r] = (freq[r] || 0) + 1 })
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([r]) => ({ key: r, label: r }))
  }, [flags])

  const filtered = useMemo(() => {
    let list = [...flags]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(f => (locale === 'fr' ? f.name_fr : f.name_en).toLowerCase().includes(q))
    if (activeContinent !== 'all') list = list.filter(f => f.country && f.country.metadata && f.country.metadata.continent === activeContinent)
    if (activeCountry !== 'all') list = list.filter(f => f.country && f.country.slug === activeCountry)
    if (activeRegion !== 'all') list = list.filter(f => f.parent && f.parent.slug === activeRegion)
    if (activeColors.length > 0) list = list.filter(f => activeColors.every(c => ((f.metadata && f.metadata.colors) || []).includes(c)))
    if (activeSymbols.length > 0) list = list.filter(f => activeSymbols.every(s => ((f.metadata && f.metadata.symbols) || []).includes(s)))
    if (activeRatios.length > 0) list = list.filter(f => activeRatios.includes(f.metadata && f.metadata.ratio))
    if (activeShapes.length > 0) list = list.filter(f => activeShapes.includes(f.metadata && f.metadata.shape))
    list.sort((a, b) => {
      const na = (locale === 'fr' ? a.name_fr : a.name_en) || ''
      const nb = (locale === 'fr' ? b.name_fr : b.name_en) || ''
      return sortOrder === 'az' ? na.localeCompare(nb) : nb.localeCompare(na)
    })
    return list
  }, [flags, search, activeContinent, activeCountry, activeRegion, activeColors, activeSymbols, activeRatios, activeShapes, sortOrder, locale])

  const hasFilters = !!(search || activeContinent !== 'all' || activeCountry !== 'all' || activeRegion !== 'all' || activeColors.length || activeSymbols.length || activeRatios.length || activeShapes.length)

  const activeCount = [
    search ? 1 : 0, activeContinent !== 'all' ? 1 : 0, activeCountry !== 'all' ? 1 : 0,
    activeRegion !== 'all' ? 1 : 0, activeColors.length, activeSymbols.length, activeRatios.length, activeShapes.length,
  ].reduce((a, b) => a + b, 0)

  function clearAll() {
    setSearch(''); setActiveContinent('all'); setActiveCountry('all'); setActiveRegion('all')
    setActiveColors([]); setActiveSymbols([]); setActiveRatios([]); setActiveShapes([])
  }

  // ── Chip + filter helpers (aligned with country page) ──────────────────────
  const chipStyle = (active) => ({
    padding: '7px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', lineHeight: 1,
    border: active ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
    backgroundColor: active ? DS.navy : DS.bgAlt,
    color: active ? 'white' : DS.muted,
  })

  const FSection = ({ sectionKey, label, children }) => {
    const isOpen = openSections[sectionKey]
    return (
      <div style={{ marginBottom: '4px', borderBottom: `1px solid ${DS.border}` }}>
        <button onClick={() => toggleSection(sectionKey)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={DS.muted} strokeWidth="2.2" strokeLinecap="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
            <polyline points="2,4 7,10 12,4"/>
          </svg>
        </button>
        {isOpen && <div style={{ paddingBottom: '16px' }}>{children}</div>}
      </div>
    )
  }

  const FilterContent = () => (
    <>
      <FSection sectionKey="continent" label={t('Continent', 'Continent')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CONTINENTS.map(c => (
            <button key={c} onClick={() => setActiveContinent(p => p === c ? 'all' : c)} style={chipStyle(activeContinent === c)}>
              {locale === 'fr' ? CONTINENT_FR[c] : c}
            </button>
          ))}
        </div>
      </FSection>
      <FSection sectionKey="country" label={t('Country', 'Pays')}>
        <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
          {countries.map(c => (
            <button key={c.slug} onClick={() => { setActiveCountry(p => p === c.slug ? 'all' : c.slug); setActiveRegion('all') }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '600', backgroundColor: activeCountry === c.slug ? DS.bgAlt : 'transparent', color: activeCountry === c.slug ? DS.navy : DS.muted, transition: 'background 0.12s' }}>
              {c.image_path && <img src={c.image_path} width="20" height="14" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none' }} />}
              {locale === 'fr' ? c.name_fr : c.name_en}
            </button>
          ))}
        </div>
      </FSection>
      {regions.length > 0 && (
        <FSection sectionKey="region" label={t('Region', 'Région')}>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
            {regions.map(r => (
              <button key={r.slug} onClick={() => setActiveRegion(p => p === r.slug ? 'all' : r.slug)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '600', backgroundColor: activeRegion === r.slug ? DS.bgAlt : 'transparent', color: activeRegion === r.slug ? DS.navy : DS.muted, transition: 'background 0.12s' }}>
                {locale === 'fr' ? r.name_fr : r.name_en}
              </button>
            ))}
          </div>
        </FSection>
      )}
      <FSection sectionKey="colors" label={t('Colors present', 'Couleurs présentes')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {COLOR_OPTIONS.map(col => {
            const active = activeColors.includes(col.key)
            return (
              <button key={col.key} onClick={() => toggle(activeColors, setActiveColors, col.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', border: active ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`, backgroundColor: active ? DS.navy : DS.bgAlt, color: active ? 'white' : DS.muted }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: col.hex, flexShrink: 0, border: col.border ? `1px solid ${DS.border}` : 'none' }} />
                {locale === 'fr' ? col.label.fr : col.label.en}
              </button>
            )
          })}
        </div>
      </FSection>
      <FSection sectionKey="symbols" label={t('Symbols', 'Symboles')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SYMBOL_OPTIONS.map(sy => (
            <button key={sy.key} onClick={() => toggle(activeSymbols, setActiveSymbols, sy.key)} style={chipStyle(activeSymbols.includes(sy.key))}>
              {locale === 'fr' ? sy.label.fr : sy.label.en}
            </button>
          ))}
        </div>
      </FSection>
      {ratioOptions.length > 0 && (
        <FSection sectionKey="ratio" label={t('Proportions', 'Proportions')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ratioOptions.map(r => (
              <button key={r.key} onClick={() => toggle(activeRatios, setActiveRatios, r.key)} style={chipStyle(activeRatios.includes(r.key))}>
                {r.label}
              </button>
            ))}
          </div>
        </FSection>
      )}
      <FSection sectionKey="shape" label={t('Shape', 'Forme')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SHAPE_OPTIONS.map(sh => (
            <button key={sh.key} onClick={() => toggle(activeShapes, setActiveShapes, sh.key)} style={chipStyle(activeShapes.includes(sh.key))}>
              {locale === 'fr' ? sh.label.fr : sh.label.en}
            </button>
          ))}
        </div>
      </FSection>
    </>
  )

  const grid = (cols) => (
    filtered.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '48px 0', color: DS.light }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
        <p style={{ fontSize: '15px', fontWeight: '600' }}>{t('No cities match your filters', 'Aucune ville ne correspond aux filtres')}</p>
      </div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: cols === 2 ? '12px' : '16px', alignItems: 'stretch', gridAutoRows: '1fr' }}>
        {filtered.map(flag => {
          const name = locale === 'fr' ? flag.name_fr : flag.name_en
          const regionName = flag.parent ? (locale === 'fr' ? flag.parent.name_fr : flag.parent.name_en) : null
          const countryName = flag.country ? (locale === 'fr' ? flag.country.name_fr : flag.country.name_en) : ''
          return <CityCard key={flag.slug} flag={flag} name={name} regionName={regionName} countryName={countryName} locale={locale} />
        })}
      </div>
    )
  )

  return (
    <>
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 32px' }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: DS.navy, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {t('City Flags', 'Drapeaux des villes')}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: DS.muted }}>
            {filtered.length} {t('cities', 'villes')}
          </p>
        </div>

        {isMobile && (
          <div>
            <div style={{ position: 'sticky', top: '60px', zIndex: 40, backgroundColor: DS.bg, paddingBottom: '12px', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DS.light} strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('Search a city…', 'Rechercher une ville…')}
                    style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '10px', border: `1.5px solid ${DS.border}`, backgroundColor: DS.surface, fontSize: '15px', color: DS.navy, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setFiltersOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px', borderRadius: '10px', border: hasFilters ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`, backgroundColor: hasFilters ? DS.navy : DS.surface, color: hasFilters ? 'white' : DS.muted, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '700' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
                  </svg>
                  {t('Filters', 'Filtres')}
                  {activeCount > 0 && (
                    <span style={{ backgroundColor: hasFilters ? 'rgba(255,255,255,0.25)' : DS.navy, color: 'white', borderRadius: '9999px', fontSize: '11px', fontWeight: '900', padding: '1px 6px' }}>
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '13px', color: DS.muted, fontWeight: '500' }}>
                  {filtered.length} {t('cities', 'villes')}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setSortOrder('az')} style={{ ...chipStyle(sortOrder === 'az'), padding: '5px 12px', fontSize: '12px' }}>A→Z</button>
                  <button onClick={() => setSortOrder('za')} style={{ ...chipStyle(sortOrder === 'za'), padding: '5px 12px', fontSize: '12px' }}>Z→A</button>
                </div>
              </div>
            </div>

            {filtersOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
                <div onClick={() => setFiltersOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(85vw, 360px)', backgroundColor: DS.surface, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(11,31,59,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: DS.navy }}>{t('Filters', 'Filtres')}</h2>
                      {hasFilters && <span style={{ backgroundColor: DS.navy, color: 'white', borderRadius: '9999px', fontSize: '11px', fontWeight: '900', padding: '2px 8px' }}>{activeCount}</span>}
                    </div>
                    <button onClick={() => setFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.muted, padding: '4px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                    <FilterContent />
                  </div>
                  <div style={{ padding: '16px 20px', borderTop: `1px solid ${DS.border}`, flexShrink: 0, display: 'flex', gap: '10px' }}>
                    {hasFilters && (
                      <button onClick={() => { clearAll(); setFiltersOpen(false) }}
                        style={{ flex: 1, padding: '13px', borderRadius: '10px', border: `1.5px solid ${DS.border}`, backgroundColor: 'transparent', color: DS.muted, fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                        {t('Clear all', 'Tout effacer')}
                      </button>
                    )}
                    <button onClick={() => setFiltersOpen(false)}
                      style={{ flex: 2, padding: '13px', borderRadius: '10px', border: 'none', backgroundColor: DS.navy, color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>
                      {t(`Show ${filtered.length} flags`, `Voir ${filtered.length} drapeaux`)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {grid(2)}
          </div>
        )}

        {!isMobile && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ width: 'min(340px, 100%)', flexShrink: 0, position: 'sticky', top: '76px', alignSelf: 'flex-start', backgroundColor: DS.surface, borderRadius: '14px', border: `1px solid ${DS.border}`, padding: '24px 20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: DS.navy, color: 'white', fontWeight: '900', fontSize: '20px', borderRadius: '10px', padding: '4px 14px', minWidth: '52px' }}>
                    {filtered.length}
                  </span>
                  <span style={{ fontSize: '13px', color: DS.muted, fontWeight: '500' }}>
                    {t('cities', 'villes')}
                  </span>
                </div>
                {hasFilters && (
                  <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: DS.muted, fontWeight: '600', textDecoration: 'underline' }}>
                    {t('Clear all', 'Tout effacer')}
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DS.light} strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t('Search…', 'Rechercher…')}
                  style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', border: `1.5px solid ${DS.border}`, backgroundColor: DS.bgAlt, fontSize: '14px', color: DS.navy, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                <button onClick={() => setSortOrder('az')} style={{ ...chipStyle(sortOrder === 'az'), padding: '6px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}>A→Z</button>
                <button onClick={() => setSortOrder('za')} style={{ ...chipStyle(sortOrder === 'za'), padding: '6px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}>Z→A</button>
              </div>

              <FilterContent />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {grid(4)}
            </div>
          </div>
        )}

      </div>
    </div>
    <Footer />
    </>
  )
}
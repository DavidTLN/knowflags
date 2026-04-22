'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

// ── Data ────────────────────────────────────────────────────────────────────
// colors: colors present on the flag
// symbols: notable symbols/patterns on the flag
// COUNTRIES loaded from Supabase

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }

const COLOR_OPTIONS = [
  { key: 'red',    label: { en: 'Red',    fr: 'Rouge'  }, hex: '#ef4444' },
  { key: 'blue',   label: { en: 'Blue',   fr: 'Bleu'   }, hex: '#3b82f6' },
  { key: 'green',  label: { en: 'Green',  fr: 'Vert'   }, hex: '#22c55e' },
  { key: 'yellow', label: { en: 'Yellow', fr: 'Jaune'  }, hex: '#eab308' },
  { key: 'white',  label: { en: 'White',  fr: 'Blanc'  }, hex: '#e5e7eb', border: true },
  { key: 'black',  label: { en: 'Black',  fr: 'Noir'   }, hex: '#1f2937' },
  { key: 'orange', label: { en: 'Orange', fr: 'Orange' }, hex: '#f97316' },
  { key: 'purple', label: { en: 'Purple', fr: 'Violet' }, hex: '#7c3aed' },
]

const SYMBOL_OPTIONS = [
  { key: 'Star',         label: { en: 'Star',              fr: 'Étoile'           } },
  { key: 'Cross',        label: { en: 'Cross',             fr: 'Croix'            } },
  { key: 'Crescent',     label: { en: 'Crescent',          fr: 'Croissant'        } },
  { key: 'Eagle',        label: { en: 'Eagle',             fr: 'Aigle'            } },
  { key: 'Bird',         label: { en: 'Bird',              fr: 'Oiseau'           } },
  { key: 'Sun',          label: { en: 'Sun',               fr: 'Soleil'           } },
  { key: 'Coat of arms', label: { en: 'Coat of Arms',      fr: 'Blason'           } },
  { key: 'Triangle',     label: { en: 'Triangle',          fr: 'Triangle'         } },
  { key: 'Dragon',       label: { en: 'Dragon',            fr: 'Dragon'           } },
  { key: 'Union Jack',   label: { en: 'Union Jack',        fr: 'Union Jack'       } },
  { key: 'Animals',      label: { en: 'Animals',           fr: 'Animaux'          } },
  { key: 'Tools',        label: { en: 'Tools',             fr: 'Outils'           } },
  { key: 'Map',          label: { en: 'Geographic Map',    fr: 'Carte géographique' } },
  { key: '__weapon',     label: { en: 'Any weapon',        fr: 'Arme (tout type)' }, special: 'weapon'  },
  { key: '__firearm',    label: { en: 'Firearm',           fr: 'Arme à feu'       }, special: 'firearm' },
  { key: '__blade',      label: { en: 'Blade weapon',      fr: 'Arme blanche'     }, special: 'blade'   },
]

const FIREARM_SYMBOLS = ['Gun', 'Rifle', 'Musket', 'Cannon', 'Firearms', 'Firearm']
const BLADE_SYMBOLS   = ['Sword', 'Dagger', 'Machete', 'Spear', 'Trident', 'Knife', 'Saber', 'Axe', 'Bayonet', 'Lance', 'Khanjar']
const ALL_WEAPON_SYMBOLS = [...FIREARM_SYMBOLS, ...BLADE_SYMBOLS]

function matchesSymbolFilter(country, key) {
  // Case-insensitive comparison
  const symbols = country.symbols.map(s => s.toLowerCase())
  if (key === '__weapon')  return country.has_weapons || symbols.some(s => ALL_WEAPON_SYMBOLS.some(w => s.includes(w.toLowerCase())))
  if (key === '__firearm') return country.has_firearm || symbols.some(s => FIREARM_SYMBOLS.some(w => s.includes(w.toLowerCase())))
  if (key === '__blade')   return country.has_blade   || symbols.some(s => BLADE_SYMBOLS.some(w => s.includes(w.toLowerCase())))
  return symbols.some(s => s.includes(key.toLowerCase()))
}

// RATIO_OPTIONS generated dynamically from Supabase data — see useMemo below

const SHAPE_OPTIONS = [
  { key: 'rectangle', label: { en: 'Rectangle', fr: 'Rectangle' } },
  { key: 'square',    label: { en: 'Square',    fr: 'Carré'     } },
  { key: 'pennant',   label: { en: 'Pennant',   fr: 'Pennon'    } },
]

export default function CountryListingPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('az') // az | za
  const [activeRegions, setActiveRegions] = useState([])
  const [activeColors, setActiveColors] = useState([])
  const [activeSymbols, setActiveSymbols] = useState([])
  const [activeRatios, setActiveRatios] = useState([])
  const [activeShapes, setActiveShapes] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openSections, setOpenSections] = useState({})
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  // Build ratio options dynamically from loaded countries
  const RATIO_OPTIONS = useMemo(() => {
    const seen = new Set()
    const opts = []
    // Sort by frequency (most common first), then alphabetically
    const freq = {}
    countries.forEach(c => { if (c.ratio) freq[c.ratio] = (freq[c.ratio] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    sorted.forEach(([ratio]) => {
      if (!seen.has(ratio)) {
        seen.add(ratio)
        const label = ratio === '1:1.618' ? `${ratio} (φ)` : ratio
        opts.push({ key: ratio, label: { en: label, fr: label } })
      }
    })
    return opts
  }, [countries])


  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr, region, colors, symbols, ratio, shape, has_weapons, has_blade, has_firearm')
      .order('name_en')
      .then(({ data }) => {
        if (data) setCountries(data.map(c => ({
          code: c.iso_code,
          en: c.name_en,
          fr: c.name_fr,
          region: c.region,
          colors: c.colors || [],
          symbols: c.symbols || [],
          ratio: c.ratio,
          shape: c.shape,
          has_weapons: c.has_weapons || false,
          has_blade:   c.has_blade   || false,
          has_firearm: c.has_firearm || false,
        })))
        setCountriesLoading(false)
      })
  }, [])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 1024) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  function toggle(arr, setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  const filtered = useMemo(() => {
    let list = [...countries]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c => getName(c).toLowerCase().includes(q))
    }
    if (activeRegions.length > 0) {
      list = list.filter(c => activeRegions.includes(c.region))
    }
    if (activeColors.length > 0) {
      list = list.filter(c => activeColors.every(col => 
        c.colors.map(x => x.toLowerCase()).includes(col.toLowerCase())
      ))
    }
    if (activeSymbols.length > 0) {
      list = list.filter(c => activeSymbols.every(sym => matchesSymbolFilter(c, sym)))
    }
    if (activeRatios.length > 0) {
      list = list.filter(c => activeRatios.includes(c.ratio))
    }
    if (activeShapes.length > 0) {
      list = list.filter(c => activeShapes.includes(c.shape))
    }

    list.sort((a, b) => {
      const na = getName(a); const nb = getName(b)
      return sortOrder === 'az' ? na.localeCompare(nb) : nb.localeCompare(na)
    })

    return list
  }, [countries, search, activeRegions, activeColors, activeSymbols, activeRatios, activeShapes, sortOrder, locale])

  const hasFilters = activeRegions.length > 0 || activeColors.length > 0 || activeSymbols.length > 0 || activeRatios.length > 0 || activeShapes.length > 0 || search

  function clearAll() {
    setSearch(''); setActiveRegions([]); setActiveColors([]); setActiveSymbols([]); setActiveRatios([]); setActiveShapes([])
  }

  const chipStyle = (active) => ({
    padding: '7px 14px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0',
    backgroundColor: active ? '#0B1F3B' : '#fafafa',
    color: active ? 'white' : '#475569',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  const FilterSection = ({ sectionKey, label, children }) => {
    const isOpen = openSections[sectionKey]
    return (
      <div style={{ marginBottom: '4px', borderBottom: '1px solid #f0f0f0' }}>
        <button
          onClick={() => toggleSection(sectionKey)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#0B1F3B' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {label}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="2,4 7,10 12,4"/>
          </svg>
        </button>
        {isOpen && (
          <div style={{ paddingBottom: '16px' }}>
            {children}
          </div>
        )}
      </div>
    )
  }


  if (countriesLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8278', fontSize: '16px' }}>{locale === 'fr' ? 'Chargement...' : 'Loading countries...'}</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 4px', letterSpacing: '-1px' }}>
            {t('Country Flags', 'Drapeaux des pays')}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            {countries.length} {t('countries', 'pays')}
          </p>
        </div>

        {/* ── MOBILE LAYOUT ───────────────────────────────────────────── */}
        {isMobile && (
          <div>

            {/* Sticky filter button */}
            <div style={{ position: 'sticky', top: '60px', zIndex: 40, backgroundColor: '#F4F1E6', paddingBottom: '12px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('Search a country…', 'Rechercher un pays…')}
                    style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '10px', border: '1.5px solid #ddd', backgroundColor: 'white', fontSize: '15px', color: '#0B1F3B', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setFiltersOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px', borderRadius: '10px', border: hasFilters ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: hasFilters ? '#0B1F3B' : 'white', color: hasFilters ? 'white' : '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', height: '46px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {t('Filters', 'Filtres')}
                  {hasFilters && (
                    <span style={{ backgroundColor: '#9EB7E5', color: '#0B1F3B', borderRadius: '99px', fontSize: '11px', fontWeight: '900', padding: '1px 7px' }}>
                      {[activeRegions, activeColors, activeSymbols, activeRatios, activeShapes].flat().length}
                    </span>
                  )}
                </button>
              </div>

              {/* Result count + sort inline */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  <span style={{ fontWeight: '900', color: '#0B1F3B' }}>{filtered.length}</span> {t('countries', 'pays')}
                  {hasFilters && (
                    <button onClick={clearAll} style={{ marginLeft: '10px', fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline', padding: 0 }}>
                      {t('Clear', 'Effacer')}
                    </button>
                  )}
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setSortOrder('az')} style={{ ...chipStyle(sortOrder === 'az'), padding: '5px 12px', fontSize: '12px' }}>A→Z</button>
                  <button onClick={() => setSortOrder('za')} style={{ ...chipStyle(sortOrder === 'za'), padding: '5px 12px', fontSize: '12px' }}>Z→A</button>
                </div>
              </div>
            </div>

            {/* Side panel overlay */}
            {filtersOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
                {/* Backdrop */}
                <div onClick={() => setFiltersOpen(false)}
                  style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />

                {/* Panel */}
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(85vw, 360px)', backgroundColor: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.18)' }}>

                  {/* Panel header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1F3B' }}>
                        {t('Filters', 'Filtres')}
                      </h2>
                      {hasFilters && (
                        <span style={{ backgroundColor: '#0B1F3B', color: 'white', borderRadius: '99px', fontSize: '11px', fontWeight: '900', padding: '2px 8px' }}>
                          {[activeRegions, activeColors, activeSymbols, activeRatios, activeShapes].flat().length}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setFiltersOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="3" x2="17" y2="17"/><line x1="17" y1="3" x2="3" y2="17"/>
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable filter content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

                    {/* Regions */}
                    <FilterSection sectionKey="region" label={t('Region', 'Région')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {REGIONS.map(r => (
                          <button key={r} onClick={() => toggle(activeRegions, setActiveRegions, r)} style={chipStyle(activeRegions.includes(r))}>
                            {locale === 'fr' ? REGION_LABELS[r] : r}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Colors */}
                    <FilterSection sectionKey="colors" label={t('Colors present', 'Couleurs présentes')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {COLOR_OPTIONS.map(c => {
                          const active = activeColors.includes(c.key)
                          return (
                            <button key={c.key} onClick={() => toggle(activeColors, setActiveColors, c.key)}
                              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : '#fafafa', color: active ? 'white' : '#475569', transition: 'all 0.15s' }}>
                              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, flexShrink: 0, border: c.border ? '1px solid #ccc' : 'none' }} />
                              {c.label[locale] || c.label.en}
                            </button>
                          )
                        })}
                      </div>
                    </FilterSection>

                    {/* Symbols */}
                    <FilterSection sectionKey="symbols" label={t('Symbols', 'Symboles')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {SYMBOL_OPTIONS.map(s => (
                          <button key={s.key} onClick={() => toggle(activeSymbols, setActiveSymbols, s.key)} style={chipStyle(activeSymbols.includes(s.key))}>
                            {s.label[locale] || s.label.en}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Ratio */}
                    <FilterSection sectionKey="ratio" label={t('Ratio', 'Ratio')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {RATIO_OPTIONS.map(r => {
                          const active = activeRatios.includes(r.key)
                          const parts = r.key.replace(' (Pennant)','').replace(' (Pennon)','').split(':')
                          const rw = parseFloat(parts[1]); const rh = parseFloat(parts[0])
                          const maxDim = 40
                          const svgW = Math.round(maxDim * (rw / Math.max(rw, rh)))
                          const svgH = Math.round(maxDim * (rh / Math.max(rw, rh)))
                          const isPennant = r.key.includes('4:3')
                          return (
                            <button key={r.key} onClick={() => toggle(activeRatios, setActiveRatios, r.key)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '52px' }}>
                              <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ display: 'block' }}>
                                {isPennant
                                  ? <polygon points={`1,1 1,${svgH-1} ${svgW-1},${Math.round(svgH/2)}`} fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2" strokeLinejoin="round"/>
                                  : <rect x="0.5" y="0.5" width={svgW-1} height={svgH-1} rx="1.5" fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2"/>
                                }
                              </svg>
                              {r.label[locale] || r.label.en}
                            </button>
                          )
                        })}
                      </div>
                    </FilterSection>

                    {/* Shape */}
                    <FilterSection sectionKey="shape" label={t('Shape', 'Forme')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {SHAPE_OPTIONS.map(s => {
                          const active = activeShapes.includes(s.key)
                          const fill = active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'
                          const stroke = active ? 'rgba(255,255,255,0.8)' : '#94a3b8'
                          const shapeIcon = {
                            rectangle: <svg viewBox="0 0 36 24" width="36" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="35" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                            square:    <svg viewBox="0 0 24 24" width="24" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="23" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                            pennant:   <svg viewBox="0 0 36 28" width="36" height="28" style={{display:'block'}}><polygon points="1,1 1,27 35,14" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/></svg>,
                          }[s.key]
                          return (
                            <button key={s.key} onClick={() => toggle(activeShapes, setActiveShapes, s.key)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '64px' }}>
                              {shapeIcon}
                              {s.label[locale] || s.label.en}
                            </button>
                          )
                        })}
                      </div>
                    </FilterSection>

                  </div>

                  {/* Sticky bottom Apply button */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', flexShrink: 0, backgroundColor: 'white' }}>
                    {hasFilters && (
                      <button onClick={clearAll}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                        </svg>
                        {t('Clear filters', 'Effacer les filtres')}
                      </button>
                    )}
                    <button onClick={() => setFiltersOpen(false)}
                      style={{ width: '100%', padding: '14px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>
                      {t('Apply', 'Appliquer')} — {filtered.length} {filtered.length === 1 ? t('country', 'pays') : t('countries', 'pays')}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Mobile grid — 2 columns */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                <p style={{ fontSize: '15px', fontWeight: '600' }}>{t('No countries match', 'Aucun pays ne correspond')}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filtered.map(country => (
                  <a key={country.code} href={`/${locale}/countries/${country.code}`}
                    style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ aspectRatio: '3/2', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`https://flagcdn.com/w160/${country.code}.png`} alt={getName(country)} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '5px' }} />
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(country)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>{locale === 'fr' ? REGION_LABELS[country.region] : country.region}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

          </div>
        )}


        {/* ── DESKTOP LAYOUT ──────────────────────────────────────────── */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

            <div style={{ width: 'min(340px, 100%)', flexShrink: 0, position: 'sticky', top: '76px', alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>

              {/* Results + Clear */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1F3B', color: 'white', fontWeight: '900', fontSize: '20px', borderRadius: '10px', padding: '4px 14px', letterSpacing: '-0.5px', minWidth: '52px' }}>
                    {filtered.length}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    {filtered.length === 1 ? t('country', 'pays') : t('countries', 'pays')}
                  </span>
                </div>
                {hasFilters && (
                  <button onClick={clearAll}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/>
                    </svg>
                    {t('Clear', 'Effacer')}
                  </button>
                )}
              </div>

              {/* Regions */}
              <FilterSection sectionKey="region" label={t('Region', 'Région')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => toggle(activeRegions, setActiveRegions, r)} style={chipStyle(activeRegions.includes(r))}>
                      {locale === 'fr' ? REGION_LABELS[r] : r}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Colors */}
              <FilterSection sectionKey="colors" label={t('Colors present', 'Couleurs présentes')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COLOR_OPTIONS.map(c => {
                    const active = activeColors.includes(c.key)
                    return (
                      <button key={c.key} onClick={() => toggle(activeColors, setActiveColors, c.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : '#fafafa', color: active ? 'white' : '#475569', transition: 'all 0.15s' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, flexShrink: 0, border: c.border ? '1px solid #ccc' : 'none' }} />
                        {c.label[locale] || c.label.en}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Symbols */}
              <FilterSection sectionKey="symbols" label={t('Symbols', 'Symboles')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SYMBOL_OPTIONS.map(s => (
                    <button key={s.key} onClick={() => toggle(activeSymbols, setActiveSymbols, s.key)} style={chipStyle(activeSymbols.includes(s.key))}>
                      {s.label[locale] || s.label.en}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Ratio */}
              <FilterSection sectionKey="ratio" label={t('Ratio', 'Ratio')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {RATIO_OPTIONS.map(r => {
                    const active = activeRatios.includes(r.key)
                    const parts = r.key.replace(' (Pennant)','').replace(' (Pennon)','').split(':')
                    const rw = parseFloat(parts[1]); const rh = parseFloat(parts[0])
                    const maxDim = 40
                    const svgW = Math.round(maxDim * (rw / Math.max(rw, rh)))
                    const svgH = Math.round(maxDim * (rh / Math.max(rw, rh)))
                    const isPennant = r.key.includes('4:3')
                    return (
                      <button key={r.key} onClick={() => toggle(activeRatios, setActiveRatios, r.key)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '52px' }}>
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ display: 'block' }}>
                          {isPennant
                            ? <polygon points={`1,1 1,${svgH-1} ${svgW-1},${Math.round(svgH/2)}`} fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2" strokeLinejoin="round"/>
                            : <rect x="0.5" y="0.5" width={svgW-1} height={svgH-1} rx="1.5" fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2"/>
                          }
                        </svg>
                        {r.label[locale] || r.label.en}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Shape */}
              <FilterSection sectionKey="shape" label={t('Shape', 'Forme')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SHAPE_OPTIONS.map(s => {
                    const active = activeShapes.includes(s.key)
                    const fill = active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'
                    const stroke = active ? 'rgba(255,255,255,0.8)' : '#94a3b8'
                    const shapeIcon = {
                      rectangle: <svg viewBox="0 0 36 24" width="36" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="35" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                      square:    <svg viewBox="0 0 24 24" width="24" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="23" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                      pennant:   <svg viewBox="0 0 36 28" width="36" height="28" style={{display:'block'}}><polygon points="1,1 1,27 35,14" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/></svg>,
                    }[s.key]
                    return (
                      <button key={s.key} onClick={() => toggle(activeShapes, setActiveShapes, s.key)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '64px' }}>
                        {shapeIcon}
                        {s.label[locale] || s.label.en}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

            </div>

            {/* Right column */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Search + sort */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('Search a country…', 'Rechercher un pays…')}
                    style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: '10px', border: '1.5px solid #ddd', backgroundColor: 'white', fontSize: '15px', color: '#0B1F3B', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setSortOrder('az')} style={chipStyle(sortOrder === 'az')}>A → Z</button>
                  <button onClick={() => setSortOrder('za')} style={chipStyle(sortOrder === 'za')}>Z → A</button>
                </div>
              </div>

              {/* Grid — 4 cols */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{t('No countries match your filters', 'Aucun pays ne correspond aux filtres')}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {filtered.map(country => (
                    <Link key={country.code} href={`/${locale}/countries/${country.code}`}
                      style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={`https://flagcdn.com/w320/${country.code}.png`}
                          alt={getName(country)}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }}
                        />
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getName(country)}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                          {locale === 'fr' ? REGION_LABELS[country.region] : country.region}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  )
}
'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import FlagImage from '@/components/FlagImage'

const CONTINENTS = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania']
const CONTINENT_FR = { Europe: 'Europe', 'North America': 'Amerique du Nord', 'South America': 'Amerique du Sud', Asia: 'Asie', Africa: 'Afrique', Oceania: 'Oceanie' }

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
  { key: 'cross',       label: { en: 'Cross',        fr: 'Croix'      } },
  { key: 'star',        label: { en: 'Star',          fr: 'Etoile'     } },
  { key: 'sun',         label: { en: 'Sun',           fr: 'Soleil'     } },
  { key: 'crescent',    label: { en: 'Crescent',      fr: 'Croissant'  } },
  { key: 'eagle',       label: { en: 'Eagle',         fr: 'Aigle'      } },
  { key: 'lion',        label: { en: 'Lion',          fr: 'Lion'       } },
  { key: 'bear',        label: { en: 'Bear',          fr: 'Ours'       } },
  { key: 'coat_of_arms',label: { en: 'Coat of Arms',  fr: 'Blason'     } },
  { key: 'stripes',     label: { en: 'Stripes',       fr: 'Rayures'    } },
  { key: 'weapon',      label: { en: 'Weapon',        fr: 'Arme'       } },
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

function FlagCard({ flag, name, parentName }) {
  return (
    <div
      style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FlagImage slug={flag.slug} prefix="/flags/regions" name={name} acronym={flag.metadata && flag.metadata.abbr} color="#0B1F3B" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
      </div>
      <div style={{ padding: '12px 14px' }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        {parentName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            {flag.parent && flag.parent.image_path && (
              <img src={flag.parent.image_path} width="14" height="10" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{parentName}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RegionsPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [flags, setFlags]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openSections, setOpenSections] = useState({ continent: false, country: false, colors: false, symbols: false, ratio: false, shape: false })

  const [search, setSearch]                   = useState('')
  const [activeCountry, setActiveCountry]     = useState('all')
  const [activeContinent, setActiveContinent] = useState('all')
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

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('flag_taxonomy')
      .select('id, slug, name_en, name_fr, image_path, sort_order, metadata, parent:parent_id(id, slug, name_en, name_fr, image_path, metadata)')
      .eq('flag_type', 'region')
      .order('sort_order')
      .then(({ data }) => { setFlags(data || []); setLoading(false) })
  }, [])

  const countries = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const f of flags) {
      if (f.parent && !seen.has(f.parent.slug)) {
        seen.add(f.parent.slug)
        result.push(f.parent)
      }
    }
    return result.sort((a, b) => {
      const na = locale === 'fr' ? a.name_fr : a.name_en
      const nb = locale === 'fr' ? b.name_fr : b.name_en
      return na.localeCompare(nb)
    })
  }, [flags, locale])

  const ratioOptions = useMemo(() => {
    const freq = {}
    flags.forEach(f => {
      const r = f.metadata && f.metadata.ratio
      if (r) freq[r] = (freq[r] || 0) + 1
    })
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([r]) => ({ key: r, label: r }))
  }, [flags])

  const filtered = useMemo(() => {
    let list = [...flags]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(f => (locale === 'fr' ? f.name_fr : f.name_en).toLowerCase().includes(q))
    if (activeContinent !== 'all') list = list.filter(f => f.parent && f.parent.metadata && f.parent.metadata.continent === activeContinent)
    if (activeCountry !== 'all') list = list.filter(f => f.parent && f.parent.slug === activeCountry)
    if (activeColors.length > 0) list = list.filter(f => activeColors.every(c => ((f.metadata && f.metadata.colors) || []).includes(c)))
    if (activeSymbols.length > 0) list = list.filter(f => activeSymbols.every(s => ((f.metadata && f.metadata.symbols) || []).includes(s)))
    if (activeRatios.length > 0) list = list.filter(f => activeRatios.includes(f.metadata && f.metadata.ratio))
    if (activeShapes.length > 0) list = list.filter(f => activeShapes.includes(f.metadata && f.metadata.shape))
    return list
  }, [flags, search, activeContinent, activeCountry, activeColors, activeSymbols, activeRatios, activeShapes, locale])

  const hasFilters = !!(search || activeContinent !== 'all' || activeCountry !== 'all' || activeColors.length || activeSymbols.length || activeRatios.length || activeShapes.length)

  const activeCount = [
    search ? 1 : 0,
    activeContinent !== 'all' ? 1 : 0,
    activeCountry !== 'all' ? 1 : 0,
    activeColors.length, activeSymbols.length, activeRatios.length, activeShapes.length,
  ].reduce((a, b) => a + b, 0)

  function clearAll() {
    setSearch(''); setActiveContinent('all'); setActiveCountry('all')
    setActiveColors([]); setActiveSymbols([]); setActiveRatios([]); setActiveShapes([])
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', paddingTop: '60px', fontFamily: 'var(--font-body)' }}>

      <div style={{ backgroundColor: '#0B1F3B', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <Link href={"/" + locale + "/countries"} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{t('Flags', 'Drapeaux')}</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{">"}</span>
            <span style={{ fontSize: '13px', color: '#9EB7E5', fontWeight: '600' }}>{t('Regions', 'Regions')}</span>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'var(--font-display)' }}>
            {t('Regional Flags', 'Drapeaux des Regions')}
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            {t('Flags of states, provinces, cantons and regions around the world.', 'Drapeaux des etats, provinces, cantons et regions du monde entier.')}
          </p>
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#9EB7E5' }}>{filtered.length}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('Regions', 'Regions')}{hasFilters ? ' ' + t('matching', 'correspondantes') : ''}
            </span>
            {hasFilters && (
              <button onClick={clearAll} style={{ fontSize: '12px', color: '#9EB7E5', background: 'none', border: '1px solid rgba(158,183,229,0.3)', borderRadius: '99px', padding: '3px 10px', cursor: 'pointer', fontWeight: '600' }}>
                {t('Clear filters', 'Effacer les filtres')}
              </button>
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2DDD5', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setFiltersOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            {t('Filters', 'Filtres')}
            {activeCount > 0 && <span style={{ backgroundColor: '#9EB7E5', color: '#0B1F3B', borderRadius: '99px', padding: '1px 7px', fontSize: '11px', fontWeight: '800' }}>{activeCount}</span>}
          </button>
          <span style={{ fontSize: '13px', color: '#8A8278' }}>{filtered.length} {t('results', 'resultats')}</span>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

        {(!isMobile || filtersOpen) && (
          <aside style={{ width: isMobile ? '100%' : 'min(340px, 100%)', flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: '76px', alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1F3B', color: 'white', fontWeight: '900', fontSize: '20px', borderRadius: '10px', padding: '4px 14px', letterSpacing: '-0.5px', minWidth: '52px' }}>
                  {filtered.length}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{t('results', 'résultats')}</span>
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

            <div style={{ marginBottom: '16px' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('Search regions...', 'Rechercher...')}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #ddd', backgroundColor: 'white', fontSize: '15px', color: '#0B1F3B', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <FilterSection title={t('Continent', 'Continent')} open={openSections.continent} onToggle={() => toggleSection('continent')}>
              {CONTINENTS.map(c => (
                <FilterChip key={c} active={activeContinent === c} onClick={() => setActiveContinent(p => p === c ? 'all' : c)}>
                  {locale === 'fr' ? CONTINENT_FR[c] : c}
                </FilterChip>
              ))}
            </FilterSection>

            <FilterSection title={t('Country', 'Pays')} open={openSections.country} onToggle={() => toggleSection('country')}>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                {countries.map(c => (
                  <button key={c.slug} onClick={() => setActiveCountry(p => p === c.slug ? 'all' : c.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '600', backgroundColor: activeCountry === c.slug ? '#EEF4FF' : 'transparent', color: activeCountry === c.slug ? '#0B1F3B' : '#555', transition: 'background 0.12s' }}>
                    {c.image_path && <img src={c.image_path} width="20" height="14" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />}
                    {locale === 'fr' ? c.name_fr : c.name_en}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title={t('Colors', 'Couleurs')} open={openSections.colors} onToggle={() => toggleSection('colors')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COLOR_OPTIONS.map(col => (
                  <button key={col.key} onClick={() => toggle(activeColors, setActiveColors, col.key)}
                    title={locale === 'fr' ? col.label.fr : col.label.en}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: col.hex, border: activeColors.includes(col.key) ? '3px solid #0B1F3B' : col.border ? '1.5px solid #E2DDD5' : '2px solid transparent', cursor: 'pointer', outline: activeColors.includes(col.key) ? '2px solid #9EB7E5' : 'none', outlineOffset: '1px', transition: 'all 0.12s' }} />
                ))}
              </div>
            </FilterSection>

            <FilterSection title={t('Symbols', 'Symboles')} open={openSections.symbols} onToggle={() => toggleSection('symbols')}>
              {SYMBOL_OPTIONS.map(s => (
                <FilterChip key={s.key} active={activeSymbols.includes(s.key)} onClick={() => toggle(activeSymbols, setActiveSymbols, s.key)}>
                  {locale === 'fr' ? s.label.fr : s.label.en}
                </FilterChip>
              ))}
            </FilterSection>

            {ratioOptions.length > 0 && (
              <FilterSection title={t('Ratio', 'Ratio')} open={openSections.ratio} onToggle={() => toggleSection('ratio')}>
                {ratioOptions.map(r => (
                  <FilterChip key={r.key} active={activeRatios.includes(r.key)} onClick={() => toggle(activeRatios, setActiveRatios, r.key)}>
                    {r.label}
                  </FilterChip>
                ))}
              </FilterSection>
            )}

            <FilterSection title={t('Shape', 'Forme')} open={openSections.shape} onToggle={() => toggleSection('shape')}>
              {SHAPE_OPTIONS.map(s => (
                <FilterChip key={s.key} active={activeShapes.includes(s.key)} onClick={() => toggle(activeShapes, setActiveShapes, s.key)}>
                  {locale === 'fr' ? s.label.fr : s.label.en}
                </FilterChip>
              ))}
            </FilterSection>
          </aside>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '80px 0', fontSize: '15px' }}>{t('Loading...', 'Chargement...')}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
              <p style={{ color: '#8A8278', fontSize: '15px', fontWeight: '600' }}>{t('No regions match your filters.', 'Aucune region ne correspond a vos filtres.')}</p>
              <button onClick={clearAll} style={{ marginTop: '12px', padding: '8px 20px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                {t('Clear filters', 'Effacer les filtres')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px' }}>
              {filtered.map(flag => {
                const name = locale === 'fr' ? flag.name_fr : flag.name_en
                const parentName = flag.parent ? (locale === 'fr' ? flag.parent.name_fr : flag.parent.name_en) : null
                return <FlagCard key={flag.slug} flag={flag} name={name} parentName={parentName} />
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
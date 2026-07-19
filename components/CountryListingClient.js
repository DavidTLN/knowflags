'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import Footer from '@/components/Footer'

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
}

// ── Ratios ────────────────────────────────────────────────────────────────────
// A country can have several official ratios (e.g. Argentina: 5:8 and 9:14).
// `ratios` (array) wins when present; `ratio` stays the primary/legacy value.
export function getRatios(c) {
  if (!c) return []
  if (Array.isArray(c.ratios) && c.ratios.length) return c.ratios.filter(Boolean)
  return c.ratio ? [c.ratio] : []
}

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }

const CONTINENT_OPTIONS = [
  { key: 'europe',           label: { en: 'Europe',          fr: 'Europe'            } },
  { key: 'africa',           label: { en: 'Africa',          fr: 'Afrique'           } },
  { key: 'asia',             label: { en: 'Asia',            fr: 'Asie'              } },
  { key: 'north-americas',   label: { en: 'North America',   fr: 'Amérique du Nord'  } },
  { key: 'central-americas', label: { en: 'Central America', fr: 'Amérique centrale' } },
  { key: 'south-americas',   label: { en: 'South America',   fr: 'Amérique du Sud'   } },
  { key: 'oceania',          label: { en: 'Oceania',         fr: 'Océanie'           } },
]

const REGION_TO_CONTINENT = {
  'Africa': 'africa', 'Americas': 'north-americas',
  'Asia': 'asia', 'Europe': 'europe', 'Oceania': 'oceania',
}

const COUNTRY_CONTINENT = {
  ad: 'europe', ae: 'asia', af: 'asia', ag: 'central-americas', al: 'europe', am: 'asia', ao: 'africa', ar: 'south-americas', at: 'europe', au: 'oceania', az: 'asia', ba: 'europe', bb: 'central-americas', bd: 'asia', be: 'europe', bf: 'africa', bg: 'europe', bh: 'asia', bi: 'africa', bj: 'africa', bn: 'asia', bo: 'south-americas', br: 'south-americas', bs: 'central-americas', bt: 'asia', bw: 'africa', by: 'europe', bz: 'central-americas', ca: 'north-americas', cd: 'africa', cf: 'africa', cg: 'africa', ch: 'europe', ci: 'africa', cl: 'south-americas', cm: 'africa', cn: 'asia', co: 'south-americas', cr: 'central-americas', cu: 'central-americas', cv: 'africa', cy: 'europe', cz: 'europe', de: 'europe', dj: 'africa', dk: 'europe', dm: 'central-americas', do: 'central-americas', dz: 'africa', ec: 'south-americas', ee: 'europe', eg: 'africa', er: 'africa', es: 'europe', et: 'africa', fi: 'europe', fj: 'oceania', fm: 'oceania', fr: 'europe', ga: 'africa', gb: 'europe', gd: 'central-americas', ge: 'asia', gh: 'africa', gl: 'north-americas', gm: 'africa', gn: 'africa', gq: 'africa', gr: 'europe', gt: 'central-americas', gw: 'africa', gy: 'south-americas', hn: 'central-americas', hr: 'europe', ht: 'central-americas', hu: 'europe', id: 'asia', ie: 'europe', il: 'asia', in: 'asia', iq: 'asia', ir: 'asia', is: 'europe', it: 'europe', jm: 'central-americas', jo: 'asia', jp: 'asia', ke: 'africa', kg: 'asia', kh: 'asia', ki: 'oceania', km: 'africa', kn: 'central-americas', kp: 'asia', kr: 'asia', kw: 'asia', kz: 'asia', la: 'asia', lb: 'asia', lc: 'central-americas', li: 'europe', lk: 'asia', lr: 'africa', ls: 'africa', lt: 'europe', lu: 'europe', lv: 'europe', ly: 'africa', ma: 'africa', mc: 'europe', md: 'europe', me: 'europe', mg: 'africa', mh: 'oceania', mk: 'europe', ml: 'africa', mm: 'asia', mn: 'asia', mr: 'africa', mt: 'europe', mu: 'africa', mv: 'asia', mw: 'africa', mx: 'north-americas', my: 'asia', mz: 'africa', na: 'africa', ne: 'africa', ng: 'africa', ni: 'central-americas', nl: 'europe', no: 'europe', np: 'asia', nr: 'oceania', nz: 'oceania', om: 'asia', pa: 'central-americas', pe: 'south-americas', pg: 'oceania', ph: 'asia', pk: 'asia', pl: 'europe', ps: 'asia', pt: 'europe', pw: 'oceania', py: 'south-americas', qa: 'asia', ro: 'europe', rs: 'europe', ru: 'europe', rw: 'africa', sa: 'asia', sb: 'oceania', sc: 'africa', sd: 'africa', se: 'europe', sg: 'asia', si: 'europe', sk: 'europe', sl: 'africa', sm: 'europe', sn: 'africa', so: 'africa', sr: 'south-americas', ss: 'africa', st: 'africa', sv: 'central-americas', sy: 'asia', sz: 'africa', td: 'africa', tg: 'africa', th: 'asia', tj: 'asia', tl: 'asia', tm: 'asia', tn: 'africa', to: 'oceania', tr: 'asia', tt: 'central-americas', tv: 'oceania', tw: 'asia', tz: 'africa', ua: 'europe', ug: 'africa', us: 'north-americas', uy: 'south-americas', uz: 'asia', va: 'europe', vc: 'central-americas', ve: 'south-americas', vn: 'asia', vu: 'oceania', ws: 'oceania', xk: 'europe', ye: 'asia', za: 'africa', zm: 'africa', zw: 'africa'
}


const COLOR_OPTIONS = [
  { key: 'red',    label: { en: 'Red',    fr: 'Rouge'  }, hex: '#ef4444' },
  { key: 'blue',   label: { en: 'Blue',   fr: 'Bleu'   }, hex: '#3b82f6' },
  { key: 'green',  label: { en: 'Green',  fr: 'Vert'   }, hex: '#22c55e' },
  { key: 'yellow', label: { en: 'Yellow', fr: 'Jaune'  }, hex: '#eab308' },
  { key: 'white',  label: { en: 'White',  fr: 'Blanc'  }, hex: '#E2DDD5', border: true },
  { key: 'black',  label: { en: 'Black',  fr: 'Noir'   }, hex: '#1f2937' },
  { key: 'orange', label: { en: 'Orange', fr: 'Orange' }, hex: '#f97316' },
  { key: 'purple', label: { en: 'Purple', fr: 'Violet' }, hex: '#7c3aed' },
]

const SYMBOL_OPTIONS = [
  { key: 'Star',         label: { en: 'Star',           fr: 'Étoile'             } },
  { key: 'Cross',        label: { en: 'Cross',          fr: 'Croix'              } },
  { key: 'Crescent',     label: { en: 'Crescent',       fr: 'Croissant'          } },
  { key: 'Eagle',        label: { en: 'Eagle',          fr: 'Aigle'              } },
  { key: 'Bird',         label: { en: 'Bird',           fr: 'Oiseau'             } },
  { key: 'Sun',          label: { en: 'Sun',            fr: 'Soleil'             } },
  { key: 'Coat of arms', label: { en: 'Coat of Arms',   fr: 'Blason'             } },
  { key: 'Triangle',     label: { en: 'Triangle',       fr: 'Triangle'           } },
  { key: 'Dragon',       label: { en: 'Dragon',         fr: 'Dragon'             } },
  { key: 'Union Jack',   label: { en: 'Union Jack',     fr: 'Union Jack'         } },
  { key: 'Animals',      label: { en: 'Animals',        fr: 'Animaux'            } },
  { key: 'Tools',        label: { en: 'Tools',          fr: 'Outils'             } },
  { key: 'Map',          label: { en: 'Geographic Map', fr: 'Carte géographique' } },
  { key: '__weapon',     label: { en: 'Any weapon',     fr: 'Arme (tout type)'   }, special: 'weapon'  },
  { key: '__firearm',    label: { en: 'Firearm',        fr: 'Arme à feu'         }, special: 'firearm' },
  { key: '__blade',      label: { en: 'Blade weapon',   fr: 'Arme blanche'       }, special: 'blade'   },
]

const FIREARM_SYMBOLS    = ['Gun', 'Rifle', 'Musket', 'Cannon', 'Firearms', 'Firearm']
const BLADE_SYMBOLS      = ['Sword', 'Dagger', 'Machete', 'Spear', 'Trident', 'Knife', 'Saber', 'Axe', 'Bayonet', 'Lance', 'Khanjar']
const ALL_WEAPON_SYMBOLS = [...FIREARM_SYMBOLS, ...BLADE_SYMBOLS]

function matchesSymbolFilter(country, key) {
  const symbols = country.symbols.map(s => s.toLowerCase())
  if (key === '__weapon')  return country.has_weapons || symbols.some(s => ALL_WEAPON_SYMBOLS.some(w => s.includes(w.toLowerCase())))
  if (key === '__firearm') return country.has_firearm || symbols.some(s => FIREARM_SYMBOLS.some(w => s.includes(w.toLowerCase())))
  if (key === '__blade')   return country.has_blade   || symbols.some(s => BLADE_SYMBOLS.some(w => s.includes(w.toLowerCase())))
  return symbols.some(s => s.includes(key.toLowerCase()))
}

const SHAPE_OPTIONS = [
  { key: 'rectangle', label: { en: 'Rectangle', fr: 'Rectangle' } },
  { key: 'square',    label: { en: 'Square',    fr: 'Carré'     } },
  { key: 'pennant',   label: { en: 'Pennant',   fr: 'Pennon'    } },
]

// ── Calendar icon SVG ─────────────────────────────────────────────────────────
const CalIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

export default function CountryListingClient({ rows = [] }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  // Rows come from the server (already in the initial HTML); shape them here.
  const countries = useMemo(() => (rows || []).map(c => ({
    code: c.iso_code, en: c.name_en, fr: c.name_fr, region: c.region,
    continent: COUNTRY_CONTINENT[c.iso_code?.toLowerCase()] || REGION_TO_CONTINENT[c.region] || c.region?.toLowerCase() || '',
    colors: c.colors || [], symbols: c.symbols || [],
    ratio: c.ratio, ratios: c.ratios || null, shape: c.shape,
    has_weapons: c.has_weapons || false, has_blade: c.has_blade || false, has_firearm: c.has_firearm || false,
    adopted_year: c.adopted_year ?? null,
    last_flag_change: c.last_flag_change || null,
    flagUrl: c.flag_url || null,
    entityType: c.entity_type || 'sovereign',
  })), [rows])

  const [search, setSearch]                     = useState('')
  const [sortOrder, setSortOrder]               = useState('az')
  const [activeRegions, setActiveRegions]       = useState([])
  const [activeColors, setActiveColors]         = useState([])
  const [activeSymbols, setActiveSymbols]       = useState([])
  const [activeRatios, setActiveRatios]         = useState([])
  const [activeShapes, setActiveShapes]         = useState([])
  const [activeContinents, setActiveContinents] = useState([])
  const [isMobile, setIsMobile]                 = useState(false)
  const [filtersOpen, setFiltersOpen]           = useState(false)
  const [openSections, setOpenSections]         = useState({})
  const [entityView, setEntityView]             = useState('sovereign')

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  // Every distinct ratio across all countries — a country with two official
  // ratios (e.g. Argentina) counts towards both options.
  const RATIO_OPTIONS = useMemo(() => {
    const seen = new Set(); const opts = []; const freq = {}
    countries.forEach(c => getRatios(c).forEach(r => { freq[r] = (freq[r] || 0) + 1 }))
    Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([ratio]) => {
      if (!seen.has(ratio)) {
        seen.add(ratio)
        opts.push({ key: ratio, label: { en: ratio === '1:1.618' ? `${ratio} (φ)` : ratio, fr: ratio === '1:1.618' ? `${ratio} (φ)` : ratio } })
      }
    })
    return opts
  }, [countries])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 1024) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('type')
    setEntityView(p === 'territories' ? 'territories' : 'sovereign')
  }, [])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  function toggle(arr, setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  const filtered = useMemo(() => {
    let list = countries.filter(c => entityView === 'territories'
      ? (c.entityType && c.entityType !== 'sovereign')
      : (!c.entityType || c.entityType === 'sovereign'))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c => getName(c).toLowerCase().includes(q))
    }
    if (activeContinents.length > 0) list = list.filter(c => activeContinents.includes(c.continent))
    if (activeRegions.length > 0)    list = list.filter(c => activeRegions.includes(c.region))
    if (activeColors.length > 0)     list = list.filter(c => activeColors.every(col => c.colors.map(x => x.toLowerCase()).includes(col.toLowerCase())))
    if (activeSymbols.length > 0)    list = list.filter(c => activeSymbols.every(sym => matchesSymbolFilter(c, sym)))
    // A country matches if ANY of its official ratios is selected
    if (activeRatios.length > 0)     list = list.filter(c => getRatios(c).some(r => activeRatios.includes(r)))
    if (activeShapes.length > 0)     list = list.filter(c => activeShapes.includes(c.shape))
    list.sort((a, b) => {
      const na = getName(a), nb = getName(b)
      return sortOrder === 'az' ? na.localeCompare(nb) : nb.localeCompare(na)
    })
    return list
  }, [countries, entityView, search, activeContinents, activeRegions, activeColors, activeSymbols, activeRatios, activeShapes, sortOrder, locale])

  const hasFilters = activeContinents.length > 0 || activeRegions.length > 0 || activeColors.length > 0 || activeSymbols.length > 0 || activeRatios.length > 0 || activeShapes.length > 0 || !!search
  const activeFilterCount = [activeContinents, activeRegions, activeColors, activeSymbols, activeRatios, activeShapes].flat().length

  function clearAll() {
    setSearch(''); setActiveContinents([]); setActiveRegions([]); setActiveColors([]); setActiveSymbols([]); setActiveRatios([]); setActiveShapes([])
  }

  // ── Chip helper ───────────────────────────────────────────────────────────
  const chipStyle = (active) => ({
    padding: '7px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', lineHeight: 1,
    border: active ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
    backgroundColor: active ? DS.navy : DS.bgAlt,
    color: active ? 'white' : DS.muted,
  })

  // ── Filter accordion section ──────────────────────────────────────────────
  const FilterSection = ({ sectionKey, label, children }) => {
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

  // ── Country tile ──────────────────────────────────────────────────────────
  const CountryTile = ({ country, desktop }) => {
    const name = getName(country)
    const flagSince = country.adopted_year || (country.last_flag_change ? new Date(country.last_flag_change).getFullYear() : null)

    if (desktop) {
      return (
        <Link href={`/${locale}/countries/${country.code}`}
          style={{ textDecoration: 'none', display: 'block', backgroundColor: DS.surface, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${DS.border}`, transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,31,59,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={country.flagUrl || `https://flagcdn.com/w320/${country.code}.png`} alt={name} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }} />
          </div>
          <div style={{ padding: '10px 14px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
            {flagSince
              ? <p style={{ margin: '4px 0 0', fontSize: '11px', color: DS.muted, fontWeight: '600' }}><CalIcon /> {t(`Since ${flagSince}`, `Depuis ${flagSince}`)}</p>
              : <p style={{ margin: '4px 0 0', fontSize: '11px', color: DS.light }}>{locale === 'fr' ? REGION_LABELS[country.region] : country.region}</p>
            }
          </div>
        </Link>
      )
    }

    return (
      <a href={`/${locale}/countries/${country.code}`}
        style={{ textDecoration: 'none', display: 'block', backgroundColor: DS.surface, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
        <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={country.flagUrl || `https://flagcdn.com/w160/${country.code}.png`} alt={name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '5px' }} />
        </div>
        <div style={{ padding: '8px 10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
          {flagSince
            ? <p style={{ margin: '3px 0 0', fontSize: '10px', color: DS.muted, fontWeight: '600' }}><CalIcon size={9} /> {t(`Since ${flagSince}`, `Depuis ${flagSince}`)}</p>
            : <p style={{ margin: '2px 0 0', fontSize: '10px', color: DS.light }}>{locale === 'fr' ? REGION_LABELS[country.region] : country.region}</p>
          }
        </div>
      </a>
    )
  }

  // ── Filter content ────────────────────────────────────────────────────────
  const FilterContent = () => (
    <>
      <FilterSection sectionKey="continents" label={t('Continent', 'Continent')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CONTINENT_OPTIONS.map(c => (
            <button key={c.key} onClick={() => toggle(activeContinents, setActiveContinents, c.key)} style={chipStyle(activeContinents.includes(c.key))}>
              {c.label[locale] || c.label.en}
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection sectionKey="regions" label={t('Region', 'Région')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => toggle(activeRegions, setActiveRegions, r)} style={chipStyle(activeRegions.includes(r))}>
              {locale === 'fr' ? REGION_LABELS[r] : r}
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection sectionKey="colors" label={t('Colors present', 'Couleurs présentes')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {COLOR_OPTIONS.map(c => {
            const active = activeColors.includes(c.key)
            return (
              <button key={c.key} onClick={() => toggle(activeColors, setActiveColors, c.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
                  backgroundColor: active ? DS.navy : DS.bgAlt, color: active ? 'white' : DS.muted,
                }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, flexShrink: 0, border: c.border ? `1px solid ${DS.border}` : 'none' }} />
                {c.label[locale] || c.label.en}
              </button>
            )
          })}
        </div>
      </FilterSection>
      <FilterSection sectionKey="symbols" label={t('Symbols', 'Symboles')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SYMBOL_OPTIONS.map(s => (
            <button key={s.key} onClick={() => toggle(activeSymbols, setActiveSymbols, s.key)} style={chipStyle(activeSymbols.includes(s.key))}>
              {s.label[locale] || s.label.en}
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection sectionKey="ratio" label={t('Proportions', 'Proportions')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {RATIO_OPTIONS.map(r => {
            const active = activeRatios.includes(r.key)
            const parts = r.key.split(':').map(parseFloat)
            const aspect = (parts.length === 2 && parts[0] > 0 && parts[1] > 0) ? parts[1] / parts[0] : 1
            const boxH = 13
            const boxW = Math.max(8, Math.min(40, Math.round(boxH * aspect)))
            return (
              <button key={r.key} onClick={() => toggle(activeRatios, setActiveRatios, r.key)}
                style={{ ...chipStyle(active), display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span aria-hidden="true" style={{
                  display: 'inline-block', width: `${boxW}px`, height: `${boxH}px`,
                  borderRadius: '2px', flexShrink: 0,
                  border: active ? '1.5px solid rgba(255,255,255,0.85)' : `1.5px solid ${DS.light}`,
                  backgroundColor: active ? 'rgba(255,255,255,0.2)' : DS.surface,
                }} />
                {r.label[locale] || r.label.en}
              </button>
            )
          })}
        </div>
      </FilterSection>
      <FilterSection sectionKey="shape" label={t('Shape', 'Forme')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SHAPE_OPTIONS.map(s => {
            const active = activeShapes.includes(s.key)
            const stroke = active ? 'rgba(255,255,255,0.85)' : DS.light
            const fill = active ? 'rgba(255,255,255,0.2)' : DS.surface
            const shapeSvg = s.key === 'square'
              ? <rect x="3.5" y="0.5" width="13" height="13" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
              : s.key === 'pennant'
                ? <polygon points="1,0.5 20,7 1,13.5" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
                : <rect x="1" y="0.5" width="20" height="13" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
            return (
              <button key={s.key} onClick={() => toggle(activeShapes, setActiveShapes, s.key)}
                style={{ ...chipStyle(active), display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="22" height="14" viewBox="0 0 22 14" style={{ flexShrink: 0, overflow: 'visible' }} aria-hidden="true">{shapeSvg}</svg>
                {s.label[locale] || s.label.en}
              </button>
            )
          })}
        </div>
      </FilterSection>
    </>
  )

  return (
    <>
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 32px' }}>

        {/* Page title */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: DS.navy, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {entityView === 'territories' ? t('Nations & Territories', 'Nations et territoires') : t('Country Flags', 'Drapeaux des pays')}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: DS.muted }}>
            {filtered.length} {t('flags', 'drapeaux')}
          </p>
        </div>

        {/* Type switch */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[['sovereign', t('Countries', 'Pays')], ['territories', t('Nations & territories', 'Nations et territoires')]].map(([val, label]) => (
            <button key={val} onClick={() => setEntityView(val)}
              style={{ padding: '7px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                border: entityView === val ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
                backgroundColor: entityView === val ? DS.navy : DS.surface,
                color: entityView === val ? 'white' : DS.muted, transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ MOBILE ══════════════════════════════════════════════════════════ */}
        {isMobile && (
          <div>
            {/* Sticky search bar */}
            <div style={{ position: 'sticky', top: '60px', zIndex: 40, backgroundColor: DS.bg, paddingBottom: '12px', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DS.light} strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('Search a country…', 'Rechercher un pays…')}
                    style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '10px', border: `1.5px solid ${DS.border}`, backgroundColor: DS.surface, fontSize: '15px', color: DS.navy, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setFiltersOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px', borderRadius: '10px',
                    border: hasFilters ? `2px solid ${DS.navy}` : `1.5px solid ${DS.border}`,
                    backgroundColor: hasFilters ? DS.navy : DS.surface,
                    color: hasFilters ? 'white' : DS.muted,
                    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '700',
                  }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
                  </svg>
                  {t('Filters', 'Filtres')}
                  {activeFilterCount > 0 && (
                    <span style={{ backgroundColor: hasFilters ? 'rgba(255,255,255,0.25)' : DS.navy, color: 'white', borderRadius: '9999px', fontSize: '11px', fontWeight: '900', padding: '1px 6px' }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '13px', color: DS.muted, fontWeight: '500' }}>
                  {filtered.length} {filtered.length === 1 ? t('country', 'pays') : t('countries', 'pays')}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setSortOrder('az')} style={{ ...chipStyle(sortOrder === 'az'), padding: '5px 12px', fontSize: '12px' }}>A→Z</button>
                  <button onClick={() => setSortOrder('za')} style={{ ...chipStyle(sortOrder === 'za'), padding: '5px 12px', fontSize: '12px' }}>Z→A</button>
                </div>
              </div>
            </div>

            {/* Mobile filter drawer */}
            {filtersOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
                <div onClick={() => setFiltersOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(85vw, 360px)', backgroundColor: DS.surface, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(11,31,59,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: DS.navy }}>{t('Filters', 'Filtres')}</h2>
                      {hasFilters && <span style={{ backgroundColor: DS.navy, color: 'white', borderRadius: '9999px', fontSize: '11px', fontWeight: '900', padding: '2px 8px' }}>{activeFilterCount}</span>}
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

            {/* Flag grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: DS.light }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                <p style={{ fontSize: '15px', fontWeight: '600' }}>{t('No countries match', 'Aucun pays ne correspond')}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', alignItems: 'stretch', gridAutoRows: '1fr' }}>
                {filtered.map(country => <CountryTile key={country.code} country={country} desktop={false} />)}
              </div>
            )}
          </div>
        )}

        {/* ══ DESKTOP ══════════════════════════════════════════════════════════ */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

            {/* Sidebar */}
            <div style={{ width: 'min(340px, 100%)', flexShrink: 0, position: 'sticky', top: '76px', alignSelf: 'flex-start', backgroundColor: DS.surface, borderRadius: '14px', border: `1px solid ${DS.border}`, padding: '24px 20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: DS.navy, color: 'white', fontWeight: '900', fontSize: '20px', borderRadius: '10px', padding: '4px 14px', minWidth: '52px' }}>
                    {filtered.length}
                  </span>
                  <span style={{ fontSize: '13px', color: DS.muted, fontWeight: '500' }}>
                    {filtered.length === 1 ? t('country', 'pays') : t('countries', 'pays')}
                  </span>
                </div>
                {hasFilters && (
                  <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: DS.muted, fontWeight: '600', textDecoration: 'underline' }}>
                    {t('Clear all', 'Tout effacer')}
                  </button>
                )}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DS.light} strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t('Search…', 'Rechercher…')}
                  style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', border: `1.5px solid ${DS.border}`, backgroundColor: DS.bgAlt, fontSize: '14px', color: DS.navy, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Sort */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                <button onClick={() => setSortOrder('az')} style={{ ...chipStyle(sortOrder === 'az'), padding: '6px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}>A→Z</button>
                <button onClick={() => setSortOrder('za')} style={{ ...chipStyle(sortOrder === 'za'), padding: '6px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}>Z→A</button>
              </div>

              <FilterContent />
            </div>

            {/* Grid */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: DS.light }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{t('No countries match your filters', 'Aucun pays ne correspond aux filtres')}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', alignItems: 'stretch', gridAutoRows: '1fr' }}>
                  {filtered.map(country => <CountryTile key={country.code} country={country} desktop={true} />)}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
    <Footer />
    </>
  )
}
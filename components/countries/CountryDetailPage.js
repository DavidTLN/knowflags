'use client'
import { createClient } from '@/lib/supabase-client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import FlagImage from '@/components/FlagImage'
import { useLocale } from 'next-intl'

const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }

// ── Continent meta (for the navigation module) ───────────────────────────────
const CONTINENT_META = {
  'europe':           { en: 'Europe',          fr: 'Europe',            slug: 'europe',           color: '#1a3a6b', accent: '#4a7fd4', emoji: '🇪🇺' },
  'africa':           { en: 'Africa',          fr: 'Afrique',           slug: 'africa',           color: '#6b2a1a', accent: '#e07840', emoji: '🌍' },
  'asia':             { en: 'Asia',            fr: 'Asie',              slug: 'asia',             color: '#1a5c3a', accent: '#4ab870', emoji: '🌏' },
  'north-americas':   { en: 'North America',  fr: 'Amérique du Nord',  slug: 'north-americas',   color: '#3b0764', accent: '#a855d4', emoji: '🌎' },
  'central-americas': { en: 'Central America',fr: 'Amérique centrale', slug: 'central-americas', color: '#581c87', accent: '#c084fc', emoji: '🌴' },
  'south-americas':   { en: 'South America',  fr: 'Amérique du Sud',   slug: 'south-americas',   color: '#4a044e', accent: '#e879f9', emoji: '🌎' },
  'oceania':          { en: 'Oceania',         fr: 'Océanie',           slug: 'oceania',          color: '#1a4a6b', accent: '#38b2d4', emoji: '🌊' },
}

// continent slug lookup by DB region value
const REGION_TO_CONTINENT = {
  'Africa':   'africa',
  'Americas': 'north-americas',
  'Asia':     'asia',
  'Europe':   'europe',
  'Oceania':  'oceania',
}

// ── CountryFlagsSection ──────────────────────────────────────────────────────
function CountryFlagsSection({ countryIso2 }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [regions, setRegions]     = useState([])
  const [cities, setCities]       = useState([])
  const [orgs, setOrgs]           = useState([])
  const [activeTab, setActiveTab] = useState('regions')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!countryIso2) return
    const supabase = createClient()

    supabase
      .from('flag_taxonomy')
      .select('id')
      .eq('flag_type', 'country')
      .eq('metadata->>iso2', countryIso2.toLowerCase())
      .single()
      .then(({ data: country }) => {
        if (!country) { setLoading(false); return }
        supabase
          .from('flag_taxonomy')
          .select('id, slug, name_en, name_fr, flag_type, image_path, sort_order, parent:parent_id(name_en, name_fr)')
          .eq('country_id', country.id)
          .neq('id', country.id)
          .order('sort_order')
          .then(({ data }) => {
            const all = data ?? []
            const r = all.filter(f => f.flag_type === 'region')
            const c = all.filter(f => f.flag_type === 'city')
            const o = all.filter(f => f.flag_type === 'organisation')
            setRegions(r)
            setCities(c)
            setOrgs(o)
            if (r.length === 0 && c.length > 0) setActiveTab('cities')
            else if (r.length === 0 && o.length > 0) setActiveTab('orgs')
            setLoading(false)
          })
      })
  }, [countryIso2])

  const tabs = [
    { key: 'regions', label: t('Regions', 'Régions'),            count: regions.length },
    { key: 'cities',  label: t('Cities', 'Villes'),              count: cities.length },
    { key: 'orgs',    label: t('Organisations', 'Organisations'), count: orgs.length },
  ].filter(tab => tab.count > 0)

  if (!loading && tabs.length === 0) return null

  const current = activeTab === 'regions' ? regions : activeTab === 'cities' ? cities : orgs

  return (
    <section style={{ marginTop: '48px', fontFamily: 'var(--font-body, Arial)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0B1F3B', fontFamily: 'var(--font-display, Arial)' }}>
          {t('Sub-national Flags', 'Drapeaux Infranationaux')}
        </h2>
        {tabs.length > 1 && (
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F4F1E6', borderRadius: '10px', padding: '4px' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600',
                  backgroundColor: activeTab === tab.key ? 'white' : 'transparent',
                  color: activeTab === tab.key ? '#0B1F3B' : '#8A8278',
                  boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                {tab.label}
                <span style={{
                  fontSize: '10px', fontWeight: '700', borderRadius: '99px', padding: '1px 6px',
                  backgroundColor: activeTab === tab.key ? '#0B1F3B' : '#E2DDD5',
                  color: activeTab === tab.key ? 'white' : '#8A8278',
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
          {t('Loading...', 'Chargement...')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, calc(50% - 7px)), 1fr))', gap: '14px' }}>
          {current.map(flag => {
            const name = locale === 'fr' ? flag.name_fr : flag.name_en
            const parentName = flag.parent
              ? (locale === 'fr' ? flag.parent.name_fr : flag.parent.name_en)
              : null
            return (
              <SubFlagCard
                key={flag.slug}
                slug={flag.slug}
                name={name}
                parentName={activeTab === 'cities' ? parentName : null}
                imagePath={flag.image_path}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

function SubFlagCard({ slug, name, parentName, imagePath }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.10)' : '0 1px 6px rgba(0,0,0,0.06)',
        transition: 'all 0.18s', transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer', border: '1px solid #F0EEE8',
      }}
    >
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
        <FlagImage
          slug={slug}
          prefix={imagePath?.includes?.('/cities/') ? '/flags/cities' : '/flags/regions'}
          name={name}
          color="#0B1F3B"
          width={150} height={96}
        />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0B1F3B', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        {parentName && (
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {parentName}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ContinentNavModule ────────────────────────────────────────────────────────
function ContinentNavModule({ currentContinent, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const continents = Object.values(CONTINENT_META)

  return (
    <section style={{ marginTop: '48px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
        {t('Browse by Continent', 'Naviguer par continent')}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
        {continents.map(c => {
          const isCurrent = c.slug === currentContinent
          const label = locale === 'fr' ? c.fr : c.en
          return (
            <Link key={c.slug} href={`/${locale}/continents/${c.slug}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  padding: '14px 16px', borderRadius: '12px',
                  border: isCurrent ? `2px solid ${c.accent}` : '2px solid #e2e8f0',
                  backgroundColor: isCurrent ? c.accent + '18' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
                onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.backgroundColor = c.accent + '10' } }}
                onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'white' } }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{c.emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: isCurrent ? '800' : '600', color: isCurrent ? c.color : '#0B1F3B', lineHeight: 1.2 }}>
                  {label}
                </span>
                {isCurrent && (
                  <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.accent, flexShrink: 0 }} />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ── CountryDetailPage ────────────────────────────────────────────────────────
export default function CountryDetailPage() {
  const { code } = useParams()
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [country, setCountry]                   = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [relatedCountries, setRelatedCountries] = useState([])

  useEffect(() => {
    if (!code) return
    const supabase = createClient()
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr, region, capital, capital_fr, colors, symbols, ratio, shape, population, area_km2, adopted_year, median_age')
      .eq('iso_code', code.toLowerCase())
      .single()
      .then(({ data }) => {
        if (data) {
          const c = {
            code: data.iso_code,
            en: data.name_en,
            fr: data.name_fr,
            region: data.region,
            capital: { en: data.capital, fr: data.capital_fr || data.capital },
            colors: data.colors || [],
            symbols: data.symbols || [],
            ratio: data.ratio,
            shape: data.shape,
            population: data.population,
            area_km2: data.area_km2,
            adopted_year: data.adopted_year,
            median_age: data.median_age,
          }
          setCountry(c)
          supabase
            .from('countries')
            .select('iso_code, name_en, name_fr')
            .eq('region', data.region)
            .neq('iso_code', data.iso_code)
            .then(({ data: rel }) => {
              if (rel) {
                const shuffled = [...rel].sort(() => Math.random() - 0.5).slice(0, 6)
                setRelatedCountries(shuffled.map(r => ({ code: r.iso_code, en: r.name_en, fr: r.name_fr })))
              }
            })
        }
        setLoading(false)
      })
  }, [code])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8278', fontSize: '16px' }}>{t('Loading...', 'Chargement...')}</p>
      </div>
    )
  }

  if (!country) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏳️</div>
          <h1 style={{ color: '#0B1F3B', fontWeight: '900', fontSize: '24px' }}>{t('Country not found', 'Pays introuvable')}</h1>
          <Link href={`/${locale}/countries`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            ← {t('Back to all countries', 'Retour aux pays')}
          </Link>
        </div>
      </div>
    )
  }

  const name    = locale === 'fr' ? country.fr : country.en
  const capital = country.capital ? (locale === 'fr' ? country.capital.fr : country.capital.en) : '—'
  const region  = locale === 'fr' ? REGION_LABELS[country.region] : country.region
  const continentSlug = REGION_TO_CONTINENT[country.region] || null

  const COLOR_HEX = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', white: '#e5e7eb', black: '#1f2937', orange: '#f97316', maroon: '#7f1d1d' }

  function formatPop(n) {
    if (!n) return '—'
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
    return n.toString()
  }

  const infoCards = [
    { label: t('Capital', 'Capitale'),           value: capital,                     icon: '🏙️' },
    { label: t('Region', 'Région'),               value: region,                      icon: '🌍' },
    { label: t('ISO Code', 'Code ISO'),           value: country.code.toUpperCase(),  icon: '🔤' },
    { label: t('Population', 'Population'),       value: formatPop(country.population), icon: '👥' },
    ...(country.area_km2     ? [{ label: t('Area', 'Superficie'),         value: country.area_km2.toLocaleString() + ' km²',            icon: '📐' }] : []),
    ...(country.adopted_year ? [{ label: t('Flag adopted', 'Adopté en'),  value: country.adopted_year,                                   icon: '📅' }] : []),
    ...(country.median_age   ? [{ label: t('Median age', 'Âge médian'),   value: country.median_age + (locale === 'fr' ? ' ans' : ' yr'), icon: '👤' }] : []),
  ]

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: '#94a3b8' }}>
          <Link href={`/${locale}/countries`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            {t('Country Flags', 'Drapeaux · Pays')}
          </Link>
          <span>›</span>
          <span style={{ color: '#64748b', fontWeight: '500' }}>{name}</span>
        </div>

        {/* Hero: flag + info */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '40px' }}>

          {/* Flag */}
          <div style={{ flex: '0 0 auto', width: 'min(400px, 100%)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0' }}>
            <img
              src={`https://flagcdn.com/w640/${country.code}.png`}
              alt={name}
              style={{ width: '100%', display: 'block', aspectRatio: '3/2', objectFit: 'contain', backgroundColor: '#f0ede4', padding: '12px' }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {name}
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#64748b' }}>{region}</p>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {infoCards.map((item, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0B1F3B' }}>{item.icon} {item.value}</p>
                </div>
              ))}
            </div>

            {/* Colors */}
            {country.colors.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Flag Colors', 'Couleurs du drapeau')}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {country.colors.map(c => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'white', borderRadius: '99px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0B1F3B', fontWeight: '600' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR_HEX[c] || '#ccc', border: c === 'white' ? '1px solid #ccc' : 'none', flexShrink: 0 }} />
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbols */}
            {country.symbols.length > 0 && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Symbols', 'Symboles')}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {country.symbols.map(s => (
                    <span key={s} style={{ padding: '4px 12px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '99px', fontSize: '12px', fontWeight: '600' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sub-national flags */}
        <CountryFlagsSection countryIso2={country.code} />

        {/* Continent navigation */}
        <ContinentNavModule currentContinent={continentSlug} locale={locale} />

        {/* Play games CTA */}
        <div style={{ backgroundColor: '#0B1F3B', borderRadius: '16px', padding: '24px 28px', marginTop: '48px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: 'white' }}>
              {t('Test your knowledge!', 'Testez vos connaissances !')}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#9EB7E5' }}>
              {t('Can you recognize this flag in Flag Reveal?', 'Reconnaîtrez-vous ce drapeau dans Flag Reveal ?')}
            </p>
          </div>
          <Link href={`/${locale}/games/flag-reveal`}
            style={{ backgroundColor: '#9EB7E5', color: '#0B1F3B', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
            🏳️ {t('Play Flag Reveal', 'Jouer à Flag Reveal')}
          </Link>
        </div>

        {/* Related countries */}
        {relatedCountries.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              {t(`More from ${region}`, `Autres pays — ${region}`)}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {relatedCountries.map(c => {
                const cName = locale === 'fr' ? c.fr : c.en
                return (
                  <Link key={c.code} href={`/${locale}/countries/${c.code}`}
                    style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`https://flagcdn.com/w160/${c.code}.png`} alt={cName} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }} />
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cName}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
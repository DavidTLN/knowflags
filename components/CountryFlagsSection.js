'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

/**
 * Embeddable section for the country detail page.
 * Shows tabs: Regions | Cities | Organisations
 * Usage: <CountryFlagsSection countryIso2="fr" />
 */
export default function CountryFlagsSection({ countryIso2 }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [regions, setRegions]   = useState([])
  const [cities, setCities]     = useState([])
  const [orgs, setOrgs]         = useState([])
  const [activeTab, setActiveTab] = useState('regions')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!countryIso2) return
    const supabase = createClient()

    // Find country by iso2
    supabase
      .from('flags')
      .select('id')
      .eq('type', 'country')
      .eq("metadata->>'iso2'", countryIso2.toLowerCase())
      .single()
      .then(({ data: country }) => {
        if (!country) { setLoading(false); return }

        // Fetch all child flags
        supabase
          .from('flags')
          .select('id, slug, name_en, name_fr, type, image_path, parent_id, sort_order, metadata, parent:parent_id(name_en, name_fr)')
          .eq('country_id', country.id)
          .neq('id', country.id)
          .order('sort_order')
          .then(({ data }) => {
            const all = data ?? []
            setRegions(all.filter(f => f.type === 'region'))
            setCities(all.filter(f => f.type === 'city'))
            setOrgs(all.filter(f => f.type === 'organisation'))
            // Set default tab to first non-empty
            if (all.filter(f => f.type === 'region').length === 0 && all.filter(f => f.type === 'city').length > 0) setActiveTab('cities')
            setLoading(false)
          })
      })
  }, [countryIso2])

  const tabs = [
    { key: 'regions', label: t('Regions', 'Régions'), count: regions.length },
    { key: 'cities',  label: t('Cities', 'Villes'),   count: cities.length },
    { key: 'orgs',    label: t('Organisations', 'Organisations'), count: orgs.length },
  ].filter(tab => tab.count > 0)

  if (!loading && tabs.length === 0) return null

  const current = activeTab === 'regions' ? regions : activeTab === 'cities' ? cities : orgs

  return (
    <section style={{ marginTop: '48px', fontFamily: 'var(--font-body)' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0B1F3B', fontFamily: 'var(--font-display)' }}>
          {t('Sub-national Flags', 'Drapeaux Infranationaux')}
        </h2>

        {/* Tabs */}
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
                fontSize: '10px', fontWeight: '700',
                backgroundColor: activeTab === tab.key ? '#0B1F3B' : '#E2DDD5',
                color: activeTab === tab.key ? 'white' : '#8A8278',
                borderRadius: '99px', padding: '1px 6px',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          {t('Loading...', 'Chargement...')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {current.map(flag => (
            <SmallFlagCard key={flag.slug} flag={flag} locale={locale} showParent={activeTab === 'cities'} />
          ))}
        </div>
      )}
    </section>
  )
}

function SmallFlagCard({ flag, locale, showParent }) {
  const [hovered, setHovered] = useState(false)
  const name = locale === 'fr' ? flag.name_fr : flag.name_en
  const parentName = showParent && flag.parent
    ? (locale === 'fr' ? flag.parent.name_fr : flag.parent.name_en)
    : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.10)' : '0 1px 6px rgba(0,0,0,0.06)',
        transition: 'all 0.18s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer',
        border: '1px solid #F0EEE8',
      }}
    >
      {/* Flag */}
      <div style={{ height: '90px', backgroundColor: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
        <img
          src={flag.image_path}
          alt={name}
          style={{ maxWidth: '100%', maxHeight: '65px', objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.12))' }}
          onError={e => { e.currentTarget.parentElement.innerHTML = `<span style="font-size:24px;color:#cbd5e1">🏴</span>` }}
        />
      </div>
      {/* Name */}
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
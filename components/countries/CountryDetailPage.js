'use client'
import { createClient } from '@/lib/supabase-client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

// Same data as CountriesPage — in production you'd import from a shared file
// COUNTRIES loaded from Supabase

const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }

export default function CountryDetailPage() {
  const { code } = useParams()
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [country, setCountry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedCountries, setRelatedCountries] = useState([])

  useEffect(() => {
    if (!code) return
    const supabase = createClient()
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr, region, capital, capital_fr, colors, symbols, ratio, shape, population, area_km2, adopted_year, has_weapons, has_blade, has_firearm')
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
          }
          setCountry(c)
          // Fetch related countries in same region
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

  // country is loaded from Supabase via useEffect above
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8278', fontSize: '16px' }}>{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>
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

  const name = locale === 'fr' ? country.fr : country.en
  const capital = country.capital ? (locale === 'fr' ? country.capital.fr : country.capital.en) : '—'
  const region = locale === 'fr' ? REGION_LABELS[country.region] : country.region

  // Related: same region, fetched from Supabase via useEffect
  const related = relatedCountries

  const COLOR_HEX = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', white: '#e5e7eb', black: '#1f2937', orange: '#f97316', maroon: '#7f1d1d' }

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
              {[
                { label: t('Capital', 'Capitale'), value: capital, icon: '🏙️' },
                { label: t('Region', 'Région'), value: region, icon: '🌍' },
                { label: t('ISO Code', 'Code ISO'), value: country.code.toUpperCase(), icon: '🔤' },
              ].map((item, i) => (
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

        {/* Play games CTA */}
        <div style={{ backgroundColor: '#0B1F3B', borderRadius: '16px', padding: '24px 28px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
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
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              {t(`More from ${region}`, `Autres pays — ${region}`)}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {related.map(c => {
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
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import Footer from '@/components/Footer'

const DS = {
  navy: '#16324F', navyLight: '#1E4976', bg: '#F4F1E6', bgAlt: '#FAFAF7',
  surface: '#FFFFFF', secondary: '#EEF2F7', border: 'rgba(22,50,79,0.12)',
  borderSolid: '#E2DDD5', muted: '#6B7280', light: '#9CA3AF', text: '#0F1923',
  green: '#16A34A', steel: '#9EB7E5',
}

const COLOR_HEX = {
  red: '#D62828', blue: '#2563EB', green: '#16A34A', yellow: '#F4C400',
  orange: '#EA580C', white: '#FFFFFF', black: '#1F2937', purple: '#6B21A8',
  maroon: '#8D1B3D', gold: '#F4B400', silver: '#C0C4CC', brown: '#8B5E3C',
}

const humanize = (s) => String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase())

export default function CityDetailPage({ slug }) {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [city, setCity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setIsMobile(mq.matches)
    on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (!slug) return
    const supabase = createClient()
    supabase.from('flag_taxonomy')
      .select('slug, name_en, name_fr, image_path, metadata, country:country_id(slug, name_en, name_fr, image_path), parent:parent_id(slug, name_en, name_fr)')
      .eq('slug', slug).eq('flag_type', 'city').single()
      .then(({ data }) => {
        if (data) setCity(data); else setNotFound(true)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <PageLoader label={t('Loading…', 'Chargement…')} />

  if (notFound || !city) return (
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '40px' }}>
      <p style={{ fontSize: '18px', fontWeight: '700', color: DS.navy }}>{t('City not found', 'Ville introuvable')}</p>
      <Link href={`/${locale}/flags/cities`} style={{ color: DS.navyLight, fontWeight: '600' }}>{t('Back to city flags', 'Retour aux drapeaux de villes')}</Link>
    </div>
  )

  const name = locale === 'fr' ? (city.name_fr || city.name_en) : city.name_en
  const meta = city.metadata || {}
  const country = city.country
  const countryName = country ? (locale === 'fr' ? (country.name_fr || country.name_en) : country.name_en) : null
  const parentName = city.parent ? (locale === 'fr' ? (city.parent.name_fr || city.parent.name_en) : city.parent.name_en) : null
  const colors = Array.isArray(meta.colors) ? meta.colors : []
  const symbols = Array.isArray(meta.symbols) ? meta.symbols : []

  const facts = [
    meta.population && { label: t('Population', 'Population'), value: Number(meta.population).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US') },
    countryName && { label: t('Country', 'Pays'), value: countryName },
    parentName && { label: t('Region', 'Région'), value: parentName },
    meta.ratio && { label: t('Proportions', 'Proportions'), value: meta.ratio },
    meta.shape && { label: t('Shape', 'Forme'), value: humanize(meta.shape) },
  ].filter(Boolean)

  const subtitle = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {country?.image_path && <img src={country.image_path} alt="" width={18} height={13} style={{ borderRadius: '2px', border: `1px solid ${DS.border}`, objectFit: 'cover' }} />}
      {[countryName, parentName].filter(Boolean).join('   ·   ')}
    </span>
  )

  const flagCard = (
    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(22,50,79,0.12)', border: `1px solid ${DS.border}`, backgroundColor: DS.surface }}>
      <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <img src={city.image_path} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
    </div>
  )

  const quickFacts = facts.length > 0 && (
    <div style={{ backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: '800', color: DS.navy }}>{t('Quick Facts', 'Chiffres clés')}</p>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
        {facts.map((item, i) => (
          <div key={i} style={{
            padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: DS.surface,
            borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none',
            borderBottom: i < facts.length - (facts.length % 2 === 0 ? 2 : 1) ? `1px solid ${DS.border}` : 'none',
          }}>
            <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
            <div style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: DS.navy }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const designSection = (colors.length > 0 || symbols.length > 0) && (
    <div style={{ backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, padding: '20px 22px' }}>
      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: DS.green, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: DS.green, borderRadius: '2px' }} />
        {t('Design', 'Conception')}
      </p>
      <h2 style={{ fontSize: '22px', fontWeight: '900', color: DS.navy, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{t('Colors & symbols', 'Couleurs et symboles')}</h2>
      {colors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: symbols.length > 0 ? '18px' : 0 }}>
          {colors.map((c, i) => {
            const hex = COLOR_HEX[String(c).toLowerCase()] || '#cccccc'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px 6px 6px', borderRadius: '9999px', border: `1px solid ${DS.border}`, backgroundColor: DS.bgAlt }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '9999px', backgroundColor: hex, border: `1px solid ${DS.border}`, display: 'block' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: DS.navy }}>{humanize(c)}</span>
              </div>
            )
          })}
        </div>
      )}
      {symbols.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {symbols.map((sym, i) => (
            <span key={i} style={{ fontSize: '12px', fontWeight: '600', color: DS.navy, backgroundColor: DS.secondary, padding: '5px 12px', borderRadius: '9999px' }}>{humanize(sym)}</span>
          ))}
        </div>
      )}
    </div>
  )

  const breadcrumb = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '13px', color: DS.muted, flexWrap: 'wrap' }}>
      <Link href={`/${locale}/countries`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>{t('Flags', 'Drapeaux')}</Link>
      <span>›</span>
      <Link href={`/${locale}/flags/cities`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>{t('Cities', 'Villes')}</Link>
      <span>›</span>
      <span style={{ color: DS.navy, fontWeight: '600' }}>{name}</span>
    </div>
  )

  return (
    <>
      <div style={{ backgroundColor: DS.bg, minHeight: '100vh', fontFamily: 'var(--font-body, system-ui)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px' : '24px 24px 48px' }}>

          {breadcrumb}

          <div style={{ marginTop: '16px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '900', color: DS.navy, margin: '0 0 4px', letterSpacing: '-1px' }}>{name}</h1>
            <div style={{ fontSize: '15px', color: DS.muted }}>{subtitle}</div>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {flagCard}
              {quickFacts}
              {designSection}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 380px', maxWidth: '440px' }}>{flagCard}</div>
                {quickFacts && <div style={{ flex: '1 1 360px', minWidth: 0 }}>{quickFacts}</div>}
              </div>
              {designSection}
            </>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
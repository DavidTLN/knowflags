'use client'

// components/cities/CityDetailPage.js
//
// Refonte alignee sur CountryDetailPage : memes blocs, memes composants
// visuels, meme vocabulaire. Trois ajouts propres aux villes :
//   - un bloc « Rattachement » (sa region / son pays),
//   - un bloc « Jumelages », alimente par la vue city_twinning_view,
//   - la planche de construction, si le fichier existe.
//
// RESOLUTION DES DRAPEAUX
// Aucun fichier n'existe reellement dans public/flags/{cities,regions}. Le
// composant FlagImage gere la cascade svg -> png -> API Wikimedia -> badge
// d'initiales, et c'est lui qui fait fonctionner la page liste. On l'utilise
// donc partout ici plutot que de lire image_path en direct.
// Exception : un pays se resout par flagcdn a partir de son iso_code (ajoute
// par city_twinning.sql), aucune API ne servant les regions ni les villes.
//
// ROBUSTESSE
// Les deux requetes secondaires (iso_code du pays, jumelages) dependent de la
// migration city_twinning.sql. Elles sont volontairement isolees et echouent
// en silence : la page reste fonctionnelle avant comme apres la migration.
//
// CONVENTION metadata (jsonb de flag_taxonomy) — champs optionnels lus ici :
//   colors[]            symbols[]            population   ratio   shape
//   color_meanings      { "red":   { en, fr, hex } }
//   symbol_meanings     { "bear":  { en, fr } }
//   adopted_year        adopted_detail_en / adopted_detail_fr
//   designer_en / designer_fr
//   description_en / description_fr
//   flag_name_local
//   facts_en[] / facts_fr[]

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'
import FlagImage from '@/components/FlagImage'
import Footer from '@/components/Footer'

const DS = {
  navy: '#16324F', navyLight: '#1E4976', bg: '#F4F1E6', bgAlt: '#FAFAF7',
  surface: '#FFFFFF', secondary: '#EEF2F7', border: 'rgba(22,50,79,0.12)',
  borderSolid: '#E2DDD5', muted: '#6B7280', light: '#9CA3AF', text: '#0F1923',
  green: '#16A34A', steel: '#9EB7E5', gold: '#F4B400',
}

const COLOR_HEX = {
  red: '#D62828', blue: '#2563EB', green: '#16A34A', yellow: '#F4C400',
  orange: '#EA580C', white: '#FFFFFF', black: '#1F2937', purple: '#6B21A8',
  maroon: '#8D1B3D', gold: '#F4B400', silver: '#C0C4CC', brown: '#8B5E3C',
}

const humanize = (s) => String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase())

// ── Section (identique a celle de CountryDetailPage) ─────────────────────────
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

// ── Pastille de symbole (reprise de CountryDetailPage) ───────────────────────
function SymbolBadge({ slug, fallback, size = 40 }) {
  const exts = ['svg', 'png']
  const [idx, setIdx] = useState(0)
  const src = slug && idx < exts.length ? `/flags/symbols/${slug}.${exts[idx]}` : null
  const inner = Math.round(size * 0.92)
  return (
    <span style={{
      width: `${size}px`, height: `${size}px`, flexShrink: 0,
      borderRadius: `${Math.max(10, Math.round(size * 0.22))}px`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${Math.round(size * 0.42)}px`, fontWeight: '800',
      backgroundColor: '#F4F1E8', color: DS.navy, border: `1px solid ${DS.border}`,
      transition: 'width 0.22s ease, height 0.22s ease, border-radius 0.22s ease',
    }}>
      {src
        ? <img loading="lazy" decoding="async" src={src} alt="" onError={() => setIdx(i => i + 1)}
            style={{ width: `${inner}px`, height: `${inner}px`, objectFit: 'contain',
                     filter: 'drop-shadow(0 0 1px rgba(22,50,79,0.55))' }} />
        : fallback}
    </span>
  )
}

// ── Emplacement de drapeau a proportions libres ──────────────────────────────
// Les drapeaux nationaux vont de 11:28 (Qatar, le plus large) a 4:3 (le plus
// haut), en passant par 1:1 pour la Suisse et le Vatican. Un cadre fixe avec
// objectFit contain accueille toute la plage sans jamais deformer : les
// drapeaux larges remplissent la largeur, les hauts remplissent la hauteur.
const SLOT = { w: 132, h: 92 }

function FlagSlot({ children, width = SLOT.w, height = SLOT.h }) {
  return (
    <span style={{
      width: `${width}px`, height: `${height}px`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: DS.bgAlt, border: `1px solid ${DS.border}`,
      borderRadius: '6px', overflow: 'hidden', padding: '3px',
    }}>
      {children}
    </span>
  )
}

// Style commun aux images placees dans un FlagSlot.
const SLOT_IMG = { width: '100%', height: '100%', objectFit: 'contain', borderRadius: '2px' }

// ── Bouton d'ouverture « + » / « − » (reprise) ───────────────────────────────
function PlusButton({ isOpen }) {
  return (
    <span aria-hidden="true" style={{
      width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, marginTop: '7px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: isOpen ? DS.navy : DS.surface,
      border: `1px solid ${isOpen ? DS.navy : DS.border}`,
      color: isOpen ? '#fff' : DS.navy,
      transition: 'background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        {!isOpen && <line x1="12" y1="5" x2="12" y2="19" />}
      </svg>
    </span>
  )
}

// ── Planche de construction ──────────────────────────────────────────────────
// /flags/construction/city-{slug}-construction-{locale}.svg
// Se masque toute seule si aucun fichier n'existe.
function ConstructionSheet({ slug, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const primary = locale === 'fr' ? 'fr' : 'en'
  const secondary = primary === 'fr' ? 'en' : 'fr'
  const candidates = [
    `/flags/construction/city-${slug}-construction-${primary}.svg`,
    `/flags/construction/city-${slug}-construction-${secondary}.svg`,
    `/flags/construction/city-${slug}-construction-${primary}.png`,
    `/flags/construction/city-${slug}-construction-${secondary}.png`,
  ]
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(true)
  const [open, setOpen] = useState(false)
  if (!slug || !ok) return null
  const src = candidates[i]
  const label = t('Construction sheet', 'Planche de construction')
  return (
    <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: '16px', paddingTop: '14px' }}>
      <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={() => setOpen(true)} title={t('Click to enlarge', 'Cliquer pour agrandir')}
          style={{ position: 'relative', border: `1px solid ${DS.border}`, borderRadius: '10px', backgroundColor: DS.bgAlt, width: '600px', maxWidth: '100%', padding: '12px', boxSizing: 'border-box', cursor: 'zoom-in', display: 'block' }}>
          <img loading="lazy" decoding="async" src={src} alt={label}
            onError={() => (i + 1 < candidates.length ? setI(i + 1) : setOk(false))}
            style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
          <span style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(22,50,79,0.85)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '7px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
            {t('Zoom', 'Agrandir')}
          </span>
        </button>
      </div>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,25,35,0.85)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'zoom-out' }}>
          <img loading="lazy" decoding="async" src={src} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}

// ── Le saviez-vous (reprise) ─────────────────────────────────────────────────
function DidYouKnow({ facts, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [idx, setIdx] = useState(0)
  if (!facts || facts.length === 0) return null
  return (
    <div style={{ backgroundColor: '#EFF6FF', border: `1px solid ${DS.steel}`, borderLeft: `4px solid ${DS.steel}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DS.steel} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8' }}>
          {t('Did you know?', 'Le saviez-vous ?')}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '14px', color: '#1E3A5F', lineHeight: 1.6 }}>{facts[idx]}</p>
      {facts.length > 1 && (
        <button onClick={() => setIdx((idx + 1) % facts.length)}
          style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#2563EB', padding: 0 }}>
          {t('Next fact →', 'Anecdote suivante →')}
        </button>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CityDetailPage({ slug }) {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [city, setCity] = useState(null)
  const [countryIso, setCountryIso] = useState(null)
  const [twins, setTwins] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [openColor, setOpenColor] = useState(() => new Set())
  const [openSymbol, setOpenSymbol] = useState(() => new Set())

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setIsMobile(mq.matches)
    on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (!slug) return
    let active = true
    const supabase = createClient()

    supabase.from('flag_taxonomy')
      .select('id, slug, name_en, name_fr, image_path, metadata, country_id, country:country_id(id, slug, name_en, name_fr, image_path), parent:parent_id(slug, name_en, name_fr, image_path)')
      .eq('slug', slug).eq('flag_type', 'city').single()
      .then(async ({ data }) => {
        if (!active) return
        if (!data) { setNotFound(true); setLoading(false); return }
        setCity(data)
        setLoading(false)

        // Requetes secondaires, isolees : elles dependent de city_twinning.sql
        // et ne doivent jamais empecher la page de s'afficher.
        if (data.country_id) {
          try {
            const { data: c } = await supabase
              .from('flag_taxonomy').select('iso_code').eq('id', data.country_id).single()
            if (active && c?.iso_code) setCountryIso(c.iso_code)
          } catch { /* colonne absente : bloc pays non cliquable */ }
        }
        try {
          const { data: tw } = await supabase
            .from('city_twinning_view')
            .select('id, twin_name_en, twin_name_fr, twin_slug, twin_image_path, twin_country_code, since_year')
            .eq('city_id', data.id)
          if (active && tw) setTwins(tw)
        } catch { /* vue absente : bloc jumelages masque */ }
      })

    return () => { active = false }
  }, [slug])

  if (loading) return <PageLoader label={t('Loading…', 'Chargement…')} />

  if (notFound || !city) return (
    <div style={{ backgroundColor: DS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '40px' }}>
      <p style={{ fontSize: '18px', fontWeight: '700', color: DS.navy }}>{t('City not found', 'Ville introuvable')}</p>
      <Link prefetch={false} href={`/${locale}/flags/cities`} style={{ color: DS.navyLight, fontWeight: '600' }}>{t('Back to city flags', 'Retour aux drapeaux de villes')}</Link>
    </div>
  )

  const isFr = locale === 'fr'
  const name = isFr ? (city.name_fr || city.name_en) : city.name_en
  const meta = city.metadata || {}
  const country = city.country
  const countryName = country ? (isFr ? (country.name_fr || country.name_en) : country.name_en) : null
  const parentName = city.parent ? (isFr ? (city.parent.name_fr || city.parent.name_en) : city.parent.name_en) : null

  const colors = Array.isArray(meta.colors) ? meta.colors : []
  const symbols = Array.isArray(meta.symbols) ? meta.symbols : []
  const colorMeanings = meta.color_meanings || {}
  const symbolMeanings = meta.symbol_meanings || {}
  const description = isFr ? (meta.description_fr || meta.description_en) : (meta.description_en || meta.description_fr)
  const designer = isFr ? (meta.designer_fr || meta.designer_en) : (meta.designer_en || meta.designer_fr)
  const adoptedDetail = isFr ? (meta.adopted_detail_fr || meta.adopted_detail_en) : (meta.adopted_detail_en || meta.adopted_detail_fr)
  const facts = (isFr ? meta.facts_fr : meta.facts_en) || meta.facts_en || []

  const meaningOf = (map, key) => {
    const m = map && map[String(key).toLowerCase()]
    if (!m) return null
    return isFr ? (m.fr || m.en) : (m.en || m.fr)
  }
  const toggle = (setter) => (key) => setter(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })
  const toggleColor = toggle(setOpenColor)
  const toggleSymbol = toggle(setOpenSymbol)

  // ── Chiffres cles ──────────────────────────────────────────────────────────
  const quickFactItems = [
    meta.population && { label: t('Population', 'Population'), value: Number(meta.population).toLocaleString(isFr ? 'fr-FR' : 'en-US') },
    meta.ratio && { label: t('Proportions', 'Proportions'), value: meta.ratio },
    meta.shape && { label: t('Shape', 'Forme'), value: humanize(meta.shape) },
    meta.adopted_year && { label: t('Adopted', 'Adoption'), value: String(meta.adopted_year) },
    meta.flag_name_local && { label: t('Local name', 'Nom vernaculaire'), value: meta.flag_name_local },
    colors.length > 0 && { label: t('Colours', 'Couleurs'), value: String(colors.length) },
  ].filter(Boolean)

  const breadcrumb = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '13px', color: DS.muted, flexWrap: 'wrap' }}>
      <Link prefetch={false} href={`/${locale}/countries`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>{t('Flags', 'Drapeaux')}</Link>
      <span>›</span>
      <Link prefetch={false} href={`/${locale}/flags/cities`} style={{ color: DS.steel, textDecoration: 'none', fontWeight: '600' }}>{t('Cities', 'Villes')}</Link>
      <span>›</span>
      <span style={{ color: DS.navy, fontWeight: '600' }}>{name}</span>
    </div>
  )

  const subtitle = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {countryIso && (
        <img loading="lazy" decoding="async" src={`https://flagcdn.com/w40/${countryIso}.png`} alt="" width={18} height={13}
          style={{ borderRadius: '2px', border: `1px solid ${DS.border}`, objectFit: 'cover' }} />
      )}
      {[countryName, parentName].filter(Boolean).join('   ·   ')}
    </span>
  )

  const flagCard = (
    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(22,50,79,0.12)', border: `1px solid ${DS.border}`, backgroundColor: DS.surface }}>
      <div style={{ aspectRatio: '3/2', backgroundColor: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <FlagImage
          slug={city.slug} prefix="/flags/cities" name={name} color={DS.navy}
          width={320} height={213}
          style={{ width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
        />
      </div>
    </div>
  )

  const quickFacts = quickFactItems.length > 0 && (
    <div style={{ backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: '800', color: DS.navy }}>{t('Quick Facts', 'Chiffres clés')}</p>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DS.border}` }}>
        {quickFactItems.map((item, i) => (
          <div key={i} style={{
            padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: DS.surface,
            borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none',
            borderBottom: i < quickFactItems.length - (quickFactItems.length % 2 === 0 ? 2 : 1) ? `1px solid ${DS.border}` : 'none',
          }}>
            <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: DS.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
            <div style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: DS.navy }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Rattachement : sa region / son pays ────────────────────────────────────
  const belongingCard = (label, title, visual, href, hint) => {
    const inner = (
      <>
        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: DS.light, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {visual}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: DS.navy, lineHeight: 1.25 }}>{title}</p>
            {hint && <p style={{ margin: '2px 0 0', fontSize: '12px', color: DS.muted }}>{hint}</p>}
          </div>
          {href && (
            <span style={{ marginLeft: 'auto', color: DS.steel, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </span>
          )}
        </div>
      </>
    )
    const boxStyle = {
      backgroundColor: DS.surface, borderRadius: '14px', border: `1px solid ${DS.border}`,
      padding: '16px 18px', textDecoration: 'none', color: 'inherit', display: 'block',
      boxShadow: '0 1px 3px rgba(22,50,79,0.06)',
    }
    return href
      ? <Link prefetch={false} href={href} style={boxStyle}>{inner}</Link>
      : <div style={boxStyle}>{inner}</div>
  }

  const belonging = (countryName || parentName) && (
    <Section title={t('Where it belongs', 'Rattachement')}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        {parentName && belongingCard(
          t('Its region', 'Sa région'), parentName,
          <FlagSlot>
            <FlagImage slug={city.parent?.slug} prefix="/flags/regions" name={parentName}
              color={DS.navy} width={SLOT.w} height={SLOT.h} style={SLOT_IMG} />
          </FlagSlot>,
          `/${locale}/flags/regions`,
          t('Browse regional flags', 'Voir les drapeaux régionaux')
        )}
        {countryName && belongingCard(
          t('Its country', 'Son pays'), countryName,
          <FlagSlot>
            {countryIso
              ? <img loading="lazy" decoding="async" src={`https://flagcdn.com/w160/${countryIso}.png`} alt="" style={SLOT_IMG} />
              : <FlagImage slug={country?.slug} prefix="/flags/countries" name={countryName}
                  color={DS.navy} width={SLOT.w} height={SLOT.h} style={SLOT_IMG} />}
          </FlagSlot>,
          countryIso ? `/${locale}/countries/${countryIso}` : null,
          countryIso ? t('Open the country page', 'Ouvrir la fiche pays') : null
        )}
      </div>
    </Section>
  )

  // ── Couleurs et symboles ───────────────────────────────────────────────────
  const disclosure = (key, meaning, badge, labelNode, isOpen, onToggle) => (
    <div key={key} style={{ backgroundColor: DS.bg, borderRadius: '10px', border: `1px solid ${isOpen ? DS.navy + '55' : DS.border}`, overflow: 'hidden', transition: 'border-color 0.18s ease' }}>
      <div
        onClick={meaning ? () => onToggle(key) : undefined}
        role={meaning ? 'button' : undefined}
        tabIndex={meaning ? 0 : undefined}
        onKeyDown={meaning ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(key) } } : undefined}
        style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', cursor: meaning ? 'pointer' : 'default' }}>
        {badge}
        <div style={{ flex: 1, minWidth: 0 }}>
          {labelNode}
          {isOpen && meaning && (
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: DS.text, lineHeight: 1.6 }}>{meaning}</p>
          )}
        </div>
        {meaning && <PlusButton isOpen={isOpen} />}
      </div>
    </div>
  )

  const designSection = (colors.length > 0 || symbols.length > 0) && (
    <Section
      title={t('Colours & symbols', 'Couleurs et symboles')}
      subtitle={t('Tap an entry to read what it stands for.', 'Touchez un élément pour lire sa signification.')}>

      {colors.length > 0 && (
        <div style={{ display: 'grid', gap: '8px', marginBottom: symbols.length > 0 ? '20px' : 0 }}>
          {colors.map((c) => {
            const key = String(c).toLowerCase()
            const meaning = meaningOf(colorMeanings, key)
            const hex = colorMeanings[key]?.hex || COLOR_HEX[key] || '#CCCCCC'
            const isOpen = openColor.has(key)
            return disclosure(
              key, meaning,
              <span style={{ width: isOpen ? '54px' : '40px', height: isOpen ? '54px' : '40px', borderRadius: '10px', backgroundColor: hex, border: `1px solid ${DS.border}`, flexShrink: 0, transition: 'width 0.22s ease, height 0.22s ease' }} />,
              <>
                <span style={{ fontSize: '14px', fontWeight: '700', color: DS.navy }}>{humanize(c)}</span>
                {colorMeanings[key]?.hex && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: DS.light, fontVariantNumeric: 'tabular-nums' }}>
                    {colorMeanings[key].hex.toUpperCase()}
                  </span>
                )}
              </>,
              isOpen, toggleColor
            )
          })}
        </div>
      )}

      {symbols.length > 0 && (
        <div style={{ display: 'grid', gap: '8px' }}>
          {symbols.map((s) => {
            const key = String(s).toLowerCase()
            const meaning = meaningOf(symbolMeanings, key)
            const isOpen = openSymbol.has(key)
            return disclosure(
              key, meaning,
              <SymbolBadge slug={key} fallback={humanize(s).slice(0, 1)} size={isOpen ? 54 : 40} />,
              <span style={{ fontSize: '14px', fontWeight: '700', color: DS.navy }}>{humanize(s)}</span>,
              isOpen, toggleSymbol
            )
          })}
        </div>
      )}

      <ConstructionSheet slug={city.slug} locale={locale} />
    </Section>
  )

  // ── Description ────────────────────────────────────────────────────────────
  const descriptionSection = (description || designer || adoptedDetail) && (
    <Section title={t('Description', 'Description')}>
      {description && (
        <p style={{ margin: '0 0 14px', fontSize: '14px', color: DS.text, lineHeight: 1.7 }}>{description}</p>
      )}
      {adoptedDetail && (
        <div style={{ marginBottom: designer ? '14px' : 0, paddingTop: description ? '14px' : 0, borderTop: description ? `1px solid ${DS.border}` : 'none' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Adoption', 'Adoption')}</p>
          <div style={{ fontSize: '14px', fontWeight: '600', color: DS.navy, lineHeight: 1.6 }}>{adoptedDetail}</div>
        </div>
      )}
      {designer && (
        <div style={{ paddingTop: (description || adoptedDetail) ? '14px' : 0, borderTop: (description || adoptedDetail) ? `1px solid ${DS.border}` : 'none', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{t('Designed by', 'Conçu par')}</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: DS.navy, lineHeight: 1.5 }}>{designer}</span>
        </div>
      )}
    </Section>
  )

  // ── Jumelages ──────────────────────────────────────────────────────────────
  const twinsSorted = [...twins].sort((a, b) => {
    const an = isFr ? (a.twin_name_fr || a.twin_name_en) : a.twin_name_en
    const bn = isFr ? (b.twin_name_fr || b.twin_name_en) : b.twin_name_en
    return String(an).localeCompare(String(bn), isFr ? 'fr' : 'en')
  })

  const twinningSection = twinsSorted.length > 0 && (
    <Section
      title={t('Twin towns', 'Villes jumelées')}
      subtitle={t(
        `${name} maintains ${twinsSorted.length} twinning agreements around the world.`,
        `${name} entretient ${twinsSorted.length} jumelages à travers le monde.`
      )}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
        {twinsSorted.map(tw => {
          const twinName = isFr ? (tw.twin_name_fr || tw.twin_name_en) : tw.twin_name_en
          // Ville connue : cascade FlagImage. Sinon, drapeau de son pays.
          const href = tw.twin_slug ? `/${locale}/flags/cities/${tw.twin_slug}` : null
          const visual = (
            <FlagSlot width={46} height={32}>
              {tw.twin_slug
                ? <FlagImage slug={tw.twin_slug} prefix="/flags/cities" name={twinName}
                    color={DS.navy} width={46} height={32} style={SLOT_IMG} />
                : tw.twin_country_code
                  ? <img loading="lazy" decoding="async" src={`https://flagcdn.com/w80/${tw.twin_country_code}.png`} alt="" style={SLOT_IMG} />
                  : null}
            </FlagSlot>
          )
          const inner = (
            <>
              {visual}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: DS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{twinName}</p>
                {tw.since_year && (
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: DS.light }}>{t('since', 'depuis')} {tw.since_year}</p>
                )}
              </div>
              {href && (
                <span style={{ color: DS.steel, flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              )}
            </>
          )
          const box = {
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 13px', borderRadius: '10px',
            border: `1px solid ${DS.border}`, backgroundColor: href ? DS.surface : DS.bg,
            textDecoration: 'none', color: 'inherit',
          }
          return href
            ? <Link prefetch={false} key={tw.id + tw.twin_name_en} href={href} style={box}>{inner}</Link>
            : <div key={tw.id + tw.twin_name_en} style={box}>{inner}</div>
        })}
      </div>
    </Section>
  )

  const didYouKnow = facts.length > 0 && <DidYouKnow facts={facts} locale={locale} />

  const stack = [belonging, designSection, descriptionSection, twinningSection, didYouKnow].filter(Boolean)

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
              {stack}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 380px', maxWidth: '440px' }}>{flagCard}</div>
                {quickFacts && <div style={{ flex: '1 1 360px', minWidth: 0 }}>{quickFacts}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{stack}</div>
            </>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
// app/[locale]/countries/[code]/page.js
//
// SERVER Component. It fetches everything the detail page needs and passes it
// down as props, so the HTML sent to the browser already contains the country
// name, figures, colours and symbolism — no client-side loading step.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import CountryDetailClient from '@/components/CountryDetailClient'

const BASE_URL = 'https://knowflags.com'

// Rebuild a page at most once an hour; flag data changes very rarely.
export const revalidate = 3600
// Allow countries that were not pre-rendered at build time.
export const dynamicParams = true

const COUNTRY_SELECT =
  'iso_code, name_en, name_fr, region, capital, capital_fr, colors, symbols, ratio, ratios, shape, ' +
  'population, area_km2, adopted_year, median_age, last_flag_change, spec_en, spec_fr, ' +
  'etiquette_en, etiquette_fr, color_meanings, symbol_meanings, display_symbols, ' +
  'designer_en, designer_fr, adopted_note_fr, adopted_note_en, adopted_detail_fr, adopted_detail_en, ' +
  'flag_url, entity_type, parent_iso, sovereignty_note_en, sovereignty_note_fr'

// Shape the DB row exactly the way the presentation component expects it.
function toCountry(data) {
  if (!data) return null
  return {
    code:              data.iso_code,
    en:                data.name_en,
    fr:                data.name_fr,
    region:            data.region,
    capital:           { en: data.capital, fr: data.capital_fr || data.capital },
    colors:            data.colors || [],
    symbols:           data.symbols || [],
    population:        data.population,
    area_km2:          data.area_km2,
    adopted_year:      data.adopted_year,
    median_age:        data.median_age,
    last_flag_change:  data.last_flag_change,
    ratio:             data.ratio,
    ratios:            data.ratios || null,
    shape:             data.shape,
    spec_en:           data.spec_en,
    spec_fr:           data.spec_fr,
    designer_en:       data.designer_en,
    designer_fr:       data.designer_fr,
    adopted_note_fr:   data.adopted_note_fr,
    adopted_note_en:   data.adopted_note_en,
    adopted_detail_fr: data.adopted_detail_fr,
    adopted_detail_en: data.adopted_detail_en,
    flag_url:          data.flag_url,
    etiquette_en:      data.etiquette_en || [],
    etiquette_fr:      data.etiquette_fr || [],
    color_meanings:    data.color_meanings || {},
    symbol_meanings:   data.symbol_meanings || {},
    display_symbols:   data.display_symbols || [],
    entityType:        data.entity_type,
    parentIso:         data.parent_iso,
    sovNoteEn:         data.sovereignty_note_en,
    sovNoteFr:         data.sovereignty_note_fr,
  }
}

async function getCountry(code) {
  const supabase = createClient()
  const { data } = await supabase
    .from('countries')
    .select(COUNTRY_SELECT)
    .eq('iso_code', String(code).toLowerCase())
    .single()
  return toCountry(data)
}

// ── Pre-render every country at build time ───────────────────────────────────
export async function generateStaticParams() {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('countries').select('iso_code')
    if (!data) return []
    return data.flatMap(c => ([
      { locale: 'en', code: c.iso_code },
      { locale: 'fr', code: c.iso_code },
    ]))
  } catch {
    // Never break the build if the DB is unreachable — pages fall back to ISR.
    return []
  }
}

// ── Per-country metadata (real title/description in the HTML) ─────────────────
export async function generateMetadata({ params }) {
  const { locale, code } = await params
  const country = await getCountry(code)
  const isFr = locale === 'fr'

  if (!country) {
    return { title: isFr ? 'Pays introuvable' : 'Country not found' }
  }

  const name = isFr ? country.fr : country.en
  const title = isFr
    ? `Drapeau ${name} — signification, couleurs et histoire`
    : `Flag of ${name} — meaning, colours and history`
  const description = isFr
    ? `Découvrez le drapeau ${name} : signification des couleurs et des symboles, proportions, date d'adoption, histoire et chiffres clés.`
    : `Explore the flag of ${name}: colour and symbol meanings, proportions, adoption date, history and key figures.`

  const path = `/countries/${country.code}`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}${path}`,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}${path}`,
      siteName: 'Knowflags',
      images: [{ url: country.flag_url || `https://flagcdn.com/w1280/${country.code}.png`, alt: name }],
      locale: isFr ? 'fr_FR' : 'en_US',
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function Page({ params }) {
  const { locale, code } = await params
  const supabase = createClient()

  const country = await getCountry(code)
  if (!country) notFound()

  // Everything else in parallel — all on the server, all in the initial HTML.
  const [factsRes, relatedRes, childrenRes] = await Promise.all([
    supabase
      .from('country_facts')
      .select('fact_en, fact_fr, category')
      .eq('country_code', country.code.toLowerCase()),
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr')
      .eq('region', country.region)
      .eq('entity_type', 'sovereign')
      .neq('iso_code', country.code),
    supabase
      .from('countries')
      .select('iso_code, name_en, name_fr')
      .eq('parent_iso', country.code)
      .order('iso_code'),
  ])

  const facts = (factsRes.data || [])
    .map(f => (locale === 'fr' ? f.fact_fr : f.fact_en))
    .filter(Boolean)

  // Deterministic pick so the server HTML and the client render agree.
  const relatedCountries = (relatedRes.data || [])
    .slice(0, 6)
    .map(r => ({ code: r.iso_code, en: r.name_en, fr: r.name_fr }))

  const childEntities = (childrenRes.data || [])
    .map(k => ({ code: k.iso_code, en: k.name_en, fr: k.name_fr }))

  return (
    <CountryDetailClient
      country={country}
      facts={facts}
      relatedCountries={relatedCountries}
      childEntities={childEntities}
    />
  )
}
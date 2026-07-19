// app/[locale]/countries/page.js
//
// SERVER Component: the full country list is fetched here and passed down,
// so the 250 country names and links are in the initial HTML. The client
// component keeps all of its filtering, sorting and search untouched.

import { createClient } from '@/lib/supabase-server'
import CountryListingClient from '@/components/CountryListingClient'

const BASE_URL = 'https://knowflags.com'

export const revalidate = 3600

const SELECT =
  'iso_code, name_en, name_fr, region, colors, symbols, ratio, ratios, shape, ' +
  'has_weapons, has_blade, has_firearm, adopted_year, last_flag_change, ' +
  'flag_url, entity_type, parent_iso'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'Drapeaux des pays du monde — liste complète et filtres'
    : 'Flags of the world — complete list with filters'
  const description = isFr
    ? 'Tous les drapeaux du monde : filtrez par continent, couleurs, symboles, proportions et forme. Cliquez sur un drapeau pour son histoire et sa symbolique.'
    : 'Every flag in the world: filter by continent, colours, symbols, ratio and shape. Open any flag for its history and symbolism.'

  const url = `${BASE_URL}/${locale}/countries`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/countries`,
        fr: `${BASE_URL}/fr/countries`,
        'x-default': `${BASE_URL}/en/countries`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'KnowFlags',
      locale: isFr ? 'fr_FR' : 'en_US',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function Page() {
  let rows = []
  try {
    const supabase = createClient()
    const { data } = await supabase.from('countries').select(SELECT).order('name_en')
    rows = data || []
  } catch (err) {
    console.error('Supabase error (countries listing):', err?.message)
  }

  return <CountryListingClient rows={rows} />
}
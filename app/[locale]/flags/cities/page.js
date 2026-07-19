// app/[locale]/flags/cities/page.js
//
// SERVER Component: the city flag list is fetched here and passed down,
// so every city name and link is in the initial HTML.

import { createClient } from '@/lib/supabase-server'
import CitiesClient from '@/components/CitiesClient'

const BASE_URL = 'https://knowflags.com'

export const revalidate = 3600

const SELECT =
  'id, slug, name_en, name_fr, image_path, sort_order, metadata, ' +
  'parent:parent_id(id, slug, name_en, name_fr), ' +
  'country:country_id(id, slug, name_en, name_fr, image_path, metadata)'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'Drapeaux des villes du monde — liste et filtres'
    : 'City flags of the world — list and filters'
  const description = isFr
    ? 'Découvrez les drapeaux des villes du monde entier : filtrez par pays, continent, couleurs et symboles.'
    : 'Browse city flags from around the world: filter by country, continent, colours and symbols.'

  const url = `${BASE_URL}/${locale}/flags/cities`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/flags/cities`,
        fr: `${BASE_URL}/fr/flags/cities`,
        'x-default': `${BASE_URL}/en/flags/cities`,
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
  let flags = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('flag_taxonomy')
      .select(SELECT)
      .eq('flag_type', 'city')
      .order('sort_order')
    flags = data || []
  } catch (err) {
    console.error('Supabase error (cities listing):', err?.message)
  }

  return <CitiesClient flags={flags} />
}
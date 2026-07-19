// app/[locale]/flags/regions/page.js

import RegionsPage from '@/components/RegionsPage'

const BASE_URL = 'https://knowflags.com'

// Was a static `metadata` object: English-only, and it appended "| KnowFlags"
// on top of the root layout template, producing "… | KnowFlags | KnowFlags".
export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'Drapeaux régionaux — États, provinces, cantons et régions'
    : 'Regional flags — states, provinces, cantons and regions'
  const description = isFr
    ? 'Découvrez les drapeaux des États, provinces, cantons et régions du monde entier : filtrez par pays, couleurs et symboles.'
    : 'Browse the flags of states, provinces, cantons and regions worldwide: filter by country, colours and symbols.'

  const path = '/flags/regions'
  const url = `${BASE_URL}/${locale}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
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

export default function Page() {
  return <RegionsPage />
}
// app/[locale]/countries/page.js

import CountryListingPage from '@/components/countries/CountryListingPage'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'Drapeaux du Monde — 195 pays | KnowFlags'
    : 'World Flags — 195 Countries | KnowFlags'
  const description = isFr
    ? 'Parcourez les 195 drapeaux du monde. Filtrez par région, couleur ou symbole. Histoire et signification de chaque drapeau.'
    : 'Browse all 195 world flags. Filter by region, color or symbol. History and meaning of every flag.'

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/countries` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/countries`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isFr ? 'fr_FR' : 'en_US',
      type: 'website',
    },
  }
}

export default CountryListingPage
// app/[locale]/games/capital-city/page.js
import CapitalCity from '@/components/games/CapitalCity'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Capitales du Monde — Quiz | KnowFlags'
    : 'World Capitals Quiz | KnowFlags'
  const description = isFr
    ? 'Teste tes connaissances sur les capitales du monde. Mode QCM ou frappe libre.'
    : 'Test your world capitals knowledge. Multiple choice or free-type mode.'
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/games/capital-city` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/capital-city`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function CapitalCityPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: locale === 'fr' ? 'Capitales du Monde' : 'World Capitals Quiz',
    description: locale === 'fr'
      ? 'Trouve les capitales du monde.'
      : 'Find world capitals.',
    url: `${BASE_URL}/${locale}/games/capital-city`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CapitalCity />
    </>
  )
}
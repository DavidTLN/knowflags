// app/[locale]/games/flag-ranker/page.js
import FlagRanker from '@/components/games/FlagRanker'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Flag Rank — Classe les Drapeaux | KnowFlags'
    : 'Flag Rank — Rank the Flags | KnowFlags'
  const description = isFr
    ? 'Classez les pays par population, superficie ou PIB — juste avec leur drapeau.'
    : 'Rank countries by population, area or GDP — just from their flag.'
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/games/flag-ranker` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/flag-ranker`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagRankerPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: 'Flag Rank',
    description: locale === 'fr'
      ? 'Classez les drapeaux selon des critères géographiques.'
      : 'Rank flags by geographical criteria.',
    url: `${BASE_URL}/${locale}/games/flag-ranker`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagRanker />
    </>
  )
}
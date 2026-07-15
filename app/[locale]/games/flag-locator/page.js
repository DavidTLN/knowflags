// app/[locale]/games/flag-locator/page.js
import FlagLocator from '@/components/games/FlagLocator'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'FlagLocator — Trouve le pays sur la carte | KnowFlags'
    : 'FlagLocator — Find the country on the map | KnowFlags'
  const description = isFr
    ? 'Vois un drapeau, clique le bon pays sur la carte. Le plus rapide avec le moins d\u2019erreurs gagne.'
    : 'See a flag, click the right country on the map. Fastest with fewest errors wins.'
  return {
    title, description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/games/flag-locator`,
      languages: {
        en: `${BASE_URL}/en/games/flag-locator`,
        fr: `${BASE_URL}/fr/games/flag-locator`,
        'x-default': `${BASE_URL}/en/games/flag-locator`,
      },
    },
    openGraph: {
      title, description,
      url: `${BASE_URL}/${locale}/games/flag-locator`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagLocatorPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: 'FlagLocator',
    description: locale === 'fr'
      ? 'Trouve le pays correspondant au drapeau sur la carte.'
      : 'Find the country matching the flag on the map.',
    url: `${BASE_URL}/${locale}/games/flag-locator`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagLocator />
    </>
  )
}
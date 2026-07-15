// app/[locale]/games/flag-clue/page.js
import FlagClue from '@/components/games/FlagClue'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'FlagClue — Trouve le pays par anecdote | KnowFlags'
    : 'FlagClue — Find the Country by Clue | KnowFlags'
  const description = isFr
    ? 'Une anecdote, un pays à deviner. Testez vos connaissances géographiques grâce aux faits.'
    : 'One clue, one country to guess. Test your geography knowledge through fun facts.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/games/flag-clue`,
      languages: {
        en: `${BASE_URL}/en/games/flag-clue`,
        fr: `${BASE_URL}/fr/games/flag-clue`,
        'x-default': `${BASE_URL}/en/games/flag-clue`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/flag-clue`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagCluePage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: 'FlagClue',
    description: locale === 'fr'
      ? 'Trouve le pays grâce à une anecdote.'
      : 'Find the country from a fun fact.',
    url: `${BASE_URL}/${locale}/games/flag-clue`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagClue />
    </>
  )
}
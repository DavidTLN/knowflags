// app/[locale]/games/flag-quiz/page.js
import FlagQuiz from '@/components/games/FlagQuiz'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Quiz Drapeaux — Trouve le pays | KnowFlags'
    : 'Flag Quiz — Guess the Country | KnowFlags'
  const description = isFr
    ? 'Teste tes connaissances sur les drapeaux du monde. Identifie le pays à partir de son drapeau — 3 vies, questions infinies.'
    : 'Test your world flag knowledge. Identify the country from its flag — 3 lives, infinite questions.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/games/flag-quiz`,
      languages: {
        en: `${BASE_URL}/en/games/flag-quiz`,
        fr: `${BASE_URL}/fr/games/flag-quiz`,
        'x-default': `${BASE_URL}/en/games/flag-quiz`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/flag-quiz`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagQuizPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: locale === 'fr' ? 'Quiz Drapeaux' : 'Flag Quiz',
    description: locale === 'fr'
      ? 'Identifie le pays à partir de son drapeau. 3 vies, streak infini.'
      : 'Identify the country from its flag. 3 lives, infinite streak.',
    url: `${BASE_URL}/${locale}/games/flag-quiz`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagQuiz />
    </>
  )
}
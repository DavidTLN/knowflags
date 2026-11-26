// app/[locale]/games/camembert/page.js
import CamembertGame from '@/components/games/CamembertGame'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Le jeu du camembert — Devine le drapeau d’après ses couleurs | KnowFlags'
    : 'The Camembert Game — Guess the Flag from its Colour Chart | KnowFlags'
  const description = isFr
    ? 'Un camembert montre la part de chaque couleur d’un drapeau. Trouve le pays en 3 essais, le plus vite possible.'
    : 'A pie chart shows how much of each colour a flag uses. Find the country in 3 guesses, as fast as you can.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/games/camembert`,
      languages: {
        en: `${BASE_URL}/en/games/camembert`,
        fr: `${BASE_URL}/fr/games/camembert`,
        'x-default': `${BASE_URL}/en/games/camembert`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/camembert`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function CamembertPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: locale === 'fr' ? 'Le jeu du camembert' : 'The Camembert Game',
    description: locale === 'fr'
      ? 'Devine le drapeau d’après la répartition de ses couleurs, en 3 essais.'
      : 'Guess the flag from its colour distribution, in 3 guesses.',
    url: `${BASE_URL}/${locale}/games/camembert`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CamembertGame />
    </>
  )
}

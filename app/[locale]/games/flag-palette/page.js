// app/[locale]/games/flag-palette/page.js
import FlagPaletteGame from '@/components/games/FlagPaletteGame'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Flag Palette — Devine le drapeau d’après ses couleurs | KnowFlags'
    : 'Flag Palette — Guess the Flag from its Colours | KnowFlags'
  const description = isFr
    ? 'Un camembert montre la part de chaque couleur du drapeau. Trouve le pays en 3 essais.'
    : 'A pie chart shows how much of each colour a flag uses. Find the country in 3 guesses.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/games/flag-palette`,
      languages: {
        en: `${BASE_URL}/en/games/flag-palette`,
        fr: `${BASE_URL}/fr/games/flag-palette`,
        'x-default': `${BASE_URL}/en/games/flag-palette`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/flag-palette`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagPalettePage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: 'Flag Palette',
    description: locale === 'fr'
      ? 'Devine le drapeau d’après la répartition de ses couleurs, en 3 essais.'
      : 'Guess the flag from its colour distribution, in 3 guesses.',
    url: `${BASE_URL}/${locale}/games/flag-palette`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagPaletteGame />
    </>
  )
}

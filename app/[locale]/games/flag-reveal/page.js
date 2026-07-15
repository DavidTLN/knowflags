// app/[locale]/games/flag-reveal/page.js
import FlagReveal from '@/components/games/FlagReveal'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Flag Reveal — Devine le drapeau | KnowFlags'
    : 'Flag Reveal — Guess the Flag | KnowFlags'
  const description = isFr
    ? 'Devine le drapeau en 5 essais. Les tuiles se révèlent progressivement — construis ta série !'
    : 'Guess the flag in 5 tries. Tiles reveal progressively — build your streak!'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/games/flag-reveal`,
      languages: {
        en: `${BASE_URL}/en/games/flag-reveal`,
        fr: `${BASE_URL}/fr/games/flag-reveal`,
        'x-default': `${BASE_URL}/en/games/flag-reveal`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/flag-reveal`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagRevealPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: 'Flag Reveal',
    description: locale === 'fr'
      ? 'Devine le drapeau en 5 essais.'
      : 'Guess the flag in 5 tries.',
    url: `${BASE_URL}/${locale}/games/flag-reveal`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagReveal />
    </>
  )
}
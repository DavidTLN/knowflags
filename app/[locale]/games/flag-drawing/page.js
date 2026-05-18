// app/[locale]/games/flag-drawing/page.js
import FlagDrawing from '@/components/games/FlagDrawing'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr
    ? 'Dessine le Drapeau | KnowFlags'
    : 'Flag Drawing | KnowFlags'
  const description = isFr
    ? 'Reproduis des drapeaux du monde à la main. Couleurs extraites automatiquement, score de similarité.'
    : 'Reproduce world flags by hand. Auto-extracted colors, similarity score.'
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/games/flag-drawing` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games/flag-drawing`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
  }
}

export default async function FlagDrawingPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: locale === 'fr' ? 'Dessine le Drapeau' : 'Flag Drawing',
    description: locale === 'fr'
      ? 'Reproduis des drapeaux à la main.'
      : 'Reproduce flags by hand.',
    url: `${BASE_URL}/${locale}/games/flag-drawing`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FlagDrawing />
    </>
  )
}
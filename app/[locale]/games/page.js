// app/[locale]/games/page.js

import GamesPage from '@/components/GamesPage'
import { pageAlternates } from '@/lib/seo'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'Jeux de Drapeaux — Quiz, Dessin, Révélation'
    : 'Flag Games — Quiz, Drawing, Reveal & More'
  const description = isFr
    ? 'Découvrez tous nos jeux de drapeaux : quiz, dessin, devinettes, capitales et classements. Apprenez la géographie en jouant.'
    : 'Explore all our flag games: quiz, drawing, clues, capitals and rankings. Learn geography while playing.'

  return {
    title,
    description,
    alternates: pageAlternates(locale, '/games'),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/games`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isFr ? 'fr_FR' : 'en_US',
      type: 'website',
    },
  }
}

export default async function Page({ params }) {
  const { locale } = await params
  return <GamesPage locale={locale} />
}
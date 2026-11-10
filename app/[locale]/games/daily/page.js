// app/[locale]/games/daily/page.js
import DailyFlag from '@/components/games/DailyFlag'
import { pageAlternates } from '@/lib/seo'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr ? 'Drapeau du jour, un nouveau drapeau chaque jour | KnowFlags' : 'Flag of the Day, a new flag every day | KnowFlags'
  const description = isFr
    ? 'Un drapeau mystère par jour, le même pour tout le monde. 5 essais pour le trouver, une série à entretenir et un résultat à partager.'
    : 'One mystery flag a day, the same for everyone. 5 guesses to find it, a streak to keep and a result to share.'
  return {
    title,
    description,
    alternates: pageAlternates(locale, '/games/daily'),
    openGraph: {
      title, description, url: `${BASE_URL}/${locale}/games/daily`, siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }], type: 'website',
    },
  }
}

export default async function DailyPage({ params }) {
  const { locale } = await params
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: locale === 'fr' ? 'Drapeau du jour' : 'Flag of the Day',
    url: `${BASE_URL}/${locale}/games/daily`,
    genre: 'Educational',
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DailyFlag />
    </>
  )
}

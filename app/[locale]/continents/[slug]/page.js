// app/[locale]/continents/[slug]/page.js

import ContinentPage from '@/components/continents/ContinentPage'
import { pageAlternates } from '@/lib/seo'

const BASE_URL = 'https://knowflags.com'

// All seven slugs actually used across the site (see ContinentNavModule).
// `americas` is kept as a legacy alias so old links keep working.
const CONTINENT_DATA = {
  europe:             { en: 'Europe',          fr: 'Europe',            count: 44 },
  africa:             { en: 'Africa',          fr: 'Afrique',           count: 54 },
  asia:               { en: 'Asia',            fr: 'Asie',              count: 48 },
  'north-americas':   { en: 'North America',   fr: 'Amérique du Nord',  count: 4  },
  'central-americas': { en: 'Central America', fr: 'Amérique centrale', count: 20 },
  'south-americas':   { en: 'South America',   fr: 'Amérique du Sud',   count: 12 },
  oceania:            { en: 'Oceania',         fr: 'Océanie',           count: 14 },
  americas:           { en: 'Americas',        fr: 'Amériques',         count: 35 },
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params
  const isFr = locale === 'fr'
  const data = CONTINENT_DATA[slug]

  // No suffix here: the root layout template already appends "| KnowFlags".
  if (!data) {
    return {
      title: isFr ? 'Continent introuvable' : 'Continent not found',
      robots: { index: false, follow: true },
    }
  }

  const name = isFr ? data.fr : data.en
  const title = isFr
    ? `Drapeaux d'${name} — ${data.count} pays`
    : `Flags of ${name} — ${data.count} countries`
  const description = isFr
    ? `Explorez les ${data.count} drapeaux des pays d'${name} : histoire, couleurs, symboles et anecdotes sur chaque drapeau.`
    : `Explore the ${data.count} flags of ${name}: history, colours, symbols and stories behind each flag.`

  return {
    title,
    description,
    alternates: pageAlternates(locale, `/continents/${slug}`),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/continents/${slug}`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isFr ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function Page({ params }) {
  const { slug, locale } = await params
  const isFr = locale === 'fr'
  const data = CONTINENT_DATA[slug]

  const jsonLd = data ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isFr ? `Drapeaux d'${data.fr}` : `Flags of ${data.en}`,
    description: isFr
      ? `Les ${data.count} drapeaux des pays d'${data.fr}.`
      : `The ${data.count} flags of ${data.en} countries.`,
    url: `${BASE_URL}/${locale}/continents/${slug}`,
    inLanguage: locale,
    isPartOf: { '@type': 'WebSite', name: 'KnowFlags', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'KnowFlags', url: BASE_URL },
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ContinentPage slug={slug} />
    </>
  )
}
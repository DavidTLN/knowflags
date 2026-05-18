// app/[locale]/continents/[slug]/page.js

import ContinentPage from '@/components/continents/ContinentPage'

const BASE_URL = 'https://knowflags.com'

const CONTINENT_DATA = {
  africa:    { en: 'Africa',        fr: 'Afrique',          count: 54 },
  americas:  { en: 'Americas',      fr: 'Amériques',        count: 35 },
  asia:      { en: 'Asia',          fr: 'Asie',             count: 49 },
  europe:    { en: 'Europe',        fr: 'Europe',           count: 44 },
  oceania:   { en: 'Oceania',       fr: 'Océanie',          count: 14 },
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params
  const isFr = locale === 'fr'
  const data = CONTINENT_DATA[slug]

  if (!data) return { title: 'KnowFlags' }

  const name  = isFr ? data.fr : data.en
  const title = isFr
    ? `Drapeaux d'${name} — ${data.count} pays | KnowFlags`
    : `Flags of ${name} — ${data.count} Countries | KnowFlags`
  const description = isFr
    ? `Explorez les ${data.count} drapeaux des pays d'${name}. Histoire, symboles et faits sur chaque drapeau.`
    : `Explore the ${data.count} flags of ${name}. History, symbols and facts about each flag.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/continents/${slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/continents/${slug}`,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isFr ? 'fr_FR' : 'en_US',
      type: 'website',
    },
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
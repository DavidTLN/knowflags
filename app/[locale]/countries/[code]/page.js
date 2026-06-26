// DESTINATION: app/[locale]/countries/[code]/page.js
import { createClient } from '@/lib/supabase-server'
import CountryDetailPage from '@/components/countries/CountryDetailPage'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { code, locale } = await params
  const isFr = locale === 'fr'

  try {
    const supabase = await createClient()
    const { data: country } = await supabase
      .from('countries')
      .select('name_en, name_fr, region, capital')
      .eq('iso_code', code.toLowerCase())
      .single()

    if (!country) throw new Error('not found')

    const name    = isFr ? country.name_fr : country.name_en
    const capital = country.capital || ''
    const region  = country.region  || ''

    const title = isFr
      ? `Drapeau de ${name} — histoire, couleurs et signification | KnowFlags`
      : `${name} Flag — History, Colors & Meaning | KnowFlags`

    const description = isFr
      ? `Découvrez le drapeau de ${name}${capital ? `, capitale ${capital}` : ''}${region ? `, ${region}` : ''}. Histoire, symbolisme des couleurs et faits sur ${name}.`
      : `Explore the flag of ${name}${capital ? `, capital ${capital}` : ''}${region ? `, ${region}` : ''}. History, color symbolism and facts about ${name}.`

    const flagImageUrl = `https://flagcdn.com/w640/${code.toLowerCase()}.png`
    const pageUrl = `${BASE_URL}/${locale}/countries/${code.toLowerCase()}`

    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'KnowFlags',
        images: [{ url: flagImageUrl, width: 640, height: 427, alt: isFr ? `Drapeau de ${name}` : `Flag of ${name}` }],
        locale: isFr ? 'fr_FR' : 'en_US',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [flagImageUrl],
      },
    }
  } catch {
    return {
      title: isFr ? 'Drapeau | KnowFlags' : 'Country Flag | KnowFlags',
      description: isFr
        ? 'Découvrez les drapeaux du monde entier sur KnowFlags.'
        : 'Discover flags from around the world on KnowFlags.',
    }
  }
}

export default async function Page({ params }) {
  const { code, locale } = await params
  const isFr = locale === 'fr'

  let jsonLd = null
  try {
    const supabase = await createClient()
    const { data: country } = await supabase
      .from('countries')
      .select('name_en, name_fr, region, capital, population, area_km2')
      .eq('iso_code', code.toLowerCase())
      .single()

    if (country) {
      const name = isFr ? country.name_fr : country.name_en
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: isFr
          ? `Drapeau de ${name} — histoire et signification`
          : `Flag of ${name} — History and Meaning`,
        description: isFr
          ? `Histoire, symbolisme et faits sur le drapeau de ${name}.`
          : `History, symbolism and facts about the flag of ${name}.`,
        image: `https://flagcdn.com/w640/${code.toLowerCase()}.png`,
        url: `${BASE_URL}/${locale}/countries/${code.toLowerCase()}`,
        publisher: {
          '@type': 'Organization',
          name: 'KnowFlags',
          url: BASE_URL,
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` },
        },
        about: {
          '@type': 'Country',
          name,
          ...(country.capital    && { containsPlace: { '@type': 'City', name: country.capital } }),
          ...(country.population && { population: country.population }),
        },
      }
    }
  } catch { /* noop */ }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CountryDetailPage code={code} />
    </>
  )
}
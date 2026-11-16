import CityDetailPage from '@/components/cities/CityDetailPage'
import { createClient } from '@/lib/supabase-server'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { slug, locale } = await params
  const isFr = locale === 'fr'

  try {
    const supabase = await createClient()
    const { data: city } = await supabase
      .from('flag_taxonomy')
      .select('name_en, name_fr, image_path, metadata, country:country_id(name_en, name_fr)')
      .eq('slug', slug).eq('flag_type', 'region').single()

    if (!city) throw new Error('not found')

    const name = isFr ? (city.name_fr || city.name_en) : city.name_en
    const country = city.country ? (isFr ? (city.country.name_fr || city.country.name_en) : city.country.name_en) : ''
    const where = country ? `, ${country}` : ''

    const title = isFr
      ? `Drapeau de ${name}${where} — couleurs et signification | KnowFlags`
      : `${name} Flag${where} — Colors & Meaning | KnowFlags`
    const description = isFr
      ? `Découvrez le drapeau de ${name}${where} : couleurs, symboles et signification.`
      : `Explore the flag of ${name}${where}: colors, symbols and meaning.`
    const pageUrl = `${BASE_URL}/${locale}/flags/regions/${slug}`

    // Région sans drapeau connu : page utile à la navigation, mais pas à indexer
    const noFlag = !city.image_path && city.metadata?.source === 'wikidata'
    return {
      title,
      description,
      ...(noFlag ? { robots: { index: false, follow: true } } : {}),
      alternates: {
        canonical: pageUrl,
        languages: {
          en: `${BASE_URL}/en/flags/regions/${slug}`,
          fr: `${BASE_URL}/fr/flags/regions/${slug}`,
          'x-default': `${BASE_URL}/en/flags/regions/${slug}`,
        },
      },
      openGraph: {
        title, description, url: pageUrl, siteName: 'KnowFlags',
        locale: isFr ? 'fr_FR' : 'en_US', type: 'article',
      },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    return {
      title: isFr ? 'Drapeau régional | KnowFlags' : 'Regional Flag | KnowFlags',
      description: isFr
        ? 'Découvrez les drapeaux des régions du monde sur KnowFlags.'
        : 'Discover regional flags from around the world on KnowFlags.',
    }
  }
}

export default async function Page({ params }) {
  const { slug, locale } = await params
  const isFr = locale === 'fr'

  let jsonLd = null
  try {
    const supabase = await createClient()
    const { data: city } = await supabase
      .from('flag_taxonomy')
      .select('name_en, name_fr, image_path, country:country_id(name_en, name_fr)')
      .eq('slug', slug).eq('flag_type', 'region').single()

    if (city) {
      const name = isFr ? (city.name_fr || city.name_en) : city.name_en
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: isFr ? `Drapeau de ${name}` : `Flag of ${name}`,
        image: city.image_path ? `${BASE_URL}${city.image_path}` : undefined,
        url: `${BASE_URL}/${locale}/flags/regions/${slug}`,
        publisher: {
          '@type': 'Organization', name: 'KnowFlags', url: BASE_URL,
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` },
        },
        about: { '@type': 'AdministrativeArea', name },
      }
    }
  } catch { /* noop */ }

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <CityDetailPage slug={slug} kind="region" />
    </>
  )
}
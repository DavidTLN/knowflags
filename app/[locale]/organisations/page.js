// app/[locale]/organisations/page.js

import OrganisationsPage from '@/components/OrganisationsPage'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? "Drapeaux des organisations internationales — ONU, UE, OTAN, UNESCO"
    : 'Flags of international organisations — UN, EU, NATO, UNESCO'
  const description = isFr
    ? "Découvrez les drapeaux des organisations internationales : ONU, Union européenne, OTAN, UNESCO, Union africaine et bien d'autres. Origine, symbolique et couleurs de chaque emblème."
    : 'Browse the flags of international organisations: the UN, European Union, NATO, UNESCO, the African Union and more. Origin, symbolism and colours of each emblem.'

  const path = '/organisations'
  const url = `${BASE_URL}/${locale}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'KnowFlags',
      locale: isFr ? 'fr_FR' : 'en_US',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default function Page() {
  return <OrganisationsPage />
}
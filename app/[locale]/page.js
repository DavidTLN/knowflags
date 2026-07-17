// app/[locale]/page.js
import Hero from '@/components/Hero'
import CategoryGrid from '@/components/CategoryGrid'
import TrueSizeModule from '@/components/TrueSizeModule'
import LatestArticles from '@/components/LatestArticles'
import { getAllPosts } from '@/lib/contentful'
import Footer from '@/components/Footer'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'KnowFlags — Explorez le monde à travers les drapeaux'
    : 'KnowFlags — Explore the World Through Flags'
  const description = isFr
    ? 'Quiz de drapeaux, cartes interactives, faits sur les pays — apprenez la géographie en jouant sur KnowFlags.'
    : 'Flag quizzes, interactive maps, country facts — learn world geography while playing on KnowFlags.'
  const url = `${BASE_URL}/${locale}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en`,
        fr: `${BASE_URL}/fr`,
        'x-default': `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'KnowFlags',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isFr ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  }
}

export default async function Home({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  let latestPosts = []
  try { latestPosts = (await getAllPosts(locale)).slice(0, 5) } catch { latestPosts = [] }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KnowFlags',
    url: BASE_URL,
    description: isFr
      ? 'Quiz de drapeaux et exploration géographique interactive.'
      : 'Flag quizzes and interactive geographical exploration.',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/${locale}/countries?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Hero />
        <CategoryGrid />
        <LatestArticles posts={latestPosts} locale={locale} />
        <TrueSizeModule />
        <Footer />
      </main>
    </>
  )
}
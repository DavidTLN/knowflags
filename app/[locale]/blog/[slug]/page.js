// app/[locale]/blog/page.js

import BlogListPage from '@/components/blog/BlogListPage'
import { getAllPosts } from '@/lib/contentful'

const BASE_URL = 'https://knowflags.com'

export const revalidate = 60 // ISR — refresh every 60s after a new publish

// The listing page had no metadata at all: no title, no description,
// no canonical and no hreflang.
export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'

  const title = isFr
    ? 'Blog — Drapeaux, vexillologie et géographie'
    : 'Blog — Flags, vexillology and geography'
  const description = isFr
    ? "Articles sur les drapeaux du monde : histoire, symbolique, anecdotes et vexillologie. Comprendre ce que racontent les drapeaux."
    : 'Articles about the flags of the world: history, symbolism, stories and vexillology. Understand what flags actually say.'

  const url = `${BASE_URL}/${locale}/blog`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/blog`,
        fr: `${BASE_URL}/fr/blog`,
        'x-default': `${BASE_URL}/en/blog`,
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

export default async function BlogPage({ params }) {
  const { locale } = await params

  let posts = []
  try {
    posts = await getAllPosts(locale)
  } catch (err) {
    console.error('Contentful error:', err?.message)
  }

  const url = `${BASE_URL}/${locale}/blog`

  // Blog structured data — helps Google associate the posts with the section.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'KnowFlags Blog',
    url,
    inLanguage: locale,
    blogPost: (posts || []).slice(0, 20).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      url: `${BASE_URL}/${locale}/blog/${p.slug}`,
      ...(p.coverImage ? { image: [p.coverImage] } : {}),
      ...(p.publishedAt || p.date || p.publishDate
        ? { datePublished: p.publishedAt || p.date || p.publishDate }
        : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogListPage posts={posts} />
    </>
  )
}
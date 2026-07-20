// app/[locale]/blog/[slug]/page.js

import { notFound } from 'next/navigation'
import BlogPostPage from '@/components/blog/BlogPostPage'
import { getPostBySlug, getAllSlugs } from '@/lib/contentful'

const BASE_URL = 'https://knowflags.com'

export const revalidate = 60 // ISR — même cadence que la liste

// ── Génération statique des slugs connus ──────────────────────────────────
// Next.js pré-génère chaque article au build, et l'ISR (revalidate: 60)
// s'occupe des articles ajoutés/modifiés après.
export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs()
    // Un article existe potentiellement en EN et en FR — on génère les 2 variantes.
    return slugs.flatMap(slug => [
      { locale: 'en', slug },
      { locale: 'fr', slug },
    ])
  } catch (err) {
    console.error('generateStaticParams (blog) error:', err?.message)
    return []
  }
}

// ── Metadata SEO ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { locale, slug } = await params
  const isFr = locale === 'fr'

  let post = null
  try {
    post = await getPostBySlug(slug, locale)
  } catch (err) {
    console.error('generateMetadata (blog post) error:', err?.message)
  }

  if (!post) {
    return {
      title: isFr ? 'Article introuvable — KnowFlags' : 'Article not found — KnowFlags',
      robots: { index: false, follow: false },
    }
  }

  const url = `${BASE_URL}/${locale}/blog/${slug}`
  const title = `${post.title} — KnowFlags`
  const description = post.excerpt || (isFr
    ? 'Article du blog KnowFlags sur les drapeaux et la vexillologie.'
    : 'KnowFlags blog post about flags and vexillology.')

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/blog/${slug}`,
        fr: `${BASE_URL}/fr/blog/${slug}`,
        'x-default': `${BASE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      siteName: 'KnowFlags',
      locale: isFr ? 'fr_FR' : 'en_US',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      tags: post.tags,
      images: post.coverImage
        ? [{ url: post.coverImage, alt: post.coverAlt || post.title }]
        : [{ url: '/og-image.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : ['/og-image.png'],
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function BlogArticlePage({ params }) {
  const { locale, slug } = await params

  let post = null
  try {
    post = await getPostBySlug(slug, locale)
  } catch (err) {
    console.error('BlogArticlePage error:', err?.message)
  }

  if (!post) notFound()

  const url = `${BASE_URL}/${locale}/blog/${slug}`

  // JSON-LD BlogPosting — cohérent avec le JSON-LD Blog déjà présent sur la liste.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url,
    inLanguage: locale,
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    publisher: {
      '@type': 'Organization',
      name: 'KnowFlags',
      url: BASE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostPage post={post} />
    </>
  )
}
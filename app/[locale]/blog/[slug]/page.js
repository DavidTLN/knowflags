// app/[locale]/blog/[slug]/page.js

import { getPostBySlug, getAllSlugs, getAllPosts } from '@/lib/contentful'
import BlogPostPage from '@/components/blog/BlogPostPage'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const RELATED_LIMIT = 6

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs()
    return slugs.map(slug => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params
  try {
    const post = await getPostBySlug(slug, locale)
    if (!post) return {}
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        images: post.coverImage ? [post.coverImage] : [],
      },
    }
  } catch {
    return {}
  }
}

// ── Related posts: shared tags first, then most recent ──────────────────────
function pickRelated(post, allPosts) {
  const currentTags = new Set((post.tags ?? []).map(tag => String(tag).toLowerCase()))

  return allPosts
    .filter(p => p.slug !== post.slug)
    .map(p => ({
      post: p,
      score: (p.tags ?? []).reduce(
        (acc, tag) => acc + (currentTags.has(String(tag).toLowerCase()) ? 1 : 0),
        0
      ),
      time: p.publishedAt ? new Date(p.publishedAt).getTime() : 0,
    }))
    .sort((a, b) => (b.score - a.score) || (b.time - a.time))
    .slice(0, RELATED_LIMIT)
    .map(entry => entry.post)
}

export default async function PostPage({ params }) {
  const { locale, slug } = await params

  let post = null
  try {
    post = await getPostBySlug(slug, locale)
  } catch (err) {
    console.error('Contentful error:', err?.message)
  }
  if (!post) notFound()

  let relatedPosts = []
  try {
    const allPosts = await getAllPosts(locale)
    relatedPosts = pickRelated(post, allPosts)
  } catch (err) {
    console.error('Contentful related posts error:', err?.message)
  }

  return <BlogPostPage post={post} relatedPosts={relatedPosts} />
}
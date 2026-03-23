// app/[locale]/blog/[slug]/page.js

import BlogPostPage from '@/components/blog/BlogPostPage'
import { getPostBySlug, getAllSlugs } from '@/lib/contentful'

export const revalidate = 60 // ISR — refresh every 60s

// Pre-generate all article pages at build time
export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export default async function PostPage({ params }) {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug, locale)
  return <BlogPostPage post={post} />
}
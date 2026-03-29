import { getPostBySlug, getAllSlugs } from '@/lib/contentful'
import BlogPostPage from '@/components/blog/BlogPostPage'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

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

export default async function PostPage({ params }) {
  const { locale, slug } = await params
  let post = null
  try {
    post = await getPostBySlug(slug, locale)
  } catch (err) {
    console.error('Contentful error:', err?.message)
  }
  if (!post) notFound()
  return <BlogPostPage post={post} />
}
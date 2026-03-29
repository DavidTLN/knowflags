import BlogPostPage from '@/components/blog/BlogPostPage'
import { getPostBySlug, getAllSlugs } from '@/lib/contentful'

export const revalidate = 60
export const dynamicParams = true  // ← ajoute cette ligne

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export default async function PostPage({ params }) {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug, locale)
  return <BlogPostPage post={post} />
}
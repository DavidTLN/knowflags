// app/[locale]/blog/page.js

import BlogListPage from '@/components/blog/BlogListPage'
import { getAllPosts } from '@/lib/contentful'

export const revalidate = 60 // ISR — refresh every 60s after a new publish

export default async function BlogPage({ params }) {
  const { locale } = await params
  const posts = await getAllPosts(locale)
  return <BlogListPage posts={posts} />
}
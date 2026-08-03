// app/[locale]/forum/[cat]/page.js
//
// SERVER Component. Résout la sous-catégorie par son slug, charge ses sujets
// (épinglés d'abord, puis par dernière activité) et l'auteur de chacun.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ForumCategory from '@/components/forum/ForumCategory'

const BASE_URL = 'https://knowflags.com'
export const revalidate = 30

async function getCategory(supabase, slug) {
  const { data } = await supabase
    .from('forum_categories')
    .select('id, parent_id, slug, name_fr, name_en, description_fr, description_en, icon')
    .eq('slug', slug)
    .single()
  if (!data) return null
  // parent (pour le fil d'ariane)
  let parent = null
  if (data.parent_id) {
    const { data: p } = await supabase
      .from('forum_categories')
      .select('slug, name_fr, name_en')
      .eq('id', data.parent_id)
      .single()
    parent = p || null
  }
  return { ...data, parent }
}

export async function generateMetadata({ params }) {
  const { locale, cat } = await params
  const supabase = await createClient()
  const category = await getCategory(supabase, cat)
  if (!category) return { title: 'Forum' }
  const name = locale === 'fr' ? category.name_fr : category.name_en
  const path = `/forum/${cat}`
  return {
    title: `${name} — Forum`,
    description: locale === 'fr' ? category.description_fr : category.description_en,
    alternates: {
      canonical: `${BASE_URL}/${locale}${path}`,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
      },
    },
  }
}

export default async function Page({ params }) {
  const { locale, cat } = await params
  const supabase = await createClient()

  const category = await getCategory(supabase, cat)
  if (!category) notFound()

  // Sujets de la catégorie : épinglés d'abord, puis dernière activité.
  const { data: topicsRaw } = await supabase
    .from('forum_topics')
    .select('id, title, slug, status, is_pinned, is_resolved, reply_count, view_count, last_post_at, author_id, created_at')
    .eq('category_id', category.id)
    .eq('moderation', 'approved')
    .neq('status', 'archived')
    .order('is_pinned', { ascending: false })
    .order('last_post_at', { ascending: false })
    .limit(50)

  const topics = topicsRaw || []

  // Auteurs (username + avatar) en une requête.
  const authorIds = [...new Set(topics.map(t => t.author_id).filter(Boolean))]
  let profilesById = {}
  if (authorIds.length) {
    const { data: profs } = await supabase
      .from('public_profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', authorIds)
    for (const p of (profs || [])) profilesById[p.user_id] = p
  }

  const topicsWithAuthor = topics.map(t => ({
    ...t,
    author: t.author_id ? (profilesById[t.author_id] || null) : null,
  }))

  // Stats de la catégorie pour l'en-tête
  const stats = {
    topicCount: topics.length,
    replyCount: topics.reduce((sum, t) => sum + (t.reply_count || 0), 0),
    lastActivity: topics.length ? topics.map(t => t.last_post_at).sort().reverse()[0] : null,
  }

  return (
    <ForumCategory
      category={category}
      topics={topicsWithAuthor}
      stats={stats}
      locale={locale}
    />
  )
}
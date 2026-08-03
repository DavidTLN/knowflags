// app/[locale]/forum/[cat]/[topic]/page.js
//
// SERVER Component. Charge le sujet, ses messages (approuvés, non supprimés),
// les profils des auteurs, l'état des likes, et incrémente le compteur de vues.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ForumThread from '@/components/forum/ForumThread'

const BASE_URL = 'https://knowflags.com'
export const revalidate = 15

async function loadTopic(supabase, catSlug, topicSlug) {
  // Résoudre la catégorie
  const { data: category } = await supabase
    .from('forum_categories')
    .select('id, slug, name_fr, name_en, parent_id')
    .eq('slug', catSlug)
    .single()
  if (!category) return null

  // Le sujet (dans cette catégorie, approuvé, non archivé)
  const { data: topic } = await supabase
    .from('forum_topics')
    .select('id, category_id, title, slug, status, is_pinned, is_resolved, view_count, reply_count, author_id, created_at')
    .eq('category_id', category.id)
    .eq('slug', topicSlug)
    .eq('moderation', 'approved')
    .single()
  if (!topic) return null

  // Parent (fil d'ariane)
  let parent = null
  if (category.parent_id) {
    const { data: p } = await supabase
      .from('forum_categories').select('slug, name_fr, name_en').eq('id', category.parent_id).single()
    parent = p || null
  }

  // Messages du sujet
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, author_id, body, is_first_post, edited_at, created_at')
    .eq('topic_id', topic.id)
    .eq('moderation', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  const postList = posts || []

  // Profils + rôles des auteurs
  const authorIds = [...new Set(postList.map(p => p.author_id).filter(Boolean))]
  let profilesById = {}, rolesById = {}, likeCounts = {}
  if (authorIds.length) {
    const { data: profs } = await supabase
      .from('public_profiles')
      .select('user_id, username, avatar_url, created_at')
      .in('user_id', authorIds)
    for (const p of (profs || [])) profilesById[p.user_id] = p

    const { data: roles } = await supabase
      .from('forum_roles').select('user_id, role').in('user_id', authorIds)
    for (const r of (roles || [])) rolesById[r.user_id] = r.role
  }

  // Compteurs de likes par message
  const postIds = postList.map(p => p.id)
  if (postIds.length) {
    const { data: likes } = await supabase
      .from('forum_post_likes').select('post_id').in('post_id', postIds)
    for (const l of (likes || [])) likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1
  }

  const posts2 = postList.map(p => ({
    ...p,
    author: p.author_id ? (profilesById[p.author_id] || null) : null,
    authorRole: p.author_id ? (rolesById[p.author_id] || null) : null,
    likeCount: likeCounts[p.id] || 0,
  }))

  return { category, parent, topic, posts: posts2 }
}

export async function generateMetadata({ params }) {
  const { locale, cat, topic } = await params
  const supabase = await createClient()
  const data = await loadTopic(supabase, cat, topic)
  if (!data) return { title: 'Forum' }
  const path = `/forum/${cat}/${topic}`
  return {
    title: `${data.topic.title} — Forum`,
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
  const { locale, cat, topic } = await params
  const supabase = await createClient()

  const data = await loadTopic(supabase, cat, topic)
  if (!data) notFound()

  // Incrément best-effort du compteur de vues (ne bloque pas le rendu).
  try {
    await supabase
      .from('forum_topics')
      .update({ view_count: (data.topic.view_count || 0) + 1 })
      .eq('id', data.topic.id)
  } catch { /* silencieux */ }

  return (
    <ForumThread
      category={data.category}
      parent={data.parent}
      topic={data.topic}
      initialPosts={data.posts}
      locale={locale}
    />
  )
}
// app/[locale]/forum/[cat]/[topic]/page.js
//
// SERVER Component. Charge le sujet, ses messages (approuvés, non supprimés),
// les profils des auteurs, l'état des likes, et incrémente le compteur de vues.
//
// SEO : le chargement passe par React `cache()`, donc `generateMetadata` et le
// rendu de la page partagent le même résultat au lieu de requêter deux fois.
// Un sujet placé dans une section masquée ou réservée aux membres, ou un sujet
// archivé, est rendu en `noindex` : il reste consultable par ceux qui ont le
// lien mais ne rentre pas dans l'index Google.

import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ForumThread from '@/components/forum/ForumThread'

const BASE_URL = 'https://knowflags.com'
export const revalidate = 15

// Texte brut a partir d'un corps de message (markdown ou HTML léger),
// pour la meta description et le JSON-LD.
function plain(body, max = 300) {
  if (!body) return ''
  const text = String(body)
    .replace(/<[^>]+>/g, ' ')                 // balises
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')    // images markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // liens markdown
    .replace(/[*_`>#~]/g, '')                 // marqueurs markdown
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

const loadTopic = cache(async function loadTopic(catSlug, topicSlug) {
  const supabase = await createClient()

  // Résoudre la catégorie
  const { data: category } = await supabase
    .from('forum_categories')
    .select('id, slug, name_fr, name_en, parent_id, is_hidden, min_role_to_view')
    .eq('slug', catSlug)
    .single()
  if (!category) return null

  // Le sujet (dans cette catégorie, approuvé, non archivé)
  const { data: topic } = await supabase
    .from('forum_topics')
    .select('id, category_id, title, slug, status, is_pinned, is_resolved, view_count, reply_count, author_id, created_at, last_post_at, updated_at')
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
})

// Un sujet n'est indexable que s'il est public et vivant.
function isIndexable(data) {
  if (!data) return false
  const { category, topic } = data
  if (category.is_hidden) return false
  if (category.min_role_to_view !== 'public') return false
  if (topic.status === 'archived') return false
  return true
}

export async function generateMetadata({ params }) {
  const { locale, cat, topic } = await params
  const data = await loadTopic(cat, topic)
  if (!data) return { title: 'Forum', robots: { index: false, follow: false } }

  const isFr = locale === 'fr'
  const path = `/forum/${cat}/${topic}`
  const url = `${BASE_URL}/${locale}${path}`
  const categoryName = isFr ? data.category.name_fr : data.category.name_en

  const first = data.posts.find(p => p.is_first_post) || data.posts[0]
  const description =
    plain(first?.body, 155) ||
    (isFr
      ? `Discussion dans ${categoryName} sur le forum KnowFlags.`
      : `Discussion in ${categoryName} on the KnowFlags forum.`)

  const title = `${data.topic.title} — ${categoryName} | Forum KnowFlags`
  const indexable = isIndexable(data)

  return {
    title,
    description,
    robots: indexable ? undefined : { index: false, follow: true },
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
      },
    },
    openGraph: {
      type: 'article',
      title: data.topic.title,
      description,
      url,
      siteName: 'KnowFlags',
      locale: isFr ? 'fr_FR' : 'en_US',
      publishedTime: data.topic.created_at,
      modifiedTime: data.topic.last_post_at || data.topic.updated_at || data.topic.created_at,
      authors: first?.author?.username ? [first.author.username] : undefined,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: data.topic.title }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

// JSON-LD DiscussionForumPosting : Google s'en sert depuis 2024 pour afficher
// les résultats de forum avec le nombre de réponses et l'auteur.
function buildJsonLd(data, locale, cat, topicSlug) {
  const url = `${BASE_URL}/${locale}/forum/${cat}/${topicSlug}`
  const first = data.posts.find(p => p.is_first_post) || data.posts[0]
  const replies = data.posts.filter(p => p !== first)

  const person = (username) => ({
    '@type': 'Person',
    name: username || 'KnowFlags',
    ...(username ? { url: `${BASE_URL}/${locale}/forum/u/${username}` } : {}),
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': url,
    url,
    headline: data.topic.title,
    datePublished: data.topic.created_at,
    dateModified: data.topic.last_post_at || data.topic.updated_at || data.topic.created_at,
    author: person(first?.author?.username),
    articleBody: plain(first?.body, 5000),
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    isPartOf: {
      '@type': 'WebPage',
      name: locale === 'fr' ? data.category.name_fr : data.category.name_en,
      url: `${BASE_URL}/${locale}/forum/${cat}`,
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: replies.length,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: data.topic.view_count || 0,
      },
    ],
    ...(replies.length
      ? {
          comment: replies.slice(0, 20).map(p => ({
            '@type': 'Comment',
            text: plain(p.body, 1000),
            datePublished: p.created_at,
            author: person(p.author?.username),
            ...(p.likeCount
              ? {
                  interactionStatistic: {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/LikeAction',
                    userInteractionCount: p.likeCount,
                  },
                }
              : {}),
          })),
        }
      : {}),
  }
}

export default async function Page({ params }) {
  const { locale, cat, topic } = await params

  const data = await loadTopic(cat, topic)
  if (!data) notFound()

  // Incrément best-effort du compteur de vues (ne bloque pas le rendu).
  // NOTE : la policy RLS `forum_topics_update_mod` limite l'UPDATE aux
  // modérateurs, donc cet appel échoue silencieusement pour un visiteur
  // anonyme. Pour compter réellement les vues il faudra une fonction
  // SECURITY DEFINER dédiée (increment_topic_views).
  try {
    const supabase = await createClient()
    await supabase
      .from('forum_topics')
      .update({ view_count: (data.topic.view_count || 0) + 1 })
      .eq('id', data.topic.id)
  } catch { /* silencieux */ }

  const jsonLd = isIndexable(data) ? buildJsonLd(data, locale, cat, topic) : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ForumThread
        category={data.category}
        parent={data.parent}
        topic={data.topic}
        initialPosts={data.posts}
        locale={locale}
      />
    </>
  )
}
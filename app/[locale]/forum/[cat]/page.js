// app/[locale]/forum/[cat]/page.js
//
// SERVER Component. Résout la sous-catégorie par son slug, charge ses sujets
// (épinglés d'abord, puis par dernière activité) et l'auteur de chacun.
//
// SEO : chargement mutualisé entre `generateMetadata` et le rendu via React
// `cache()`. Une section masquée ou réservée aux membres est rendue en
// `noindex`. Un fil d'ariane JSON-LD accompagne la page.

import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ForumCategory from '@/components/forum/ForumCategory'

const BASE_URL = 'https://knowflags.com'
export const revalidate = 30

const getCategory = cache(async function getCategory(slug) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('forum_categories')
    .select('id, parent_id, slug, name_fr, name_en, description_fr, description_en, icon, is_hidden, min_role_to_view, updated_at')
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
})

const isIndexable = (category) =>
  !!category && !category.is_hidden && category.min_role_to_view === 'public'

export async function generateMetadata({ params }) {
  const { locale, cat } = await params
  const category = await getCategory(cat)
  if (!category) return { title: 'Forum', robots: { index: false, follow: false } }

  const isFr = locale === 'fr'
  const name = isFr ? category.name_fr : category.name_en
  const path = `/forum/${cat}`
  const url = `${BASE_URL}/${locale}${path}`

  const description =
    (isFr ? category.description_fr : category.description_en) ||
    (isFr
      ? `Discussions sur ${name} : questions, découvertes et échanges entre passionnés de drapeaux et de géographie.`
      : `Discussions about ${name}: questions, discoveries and exchanges between flag and geography enthusiasts.`)

  const title = `${name} — Forum KnowFlags`

  return {
    title,
    description,
    robots: isIndexable(category) ? undefined : { index: false, follow: true },
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
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

function buildJsonLd(category, topics, locale, cat) {
  const isFr = locale === 'fr'
  const name = isFr ? category.name_fr : category.name_en
  const url = `${BASE_URL}/${locale}/forum/${cat}`

  const crumbs = [
    { name: 'Forum', item: `${BASE_URL}/${locale}/forum` },
  ]
  if (category.parent) {
    crumbs.push({
      name: isFr ? category.parent.name_fr : category.parent.name_en,
      item: `${BASE_URL}/${locale}/forum/${category.parent.slug}`,
    })
  }
  crumbs.push({ name, item: url })

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.item,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name,
      url,
      inLanguage: isFr ? 'fr-FR' : 'en-US',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: topics.slice(0, 25).map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t.title,
          url: `${BASE_URL}/${locale}/forum/${cat}/${t.slug}`,
        })),
      },
    },
  ]
}

export default async function Page({ params }) {
  const { locale, cat } = await params
  const supabase = await createClient()

  const category = await getCategory(cat)
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

  const jsonLd = isIndexable(category) ? buildJsonLd(category, topics, locale, cat) : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ForumCategory
        category={category}
        topics={topicsWithAuthor}
        stats={stats}
        locale={locale}
      />
    </>
  )
}
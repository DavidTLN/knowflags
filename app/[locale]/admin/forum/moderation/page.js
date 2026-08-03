// DESTINATION: app/[locale]/admin/forum/moderation/page.js
//
// File de moderation du forum : signalements, contenus en attente de validation,
// et journal des actions. Meme garde-fou d'acces que /admin/submissions.
//
// NOTE : aucune cle etrangere ne relie forum_reports a forum_posts /
// forum_topics, donc pas de jointure PostgREST — on requete separement et on
// recompose les liens en memoire.

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminForumModeration from '@/components/admin/AdminForumModeration'

export const metadata = {
  title: 'Forum moderation | Admin — KnowFlags',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminForumModerationPage({ params }) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('user_id', session.user.id).single()
  if (!profile?.is_admin) redirect(`/${locale}`)

  // ── Sources ────────────────────────────────────────────────────────────────
  const [{ data: reports }, { data: pendingTopics }, { data: pendingPosts }, { data: log }] =
    await Promise.all([
      supabase.from('forum_reports')
        .select('id, post_id, topic_id, reporter_user_id, reason, description, status, admin_note, handled_by, created_at, resolved_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('forum_topics')
        .select('id, category_id, title, slug, author_id, created_at, moderation')
        .eq('moderation', 'pending')
        .order('created_at', { ascending: true })
        .limit(200),
      supabase.from('forum_posts')
        .select('id, topic_id, author_id, body, created_at, moderation')
        .eq('moderation', 'pending')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(200),
      supabase.from('forum_mod_log')
        .select('id, actor_id, action, target_type, target_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(60),
    ])

  const reportList = reports || []
  const topicQueue = pendingTopics || []
  const postQueue = pendingPosts || []
  const modLog = log || []

  // ── Recomposition des references ───────────────────────────────────────────
  const reportedPostIds = reportList.map(r => r.post_id).filter(Boolean)
  let reportedPosts = []
  if (reportedPostIds.length) {
    const { data } = await supabase.from('forum_posts')
      .select('id, topic_id, author_id, body, created_at, moderation, deleted_at')
      .in('id', reportedPostIds)
    reportedPosts = data || []
  }

  const topicIds = [...new Set([
    ...reportList.map(r => r.topic_id).filter(Boolean),
    ...reportedPosts.map(p => p.topic_id).filter(Boolean),
    ...postQueue.map(p => p.topic_id).filter(Boolean),
  ])]
  let topicsById = {}
  if (topicIds.length) {
    const { data } = await supabase.from('forum_topics')
      .select('id, category_id, title, slug, status, moderation')
      .in('id', topicIds)
    for (const t of (data || [])) topicsById[t.id] = t
  }

  const categoryIds = [...new Set([
    ...Object.values(topicsById).map(t => t.category_id),
    ...topicQueue.map(t => t.category_id),
  ].filter(Boolean))]
  let categoriesById = {}
  if (categoryIds.length) {
    const { data } = await supabase.from('forum_categories')
      .select('id, slug, name_fr, name_en')
      .in('id', categoryIds)
    for (const c of (data || [])) categoriesById[c.id] = c
  }

  const userIds = [...new Set([
    ...reportList.map(r => r.reporter_user_id),
    ...reportList.map(r => r.handled_by),
    ...reportedPosts.map(p => p.author_id),
    ...topicQueue.map(t => t.author_id),
    ...postQueue.map(p => p.author_id),
    ...modLog.map(l => l.actor_id),
  ].filter(Boolean))]
  let usersById = {}
  if (userIds.length) {
    const { data } = await supabase.from('public_profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds)
    for (const u of (data || [])) usersById[u.user_id] = u
  }

  const postsById = {}
  for (const p of reportedPosts) postsById[p.id] = p

  // ── Vues pretes a afficher ─────────────────────────────────────────────────
  const linkFor = (topic) => {
    if (!topic) return null
    const cat = categoriesById[topic.category_id]
    if (!cat?.slug || !topic.slug) return null
    return `/${locale}/forum/${cat.slug}/${topic.slug}`
  }

  const reportsView = reportList.map(r => {
    const post = r.post_id ? postsById[r.post_id] || null : null
    const topic = topicsById[r.topic_id || post?.topic_id] || null
    return {
      ...r,
      reporter: usersById[r.reporter_user_id] || null,
      handler: r.handled_by ? usersById[r.handled_by] || null : null,
      post: post ? { ...post, author: usersById[post.author_id] || null } : null,
      topic: topic
        ? { ...topic, category: categoriesById[topic.category_id] || null }
        : null,
      href: linkFor(topic),
    }
  })

  const topicsView = topicQueue.map(t => ({
    ...t,
    author: usersById[t.author_id] || null,
    category: categoriesById[t.category_id] || null,
  }))

  const postsView = postQueue.map(p => {
    const topic = topicsById[p.topic_id] || null
    return {
      ...p,
      author: usersById[p.author_id] || null,
      topic: topic ? { ...topic, category: categoriesById[topic.category_id] || null } : null,
      href: linkFor(topic),
    }
  })

  const logView = modLog.map(l => ({ ...l, actor: usersById[l.actor_id] || null }))

  return (
    <AdminForumModeration
      locale={locale}
      reports={reportsView}
      pendingTopics={topicsView}
      pendingPosts={postsView}
      modLog={logView}
    />
  )
}
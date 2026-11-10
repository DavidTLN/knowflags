// DESTINATION: app/[locale]/admin/forum/page.js
import { createAuthClient as createClient } from '@/lib/supabase-server-auth'
import { redirect } from 'next/navigation'
import AdminForumCategories from '@/components/admin/AdminForumCategories'

export const metadata = {
  title: 'Forum | Admin — KnowFlags',
  robots: { index: false, follow: false },
}

export default async function AdminForumPage({ params }) {
  const { locale } = await params
  const supabase = await createClient()

  // getUser verifie le jeton aupres de Supabase (getSession se contente du cookie)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const session = authUser ? { user: authUser } : null
  if (!session) redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/admin/forum`)}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single()

  if (!profile?.is_admin) redirect(`/${locale}`)

  const { data: categories } = await supabase
    .from('forum_categories')
    .select('id, parent_id, slug, name_fr, name_en, description_fr, description_en, icon, color, position, is_hidden, min_role_to_view, min_role_to_post')
    .order('position', { ascending: true })

  const { data: stats } = await supabase
    .from('forum_subcategory_stats')
    .select('category_id, topic_count, reply_count')

  const statsMap = {}
  ;(stats || []).forEach(s => { statsMap[s.category_id] = s })

  return (
    <AdminForumCategories
      initialCategories={categories || []}
      stats={statsMap}
      locale={locale}
    />
  )
}
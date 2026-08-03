// DESTINATION: app/[locale]/admin/forum/page.js
//
// Panneau d'administration du forum — gestion de la structure (catégories
// niveau 1 et 2). Protégé : réservé aux admins (même pattern que /admin/submissions).

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminForumCategories from '@/components/forum/admin/AdminForumCategories'

export const metadata = { title: 'Forum structure | Admin — KnowFlags' }

export default async function AdminForumPage({ params }) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single()

  if (!profile?.is_admin) redirect(`/${locale}`)

  const { data: cats } = await supabase
    .from('forum_categories')
    .select('id, parent_id, slug, name_fr, name_en, description_fr, description_en, icon, color, position, is_hidden')
    .order('position', { ascending: true })

  return <AdminForumCategories initialCategories={cats || []} locale={locale} />
}
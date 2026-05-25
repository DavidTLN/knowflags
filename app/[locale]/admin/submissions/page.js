// DESTINATION: app/[locale]/admin/submissions/page.js
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminSubmissionsList from '@/components/admin/AdminSubmissionsList'

export const metadata = { title: 'Submissions | Admin — KnowFlags' }

export default async function AdminSubmissionsPage({ params }) {
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

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  const userIds = [...new Set((submissions || []).map(s => s.user_id).filter(Boolean))]
  let profilesMap = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds)
    if (profiles) profiles.forEach(p => { profilesMap[p.user_id] = p })
  }
  const enriched = (submissions || []).map(s => ({ ...s, profiles: profilesMap[s.user_id] || null }))

  return <AdminSubmissionsList submissions={enriched} locale={locale} />
}
// DESTINATION: app/[locale]/admin/reports/page.js
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminReportsList from '@/components/admin/AdminReportsList'

export const metadata = { title: 'Reports | Admin — KnowFlags' }

export default async function AdminReportsPage({ params }) {
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

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  const codes = [...new Set((reports || []).map(r => r.country_code).filter(Boolean))]
  let namesMap = {}
  if (codes.length > 0) {
    const { data: countries } = await supabase
      .from('countries')
      .select('iso_code, name_en, name_fr')
      .in('iso_code', codes)
    if (countries) countries.forEach(c => { namesMap[c.iso_code] = c })
  }

  const userIds = [...new Set((reports || []).map(r => r.reporter_user_id).filter(Boolean))]
  let profilesMap = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds)
    if (profiles) profiles.forEach(p => { profilesMap[p.user_id] = p })
  }

  const enriched = (reports || []).map(r => ({
    ...r,
    country: namesMap[r.country_code] || null,
    reporter: profilesMap[r.reporter_user_id] || null,
  }))

  return <AdminReportsList reports={enriched} locale={locale} />
}
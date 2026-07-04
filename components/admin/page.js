// DESTINATION: app/[locale]/admin/page.js
import { createClient } from '@/lib/supabase-server'
import AdminDashboard from '@/components/admin/AdminDashboard'

export const metadata = { title: 'Admin — KnowFlags' }

export default async function AdminPage({ params }) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  let isAdmin = false
  let pendingReports = 0
  let pendingSubs = 0

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single()
    isAdmin = !!profile?.is_admin

    if (isAdmin) {
      const [rep, sub] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      pendingReports = rep.count || 0
      pendingSubs = sub.count || 0
    }
  }

  return (
    <AdminDashboard
      locale={locale}
      authed={!!session}
      isAdmin={isAdmin}
      email={session?.user?.email || null}
      pendingReports={pendingReports}
      pendingSubs={pendingSubs}
    />
  )
}
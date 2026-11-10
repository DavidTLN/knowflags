// DESTINATION: app/[locale]/admin/submissions/[id]/page.js
import { createAuthClient as createClient } from '@/lib/supabase-server-auth'
import { redirect } from 'next/navigation'
import AdminSubmissionDetail from '@/components/admin/AdminSubmissionDetail'

export default async function AdminSubmissionDetailPage({ params }) {
  const { locale, id } = await params
  const supabase = await createClient()

  // getUser verifie le jeton aupres de Supabase (getSession se contente du cookie)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const session = authUser ? { user: authUser } : null
  if (!session) redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/admin/submissions/${id}`)}`)

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('user_id', session.user.id).single()
  if (!profile?.is_admin) redirect(`/${locale}`)

  const { data: submission } = await supabase
    .from('submissions').select('*').eq('id', id).single()
  if (!submission) redirect(`/${locale}/admin/submissions`)

  const { data: submitterProfile } = await supabase
    .from('profiles').select('username, avatar_url').eq('user_id', submission.user_id).single()

  // Generate signed URL for private bucket preview
  let signedFileUrl = null
  if (submission.file_path) {
    const { data: signed } = await supabase.storage
      .from('flag-submissions')
      .createSignedUrl(submission.file_path, 3600) // 1 hour
    signedFileUrl = signed?.signedUrl || null
  }

  const enriched = { ...submission, profiles: submitterProfile || null, signedFileUrl }

  return <AdminSubmissionDetail submission={enriched} locale={locale} />
}
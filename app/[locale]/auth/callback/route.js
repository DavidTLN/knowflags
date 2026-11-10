import { createAuthClient } from '@/lib/supabase-server-auth'
import { NextResponse } from 'next/server'

// Retour des liens d'authentification :
//  - ?code=...                     OAuth (Google, GitHub) et liens e-mail en PKCE
//  - ?token_hash=...&type=recovery liens e-mail independants de l'appareil
//                                  (gabarit Supabase avec {{ .TokenHash }})
// Le client lit et ecrit les cookies de session : sans eux, l'echange PKCE echoue.
export async function GET(request) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const seg = pathname.split('/').filter(Boolean)[0]
  const locale = ['en', 'fr'].includes(seg) ? seg : (searchParams.get('locale') || 'en')

  const nextParam = searchParams.get('next')
  const isRecovery = type === 'recovery' || (nextParam || '').includes('/reset-password')
  const fallbackNext = isRecovery ? `/${locale}/auth/reset-password` : `/${locale}`
  const dest = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : fallbackNext

  const supabase = await createAuthClient()
  let error = null

  if (code) {
    ;({ error } = await supabase.auth.exchangeCodeForSession(code))
  } else if (tokenHash && type) {
    ;({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
  } else {
    error = new Error('missing code')
  }

  if (!error) return NextResponse.redirect(`${origin}${dest}`)

  console.error('auth callback error:', error.message)
  // Lien de reinitialisation invalide ou expire : la page affiche « Lien expire » et renvoie vers la connexion
  if (isRecovery) return NextResponse.redirect(`${origin}/${locale}/auth/reset-password`)
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_error`)
}

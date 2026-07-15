import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const code = searchParams.get('code')

  // Locale depuis le chemin: /{locale}/auth/callback (fallback ?locale= puis 'en')
  const seg = pathname.split('/').filter(Boolean)[0]
  const locale = ['en', 'fr'].includes(seg) ? seg : (searchParams.get('locale') || 'en')

  // Destination post-login (optionnelle), sinon accueil localisé
  const nextParam = searchParams.get('next')
  const dest = nextParam && nextParam.startsWith('/') ? nextParam : `/${locale}`

  if (code) {
    const supabase = await createClient()
    // Echange le code OAuth (PKCE) contre une session — le code_verifier est lu depuis les cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  // En cas d'erreur, retour a la page de login localisee
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_error`)
}
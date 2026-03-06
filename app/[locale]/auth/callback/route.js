import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  // Recupere le code OAuth depuis l'URL
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = searchParams.get('locale') || 'en'

  if (code) {
    const supabase = await createClient()
    // Echange le code contre une session utilisateur
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirection vers la page d'accueil apres connexion reussie
      return NextResponse.redirect(`${origin}/${locale}`)
    }
  }

  // En cas d'erreur, retour a la page de login
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_error`)
}
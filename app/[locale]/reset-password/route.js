// Ancienne adresse des liens de reinitialisation (/{locale}/reset-password?code=...).
// Les e-mails deja envoyes pointent ici : on les renvoie vers le callback,
// qui echange le code contre une session puis ouvre la page du nouveau mot de passe.
import { NextResponse } from 'next/server'

export function GET(request) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const seg = pathname.split('/').filter(Boolean)[0]
  const locale = ['en', 'fr'].includes(seg) ? seg : 'en'

  const target = new URL(`${origin}/${locale}/auth/callback`)
  const code = searchParams.get('code')
  if (code) target.searchParams.set('code', code)
  target.searchParams.set('next', `/${locale}/auth/reset-password`)

  return NextResponse.redirect(target)
}

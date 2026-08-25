'use client'

import { createClient } from '@/lib/supabase-client'

export const LOCALES = ['en', 'fr']
const COOKIE   = 'NEXT_LOCALE'
const ONE_YEAR = 60 * 60 * 24 * 365

export function writeLocaleCookie(locale) {
  if (typeof document === 'undefined' || !LOCALES.includes(locale)) return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`
}

// Écrit la préférence en base si l'utilisateur est connecté (silencieux sinon).
export async function persistLocaleToProfile(locale) {
  if (!LOCALES.includes(locale)) return
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    await supabase.from('profiles').update({ locale }).eq('user_id', session.user.id)
  } catch (e) {
    console.error('persistLocaleToProfile:', e)
  }
}

export function localizedPath(pathname, from, to) {
  if (!pathname || pathname === '/') return `/${to}`
  if (pathname === `/${from}`) return `/${to}`
  if (pathname.startsWith(`/${from}/`)) return pathname.replace(`/${from}`, `/${to}`)
  return `/${to}`
}

// Point d'entrée unique du changement de langue.
export function switchLocale({ pathname, router, from, to }) {
  if (from === to || !LOCALES.includes(to)) return
  writeLocaleCookie(to)
  persistLocaleToProfile(to)
  const search = typeof window !== 'undefined' ? window.location.search : ''
  router.push(localizedPath(pathname, from, to) + search)
}
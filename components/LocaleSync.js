'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import { LOCALES, writeLocaleCookie, localizedPath } from '@/lib/locale'

export default function LocaleSync() {
  const locale   = useLocale()
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function sync() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session?.user) return

      const { data } = await supabase
        .from('profiles').select('locale').eq('user_id', session.user.id).single()
      if (cancelled) return

      const pref = LOCALES.includes(data?.locale) ? data.locale : null

      // Compte existant sans préférence : on adopte la langue en cours d'usage.
      if (!pref) {
        writeLocaleCookie(locale)
        await supabase.from('profiles').update({ locale }).eq('user_id', session.user.id)
        return
      }

      writeLocaleCookie(pref)
      if (pref !== locale) {
        router.replace(localizedPath(pathname, locale, pref) + window.location.search)
      }
    }

    sync()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') sync()
    })
    return () => { cancelled = true; sub?.subscription?.unsubscribe() }
  }, [locale, pathname, router])

  return null
}
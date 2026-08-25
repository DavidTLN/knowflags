import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  // Accept-Language reste utile, mais uniquement en dernier recours :
  // le cookie NEXT_LOCALE passe avant lui dans l'ordre de next-intl.
  localeDetection: true,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  // Accept-Language reste utile, mais uniquement en dernier recours :
  // le cookie NEXT_LOCALE passe avant lui dans l'ordre de next-intl.
  localeDetection: true,
  // Pas d'en-tête HTTP « Link: hreflang » : il pointait x-default vers l'URL sans
  // langue (/countries/gl, qui redirige), en contradiction avec les balises
  // hreflang du HTML (x-default = /en/...). Le HTML et le sitemap suffisent.
  alternateLinks: false,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
// lib/seo.js
// Helpers SEO — canonical auto-référençant + hreflang (i18n) pour KnowFlags.
//
// Usage dans un generateMetadata :
//   import { pageAlternates } from '@/lib/seo'
//   ...
//   alternates: pageAlternates(locale, '/countries')
//
// `path` = chemin SANS locale ni domaine :
//   ''                       → home
//   '/countries'             → liste pays
//   `/countries/${code}`     → page pays
//   `/continents/${slug}`    → page continent

const BASE_URL = 'https://knowflags.com'
const LOCALES = ['en', 'fr']

export function pageAlternates(locale, path = '') {
  const languages = Object.fromEntries(
    LOCALES.map(l => [l, `${BASE_URL}/${l}${path}`])
  )
  // x-default → version anglaise par défaut
  languages['x-default'] = `${BASE_URL}/en${path}`

  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages,
  }
}

export { BASE_URL, LOCALES }
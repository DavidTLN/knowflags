// app/sitemap.js
import { createClient } from '@/lib/supabase-server'
import { getAllSlugs } from '@/lib/contentful'

export const revalidate = 3600 // régénère le sitemap toutes les heures

const BASE_URL = 'https://knowflags.com'
const LOCALES  = ['en', 'fr']
const CONTINENTS = ['africa', 'americas', 'asia', 'europe', 'oceania']

const GAMES = [
  'flag-quiz',
  'flag-reveal',
  'flag-clue',
  'flag-drawing',
  'flag-ranker',
  'capital-city',
]

// Une entrée par locale, avec les alternates hreflang (toutes les versions
// linguistiques du même chemin). `path` = chemin SANS locale, ex '' | '/countries'.
function urls(path, priority = 0.7, changefreq = 'weekly', lastModified = new Date()) {
  const languages = Object.fromEntries(LOCALES.map(l => [l, `${BASE_URL}/${l}${path}`]))
  return LOCALES.map(locale => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency: changefreq,
    priority,
    alternates: { languages },
  }))
}

export default async function sitemap() {
  // ── Pages statiques ─────────────────────────────────────────────────────────
  // NB : home = urls('') → produit /en et /fr SANS slash final (pas /en/).
  const staticPages = [
    ...urls('', 1.0, 'daily'),
    ...urls('/countries', 0.9, 'weekly'),
    ...urls('/games', 0.9, 'weekly'),
    ...urls('/organisations', 0.7, 'monthly'),
    ...urls('/true-size', 0.6, 'monthly'),
    ...urls('/leaderboard', 0.5, 'daily'),
    ...urls('/blog', 0.6, 'weekly'),
    ...CONTINENTS.flatMap(slug => urls(`/continents/${slug}`, 0.8, 'weekly')),
    ...GAMES.flatMap(game => urls(`/games/${game}`, 0.8, 'monthly')),
  ]

  // ── Pages pays (dynamique Supabase) ─────────────────────────────────────────
  let countryPages = []
  try {
    const supabase = await createClient()
    const { data: countries } = await supabase
      .from('countries')
      .select('iso_code')
      .order('iso_code')

    if (countries) {
      countryPages = countries.flatMap(c =>
        urls(`/countries/${c.iso_code.toLowerCase()}`, 0.85, 'monthly')
      )
    }
  } catch (e) {
    console.error('sitemap: failed to fetch countries', e)
  }

  // ── Articles de blog (dynamique Contentful) ─────────────────────────────────
  let blogPages = []
  try {
    const slugs = await getAllSlugs()
    if (Array.isArray(slugs)) {
      blogPages = slugs.flatMap(slug =>
        urls(`/blog/${slug}`, 0.7, 'monthly')
      )
    }
  } catch (e) {
    console.error('sitemap: failed to fetch blog slugs', e)
  }

  return [...staticPages, ...countryPages, ...blogPages]
}
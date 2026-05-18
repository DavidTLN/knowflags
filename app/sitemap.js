// app/sitemap.js
import { createClient } from '@/lib/supabase-server'

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

function urls(path, priority = 0.7, changefreq = 'weekly') {
  return LOCALES.map(locale => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
  }))
}

export default async function sitemap() {
  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages = [
    ...urls('/', 1.0, 'daily'),
    ...urls('/countries', 0.9, 'weekly'),
    ...urls('/games', 0.9, 'weekly'),
    ...urls('/organisations', 0.7, 'monthly'),
    ...urls('/true-size', 0.6, 'monthly'),
    ...urls('/leaderboard', 0.5, 'daily'),
    ...CONTINENTS.flatMap(slug => urls(`/continents/${slug}`, 0.8, 'weekly')),
    ...GAMES.flatMap(game => urls(`/games/${game}`, 0.8, 'monthly')),
  ]

  // ── Dynamic country pages ──────────────────────────────────────────────────
  let countryPages = []
  try {
    const supabase = createClient()
    const { data: countries } = await supabase
      .from('countries')
      .select('iso_code, updated_at')
      .order('iso_code')

    if (countries) {
      countryPages = countries.flatMap(c =>
        LOCALES.map(locale => ({
          url: `${BASE_URL}/${locale}/countries/${c.iso_code.toLowerCase()}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.85,
        }))
      )
    }
  } catch (e) {
    console.error('sitemap: failed to fetch countries', e)
  }

  return [...staticPages, ...countryPages]
}
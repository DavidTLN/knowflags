// app/sitemap.js
import { supabase } from '@/lib/supabase'      // cookieless anon client → cacheable
import { getAllSlugs } from '@/lib/contentful'

// ── Dynamic sitemap ──────────────────────────────────────────────────────────
// Regenerated at most once per hour: any country row (Supabase) or blog post
// (Contentful) added afterwards is picked up automatically — no code change.
// Use `export const dynamic = 'force-dynamic'` instead if you want it rebuilt
// on every single request (always live, but hits the DB each time).
export const revalidate = 3600

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
    ...urls('/blog', 0.7, 'weekly'),
    ...CONTINENTS.flatMap(slug => urls(`/continents/${slug}`, 0.8, 'weekly')),
    ...GAMES.flatMap(game => urls(`/games/${game}`, 0.8, 'monthly')),
  ]

  // ── Dynamic country pages (Supabase) ──────────────────────────────────────
  let countryPages = []
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('iso_code')            // note: `updated_at` does not exist on countries
      .order('iso_code')
    if (error) throw error

    countryPages = (countries || []).flatMap(c =>
      LOCALES.map(locale => ({
        url: `${BASE_URL}/${locale}/countries/${c.iso_code.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.85,
      }))
    )
  } catch (e) {
    console.error('sitemap: failed to fetch countries', e)
  }

  // ── Dynamic blog posts (Contentful) ───────────────────────────────────────
  let blogPages = []
  try {
    const slugs = await getAllSlugs()
    blogPages = (slugs || []).flatMap(slug =>
      LOCALES.map(locale => ({
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }))
    )
  } catch (e) {
    console.error('sitemap: failed to fetch blog slugs', e)
  }

  return [...staticPages, ...countryPages, ...blogPages]
}
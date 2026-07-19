// app/sitemap.js
//
// Served at https://knowflags.com/sitemap.xml
// Submit that URL in Google Search Console once deployed.

import { createClient } from '@/lib/supabase-server'

const BASE = 'https://knowflags.com'
const LOCALES = ['en', 'fr']

// Regenerate the sitemap once a day.
export const revalidate = 86400

// Build the hreflang alternates block for one path.
function alt(path) {
  return {
    languages: {
      en: `${BASE}/en${path}`,
      fr: `${BASE}/fr${path}`,
    },
  }
}

const STATIC_PATHS = [
  { path: '',                  priority: 1.0,  changeFrequency: 'weekly'  },
  { path: '/countries',        priority: 0.9,  changeFrequency: 'weekly'  },
  { path: '/blog',             priority: 0.8,  changeFrequency: 'weekly'  },
  { path: '/games',            priority: 0.7,  changeFrequency: 'monthly' },
  { path: '/flags/cities',     priority: 0.6,  changeFrequency: 'monthly' },
  { path: '/flags/regions',    priority: 0.6,  changeFrequency: 'monthly' },
  { path: '/organisations',    priority: 0.6,  changeFrequency: 'monthly' },
  { path: '/true-size',        priority: 0.5,  changeFrequency: 'monthly' },
  { path: '/leaderboard',      priority: 0.4,  changeFrequency: 'daily'   },
]

const CONTINENT_SLUGS = [
  'europe', 'africa', 'asia',
  'north-americas', 'central-americas', 'south-americas', 'oceania',
]

async function safe(fn, fallback) {
  try { return await fn() } catch { return fallback }
}

export default async function sitemap() {
  const now = new Date()
  const entries = []

  // ── Static pages ──────────────────────────────────────────────────────────
  for (const locale of LOCALES) {
    for (const s of STATIC_PATHS) {
      entries.push({
        url: `${BASE}/${locale}${s.path}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: alt(s.path),
      })
    }
    for (const slug of CONTINENT_SLUGS) {
      entries.push({
        url: `${BASE}/${locale}/continents/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: alt(`/continents/${slug}`),
      })
    }
  }

  // ── Countries ─────────────────────────────────────────────────────────────
  const countries = await safe(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('countries')
      .select('iso_code, last_flag_change')
    return data || []
  }, [])

  for (const locale of LOCALES) {
    for (const c of countries) {
      const path = `/countries/${c.iso_code}`
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: c.last_flag_change ? new Date(c.last_flag_change) : now,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: alt(path),
      })
    }
  }

  // ── City flags ────────────────────────────────────────────────────────────
  // NOTE: only cities. There is no /flags/regions/[slug] route, so region
  // slugs must NOT be listed here — they would all return 404.
  const cityFlags = await safe(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('flag_taxonomy')
      .select('slug')
      .eq('flag_type', 'city')
    return data || []
  }, [])

  for (const locale of LOCALES) {
    for (const f of cityFlags) {
      const path = `/flags/cities/${f.slug}`
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: alt(path),
      })
    }
  }

  // ── Blog posts ────────────────────────────────────────────────────────────
  const slugs = await safe(async () => {
    const { getAllSlugs } = await import('@/lib/contentful')
    return (await getAllSlugs()) || []
  }, [])

  for (const locale of LOCALES) {
    for (const slug of slugs) {
      const path = `/blog/${slug}`
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: alt(path),
      })
    }
  }

  return entries
}
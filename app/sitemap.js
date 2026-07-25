// app/sitemap.js
//
// Served at https://knowflags.com/sitemap.xml
//
// IMPORTANT — semantique de <lastmod>
// -----------------------------------
// <lastmod> = date de derniere modification DE LA PAGE, jamais la date d'un
// evenement historique decrit par la page.
// Utiliser `countries.last_flag_change` provoquait 160 erreurs "Date non valide"
// dans la Search Console : 80 pays ont une derniere modification de drapeau
// anterieure a 1970 (Monaco 1339, Danemark 1370, Royaume-Uni 1801...), et Google
// rejette ces dates.
//
// Regles appliquees ici :
//  1. source = `updated_at` (timestamp reel de modification de la ligne en base)
//  2. toute date est bornee : >= LASTMOD_FLOOR et <= maintenant
//  3. si aucune date fiable n'existe, <lastmod> est simplement OMIS
//     (une date absente vaut mieux qu'une date fausse : Google finit par
//      ignorer completement un lastmod juge non fiable)

import { createClient } from '@/lib/supabase-server'

const BASE = 'https://knowflags.com'
const LOCALES = ['en', 'fr']

// Plancher : rien sur le site n'est plus ancien que la mise en ligne.
// Toute date anterieure est ecretee a cette valeur.
const LASTMOD_FLOOR = new Date('2025-01-01T00:00:00.000Z')

// Regenere le sitemap une fois par jour.
export const revalidate = 86400

// ── Helpers ──────────────────────────────────────────────────────────────────

// Normalise et borne une date. Retourne null si inutilisable.
function lastmod(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  const t = d.getTime()
  if (Number.isNaN(t)) return null
  const now = Date.now()
  if (t > now) return new Date(now)             // pas de date dans le futur
  if (t < LASTMOD_FLOOR.getTime()) return LASTMOD_FLOOR
  return d
}

// Bloc hreflang (self-referencing + x-default) pour un chemin sans locale.
function alt(path) {
  return {
    languages: {
      en: `${BASE}/en${path}`,
      fr: `${BASE}/fr${path}`,
      'x-default': `${BASE}/en${path}`,
    },
  }
}

// Construit une entree ; `lastModified` n'est ajoute que s'il est fiable.
function entry(locale, path, { priority, changeFrequency, date }) {
  const d = lastmod(date)
  return {
    url: `${BASE}/${locale}${path}`,
    ...(d ? { lastModified: d } : {}),
    changeFrequency,
    priority,
    alternates: alt(path),
  }
}

// Date la plus recente d'une liste (ou null).
function newest(dates) {
  const valid = dates.map(lastmod).filter(Boolean)
  if (!valid.length) return null
  return new Date(Math.max(...valid.map(d => d.getTime())))
}

async function safe(fn, fallback) {
  try {
    return await fn()
  } catch (e) {
    console.error('sitemap:', e?.message)
    return fallback
  }
}

// ── Pages statiques ──────────────────────────────────────────────────────────
// `dated: true`  → lastmod pilote par la fraicheur du contenu (voir plus bas)
// `dated: false` → aucun lastmod emis (page structurelle, pas de signal fiable)

const STATIC_PATHS = [
  { path: '',               priority: 1.0, changeFrequency: 'weekly',  dated: 'content' },
  { path: '/countries',     priority: 0.9, changeFrequency: 'weekly',  dated: 'countries' },
  { path: '/blog',          priority: 0.8, changeFrequency: 'weekly',  dated: 'blog' },
  { path: '/games',         priority: 0.7, changeFrequency: 'monthly', dated: null },
  { path: '/flags/cities',  priority: 0.6, changeFrequency: 'monthly', dated: 'cities' },
  { path: '/flags/regions', priority: 0.6, changeFrequency: 'monthly', dated: null },
  { path: '/organisations', priority: 0.6, changeFrequency: 'monthly', dated: null },
  { path: '/true-size',     priority: 0.5, changeFrequency: 'monthly', dated: null },
  { path: '/leaderboard',   priority: 0.4, changeFrequency: 'daily',   dated: null },
]

const CONTINENT_SLUGS = [
  'europe', 'africa', 'asia',
  'north-americas', 'central-americas', 'south-americas', 'oceania',
]

// ── Sitemap ──────────────────────────────────────────────────────────────────

export default async function sitemap() {
  const supabase = await safe(async () => await createClient(), null)

  // ── Pays ───────────────────────────────────────────────────────────────────
  const countries = await safe(async () => {
    if (!supabase) return []
    const { data } = await supabase
      .from('countries')
      .select('iso_code, updated_at')
      .order('iso_code')
    return data || []
  }, [])

  // ── Drapeaux de villes ─────────────────────────────────────────────────────
  // NOTE : uniquement les villes. Il n'existe pas de route
  // /flags/regions/[slug], les slugs de regions ne doivent PAS etre listes
  // (ils renverraient tous un 404).
  const cityFlags = await safe(async () => {
    if (!supabase) return []
    const { data } = await supabase
      .from('flag_taxonomy')
      .select('slug, updated_at')
      .eq('flag_type', 'city')
    return data || []
  }, [])

  // ── Articles de blog ───────────────────────────────────────────────────────
  const posts = await safe(async () => {
    const { getAllPosts } = await import('@/lib/contentful')
    const items = (await getAllPosts('en')) || []
    return items.map(p => ({
      slug: p.slug,
      date: p.updatedAt || p.publishedAt || null,
    }))
  }, [])

  // ── Dates agregees pour les pages d'index ──────────────────────────────────
  const countriesDate = newest(countries.map(c => c.updated_at))
  const citiesDate    = newest(cityFlags.map(f => f.updated_at))
  const blogDate      = newest(posts.map(p => p.date))
  const contentDate   = newest([countriesDate, citiesDate, blogDate])

  const AGGREGATES = {
    content: contentDate,
    countries: countriesDate,
    cities: citiesDate,
    blog: blogDate,
  }

  const entries = []

  for (const locale of LOCALES) {
    // Pages statiques
    for (const s of STATIC_PATHS) {
      entries.push(entry(locale, s.path, {
        priority: s.priority,
        changeFrequency: s.changeFrequency,
        date: s.dated ? AGGREGATES[s.dated] : null,
      }))
    }

    // Continents — pas de lastmod fiable (contenu semi-statique)
    for (const slug of CONTINENT_SLUGS) {
      entries.push(entry(locale, `/continents/${slug}`, {
        priority: 0.7,
        changeFrequency: 'monthly',
        date: countriesDate,
      }))
    }

    // Pays
    for (const c of countries) {
      if (!c.iso_code) continue
      entries.push(entry(locale, `/countries/${c.iso_code.toLowerCase()}`, {
        priority: 0.8,
        changeFrequency: 'monthly',
        date: c.updated_at,
      }))
    }

    // Villes
    for (const f of cityFlags) {
      if (!f.slug) continue
      entries.push(entry(locale, `/flags/cities/${f.slug}`, {
        priority: 0.5,
        changeFrequency: 'monthly',
        date: f.updated_at,
      }))
    }

    // Blog
    for (const p of posts) {
      if (!p.slug) continue
      entries.push(entry(locale, `/blog/${p.slug}`, {
        priority: 0.7,
        changeFrequency: 'monthly',
        date: p.date,
      }))
    }
  }

  return entries
}
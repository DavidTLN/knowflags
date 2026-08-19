// lib/contentful.js
// Requires: npm install contentful

import { createClient } from 'contentful'

const client = createClient({
  space:        process.env.CONTENTFUL_SPACE_ID,
  accessToken:  process.env.CONTENTFUL_ACCESS_TOKEN,
})

const previewClient = createClient({
  space:        process.env.CONTENTFUL_SPACE_ID,
  accessToken:  process.env.CONTENTFUL_PREVIEW_TOKEN,
  host:         'preview.contentful.com',
})

function getClient(preview = false) {
  return preview ? previewClient : client
}

// ── Reading time ─────────────────────────────────────────────────────────────
export function calcReadingTime(richText) {
  if (!richText?.content) return 1
  let words = 0
  function walk(node) {
    if (node.nodeType === 'text') words += (node.value || '').split(/\s+/).filter(Boolean).length
    if (node.content) node.content.forEach(walk)
  }
  richText.content.forEach(walk)
  return Math.max(1, Math.ceil(words / 200))
}

// Mise en forme commune : un seul endroit ou les champs Contentful sont lus.
function mapPost(item, { withBody = false } = {}) {
  return {
    id:           item.sys.id,
    title:        item.fields.title,
    slug:         item.fields.slug,
    excerpt:      item.fields.excerpt ?? '',
    ...(withBody ? { body: item.fields.body } : {}),
    coverImage:   item.fields.coverImage?.fields?.file?.url
                    ? 'https:' + item.fields.coverImage.fields.file.url
                    : null,
    coverAlt:     item.fields.coverImage?.fields?.title ?? '',
    tags:         item.fields.tags ?? [],
    relatedCountries: item.fields.relatedCountries ?? [],
    publishedAt:  item.fields.publishedAt,
    updatedAt:    item.fields.updatedAt ?? null,
    readingTime:  calcReadingTime(item.fields.body),
  }
}

// ── Fetch all posts (for listing page) ───────────────────────────────────────
export async function getAllPosts(locale = 'en', preview = false) {
  const res = await getClient(preview).getEntries({
    content_type: 'blogPost',
    locale:        locale === 'fr' ? 'fr' : 'en-US',
    order:        '-fields.publishedAt',

  })

  return res.items.map(item => mapPost(item))
}

// ── Fetch single post by slug ────────────────────────────────────────────────
export async function getPostBySlug(slug, locale = 'en', preview = false) {
  const res = await getClient(preview).getEntries({
    content_type: 'blogPost',
    locale:        locale === 'fr' ? 'fr' : 'en-US',
    'fields.slug': slug,
    limit: 1,
  })

  if (!res.items.length) return null
  return mapPost(res.items[0], { withBody: true })
}

// ── Articles lies a un pays ──────────────────────────────────────────────────
//
// Champ Contentful attendu : `relatedCountries`, de type Short text / List.
// Valeurs en minuscules : soit le litteral `all`, soit des codes ISO alpha-2
// (`eg`, `sy`, `iq`).
//
// Tri par pertinence : un article qui cible explicitement le pays passe avant
// un article generique. Sans ce tri, les articles `all` satureraient le bloc sur
// les 220 fiches et masqueraient l'article vraiment specifique.
//
// Le champ peut ne pas exister encore cote Contentful : dans ce cas l'API
// repond 400 (unknown field) et on renvoie une liste vide plutot que de faire
// tomber la page pays.
const ALL_MARKER = 'all'

export async function getPostsForCountry(isoCode, locale = 'en', limit = 3, preview = false) {
  const iso = String(isoCode || '').toLowerCase()
  if (!iso) return []

  try {
    const res = await getClient(preview).getEntries({
      content_type: 'blogPost',
      locale:        locale === 'fr' ? 'fr' : 'en-US',
      'fields.relatedCountries[in]': `${iso},${ALL_MARKER}`,
      order:        '-fields.publishedAt',
      limit:         50,
    })

    const posts = res.items.map(item => mapPost(item))
    console.log('[posts pays]', iso, locale, '->', posts.length, posts.map(p => p.slug))

    const targeted = []
    const generic = []
    for (const p of posts) {
      const list = (p.relatedCountries || []).map(c => String(c).toLowerCase())
      if (list.includes(iso)) targeted.push(p)
      else if (list.includes(ALL_MARKER)) generic.push(p)
    }

    return [...targeted, ...generic].slice(0, limit)
  } catch (e) {
    console.error('getPostsForCountry:', e?.message)
    return []
  }
}

// ── Fetch all slugs (for generateStaticParams) ───────────────────────────────
export async function getAllSlugs() {
  const res = await client.getEntries({
    content_type: 'blogPost',
    select:        'fields.slug',
    limit:         1000,
  })
  return res.items.map(item => item.fields.slug)
}
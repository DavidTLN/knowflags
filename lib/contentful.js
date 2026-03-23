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

// ── Reading time ──────────────────────────────────────────────────────────────
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

// ── Fetch all posts (for listing page) ───────────────────────────────────────
export async function getAllPosts(locale = 'en', preview = false) {
  const res = await getClient(preview).getEntries({
    content_type: 'blogPost',
    locale:        locale === 'fr' ? 'fr' : 'en-US',
    order:        '-fields.publishedAt',

  })

  return res.items.map(item => ({
    id:           item.sys.id,
    title:        item.fields.title,
    slug:         item.fields.slug,
    excerpt:      item.fields.excerpt ?? '',
    coverImage:   item.fields.coverImage?.fields?.file?.url
                    ? 'https:' + item.fields.coverImage.fields.file.url
                    : null,
    coverAlt:     item.fields.coverImage?.fields?.title ?? '',
    tags:         item.fields.tags ?? [],
    publishedAt:  item.fields.publishedAt,
    updatedAt:    item.fields.updatedAt ?? null,
    readingTime:  calcReadingTime(item.fields.body),
  }))
}

// ── Fetch single post by slug ─────────────────────────────────────────────────
export async function getPostBySlug(slug, locale = 'en', preview = false) {
  const res = await getClient(preview).getEntries({
    content_type: 'blogPost',
    locale:        locale === 'fr' ? 'fr' : 'en-US',
    'fields.slug': slug,
    limit: 1,
  })

  if (!res.items.length) return null
  const item = res.items[0]

  return {
    id:           item.sys.id,
    title:        item.fields.title,
    slug:         item.fields.slug,
    excerpt:      item.fields.excerpt ?? '',
    body:         item.fields.body,
    coverImage:   item.fields.coverImage?.fields?.file?.url
                    ? 'https:' + item.fields.coverImage.fields.file.url
                    : null,
    coverAlt:     item.fields.coverImage?.fields?.title ?? '',
    tags:         item.fields.tags ?? [],
    publishedAt:  item.fields.publishedAt,
    updatedAt:    item.fields.updatedAt ?? null,
    readingTime:  calcReadingTime(item.fields.body),
  }
}

// ── Fetch all slugs (for generateStaticParams) ────────────────────────────────
export async function getAllSlugs() {
  const res = await client.getEntries({
    content_type: 'blogPost',
    select:        'fields.slug',
    limit:         1000,
  })
  return res.items.map(item => item.fields.slug)
}
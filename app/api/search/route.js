// app/api/search/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAllPosts } from '@/lib/contentful'

export const runtime = 'nodejs'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const raw    = (searchParams.get('q') || '').trim()
  const locale = searchParams.get('locale') === 'fr' ? 'fr' : 'en'

  // Sanitize: strip characters that would break the PostgREST `.or(...)` filter
  const q = raw.replace(/[,%()]/g, ' ').trim()
  if (q.length < 2) return NextResponse.json({ countries: [], posts: [] })

  const like = `%${q}%`

  // ── Countries (Supabase) ────────────────────────────────────────────────
  let countries = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('countries')
      .select('iso_code, name_en, name_fr, region')
      .or(`name_en.ilike.${like},name_fr.ilike.${like}`)
      .order(locale === 'fr' ? 'name_fr' : 'name_en')
      .limit(8)

    countries = (data || []).map(c => ({
      iso:    c.iso_code.toLowerCase(),
      name:   locale === 'fr' ? c.name_fr : c.name_en,
      region: c.region || null,
    }))
  } catch (e) {
    console.error('search: countries failed', e)
  }

  // ── Blog posts (Contentful) ─────────────────────────────────────────────
  let posts = []
  try {
    const all = await getAllPosts(locale)
    const ql  = q.toLowerCase()
    posts = (all || [])
      .filter(p =>
        (p.title || '').toLowerCase().includes(ql) ||
        (p.excerpt || '').toLowerCase().includes(ql)
      )
      .slice(0, 5)
      .map(p => ({ slug: p.slug, title: p.title, excerpt: p.excerpt || '' }))
  } catch (e) {
    console.error('search: posts failed', e)
  }

  return NextResponse.json({ countries, posts })
}
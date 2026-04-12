import { createClient } from '@/lib/supabase-server'

/**
 * Get all flags for a given country code (iso2)
 * Returns { regions, cities, organisations } grouped
 */
export async function getFlagsByCountry(iso2) {
  const supabase = createClient()

  // Find the country row
  const { data: country } = await supabase
    .from('flags')
    .select('id, slug, name_en, name_fr, image_path, metadata')
    .eq('type', 'country')
    .eq("metadata->>'iso2'", iso2.toLowerCase())
    .single()

  if (!country) return null

  // Get all flags belonging to this country
  const { data: flags } = await supabase
    .from('flags')
    .select('id, slug, name_en, name_fr, type, image_path, parent_id, sort_order, metadata')
    .eq('country_id', country.id)
    .neq('id', country.id) // exclude the country itself
    .order('sort_order')

  const regions = flags?.filter(f => f.type === 'region') ?? []
  const cities  = flags?.filter(f => f.type === 'city')   ?? []
  const orgs    = flags?.filter(f => f.type === 'organisation') ?? []

  return { country, regions, cities, orgs }
}

/**
 * Get all regions, optionally filtered by country slug
 */
export async function getAllRegions(countrySlug = null) {
  const supabase = createClient()
  let query = supabase
    .from('flags')
    .select(`
      id, slug, name_en, name_fr, image_path, sort_order, metadata,
      parent:parent_id ( id, slug, name_en, name_fr )
    `)
    .eq('type', 'region')
    .order('sort_order')

  if (countrySlug) {
    const { data: country } = await supabase
      .from('flags').select('id').eq('slug', countrySlug).single()
    if (country) query = query.eq('country_id', country.id)
  }

  const { data } = await query
  return data ?? []
}

/**
 * Get all cities, optionally filtered by country or region slug
 */
export async function getAllCities({ countrySlug, regionSlug } = {}) {
  const supabase = createClient()
  let query = supabase
    .from('flags')
    .select(`
      id, slug, name_en, name_fr, image_path, sort_order, metadata,
      parent:parent_id ( id, slug, name_en, name_fr ),
      country:country_id ( id, slug, name_en, name_fr )
    `)
    .eq('type', 'city')
    .order('sort_order')

  if (regionSlug) {
    const { data: region } = await supabase
      .from('flags').select('id').eq('slug', regionSlug).single()
    if (region) query = query.eq('parent_id', region.id)
  } else if (countrySlug) {
    const { data: country } = await supabase
      .from('flags').select('id').eq('slug', countrySlug).single()
    if (country) query = query.eq('country_id', country.id)
  }

  const { data } = await query
  return data ?? []
}

/**
 * Get a single flag entry by slug
 */
export async function getFlagBySlug(slug) {
  const supabase = createClient()
  const { data } = await supabase
    .from('flags')
    .select(`
      *,
      parent:parent_id ( id, slug, name_en, name_fr, image_path ),
      country:country_id ( id, slug, name_en, name_fr, image_path )
    `)
    .eq('slug', slug)
    .single()
  return data
}
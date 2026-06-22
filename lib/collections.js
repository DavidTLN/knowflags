// Data helpers for the flag collections feature.
// All functions take a Supabase client (browser or server) so they work in
// both the CollectionsProvider (client) and the public collection page (server).

export const FAVORITES_NAME = 'Favorites'

export function itemKey(entityType, entityCode) {
  return `${entityType}:${entityCode}`
}

// All collections owned by a user, with their items nested.
export async function fetchUserCollections(supabase, userId) {
  const { data } = await supabase
    .from('collections')
    .select('id, name, description, is_default, visibility, created_at, updated_at, collection_items(id, entity_type, entity_code, country_code, created_at)')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
  return data ?? []
}

// A single public (or owned) collection, for the shareable page.
export async function fetchCollectionById(supabase, id) {
  const { data } = await supabase
    .from('collections')
    .select('id, name, description, is_default, visibility, user_id, created_at, collection_items(id, entity_type, entity_code, country_code, created_at)')
    .eq('id', id)
    .maybeSingle()
  return data ?? null
}

export async function getOrCreateFavorites(supabase, userId) {
  const { data: existing } = await supabase
    .from('collections')
    .select('id, name, description, is_default, visibility')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle()
  if (existing) return existing
  const { data } = await supabase
    .from('collections')
    .insert({ user_id: userId, name: FAVORITES_NAME, is_default: true })
    .select('id, name, description, is_default, visibility')
    .single()
  return data
}

export async function createCollection(supabase, userId, { name, description = '', visibility = 'private' }) {
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name: name.trim(), description: description.trim() || null, visibility })
    .select('id, name, description, is_default, visibility, created_at, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function updateCollection(supabase, id, fields) {
  const updates = { ...fields, updated_at: new Date().toISOString() }
  if (typeof updates.name === 'string') updates.name = updates.name.trim()
  if (typeof updates.description === 'string') updates.description = updates.description.trim() || null
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select('id, name, description, is_default, visibility, created_at, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function deleteCollection(supabase, id) {
  const { error } = await supabase.from('collections').delete().eq('id', id)
  if (error) throw error
}

export async function addItem(supabase, collectionId, { entityType, entityCode, countryCode = null }) {
  const { data, error } = await supabase
    .from('collection_items')
    .upsert(
      { collection_id: collectionId, entity_type: entityType, entity_code: entityCode, country_code: countryCode },
      { onConflict: 'collection_id,entity_type,entity_code', ignoreDuplicates: true }
    )
    .select('id, entity_type, entity_code, country_code, created_at')
  if (error) throw error
  return data?.[0] ?? null
}

export async function removeItem(supabase, collectionId, entityType, entityCode) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('entity_type', entityType)
    .eq('entity_code', entityCode)
  if (error) throw error
}

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import {
  fetchUserCollections, getOrCreateFavorites, createCollection as createCollectionDb,
  updateCollection as updateCollectionDb, deleteCollection as deleteCollectionDb,
  addItem as addItemDb, removeItem as removeItemDb, itemKey,
} from '@/lib/collections'

const CollectionsContext = createContext(null)

export function useCollections() {
  const ctx = useContext(CollectionsContext)
  if (!ctx) throw new Error('useCollections must be used within a CollectionsProvider')
  return ctx
}

export function CollectionsProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [collections, setCollections] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setCollections(await fetchUserCollections(supabase, session.user.id))
      }
      setLoading(false)
    })
  }, [])

  const favorites = collections.find(c => c.is_default) || null

  // Is this entity saved in the Favorites collection?
  const isFavorite = useCallback((type, code) => {
    if (!favorites) return false
    return (favorites.collection_items || []).some(i => i.entity_type === type && i.entity_code === code)
  }, [favorites])

  // Is this entity saved in any collection?
  const isSaved = useCallback((type, code) => {
    return collections.some(c => (c.collection_items || []).some(i => i.entity_type === type && i.entity_code === code))
  }, [collections])

  // Which collection ids contain this entity (for the picker checkboxes).
  const collectionsContaining = useCallback((type, code) => {
    const set = new Set()
    for (const c of collections) {
      if ((c.collection_items || []).some(i => i.entity_type === type && i.entity_code === code)) set.add(c.id)
    }
    return set
  }, [collections])

  function applyAddItem(collectionId, item, row) {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c
      const items = c.collection_items || []
      if (items.some(i => i.entity_type === item.entityType && i.entity_code === item.entityCode)) return c
      return { ...c, collection_items: [...items, row || {
        id: `tmp-${itemKey(item.entityType, item.entityCode)}`,
        entity_type: item.entityType, entity_code: item.entityCode, country_code: item.countryCode ?? null,
      }] }
    }))
  }

  function applyRemoveItem(collectionId, type, code) {
    setCollections(prev => prev.map(c => c.id !== collectionId ? c : {
      ...c, collection_items: (c.collection_items || []).filter(i => !(i.entity_type === type && i.entity_code === code)),
    }))
  }

  const addToCollection = useCallback(async (collectionId, item) => {
    const supabase = createClient()
    applyAddItem(collectionId, item, null) // optimistic
    const row = await addItemDb(supabase, collectionId, item)
    if (row) applyAddItem(collectionId, item, row)
  }, [])

  const removeFromCollection = useCallback(async (collectionId, type, code) => {
    const supabase = createClient()
    applyRemoveItem(collectionId, type, code) // optimistic
    await removeItemDb(supabase, collectionId, type, code)
  }, [])

  // Heart toggle — ensures a Favorites collection exists.
  const toggleFavorite = useCallback(async (item) => {
    if (!user) return false
    const supabase = createClient()
    let fav = favorites
    if (!fav) {
      fav = await getOrCreateFavorites(supabase, user.id)
      setCollections(prev => prev.some(c => c.id === fav.id) ? prev : [{ ...fav, collection_items: [] }, ...prev])
    }
    const on = (fav.collection_items || []).some(i => i.entity_type === item.entityType && i.entity_code === item.entityCode)
    if (on) { await removeFromCollection(fav.id, item.entityType, item.entityCode); return false }
    await addToCollection(fav.id, item); return true
  }, [user, favorites, addToCollection, removeFromCollection])

  const createCollection = useCallback(async ({ name, description, visibility }) => {
    if (!user) return null
    const supabase = createClient()
    const row = await createCollectionDb(supabase, user.id, { name, description, visibility })
    const withItems = { ...row, collection_items: [] }
    setCollections(prev => [...prev, withItems])
    return withItems
  }, [user])

  const updateCollection = useCallback(async (id, fields) => {
    const supabase = createClient()
    const row = await updateCollectionDb(supabase, id, fields)
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...row } : c))
    return row
  }, [])

  const deleteCollection = useCallback(async (id) => {
    const supabase = createClient()
    await deleteCollectionDb(supabase, id)
    setCollections(prev => prev.filter(c => c.id !== id))
  }, [])

  const value = {
    user, loading, collections, favorites,
    isFavorite, isSaved, collectionsContaining,
    toggleFavorite, addToCollection, removeFromCollection,
    createCollection, updateCollection, deleteCollection,
  }

  return <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useCollections } from './CollectionsContext'

const C = {
  navy: '#0B1F3B', blue: '#9EB7E5', cream: '#F4F1E6', red: '#C0392B',
  bg: '#F7F5EF', border: '#E2DDD5', muted: '#8A8278', white: '#FFFFFF', green: '#426A5A',
}

// Full save control for a flag detail header: heart (Favorites) + "Save to collection" menu.
export default function CollectionControls({ entityType, entityCode, countryCode, name }) {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const {
    user, loading, collections, isFavorite, toggleFavorite,
    collectionsContaining, addToCollection, removeFromCollection, createCollection,
  } = useCollections()

  const [open, setOpen]           = useState(false)
  const [busy, setBusy]           = useState(false)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDoc(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const item = { entityType, entityCode, countryCode }
  const fav = isFavorite(entityType, entityCode)
  const containing = collectionsContaining(entityType, entityCode)
  const savedCount = containing.size

  async function onHeart() {
    if (!user) { window.location.href = `/${locale}/login`; return }
    if (busy) return
    setBusy(true)
    try { await toggleFavorite(item) } finally { setBusy(false) }
  }

  async function onToggleCollection(c) {
    if (containing.has(c.id)) await removeFromCollection(c.id, entityType, entityCode)
    else await addToCollection(c.id, item)
  }

  async function onCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const created = await createCollection({ name: trimmed, description: '', visibility: 'private' })
      if (created) await addToCollection(created.id, item)
      setNewName(''); setCreating(false)
    } finally { setBusy(false) }
  }

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px',
    borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.12s',
  }

  if (!loading && !user) {
    return (
      <a href={`/${locale}/login`} style={{ ...btnBase, backgroundColor: C.white, color: C.navy, border: `1px solid ${C.border}`, textDecoration: 'none' }}>
        🤍 {t('Sign in to save', 'Connectez-vous pour enregistrer')}
      </a>
    )
  }

  return (
    <div ref={wrapRef} style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
      {/* Heart */}
      <button onClick={onHeart} disabled={busy} aria-pressed={fav} style={{
        ...btnBase, backgroundColor: fav ? '#fdecea' : C.white,
        color: fav ? C.red : C.navy, border: `1px solid ${fav ? C.red : C.border}`, opacity: busy ? 0.6 : 1,
      }}>
        <span>{fav ? '❤️' : '🤍'}</span>
        {fav ? t('Favorited', 'Favori') : t('Favorite', 'Favori')}
      </button>

      {/* Save to collection */}
      <button onClick={() => setOpen(o => !o)} style={{
        ...btnBase, backgroundColor: C.navy, color: C.cream, border: `1px solid ${C.navy}`,
      }}>
        📁 {t('Save', 'Enregistrer')}{savedCount > 0 ? ` · ${savedCount}` : ''} <span style={{ fontSize: '10px' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50, width: '280px',
          backgroundColor: C.white, borderRadius: '14px', border: `1px solid ${C.border}`,
          boxShadow: '0 12px 40px rgba(11,31,59,0.18)', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: '12px', fontWeight: '800', color: C.navy, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('Save to collection', 'Enregistrer dans une collection')}
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {collections.length === 0 && (
              <div style={{ padding: '16px', fontSize: '13px', color: C.muted }}>
                {t('No collections yet — create one below.', 'Aucune collection — créez-en une ci-dessous.')}
              </div>
            )}
            {collections.map(c => {
              const checked = containing.has(c.id)
              return (
                <button key={c.id} onClick={() => onToggleCollection(c)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
                  border: 'none', borderBottom: `1px solid ${C.bg}`, backgroundColor: C.white,
                  cursor: 'pointer', fontSize: '13px', color: C.navy, fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                    border: `1.5px solid ${checked ? C.green : C.border}`, backgroundColor: checked ? C.green : C.white,
                    color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900',
                  }}>{checked ? '✓' : ''}</span>
                  <span style={{ flex: 1, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.is_default ? `❤️ ${t('Favorites', 'Favoris')}` : c.name}
                  </span>
                  <span style={{ fontSize: '11px', color: C.muted }}>{(c.collection_items || []).length}</span>
                </button>
              )
            })}
          </div>

          {/* Create new */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
            {creating ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onCreate() }}
                  placeholder={t('Collection name', 'Nom de la collection')}
                  style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${C.blue}`, fontSize: '13px', outline: 'none', color: C.navy }}
                />
                <button onClick={onCreate} disabled={busy || !newName.trim()} style={{
                  ...btnBase, padding: '8px 12px', backgroundColor: C.navy, color: C.cream, border: 'none',
                  opacity: busy || !newName.trim() ? 0.6 : 1,
                }}>{t('Add', 'Ajouter')}</button>
              </div>
            ) : (
              <button onClick={() => setCreating(true)} style={{
                ...btnBase, width: '100%', justifyContent: 'center', backgroundColor: C.white,
                color: C.navy, border: `1px dashed ${C.border}`,
              }}>＋ {t('New collection', 'Nouvelle collection')}</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

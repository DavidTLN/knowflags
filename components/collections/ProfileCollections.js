'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import {
  fetchUserCollections, createCollection, updateCollection, deleteCollection,
} from '@/lib/collections'

const C = {
  navy: '#0B1F3B', blue: '#9EB7E5', cream: '#F4F1E6', green: '#426A5A', gold: '#806D40',
  red: '#C0392B', bg: '#F7F5EF', border: '#E2DDD5', muted: '#8A8278', white: '#FFFFFF',
}

function thumbFor(item) {
  if (item.entity_type === 'country' && item.entity_code) {
    return { type: 'img', src: `https://flagcdn.com/w40/${item.entity_code.toLowerCase()}.png` }
  }
  if (item.country_code) {
    return { type: 'img', src: `https://flagcdn.com/w40/${item.country_code.toLowerCase()}.png` }
  }
  const emoji = item.entity_type === 'organisation' ? '🏛️' : item.entity_type === 'city' ? '🏙️' : '🗺️'
  return { type: 'emoji', emoji }
}

function Thumb({ item, size = 34 }) {
  const th = thumbFor(item)
  return (
    <div style={{ width: size, height: size * 0.66, borderRadius: '4px', overflow: 'hidden', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>
      {th.type === 'img'
        ? <img src={th.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span>{th.emoji}</span>}
    </div>
  )
}

export default function ProfileCollections({ userId }) {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [collections, setCollections] = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null) // collection id for detail view
  const [showForm, setShowForm]       = useState(false)
  const [editId, setEditId]           = useState(null)
  const [form, setForm]               = useState({ name: '', description: '', visibility: 'private' })
  const [busy, setBusy]               = useState(false)
  const [copiedId, setCopiedId]       = useState(null)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    fetchUserCollections(supabase, userId).then(d => { setCollections(d); setLoading(false) })
  }, [userId])

  function openCreate() {
    setEditId(null); setForm({ name: '', description: '', visibility: 'private' }); setShowForm(true)
  }
  function openEdit(c) {
    setEditId(c.id); setForm({ name: c.name, description: c.description || '', visibility: c.visibility }); setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setBusy(true)
    const supabase = createClient()
    try {
      if (editId) {
        const row = await updateCollection(supabase, editId, form)
        setCollections(prev => prev.map(c => c.id === editId ? { ...c, ...row } : c))
      } else {
        const row = await createCollection(supabase, userId, form)
        setCollections(prev => [...prev, { ...row, collection_items: [] }])
      }
      setShowForm(false)
    } finally { setBusy(false) }
  }

  async function remove(c) {
    if (!confirm(t(`Delete "${c.name}"? This cannot be undone.`, `Supprimer « ${c.name} » ? Action irréversible.`))) return
    const supabase = createClient()
    await deleteCollection(supabase, c.id)
    setCollections(prev => prev.filter(x => x.id !== c.id))
    if (selected === c.id) setSelected(null)
  }

  function shareLink(c) {
    const url = `${window.location.origin}/${locale}/collections/${c.id}`
    navigator.clipboard?.writeText(url)
    setCopiedId(c.id); setTimeout(() => setCopiedId(null), 1800)
  }

  if (loading) return <div style={{ color: C.muted, fontSize: '14px', padding: '24px 0' }}>{t('Loading…', 'Chargement…')}</div>

  // ── Detail view ──
  const current = collections.find(c => c.id === selected)
  if (current) {
    const items = current.collection_items || []
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontSize: '13px', fontWeight: '700', padding: '0 0 14px' }}>
          ← {t('All collections', 'Toutes les collections')}
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: C.navy }}>
            {current.is_default ? `❤️ ${t('Favorites', 'Favoris')}` : current.name}
          </h2>
          {current.visibility === 'public' && (
            <button onClick={() => shareLink(current)} style={{ ...pill, cursor: 'pointer' }}>
              {copiedId === current.id ? t('Copied!', 'Copié !') : `🔗 ${t('Share', 'Partager')}`}
            </button>
          )}
        </div>
        {current.description && <p style={{ margin: '0 0 18px', color: C.muted, fontSize: '14px' }}>{current.description}</p>}
        {items.length === 0
          ? <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontSize: '14px' }}>{t('No flags here yet. Tap the heart on any flag to save it.', 'Aucun drapeau. Touchez le cœur sur un drapeau pour l’enregistrer.')}</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {items.map(it => {
                const href = it.entity_type === 'country'
                  ? `/${locale}/countries/${it.entity_code}`
                  : it.country_code ? `/${locale}/countries/${it.country_code}` : null
                const inner = (
                  <div style={{ backgroundColor: C.white, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    <div style={{ aspectRatio: '3/2', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Thumb item={it} size={120} />
                    </div>
                    <div style={{ padding: '7px 9px', fontSize: '12px', fontWeight: '700', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(it.entity_type === 'country' ? it.entity_code?.toUpperCase() : it.entity_code) || '—'}
                    </div>
                  </div>
                )
                return href
                  ? <a key={it.id} href={href} style={{ textDecoration: 'none' }}>{inner}</a>
                  : <div key={it.id}>{inner}</div>
              })}
            </div>
          )}
      </div>
    )
  }

  // ── List view ──
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: C.muted }}>
          {collections.length} {t('collection', 'collection')}{collections.length !== 1 ? 's' : ''}
        </span>
        <button onClick={openCreate} style={{ padding: '9px 16px', backgroundColor: C.navy, color: C.cream, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          ＋ {t('New collection', 'Nouvelle collection')}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: C.white, borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px', marginBottom: '20px' }}>
          <input
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={t('Name (e.g. Africa trip)', 'Nom (ex. Voyage en Afrique)')}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${C.blue}`, fontSize: '14px', color: C.navy, outline: 'none', marginBottom: '10px' }}
          />
          <textarea
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={t('Description (optional)', 'Description (facultatif)')} rows={2}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '14px', color: C.navy, outline: 'none', resize: 'vertical', marginBottom: '10px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.navy, marginBottom: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.visibility === 'public'} onChange={e => setForm(f => ({ ...f, visibility: e.target.checked ? 'public' : 'private' }))} />
            {t('Public — anyone with the link can view', 'Public — visible par toute personne ayant le lien')}
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={save} disabled={busy || !form.name.trim()} style={{ padding: '9px 20px', backgroundColor: C.navy, color: C.cream, border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: busy || !form.name.trim() ? 0.6 : 1 }}>
              {editId ? t('Save', 'Enregistrer') : t('Create', 'Créer')}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 16px', backgroundColor: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
              {t('Cancel', 'Annuler')}
            </button>
          </div>
        </div>
      )}

      {collections.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>📁</div>
          <div style={{ fontSize: '14px' }}>{t('No collections yet. Create one, or tap the heart on any flag.', 'Aucune collection. Créez-en une, ou touchez le cœur sur un drapeau.')}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {collections.map(c => {
            const items = c.collection_items || []
            return (
              <div key={c.id} style={{ backgroundColor: C.white, borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => setSelected(c.id)} style={{ textAlign: 'left', border: 'none', background: 'none', padding: '16px 16px 12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: C.navy, fontFamily: 'var(--font-display)' }}>
                      {c.is_default ? `❤️ ${t('Favorites', 'Favoris')}` : c.name}
                    </span>
                    {c.visibility === 'public' && <span style={{ ...pillSm }}>🌐 {t('Public', 'Public')}</span>}
                  </div>
                  {c.description && <p style={{ margin: '0 0 10px', fontSize: '12px', color: C.muted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>}
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                    {items.slice(0, 5).map(it => <Thumb key={it.id} item={it} size={34} />)}
                    {items.length === 0 && <span style={{ fontSize: '12px', color: C.muted }}>{t('Empty', 'Vide')}</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>
                    {items.length} {t('flag', 'drapeau')}{items.length !== 1 ? (locale === 'fr' ? 'x' : 's') : ''}
                  </div>
                </button>
                <div style={{ marginTop: 'auto', display: 'flex', borderTop: `1px solid ${C.bg}` }}>
                  <button onClick={() => openEdit(c)} style={actionBtn}>{t('Edit', 'Modifier')}</button>
                  {c.visibility === 'public' && (
                    <button onClick={() => shareLink(c)} style={{ ...actionBtn, borderLeft: `1px solid ${C.bg}` }}>
                      {copiedId === c.id ? t('Copied!', 'Copié !') : t('Share', 'Partager')}
                    </button>
                  )}
                  {!c.is_default && (
                    <button onClick={() => remove(c)} style={{ ...actionBtn, color: C.red, borderLeft: `1px solid ${C.bg}` }}>{t('Delete', 'Supprimer')}</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const pill = { fontSize: '12px', fontWeight: '700', backgroundColor: '#eef3fb', color: '#0B1F3B', padding: '5px 12px', borderRadius: '99px', border: '1px solid #dbe4f5' }
const pillSm = { fontSize: '10px', fontWeight: '700', backgroundColor: '#eef3fb', color: '#0B1F3B', padding: '2px 8px', borderRadius: '99px' }
const actionBtn = { flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#0B1F3B', fontFamily: 'inherit' }

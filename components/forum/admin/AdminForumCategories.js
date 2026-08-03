'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import ForumIcon from '@/components/forum/ForumIcon'

const C = {
  navy: '#16324F', navyLt: '#1E4976', gold: '#F4B400', green: '#16A34A', red: '#D62828',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

// Icônes disponibles pour les catégories (doivent exister dans ForumIcon)
const ICON_CHOICES = ['flag','world','messages','palette','history','map-2','building-monument','device-gamepad-2','bulb']

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section'
}

// ── Modale d'édition/création ───────────────────────────────────────────────
function EditModal({ initial, parents, onClose, onSave, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [nameFr, setNameFr] = useState(initial?.name_fr || '')
  const [nameEn, setNameEn] = useState(initial?.name_en || '')
  const [descFr, setDescFr] = useState(initial?.description_fr || '')
  const [descEn, setDescEn] = useState(initial?.description_en || '')
  const [icon, setIcon] = useState(initial?.icon || 'messages')
  const [parentId, setParentId] = useState(initial?.parent_id || '')
  const [saving, setSaving] = useState(false)
  const isNew = !initial?.id
  const isLevel1Fixed = initial?.id && !initial?.parent_id && parents.some(p => p.id !== initial.id)

  async function handleSave() {
    if (!nameFr.trim() || !nameEn.trim()) return
    setSaving(true)
    await onSave({
      id: initial?.id,
      name_fr: nameFr.trim(), name_en: nameEn.trim(),
      description_fr: descFr.trim() || null, description_en: descEn.trim() || null,
      icon, parent_id: parentId || null,
    })
    setSaving(false)
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1.5px solid ${C.borderSolid}`, fontSize: '14px', color: C.text, outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15,25,35,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: C.surface, borderRadius: '16px', width: '520px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(22,50,79,0.22)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: C.navy }}>
            {isNew ? t('New section', 'Nouvelle section') : t('Edit section', 'Modifier la section')}
          </h3>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>{t('Name (FR)', 'Nom (FR)')}</label><input style={inp} value={nameFr} onChange={e => setNameFr(e.target.value)} /></div>
            <div><label style={lbl}>{t('Name (EN)', 'Nom (EN)')}</label><input style={inp} value={nameEn} onChange={e => setNameEn(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>{t('Description (FR)', 'Description (FR)')}</label><input style={inp} value={descFr} onChange={e => setDescFr(e.target.value)} /></div>
            <div><label style={lbl}>{t('Description (EN)', 'Description (EN)')}</label><input style={inp} value={descEn} onChange={e => setDescEn(e.target.value)} /></div>
          </div>

          <div>
            <label style={lbl}>{t('Parent category', 'Catégorie parente')}</label>
            <select style={inp} value={parentId} onChange={e => setParentId(e.target.value)}>
              <option value="">{t('— None (top-level category) —', '— Aucune (grande catégorie) —')}</option>
              {parents.filter(p => p.id !== initial?.id).map(p => (
                <option key={p.id} value={p.id}>{t(p.name_en, p.name_fr)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={lbl}>{t('Icon', 'Icône')}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ICON_CHOICES.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  style={{ width: '38px', height: '38px', borderRadius: '9px', border: `2px solid ${icon === ic ? C.navy : C.borderSolid}`, backgroundColor: icon === ic ? '#EEF2F7' : C.surface, color: C.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ForumIcon name={ic} size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '9px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.navy, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{t('Cancel', 'Annuler')}</button>
          <button onClick={handleSave} disabled={saving || !nameFr.trim() || !nameEn.trim()}
            style={{ padding: '9px 20px', borderRadius: '9px', border: 'none', backgroundColor: (saving || !nameFr.trim() || !nameEn.trim()) ? '#9CA3AF' : C.navy, color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? t('Saving…', 'Enregistrement…') : t('Save', 'Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminForumCategories({ initialCategories, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [cats, setCats] = useState(initialCategories)
  const [editing, setEditing] = useState(null)   // objet catégorie ou {} pour nouveau
  const [dragId, setDragId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)  // {parentId, index}
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const roots = useMemo(() =>
    cats.filter(c => !c.parent_id).sort((a, b) => a.position - b.position), [cats])
  const childrenOf = (pid) => cats.filter(c => c.parent_id === pid).sort((a, b) => a.position - b.position)

  function flash(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  // ── Sauvegarde (create/update) ────────────────────────────────────────────
  async function saveCategory(payload) {
    const sb = createClient()
    if (payload.id) {
      const { error } = await sb.from('forum_categories').update({
        name_fr: payload.name_fr, name_en: payload.name_en,
        description_fr: payload.description_fr, description_en: payload.description_en,
        icon: payload.icon, parent_id: payload.parent_id,
      }).eq('id', payload.id)
      if (error) { flash(t('Save failed', 'Échec de l\'enregistrement')); return }
      setCats(prev => prev.map(c => c.id === payload.id ? { ...c, ...payload } : c))
      flash(t('Saved', 'Enregistré'))
    } else {
      // position = fin de la liste du parent
      const siblings = payload.parent_id ? childrenOf(payload.parent_id) : roots
      const position = siblings.length
      let slug = slugify(payload.name_en)
      if (cats.some(c => c.slug === slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`
      const { data, error } = await sb.from('forum_categories').insert({
        name_fr: payload.name_fr, name_en: payload.name_en,
        description_fr: payload.description_fr, description_en: payload.description_en,
        icon: payload.icon, parent_id: payload.parent_id, slug, position,
      }).select().single()
      if (error) { flash(t('Create failed', 'Échec de la création')); return }
      setCats(prev => [...prev, data])
      flash(t('Section created', 'Section créée'))
    }
    setEditing(null)
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  async function deleteCategory(cat) {
    const kids = childrenOf(cat.id)
    const msg = kids.length
      ? t(`Delete "${t(cat.name_en, cat.name_fr)}" and its ${kids.length} sub-categories? All topics inside will be removed.`,
           `Supprimer « ${t(cat.name_en, cat.name_fr)} » et ses ${kids.length} sous-catégories ? Tous les sujets qu'elles contiennent seront supprimés.`)
      : t(`Delete "${t(cat.name_en, cat.name_fr)}"? All topics inside will be removed.`,
           `Supprimer « ${t(cat.name_en, cat.name_fr)} » ? Tous les sujets qu'elle contient seront supprimés.`)
    if (!window.confirm(msg)) return
    const sb = createClient()
    const { error } = await sb.from('forum_categories').delete().eq('id', cat.id)
    if (error) { flash(t('Delete failed', 'Échec de la suppression')); return }
    setCats(prev => prev.filter(c => c.id !== cat.id && c.parent_id !== cat.id))
    flash(t('Deleted', 'Supprimé'))
  }

  // ── Drag & drop : réordonner + changer de parent ──────────────────────────
  function onDragStart(id) { setDragId(id) }
  function onDragEnd() { setDragId(null); setDropTarget(null) }

  // Persiste les positions d'une liste (et le parent_id) en base
  async function persistOrder(list, parentId) {
    setSaving(true)
    const sb = createClient()
    // met à jour position + parent_id pour chaque item
    await Promise.all(list.map((c, idx) =>
      sb.from('forum_categories').update({ position: idx, parent_id: parentId }).eq('id', c.id)
    ))
    setSaving(false)
  }

  // Dépose l'élément dragué dans un parent donné à un index donné
  async function handleDrop(targetParentId, targetIndex) {
    if (!dragId) return
    const dragged = cats.find(c => c.id === dragId)
    if (!dragged) return
    // interdit : déposer une grande catégorie DANS une autre (max 2 niveaux)
    const draggedHasChildren = childrenOf(dragged.id).length > 0
    if (draggedHasChildren && targetParentId) {
      flash(t('A category with sub-categories cannot become a sub-category.', 'Une catégorie contenant des sous-catégories ne peut pas devenir une sous-catégorie.'))
      onDragEnd(); return
    }

    // retirer de son ancien emplacement
    const newCats = cats.map(c => c.id === dragId ? { ...c, parent_id: targetParentId } : c)
    // reconstruire la liste cible ordonnée
    const targetList = newCats.filter(c => (c.parent_id || null) === (targetParentId || null) && c.id !== dragId)
      .sort((a, b) => a.position - b.position)
    targetList.splice(targetIndex, 0, { ...dragged, parent_id: targetParentId })

    // réindexer les positions dans la cible
    targetList.forEach((c, i) => { c.position = i })
    // fusionner
    const merged = newCats.map(c => {
      const inTarget = targetList.find(x => x.id === c.id)
      return inTarget ? { ...c, position: inTarget.position, parent_id: targetParentId } : c
    })
    setCats(merged)
    onDragEnd()
    await persistOrder(targetList, targetParentId)
    flash(t('Order updated', 'Ordre mis à jour'))
  }

  // ── Rendu d'une ligne (drag handle + infos + actions) ─────────────────────
  function Row({ cat, depth }) {
    const isDragging = dragId === cat.id
    return (
      <div
        draggable
        onDragStart={() => onDragStart(cat.id)}
        onDragEnd={onDragEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '11px 14px', backgroundColor: isDragging ? '#EEF2F7' : C.surface,
          border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '8px',
          marginLeft: depth ? '32px' : 0, opacity: isDragging ? 0.5 : 1, cursor: 'grab',
        }}
      >
        <span style={{ color: C.light, display: 'flex', flexShrink: 0 }} title={t('Drag to reorder', 'Glisser pour réordonner')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
        </span>
        <span style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#EEF2F7', color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ForumIcon name={cat.icon} size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.navy }}>{t(cat.name_en, cat.name_fr)}</p>
          <p style={{ margin: 0, fontSize: '12px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cat.is_hidden ? `[${t('hidden', 'masqué')}] ` : ''}/{cat.slug}
          </p>
        </div>
        <button onClick={() => setEditing(cat)} title={t('Edit', 'Modifier')}
          style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${C.borderSolid}`, background: 'transparent', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {t('Edit', 'Modifier')}
        </button>
        <button onClick={() => deleteCategory(cat)} title={t('Delete', 'Supprimer')}
          style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid #FCA5A5`, background: 'transparent', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {t('Delete', 'Supprimer')}
        </button>
      </div>
    )
  }

  // Zone de dépôt entre deux lignes
  function DropZone({ parentId, index }) {
    const active = dropTarget && dropTarget.parentId === (parentId || null) && dropTarget.index === index
    return (
      <div
        onDragOver={e => { e.preventDefault(); setDropTarget({ parentId: parentId || null, index }) }}
        onDrop={e => { e.preventDefault(); handleDrop(parentId || null, index) }}
        style={{
          height: active ? '32px' : '10px', marginLeft: parentId ? '32px' : 0,
          borderRadius: '8px', transition: 'height 0.1s',
          border: active ? `2px dashed ${C.navy}` : '2px dashed transparent',
          backgroundColor: active ? 'rgba(22,50,79,0.05)' : 'transparent',
          marginBottom: active ? '8px' : 0,
        }}
      />
    )
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      {/* Hero */}
      <div style={{ backgroundColor: C.navy, padding: '28px 24px 24px', color: 'white' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', alignItems: 'center', marginBottom: '10px' }}>
            <Link href={`/${locale}/forum`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Forum</Link>
            <span>›</span><span style={{ color: '#9EB7E5' }}>{t('Administration', 'Administration')}</span>
          </nav>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>{t('Forum structure', 'Structure du forum')}</h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{t('Create, rename, reorder and move categories. Drag rows to reorder.', 'Créez, renommez, réordonnez et déplacez les catégories. Glissez les lignes pour réordonner.')}</p>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: C.muted }}>{saving ? t('Saving…', 'Enregistrement…') : `${roots.length} ${t('categories', 'catégories')}`}</span>
          <button onClick={() => setEditing({})} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <ForumIcon name="messages" size={0} /><span style={{ fontSize: '17px', lineHeight: 1 }}>+</span>{t('New section', 'Nouvelle section')}
          </button>
        </div>

        {/* Arbre avec zones de dépôt */}
        <div>
          <DropZone parentId={null} index={0} />
          {roots.map((root, ri) => (
            <div key={root.id}>
              <Row cat={root} depth={0} />
              {/* sous-catégories */}
              <DropZone parentId={root.id} index={0} />
              {childrenOf(root.id).map((child, ci) => (
                <div key={child.id}>
                  <Row cat={child} depth={1} />
                  <DropZone parentId={root.id} index={ci + 1} />
                </div>
              ))}
              <DropZone parentId={null} index={ri + 1} />
            </div>
          ))}
        </div>

        {roots.length === 0 && (
          <p style={{ textAlign: 'center', color: C.muted, padding: '40px 0' }}>{t('No categories yet. Create your first one.', 'Aucune catégorie. Créez la première.')}</p>
        )}
      </div>

      {editing && (
        <EditModal
          initial={editing.id ? editing : null}
          parents={roots}
          onClose={() => setEditing(null)}
          onSave={saveCategory}
          locale={locale}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: C.navy, color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, boxShadow: '0 8px 32px rgba(22,50,79,0.3)', zIndex: 1100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
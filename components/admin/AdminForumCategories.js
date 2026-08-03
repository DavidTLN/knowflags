'use client'

// DESTINATION: components/admin/AdminForumCategories.js
//
// Gestion de la structure du forum : sections (niveau 1) et sous-sections
// (niveau 2), avec reordonnancement par glisser-deposer.
// Les ecritures passent par la policy RLS `forum_categories_admin_all`
// (is_forum_admin -> forum_roles.role = 'admin' OU profiles.is_admin = true).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

const C = {
  navy: '#16324F', navyLight: '#1E4976', navyDark: '#0F1923',
  gold: '#F4B400', goldBg: '#FEF3C7', goldText: '#92400E',
  red: '#D62828', redBg: '#FEE2E2',
  green: '#16A34A', greenBg: '#DCFCE7',
  blue: '#2563EB', blueBg: '#DBEAFE',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

const VIEW_ROLES = ['public', 'member', 'moderator', 'admin']
const POST_ROLES = ['member', 'moderator', 'admin']

const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const orderKey = (c) => `${c.parent_id || 'root'}#${c.position}`
const snapshot = (list) => {
  const m = {}
  list.forEach((c) => { m[c.id] = orderKey(c) })
  return m
}

// ── Icones SVG ───────────────────────────────────────────────────────────────
const Ico = {
  grip: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || C.light} strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
    </svg>
  ),
  plus: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  pencil: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" />
    </svg>
  ),
  trash: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
    </svg>
  ),
  eye: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.6 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 4.1-.9" />
      <path d="M3 3l18 18" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  back: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  check: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none"
      stroke={p.color || 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  ),
}

// ── Styles reutilisables ─────────────────────────────────────────────────────
const btnPrimary = {
  padding: '10px 20px', borderRadius: '10px', backgroundColor: C.navy, color: '#FFFFFF',
  fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(22,50,79,0.08)', transition: 'background-color 0.12s ease',
  display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px',
}
const btnSecondary = {
  padding: '9px 20px', borderRadius: '10px', backgroundColor: 'transparent', color: C.navy,
  border: `1.5px solid ${C.borderSolid}`, fontSize: '14px', fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.12s ease',
  display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px',
}
const iconBtn = {
  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.surface,
  color: C.muted, cursor: 'pointer', transition: 'all 0.12s ease', flexShrink: 0,
}
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface,
  fontSize: '14px', color: C.text, outline: 'none', fontFamily: 'inherit',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: C.muted, margin: '0 0 6px',
}

function Badge({ tone = 'navy', children }) {
  const tones = {
    navy: { backgroundColor: C.secondary, color: C.navy },
    gold: { backgroundColor: C.goldBg, color: C.goldText },
    green: { backgroundColor: C.greenBg, color: C.green },
    red: { backgroundColor: C.redBg, color: C.red },
  }
  return (
    <span style={{
      ...tones[tone], padding: '3px 8px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminForumCategories({ initialCategories, stats, locale }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [cats, setCats] = useState(initialCategories)
  const [baseline, setBaseline] = useState(() => snapshot(initialCategories))
  const [drag, setDrag] = useState(null)   // { id, type: 'parent' | 'child' }
  const [over, setOver] = useState(null)   // { id, pos: 'before' | 'after' | 'inside' }
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const parents = useMemo(
    () => cats.filter((c) => !c.parent_id).sort((a, b) => a.position - b.position),
    [cats]
  )
  const childrenOf = (pid) =>
    cats.filter((c) => c.parent_id === pid).sort((a, b) => a.position - b.position)

  const dirty = useMemo(
    () => cats.some((c) => baseline[c.id] !== orderKey(c)),
    [cats, baseline]
  )

  const knownIcons = useMemo(
    () => [...new Set(cats.map((c) => c.icon).filter(Boolean))].sort(),
    [cats]
  )

  const countFor = (id) => stats?.[id]?.topic_count || 0
  const totalCountFor = (c) =>
    countFor(c.id) + childrenOf(c.id).reduce((n, k) => n + countFor(k.id), 0)

  // ── Glisser-deposer ────────────────────────────────────────────────────────
  function reindex(list) {
    return list.map((c, i) => ({ ...c, position: i + 1 }))
  }

  function applyMove(targetId, pos) {
    if (!drag || drag.id === targetId) return
    const dragged = cats.find((c) => c.id === drag.id)
    const target = cats.find((c) => c.id === targetId)
    if (!dragged || !target) return

    // Section principale : reordonner entre sections
    if (drag.type === 'parent') {
      if (target.parent_id) return
      const list = parents.filter((c) => c.id !== dragged.id)
      const idx = list.findIndex((c) => c.id === target.id)
      list.splice(pos === 'after' ? idx + 1 : idx, 0, dragged)
      const next = reindex(list)
      setCats(cats.map((c) => next.find((n) => n.id === c.id) || c))
      return
    }

    // Sous-section deposee sur une section : rattachement en fin de liste
    if (pos === 'inside') {
      const newParent = target.parent_id ? target.parent_id : target.id
      if (newParent === dragged.parent_id) return
      const oldSiblings = reindex(childrenOf(dragged.parent_id).filter((c) => c.id !== dragged.id))
      const newSiblings = reindex([
        ...childrenOf(newParent).filter((c) => c.id !== dragged.id),
        { ...dragged, parent_id: newParent },
      ])
      const merged = [...oldSiblings, ...newSiblings]
      setCats(cats.map((c) => merged.find((n) => n.id === c.id) || c))
      return
    }

    // Sous-section deposee sur une autre sous-section
    if (!target.parent_id) return
    const newParent = target.parent_id
    const oldParent = dragged.parent_id
    const list = childrenOf(newParent).filter((c) => c.id !== dragged.id)
    const idx = list.findIndex((c) => c.id === target.id)
    list.splice(pos === 'after' ? idx + 1 : idx, 0, { ...dragged, parent_id: newParent })
    const merged = [
      ...reindex(list),
      ...(oldParent !== newParent
        ? reindex(childrenOf(oldParent).filter((c) => c.id !== dragged.id))
        : []),
    ]
    setCats(cats.map((c) => merged.find((n) => n.id === c.id) || c))
  }

  function onDragOverRow(e, node, type) {
    if (!drag) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    const half = e.clientY < r.top + r.height / 2
    if (drag.type === 'parent') {
      if (type !== 'parent') return
      setOver({ id: node.id, pos: half ? 'before' : 'after' })
      return
    }
    if (type === 'parent') { setOver({ id: node.id, pos: 'inside' }); return }
    setOver({ id: node.id, pos: half ? 'before' : 'after' })
  }

  function onDropRow(e) {
    e.preventDefault()
    if (over) applyMove(over.id, over.pos)
    setDrag(null); setOver(null)
  }

  // ── Persistance ────────────────────────────────────────────────────────────
  async function saveOrder() {
    setBusy(true); setMsg(null)
    const supabase = createClient()
    const changed = cats.filter((c) => baseline[c.id] !== orderKey(c))
    for (const c of changed) {
      const { error } = await supabase
        .from('forum_categories')
        .update({ parent_id: c.parent_id, position: c.position, updated_at: new Date().toISOString() })
        .eq('id', c.id)
      if (error) {
        setBusy(false)
        setMsg({ kind: 'err', text: t('Could not save order: ', 'Ordre non enregistre : ') + error.message })
        return
      }
    }
    setBaseline(snapshot(cats))
    setBusy(false)
    setMsg({ kind: 'ok', text: t('Order saved.', 'Ordre enregistre.') })
  }

  function resetOrder() {
    setCats(initialCategories)
    setBaseline(snapshot(initialCategories))
    setMsg(null)
  }

  async function toggleHidden(cat) {
    setBusy(true); setMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('forum_categories')
      .update({ is_hidden: !cat.is_hidden, updated_at: new Date().toISOString() })
      .eq('id', cat.id)
    setBusy(false)
    if (error) { setMsg({ kind: 'err', text: error.message }); return }
    setCats(cats.map((c) => (c.id === cat.id ? { ...c, is_hidden: !c.is_hidden } : c)))
  }

  async function removeCategory(cat) {
    const kids = childrenOf(cat.id)
    const topics = totalCountFor(cat)
    if (topics > 0) {
      setMsg({
        kind: 'err',
        text: t(
          `This section still holds ${topics} topic(s). Move or delete them first.`,
          `Cette section contient encore ${topics} sujet(s). Deplace-les ou supprime-les d'abord.`
        ),
      })
      return
    }
    const label = locale === 'fr' ? cat.name_fr : cat.name_en
    const warn = kids.length
      ? t(
          `Delete "${label}" and its ${kids.length} sub-section(s)?`,
          `Supprimer « ${label} » et ses ${kids.length} sous-section(s) ?`
        )
      : t(`Delete "${label}"?`, `Supprimer « ${label} » ?`)
    if (!window.confirm(warn)) return

    setBusy(true); setMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from('forum_categories').delete().eq('id', cat.id)
    setBusy(false)
    if (error) { setMsg({ kind: 'err', text: error.message }); return }
    const removed = new Set([cat.id, ...kids.map((k) => k.id)])
    const next = cats.filter((c) => !removed.has(c.id))
    setCats(next)
    setBaseline(snapshot(next))
    setMsg({ kind: 'ok', text: t('Section deleted.', 'Section supprimee.') })
  }

  function openNew(parentId) {
    setEditing({
      __new: true, parent_id: parentId || null,
      slug: '', name_fr: '', name_en: '', description_fr: '', description_en: '',
      icon: '', color: '', is_hidden: false,
      min_role_to_view: 'public', min_role_to_post: 'member',
    })
  }

  function nextPosition(parentId) {
    const siblings = parentId ? childrenOf(parentId) : parents
    return siblings.length ? Math.max(...siblings.map((c) => c.position)) + 1 : 1
  }

  async function saveCategory() {
    const e = editing
    if (!e.name_fr?.trim() || !e.name_en?.trim()) {
      setMsg({ kind: 'err', text: t('Both names are required.', 'Les deux noms sont obligatoires.') })
      return
    }
    const slug = slugify(e.slug || e.name_fr)
    if (!slug) {
      setMsg({ kind: 'err', text: t('Invalid slug.', 'Slug invalide.') })
      return
    }
    const clash = cats.find((c) => c.slug === slug && c.id !== e.id)
    if (clash) {
      setMsg({ kind: 'err', text: t('This slug is already used.', 'Ce slug est deja utilise.') })
      return
    }

    const payload = {
      parent_id: e.parent_id || null,
      slug,
      name_fr: e.name_fr.trim(),
      name_en: e.name_en.trim(),
      description_fr: e.description_fr?.trim() || null,
      description_en: e.description_en?.trim() || null,
      icon: e.icon?.trim() || null,
      color: e.color?.trim() || null,
      is_hidden: !!e.is_hidden,
      min_role_to_view: e.min_role_to_view,
      min_role_to_post: e.min_role_to_post,
      updated_at: new Date().toISOString(),
    }

    setBusy(true); setMsg(null)
    const supabase = createClient()

    if (e.__new) {
      payload.position = nextPosition(payload.parent_id)
      const { data, error } = await supabase
        .from('forum_categories').insert(payload).select().single()
      setBusy(false)
      if (error) { setMsg({ kind: 'err', text: error.message }); return }
      setCats([...cats, data])
      setBaseline((b) => ({ ...b, [data.id]: orderKey(data) }))
    } else {
      const previous = cats.find((c) => c.id === e.id)
      if ((previous?.parent_id || null) !== payload.parent_id) {
        payload.position = nextPosition(payload.parent_id)
      }
      const { error } = await supabase
        .from('forum_categories').update(payload).eq('id', e.id)
      setBusy(false)
      if (error) { setMsg({ kind: 'err', text: error.message }); return }
      const merged = cats.map((c) => (c.id === e.id ? { ...c, ...payload } : c))
      setCats(merged)
      setBaseline((b) => ({ ...b, [e.id]: orderKey({ ...previous, ...payload }) }))
    }

    setEditing(null)
    setMsg({ kind: 'ok', text: t('Saved.', 'Enregistre.') })
  }

  // ── Rendu d'une ligne ──────────────────────────────────────────────────────
  // NOTE : fonction de rendu (pas un composant enfant) — un composant redefini
  // a chaque rendu serait demonte/remonte et casserait le glisser-deposer.
  function renderRow(node, type) {
    const isParent = type === 'parent'
    const isOver = over?.id === node.id
    const name = locale === 'fr' ? node.name_fr : node.name_en
    const topics = countFor(node.id)

    return (
      <div
        key={node.id}
        draggable
        onDragStart={() => setDrag({ id: node.id, type })}
        onDragEnd={() => { setDrag(null); setOver(null) }}
        onDragOver={(e) => onDragOverRow(e, node, type)}
        onDragLeave={() => { if (over?.id === node.id) setOver(null) }}
        onDrop={onDropRow}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: isParent ? '14px 16px' : '11px 16px',
          backgroundColor: isOver && over.pos === 'inside' ? C.blueBg
            : isParent ? C.surface : C.bgAlt,
          borderRadius: '10px',
          border: `1px solid ${isOver && over.pos === 'inside' ? C.blue : C.border}`,
          borderTop: isOver && over.pos === 'before' ? `3px solid ${C.blue}` : undefined,
          borderBottom: isOver && over.pos === 'after' ? `3px solid ${C.blue}` : undefined,
          opacity: drag?.id === node.id ? 0.4 : 1,
          cursor: 'grab', transition: 'background-color 0.12s ease',
          marginBottom: '6px',
        }}
      >
        <Ico.grip size={16} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: isParent ? '15px' : '14px',
              fontWeight: isParent ? 800 : 600,
              color: node.is_hidden ? C.light : C.navy,
            }}>{name}</span>
            {node.is_hidden && <Badge tone="red">{t('Hidden', 'Masquee')}</Badge>}
            {node.min_role_to_view !== 'public' && (
              <Badge tone="gold">{node.min_role_to_view}</Badge>
            )}
            {node.min_role_to_post !== 'member' && (
              <Badge tone="navy">{t('post: ', 'post : ') + node.min_role_to_post}</Badge>
            )}
          </div>
          <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
            /{node.slug}
            {node.icon ? ` · ${node.icon}` : ''}
            {` · ${topics} ${t('topic(s)', 'sujet(s)')}`}
          </div>
        </div>

        <button title={node.is_hidden ? t('Show', 'Afficher') : t('Hide', 'Masquer')}
          onClick={() => toggleHidden(node)} disabled={busy} style={iconBtn}>
          {node.is_hidden ? <Ico.eyeOff size={15} /> : <Ico.eye size={15} />}
        </button>
        <button title={t('Edit', 'Modifier')}
          onClick={() => setEditing({ ...node })} disabled={busy} style={iconBtn}>
          <Ico.pencil size={15} />
        </button>
        <button title={t('Delete', 'Supprimer')}
          onClick={() => removeCategory(node)} disabled={busy}
          style={{ ...iconBtn, color: C.red }}>
          <Ico.trash size={15} />
        </button>
      </div>
    )
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        backgroundColor: C.navy,
        padding: isMobile ? '32px 16px 24px' : '40px 24px 32px',
        color: '#FFFFFF',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <Link href={`/${locale}/admin`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none', marginBottom: '12px',
          }}>
            <Ico.back size={14} color="rgba(255,255,255,0.5)" />
            {t('Admin hub', 'Hub admin')}
          </Link>
          <h1 style={{
            margin: 0, fontWeight: 900, color: '#FFFFFF',
            fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-0.02em',
          }}>
            {t('Forum structure', 'Structure du forum')}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '15px',
            lineHeight: 1.6, margin: '8px 0 0', maxWidth: '560px',
          }}>
            {t(
              'Create, rename, reorder and hide the forum sections. Drag a row to move it; drop a sub-section onto a section to reattach it.',
              'Cree, renomme, reordonne et masque les sections du forum. Glisse une ligne pour la deplacer ; depose une sous-section sur une section pour la rattacher.'
            )}
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '960px', margin: '0 auto',
        padding: isMobile ? '24px 16px 64px' : '32px 24px 80px',
      }}>

        {/* Barre d'actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          flexWrap: 'wrap', marginBottom: '20px',
        }}>
          <button onClick={() => openNew(null)} disabled={busy} style={btnPrimary}>
            <Ico.plus size={16} color="#FFFFFF" />
            {t('New section', 'Nouvelle section')}
          </button>
          {dirty && (
            <>
              <button onClick={saveOrder} disabled={busy}
                style={{ ...btnPrimary, backgroundColor: C.green }}>
                <Ico.check size={16} color="#FFFFFF" />
                {busy ? t('Saving...', 'Enregistrement...') : t('Save order', "Enregistrer l'ordre")}
              </button>
              <button onClick={resetOrder} disabled={busy} style={btnSecondary}>
                {t('Cancel changes', 'Annuler les modifications')}
              </button>
            </>
          )}
        </div>

        {msg && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
            fontSize: '14px', fontWeight: 600,
            backgroundColor: msg.kind === 'ok' ? C.greenBg : C.redBg,
            color: msg.kind === 'ok' ? C.green : C.red,
          }}>{msg.text}</div>
        )}

        {/* Arbre */}
        {parents.length === 0 ? (
          <div style={{
            backgroundColor: C.surface, borderRadius: '12px',
            border: `1px solid ${C.border}`, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ color: C.muted, fontSize: '14px', margin: 0 }}>
              {t('No section yet. Create the first one.', 'Aucune section. Cree la premiere.')}
            </p>
          </div>
        ) : (
          parents.map((p) => (
            <div key={p.id} style={{
              backgroundColor: C.surface, borderRadius: '12px',
              border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
              padding: '12px', marginBottom: '16px',
            }}>
              {renderRow(p, 'parent')}

              <div style={{ paddingLeft: isMobile ? '12px' : '32px' }}>
                {childrenOf(p.id).map((k) => renderRow(k, 'child'))}

                <button onClick={() => openNew(p.id)} disabled={busy}
                  style={{
                    ...btnSecondary, minHeight: '38px', padding: '7px 14px',
                    fontSize: '13px', marginTop: '4px', color: C.muted,
                  }}>
                  <Ico.plus size={14} />
                  {t('Add sub-section', 'Ajouter une sous-section')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale d'edition */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15,25,35,0.5)',
            zIndex: 1400, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center', padding: isMobile ? 0 : '24px',
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: C.surface, width: '100%', maxWidth: '560px',
              borderRadius: isMobile ? '16px 16px 0 0' : '16px',
              maxHeight: isMobile ? '92dvh' : '86vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(22,50,79,0.22)',
            }}>
            <div style={{
              padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
              position: 'sticky', top: 0, backgroundColor: C.surface, zIndex: 1,
            }}>
              <h2 style={{
                margin: 0, fontSize: '22px', fontWeight: 900,
                color: C.navy, letterSpacing: '-0.02em',
              }}>
                {editing.__new
                  ? (editing.parent_id ? t('New sub-section', 'Nouvelle sous-section') : t('New section', 'Nouvelle section'))
                  : t('Edit section', 'Modifier la section')}
              </h2>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '18px' }}>

              <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <div>
                  <label style={labelStyle}>{t('Name (FR)', 'Nom (FR)')}</label>
                  <input style={inputStyle} value={editing.name_fr || ''}
                    onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>{t('Name (EN)', 'Nom (EN)')}</label>
                  <input style={inputStyle} value={editing.name_en || ''}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Slug</label>
                <input style={inputStyle} value={editing.slug || ''}
                  placeholder={slugify(editing.name_fr) || 'section'}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                <p style={{ fontSize: '12px', color: C.muted, margin: '6px 0 0' }}>
                  {t('Used in the URL. Leave empty to generate from the French name.',
                     "Utilise dans l'URL. Laisse vide pour le generer depuis le nom francais.")}
                </p>
              </div>

              <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <div>
                  <label style={labelStyle}>{t('Description (FR)', 'Description (FR)')}</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                    value={editing.description_fr || ''}
                    onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>{t('Description (EN)', 'Description (EN)')}</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                    value={editing.description_en || ''}
                    onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <div>
                  <label style={labelStyle}>{t('Icon', 'Icone')}</label>
                  <input style={inputStyle} list="kf-forum-icons" value={editing.icon || ''}
                    onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
                  <datalist id="kf-forum-icons">
                    {knownIcons.map((i) => <option key={i} value={i} />)}
                  </datalist>
                </div>
                <div>
                  <label style={labelStyle}>{t('Colour (hex)', 'Couleur (hex)')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input style={inputStyle} placeholder="#16324F" value={editing.color || ''}
                      onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                    <span style={{
                      width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                      border: `1px solid ${C.border}`,
                      backgroundColor: editing.color || C.secondary,
                    }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t('Parent section', 'Section parente')}</label>
                <select
                  style={inputStyle}
                  value={editing.parent_id || ''}
                  disabled={!editing.__new && childrenOf(editing.id).length > 0}
                  onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}>
                  <option value="">{t('— Top level section —', '— Section principale —')}</option>
                  {parents.filter((p) => p.id !== editing.id).map((p) => (
                    <option key={p.id} value={p.id}>
                      {locale === 'fr' ? p.name_fr : p.name_en}
                    </option>
                  ))}
                </select>
                {!editing.__new && childrenOf(editing.id).length > 0 && (
                  <p style={{ fontSize: '12px', color: C.muted, margin: '6px 0 0' }}>
                    {t('A section with sub-sections cannot be nested.',
                       'Une section qui contient des sous-sections ne peut pas etre imbriquee.')}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <div>
                  <label style={labelStyle}>{t('Minimum role to view', 'Role minimum pour voir')}</label>
                  <select style={inputStyle} value={editing.min_role_to_view}
                    onChange={(e) => setEditing({ ...editing, min_role_to_view: e.target.value })}>
                    {VIEW_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t('Minimum role to post', 'Role minimum pour poster')}</label>
                  <select style={inputStyle} value={editing.min_role_to_post}
                    onChange={(e) => setEditing({ ...editing, min_role_to_post: e.target.value })}>
                    {POST_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '14px', color: C.text, cursor: 'pointer', minHeight: '44px',
              }}>
                <input type="checkbox" checked={!!editing.is_hidden}
                  onChange={(e) => setEditing({ ...editing, is_hidden: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: C.navy }} />
                {t('Hidden from members', 'Masquee pour les membres')}
              </label>
            </div>

            <div style={{
              padding: '16px 24px', borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: '12px', justifyContent: 'flex-end',
              position: 'sticky', bottom: 0, backgroundColor: C.surface,
            }}>
              <button onClick={() => setEditing(null)} disabled={busy} style={btnSecondary}>
                {t('Cancel', 'Annuler')}
              </button>
              <button onClick={saveCategory} disabled={busy} style={btnPrimary}>
                {busy ? t('Saving...', 'Enregistrement...') : t('Save', 'Enregistrer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
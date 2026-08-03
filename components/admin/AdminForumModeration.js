'use client'

// DESTINATION: components/admin/AdminForumModeration.js
//
// Trois vues : signalements, contenus en attente de validation, journal.
// Toutes les ecritures passent par les policies `*_mod` (is_forum_mod), qui
// acceptent forum_roles.role in ('moderator','admin') OU profiles.is_admin.
// Chaque action est tracee dans forum_mod_log.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AdminForumNav from '@/components/admin/AdminForumNav'

const C = {
  navy: '#16324F', navyDark: '#0F1923',
  gold: '#F4B400', goldBg: '#FEF3C7', goldText: '#92400E',
  red: '#D62828', redBg: '#FEE2E2',
  green: '#16A34A', greenBg: '#DCFCE7',
  blue: '#2563EB', blueBg: '#DBEAFE',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

const REASON_LABELS = {
  spam: { en: 'Spam', fr: 'Spam' },
  offensive: { en: 'Offensive', fr: 'Offensant' },
  off_topic: { en: 'Off topic', fr: 'Hors sujet' },
  harassment: { en: 'Harassment', fr: 'Harcelement' },
  misinformation: { en: 'Misinformation', fr: 'Desinformation' },
  other: { en: 'Other', fr: 'Autre' },
}

const btnBase = {
  padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
  cursor: 'pointer', border: 'none', minHeight: '40px',
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  transition: 'opacity 0.12s ease',
}
const btnNavy = { ...btnBase, backgroundColor: C.navy, color: '#FFFFFF' }
const btnGreen = { ...btnBase, backgroundColor: C.green, color: '#FFFFFF' }
const btnRed = { ...btnBase, backgroundColor: C.red, color: '#FFFFFF' }
const btnGhost = {
  ...btnBase, backgroundColor: 'transparent', color: C.navy,
  border: `1.5px solid ${C.borderSolid}`,
}
const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: '10px',
  border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface,
  fontSize: '13px', color: C.text, outline: 'none',
  fontFamily: 'inherit', resize: 'vertical',
}

function Badge({ tone = 'navy', children }) {
  const tones = {
    navy: { backgroundColor: C.secondary, color: C.navy },
    gold: { backgroundColor: C.goldBg, color: C.goldText },
    green: { backgroundColor: C.greenBg, color: C.green },
    red: { backgroundColor: C.redBg, color: C.red },
    blue: { backgroundColor: C.blueBg, color: C.blue },
  }
  return (
    <span style={{
      ...tones[tone], padding: '3px 8px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function Card({ children }) {
  return (
    <div style={{
      backgroundColor: C.surface, borderRadius: '12px',
      border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
      padding: '18px 20px', marginBottom: '14px',
    }}>{children}</div>
  )
}

function Excerpt({ body }) {
  if (!body) return null
  const text = String(body).replace(/\s+/g, ' ').trim()
  const short = text.length > 400 ? text.slice(0, 399) + '…' : text
  return (
    <p style={{
      margin: '10px 0 0', padding: '12px 14px', backgroundColor: C.bgAlt,
      borderRadius: '10px', borderLeft: `3px solid ${C.borderSolid}`,
      fontSize: '13px', lineHeight: 1.6, color: C.text, whiteSpace: 'pre-wrap',
    }}>{short}</p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminForumModeration({
  locale, reports: initialReports, pendingTopics, pendingPosts, modLog,
}) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const fmt = (d) => (d ? new Date(d).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB') : '—')

  const [tab, setTab] = useState('reports')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reports, setReports] = useState(initialReports)
  const [topics, setTopics] = useState(pendingTopics)
  const [posts, setPosts] = useState(pendingPosts)
  const [notes, setNotes] = useState({})
  const [uid, setUid] = useState(null)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUid(data?.user?.id || null))
  }, [])

  const pendingCount = useMemo(
    () => reports.filter(r => r.status === 'pending').length,
    [reports]
  )
  const queueCount = topics.length + posts.length

  const visibleReports = useMemo(
    () => (statusFilter === 'all' ? reports : reports.filter(r => r.status === statusFilter)),
    [reports, statusFilter]
  )

  async function logAction(supabase, action, targetType, targetId, details) {
    if (!uid) return
    await supabase.from('forum_mod_log').insert({
      actor_id: uid, action, target_type: targetType, target_id: targetId,
      details: details || null,
    })
  }

  async function run(key, fn) {
    setBusy(key); setMsg(null)
    try {
      await fn(createClient())
    } catch (e) {
      setMsg({ kind: 'err', text: e?.message || t('Action failed.', 'Action echouee.') })
    }
    setBusy(null)
  }

  // ── Signalements ───────────────────────────────────────────────────────────
  function closeReport(report, status) {
    run(`report-${report.id}`, async (supabase) => {
      const patch = {
        status,
        admin_note: (notes[report.id] || '').trim() || null,
        handled_by: uid,
        resolved_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('forum_reports').update(patch).eq('id', report.id)
      if (error) throw error
      await logAction(supabase, status === 'resolved' ? 'report_resolved' : 'report_dismissed',
        'report', report.id, { reason: report.reason })
      setReports(rs => rs.map(r => (r.id === report.id ? { ...r, ...patch } : r)))
      setMsg({ kind: 'ok', text: t('Report closed.', 'Signalement traite.') })
    })
  }

  function reopenReport(report) {
    run(`report-${report.id}`, async (supabase) => {
      const patch = { status: 'pending', handled_by: null, resolved_at: null }
      const { error } = await supabase.from('forum_reports').update(patch).eq('id', report.id)
      if (error) throw error
      setReports(rs => rs.map(r => (r.id === report.id ? { ...r, ...patch } : r)))
    })
  }

  // ── Contenus ───────────────────────────────────────────────────────────────
  function moderateTopic(topic, decision) {
    run(`topic-${topic.id}`, async (supabase) => {
      const { error } = await supabase.from('forum_topics')
        .update({ moderation: decision, updated_at: new Date().toISOString() })
        .eq('id', topic.id)
      if (error) throw error
      await logAction(supabase, `topic_${decision}`, 'topic', topic.id, { title: topic.title })
      setTopics(list => list.filter(x => x.id !== topic.id))
      setMsg({
        kind: 'ok',
        text: decision === 'approved'
          ? t('Topic published.', 'Sujet publie.')
          : t('Topic rejected.', 'Sujet rejete.'),
      })
    })
  }

  function moderatePost(post, decision) {
    run(`post-${post.id}`, async (supabase) => {
      const { error } = await supabase.from('forum_posts')
        .update({ moderation: decision })
        .eq('id', post.id)
      if (error) throw error
      await logAction(supabase, `post_${decision}`, 'post', post.id, null)
      setPosts(list => list.filter(x => x.id !== post.id))
      setMsg({
        kind: 'ok',
        text: decision === 'approved'
          ? t('Reply published.', 'Reponse publiee.')
          : t('Reply rejected.', 'Reponse rejetee.'),
      })
    })
  }

  function softDeletePost(postId, reportId) {
    if (!window.confirm(t('Delete this reply from the thread?', 'Supprimer ce message du fil ?'))) return
    run(`del-${postId}`, async (supabase) => {
      const { error } = await supabase.from('forum_posts')
        .update({ deleted_at: new Date().toISOString(), deleted_by: uid })
        .eq('id', postId)
      if (error) throw error
      await logAction(supabase, 'post_deleted', 'post', postId, reportId ? { report_id: reportId } : null)
      setReports(rs => rs.map(r =>
        r.post?.id === postId ? { ...r, post: { ...r.post, deleted_at: new Date().toISOString() } } : r
      ))
      setMsg({ kind: 'ok', text: t('Reply deleted.', 'Message supprime.') })
    })
  }

  function archiveTopic(topicId, reportId) {
    if (!window.confirm(t('Archive this topic? It disappears from the forum.',
      'Archiver ce sujet ? Il disparait du forum.'))) return
    run(`arch-${topicId}`, async (supabase) => {
      const { error } = await supabase.from('forum_topics')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', topicId)
      if (error) throw error
      await logAction(supabase, 'topic_archived', 'topic', topicId, reportId ? { report_id: reportId } : null)
      setReports(rs => rs.map(r =>
        r.topic?.id === topicId ? { ...r, topic: { ...r.topic, status: 'archived' } } : r
      ))
      setMsg({ kind: 'ok', text: t('Topic archived.', 'Sujet archive.') })
    })
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const TABS = [
    { key: 'reports', en: 'Reports', fr: 'Signalements', count: pendingCount },
    { key: 'queue', en: 'Awaiting review', fr: 'A valider', count: queueCount },
    { key: 'log', en: 'Activity log', fr: 'Journal', count: 0 },
  ]

  const STATUSES = [
    { key: 'pending', en: 'Open', fr: 'En cours' },
    { key: 'resolved', en: 'Resolved', fr: 'Traites' },
    { key: 'dismissed', en: 'Dismissed', fr: 'Rejetes' },
    { key: 'all', en: 'All', fr: 'Tous' },
  ]

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>

      <div style={{
        backgroundColor: C.navy,
        padding: isMobile ? '32px 16px 24px' : '40px 24px 32px',
        color: '#FFFFFF',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <Link href={`/${locale}/admin`} style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none', display: 'inline-block', marginBottom: '12px',
          }}>
            {t('Admin hub', 'Hub admin')}
          </Link>
          <h1 style={{
            margin: 0, fontWeight: 900, color: '#FFFFFF',
            fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-0.02em',
          }}>
            {t('Forum moderation', 'Moderation du forum')}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '15px',
            lineHeight: 1.6, margin: '8px 0 0', maxWidth: '560px',
          }}>
            {t('Handle reports, review content awaiting approval, and keep a trace of every action.',
               'Traite les signalements, valide les contenus en attente, et garde une trace de chaque action.')}
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '960px', margin: '0 auto',
        padding: isMobile ? '24px 16px 64px' : '32px 24px 80px',
      }}>
        <AdminForumNav locale={locale} active="moderation"
          badges={{ moderation: pendingCount + queueCount }} />

        {/* Onglets internes */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {TABS.map(x => (
            <button key={x.key} onClick={() => setTab(x.key)}
              style={{
                padding: '7px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
                border: tab === x.key ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`,
                backgroundColor: tab === x.key ? C.navy : C.secondary,
                color: tab === x.key ? '#FFFFFF' : C.muted,
                cursor: 'pointer', transition: 'all 0.15s', minHeight: '40px',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
              {t(x.en, x.fr)}
              {x.count > 0 && (
                <span style={{
                  backgroundColor: tab === x.key ? 'rgba(255,255,255,0.2)' : C.goldBg,
                  color: tab === x.key ? '#FFFFFF' : C.goldText,
                  borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700,
                }}>{x.count}</span>
              )}
            </button>
          ))}
        </div>

        {msg && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '18px',
            fontSize: '14px', fontWeight: 600,
            backgroundColor: msg.kind === 'ok' ? C.greenBg : C.redBg,
            color: msg.kind === 'ok' ? C.green : C.red,
          }}>{msg.text}</div>
        )}

        {/* ── SIGNALEMENTS ───────────────────────────────────────────────── */}
        {tab === 'reports' && (
          <>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {STATUSES.map(s => (
                <button key={s.key} onClick={() => setStatusFilter(s.key)}
                  style={{
                    padding: '6px 13px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                    border: `1.5px solid ${statusFilter === s.key ? C.navy : C.borderSolid}`,
                    backgroundColor: statusFilter === s.key ? C.surface : 'transparent',
                    color: statusFilter === s.key ? C.navy : C.muted,
                    cursor: 'pointer', minHeight: '36px',
                  }}>
                  {t(s.en, s.fr)}
                </button>
              ))}
            </div>

            {visibleReports.length === 0 ? (
              <Card>
                <p style={{ margin: 0, color: C.muted, fontSize: '14px', textAlign: 'center' }}>
                  {t('Nothing here.', 'Rien ici.')}
                </p>
              </Card>
            ) : visibleReports.map(r => {
              const reason = REASON_LABELS[r.reason]
                ? t(REASON_LABELS[r.reason].en, REASON_LABELS[r.reason].fr)
                : r.reason
              const isOpen = r.status === 'pending'
              return (
                <Card key={r.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <Badge tone={isOpen ? 'gold' : r.status === 'resolved' ? 'green' : 'navy'}>
                      {isOpen ? t('Open', 'En cours')
                        : r.status === 'resolved' ? t('Resolved', 'Traite')
                        : t('Dismissed', 'Rejete')}
                    </Badge>
                    <Badge tone="red">{reason}</Badge>
                    <Badge tone="blue">{r.post ? t('Reply', 'Message') : t('Topic', 'Sujet')}</Badge>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.muted }}>
                      {fmt(r.created_at)}
                    </span>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '14px', color: C.text }}>
                    <strong style={{ color: C.navy }}>
                      {r.topic?.title || t('Deleted content', 'Contenu supprime')}
                    </strong>
                    {r.topic?.category && (
                      <span style={{ color: C.muted }}>
                        {' · '}{locale === 'fr' ? r.topic.category.name_fr : r.topic.category.name_en}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>
                    {t('Reported by ', 'Signale par ')}
                    <strong>{r.reporter?.username || '—'}</strong>
                    {r.post?.author?.username && (
                      <>{t(' · author: ', ' · auteur : ')}<strong>{r.post.author.username}</strong></>
                    )}
                    {r.post?.deleted_at && <> · <span style={{ color: C.red }}>{t('deleted', 'supprime')}</span></>}
                    {r.topic?.status === 'archived' && <> · <span style={{ color: C.red }}>{t('archived', 'archive')}</span></>}
                  </div>

                  {r.description && (
                    <p style={{ margin: '10px 0 0', fontSize: '13px', color: C.text, lineHeight: 1.6 }}>
                      {r.description}
                    </p>
                  )}

                  <Excerpt body={r.post?.body} />

                  {r.admin_note && (
                    <p style={{ margin: '10px 0 0', fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>
                      {t('Note: ', 'Note : ')}{r.admin_note}
                      {r.handler?.username ? ` — ${r.handler.username}` : ''}
                    </p>
                  )}

                  {isOpen && (
                    <div style={{ marginTop: '14px' }}>
                      <textarea rows={2} style={inputStyle}
                        placeholder={t('Internal note (optional)', 'Note interne (facultatif)')}
                        value={notes[r.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                    {r.href && (
                      <Link href={r.href} target="_blank" style={{ ...btnGhost, textDecoration: 'none' }}>
                        {t('Open thread', 'Ouvrir le fil')}
                      </Link>
                    )}
                    {r.post && !r.post.deleted_at && (
                      <button onClick={() => softDeletePost(r.post.id, r.id)}
                        disabled={busy === `del-${r.post.id}`} style={btnRed}>
                        {t('Delete reply', 'Supprimer le message')}
                      </button>
                    )}
                    {r.topic && r.topic.status !== 'archived' && (
                      <button onClick={() => archiveTopic(r.topic.id, r.id)}
                        disabled={busy === `arch-${r.topic.id}`} style={btnGhost}>
                        {t('Archive topic', 'Archiver le sujet')}
                      </button>
                    )}
                    {isOpen ? (
                      <>
                        <button onClick={() => closeReport(r, 'resolved')}
                          disabled={busy === `report-${r.id}`} style={btnGreen}>
                          {t('Mark resolved', 'Marquer traite')}
                        </button>
                        <button onClick={() => closeReport(r, 'dismissed')}
                          disabled={busy === `report-${r.id}`} style={btnGhost}>
                          {t('Dismiss', 'Rejeter')}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => reopenReport(r)}
                        disabled={busy === `report-${r.id}`} style={btnGhost}>
                        {t('Reopen', 'Rouvrir')}
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </>
        )}

        {/* ── A VALIDER ──────────────────────────────────────────────────── */}
        {tab === 'queue' && (
          <>
            {queueCount === 0 ? (
              <Card>
                <p style={{ margin: 0, color: C.muted, fontSize: '14px', textAlign: 'center' }}>
                  {t('Nothing awaiting review.', 'Rien en attente de validation.')}
                </p>
              </Card>
            ) : (
              <>
                {topics.length > 0 && (
                  <h2 style={{
                    fontSize: '18px', fontWeight: 800, color: C.navy,
                    margin: '0 0 12px', letterSpacing: '-0.01em',
                  }}>
                    {t('Topics', 'Sujets')} ({topics.length})
                  </h2>
                )}
                {topics.map(x => (
                  <Card key={x.id}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px', color: C.navy }}>{x.title}</strong>
                      {x.category && (
                        <Badge tone="navy">
                          {locale === 'fr' ? x.category.name_fr : x.category.name_en}
                        </Badge>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.muted }}>
                        {x.author?.username || '—'} · {fmt(x.created_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                      <button onClick={() => moderateTopic(x, 'approved')}
                        disabled={busy === `topic-${x.id}`} style={btnGreen}>
                        {t('Publish', 'Publier')}
                      </button>
                      <button onClick={() => moderateTopic(x, 'rejected')}
                        disabled={busy === `topic-${x.id}`} style={btnRed}>
                        {t('Reject', 'Rejeter')}
                      </button>
                    </div>
                  </Card>
                ))}

                {posts.length > 0 && (
                  <h2 style={{
                    fontSize: '18px', fontWeight: 800, color: C.navy,
                    margin: '24px 0 12px', letterSpacing: '-0.01em',
                  }}>
                    {t('Replies', 'Reponses')} ({posts.length})
                  </h2>
                )}
                {posts.map(x => (
                  <Card key={x.id}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: C.navy }}>
                        {x.topic?.title || t('Unknown topic', 'Sujet inconnu')}
                      </strong>
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.muted }}>
                        {x.author?.username || '—'} · {fmt(x.created_at)}
                      </span>
                    </div>
                    <Excerpt body={x.body} />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                      {x.href && (
                        <Link href={x.href} target="_blank" style={{ ...btnGhost, textDecoration: 'none' }}>
                          {t('Open thread', 'Ouvrir le fil')}
                        </Link>
                      )}
                      <button onClick={() => moderatePost(x, 'approved')}
                        disabled={busy === `post-${x.id}`} style={btnGreen}>
                        {t('Publish', 'Publier')}
                      </button>
                      <button onClick={() => moderatePost(x, 'rejected')}
                        disabled={busy === `post-${x.id}`} style={btnRed}>
                        {t('Reject', 'Rejeter')}
                      </button>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {/* ── JOURNAL ────────────────────────────────────────────────────── */}
        {tab === 'log' && (
          <div style={{
            backgroundColor: C.surface, borderRadius: '12px',
            border: `1px solid ${C.border}`, overflow: 'hidden',
          }}>
            {modLog.length === 0 ? (
              <p style={{ margin: 0, padding: '32px', color: C.muted, fontSize: '14px', textAlign: 'center' }}>
                {t('No action recorded yet.', 'Aucune action enregistree.')}
              </p>
            ) : modLog.map((l, i) => (
              <div key={l.id} style={{
                display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
                padding: '12px 18px',
                borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
              }}>
                <Badge tone="navy">{l.action}</Badge>
                <span style={{ fontSize: '13px', color: C.text }}>
                  {l.target_type}
                </span>
                <span style={{ fontSize: '13px', color: C.muted }}>
                  {l.actor?.username || '—'}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.light }}>
                  {fmt(l.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
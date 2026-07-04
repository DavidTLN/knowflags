// DESTINATION: components/admin/AdminReportsList.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

const C = {
  navy: '#16324F', navyDark: '#0F1923', gold: '#F4B400', goldDark: '#92400E',
  green: '#16A34A', greenLight: '#DCFCE7', red: '#D62828', redLight: '#FEE2E2',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

const STATUS = {
  pending:  { en: 'Pending',      fr: 'En cours',       bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  resolved: { en: 'Resolved',     fr: 'Traitée',        bg: C.greenLight, color: C.green, border: '#BBF7D0' },
  rejected: { en: 'False alert',  fr: 'Fausse alerte',  bg: C.redLight,   color: C.red,   border: '#FECACA' },
}

const REASONS = {
  incorrect_flag: { en: 'Incorrect flag',        fr: 'Drapeau incorrect' },
  fake_flag:      { en: 'Fake flag',             fr: 'Faux drapeau' },
  flag_changed:   { en: 'The flag has changed',  fr: 'Le drapeau a changé' },
  offensive_flag: { en: 'Offensive flag',        fr: 'Drapeau insultant' },
  wrong_info:     { en: 'Incorrect information', fr: 'Informations erronées' },
}

const ctxK = { fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '10.5px', paddingTop: '1px', whiteSpace: 'nowrap' }
const ctxV = { color: C.text, minWidth: 0, wordBreak: 'break-word', fontSize: '12.5px' }

function shortUA(ua) {
  if (!ua) return ''
  const os = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  const s = [br, os].filter(Boolean).join(' · ')
  return s || ua.slice(0, 48)
}

export default function AdminReportsList({ reports, locale }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [items, setItems] = useState(reports || [])
  const [filter, setFilter] = useState('pending')
  const [busy, setBusy] = useState(null)

  const count = (s) => items.filter(r => r.status === s).length
  const filtered = filter === 'all' ? items : items.filter(r => r.status === filter)

  async function setStatus(id, status) {
    setBusy(id)
    try {
      const supabase = createClient()
      const patch = { status, resolved_at: status === 'pending' ? null : new Date().toISOString() }
      const { error } = await supabase.from('reports').update(patch).eq('id', id)
      if (!error) setItems(items.map(r => (r.id === id ? { ...r, ...patch } : r)))
    } finally {
      setBusy(null)
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  const TABS = [
    { key: 'pending',  ...STATUS.pending },
    { key: 'resolved', ...STATUS.resolved },
    { key: 'rejected', ...STATUS.rejected },
    { key: 'all',      en: 'All', fr: 'Toutes' },
  ]

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ backgroundColor: C.navy, padding: '24px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Admin</div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>
                {t('Reports', 'Signalements')}
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link href={`/${locale}/admin`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 600 }}>
              {t('Hub', 'Accueil')}
            </Link>
            <Link href={`/${locale}/admin/submissions`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 600 }}>
              {t('Submissions', 'Soumissions')}
            </Link>
            <Link href={`/${locale}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              ← {t('Back to site', 'Retour au site')}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {['pending', 'resolved', 'rejected'].map(s => (
            <div key={s} style={{ backgroundColor: STATUS[s].bg, borderRadius: '12px', padding: '16px 18px', border: `1px solid ${STATUS[s].border}` }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: STATUS[s].color }}>{count(s)}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: STATUS[s].color, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t(STATUS[s].en, STATUS[s].fr)}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map(tab => {
            const active = filter === tab.key
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                style={{ padding: '7px 16px', borderRadius: '9999px', border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`, backgroundColor: active ? C.navy : C.secondary, color: active ? 'white' : C.muted, fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {t(tab.en, tab.fr)}{tab.key !== 'all' ? ` · ${count(tab.key)}` : ''}
              </button>
            )
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: '14px', backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            {t('No reports here.', 'Aucun signalement ici.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(r => {
              const st = STATUS[r.status] || STATUS.pending
              const rs = REASONS[r.reason]
              const cName = r.country ? (locale === 'fr' ? r.country.name_fr : r.country.name_en) : (r.country_code || '').toUpperCase()
              const isBusy = busy === r.id
              const reporterLabel = r.reporter?.username
                ? (r.reporter_email ? `${r.reporter.username} · ${r.reporter_email}` : r.reporter.username)
                : (r.reporter_email || t('Anonymous', 'Anonyme'))
              return (
                <div key={r.id} style={{ backgroundColor: C.surface, borderRadius: '14px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px' }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {r.country_code && (
                        <img src={`https://flagcdn.com/w40/${r.country_code.toLowerCase()}.png`} alt="" width="26" height="18" style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.border}` }} onError={(e) => { e.target.style.display = 'none' }} />
                      )}
                      <Link href={`/${locale}/countries/${(r.country_code || '').toLowerCase()}`} style={{ fontSize: '15px', fontWeight: 800, color: C.navy, textDecoration: 'none' }}>{cName}</Link>
                      {rs && (
                        <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, backgroundColor: C.secondary, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          {t(rs.en, rs.fr)}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', padding: '4px 11px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0 }}>
                        {t(st.en, st.fr)}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ margin: '0 0 12px', fontSize: '14px', color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.description}</p>

                    {/* Context */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 12px', backgroundColor: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
                      <span style={ctxK}>{t('From', 'De')}</span>
                      <span style={ctxV}>{reporterLabel}</span>

                      <span style={ctxK}>{t('Page', 'Page')}</span>
                      <span style={ctxV}>
                        {r.page_path
                          ? <Link href={r.page_path} style={{ color: C.blue, textDecoration: 'none' }}>{r.page_path}</Link>
                          : (r.country_code || '—')}
                        <span style={{ color: C.muted }}> · {r.page_type || 'country'}</span>
                      </span>

                      <span style={ctxK}>{t('Language', 'Langue')}</span>
                      <span style={ctxV}>{(r.locale || '—').toUpperCase()}</span>

                      {r.user_agent && (
                        <>
                          <span style={ctxK}>{t('Device', 'Appareil')}</span>
                          <span style={{ ...ctxV, color: C.muted }} title={r.user_agent}>{shortUA(r.user_agent)}</span>
                        </>
                      )}
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: C.muted }}>
                      <span>{t('Reported', 'Signalé le')} {fmt(r.created_at)}</span>
                      {r.resolved_at && (r.status === 'resolved' || r.status === 'rejected') && (
                        <><span>·</span><span>{t('Handled', 'Traité le')} {fmt(r.resolved_at)}</span></>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', padding: '12px 18px', borderTop: `1px solid ${C.border}`, backgroundColor: C.bgAlt, flexWrap: 'wrap' }}>
                    {r.status !== 'resolved' && (
                      <button onClick={() => setStatus(r.id, 'resolved')} disabled={isBusy}
                        style={{ padding: '8px 14px', borderRadius: '9px', border: 'none', backgroundColor: C.green, color: 'white', fontSize: '13px', fontWeight: 600, cursor: isBusy ? 'wait' : 'pointer', opacity: isBusy ? 0.6 : 1 }}>
                        {t('Mark resolved', 'Marquer traitée')}
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => setStatus(r.id, 'rejected')} disabled={isBusy}
                        style={{ padding: '8px 14px', borderRadius: '9px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.red, fontSize: '13px', fontWeight: 600, cursor: isBusy ? 'wait' : 'pointer', opacity: isBusy ? 0.6 : 1 }}>
                        {t('False alert', 'Fausse alerte')}
                      </button>
                    )}
                    {r.status !== 'pending' && (
                      <button onClick={() => setStatus(r.id, 'pending')} disabled={isBusy}
                        style={{ padding: '8px 14px', borderRadius: '9px', border: `1.5px solid ${C.borderSolid}`, backgroundColor: 'transparent', color: C.muted, fontSize: '13px', fontWeight: 600, cursor: isBusy ? 'wait' : 'pointer', opacity: isBusy ? 0.6 : 1, marginLeft: 'auto' }}>
                        {t('Reopen', 'Rouvrir')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
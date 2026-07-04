// DESTINATION: components/admin/AdminSubmissionsList.js
'use client'

import { useState } from 'react'
import Link from 'next/link'

const C = {
  navy: '#0B1F3B', cream: '#F4F1E6', border: '#E2DDD5',
  muted: '#8A8278', green: '#426A5A', red: '#C0392B', bg: '#F7F5EF',
}

const STATUS_COLORS = {
  pending:  { bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
  accepted: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  rejected: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

const FLAG_TYPE_ICONS = {
  country: '🌍', region: '🗺️', city: '🏙️', organisation: '🏛️', historic: '📜',
}

export default function AdminSubmissionsList({ submissions, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [filter, setFilter] = useState('pending')

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ backgroundColor: C.navy, padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Admin</div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'white' }}>
              🏳️ {t('Flag Submissions', 'Soumissions de drapeaux')}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link href={`/${locale}/admin`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '700' }}>
              {t('Hub', 'Accueil')}
            </Link>
            <Link href={`/${locale}/admin/reports`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '700' }}>
              {t('Reports', 'Signalements')}
            </Link>
            <Link href={`/${locale}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              ← {t('Back to site', 'Retour au site')}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: t('Pending', 'En attente'),  value: submissions.filter(s => s.status === 'pending').length,  color: '#854d0e', bg: '#fefce8' },
            { label: t('Accepted', 'Acceptées'),  value: submissions.filter(s => s.status === 'accepted').length, color: '#166534', bg: '#f0fdf4' },
            { label: t('Rejected', 'Refusées'),   value: submissions.filter(s => s.status === 'rejected').length, color: '#991b1b', bg: '#fef2f2' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '12px', padding: '16px 20px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: C.muted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: '99px', border: `1.5px solid ${filter === f ? C.navy : C.border}`, backgroundColor: filter === f ? C.navy : 'white', color: filter === f ? 'white' : C.muted, fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize' }}>
              {f === 'all' ? t('All', 'Toutes') : f}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.muted, fontSize: '14px' }}>
            {t('No submissions found.', 'Aucune soumission trouvée.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(s => {
              const st = STATUS_COLORS[s.status] || STATUS_COLORS.pending
              return (
                <Link key={s.id} href={`/${locale}/admin/submissions/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{FLAG_TYPE_ICONS[s.flag_type] || '🏳️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: C.navy, marginBottom: '3px' }}>
                        {s.label_en || s.name || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: C.muted, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span>{s.flag_type}</span>
                        <span>·</span>
                        <span>{s.entity_code}</span>
                        <span>·</span>
                        <span>by {s.profiles?.username || 'Unknown'}</span>
                        <span>·</span>
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0 }}>
                      {s.status}
                    </span>
                    <span style={{ color: C.muted, fontSize: '18px' }}>›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
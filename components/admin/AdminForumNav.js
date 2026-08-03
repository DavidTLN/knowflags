'use client'

// DESTINATION: components/admin/AdminForumNav.js
//
// Navigation partagee entre les ecrans d'administration du forum.
// Un seul endroit a modifier quand un nouvel onglet apparait.

import Link from 'next/link'

const C = {
  navy: '#16324F', gold: '#F4B400', goldText: '#92400E', goldBg: '#FEF3C7',
  borderSolid: '#E2DDD5', muted: '#6B7280', secondary: '#EEF2F7',
}

export const FORUM_ADMIN_TABS = [
  { key: 'structure',  path: '',            en: 'Structure',  fr: 'Structure' },
  { key: 'moderation', path: '/moderation', en: 'Moderation', fr: 'Moderation' },
]

export default function AdminForumNav({ locale, active, badges = {} }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  return (
    <div style={{
      display: 'flex', gap: '8px', flexWrap: 'wrap',
      marginBottom: '24px', paddingBottom: '4px',
    }}>
      {FORUM_ADMIN_TABS.map((tab) => {
        const isActive = tab.key === active
        const count = badges[tab.key] || 0
        return (
          <Link
            key={tab.key}
            href={`/${locale}/admin/forum${tab.path}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 16px', borderRadius: '9999px',
              fontSize: '13px', fontWeight: 600, textDecoration: 'none',
              border: isActive ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`,
              backgroundColor: isActive ? C.navy : C.secondary,
              color: isActive ? '#FFFFFF' : C.muted,
              transition: 'all 0.15s', minHeight: '40px', whiteSpace: 'nowrap',
            }}>
            {t(tab.en, tab.fr)}
            {count > 0 && (
              <span style={{
                backgroundColor: C.goldBg, color: C.goldText,
                borderRadius: '9999px', padding: '2px 8px',
                fontSize: '11px', fontWeight: 700,
              }}>{count}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useCollections } from './CollectionsContext'

const C = { navy: '#0B1F3B', red: '#C0392B', muted: '#8A8278', white: '#FFFFFF' }

// Compact heart toggle for flag cards. `size` controls the icon box.
export default function FavoriteHeart({ entityType, entityCode, countryCode, size = 30, locale: localeProp }) {
  const ctxLocale = useLocale()
  const locale = localeProp || ctxLocale
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const { user, isFavorite, toggleFavorite } = useCollections()
  const [busy, setBusy] = useState(false)

  const active = isFavorite(entityType, entityCode)

  async function onClick(e) {
    e.preventDefault(); e.stopPropagation()
    if (!user) { window.location.href = `/${locale}/login`; return }
    if (busy) return
    setBusy(true)
    try { await toggleFavorite({ entityType, entityCode, countryCode }) } finally { setBusy(false) }
  }

  return (
    <button
      onClick={onClick}
      title={user ? (active ? t('Remove from Favorites', 'Retirer des favoris') : t('Add to Favorites', 'Ajouter aux favoris'))
                  : t('Sign in to save', 'Connectez-vous pour enregistrer')}
      aria-pressed={active}
      style={{
        width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        backgroundColor: C.white, boxShadow: '0 2px 8px rgba(11,31,59,0.18)',
        opacity: busy ? 0.6 : 1, transition: 'transform 0.12s',
        fontSize: Math.round(size * 0.52), lineHeight: 1, padding: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ color: active ? C.red : C.muted, filter: active ? 'none' : 'grayscale(1)' }}>
        {active ? '❤️' : '🤍'}
      </span>
    </button>
  )
}

'use client'

// components/PendingScoreFlusher.js
//
// Monte une seule fois dans le layout. Des qu'une session apparait — a
// l'ouverture d'une page comme apres un retour de connexion Google — il ecrit
// le score qu'un invite avait laisse en attente, puis affiche une confirmation.
//
// POURQUOI DANS LE LAYOUT ET PAS DANS LE JEU
// La connexion quitte la page du jeu : le composant du jeu est demonte, et ne
// peut donc rien ecrire au retour. Seul un composant monte globalement voit
// l'utilisateur revenir.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { flushPendingScore, readPendingScore } from '@/lib/pendingScore'

const DS = {
  navy: '#16324F', green: '#16A34A', greenBg: '#DCFCE7',
  surface: '#FFFFFF', border: 'rgba(22,50,79,0.12)', muted: '#6B7280',
}

export default function PendingScoreFlusher({ locale = 'en' }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    // Rien en attente : on n'ouvre meme pas de connexion Supabase.
    if (!readPendingScore()) return

    let active = true
    const supabase = createClient()

    const run = async (userId) => {
      if (!userId || !active) return
      const done = await flushPendingScore(supabase, userId)
      if (done && active) setSaved(done)
    }

    supabase.auth.getSession().then(({ data: { session } }) => run(session?.user?.id))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => run(session?.user?.id)
    )

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!saved) return
    const id = setTimeout(() => setSaved(null), 6000)
    return () => clearTimeout(id)
  }, [saved])

  if (!saved) return null

  return (
    <div style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)',
      bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 1600,
      backgroundColor: DS.surface, borderRadius: '12px',
      border: `1px solid ${DS.border}`, boxShadow: '0 16px 48px rgba(22,50,79,0.18)',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <span style={{
        width: '26px', height: '26px', borderRadius: '9999px', flexShrink: 0,
        backgroundColor: DS.greenBg, color: DS.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: DS.navy, lineHeight: 1.3 }}>
          {t('Score saved', 'Score enregistré')}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: DS.muted }}>
          {saved.label || saved.game} · {Number(saved.score).toLocaleString()} pts
        </p>
      </div>
      <button onClick={() => setSaved(null)} aria-label={t('Close', 'Fermer')}
        style={{
          marginLeft: '6px', width: '32px', height: '32px', flexShrink: 0,
          border: 'none', backgroundColor: 'transparent', color: DS.muted,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
      </button>
    </div>
  )
}
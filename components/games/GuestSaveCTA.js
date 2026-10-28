'use client'

// components/games/GuestSaveCTA.js
//
// Invitation affichee en fin de partie a un joueur non connecte : son score
// est mis de cote localement, puis ecrit en base des qu'une session apparait
// (voir lib/pendingScore.js et components/PendingScoreFlusher.js).
//
// Le composant ne se rend pas si l'utilisateur est deja connecte, ni si le
// score est nul : dans ces deux cas l'invitation n'aurait aucun sens.
//
// Apres connexion, l'utilisateur revient sur la page d'ou il venait grace au
// parametre `next`. La partie elle-meme est perdue (le composant est demonte),
// mais le score, lui, est conserve — c'est ce qui compte.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { savePendingScore } from '@/lib/pendingScore'

const DS = {
  navy: '#16324F', navyDark: '#0F1923', gold: '#F4B400',
  surface: '#FFFFFF', border: '#E2DDD5', muted: '#6B7280', steel: '#9EB7E5',
}

export default function GuestSaveCTA({
  user,            // objet session ou null
  locale,
  game,            // 'flag-quiz'
  mode,            // 'flag_quiz' (facultatif)
  score,
  bestStreak,
  correct,
  played,
  label,           // 'Flag Quiz'
}) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [stored, setStored] = useState(false)

  // On met le score de cote des l'affichage de l'invitation, pas au clic :
  // l'utilisateur peut tres bien se connecter depuis le menu plutot que par
  // le bouton, et le score doit survivre dans les deux cas.
  useEffect(() => {
    if (user || !score || score <= 0) return
    savePendingScore({ game, mode, score, bestStreak, correct, played, label })
    setStored(true)
  }, [user, score, game, mode, bestStreak, correct, played, label])

  if (user || !score || score <= 0) return null

  const back = typeof window !== 'undefined'
    ? encodeURIComponent(window.location.pathname)
    : ''

  return (
    <div style={{
      backgroundColor: DS.navy, borderRadius: '14px',
      padding: '16px 18px', marginBottom: '12px',
      display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '180px' }}>
        <p style={{
          margin: '0 0 3px', fontSize: '11px', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.12em', color: DS.gold,
        }}>
          {t('Score not saved', 'Score non enregistré')}
        </p>
        <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3 }}>
          {t(`Keep your ${score.toLocaleString()} points`,
             `Conserve tes ${score.toLocaleString()} points`)}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
          {stored
            ? t('Sign in and this game joins the leaderboard.',
                'Connecte-toi et cette partie rejoint le classement.')
            : t('Sign in to appear on the leaderboard.',
                'Connecte-toi pour apparaître au classement.')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link prefetch={false} href={`/${locale}/auth/login?next=${back}`}
          style={{
            padding: '11px 18px', borderRadius: '10px', minHeight: '44px',
            backgroundColor: '#FFFFFF', color: DS.navy, fontSize: '14px',
            fontWeight: 800, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
          {t('Sign in', 'Se connecter')}
        </Link>
        <Link prefetch={false} href={`/${locale}/auth/login?next=${back}&mode=signup`}
          style={{
            padding: '11px 18px', borderRadius: '10px', minHeight: '44px',
            backgroundColor: 'transparent', color: '#FFFFFF',
            border: '1.5px solid rgba(255,255,255,0.35)',
            fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
          {t('Create account', 'Créer un compte')}
        </Link>
      </div>
    </div>
  )
}
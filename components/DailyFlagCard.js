'use client'

// Carte « Drapeau du jour » de la home. Le rendu serveur affiche la carte neutre ;
// après chargement, elle indique si le joueur a déjà joué aujourd'hui (stockage local).

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GameIcon from '@/components/games/GameIcon'
import { zurichDayKey, dayNumber, readLocal, secondsToNextDay } from '@/lib/dailyFlag'

export default function DailyFlagCard({ locale = 'en' }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const [status, setStatus] = useState(null)   // null | { done, won, guesses, hours }
  const [number, setNumber] = useState(null)

  useEffect(() => {
    const key = zurichDayKey()
    setNumber(dayNumber(key))
    const day = readLocal().days[key]
    setStatus({
      done: !!day?.done, won: !!day?.won, guesses: day?.guesses?.length || 0,
      started: !!day?.guesses?.length, hours: Math.floor(secondsToNextDay() / 3600),
    })
  }, [])

  const cta = !status ? t('Play', 'Jouer')
    : status.done ? t('See my result', 'Voir mon résultat')
    : status.started ? t('Continue', 'Continuer')
    : t('Play', 'Jouer')

  const sub = !status || !status.done
    ? t('One mystery flag, the same for everyone. 5 guesses.', 'Un drapeau mystère, le même pour tout le monde. 5 essais.')
    : status.won
      ? t(`Found in ${status.guesses}. Next flag in ${status.hours} h.`, `Trouvé en ${status.guesses} essai${status.guesses > 1 ? 's' : ''}. Prochain drapeau dans ${status.hours} h.`)
      : t(`Missed today. Next flag in ${status.hours} h.`, `Raté aujourd’hui. Prochain drapeau dans ${status.hours} h.`)

  return (
    <section style={{ backgroundColor: '#F4F1E6', padding: '24px 16px 8px' }}>
      <Link prefetch={false} href={`/${locale}/games/daily`} className="kf-daily-card"
        style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '18px 20px', borderRadius: '16px', backgroundColor: '#16324F', color: 'white', textDecoration: 'none', boxShadow: '0 4px 16px rgba(22,50,79,0.10)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
        <span style={{ width: '52px', height: '52px', flexShrink: 0, borderRadius: '14px', backgroundColor: 'rgba(244,180,0,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GameIcon name={status?.done ? (status.won ? 'check' : 'clock') : 'flame'} size={26} color="#F4B400" />
        </span>
        <span style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#F4B400' }}>
            {t('Flag of the day', 'Drapeau du jour')}{number ? ` · n° ${number}` : ''}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.01em' }}>
            {status?.done ? t('Come back tomorrow', 'Reviens demain') : t('Can you find today’s flag?', 'Sauras-tu trouver le drapeau du jour ?')}
          </span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{sub}</span>
        </span>
        <span style={{ flexShrink: 0, padding: '10px 20px', borderRadius: '10px', backgroundColor: '#F4B400', color: '#3A2A05', fontSize: '14px', fontWeight: 700 }}>{cta}</span>
      </Link>
      <style>{`.kf-daily-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(22,50,79,0.12)!important}`}</style>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import { useLocale } from 'next-intl'

const DS = {
  navy: '#16324F', navyDark: '#0F1923', bg: '#F4F1E6', surface: '#FFFFFF',
  border: '#E2DDD5', muted: '#6B7280', light: '#9CA3AF', gold: '#F4B400',
  green: '#16A34A', greenBg: '#DCFCE7', steel: '#9EB7E5',
}

const GAMES = [
  { key: 'flag-reveal',  icon: '🏳️', en: 'Flag Reveal',  fr: 'Flag Reveal',  descEn: 'Uncover the flag tile by tile',        descFr: 'Révèle le drapeau tuile par tuile',          color: '#2563EB', difficulty: 'easy'   },
  { key: 'flag-quiz',    icon: '❓',  en: 'Flag Quiz',    fr: 'Flag Quiz',    descEn: 'Multiple choice flag challenge',       descFr: 'Quel est ce drapeau ?',                     color: '#16A34A', difficulty: 'easy'   },
  { key: 'capital-city', icon: '🏙️', en: 'Capital Clue', fr: 'Capital Clue', descEn: 'Match the capital to its country',     descFr: 'Trouve la capitale du pays',                 color: '#EA580C', difficulty: 'medium' },
  { key: 'flag-clue',    icon: '🔍',  en: 'Flag Clue',    fr: 'Flag Clue',    descEn: 'Guess the country from fun facts',     descFr: 'Devine le pays grâce à des anecdotes',       color: '#DB2777', difficulty: 'medium' },
  { key: 'flag-ranker',  icon: '🏆',  en: 'Flag Rank',    fr: 'Flag Rank',    descEn: 'Rank countries by area, GDP and more', descFr: 'Classe les pays par superficie, PIB…',       color: '#F4B400', difficulty: 'medium' },
  { key: 'flag-locator', icon: '📍',  en: 'Flag Locator', fr: 'Flag Locator', descEn: 'Find the country on the map',          descFr: 'Trouve le pays sur la carte',                color: '#2563EB', difficulty: 'medium' },
  { key: 'flag-drawing', icon: '✏️',  en: 'Flag Draw',    fr: 'Flag Draw',    descEn: 'Can you draw it from memory?',         descFr: 'Sauras-tu le dessiner de mémoire ?',         color: '#7C3AED', difficulty: 'hard'   },
  { key: 'past-flag',    icon: '🏛️', en: 'Past Flag',    fr: 'Past Flag',    descEn: 'Guess the country from a historical flag', descFr: 'Trouve le pays via un drapeau historique', color: '#0EA5E9', difficulty: 'medium' },
  { key: 'subflag-quiz', icon: '🗺️', en: 'SubFlag Quiz', fr: 'SubFlag Quiz', descEn: 'Regional flag, find the country',      descFr: 'Drapeau régional, trouve le pays',           color: '#14B8A6', difficulty: 'hard'   },
  { key: 'gartic-phone', icon: '🎨',  en: 'Flag Phone',   fr: 'Flag Phone',   descEn: 'Describe, draw and guess flags',       descFr: 'Décris, dessine et devine les drapeaux',     color: '#F43F5E', difficulty: 'easy',   ready: false },
  { key: 'qui-est-ce',   icon: '🕵️', en: 'Guess Who',    fr: 'Qui est-ce ?', descEn: 'Yes/no questions to find the country', descFr: 'Questions oui/non pour trouver le pays',     color: '#8B5CF6', difficulty: 'medium', ready: false },
  { key: 'imposteur',    icon: '🔎',  en: 'Impostor',     fr: 'Imposteur',    descEn: "Find the flag that doesn't belong",    descFr: "Trouve l'imposteur parmi les drapeaux",       color: '#F59E0B', difficulty: 'medium', ready: false },
]

const COMING_SOON = []

const DIFFICULTY = {
  easy:   { bg: '#DCFCE7', text: '#166534', label: { en: 'Easy', fr: 'Facile' } },
  medium: { bg: '#FEF3C7', text: '#92400E', label: { en: 'Medium', fr: 'Moyen' } },
  hard:   { bg: '#FEE2E2', text: '#991B1B', label: { en: 'Hard', fr: 'Difficile' } },
}

function GameCard({ game, locale, coming }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const diff = game.difficulty ? DIFFICULTY[game.difficulty] : null

  const inner = (
    <div style={{
      backgroundColor: DS.surface, borderRadius: '16px', border: `1px solid ${DS.border}`,
      overflow: 'hidden', opacity: coming ? 0.6 : 1, cursor: coming ? 'default' : 'pointer',
      height: '100%', display: 'flex', flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(22,50,79,0.06)', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    }}
      onMouseEnter={e => { if (!coming) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(22,50,79,0.12)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(22,50,79,0.06)' }}
    >
      <div style={{ height: '5px', backgroundColor: game.color || DS.border }} />
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
          <span style={{
            fontSize: '26px', lineHeight: 1, width: '52px', height: '52px', flexShrink: 0,
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: (game.color || DS.navy) + '14',
          }}>{game.icon}</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {coming && (
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#EEF2F7', color: DS.muted, padding: '3px 9px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('Coming soon', 'Bientôt')}
              </span>
            )}
            {diff && !coming && (
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: diff.bg, color: diff.text, padding: '3px 9px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t(diff.label.en, diff.label.fr)}
              </span>
            )}
          </div>
        </div>

        <h3 style={{ margin: '0 0 5px', fontSize: '17px', fontWeight: '800', color: DS.navy, letterSpacing: '-0.3px' }}>
          {t(game.en, game.fr)}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: DS.muted, lineHeight: 1.5, flex: 1 }}>
          {t(game.descEn, game.descFr)}
        </p>

        {!coming && (
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: game.color || DS.navy }}>
            {t('Play now', 'Jouer')}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )

  if (coming) return inner
  return (
    <Link href={`/${locale}/games/${game.key}`} style={{ textDecoration: 'none', display: 'flex', alignSelf: 'stretch' }}>
      {inner}
    </Link>
  )
}

export default function GamesPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: isMobile ? '12px' : '16px',
    gridAutoRows: '1fr',
  }

  return (
    <>
    <div style={{ minHeight: '100dvh', backgroundColor: DS.bg, fontFamily: 'var(--font-body), system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ backgroundColor: DS.navy, padding: isMobile ? '28px 16px 24px' : '48px 24px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: DS.steel, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: DS.steel, borderRadius: '2px' }} />
            {t('Play & learn', 'Joue et apprends')}
          </p>
          <h1 style={{ margin: '0 0 10px', fontSize: isMobile ? '30px' : '40px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>
            {t('Games', 'Jeux')}
          </h1>
          <p style={{ margin: '0 0 22px', fontSize: isMobile ? '14px' : '16px', color: 'rgba(255,255,255,0.65)', maxWidth: '520px', lineHeight: 1.6 }}>
            {t(
              'Test your knowledge of world flags. Play, earn points and climb the leaderboard.',
              'Teste tes connaissances sur les drapeaux du monde. Joue, gagne des points et grimpe au classement.'
            )}
          </p>
          <Link href={`/${locale}/leaderboard`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.22)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><line x1="12" y1="14" x2="12" y2="18" /><path d="M8.5 21h7M9.5 21v-3h5v3" />
            </svg>
            {t('View leaderboard', 'Voir le classement')}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '28px 16px 40px' : '40px 24px' }}>

        {/* Available games */}
        <div style={{ marginBottom: COMING_SOON.length > 0 ? '44px' : '0' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: '900', color: DS.navy, margin: '0 0 18px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {t('All games', 'Tous les jeux')}
            <span style={{ fontSize: '13px', fontWeight: '800', backgroundColor: DS.greenBg, color: DS.green, padding: '2px 10px', borderRadius: '99px' }}>
              {GAMES.length}
            </span>
          </h2>
          <div style={gridStyle}>
            {GAMES.filter(g => g.ready !== false).map(game => (
              <GameCard key={game.key} game={game} locale={locale} coming={false} />
            ))}
          </div>
        </div>

        {/* Coming soon (only if any) */}
        {COMING_SOON.length > 0 && (
          <div>
            <h2 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: '900', color: DS.navy, margin: '0 0 18px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {t('Coming soon', 'Bientôt disponibles')}
              <span style={{ fontSize: '13px', fontWeight: '800', backgroundColor: '#EEF2F7', color: DS.muted, padding: '2px 10px', borderRadius: '99px' }}>
                {COMING_SOON.length}
              </span>
            </h2>
            <div style={gridStyle}>
              {COMING_SOON.map(game => (
                <GameCard key={game.key} game={game} locale={locale} coming={true} />
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard CTA */}
        <div style={{ marginTop: '44px', backgroundColor: DS.navy, borderRadius: '16px', padding: isMobile ? '22px 20px' : '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: '900', color: 'white' }}>
              {t('Global leaderboard', 'Classement mondial')}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: DS.steel }}>
              {t('Weekly, monthly and all-time rankings', 'Classements hebdomadaires, mensuels et de tous les temps')}
            </p>
          </div>
          <Link href={`/${locale}/leaderboard`}
            style={{ padding: '12px 24px', backgroundColor: DS.steel, color: DS.navy, borderRadius: '10px', fontWeight: '800', fontSize: '15px', textDecoration: 'none', flexShrink: 0 }}>
            {t('View rankings', 'Voir le classement')}
          </Link>
        </div>

      </div>
    </div>
    <Footer />
  </>
  )
}
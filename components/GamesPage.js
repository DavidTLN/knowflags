'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { useLocale } from 'next-intl'

const GAMES = [
  {
    key: 'flag-reveal',
    icon: '🏳️',
    en: 'Flag Reveal',
    fr: 'Flag Reveal',
    descEn: 'Uncover the flag tile by tile',
    descFr: 'Révèle le drapeau tuile par tuile',
    color: '#4a7fd4',
    difficulty: 'easy',
  },
  {
    key: 'flag-quiz',
    icon: '❓',
    en: 'Flag Quiz',
    fr: 'Flag Quiz',
    descEn: 'Multiple choice flag challenge',
    descFr: 'Quel est ce drapeau ?',
    color: '#22c55e',
    difficulty: 'easy',
  },
  {
    key: 'capital-city',
    icon: '🏙️',
    en: 'Capital Clue',
    fr: 'Capital Clue',
    descEn: 'Match the capital to its country',
    descFr: 'Trouve la capitale du pays',
    color: '#f97316',
    difficulty: 'medium',
  },
  {
    key: 'flag-drawing',
    icon: '✏️',
    en: 'Flag Drawer',
    fr: 'Flag Drawer',
    descEn: 'Can you draw it from memory?',
    descFr: 'Sauras-tu le dessiner de mémoire ?',
    color: '#8b5cf6',
    difficulty: 'hard',
  },
  {
    key: 'flag-ranker',
    icon: '🏆',
    en: 'Flag Ranker',
    fr: 'Flag Ranker',
    descEn: 'Rank countries by area, GDP and more',
    descFr: 'Classe les pays par superficie, PIB...',
    color: '#eab308',
    difficulty: 'medium',
  },
  {
    key: 'flag-clue',
    icon: '🔍',
    en: 'Flag Clue',
    fr: 'Flag Clue',
    descEn: 'Guess the country from fun facts',
    descFr: 'Devine le pays grâce à des anecdotes',
    color: '#ec4899',
    difficulty: 'medium',
  },
]

const COMING_SOON = [
  { key: 'past-flag',    icon: '🏛️', en: 'Past Flag',      fr: 'Past Flag',         descEn: 'Guess the country from a historical flag', descFr: 'Trouve le pays depuis un drapeau historique' },
  { key: 'subflag-quiz', icon: '🗺️', en: 'SubFlag Quiz',   fr: 'SubFlag Quiz',       descEn: 'Regional flag → find the country',         descFr: 'Drapeau régional → trouver le pays' },
  { key: 'gartic-phone', icon: '🎨', en: 'Flag Phone',      fr: 'Flag Phone',         descEn: 'Describe, draw, and guess flags',          descFr: 'Décris, dessine et devine les drapeaux' },
  { key: 'qui-est-ce',   icon: '🕵️', en: 'Qui est-ce?',   fr: 'Qui est-ce ?',       descEn: 'Yes/no questions to find the country',     descFr: 'Questions oui/non pour trouver le pays' },
  { key: 'imposteur',    icon: '🔎', en: 'Impostor Flag',   fr: 'Drapeau Imposteur',  descEn: "Find the flag that doesn't belong",        descFr: "Trouvez l'imposteur parmi les drapeaux" },
]

const DIFFICULTY_COLORS = {
  easy:   { bg: '#dcfce7', text: '#166534', label: { en: 'Easy', fr: 'Facile' } },
  medium: { bg: '#fef3c7', text: '#92400e', label: { en: 'Medium', fr: 'Moyen' } },
  hard:   { bg: '#fee2e2', text: '#991b1b', label: { en: 'Hard', fr: 'Difficile' } },
}

function GameCard({ game, locale, coming }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const diff = game.difficulty ? DIFFICULTY_COLORS[game.difficulty] : null

  const inner = (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      border: `1px solid ${coming ? '#e2e8f0' : '#e2e8f0'}`,
      overflow: 'hidden',
      opacity: coming ? 0.65 : 1,
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: coming ? 'default' : 'pointer',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { if (!coming) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)' }}}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Color bar */}
      <div style={{ height: '4px', backgroundColor: game.color || '#e2e8f0' }} />

      <div style={{ padding: '20px' }}>
        {/* Icon + badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '36px', lineHeight: 1 }}>{game.icon}</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {coming && (
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '99px' }}>
                {t('Coming soon', 'Bientôt')}
              </span>
            )}
            {diff && !coming && (
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: diff.bg, color: diff.text, padding: '2px 8px', borderRadius: '99px' }}>
                {t(diff.label.en, diff.label.fr)}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#0B1F3B', letterSpacing: '-0.3px' }}>
          {t(game.en, game.fr)}
        </h3>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5, flex: 1 }}>
          {t(game.descEn, game.descFr)}
        </p>

        {/* Play button */}
        {!coming && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: game.color || '#0B1F3B' }}>
            {t('Play now', 'Jouer')} →
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

  return (
    <>
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E6', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ backgroundColor: '#0B1F3B', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 10px', fontSize: '40px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>
            🎮 {t('Games', 'Jeux')}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '480px' }}>
            {t(
              'Test your knowledge of world flags. Play, earn points and climb the leaderboard.',
              'Testez vos connaissances sur les drapeaux du monde. Jouez, gagnez des points et grimpez au classement.'
            )}
          </p>
          <Link href={`/${locale}/leaderboard`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
            🏆 {t('View leaderboard', 'Voir le classement')}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Active games */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
            {t('Available games', 'Jeux disponibles')}
            <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: '99px' }}>
              {GAMES.length}
            </span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', gridAutoRows: '1fr' }}>
            {GAMES.map(game => (
              <GameCard key={game.key} game={game} locale={locale} coming={false} />
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
            {t('Coming soon', 'Bientôt disponibles')}
            <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 10px', borderRadius: '99px' }}>
              {COMING_SOON.length}
            </span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', gridAutoRows: '1fr' }}>
            {COMING_SOON.map(game => (
              <GameCard key={game.key} game={game} locale={locale} coming={true} />
            ))}
          </div>
        </div>

        {/* Leaderboard CTA */}
        <div style={{ marginTop: '48px', backgroundColor: '#0B1F3B', borderRadius: '16px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: 'white' }}>
              🏆 {t('Global Leaderboard', 'Classement mondial')}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#9EB7E5' }}>
              {t('Weekly, monthly and all-time rankings', 'Classements hebdomadaires, mensuels et tous les temps')}
            </p>
          </div>
          <Link href={`/${locale}/leaderboard`}
            style={{ padding: '12px 24px', backgroundColor: '#9EB7E5', color: '#0B1F3B', borderRadius: '10px', fontWeight: '800', fontSize: '15px', textDecoration: 'none', flexShrink: 0 }}>
            {t('View rankings', 'Voir le classement')}
          </Link>
        </div>

      </div>
    </div>
    <Footer />
  </>
  )
}
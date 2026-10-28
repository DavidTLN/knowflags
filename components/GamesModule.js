// components/GamesModule.js
//
// SERVER Component — pas de 'use client'.
// La liste des jeux est statique : rien n'a besoin de tourner dans le
// navigateur, le survol et le responsive sont gerts en CSS. Meme parti pris
// que GamesPage.js, donc zero JS pour ce module et aucun saut de mise en page.
//
// HIDDEN_GAMES doit rester aligne avec Header.js, GamesPage.js,
// LeaderboardPage.js et ProfilePage.js.

import Link from 'next/link'
import GameIcon from '@/components/games/GameIcon'

const DS = {
  navy: '#16324F', navyDark: '#0F1923', bg: '#F4F1E6', bgAlt: '#FAFAF7',
  surface: '#FFFFFF', border: '#E2DDD5', borderSoft: 'rgba(22,50,79,0.12)',
  muted: '#6B7280', light: '#9CA3AF', gold: '#F4B400', green: '#16A34A',
}

const GAME_ICON = {
  'flag-reveal': 'eye', 'flag-quiz': 'bulb', 'capital-city': 'pin', 'flag-clue': 'search',
  'flag-ranker': 'trophy', 'flag-locator': 'target', 'flag-drawing': 'brush',
  'past-flag': 'clock', 'subflag-quiz': 'sparkle',
}

const GAMES = [
  { key: 'flag-reveal',  en: 'Flag Reveal',  fr: 'Flag Reveal',  descEn: 'Uncover the flag tile by tile',        descFr: 'Révèle le drapeau tuile par tuile',    color: '#2563EB', difficulty: 'easy'   },
  { key: 'flag-quiz',    en: 'Flag Quiz',    fr: 'Flag Quiz',    descEn: 'Multiple choice flag challenge',       descFr: 'Quel est ce drapeau ?',                color: '#16A34A', difficulty: 'easy'   },
  { key: 'capital-city', en: 'Capital2Flag', fr: 'Capital2Flag', descEn: 'Match the capital to its country',     descFr: 'Trouve la capitale du pays',           color: '#EA580C', difficulty: 'medium' },
  { key: 'flag-clue',    en: 'Clue2flag',    fr: 'Clue2flag',    descEn: 'Guess the country from fun facts',     descFr: 'Devine le pays grâce à des anecdotes', color: '#DB2777', difficulty: 'medium' },
  { key: 'flag-ranker',  en: 'Flag Rank',    fr: 'Flag Rank',    descEn: 'Rank countries by area, GDP and more', descFr: 'Classe les pays par superficie, PIB…', color: '#F4B400', difficulty: 'medium' },
  { key: 'flag-locator', en: 'Flag Locator', fr: 'Flag Locator', descEn: 'Find the country on the map',          descFr: 'Trouve le pays sur la carte',          color: '#2563EB', difficulty: 'medium' },
  { key: 'flag-drawing', en: 'Flag Draw',    fr: 'Flag Draw',    descEn: 'Can you draw it from memory?',         descFr: 'Sauras-tu le dessiner de mémoire ?',   color: '#7C3AED', difficulty: 'hard'   },
  { key: 'past-flag',    en: 'Past Flag',    fr: 'Past Flag',    descEn: 'Guess the country from a historical flag', descFr: 'Trouve le pays via un drapeau historique', color: '#0EA5E9', difficulty: 'medium' },
  { key: 'subflag-quiz', en: 'SubFlag Quiz', fr: 'SubFlag Quiz', descEn: 'Regional flag, find the country',      descFr: 'Drapeau régional, trouve le pays',     color: '#14B8A6', difficulty: 'hard'   },
]

const HIDDEN_GAMES = ['past-flag', 'subflag-quiz', 'capital-city', 'flag-clue']
const VISIBLE_GAMES = GAMES.filter(g => !HIDDEN_GAMES.includes(g.key))

const DIFFICULTY = {
  easy:   { bg: '#DCFCE7', text: '#16A34A', en: 'Easy',   fr: 'Facile' },
  medium: { bg: '#FEF3C7', text: '#92400E', en: 'Medium', fr: 'Moyen' },
  hard:   { bg: '#FEE2E2', text: '#D62828', en: 'Hard',   fr: 'Difficile' },
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function GamesModule({ locale }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  return (
    <section style={{ backgroundColor: DS.bg, padding: '64px 0 72px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px' }}>

        {/* En-tete de section */}
        <p style={{
          margin: '0 0 6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.15em', color: DS.green, display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: DS.green, borderRadius: '2px' }} />
          {t('Play & learn', 'Jouer et apprendre')}
        </p>

        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: '20px', flexWrap: 'wrap', marginBottom: '28px',
        }}>
          <div style={{ maxWidth: '620px' }}>
            <h2 style={{
              margin: '0 0 10px', fontSize: 'clamp(26px, 3.2vw, 36px)', fontWeight: 900,
              color: DS.navy, letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>
              {t('Test your flag knowledge', 'Testez vos connaissances')}
            </h2>
            <p style={{ margin: 0, fontSize: '16px', color: DS.muted, lineHeight: 1.6 }}>
              {t('Seven ways to sharpen your geography — reveal a flag tile by tile, draw one from memory, or rank countries by the numbers. No account needed to start.',
                 'Sept façons d’aiguiser votre géographie : révélez un drapeau tuile par tuile, dessinez-le de mémoire, ou classez les pays par les chiffres. Aucun compte requis pour commencer.')}
            </p>
          </div>

          <Link prefetch={false} href={`/${locale}/leaderboard`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            backgroundColor: 'transparent', color: DS.navy,
            border: `1.5px solid ${DS.border}`, fontSize: '14px', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            {t('Leaderboard', 'Classement')}<ArrowRight />
          </Link>
        </div>

        {/* Grille des jeux */}
        <div className="kf-games-grid">
          {VISIBLE_GAMES.map(game => {
            const diff = DIFFICULTY[game.difficulty]
            return (
              <Link prefetch={false} key={game.key} href={`/${locale}/games/${game.key}`} className="kf-game-card"
                style={{
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  backgroundColor: DS.surface, borderRadius: '14px',
                  border: `1px solid ${DS.borderSoft}`, padding: '18px',
                  textDecoration: 'none', color: 'inherit',
                  boxShadow: '0 2px 8px rgba(22,50,79,0.08)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                    backgroundColor: game.color + '18', color: game.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <GameIcon name={GAME_ICON[game.key]} size={21} />
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: DS.navy, lineHeight: 1.25 }}>
                    {t(game.en, game.fr)}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '13px', color: DS.muted, lineHeight: 1.5, flex: 1 }}>
                  {t(game.descEn, game.descFr)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{
                    backgroundColor: diff.bg, color: diff.text,
                    padding: '3px 8px', borderRadius: '9999px',
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {t(diff.en, diff.fr)}
                  </span>
                  <span className="kf-game-cta" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '13px', fontWeight: 700, color: game.color,
                  }}>
                    {t('Play', 'Jouer')}<ArrowRight />
                  </span>
                </div>
              </Link>
            )
          })}

          {/* Tuile finale vers le catalogue complet */}
          <Link prefetch={false} href={`/${locale}/games`} className="kf-game-card"
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px',
              backgroundColor: DS.navy, borderRadius: '14px',
              border: `1px solid ${DS.navy}`, padding: '18px',
              textDecoration: 'none', color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(22,50,79,0.10)',
            }}>
            <span style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.25 }}>
              {t('All games', 'Tous les jeux')}
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {t('Browse the full catalogue and pick your challenge.',
                 'Parcourez le catalogue complet et choisissez votre défi.')}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '13px', fontWeight: 700, color: DS.gold, marginTop: '2px',
            }}>
              {t('Explore', 'Explorer')}<ArrowRight />
            </span>
          </Link>
        </div>
      </div>

      <style>{`
        .kf-games-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .kf-game-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .kf-game-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(22,50,79,0.12);
        }
        @media (max-width: 1023px) {
          .kf-games-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .kf-games-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .kf-game-card { transition: none; }
          .kf-game-card:hover { transform: none; }
        }
      `}</style>
    </section>
  )
}
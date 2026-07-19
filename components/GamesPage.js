// components/GamesPage.js
//
// SERVER Component — no 'use client'.
// The game list is static data, so nothing needs to run in the browser:
// responsiveness and hover are handled in CSS instead of useState/useEffect.
// Result: complete HTML, no layout flash on mobile, zero JS for this page.

import Link from 'next/link'
import Footer from '@/components/Footer'
import GameIcon from '@/components/games/GameIcon'

const DS = {
  navy: '#16324F', navyDark: '#0F1923', bg: '#F4F1E6', surface: '#FFFFFF',
  border: '#E2DDD5', muted: '#6B7280', light: '#9CA3AF', gold: '#F4B400',
  green: '#16A34A', greenBg: '#DCFCE7', steel: '#9EB7E5',
}

const GAME_ICON = {
  'flag-reveal': 'eye', 'flag-quiz': 'bulb', 'capital-city': 'pin', 'flag-clue': 'search',
  'flag-ranker': 'trophy', 'flag-locator': 'target', 'flag-drawing': 'brush', 'past-flag': 'clock',
  'subflag-quiz': 'sparkle', 'gartic-phone': 'brush', 'qui-est-ce': 'search', 'imposteur': 'search',
}

const GAMES = [
  { key: 'flag-reveal',  icon: '🏳️', en: 'Flag Reveal',  fr: 'Flag Reveal',  descEn: 'Uncover the flag tile by tile',        descFr: 'Révèle le drapeau tuile par tuile',          color: '#2563EB', difficulty: 'easy'   },
  { key: 'flag-quiz',    icon: '❓',  en: 'Flag Quiz',    fr: 'Flag Quiz',    descEn: 'Multiple choice flag challenge',       descFr: 'Quel est ce drapeau ?',                     color: '#16A34A', difficulty: 'easy'   },
  { key: 'capital-city', icon: '🏙️', en: 'Capital2Flag', fr: 'Capital2Flag', descEn: 'Match the capital to its country',     descFr: 'Trouve la capitale du pays',                 color: '#EA580C', difficulty: 'medium' },
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

const HIDDEN_GAMES = ['past-flag', 'subflag-quiz']
const COMING_SOON = []

const DIFFICULTY = {
  easy:   { bg: '#DCFCE7', text: '#16A34A', label: { en: 'Easy', fr: 'Facile' } },
  medium: { bg: '#FEF3C7', text: '#92400E', label: { en: 'Medium', fr: 'Moyen' } },
  hard:   { bg: '#FEE2E2', text: '#D62828', label: { en: 'Hard', fr: 'Difficile' } },
}

// ── All responsive + hover behaviour, no JavaScript ──────────────────────────
const CSS = `
.kf-games-wrap { min-height: 100dvh; background-color: ${DS.bg}; font-family: var(--font-body), system-ui, sans-serif; }
.kf-games-hero { background-color: ${DS.navy}; padding: 48px 24px 40px; }
.kf-games-inner { max-width: 1100px; margin: 0 auto; }
.kf-games-body { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }

.kf-games-eyebrow { margin: 0 0 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: ${DS.steel}; display: flex; align-items: center; gap: 8px; }
.kf-games-eyebrow span { display: inline-block; width: 20px; height: 2px; background-color: ${DS.steel}; border-radius: 2px; }
.kf-games-h1 { margin: 0 0 10px; font-size: 40px; font-weight: 900; color: #fff; letter-spacing: -1px; }
.kf-games-lead { margin: 0 0 22px; font-size: 16px; color: rgba(255,255,255,0.65); max-width: 520px; line-height: 1.6; }
.kf-games-h2 { font-size: 22px; font-weight: 900; color: ${DS.navy}; margin: 0 0 18px; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }

.kf-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background-color: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.22); color: #fff; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; transition: background 0.15s; }
.kf-btn-ghost:hover { background-color: rgba(255,255,255,0.18); }

/* Equal-width columns, equal-height rows */
.kf-games-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: stretch; grid-auto-rows: 1fr; }

.kf-card-link { text-decoration: none; display: flex; width: 100%; min-width: 0; align-self: stretch; }
.kf-card { background-color: ${DS.surface}; border-radius: 16px; border: 1px solid ${DS.border}; overflow: hidden; width: 100%; min-width: 0; height: 100%; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(22,50,79,0.06); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.kf-card-link:hover .kf-card { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(22,50,79,0.12); }
.kf-card.is-coming { opacity: 0.6; cursor: default; }
.kf-card-bar { height: 5px; flex-shrink: 0; }
.kf-card-body { padding: 18px; display: flex; flex-direction: column; flex: 1; min-width: 0; }
.kf-card-title { margin: 0 0 5px; font-size: 17px; font-weight: 800; color: ${DS.navy}; letter-spacing: -0.3px; min-height: 22px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kf-card-desc { margin: 0; font-size: 13px; color: ${DS.muted}; line-height: 1.5; height: 39px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.kf-card-cta { margin-top: auto; padding-top: 16px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; }
.kf-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }

.kf-cta { margin-top: 44px; background-color: ${DS.navy}; border-radius: 16px; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.kf-cta h2 { margin: 0 0 4px; font-size: 20px; font-weight: 900; color: #fff; }

@media (max-width: 1023px) {
  .kf-games-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .kf-games-hero { padding: 28px 16px 24px; }
  .kf-games-body { padding: 28px 16px 40px; }
  .kf-games-h1 { font-size: 30px; }
  .kf-games-lead { font-size: 14px; }
  .kf-games-h2 { font-size: 20px; }
  .kf-games-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .kf-cta { padding: 22px 20px; }
  .kf-cta h2 { font-size: 18px; }
}
`

function GameCard({ game, locale, coming }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const diff = game.difficulty ? DIFFICULTY[game.difficulty] : null
  const color = game.color || DS.navy

  const inner = (
    <div className={`kf-card${coming ? ' is-coming' : ''}`}>
      <div className="kf-card-bar" style={{ backgroundColor: game.color || DS.border }} />
      <div className="kf-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
          <span style={{
            width: '52px', height: '52px', flexShrink: 0, borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: color + '14',
          }}>
            <GameIcon name={GAME_ICON[game.key] || 'sparkle'} size={24} color={color} strokeWidth={2} />
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {coming && (
              <span className="kf-badge" style={{ backgroundColor: '#EEF2F7', color: DS.muted }}>
                {t('Coming soon', 'Bientôt')}
              </span>
            )}
            {diff && !coming && (
              <span className="kf-badge" style={{ backgroundColor: diff.bg, color: diff.text }}>
                {t(diff.label.en, diff.label.fr)}
              </span>
            )}
          </div>
        </div>

        <h3 className="kf-card-title">{t(game.en, game.fr)}</h3>
        <p className="kf-card-desc">{t(game.descEn, game.descFr)}</p>

        {!coming && (
          <div className="kf-card-cta" style={{ color }}>
            {t('Play now', 'Jouer')}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )

  if (coming) return <div className="kf-card-link">{inner}</div>

  return (
    <Link href={`/${locale}/games/${game.key}`} className="kf-card-link">
      {inner}
    </Link>
  )
}

export default function GamesPage({ locale = 'en' }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const available = GAMES.filter(g => g.ready !== false && !HIDDEN_GAMES.includes(g.key))

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="kf-games-wrap">

        {/* Hero */}
        <div className="kf-games-hero">
          <div className="kf-games-inner">
            <p className="kf-games-eyebrow">
              <span />
              {t('Play & learn', 'Joue et apprends')}
            </p>
            <h1 className="kf-games-h1">{t('Games', 'Jeux')}</h1>
            <p className="kf-games-lead">
              {t(
                'Test your knowledge of world flags. Play, earn points and climb the leaderboard.',
                'Teste tes connaissances sur les drapeaux du monde. Joue, gagne des points et grimpe au classement.'
              )}
            </p>
            <Link href={`/${locale}/leaderboard`} className="kf-btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><line x1="12" y1="14" x2="12" y2="18" /><path d="M8.5 21h7M9.5 21v-3h5v3" />
              </svg>
              {t('View leaderboard', 'Voir le classement')}
            </Link>
          </div>
        </div>

        <div className="kf-games-body">

          {/* Available games */}
          <div style={{ marginBottom: COMING_SOON.length > 0 ? '44px' : 0 }}>
            <h2 className="kf-games-h2">
              {t('All games', 'Tous les jeux')}
              <span style={{ fontSize: '13px', fontWeight: '800', backgroundColor: DS.greenBg, color: DS.green, padding: '2px 10px', borderRadius: '99px' }}>
                {available.length}
              </span>
            </h2>
            <div className="kf-games-grid">
              {available.map(game => (
                <GameCard key={game.key} game={game} locale={locale} coming={false} />
              ))}
            </div>
          </div>

          {/* Coming soon (only if any) */}
          {COMING_SOON.length > 0 && (
            <div>
              <h2 className="kf-games-h2">
                {t('Coming soon', 'Bientôt disponibles')}
                <span style={{ fontSize: '13px', fontWeight: '800', backgroundColor: '#EEF2F7', color: DS.muted, padding: '2px 10px', borderRadius: '99px' }}>
                  {COMING_SOON.length}
                </span>
              </h2>
              <div className="kf-games-grid">
                {COMING_SOON.map(game => (
                  <GameCard key={game.key} game={game} locale={locale} coming={true} />
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard CTA */}
          <div className="kf-cta">
            <div>
              <h2>{t('Global leaderboard', 'Classement mondial')}</h2>
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
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import FlagSubmitModal from '@/components/FlagSubmitModal'

const GAMES = [
  { key: 'flag-reveal',  en: 'FlagReveal',  fr: 'FlagReveal',  descEn: 'Uncover the flag tile by tile',        descFr: 'Révèle le drapeau tuile par tuile' },
  { key: 'flag-quiz',    en: 'FlagQuiz',    fr: 'FlagQuiz',    descEn: 'Multiple choice flag challenge',        descFr: 'Quel est ce drapeau ?' },
  { key: 'capital-city', en: 'CapitalClue', fr: 'CapitalClue', descEn: 'Match the capital to its country',     descFr: 'Trouve la capitale du pays' },
  { key: 'flag-drawing', en: 'FlagDrawer',  fr: 'FlagDrawer',  descEn: 'Can you draw it from memory?',          descFr: 'Sauras-tu le dessiner de mémoire ?' },
  { key: 'flag-ranker',  en: 'FlagRanker',  fr: 'FlagRanker',  descEn: 'Rank countries by area, GDP and more', descFr: 'Classe les pays par superficie, PIB...' },
  { key: 'flag-clue',    en: 'FlagClue',    fr: 'FlagClue',    descEn: 'Guess the country from fun facts',      descFr: 'Devine le pays grâce à des anecdotes' },
  // TODO: polish before release
  // { key: 'past-flag',    en: 'Past Flag',     fr: 'Past Flag',     descEn: 'Guess the country from a historical flag', descFr: 'Trouve le pays depuis un drapeau historique' },
  // { key: 'subflag-quiz', en: 'SubFlag Quiz',  fr: 'SubFlag Quiz',  descEn: 'Regional flag → find the country',        descFr: 'Drapeau régional → trouver le pays' },
  // { key: 'gartic-phone', en: 'Flag Phone',    fr: 'Flag Phone',    descEn: 'Describe, draw, and guess flags',         descFr: 'Décris, dessine et devine les drapeaux' },
  // { key: 'qui-est-ce',   en: 'Qui est-ce?',   fr: 'Qui est-ce ?',  descEn: 'Yes/no questions to find the country',    descFr: 'Questions oui/non pour trouver le pays' },
  // { key: 'imposteur',    en: 'Impostor Flag', fr: 'Drapeau Imposteur', descEn: 'Find the flag that doesn\'t belong',  descFr: 'Trouvez le drapeau qui n\'appartient pas au groupe' },
]

const FLAGS_MENU = [
  { href: 'countries',     en: 'Country Flags',    fr: 'Drapeaux des Pays',   descEn: 'All countries of the world',        descFr: 'Tous les drapeaux du monde' },
  { href: 'flags/regions', en: 'Regions & States', fr: 'Régions & États',     descEn: 'Provinces, cantons, Bundesländer…', descFr: 'Provinces, cantons, Bundesländer…' },
  { href: 'flags/cities',  en: 'City Flags',       fr: 'Drapeaux des Villes', descEn: 'Major cities around the world',     descFr: 'Grandes villes du monde entier' },
  { href: 'organisations', en: 'Organisations',    fr: 'Organisations',       descEn: 'UN, EU, NATO, FIFA and more',       descFr: 'ONU, UE, OTAN, FIFA et plus' },
]

const GAMES_COL1 = GAMES.slice(0, 6)
const GAMES_COL2 = GAMES.slice(6)

/* ----------------------------------------------------------------------
   Line icons — fines, 1.5px stroke, héritent de currentColor.
   Utilisées uniquement sur les catégories principales du drawer mobile.
---------------------------------------------------------------------- */
const ICON_PROPS = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
}

function IconFlags(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M5 21V4" />
      <path d="M5 4.5c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0v9c-2.5 1.6-5 1.6-7.5 0s-5-1.6-7.5 0" />
    </svg>
  )
}

function IconGames(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M7 8h10a4 4 0 0 1 4 4v3a3 3 0 0 1-5.4 1.8L14 14h-4l-1.6 2.8A3 3 0 0 1 3 15v-3a4 4 0 0 1 4-4Z" />
      <path d="M7.5 11v3M6 12.5h3" />
      <circle cx="16" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17.8" cy="13.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconBlog(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M5 4h10l4 4v12H5z" />
      <path d="M15 4v4h4" />
      <path d="M8.5 12.5h7M8.5 16h5" />
    </svg>
  )
}

function IconGlobe(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5Z" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#9EB7E5', flexShrink: 0 }}>
      <path d="M5.5 7.5L1 2.5h9l-4.5 5z"/>
    </svg>
  )
}

const DropdownPanel = ({ children, width = 280 }) => (
  <div style={{ position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)', width: `${width}px`, backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 200 }}>
    <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', backgroundColor: 'white', boxShadow: '-2px -2px 4px rgba(0,0,0,0.06)', zIndex: -1 }} />
    {children}
  </div>
)

export default function Header() {
  const locale   = useLocale()
  const pathname = usePathname()
  const router   = useRouter()

  const [menuOpen,     setMenuOpen]     = useState(false)
  const [drawerIn,     setDrawerIn]     = useState(false)   // pilote l'animation slide/fade
  const [gamesOpen,    setGamesOpen]    = useState(false)
  const [flagsOpen,    setFlagsOpen]    = useState(false)
  const [user,         setUser]         = useState(null)
  const [avatarOpen,   setAvatarOpen]   = useState(false)
  const [submitOpen,   setSubmitOpen]   = useState(false)

  const [flagsPanel, setFlagsPanel] = useState(false)   // sous-panneau Flags glissant
  const [gamesPanel, setGamesPanel] = useState(false)   // sous-panneau Games glissant

  const gamesRef  = useRef(null)
  const flagsRef  = useRef(null)
  const avatarRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (gamesRef.current  && !gamesRef.current.contains(e.target))  setGamesOpen(false)
      if (flagsRef.current  && !flagsRef.current.contains(e.target))  setFlagsOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Déclenche l'animation d'entrée une frame après le montage du drawer
  useEffect(() => {
    if (menuOpen) {
      const id = requestAnimationFrame(() => setDrawerIn(true))
      return () => cancelAnimationFrame(id)
    }
    setDrawerIn(false)
  }, [menuOpen])

  const t = (en, fr) => locale === 'fr' ? fr : en

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAvatarOpen(false)
    router.refresh()
  }

  function switchLocale() {
    const next = locale === 'en' ? 'fr' : 'en'
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  // Ferme le drawer avec l'animation de sortie, puis démonte
  function closeDrawer() {
    setDrawerIn(false)
    setTimeout(() => {
      setMenuOpen(false)
      setFlagsPanel(false)
      setGamesPanel(false)
    }, 240)
  }

  function openSubmit() {
    closeDrawer()
    setSubmitOpen(true)
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'
  function isActive(href) { return pathname.startsWith(href) }

  const navLinkStyle = (active) => ({
    fontSize: '15px', fontWeight: active ? '700' : '500',
    color: active ? '#9EB7E5' : '#F4F1E6', textDecoration: 'none',
    padding: '6px 2px', borderBottom: active ? '2px solid #9EB7E5' : '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
  })

  const dropdownBtnStyle = (active) => ({
    fontSize: '15px', fontWeight: active ? '700' : '500',
    color: active ? '#9EB7E5' : '#F4F1E6', background: 'none', border: 'none',
    borderBottom: active ? '2px solid #9EB7E5' : '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 2px', transition: 'color 0.15s', whiteSpace: 'nowrap',
  })

  const GameItem = ({ game, onClick }) => (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: game.soon ? 'default' : 'pointer', transition: 'background 0.12s' }}
      onMouseEnter={e => { if (!game.soon) e.currentTarget.style.backgroundColor = '#f0f4ff' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: game.soon ? '#cbd5e1' : '#9EB7E5', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: game.soon ? '#94a3b8' : '#0B1F3B' }}>{t(game.en, game.fr)}</span>
          {game.soon && <span style={{ fontSize: '10px', fontWeight: '700', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px' }}>{t('Soon', 'Bientôt')}</span>}
        </div>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(game.descEn, game.descFr)}</p>
      </div>
    </div>
  )

  return (
    <>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#0B1F3B', boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minWidth: 0 }}>

          {/* Logo */}
          <Link href={`/${locale}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src='/logo.png' alt='KnowFlags' style={{ height: '42px', width: 'auto', display: 'block' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>KnowFlags</span>
              <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '1.5px', color: '#FEB12F', lineHeight: 1, marginTop: '4px', display: 'block' }} className="logo-tagline">
                Learn. Play. Explore.
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center' }} className="desktop-nav">

            {/* Flags dropdown */}
            <div ref={flagsRef} style={{ position: 'relative' }}>
              <button onClick={() => { setFlagsOpen(o => !o); setGamesOpen(false) }} style={dropdownBtnStyle(isActive(`/${locale}/countries`))}>
                {t('Flags', 'Drapeaux')}<Chevron open={flagsOpen} />
              </button>
              {flagsOpen && (
                <DropdownPanel width={300}>
                  <div style={{ padding: '8px' }}>
                    {FLAGS_MENU.map(item => (
                      <div key={item.href} onClick={() => { router.push(`/${locale}/${item.href}`); setFlagsOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#9EB7E5', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{t(item.en, item.fr)}</div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{t(item.descEn, item.descFr)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DropdownPanel>
              )}
            </div>

            {/* Games dropdown */}
            <div ref={gamesRef} style={{ position: 'relative' }}>
              <button onClick={() => { setGamesOpen(o => !o); setFlagsOpen(false) }} style={dropdownBtnStyle(isActive(`/${locale}/games`))}>
                {t('Games', 'Jeux')}<Chevron open={gamesOpen} />
              </button>
              {gamesOpen && (
                <DropdownPanel width={560}>
                  <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                    <div style={{ borderRight: '1px solid #f0f0f0' }}>
                      {GAMES_COL1.map(game => (
                        <GameItem key={game.key} game={game} onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); setGamesOpen(false) } }} />
                      ))}
                    </div>
                    <div>
                      {GAMES_COL2.map(game => (
                        <GameItem key={game.key} game={game} onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); setGamesOpen(false) } }} />
                      ))}
                      <div onClick={() => { router.push(`/${locale}/leaderboard`); setGamesOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FEB12F', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{t('Leaderboard', 'Classement')}</div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{t('Global rankings', 'Classement mondial')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 16px' }}>
                    <Link href={`/${locale}/games`} onClick={() => setGamesOpen(false)} style={{ fontSize: '13px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
                      {t('View all games →', 'Voir tous les jeux →')}
                    </Link>
                  </div>
                </DropdownPanel>
              )}
            </div>

            <Link href={`/${locale}/blog`} style={navLinkStyle(isActive(`/${locale}/blog`))}>{t('Blog', 'Blog')}</Link>
            <Link href={`/${locale}/true-size`} style={navLinkStyle(isActive(`/${locale}/true-size`))}>{t('True Size Map', 'Carte Taille Réelle')}</Link>
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {/* Submit button — opens modal */}
            <button
              onClick={openSubmit}
              style={{ fontSize: '13px', fontWeight: '700', color: '#FEB12F', background: 'rgba(254,177,47,0.12)', border: '1.5px solid rgba(254,177,47,0.35)', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              className="submit-btn desktop-right"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(254,177,47,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(254,177,47,0.12)'}>
              {t('+ Submit', '+ Soumettre')}
            </button>

            <div className="desktop-right">
              {user ? (
                <div ref={avatarRef} style={{ position: 'relative' }}>
                  <button onClick={() => setAvatarOpen(o => !o)}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#426A5A', border: 'none', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {initials}
                  </button>
                  {avatarOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', overflow: 'hidden', minWidth: '200px', zIndex: 200 }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{user.email}</p>
                      </div>
                      <Link href={`/${locale}/profile`} onClick={() => setAvatarOpen(false)}
                        style={{ display: 'block', padding: '11px 16px', fontSize: '14px', color: '#0B1F3B', textDecoration: 'none', fontWeight: '500' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {t('My Profile', 'Mon Profil')}
                      </Link>
                      <Link href={`/${locale}/leaderboard`} onClick={() => setAvatarOpen(false)}
                        style={{ display: 'block', padding: '11px 16px', fontSize: '14px', color: '#0B1F3B', textDecoration: 'none', fontWeight: '500' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {t('Leaderboard', 'Classement')}
                      </Link>
                      <button onClick={() => { switchLocale(); setAvatarOpen(false) }}
                        style={{ width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: '14px', color: '#0B1F3B', background: 'none', border: 'none', borderTop: '1px solid #f0f0f0', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {locale === 'en'
                          ? <><svg width="20" height="13" viewBox="0 0 3 2" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg> Passer en français</>
                          : <><svg width="20" height="13" viewBox="0 0 60 40" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg> Switch to English</>
                        }
                      </button>
                      <button onClick={handleSignOut}
                        style={{ width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', borderTop: '1px solid #f0f0f0', cursor: 'pointer', fontWeight: '500' }}>
                        {t('Sign out', 'Déconnexion')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={switchLocale}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px', padding: '0', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                    {locale === 'en'
                      ? <svg width="24" height="16" viewBox="0 0 3 2" style={{ display: 'block' }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>
                      : <svg width="24" height="16" viewBox="0 0 60 40" style={{ display: 'block' }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg>
                    }
                  </button>
                  <Link href={`/${locale}/auth/login`}
                    style={{ fontSize: '14px', fontWeight: '600', color: '#0B1F3B', backgroundColor: '#9EB7E5', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                    {t('Sign in', 'Connexion')}
                  </Link>
                </div>
              )}
            </div>

            {/* Burger */}
            <button onClick={() => menuOpen ? closeDrawer() : setMenuOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'white' }}
              className="burger-btn" aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                {menuOpen
                  ? <><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></>
                  : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <>
            <div onClick={closeDrawer}
              style={{ position: 'fixed', inset: 0, top: '60px', backgroundColor: 'rgba(7,16,33,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 998, opacity: drawerIn ? 1 : 0, transition: 'opacity 0.24s ease' }} />
            <div
              style={{ position: 'fixed', top: '60px', right: 0, bottom: 0, width: '86vw', maxWidth: '352px', backgroundColor: '#F4F1E6', zIndex: 999, overflow: 'hidden', boxShadow: '-12px 0 40px rgba(0,0,0,0.3)', transform: drawerIn ? 'translateX(0)' : 'translateX(105%)', transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}>

              {/* Track horizontal : 3 panneaux côte à côte (principal / Flags / Games) */}
              <div style={{ display: 'flex', width: '300%', height: '100%', transform: flagsPanel ? 'translateX(-33.3333%)' : gamesPanel ? 'translateX(-66.6666%)' : 'translateX(0)', transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}>

                {/* ---------- Panneau principal ---------- */}
                <div style={{ width: '33.3333%', height: '100%', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '14px 18px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Navigation */}
                    <div>

                      {/* Flags — ouvre le sous-panneau */}
                      <button onClick={() => setFlagsPanel(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 2px', background: 'none', border: 'none', borderBottom: '1px solid #E2DDD5', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ color: '#5B7BB5', display: 'flex' }}><IconFlags width={22} height={22} /></span>
                          <span style={{ fontSize: '16.5px', fontWeight: '600', color: '#0B1F3B', letterSpacing: '-0.1px' }}>{t('Flags', 'Drapeaux')}</span>
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A89F8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>

                      {/* Games — ouvre le sous-panneau */}
                      <button onClick={() => setGamesPanel(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 2px', background: 'none', border: 'none', borderBottom: '1px solid #E2DDD5', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ color: '#5B7BB5', display: 'flex' }}><IconGames width={22} height={22} /></span>
                          <span style={{ fontSize: '16.5px', fontWeight: '600', color: '#0B1F3B', letterSpacing: '-0.1px' }}>{t('Games', 'Jeux')}</span>
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A89F8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>

                      {/* Blog — lien direct */}
                      <Link href={`/${locale}/blog`} onClick={closeDrawer}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '17px 2px', fontSize: '16.5px', color: '#0B1F3B', textDecoration: 'none', fontWeight: '600', borderBottom: '1px solid #E2DDD5', letterSpacing: '-0.1px' }}>
                        <span style={{ color: '#5B7BB5', display: 'flex' }}><IconBlog width={22} height={22} /></span>
                        {t('Blog', 'Blog')}
                      </Link>

                      {/* True Size — lien direct */}
                      <Link href={`/${locale}/true-size`} onClick={closeDrawer}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '17px 2px', fontSize: '16.5px', color: '#0B1F3B', textDecoration: 'none', fontWeight: '600', borderBottom: '1px solid #E2DDD5', letterSpacing: '-0.1px' }}>
                        <span style={{ color: '#5B7BB5', display: 'flex' }}><IconGlobe width={22} height={22} /></span>
                        {t('True Size Map', 'Carte Taille Réelle')}
                      </Link>
                    </div>

                    {/* Submit — bouton discret, après la navigation */}
                    <button onClick={openSubmit}
                      style={{ width: '100%', marginTop: '16px', padding: '11px', fontSize: '13.5px', fontWeight: '700', color: '#9A6D11', backgroundColor: 'transparent', border: '1px solid #D8C28A', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(254,177,47,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {t('+ Submit a Flag', '+ Soumettre un drapeau')}
                    </button>

                    {/* Espace flexible — pousse la carte compte vers le bas */}
                    <div style={{ flex: 1, minHeight: '12px' }} />

                    {/* Carte compte */}
                    <div style={{ backgroundColor: 'rgba(11,31,59,0.07)', border: '1px solid #D6CFC0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                      {user ? (
                        <>
                          {/* Identité */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#426A5A', color: 'white', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3E9E6E', flexShrink: 0, boxShadow: '0 0 0 3px rgba(62,158,110,0.16)' }} />
                              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0B1F3B', letterSpacing: '0.1px' }}>{t('Signed in', 'Connecté')}</span>
                            </div>
                          </div>
                          {/* Actions compte */}
                          <Link href={`/${locale}/profile`} onClick={closeDrawer}
                            style={{ padding: '12px 8px 11px', fontSize: '15.5px', color: '#2C4360', textDecoration: 'none', fontWeight: '600', borderTop: '1px solid #D6CFC0' }}>
                            {t('My Profile', 'Mon Profil')}
                          </Link>
                          <Link href={`/${locale}/games`} onClick={closeDrawer}
                            style={{ padding: '11px 8px', fontSize: '15.5px', color: '#2C4360', textDecoration: 'none', fontWeight: '600', borderTop: '1px solid #D6CFC0' }}>
                            {t('My Games Stats', 'Mes statistiques de jeu')}
                          </Link>
                          {/* Déconnexion — bouton discret, en dernier */}
                          <button onClick={() => { handleSignOut(); closeDrawer() }}
                            style={{ width: '100%', marginTop: '12px', padding: '9px', fontSize: '13px', fontWeight: '600', color: '#C0392B', backgroundColor: 'transparent', border: '1px solid #E3C4BF', borderRadius: '9px', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {t('Sign out', 'Déconnexion')}
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', paddingBottom: '14px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#A89F8E', flexShrink: 0 }} />
                            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#6E6555', letterSpacing: '0.1px' }}>{t('Not signed in', 'Non connecté')}</span>
                          </div>
                          <Link href={`/${locale}/auth/login`} onClick={closeDrawer}
                            style={{ display: 'block', padding: '12px', textAlign: 'center', fontSize: '14.5px', fontWeight: '700', color: '#F4F1E6', backgroundColor: '#0B1F3B', borderRadius: '10px', textDecoration: 'none' }}>
                            {t('Sign in', 'Connexion')}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pied — sélecteur de langue FR / EN */}
                  <div style={{ padding: '12px 18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#9A917F', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                      {locale === 'en' ? 'Language' : 'Langue'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* FR */}
                      {(() => {
                        const active = locale === 'fr'
                        return (
                          <button onClick={() => { if (!active) { switchLocale(); closeDrawer() } }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '8px',
                              cursor: active ? 'default' : 'pointer',
                              background: active ? '#9EB7E5' : '#FBFAF6',
                              border: active ? '1px solid #9EB7E5' : '1px solid #C9C0AD',
                              boxShadow: active ? 'none' : '0 1px 2px rgba(11,31,59,0.06)',
                              transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1EEE4' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#FBFAF6' }}>
                            <svg width="18" height="12" viewBox="0 0 3 2" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: active ? '#0B1F3B' : '#5A5446', letterSpacing: '0.4px' }}>FR</span>
                          </button>
                        )
                      })()}
                      {/* EN */}
                      {(() => {
                        const active = locale === 'en'
                        return (
                          <button onClick={() => { if (!active) { switchLocale(); closeDrawer() } }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '8px',
                              cursor: active ? 'default' : 'pointer',
                              background: active ? '#9EB7E5' : '#FBFAF6',
                              border: active ? '1px solid #9EB7E5' : '1px solid #C9C0AD',
                              boxShadow: active ? 'none' : '0 1px 2px rgba(11,31,59,0.06)',
                              transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1EEE4' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#FBFAF6' }}>
                            <svg width="18" height="12" viewBox="0 0 60 40" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: active ? '#0B1F3B' : '#5A5446', letterSpacing: '0.4px' }}>EN</span>
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* ---------- Sous-panneau Flags ---------- */}
                <div style={{ width: '33.3333%', height: '100%', overflowY: 'auto', flexShrink: 0 }}>
                  <div style={{ padding: '14px 18px 36px' }}>
                    <button onClick={() => setFlagsPanel(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 2px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B7BB5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#5B7BB5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('Flags', 'Drapeaux')}</span>
                    </button>

                    <div style={{ borderTop: '1px solid #E2DDD5' }}>
                      {FLAGS_MENU.map(item => (
                        <Link key={item.href} href={`/${locale}/${item.href}`} onClick={closeDrawer}
                          style={{ display: 'block', padding: '15px 2px', fontSize: '16px', fontWeight: '500', color: '#0B1F3B', textDecoration: 'none', borderBottom: '1px solid #E2DDD5' }}>
                          {t(item.en, item.fr)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---------- Sous-panneau Games ---------- */}
                <div style={{ width: '33.3333%', height: '100%', overflowY: 'auto', flexShrink: 0 }}>
                  <div style={{ padding: '14px 18px 36px' }}>
                    <button onClick={() => setGamesPanel(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 2px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B7BB5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#5B7BB5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('Games', 'Jeux')}</span>
                    </button>

                    <div style={{ borderTop: '1px solid #E2DDD5' }}>
                      {GAMES.map(game => (
                        <span key={game.key}
                          onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); closeDrawer() } }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 2px', fontSize: '16px', fontWeight: '500', borderBottom: '1px solid #E2DDD5', cursor: game.soon ? 'default' : 'pointer', color: game.soon ? '#A89F8E' : '#0B1F3B' }}>
                          {t(game.en, game.fr)}
                          {game.soon && <span style={{ fontSize: '10px', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px', fontWeight: '700' }}>{t('Soon', 'Bientôt')}</span>}
                        </span>
                      ))}
                      <span onClick={() => { router.push(`/${locale}/leaderboard`); closeDrawer() }}
                        style={{ display: 'block', padding: '15px 2px', fontSize: '16px', fontWeight: '500', color: '#0B1F3B', borderBottom: '1px solid #E2DDD5', cursor: 'pointer' }}>
                        {t('Leaderboard', 'Classement')}
                      </span>
                    </div>

                    <Link href={`/${locale}/games`} onClick={closeDrawer}
                      style={{ display: 'inline-block', marginTop: '16px', fontSize: '13px', color: '#B07D14', textDecoration: 'none', fontWeight: '700' }}>
                      {t('View all games →', 'Voir tous les jeux →')}
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        <style>{`
          header { overflow: visible; }
          @media (max-width: 768px) {
            .desktop-nav   { display: none !important; }
            .desktop-right { display: none !important; }
            .burger-btn    { display: flex !important; }
          }
          @media (max-width: 380px) {
            .logo-tagline  { display: none !important; }
          }
        `}</style>
      </header>

      {/* Flag Submit Modal — rendered outside header to avoid z-index issues */}
      {submitOpen && (
        <FlagSubmitModal onClose={() => setSubmitOpen(false)} />
      )}
    </>
  )
}
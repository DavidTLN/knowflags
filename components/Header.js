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
  { key: 'flag-drawing', en: 'FlagDrawer',  fr: 'FlagDrawer',  descEn: 'Can you draw it from memory?',         descFr: 'Sauras-tu le dessiner de mémoire ?' },
  { key: 'flag-ranker',  en: 'FlagRanker',  fr: 'FlagRanker',  descEn: 'Rank countries by area, GDP and more', descFr: 'Classe les pays par superficie, PIB...' },
  { key: 'flag-clue',    en: 'FlagClue',    fr: 'FlagClue',    descEn: 'Guess the country from fun facts',     descFr: 'Devine le pays grâce à des anecdotes' },
]

const FLAGS_MENU = [
  { href: 'countries',     en: 'Country Flags',    fr: 'Drapeaux des Pays',   descEn: 'All countries of the world',        descFr: 'Tous les drapeaux du monde' },
  { href: 'flags/regions', en: 'Regions & States', fr: 'Régions & États',     descEn: 'Provinces, cantons, Bundesländer…', descFr: 'Provinces, cantons, Bundesländer…' },
  { href: 'flags/cities',  en: 'City Flags',       fr: 'Drapeaux des Villes', descEn: 'Major cities around the world',     descFr: 'Grandes villes du monde entier' },
  { href: 'organisations', en: 'Organisations',    fr: 'Organisations',       descEn: 'UN, EU, NATO, FIFA and more',       descFr: 'ONU, UE, OTAN, FIFA et plus' },
]

const GAMES_COL1 = GAMES.slice(0, 3)
const GAMES_COL2 = GAMES.slice(3)

/* ── Line icons ──────────────────────────────────────────────────────────── */
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
  <div style={{
    position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)',
    width: `${width}px`, backgroundColor: '#FFFFFF', borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 200,
  }}>
    <div style={{
      position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
      width: '12px', height: '12px', backgroundColor: '#FFFFFF',
      boxShadow: '-2px -2px 4px rgba(0,0,0,0.06)', zIndex: -1,
    }} />
    {children}
  </div>
)

const GameItem = ({ game, onClick }) => (
  <div onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
      borderRadius: '10px', cursor: game.soon ? 'default' : 'pointer',
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => { if (!game.soon) e.currentTarget.style.backgroundColor = '#EEF2F7' }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: game.soon ? '#9CA3AF' : '#9EB7E5', flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: game.soon ? '#6B7280' : '#16324F' }}>{game.en}</span>
        {game.soon && <span style={{ fontSize: '10px', fontWeight: '700', color: '#92400E', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px' }}>Soon</span>}
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.descEn}</p>
    </div>
  </div>
)

export default function Header() {
  const locale   = useLocale()
  const pathname = usePathname()
  const router   = useRouter()

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [drawerIn,   setDrawerIn]   = useState(false)
  const [gamesOpen,  setGamesOpen]  = useState(false)
  const [flagsOpen,  setFlagsOpen]  = useState(false)
  const [user,       setUser]       = useState(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [flagsPanel, setFlagsPanel] = useState(false)
  const [gamesPanel, setGamesPanel] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  const gamesRef  = useRef(null)
  const flagsRef  = useRef(null)
  const avatarRef = useRef(null)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  useEffect(() => {
    if (menuOpen) {
      const id = requestAnimationFrame(() => setDrawerIn(true))
      return () => cancelAnimationFrame(id)
    }
    setDrawerIn(false)
  }, [menuOpen])

  const t = (en, fr) => locale === 'fr' ? fr : en

  function closeDrawer() {
    setDrawerIn(false)
    setTimeout(() => { setMenuOpen(false); setFlagsPanel(false); setGamesPanel(false) }, 280)
  }

  function openSubmit() {
    closeDrawer()
    setTimeout(() => setSubmitOpen(true), menuOpen ? 300 : 0)
  }

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/')

  const navLinkStyle = (active) => ({
    fontSize: '14px', fontWeight: active ? '700' : '500',
    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
    textDecoration: 'none', whiteSpace: 'nowrap',
    transition: 'color 0.15s',
    padding: '4px 0',
    borderBottom: active ? '2px solid #F4B400' : '2px solid transparent',
  })

  const dropdownBtnStyle = (active) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '14px', fontWeight: active ? '700' : '500',
    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
    padding: '4px 0',
    borderBottom: active ? '2px solid #F4B400' : '2px solid transparent',
    transition: 'color 0.15s',
  })

  return (
    <>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#0B1F3B', borderBottom: '1px solid rgba(255,255,255,0.08)', boxShadow: scrolled ? '0 4px 16px rgba(22,50,79,0.16)' : '0 1px 3px rgba(22,50,79,0.06)', transition: 'box-shadow 0.2s ease' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minWidth: 0 }}>

          {/* ── Logo ── */}
          <Link href={`/${locale}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src='/logo.svg' alt='Knowflags' style={{ height: '38px', width: 'auto', display: 'block', borderRadius: '10px' }} />
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1 }} className="logo-wordmark">Knowflags</span>
          </Link>

          {/* ── Desktop nav ── */}
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
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF2F7'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#9EB7E5', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#16324F' }}>{t(item.en, item.fr)}</div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>{t(item.descEn, item.descFr)}</p>
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
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF2F7'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F4B400', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#16324F' }}>{t('Leaderboard', 'Classement')}</div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>{t('Global rankings', 'Classement mondial')}</p>
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

          {/* ── Right side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {/* Submit button */}
            <button
              onClick={openSubmit}
              style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', background: '#FEF3C7', border: '1.5px solid #F4B400', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              className="submit-btn desktop-right"
              onMouseEnter={e => e.currentTarget.style.background = '#FDE68A'}
              onMouseLeave={e => e.currentTarget.style.background = '#FEF3C7'}>
              {t('+ Submit', '+ Soumettre')}
            </button>

            {/* Auth / avatar */}
            <div className="desktop-right">
              {user ? (
                <div ref={avatarRef} style={{ position: 'relative' }}>
                  <button onClick={() => setAvatarOpen(o => !o)}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#9EB7E5', border: '2px solid rgba(158,183,229,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user.user_metadata?.avatar_url
                      ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '14px', fontWeight: '800', color: '#16324F' }}>{(user.email?.[0] || '?').toUpperCase()}</span>
                    }
                  </button>
                  {avatarOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.16)', overflow: 'hidden', width: '180px', zIndex: 200 }}>
                      <Link href={`/${locale}/profile`} onClick={() => setAvatarOpen(false)}
                        style={{ display: 'block', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#16324F', textDecoration: 'none', borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {t('My Profile', 'Mon profil')}
                      </Link>
                      {user.user_metadata?.is_admin && (
                        <Link href={`/${locale}/admin/submissions`} onClick={() => setAvatarOpen(false)}
                          style={{ display: 'block', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#16324F', textDecoration: 'none', borderBottom: '1px solid #f0f0f0' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          Admin
                        </Link>
                      )}
                      <button onClick={async () => { const s = createClient(); await s.auth.signOut(); setAvatarOpen(false); setUser(null) }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#D62828', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {t('Sign out', 'Se déconnecter')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Language switcher */}
                  {(() => {
                    const active = locale === 'fr'
                    return (
                      <button onClick={() => router.push(pathname.replace(`/${locale}`, active ? '/en' : '/fr'))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                          borderRadius: '8px', cursor: 'pointer',
                          background: active ? '#9EB7E5' : '#FBFAF6',
                          border: active ? '1px solid #9EB7E5' : '1px solid #C9C0AD',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1EEE4' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#FBFAF6' }}>
                        {active
                          ? <svg width="18" height="12" viewBox="0 0 3 2" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>
                          : <svg width="18" height="12" viewBox="0 0 60 40" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg>
                        }
                        <span style={{ fontSize: '12px', fontWeight: '700', color: active ? '#16324F' : '#5A5446', letterSpacing: '0.4px' }}>
                          {active ? 'FR' : 'EN'}
                        </span>
                      </button>
                    )
                  })()}
                  <Link href={`/${locale}/auth/login`}
                    style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', backgroundColor: '#16324F', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                    {t('Sign in', 'Connexion')}
                  </Link>
                </div>
              )}
            </div>

            {/* Burger */}
            <button onClick={() => menuOpen ? closeDrawer() : setMenuOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#FFFFFF' }}
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

        {/* ── Mobile drawer ── */}
        {menuOpen && (
          <>
            <div onClick={closeDrawer}
              style={{ position: 'fixed', inset: 0, top: '60px', backgroundColor: 'rgba(7,16,33,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 998, opacity: drawerIn ? 1 : 0, transition: 'opacity 0.24s ease' }} />
            <div style={{ position: 'fixed', top: '60px', right: 0, bottom: 0, width: '86vw', maxWidth: '352px', backgroundColor: '#FFFFFF', zIndex: 999, overflow: 'hidden', boxShadow: '-12px 0 40px rgba(0,0,0,0.3)', transform: drawerIn ? 'translateX(0)' : 'translateX(105%)', transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}>

              {/* 3-panel horizontal track */}
              <div style={{ display: 'flex', width: '300%', height: '100%', transform: flagsPanel ? 'translateX(-33.3333%)' : gamesPanel ? 'translateX(-66.6666%)' : 'translateX(0)', transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}>

                {/* ── Panel principal ── */}
                <div style={{ width: '33.3333%', height: '100%', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '14px 18px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div>
                      <button onClick={() => setFlagsPanel(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 2px', background: 'none', border: 'none', borderBottom: '1px solid #E2DDD5', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ color: '#5B7BB5', display: 'flex' }}><IconFlags width={22} height={22} /></span>
                          <span style={{ fontSize: '16.5px', fontWeight: '600', color: '#16324F', letterSpacing: '-0.1px' }}>{t('Flags', 'Drapeaux')}</span>
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                      </button>

                      <button onClick={() => setGamesPanel(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 2px', background: 'none', border: 'none', borderBottom: '1px solid #E2DDD5', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ color: '#5B7BB5', display: 'flex' }}><IconGames width={22} height={22} /></span>
                          <span style={{ fontSize: '16.5px', fontWeight: '600', color: '#16324F', letterSpacing: '-0.1px' }}>{t('Games', 'Jeux')}</span>
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                      </button>

                      <Link href={`/${locale}/blog`} onClick={closeDrawer}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '17px 2px', fontSize: '16.5px', color: '#16324F', textDecoration: 'none', fontWeight: '600', borderBottom: '1px solid #E2DDD5', letterSpacing: '-0.1px' }}>
                        <span style={{ color: '#5B7BB5', display: 'flex' }}><IconBlog width={22} height={22} /></span>
                        {t('Blog', 'Blog')}
                      </Link>

                      <Link href={`/${locale}/true-size`} onClick={closeDrawer}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '17px 2px', fontSize: '16.5px', color: '#16324F', textDecoration: 'none', fontWeight: '600', borderBottom: '1px solid #E2DDD5', letterSpacing: '-0.1px' }}>
                        <span style={{ color: '#5B7BB5', display: 'flex' }}><IconGlobe width={22} height={22} /></span>
                        {t('True Size Map', 'Carte Taille Réelle')}
                      </Link>
                    </div>

                    {/* Account card */}
                    <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                      {user ? (
                        <div style={{ border: '1.5px solid #E2DDD5', borderRadius: '14px', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#9EB7E5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {user.user_metadata?.avatar_url
                                ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '15px', fontWeight: '800', color: '#16324F' }}>{(user.email?.[0] || '?').toUpperCase()}</span>
                              }
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#16324F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.user_metadata?.username || user.email?.split('@')[0] || 'Player'}
                              </p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href={`/${locale}/profile`} onClick={closeDrawer}
                              style={{ flex: 1, padding: '9px', textAlign: 'center', borderRadius: '9px', border: '1.5px solid #E2DDD5', fontSize: '13px', fontWeight: '700', color: '#16324F', textDecoration: 'none', backgroundColor: '#FFFFFF' }}>
                              {t('Profile', 'Profil')}
                            </Link>
                            <button onClick={async () => { const s = createClient(); await s.auth.signOut(); setUser(null); closeDrawer() }}
                              style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1.5px solid #E2DDD5', fontSize: '13px', fontWeight: '700', color: '#6B7280', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                              {t('Sign out', 'Déconnexion')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* Language switcher */}
                          {[{ code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }].map(({ code, label }) => {
                            const active = locale === code
                            return (
                              <button key={code}
                                onClick={() => { router.push(pathname.replace(`/${locale}`, `/${code}`)); closeDrawer() }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                                  borderRadius: '10px', cursor: 'pointer', flex: 1, justifyContent: 'center',
                                  background: active ? '#9EB7E5' : '#FBFAF6',
                                  border: active ? '1px solid #9EB7E5' : '1px solid #C9C0AD',
                                  boxShadow: active ? 'none' : '0 1px 2px rgba(11,31,59,0.06)',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1EEE4' }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#FBFAF6' }}>
                                {code === 'fr'
                                  ? <svg width="18" height="12" viewBox="0 0 3 2" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>
                                  : <svg width="18" height="12" viewBox="0 0 60 40" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg>
                                }
                                <span style={{ fontSize: '12px', fontWeight: '700', color: active ? '#16324F' : '#5A5446', letterSpacing: '0.4px' }}>{label}</span>
                              </button>
                            )
                          })}
                          <Link href={`/${locale}/auth/login`} onClick={closeDrawer}
                            style={{ flex: 2, padding: '9px', textAlign: 'center', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#16324F', backgroundColor: '#9EB7E5', textDecoration: 'none' }}>
                            {t('Sign in', 'Connexion')}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Sous-panneau Flags ── */}
                <div style={{ width: '33.3333%', height: '100%', overflowY: 'auto', flexShrink: 0 }}>
                  <div style={{ padding: '14px 18px 36px' }}>
                    <button onClick={() => setFlagsPanel(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 2px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B7BB5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#5B7BB5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('Flags', 'Drapeaux')}</span>
                    </button>
                    <div style={{ borderTop: '1px solid #E2DDD5' }}>
                      {FLAGS_MENU.map(item => (
                        <Link key={item.href} href={`/${locale}/${item.href}`} onClick={closeDrawer}
                          style={{ display: 'block', padding: '15px 2px', fontSize: '16px', fontWeight: '500', color: '#16324F', textDecoration: 'none', borderBottom: '1px solid #E2DDD5' }}>
                          {t(item.en, item.fr)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Sous-panneau Games ── */}
                <div style={{ width: '33.3333%', height: '100%', overflowY: 'auto', flexShrink: 0 }}>
                  <div style={{ padding: '14px 18px 36px' }}>
                    <button onClick={() => setGamesPanel(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 2px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B7BB5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#5B7BB5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('Games', 'Jeux')}</span>
                    </button>
                    <div style={{ borderTop: '1px solid #E2DDD5' }}>
                      {GAMES.map(game => (
                        <span key={game.key}
                          onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); closeDrawer() } }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 2px', fontSize: '16px', fontWeight: '500', borderBottom: '1px solid #E2DDD5', cursor: game.soon ? 'default' : 'pointer', color: game.soon ? '#9CA3AF' : '#16324F' }}>
                          {t(game.en, game.fr)}
                          {game.soon && <span style={{ fontSize: '10px', color: '#92400E', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px', fontWeight: '700' }}>{t('Soon', 'Bientôt')}</span>}
                        </span>
                      ))}
                      <span onClick={() => { router.push(`/${locale}/leaderboard`); closeDrawer() }}
                        style={{ display: 'block', padding: '15px 2px', fontSize: '16px', fontWeight: '500', color: '#16324F', borderBottom: '1px solid #E2DDD5', cursor: 'pointer' }}>
                        {t('Leaderboard', 'Classement')}
                      </span>
                    </div>
                    <Link href={`/${locale}/games`} onClick={closeDrawer}
                      style={{ display: 'inline-block', marginTop: '16px', fontSize: '13px', color: '#92400E', textDecoration: 'none', fontWeight: '700' }}>
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
            .desktop-nav    { display: none !important; }
            .desktop-right  { display: none !important; }
            .burger-btn     { display: flex !important; }
            .logo-wordmark  { font-size: 22px !important; }
          }
        `}</style>
      </header>

      {/* Flag Submit Modal */}
      {submitOpen && (
        <FlagSubmitModal onClose={() => setSubmitOpen(false)} />
      )}
    </>
  )
}
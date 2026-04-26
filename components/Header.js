'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

const GAMES = [
  { key: 'flag-reveal',  icon: '🏳️', en: 'FlagReveal',  fr: 'FlagReveal',  descEn: 'Uncover the flag tile by tile',        descFr: 'Révèle le drapeau tuile par tuile' },
  { key: 'flag-quiz',    icon: '❓',  en: 'FlagQuiz',    fr: 'FlagQuiz',    descEn: 'Multiple choice flag challenge',        descFr: 'Quel est ce drapeau ?' },
  { key: 'capital-city', icon: '🏙️', en: 'CapitalClue', fr: 'CapitalClue', descEn: 'Match the capital to its country',     descFr: 'Trouve la capitale du pays' },
  { key: 'flag-drawing', icon: '✏️', en: 'FlagDrawer',  fr: 'FlagDrawer',  descEn: 'Can you draw it from memory?',         descFr: 'Sauras-tu le dessiner de mémoire ?' },
  { key: 'flag-ranker',  icon: '🏆', en: 'FlagRanker',  fr: 'FlagRanker',  descEn: 'Rank countries by area, GDP and more', descFr: 'Classe les pays par superficie, PIB...' },
  { key: 'flag-clue',    icon: '🔍', en: 'FlagClue',    fr: 'FlagClue',    descEn: 'Guess the country from fun facts',     descFr: 'Devine le pays grâce à des anecdotes' },
]

const FLAGS_MENU = [
  { href: 'countries',       icon: '🌍', en: 'Country Flags',   fr: 'Drapeaux des Pays',    descEn: 'All countries of the world',         descFr: 'Tous les drapeaux du monde' },
  { href: 'flags/regions',   icon: '🗺️', en: 'Regions & States',fr: 'Régions & États',      descEn: 'Provinces, cantons, Bundesländer…',  descFr: 'Provinces, cantons, Bundesländer…' },
  { href: 'flags/cities',    icon: '🏙️', en: 'City Flags',      fr: 'Drapeaux des Villes',  descEn: 'Major cities around the world',      descFr: 'Grandes villes du monde entier' },
  { href: 'organisations',   icon: '🏛️', en: 'Organisations',   fr: 'Organisations',        descEn: 'UN, EU, NATO, FIFA and more',        descFr: 'ONU, UE, OTAN, FIFA et plus' },
]

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

  const [menuOpen,    setMenuOpen]    = useState(false)
  const [gamesOpen,   setGamesOpen]   = useState(false)
  const [flagsOpen,   setFlagsOpen]   = useState(false)
  const [user,        setUser]        = useState(null)
  const [avatarOpen,  setAvatarOpen]  = useState(false)

  // Mobile accordion state
  const [mFlagsOpen,  setMFlagsOpen]  = useState(false)
  const [mGamesOpen,  setMGamesOpen]  = useState(false)

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

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
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

  function closeDrawer() {
    setMenuOpen(false)
    setMFlagsOpen(false)
    setMGamesOpen(false)
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

  // ── Mobile accordion section ──────────────────────────────────────────────
  const AccordionSection = ({ icon, label, isOpen, onToggle, children }) => (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#F4F1E6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span>{icon}</span>}
          {label}
        </span>
        <span style={{ fontSize: '18px', fontWeight: '300', color: '#9EB7E5', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', lineHeight: 1 }}>+</span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: '12px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {children}
        </div>
      )}
    </div>
  )

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#0B1F3B', boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minWidth: 0 }}>

        {/* Logo */}
        <Link href={`/${locale}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src='/logo.png' alt='KnowFlags' style={{ height: '42px', width: 'auto', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>KnowFlags</span>
            <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '1.5px', color: '#FEB12F', lineHeight: 1, marginTop: '4px', display: 'block' }}>
              Learn. Play. Explore.
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center' }} className="desktop-nav">
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
                      <span style={{ fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
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

          <div ref={gamesRef} style={{ position: 'relative' }}>
            <button onClick={() => { setGamesOpen(o => !o); setFlagsOpen(false) }} style={dropdownBtnStyle(isActive(`/${locale}/games`))}>
              {t('Games', 'Jeux')}<Chevron open={gamesOpen} />
            </button>
            {gamesOpen && (
              <DropdownPanel width={280}>
                <div style={{ padding: '8px' }}>
                  {GAMES.map(game => (
                    <div key={game.key}
                      onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); setGamesOpen(false) } }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', cursor: game.soon ? 'default' : 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => { if (!game.soon) e.currentTarget.style.backgroundColor = '#f0f4ff' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                      <span style={{ fontSize: '22px', width: '32px', textAlign: 'center', flexShrink: 0 }}>{game.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: game.soon ? '#94a3b8' : '#0B1F3B' }}>{t(game.en, game.fr)}</span>
                          {game.soon && <span style={{ fontSize: '10px', fontWeight: '700', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px' }}>{t('Soon', 'Bientôt')}</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{t(game.descEn, game.descFr)}</p>
                      </div>
                    </div>
                  ))}
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
          <Link href={`/${locale}/submit`}
            style={{ fontSize: '13px', fontWeight: '700', color: '#FEB12F', background: 'rgba(254,177,47,0.12)', border: '1.5px solid rgba(254,177,47,0.35)', borderRadius: '8px', padding: '6px 13px', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
            className="submit-btn desktop-right"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(254,177,47,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(254,177,47,0.12)'}>
            {t('+ Submit', '+ Soumettre')}
          </Link>

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
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'white' }}
            className="burger-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {menuOpen
                ? <><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></>
                : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <>
          {/* Semi-transparent backdrop — click to close */}
          <div
            onClick={closeDrawer}
            style={{ position: 'fixed', inset: 0, top: '60px', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 998 }}
          />

          {/* Drawer panel — leaves ~15% gap on the left */}
          <div style={{
            position: 'fixed', top: '60px', right: 0, bottom: 0,
            width: '85vw', maxWidth: '360px',
            backgroundColor: '#0B1F3B',
            zIndex: 999,
            overflowY: 'auto',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '8px 20px 32px', flex: 1 }}>

              {/* Flags accordion */}
              <AccordionSection
                icon="🌍"
                label={t('Flags', 'Drapeaux')}
                isOpen={mFlagsOpen}
                onToggle={() => setMFlagsOpen(o => !o)}>
                {FLAGS_MENU.map(item => (
                  <Link key={item.href} href={`/${locale}/${item.href}`} onClick={closeDrawer}
                    style={{ fontSize: '15px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                    {t(item.en, item.fr)}
                  </Link>
                ))}
              </AccordionSection>

              {/* Games accordion */}
              <AccordionSection
                icon="🎮"
                label={t('Games', 'Jeux')}
                isOpen={mGamesOpen}
                onToggle={() => setMGamesOpen(o => !o)}>
                {GAMES.map(game => (
                  <div key={game.key}
                    onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); closeDrawer() } }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: game.soon ? 'default' : 'pointer' }}>
                    <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{game.icon}</span>
                    <span style={{ fontSize: '15px', color: game.soon ? '#475569' : '#9EB7E5', fontWeight: '600' }}>{t(game.en, game.fr)}</span>
                    {game.soon && <span style={{ fontSize: '10px', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px', fontWeight: '700' }}>{t('Soon', 'Bientôt')}</span>}
                  </div>
                ))}
                <Link href={`/${locale}/games`} onClick={closeDrawer}
                  style={{ fontSize: '13px', color: '#FEB12F', textDecoration: 'none', fontWeight: '600', marginTop: '4px' }}>
                  {t('All games →', 'Tous les jeux →')}
                </Link>
              </AccordionSection>

              {/* Simple links */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Link href={`/${locale}/blog`} onClick={closeDrawer}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500' }}>
                  📝 {t('Blog', 'Blog')}
                </Link>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Link href={`/${locale}/true-size`} onClick={closeDrawer}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500' }}>
                  🗺️ {t('True Size Map', 'Carte Taille Réelle')}
                </Link>
              </div>

              {/* Submit CTA */}
              <Link href={`/${locale}/submit`} onClick={closeDrawer}
                style={{ display: 'block', marginTop: '16px', padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#FEB12F', backgroundColor: 'rgba(254,177,47,0.12)', border: '1.5px solid rgba(254,177,47,0.35)', borderRadius: '10px', textDecoration: 'none' }}>
                {t('+ Submit a Flag', '+ Soumettre un drapeau')}
              </Link>

              {/* Auth */}
              <div style={{ marginTop: '12px' }}>
                {user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    <div style={{ padding: '12px 0', fontSize: '13px', color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{user.email}</div>
                    <Link href={`/${locale}/profile`} onClick={closeDrawer}
                      style={{ padding: '12px 0', fontSize: '16px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      👤 {t('My Profile', 'Mon Profil')}
                    </Link>
                    <button onClick={() => { switchLocale(); closeDrawer() }}
                      style={{ textAlign: 'left', padding: '12px 0', fontSize: '15px', color: '#F4F1E6', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {locale === 'en'
                        ? <><svg width="20" height="13" viewBox="0 0 3 2" style={{ borderRadius: '2px' }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg> Passer en français</>
                        : <><svg width="20" height="13" viewBox="0 0 60 40" style={{ borderRadius: '2px' }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg> Switch to English</>
                      }
                    </button>
                    <button onClick={() => { handleSignOut(); closeDrawer() }}
                      style={{ textAlign: 'left', padding: '12px 0', fontSize: '15px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      {t('Sign out', 'Déconnexion')}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => { switchLocale(); closeDrawer() }}
                      style={{ textAlign: 'left', padding: '12px 0', fontSize: '15px', color: '#F4F1E6', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {locale === 'en'
                        ? <><svg width="20" height="13" viewBox="0 0 3 2" style={{ borderRadius: '2px' }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg> Passer en français</>
                        : <><svg width="20" height="13" viewBox="0 0 60 40" style={{ borderRadius: '2px' }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg> Switch to English</>
                      }
                    </button>
                    <Link href={`/${locale}/auth/login`} onClick={closeDrawer}
                      style={{ display: 'block', padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#0B1F3B', backgroundColor: '#9EB7E5', borderRadius: '10px', textDecoration: 'none' }}>
                      {t('Sign in', 'Connexion')}
                    </Link>
                  </div>
                )}
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
  )
}
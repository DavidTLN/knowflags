'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

const GAMES = [
  {
    key: 'flag-reveal',
    icon: '🏳️',
    en: 'Flag Reveal',
    fr: 'Révèle le Drapeau',
    descEn: 'Uncover the flag tile by tile',
    descFr: 'Révèle le drapeau tuile par tuile',
  },
  {
    key: 'flag-quiz',
    icon: '❓',
    en: 'Flag Quiz',
    fr: 'Quiz Drapeaux',
    descEn: 'Multiple choice flag challenge',
    descFr: 'Quelle est ce drapeau ?',
  },
  {
    key: 'capital-city',
    icon: '🏙️',
    en: 'Capital City',
    fr: 'Capitale',
    descEn: 'Match the capital to its country',
    descFr: 'Trouve la capitale du pays',
  },
  {
    key: 'flag-drawing',
    icon: '✏️',
    en: 'Flag Drawing',
    fr: 'Dessin du Drapeau',
    descEn: 'Can you draw it from memory?',
    descFr: 'Sauras-tu le dessiner de mémoire ?',
  },
]

const FLAGS_MENU = [
  {
    href: 'countries',
    icon: '🌍',
    en: 'Country Flags',     fr: 'Drapeaux des Pays',
    descEn: 'All countries of the world',
    descFr: 'Tous les drapeaux du monde',
  },
  {
    href: 'flags/regions',
    icon: '🗺️',
    en: 'Regions & States',  fr: 'Régions & États',
    descEn: 'Provinces, cantons, Bundesländer…',
    descFr: 'Provinces, cantons, Bundesländer…',
  },
  {
    href: 'flags/cities',
    icon: '🏙️',
    en: 'City Flags',        fr: 'Drapeaux des Villes',
    descEn: 'Major cities around the world',
    descFr: 'Grandes villes du monde entier',
  },
  {
    href: 'organisations',
    icon: '🏛️',
    en: 'Organisations',     fr: 'Organisations',
    descEn: 'UN, EU, NATO, FIFA and more',
    descFr: 'ONU, UE, OTAN, FIFA et plus',
  },
]

// ── Moucheture d'hermine bretonne ─────────────────────────────────────────────
function ErmineMark({ size = 28, color = '#9EB7E5' }) {
  const s = size
  const w = s * 0.62
  const ox = (s - w) / 2
  const headHW  = w * 0.42
  const headTop = s * 0.01
  const barY    = s * 0.40
  const barH    = s * 0.07
  const barW    = w * 1.05
  const dropW   = w * 0.28
  const dropH   = s * 0.30
  const gapY    = barY + barH + s * 0.03
  const dxL     = ox + w * 0.12
  const dxC     = s / 2
  const dxR     = ox + w * 0.88
  const headBot = barY - s * 0.02

  const headPath = [
    `M ${dxC - headHW} ${headTop + headHW}`,
    `Q ${dxC - headHW} ${headTop} ${dxC} ${headTop}`,
    `Q ${dxC + headHW} ${headTop} ${dxC + headHW} ${headTop + headHW}`,
    `L ${dxC + headHW} ${headBot - headHW * 0.5}`,
    `Q ${dxC + headHW} ${headBot} ${dxC} ${headBot + s * 0.03}`,
    `Q ${dxC - headHW} ${headBot} ${dxC - headHW} ${headBot - headHW * 0.5}`,
    'Z'
  ].join(' ')

  function drop(cx, cy, dw, dh) {
    const hw = dw / 2
    const r  = hw
    return [
      `M ${cx - hw} ${cy}`,
      `L ${cx - hw} ${cy + dh - r}`,
      `Q ${cx - hw} ${cy + dh} ${cx} ${cy + dh}`,
      `Q ${cx + hw} ${cy + dh} ${cx + hw} ${cy + dh - r}`,
      `L ${cx + hw} ${cy}`,
      'Z'
    ].join(' ')
  }

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ flexShrink: 0 }}>
      <path d={headPath} fill={color}/>
      <rect x={s/2 - barW/2} y={barY} width={barW} height={barH} rx={barH/2} fill={color}/>
      <path d={drop(dxL, gapY,          dropW,        dropH)}        fill={color}/>
      <path d={drop(dxC, gapY + s*0.04, dropW * 0.95, dropH * 0.92)} fill={color}/>
      <path d={drop(dxR, gapY,          dropW,        dropH)}        fill={color}/>
    </svg>
  )
}

// ── Chevron icon ──────────────────────────────────────────────────────────────
function Chevron({ open }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#9EB7E5', flexShrink: 0 }}>
      <path d="M5.5 7.5L1 2.5h9l-4.5 5z"/>
    </svg>
  )
}

export default function Header() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const [menuOpen, setMenuOpen]   = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [flagsOpen, setFlagsOpen] = useState(false)
  const [user, setUser]           = useState(null)
  const [avatarOpen, setAvatarOpen] = useState(false)

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

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'

  function isActive(href) { return pathname.startsWith(href) }

  const navLinkStyle = (active) => ({
    fontSize: '15px',
    fontWeight: active ? '700' : '500',
    color: active ? '#9EB7E5' : '#F4F1E6',
    textDecoration: 'none',
    padding: '6px 2px',
    borderBottom: active ? '2px solid #9EB7E5' : '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  })

  const dropdownBtnStyle = (active) => ({
    fontSize: '15px',
    fontWeight: active ? '700' : '500',
    color: active ? '#9EB7E5' : '#F4F1E6',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #9EB7E5' : '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 2px',
    transition: 'color 0.15s',
    whiteSpace: 'nowrap',
  })

  // ── Dropdown panel shell ────────────────────────────────────────────────────
  const DropdownPanel = ({ children, width = 280 }) => (
    <div style={{ position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)', width: `${width}px`, backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 200 }}>
      <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', backgroundColor: 'white', boxShadow: '-2px -2px 4px rgba(0,0,0,0.06)', zIndex: -1 }} />
      {children}
    </div>
  )

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#0B1F3B', boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minWidth: 0 }}>

        {/* ── Logo ── */}
        <Link href={`/${locale}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src='/logo.png' alt='KnowFlags' style={{ height: '42px', width: 'auto', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>KnowFlags</span>
            <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '1.5px', color: '#FEB12F', lineHeight: 1, marginTop: '4px', display: 'block' }}>
              Learn. Play. Explore.
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center' }} className="desktop-nav">

          {/* Flags dropdown */}
          <div ref={flagsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setFlagsOpen(o => !o); setGamesOpen(false) }}
              style={dropdownBtnStyle(isActive(`/${locale}/countries`))}
            >
              {t('Flags', 'Drapeaux')}
              <Chevron open={flagsOpen} />
            </button>

            {flagsOpen && (
              <DropdownPanel width={300}>
                <div style={{ padding: '8px' }}>
                  {FLAGS_MENU.map(item => (
                    <div key={item.href}
                      onClick={() => { router.push(`/${locale}/${item.href}`); setFlagsOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
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

          {/* Games dropdown */}
          <div ref={gamesRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setGamesOpen(o => !o); setFlagsOpen(false) }}
              style={dropdownBtnStyle(isActive(`/${locale}/games`))}
            >
              {t('Games', 'Jeux')}
              <Chevron open={gamesOpen} />
            </button>

            {gamesOpen && (
              <DropdownPanel width={280}>
                <div style={{ padding: '8px' }}>
                  {GAMES.map(game => (
                    <div key={game.key}
                      onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); setGamesOpen(false) } }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', cursor: game.soon ? 'default' : 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => { if (!game.soon) e.currentTarget.style.backgroundColor = '#f0f4ff' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span style={{ fontSize: '22px', width: '32px', textAlign: 'center', flexShrink: 0 }}>{game.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: game.soon ? '#94a3b8' : '#0B1F3B' }}>{t(game.en, game.fr)}</span>
                          {game.soon && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px' }}>
                              {t('Soon', 'Bientôt')}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{t(game.descEn, game.descFr)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 16px' }}>
                  <Link href={`/${locale}/games`} onClick={() => setGamesOpen(false)}
                    style={{ fontSize: '13px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
                    {t('View all games →', 'Voir tous les jeux →')}
                  </Link>
                </div>
              </DropdownPanel>
            )}
          </div>

          {/* Community */}
          <a href='https://knowflags.discourse.group/' target='_blank' rel='noopener noreferrer' style={navLinkStyle(false)}>
            {t('Community', 'Communauté')}
          </a>

          {/* Blog */}
          <Link href={`/${locale}/blog`} style={navLinkStyle(isActive(`/${locale}/blog`))}>
            {t('Blog', 'Blog')}
          </Link>

          {/* True Size Map */}
          <Link href={`/${locale}/true-size`} style={navLinkStyle(isActive(`/${locale}/true-size`))}>
            {t('True Size Map', 'Carte Taille Réelle')}
          </Link>
        </nav>

        {/* ── Right side ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          {/* Submit — CTA button */}
          <Link href={`/${locale}/submit`}
            style={{
              fontSize: '13px', fontWeight: '700',
              color: '#FEB12F',
              background: 'rgba(254,177,47,0.12)',
              border: '1.5px solid rgba(254,177,47,0.35)',
              borderRadius: '8px',
              padding: '6px 13px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            className="submit-btn desktop-right"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(254,177,47,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(254,177,47,0.12)'}
          >
            {t('+ Submit', '+ Soumettre')}
          </Link>

          {/* Locale switcher — shows target language flag only */}
          <button onClick={switchLocale}
            title={locale === 'en' ? 'Passer en français' : 'Switch to English'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '7px',
              padding: '0',
              cursor: 'pointer',
              transition: 'background 0.15s',
              flexShrink: 0,
              overflow: 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            {locale === 'en'
              ? /* Target = FR — French flag */
                <svg width="24" height="16" viewBox="0 0 3 2" style={{ display: 'block' }}>
                    <rect width="1" height="2" fill="#002395"/>
                    <rect x="1" width="1" height="2" fill="#fff"/>
                    <rect x="2" width="1" height="2" fill="#ED2939"/>
                  </svg>
              : /* Target = EN — UK/US hybrid: UK cross + US stars quadrant */
                <svg width="24" height="16" viewBox="0 0 60 40" style={{ display: 'block' }}>
                    {/* Base blue */}
                    <rect width="60" height="40" fill="#012169"/>
                    {/* UK diagonal crosses */}
                    <line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/>
                    <line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/>
                    <line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/>
                    <line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/>
                    {/* UK horizontal/vertical cross */}
                    <rect x="0" y="15" width="60" height="10" fill="#fff"/>
                    <rect x="25" y="0" width="10" height="40" fill="#fff"/>
                    <rect x="0" y="17" width="60" height="6" fill="#C8102E"/>
                    <rect x="27" y="0" width="6" height="40" fill="#C8102E"/>
                    {/* US stars quadrant top-left */}
                    <rect width="30" height="20" fill="#012169"/>
                    {[3,9,15,21,27].map((x,i) => [6,14].map((y,j) => (
                      <circle key={`${i}-${j}`} cx={x} cy={y} r="1.8" fill="white"/>
                    )))}
                    {[6,12,18,24].map((x,i) => [10].map((y,j) => (
                      <circle key={`s-${i}`} cx={x} cy={y} r="1.8" fill="white"/>
                    )))}
                  </svg>
            }
          </button>

          {/* Shop — cart icon, left of profile */}
          <Link href={`/${locale}/shop`}
            title={t('Shop', 'Boutique')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              color: isActive(`/${locale}/shop`) ? '#9EB7E5' : 'rgba(244,241,230,0.75)',
              textDecoration: 'none',
              transition: 'color 0.15s',
              flexShrink: 0,
            }}
            className="desktop-right"
            onMouseEnter={e => e.currentTarget.style.color = '#9EB7E5'}
            onMouseLeave={e => e.currentTarget.style.color = isActive(`/${locale}/shop`) ? '#9EB7E5' : 'rgba(244,241,230,0.75)'}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </Link>

          {/* Avatar / Sign-in */}
          <div className="desktop-right">
            {user ? (
              <div ref={avatarRef} style={{ position: 'relative' }}>
                <button onClick={() => setAvatarOpen(o => !o)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#426A5A', border: 'none', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {initials}
                </button>
                {avatarOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', overflow: 'hidden', minWidth: '180px', zIndex: 200 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{user.email}</p>
                    </div>
                    <Link href={`/${locale}/profile`} onClick={() => setAvatarOpen(false)}
                      style={{ display: 'block', padding: '11px 16px', fontSize: '14px', color: '#0B1F3B', textDecoration: 'none', fontWeight: '500' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {t('My Profile', 'Mon Profil')}
                    </Link>
                    <button onClick={handleSignOut}
                      style={{ width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      {t('Sign out', 'Déconnexion')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={`/${locale}/auth/login`}
                style={{ fontSize: '14px', fontWeight: '600', color: '#0B1F3B', backgroundColor: '#9EB7E5', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                {t('Sign in', 'Connexion')}
              </Link>
            )}
          </div>

          {/* Burger — mobile only */}
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
        <div style={{ backgroundColor: '#0B1F3B', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            {/* Flags section */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <div style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', fontWeight: '600' }}>{t('Flags', 'Drapeaux')}</div>
              <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FLAGS_MENU.map(item => (
                  <Link key={item.href} href={`/${locale}/${item.href}`} onClick={() => setMenuOpen(false)}
                    style={{ fontSize: '15px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{item.icon}</span>
                    {t(item.en, item.fr)}
                  </Link>
                ))}
              </div>
            </div>

            {/* Games section */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <div style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', fontWeight: '600' }}>{t('Games', 'Jeux')}</div>
              <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {GAMES.map(game => (
                  <div key={game.key}
                    onClick={() => { if (!game.soon) { router.push(`/${locale}/games/${game.key}`); setMenuOpen(false) } }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: game.soon ? 'default' : 'pointer' }}>
                    <span>{game.icon}</span>
                    <span style={{ fontSize: '15px', color: game.soon ? '#475569' : '#9EB7E5', fontWeight: '600' }}>{t(game.en, game.fr)}</span>
                    {game.soon && <span style={{ fontSize: '10px', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px', fontWeight: '700' }}>{t('Soon', 'Bientôt')}</span>}
                  </div>
                ))}
              </div>
            </div>

            <a href='https://knowflags.discourse.group/' target='_blank' rel='noopener noreferrer' onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {t('Community', 'Communauté')}
            </a>
            <Link href={`/${locale}/blog`} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {t('Blog', 'Blog')}
            </Link>
            <Link href={`/${locale}/true-size`} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {t('True Size Map', 'Carte Taille Réelle')}
            </Link>
            <Link href={`/${locale}/shop`} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              🛍️ {t('Shop', 'Boutique')}
            </Link>

            {/* Submit CTA in drawer */}
            <Link href={`/${locale}/submit`} onClick={() => setMenuOpen(false)}
              style={{ display: 'block', marginTop: '12px', padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#FEB12F', backgroundColor: 'rgba(254,177,47,0.12)', border: '1.5px solid rgba(254,177,47,0.35)', borderRadius: '10px', textDecoration: 'none' }}>
              {t('+ Submit a Flag', '+ Soumettre un drapeau')}
            </Link>

            {/* Auth in drawer */}
            {user ? (
              <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Link href={`/${locale}/profile`} onClick={() => setMenuOpen(false)}
                  style={{ padding: '12px 0', fontSize: '16px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
                  👤 {t('My Profile', 'Mon Profil')}
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  style={{ textAlign: 'left', padding: '10px 0', fontSize: '15px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                  {t('Sign out', 'Déconnexion')}
                </button>
              </div>
            ) : (
              <Link href={`/${locale}/auth/login`} onClick={() => setMenuOpen(false)}
                style={{ display: 'block', marginTop: '8px', padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#0B1F3B', backgroundColor: '#9EB7E5', borderRadius: '10px', textDecoration: 'none' }}>
                {t('Sign in', 'Connexion')}
              </Link>
            )}
          </div>
        </div>
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
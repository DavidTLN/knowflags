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
    soon: true,
  },
  {
    key: 'capital-city',
    icon: '🏙️',
    en: 'Capital City',
    fr: 'Capitale',
    descEn: 'Match the capital to its country',
    descFr: 'Trouve la capitale du pays',
    soon: true,
  },
  {
    key: 'flag-drawing',
    icon: '✏️',
    en: 'Flag Drawing',
    fr: 'Dessin du Drapeau',
    descEn: 'Draw the flag from memory',
    descFr: 'Dessine le drapeau de mémoire',
    soon: true,
  },
]

export default function Header() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const [menuOpen, setMenuOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const gamesRef = useRef(null)
  const avatarRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (gamesRef.current && !gamesRef.current.contains(e.target)) setGamesOpen(false)
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

  function isActive(href) {
    return pathname.startsWith(href)
  }

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

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#0B1F3B', boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>

        {/* Logo */}
        <Link href={`/${locale}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
            know<span style={{ color: '#9EB7E5' }}>flags</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center' }} className="desktop-nav">

          {/* Country Flags */}
          <Link href={`/${locale}/countries`} style={navLinkStyle(isActive(`/${locale}/countries`))}>
            {t('Country Flags', 'Drapeaux · Pays')}
          </Link>

          {/* Games dropdown */}
          <div ref={gamesRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setGamesOpen(o => !o)}
              style={{
                fontSize: '15px',
                fontWeight: isActive(`/${locale}/games`) ? '700' : '500',
                color: isActive(`/${locale}/games`) ? '#9EB7E5' : '#F4F1E6',
                background: 'none',
                border: 'none',
                borderBottom: isActive(`/${locale}/games`) ? '2px solid #9EB7E5' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 2px',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t('Games', 'Jeux')}
              <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"
                style={{ transform: gamesOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#9EB7E5', flexShrink: 0 }}>
                <path d="M5.5 7.5L1 2.5h9l-4.5 5z"/>
              </svg>
            </button>

            {gamesOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)', width: '280px', backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 200 }}>
                {/* Caret */}
                <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', backgroundColor: 'white', boxShadow: '-2px -2px 4px rgba(0,0,0,0.06)', zIndex: -1 }} />

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
                          <span style={{ fontSize: '14px', fontWeight: '700', color: game.soon ? '#94a3b8' : '#0B1F3B' }}>
                            {t(game.en, game.fr)}
                          </span>
                          {game.soon && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#806D40', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px' }}>
                              {t('Soon', 'Bientôt')}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>
                          {t(game.descEn, game.descFr)}
                        </p>
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
              </div>
            )}
          </div>

          {/* Submit */}
          <Link href={`/${locale}/submit`} style={navLinkStyle(isActive(`/${locale}/submit`))}>
            {t('Submit', 'Soumettre')}
          </Link>
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          <button onClick={switchLocale}
            style={{ fontSize: '13px', fontWeight: '700', color: '#F4F1E6', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.5px' }}>
            {locale === 'en' ? 'FR' : 'EN'}
          </button>

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

          {/* Mobile burger */}
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'white' }}
            className="burger-btn">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="3" y1="3" x2="19" y2="19"/><line x1="19" y1="3" x2="3" y2="19"/></>
                : <><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{ backgroundColor: '#0B1F3B', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Link href={`/${locale}/countries`} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {t('Country Flags', 'Drapeaux · Pays')}
            </Link>
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
            <Link href={`/${locale}/submit`} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: '16px', color: '#F4F1E6', textDecoration: 'none', fontWeight: '500' }}>
              {t('Submit', 'Soumettre')}
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .burger-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
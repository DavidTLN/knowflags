'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function Navbar() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')

  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  function switchLanguage() {
    const newLocale = locale === 'en' ? 'fr' : 'en'
    const newPath = pathname.replace('/' + locale, '/' + newLocale)
    router.push(newPath)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push('/' + locale)
    router.refresh()
  }

  const navLinks = [
    { label: t('gallery'), href: '#' },
    { label: t('games'), href: '#' },
    { label: t('history'), href: '#' },
    { label: t('submit'), href: '#' },
  ]

  const BurgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4F1E6" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )

  const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4F1E6" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  const userInitial = user?.email?.charAt(0).toUpperCase() || '?'

  return (
    <>
      <header style={{backgroundColor: '#0B1F3B', color: '#F4F1E6', position: 'sticky', top: 0, zIndex: 50}}>
        <div style={{padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>

          <span style={{fontSize: '20px', fontWeight: '900', cursor: 'pointer'}} onClick={() => router.push('/' + locale)}>
            knowflags
          </span>

          {!isMobile && (
            <nav style={{display: 'flex', alignItems: 'center', gap: '32px'}}>
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} style={{color: '#F4F1E6', textDecoration: 'none', fontSize: '14px', fontWeight: '600'}}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>

            <button onClick={switchLanguage} style={{backgroundColor: 'transparent', color: '#F4F1E6', padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '1px solid rgba(244,241,230,0.3)', cursor: 'pointer'}}>
              {locale === 'en' ? 'EN' : 'FR'}
            </button>

            {user ? (
              <div style={{position: 'relative'}}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#426A5A', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                >
                  {userInitial}
                </button>

                {userMenuOpen && (
                  <div style={{position: 'absolute', right: 0, top: '44px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '180px', overflow: 'hidden', zIndex: 100}}>
                    <div style={{padding: '12px 16px', borderBottom: '1px solid #e2e8f0'}}>
                      <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>Signed in as</p>
                      <p style={{fontSize: '14px', fontWeight: '600', color: '#0B1F3B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis'}}>{user.email}</p>
                    </div>
                    <button onClick={() => { setUserMenuOpen(false); router.push('/' + locale + '/profile'); }} style={{width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#0B1F3B', fontWeight: '500'}}>
                      My Profile
                    </button>
                    <button onClick={signOut} style={{width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#dc2626', fontWeight: '500'}}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => router.push('/' + locale + '/auth/login')} style={{backgroundColor: '#F4F1E6', color: '#0B1F3B', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>
                Sign In
              </button>
            )}

            {isMobile && (
              <button onClick={() => setMenuOpen(!menuOpen)} style={{backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'}}>
                <BurgerIcon />
              </button>
            )}
          </div>
        </div>
      </header>

      {isMobile && (
        <div onClick={() => setMenuOpen(false)} style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 98, opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none', transition: 'opacity 0.3s ease'}} />
      )}

      {isMobile && (
        <div style={{position: 'fixed', top: 0, right: 0, height: '100vh', width: '75%', maxWidth: '320px', backgroundColor: '#0B1F3B', zIndex: 99, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease', display: 'flex', flexDirection: 'column', padding: '24px'}}>

          <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '40px'}}>
            <button onClick={() => setMenuOpen(false)} style={{backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
              <CloseIcon />
            </button>
          </div>

          <nav style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} style={{color: '#F4F1E6', textDecoration: 'none', fontSize: '20px', fontWeight: '700', padding: '16px 0', borderBottom: '1px solid rgba(244,241,230,0.1)', display: 'block'}}>
                {link.label}
              </a>
            ))}
          </nav>

          <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {user ? (
              <button onClick={signOut} style={{backgroundColor: '#dc2626', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', width: '100%'}}>
                Sign Out
              </button>
            ) : (
              <button onClick={() => { setMenuOpen(false); router.push('/' + locale + '/auth/login'); }} style={{backgroundColor: '#F4F1E6', color: '#0B1F3B', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', width: '100%'}}>
                Sign In
              </button>
            )}
            <button onClick={switchLanguage} style={{backgroundColor: 'transparent', color: '#F4F1E6', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '1px solid rgba(244,241,230,0.3)', cursor: 'pointer', width: '100%'}}>
              {locale === 'en' ? 'EN / FR' : 'FR / EN'}
            </button>
          </div>

        </div>
      )}
    </>
  )
}
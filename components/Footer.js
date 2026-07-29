'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

// Drapeaux SVG (repris du header pour un style identique).
function FlagFR() { return (<svg width="18" height="12" viewBox="0 0 3 2" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>) }
function FlagGB() { return (<svg width="18" height="12" viewBox="0 0 60 40" style={{ borderRadius: '2px', flexShrink: 0 }}><rect width="60" height="40" fill="#012169"/><line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8"/><line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8"/><line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4"/><line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4"/><rect x="0" y="15" width="60" height="10" fill="#fff"/><rect x="25" y="0" width="10" height="40" fill="#fff"/><rect x="0" y="17" width="60" height="6" fill="#C8102E"/><rect x="27" y="0" width="6" height="40" fill="#C8102E"/></svg>) }

// Sélecteur de langue du footer : même style que le header (drapeau + fond
// translucide + chevron), mais avec le nom complet de la langue.
// La dropdown s'ouvre vers le haut puisqu'on est en bas de page.
function FooterLang({ locale, pathname, router, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const LANGS = [{ code: 'fr', label: 'Français' }, { code: 'en', label: 'English' }]
  const current = LANGS.find(l => l.code === locale) || LANGS[1]
  function choose(code) { setOpen(false); if (code !== locale) router.push(pathname.replace(`/${locale}`, `/${code}`)) }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t('Language:', 'Langue :')}</span>
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', background: open ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', transition: 'background 0.15s' }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.20)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}>
          {locale === 'fr' ? <FlagFR /> : <FlagGB />}
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF' }}>{current.label}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.85 }}><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {open && (
          <div role="listbox" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, backgroundColor: '#FFFFFF', borderRadius: '10px', boxShadow: '0 12px 36px rgba(0,0,0,0.25)', overflow: 'hidden', width: '168px', zIndex: 200, border: '1px solid #E2DDD5' }}>
            {LANGS.map(l => {
              const isCur = l.code === locale
              return (
                <button key={l.code} role="option" aria-selected={isCur} onClick={() => choose(l.code)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: isCur ? '#F4F1E6' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = '#F6F6F4' }}
                  onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = 'transparent' }}>
                  {l.code === 'fr' ? <FlagFR /> : <FlagGB />}
                  <span style={{ fontSize: '13px', fontWeight: isCur ? '700' : '600', color: '#16324F' }}>{l.label}</span>
                  {isCur && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><path d="M20 6L9 17l-5-5"/></svg>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Footer() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <footer style={{
      backgroundColor: '#16324F',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      color: '#FFFFFF',
      fontFamily: 'var(--font-body)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '16px var(--page-padding-x)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '400' }}>
          © {new Date().getFullYear()} KnowFlags. {t('All rights reserved.', 'Tous droits réservés.')}
        </p>

        {/* Right group — Ko-fi + social icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>

          {/* Sélecteur de langue */}
          <FooterLang locale={locale} pathname={pathname} router={router} t={t} />

          {/* Ko-fi — DS gold button */}
          <a
            href="https://ko-fi.com/E6A523D18R"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ko-fi"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '7px 14px', borderRadius: '9999px',
              backgroundColor: '#F4B400', color: '#0F1923',
              fontSize: '13px', fontWeight: '700', textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,50,79,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            {t('Pay me a coffee', 'Offrez-moi un café')}
          </a>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              {
                href: 'https://instagram.com/knowflags',
                label: 'Instagram',
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
              },
              {
                href: 'https://twitter.com/knowflags',
                label: 'X / Twitter',
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              },
            ].map(social => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E4976'; e.currentTarget.style.color = '#FFFFFF' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
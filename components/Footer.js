'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function Footer() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <footer style={{
      backgroundColor: '#0B1F3B',
      color: '#F4F1E6',
      fontFamily: 'var(--font-body)',
      marginTop: 'auto',
    }}>
      {/* Main footer content */}
      <div style={{
        maxWidth: '1152px',
        margin: '0 auto',
        padding: '48px 24px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
      }}>

        {/* About us */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9EB7E5', margin: '0 0 16px' }}>
            {t('About', 'À propos')}
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link href={`/${locale}/about`} style={{ color: 'rgba(244,241,230,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#F4F1E6'}
                onMouseLeave={e => e.target.style.color = 'rgba(244,241,230,0.7)'}>
                {t('Our team & mission', 'Notre équipe & mission')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about#contribute`} style={{ color: 'rgba(244,241,230,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#F4F1E6'}
                onMouseLeave={e => e.target.style.color = 'rgba(244,241,230,0.7)'}>
                {t('I want to help', 'Je veux aider')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9EB7E5', margin: '0 0 16px' }}>
            {t('Legal', 'Mentions légales')}
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { href: `/${locale}/legal/help`, en: 'Help & Contact', fr: 'Aide & Contact' },
              { href: `/${locale}/legal/privacy`, en: 'Privacy Policy', fr: 'Politique de confidentialité' },
              { href: `/${locale}/legal/terms`, en: 'Terms of Use', fr: "Conditions générales d'utilisation" },
              { href: `/${locale}/legal/accessibility`, en: 'Accessibility', fr: "Déclaration d'accessibilité" },
              { href: `/${locale}/legal/data`, en: 'Personal Data', fr: 'Données personnelles' },
            ].map(({ href, en, fr }) => (
              <li key={href}>
                <Link href={href} style={{ color: 'rgba(244,241,230,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#F4F1E6'}
                  onMouseLeave={e => e.target.style.color = 'rgba(244,241,230,0.7)'}>
                  {t(en, fr)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social media */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9EB7E5', margin: '0 0 16px' }}>
            {t('Follow us', 'Suivez-nous')}
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Facebook */}
            <a href="https://facebook.com/knowflags" target="_blank" rel="noopener noreferrer"
              style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1877F2'; e.currentTarget.style.borderColor = '#1877F2' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="https://youtube.com/@knowflags" target="_blank" rel="noopener noreferrer"
              style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FF0000'; e.currentTarget.style.borderColor = '#FF0000' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com/knowflags" target="_blank" rel="noopener noreferrer"
              style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E1306C'; e.currentTarget.style.borderColor = '#E1306C' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Logo */}
          <Link href={`/${locale}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/favicon.ico" alt="KnowFlags" width="28" height="28" style={{ borderRadius: '6px' }} />
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#F4F1E6', letterSpacing: '-0.3px' }}>KnowFlags</span>
          </Link>
          {/* Copyright */}
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(244,241,230,0.4)', textAlign: 'center' }}>
            © 2026 KnowFlags. {t('All rights reserved.', 'Tous droits réservés.')}
          </p>
        </div>
      </div>
    </footer>
  )
}
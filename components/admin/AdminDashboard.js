// DESTINATION: components/admin/AdminDashboard.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

const C = {
  navy: '#16324F', navyLight: '#1E4976', navyDark: '#0F1923',
  gold: '#F4B400', green: '#16A34A', red: '#D62828', redLight: '#FEE2E2',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

const INPUT = {
  width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '10px',
  border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface,
  fontSize: '14px', color: C.text, outline: 'none', fontFamily: 'inherit',
}
const LABEL = { display: 'block', fontSize: '13px', fontWeight: 600, color: C.navy, marginBottom: '6px' }

function Shell({ children }) {
  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}

export default function AdminDashboard({ locale, authed, isAdmin, email, pendingReports, pendingSubs }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const router = useRouter()

  const [em, setEm] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    if (!em || !pw) { setError(t('Enter your email and password.', 'Saisissez votre email et mot de passe.')); return }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: e } = await supabase.auth.signInWithPassword({ email: em, password: pw })
      if (e) { setError(t('Invalid email or password.', 'Email ou mot de passe invalide.')); setLoading(false); return }
      router.refresh()
    } catch {
      setError(t('Something went wrong. Please try again.', 'Une erreur est survenue. Réessayez.'))
      setLoading(false)
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  // ── Not signed in → login area ──────────────────────────────────────────────
  if (!authed) {
    return (
      <Shell>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(22,50,79,0.12)', padding: '28px 24px' }}>
            <span style={{ display: 'inline-flex', width: '46px', height: '46px', borderRadius: '12px', backgroundColor: C.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: C.navy, letterSpacing: '-0.01em' }}>
              {t('Admin access', 'Accès admin')}
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.muted, lineHeight: 1.5 }}>
              {t('Sign in to manage KnowFlags.', 'Connectez-vous pour gérer KnowFlags.')}
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={LABEL}>{t('Email', 'Email')}</label>
              <input type="email" value={em} onChange={e => { setEm(e.target.value); if (error) setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') signIn() }}
                placeholder="you@email.com" style={INPUT} autoComplete="email" />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={LABEL}>{t('Password', 'Mot de passe')}</label>
              <input type="password" value={pw} onChange={e => { setPw(e.target.value); if (error) setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') signIn() }}
                placeholder="••••••••" style={INPUT} autoComplete="current-password" />
            </div>

            {error && (
              <div style={{ backgroundColor: C.redLight, color: C.red, padding: '10px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>{error}</div>
            )}

            <button onClick={signIn} disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: loading ? C.secondary : C.navy, color: loading ? C.light : 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 8px rgba(22,50,79,0.08)', transition: 'background-color 0.12s ease' }}>
              {loading ? t('Signing in…', 'Connexion…') : t('Sign in', 'Se connecter')}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link href={`/${locale}`} style={{ fontSize: '13px', color: C.muted, textDecoration: 'none' }}>← {t('Back to site', 'Retour au site')}</Link>
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Header (signed in) ──────────────────────────────────────────────────────
  const header = (
    <div style={{ backgroundColor: C.navy, padding: '20px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>KnowFlags</div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>{t('Admin', 'Admin')}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {email && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{email}</span>}
          <button onClick={signOut} style={{ padding: '7px 14px', borderRadius: '9px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {t('Sign out', 'Déconnexion')}
          </button>
          <Link href={`/${locale}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>← {t('Site', 'Site')}</Link>
        </div>
      </div>
    </div>
  )

  // ── Signed in but not admin ─────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <Shell>
        {header}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center', backgroundColor: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)', padding: '32px 24px' }}>
            <span style={{ display: 'inline-flex', width: '46px', height: '46px', borderRadius: '9999px', backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </span>
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: C.navy }}>{t('No admin access', 'Accès admin refusé')}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: C.muted, lineHeight: 1.5 }}>
              {t('This account is not authorised to manage KnowFlags.', 'Ce compte n\u2019est pas autorisé à gérer KnowFlags.')}
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Admin hub → menu ────────────────────────────────────────────────────────
  const MENU = [
    {
      href: `/${locale}/admin/reports`,
      title: t('Reports', 'Signalements'),
      desc: t('User-reported issues on flags and pages.', 'Problèmes signalés par les utilisateurs sur les drapeaux et les pages.'),
      count: pendingReports,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/submissions`,
      title: t('Submissions', 'Soumissions'),
      desc: t('Flag submissions and corrections from users.', 'Drapeaux et corrections proposés par les utilisateurs.'),
      count: pendingSubs,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ),
    },
  ]

  return (
    <Shell>
      {header}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', width: '100%', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.green, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: C.green, borderRadius: '2px' }} />
          {t('Manage', 'Gérer')}
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', margin: '0 0 22px' }}>
          {t('What do you want to review?', 'Que voulez-vous traiter ?')}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {MENU.map(m => (
            <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
              <div
                style={{ backgroundColor: C.surface, borderRadius: '14px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(22,50,79,0.08)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '150px', transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,50,79,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,50,79,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: '44px', height: '44px', borderRadius: '11px', backgroundColor: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</span>
                  {m.count > 0 && (
                    <span style={{ padding: '4px 11px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      {m.count} {t('pending', 'en attente')}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: C.navy }}>{m.title}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>{m.desc}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: C.navy }}>
                  {t('Open', 'Ouvrir')}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}
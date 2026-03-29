'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const T = {
  title:      { en: 'Welcome back',           fr: 'Bon retour' },
  subtitle:   { en: 'Sign in to KnowFlags',   fr: 'Connectez-vous à KnowFlags' },
  google:     { en: 'Continue with Google',   fr: 'Continuer avec Google' },
  or:         { en: 'or',                     fr: 'ou' },
  email:      { en: 'Email',                  fr: 'Adresse e-mail' },
  password:   { en: 'Password',               fr: 'Mot de passe' },
  signin:     { en: 'Sign in',                fr: 'Se connecter' },
  signup:     { en: 'Sign up',                fr: "S'inscrire" },
  noAccount:  { en: "Don't have an account?", fr: 'Pas encore de compte ?' },
  hasAccount: { en: 'Already have an account?', fr: 'Déjà un compte ?' },
  forgot:     { en: 'Forgot password?',       fr: 'Mot de passe oublié ?' },
  sending:    { en: 'Loading…',               fr: 'Chargement…' },
  resetSent:  { en: 'Reset link sent — check your inbox.', fr: 'Lien envoyé — vérifiez votre boîte mail.' },
  errInvalid: { en: 'Invalid email or password.', fr: 'Email ou mot de passe incorrect.' },
  errGeneric: { en: 'Something went wrong. Try again.', fr: 'Une erreur est survenue. Réessayez.' },
}
const tr = (key, locale) => T[key]?.[locale] ?? T[key]?.en ?? key

export default function LoginPage() {
  const locale  = useLocale()
  const router  = useRouter()

  const [mode, setMode]         = useState('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')

  const supabase = createClient()

  async function handleGoogle() {
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/${locale}/auth/callback` },
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/${locale}/reset-password`,
        })
        if (err) throw err
        setInfo(tr('resetSent', locale))
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${location.origin}/${locale}` },
        })
        if (err) throw err
        setInfo(locale === 'fr'
          ? 'Compte créé ! Vérifiez votre e-mail pour confirmer.'
          : 'Account created! Check your email to confirm.')
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
          setError(err.message?.toLowerCase().includes('invalid')
            ? tr('errInvalid', locale)
            : tr('errGeneric', locale))
        } else {
          router.push(`/${locale}`)
        }
      }
    } catch (err) {
      setError(err.message || tr('errGeneric', locale))
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) { setMode(next); setError(''); setInfo('') }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '15px', color: '#0B1F3B',
    backgroundColor: 'white', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: '#475569', marginBottom: '6px',
  }

  return (
    <div style={{
      backgroundColor: '#F4F1E6', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        padding: '40px 36px', width: '100%', maxWidth: '420px',
        boxShadow: '0 4px 32px rgba(11,31,59,0.10)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            backgroundColor: '#0B1F3B', marginBottom: '14px',
          }}>
            <span style={{ fontSize: '26px' }}>🏴</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0B1F3B', margin: '0 0 4px' }}>
            {mode === 'forgot'
              ? (locale === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset your password')
              : tr(mode === 'signup' ? 'signup' : 'title', locale)}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {mode === 'forgot'
              ? (locale === 'fr' ? 'Entrez votre e-mail pour recevoir un lien.' : 'Enter your email to receive a reset link.')
              : tr('subtitle', locale)}
          </p>
        </div>

        {/* Google OAuth */}
        {mode !== 'forgot' && (
          <>
            <button
              onClick={handleGoogle}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px', padding: '11px 16px',
                borderRadius: '10px', border: '1.5px solid #e2e8f0',
                backgroundColor: 'white', color: '#0B1F3B',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              <GoogleIcon />
              {tr('google', locale)}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>{tr('or', locale)}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>
          </>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={labelStyle}>{tr('email', locale)}</label>
            <input
              type="email" value={email} required autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#9EB7E5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>{tr('password', locale)}</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => switchMode('forgot')}
                    style={{ fontSize: '12px', color: '#9EB7E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {tr('forgot', locale)}
                  </button>
                )}
              </div>
              <input
                type="password" value={password} required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#9EB7E5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px' }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '13px' }}>
              {info}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
              backgroundColor: loading ? '#94a3b8' : '#0B1F3B',
              color: 'white', fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'default' : 'pointer', marginTop: '2px',
            }}
          >
            {loading
              ? tr('sending', locale)
              : mode === 'forgot'
                ? (locale === 'fr' ? 'Envoyer le lien' : 'Send reset link')
                : tr(mode, locale)}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
          {mode === 'forgot' ? (
            <button onClick={() => switchMode('signin')}
              style={{ color: '#0B1F3B', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← {locale === 'fr' ? 'Retour à la connexion' : 'Back to sign in'}
            </button>
          ) : mode === 'signin' ? (
            <>{tr('noAccount', locale)}{' '}
              <button onClick={() => switchMode('signup')}
                style={{ color: '#0B1F3B', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>
                {tr('signup', locale)}
              </button>
            </>
          ) : (
            <>{tr('hasAccount', locale)}{' '}
              <button onClick={() => switchMode('signin')}
                style={{ color: '#0B1F3B', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>
                {tr('signin', locale)}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
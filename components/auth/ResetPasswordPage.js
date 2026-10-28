'use client'

// Page de choix du nouveau mot de passe.
// L'utilisateur arrive ici depuis le lien de l'e-mail, en passant par
// /{locale}/auth/callback qui a deja echange le code contre une session.
// Il ne reste donc qu'a appeler updateUser({ password }).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import PageLoader from '@/components/PageLoader'

const MIN_LENGTH = 8

const C = {
  navy: '#16324F', navyLight: '#1E4976', bg: '#F4F1E6', surface: '#FFFFFF',
  borderSolid: '#E2DDD5', text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
  red: '#D62828', redLight: '#FEE2E2', green: '#16A34A', greenLight: '#DCFCE7',
}

export default function ResetPasswordPage() {
  const locale = useLocale()
  const router = useRouter()
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const supabase = createClient()

  const [status, setStatus]     = useState('checking') // checking | ready | invalid | done
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Sans session, le lien est expire ou deja utilise.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data?.user ? 'ready' : 'invalid')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < MIN_LENGTH) {
      setError(t(`Use at least ${MIN_LENGTH} characters.`, `Utilisez au moins ${MIN_LENGTH} caractères.`))
      return
    }
    if (password !== confirm) {
      setError(t('The two passwords do not match.', 'Les deux mots de passe ne correspondent pas.'))
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('different')) {
        setError(t('Choose a password different from the old one.', "Choisissez un mot de passe différent de l'ancien."))
      } else if (msg.includes('weak') || msg.includes('characters')) {
        setError(t('This password is too weak.', 'Ce mot de passe est trop faible.'))
      } else {
        setError(t('Something went wrong. Try again.', 'Une erreur est survenue. Réessayez.'))
      }
      return
    }
    setStatus('done')
    setTimeout(() => router.push(`/${locale}`), 2000)
  }

  if (status === 'checking') return <PageLoader label={t('Loading...', 'Chargement...')} />

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface,
    fontSize: '15px', color: C.text, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
  }
  const focus = e => { e.target.style.borderColor = C.navy; e.target.style.boxShadow = '0 0 0 3px rgba(22,50,79,0.12)' }
  const blur  = e => { e.target.style.borderColor = C.borderSolid; e.target.style.boxShadow = 'none' }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: C.muted, marginBottom: '6px' }
  const primaryBtn = {
    width: '100%', minHeight: '44px', padding: '12px', borderRadius: '10px', border: 'none',
    backgroundColor: loading ? C.light : C.navy, color: 'white', fontSize: '15px', fontWeight: 700,
    cursor: loading ? 'default' : 'pointer', transition: 'background-color 0.12s ease',
    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      backgroundColor: C.bg, minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    }}>
      <div style={{
        backgroundColor: C.surface, borderRadius: '20px', padding: '32px 30px',
        width: '100%', maxWidth: '380px', boxShadow: '0 8px 32px rgba(22,50,79,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.navy, margin: 0, letterSpacing: '-0.02em' }}>
            {status === 'invalid'
              ? t('Link expired', 'Lien expiré')
              : t('Choose a new password', 'Choisissez un nouveau mot de passe')}
          </h1>
          <p style={{ fontSize: '14px', color: C.muted, margin: '8px 0 0', lineHeight: 1.5 }}>
            {status === 'invalid'
              ? t('This reset link is no longer valid. Request a new one from the sign in page.',
                  'Ce lien de réinitialisation n’est plus valide. Demandez-en un nouveau depuis la page de connexion.')
              : status === 'done'
                ? t('Your password has been updated.', 'Votre mot de passe a été mis à jour.')
                : t(`At least ${MIN_LENGTH} characters.`, `Au moins ${MIN_LENGTH} caractères.`)}
          </p>
        </div>

        {status === 'invalid' && (
          <a href={`/${locale}/auth/login`} style={primaryBtn}>
            {t('Back to sign in', 'Retour à la connexion')}
          </a>
        )}

        {status === 'done' && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', backgroundColor: C.greenLight,
            color: C.green, fontSize: '13px', fontWeight: 600, textAlign: 'center',
          }}>
            {t('Redirecting…', 'Redirection…')}
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="new-password" style={labelStyle}>{t('New password', 'Nouveau mot de passe')}</label>
              <input
                id="new-password" type="password" value={password} required autoComplete="new-password"
                onChange={e => setPassword(e.target.value)} onFocus={focus} onBlur={blur} style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" style={labelStyle}>{t('Confirm password', 'Confirmez le mot de passe')}</label>
              <input
                id="confirm-password" type="password" value={confirm} required autoComplete="new-password"
                onChange={e => setConfirm(e.target.value)} onFocus={focus} onBlur={blur} style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', backgroundColor: C.redLight,
                color: C.red, fontSize: '13px', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? t('Saving…', 'Enregistrement…') : t('Update password', 'Mettre à jour')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

const C = {
  navy: '#16324F', navyDark: '#0F1923', gold: '#F4B400',
  green: '#16A34A', greenLight: '#DCFCE7', red: '#D62828',
  bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF', secondary: '#EEF2F7',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

const REASONS = [
  { key: 'incorrect_flag', en: 'Incorrect flag',        fr: 'Drapeau incorrect' },
  { key: 'fake_flag',      en: 'Fake flag',             fr: 'Faux drapeau' },
  { key: 'flag_changed',   en: 'The flag has changed',  fr: 'Le drapeau a changé' },
  { key: 'offensive_flag', en: 'Offensive flag',        fr: 'Drapeau insultant' },
  { key: 'wrong_info',     en: 'Incorrect information', fr: 'Informations erronées' },
]

const CSS = `
  .kf-report-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(15,25,35,0.55);
    display: flex; align-items: flex-end; justify-content: center;
    animation: kf-report-fade 0.15s ease;
  }
  .kf-report-card {
    background: #FFFFFF; width: 100%; max-height: 92dvh;
    border-radius: 20px 20px 0 0;
    display: flex; flex-direction: column;
    box-shadow: 0 -8px 40px rgba(22,50,79,0.22);
    animation: kf-report-up 0.22s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes kf-report-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes kf-report-up { from { transform: translateY(24px) } to { transform: translateY(0) } }
  @media (min-width: 640px) {
    .kf-report-overlay { align-items: center; padding: 24px; }
    .kf-report-card { max-width: 460px; border-radius: 16px; max-height: 88vh; animation: kf-report-fade 0.15s ease; }
  }
`

export default function ReportModal({ countryCode, countryName, pageType = 'country', onClose }) {
  const locale = useLocale()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  async function submit() {
    if (!reason) { setError(t('Please choose a reason.', 'Veuillez choisir une raison.')); return }
    if (!description.trim()) { setError(t('Please add a description.', 'Veuillez ajouter une description.')); return }
    setError('')
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const { error: insErr } = await supabase.from('reports').insert({
        country_code: (countryCode || '').toLowerCase(),
        reason,
        description: description.trim(),
        reporter_user_id: session?.user?.id ?? null,
        reporter_email: session?.user?.email ?? null,
        locale,
        page_type: pageType,
        page_path: typeof window !== 'undefined' ? window.location.pathname : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        status: 'pending',
      })
      if (insErr) throw insErr
      setDone(true)
    } catch {
      setError(t('Something went wrong. Please try again.', 'Une erreur est survenue. Veuillez réessayer.'))
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = reason && description.trim() && !submitting

  return (
    <div className="kf-report-overlay" onMouseDown={onClose}>
      <style>{CSS}</style>
      <div className="kf-report-card" onMouseDown={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '20px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '10px', backgroundColor: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.navy, letterSpacing: '-0.01em' }}>
              {t('Report an issue', 'Signaler un problème')}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: C.muted, lineHeight: 1.4 }}>
              {countryName
                ? t(`Help us fix the page for ${countryName}.`, `Aidez-nous à corriger la page de ${countryName}.`)
                : t('Help us fix this page.', 'Aidez-nous à corriger cette page.')}
            </p>
          </div>
          <button onClick={onClose} aria-label={t('Close', 'Fermer')} style={{ flexShrink: 0, width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: C.muted }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {done ? (
          /* Success state */
          <div style={{ padding: '32px 24px 28px', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', width: '54px', height: '54px', borderRadius: '9999px', backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: C.navy }}>
              {t('Thanks for the report', 'Merci pour votre signalement')}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.muted, lineHeight: 1.5 }}>
              {t('Our team will review it as soon as possible.', 'Notre équipe l\u2019examinera dès que possible.')}
            </p>
            <button onClick={onClose} style={{ padding: '11px 28px', borderRadius: '10px', backgroundColor: C.navy, color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,50,79,0.08)' }}>
              {t('Done', 'Terminé')}
            </button>
          </div>
        ) : (
          <>
            {/* Body */}
            <div style={{ padding: '18px 20px 4px', overflowY: 'auto' }}>

              {/* Reason */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                {t('Reason', 'Raison')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {REASONS.map(r => {
                  const active = reason === r.key
                  return (
                    <button key={r.key} type="button" onClick={() => { setReason(r.key); setError('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '11px', width: '100%', minHeight: '46px',
                        padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
                        borderRadius: '10px',
                        border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`,
                        backgroundColor: active ? C.secondary : C.surface,
                        transition: 'all 0.12s ease',
                      }}>
                      <span style={{ flexShrink: 0, width: '18px', height: '18px', borderRadius: '9999px', border: `2px solid ${active ? C.navy : C.light}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <span style={{ width: '9px', height: '9px', borderRadius: '9999px', backgroundColor: C.navy }} />}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: active ? C.navy : C.text }}>
                        {t(r.en, r.fr)}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Description */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                {t('Description', 'Description')} <span style={{ color: C.red }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (error) setError('') }}
                rows={4}
                placeholder={t('Tell us what is wrong so we can fix it…', 'Expliquez-nous ce qui ne va pas afin que nous puissions le corriger…')}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '10px',
                  border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface,
                  fontSize: '14px', color: C.text, outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit', lineHeight: 1.5, minHeight: '96px',
                }}
              />

              {error && (
                <p style={{ margin: '10px 0 0', fontSize: '13px', color: C.red, fontWeight: 600 }}>{error}</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 20px', borderTop: `1px solid ${C.border}`, marginTop: '8px' }}>
              <button onClick={onClose} style={{ flex: '0 0 auto', padding: '11px 20px', borderRadius: '10px', backgroundColor: 'transparent', color: C.navy, border: `1.5px solid ${C.borderSolid}`, fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s ease' }}>
                {t('Cancel', 'Annuler')}
              </button>
              <button onClick={submit} disabled={!canSubmit}
                style={{
                  flex: 1, padding: '11px 20px', borderRadius: '10px',
                  backgroundColor: canSubmit ? C.navy : C.secondary,
                  color: canSubmit ? 'white' : C.light,
                  border: 'none', fontSize: '14px', fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  boxShadow: canSubmit ? '0 2px 8px rgba(22,50,79,0.08)' : 'none',
                  transition: 'background-color 0.12s ease',
                }}>
                {submitting ? t('Sending…', 'Envoi…') : t('Send report', 'Envoyer')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
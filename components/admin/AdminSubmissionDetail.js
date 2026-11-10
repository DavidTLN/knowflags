// DESTINATION: components/admin/AdminSubmissionDetail.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  navy: '#16324F', cream: '#F4F1E6', border: '#E2DDD5',
  muted: '#6B7280', green: '#16A34A', red: '#D62828', bg: '#F4F1E6',
  blue: '#9EB7E5',
}

const LABEL = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const INPUT = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2DDD5', fontSize: '13px', color: '#16324F', backgroundColor: 'white', outline: 'none', fontFamily: 'inherit' }
const SECTION = { backgroundColor: 'white', borderRadius: '14px', border: '1px solid #E2DDD5', overflow: 'hidden', marginBottom: '0' }
const SECTION_HDR = { padding: '12px 16px', borderBottom: '1px solid #E2DDD5', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }

const FLAG_COLORS = ['red','white','blue','green','yellow','black','orange','purple','brown','gold','silver','cyan','pink']
const FLAG_SYMBOLS = ['star','cross','crescent','eagle','lion','sun','moon','shield','stripes','triangle','circle','coat_of_arms','tree','map']
const FLAG_SHAPES = ['horizontal_stripes','vertical_stripes','diagonal','cross','nordic_cross','saltire','canton','plain','quadrant','other']
const FACT_CATEGORIES = ['history','geography','culture','symbol','politics','economy','nature','curiosity']

export default function AdminSubmissionDetail({ submission: s, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const router = useRouter()

  // Review state
  const [action,    setAction]    = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [emailSent, setEmailSent] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [done,      setDone]      = useState(false)
  const [reviewErr, setReviewErr] = useState('')

  // Vérification par Claude
  const [status,   setStatus]   = useState(s.status)
  const [report,   setReport]   = useState(s.metadata?.ai_check || null)
  const [aiStep,   setAiStep]   = useState('')      // '' | 'saving' | 'checking' | 'publishing'
  const [noKey,    setNoKey]    = useState(false)
  const open = status === 'pending' || status === 'manual_review'

  // Edit state — pre-fill from submission
  const [edit, setEdit] = useState({
    label_en:     s.label_en     || '',
    label_fr:     s.label_fr     || '',
    entity_code:  s.entity_code  || '',
    country_code: s.country_code || '',
    description:  s.description  || '',
    source_url:   s.source_url   || '',
    valid_from:   s.valid_from   || '',
    valid_to:     s.valid_to     || '',
    is_permanent: s.is_permanent ?? true,
    facts:        (s.facts && s.facts.length > 0) ? s.facts : [''],
    // Country-specific (stockes dans metadata)
    adopted_year: s.metadata?.adopted_year || '',
    ratio:        s.metadata?.ratio        || '',
    shape:        s.metadata?.shape        || '',
    colors:       s.metadata?.colors       || [],
    symbols:      s.metadata?.symbols      || [],
    // Country facts
    country_facts: s.metadata?.country_facts?.length ? s.metadata.country_facts : [{ fact_en: '', fact_fr: '', category: 'history' }],
  })
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState('')
  const [saveErr,  setSaveErr]  = useState('')

  function setF(key, val) { setEdit(e => ({ ...e, [key]: val })) }
  function toggleArr(key, val) {
    setEdit(e => ({ ...e, [key]: e[key].includes(val) ? e[key].filter(x => x !== val) : [...e[key], val] }))
  }

  // Flag facts helpers
  function addFact() { setF('facts', [...edit.facts, '']) }
  function updateFact(i, v) { setEdit(e => ({ ...e, facts: e.facts.map((f, j) => j === i ? v : f) })) }
  function removeFact(i) { setF('facts', edit.facts.filter((_, j) => j !== i)) }

  // Country facts helpers
  function addCFact() { setF('country_facts', [...edit.country_facts, { fact_en: '', fact_fr: '', category: 'history' }]) }
  function updateCFact(i, key, v) { setEdit(e => ({ ...e, country_facts: e.country_facts.map((f, j) => j === i ? { ...f, [key]: v } : f) })) }
  function removeCFact(i) { setF('country_facts', edit.country_facts.filter((_, j) => j !== i)) }

  async function saveEdits() {
    const res = await fetch('/api/update-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, ...edit }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Error')
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    setSaveErr('')
    try {
      await saveEdits()
      setSaveMsg(t('Saved!', 'Enregistré !'))
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) { setSaveErr(e.message) }
    setSaving(false)
  }

  async function publish(act) {
    const res = await fetch('/api/review-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, action: act, adminNote }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Unknown error')
    setAction(act)
    setEmailSent(!!data.emailSent)
    setDone(true)
    setTimeout(() => router.push(`/${locale}/admin/submissions`), 3000)
  }

  // Accepter : on enregistre, Claude vérifie et complète, puis on publie.
  // En cas de doute, la soumission part en « Forçage manuel » avec le rapport.
  async function handleAccept({ skipCheck = false } = {}) {
    setReviewing(true)
    setReviewErr('')
    try {
      setAiStep('saving')
      await saveEdits()
      if (!skipCheck) {
        setAiStep('checking')
        const res = await fetch('/api/review-submission/ai-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.status === 503 && data.code === 'no_key') {
          // Claude non configuré : on saute la vérification et on publie tel quel
          setNoKey(true)
        } else {
          if (!res.ok) throw new Error(data.error || 'Claude error')
          setReport(data.report)
          if (data.outcome === 'manual') {
            setStatus('manual_review')
            setAiStep('')
            setReviewing(false)
            return
          }
        }
      }
      setAiStep('publishing')
      await publish('accept')
    } catch (e) { setReviewErr(e.message) }
    setAiStep('')
    setReviewing(false)
  }

  async function handleReject() {
    setReviewing(true)
    setReviewErr('')
    try { await publish('reject') } catch (e) { setReviewErr(e.message) }
    setReviewing(false)
  }

  // Reprend les propositions de Claude dans le formulaire (forçage manuel)
  function applyReport() {
    const sg = report?.suggestions || {}
    const v = (x) => (typeof x === 'string' && x.trim() ? x.trim() : null)
    setEdit(e => ({
      ...e,
      label_en: v(sg.label_en) || e.label_en,
      label_fr: v(sg.label_fr) || e.label_fr,
      description: v(sg.description) || e.description,
      source_url: v(sg.source_url) || e.source_url,
      entity_code: (v(sg.entity_code) || e.entity_code).toLowerCase(),
      country_code: (v(sg.country_code) || e.country_code).toLowerCase(),
      valid_from: /^\d{4}-\d{2}-\d{2}$/.test(sg.valid_from || '') ? sg.valid_from : e.valid_from,
      valid_to: /^\d{4}-\d{2}-\d{2}$/.test(sg.valid_to || '') ? sg.valid_to : e.valid_to,
      is_permanent: typeof sg.is_permanent === 'boolean' ? sg.is_permanent : e.is_permanent,
      facts: (sg.facts || []).filter(Boolean).length ? [...e.facts.filter(Boolean), ...sg.facts.filter(Boolean)] : e.facts,
    }))
  }

  if (done) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={action === 'accept' ? '#16A34A' : '#D62828'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d={action === 'accept' ? 'M8 12l3 3 5-6' : 'M15 9l-6 6M9 9l6 6'} />
        </svg>
        <h2 style={{ color: C.navy, fontSize: '22px', fontWeight: '900' }}>
          {action === 'accept' ? t('Accepted!', 'Acceptée !') : t('Rejected.', 'Refusée.')}
        </h2>
        <p style={{ color: C.muted, margin: '0 0 6px' }}>
          {emailSent
            ? t('The author has been notified by email.', "L'auteur a été prévenu par e-mail.")
            : t('No email sent (RESEND_API_KEY missing or no address).', 'Aucun e-mail envoyé (RESEND_API_KEY absente ou adresse introuvable).')}
        </p>
        {action === 'accept' && noKey && (
          <p style={{ color: '#92400E', margin: '0 0 6px', fontSize: '13px' }}>
            {t('Published without Claude check (API key or model not configured).', 'Publié sans vérification Claude (clé API ou modèle non configuré).')}
          </p>
        )}
        <p style={{ color: C.muted, margin: 0 }}>{t('Redirecting…', 'Redirection…')}</p>
      </div>
    </div>
  )

  const isCountry = s.flag_type === 'country' || s.flag_type === 'historic'

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div className="kf-adm-hdr" style={{ backgroundColor: C.navy, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Link prefetch={false} href={`/${locale}/admin/submissions`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13px' }}>← {t('Back', 'Retour')}</Link>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'white', flex: '1 1 180px', minWidth: 0, overflowWrap: 'anywhere' }}>{s.label_en || s.name || t('Submission', 'Soumission')}</h1>
        <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
          backgroundColor: status === 'pending' ? '#fefce8' : status === 'manual_review' ? '#FEF3C7' : status === 'accepted' ? '#f0fdf4' : '#fef2f2',
          color: status === 'pending' ? '#854d0e' : status === 'manual_review' ? '#92400E' : status === 'accepted' ? '#166534' : '#991b1b' }}>
          {status === 'manual_review' ? t('Manual review', 'Forçage manuel') : status}
        </span>
      </div>

      <style>{`
        .kf-adm-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start;max-width:1100px;margin:0 auto;padding:32px 24px}
        .kf-adm-side{position:sticky;top:84px}
        @media (max-width:899px){
          .kf-adm-grid{grid-template-columns:minmax(0,1fr);padding:16px;gap:16px}
          .kf-adm-side{position:static;order:-1}
          .kf-adm-hdr{padding:16px!important}
        }
        @media (max-width:599px){ .kf-adm-2{grid-template-columns:1fr!important} }
      `}</style>
      <div className="kf-adm-grid">

        {/* ── LEFT: editable fields ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Flag preview */}
          {s.signedFileUrl && (
            <div style={SECTION}>
              <div style={SECTION_HDR}>{t('Submitted Flag', 'Drapeau soumis')}</div>
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: '#f8f5ed' }}>
                <img src={s.signedFileUrl} alt="flag" style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              </div>
            </div>
          )}

          {/* Basic info */}
          <div style={SECTION}>
            <div style={SECTION_HDR}>{t('Basic Info', 'Infos de base')}</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div className="kf-adm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL}>{t('Name (EN)', 'Nom (EN)')} *</label>
                  <input value={edit.label_en} onChange={e => setF('label_en', e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{t('Name (FR)', 'Nom (FR)')}</label>
                  <input value={edit.label_fr} onChange={e => setF('label_fr', e.target.value)} style={INPUT} />
                </div>
              </div>

              <div className="kf-adm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL}>{t('Entity code / ISO', 'Code entité / ISO')} *</label>
                  <input value={edit.entity_code} onChange={e => setF('entity_code', e.target.value.toLowerCase())}
                    placeholder="fr, de, us…" style={INPUT} />
                </div>
                {(s.flag_type === 'historic' || s.flag_type === 'region' || s.flag_type === 'city') && (
                  <div>
                    <label style={LABEL}>{t('Country ISO code', 'Code ISO du pays')}</label>
                    <input value={edit.country_code} onChange={e => setF('country_code', e.target.value.toLowerCase())}
                      placeholder="fr, de…" style={INPUT} />
                  </div>
                )}
              </div>

              <div>
                <label style={LABEL}>{t('Description', 'Description')}</label>
                <textarea value={edit.description} onChange={e => setF('description', e.target.value)} rows={3}
                  style={{ ...INPUT, resize: 'vertical' }} />
              </div>

              <div>
                <label style={LABEL}>{t('Source URL', 'URL source')}</label>
                <input value={edit.source_url} onChange={e => setF('source_url', e.target.value)}
                  placeholder="https://wikipedia.org/…" style={INPUT} />
              </div>

              {/* Validity */}
              <div>
                <label style={LABEL}>{t('Validity', 'Validité')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" id="perm" checked={edit.is_permanent} onChange={e => setF('is_permanent', e.target.checked)} style={{ width: '15px', height: '15px' }} />
                  <label htmlFor="perm" style={{ fontSize: '12px', color: C.navy, cursor: 'pointer', fontWeight: '600' }}>{t('Permanent / currently in use', 'Permanent / actuellement utilisé')}</label>
                </div>
                <div className="kf-adm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ ...LABEL, fontSize: '10px' }}>{t('Valid from', 'Valide depuis')}</label>
                    <input type="date" value={edit.valid_from} onChange={e => setF('valid_from', e.target.value)} style={INPUT} />
                  </div>
                  {!edit.is_permanent && (
                    <div>
                      <label style={{ ...LABEL, fontSize: '10px' }}>{t('Valid until', "Valide jusqu'au")}</label>
                      <input type="date" value={edit.valid_to} onChange={e => setF('valid_to', e.target.value)} style={INPUT} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Flag facts */}
          <div style={SECTION}>
            <div style={SECTION_HDR}>{t('Flag Fun Facts', 'Anecdotes sur le drapeau')}</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {edit.facts.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px' }}>
                  <input value={f} onChange={e => updateFact(i, e.target.value)}
                    placeholder={t(`Fact ${i+1}…`, `Anecdote ${i+1}…`)} style={{ ...INPUT, flex: 1 }} />
                  {edit.facts.length > 1 && (
                    <button onClick={() => removeFact(i)} style={{ padding: '0 10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', color: C.muted, fontSize: '14px' }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={addFact} style={{ fontSize: '12px', color: C.navy, background: 'none', border: `1px dashed ${C.border}`, borderRadius: '8px', padding: '7px', cursor: 'pointer', fontWeight: '600' }}>
                + {t('Add fact', 'Ajouter une anecdote')}
              </button>
            </div>
          </div>

          {/* Country-specific fields */}
          {isCountry && (<>
            <div style={SECTION}>
              <div style={SECTION_HDR}>{t('Flag Properties', 'Propriétés du drapeau')}</div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div className="kf-adm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LABEL}>{t('Adopted year', 'Année adoption')}</label>
                    <input type="number" value={edit.adopted_year} onChange={e => setF('adopted_year', e.target.value)}
                      placeholder="1958" style={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>{t('Ratio (e.g. 2:3)', 'Ratio (ex. 2:3)')}</label>
                    <input value={edit.ratio} onChange={e => setF('ratio', e.target.value)}
                      placeholder="2:3" style={INPUT} />
                  </div>
                </div>

                <div>
                  <label style={LABEL}>{t('Shape / Design', 'Forme / Design')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {FLAG_SHAPES.map(sh => (
                      <button key={sh} onClick={() => setF('shape', sh)}
                        style={{ padding: '4px 10px', borderRadius: '99px', border: `1.5px solid ${edit.shape === sh ? C.navy : C.border}`, backgroundColor: edit.shape === sh ? C.navy : 'white', color: edit.shape === sh ? 'white' : C.muted, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {sh.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={LABEL}>{t('Colors', 'Couleurs')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {FLAG_COLORS.map(c => (
                      <button key={c} onClick={() => toggleArr('colors', c)}
                        style={{ padding: '4px 10px', borderRadius: '99px', border: `1.5px solid ${edit.colors.includes(c) ? C.navy : C.border}`, backgroundColor: edit.colors.includes(c) ? C.navy : 'white', color: edit.colors.includes(c) ? 'white' : C.muted, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={LABEL}>{t('Symbols', 'Symboles')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {FLAG_SYMBOLS.map(sym => (
                      <button key={sym} onClick={() => toggleArr('symbols', sym)}
                        style={{ padding: '4px 10px', borderRadius: '99px', border: `1.5px solid ${edit.symbols.includes(sym) ? C.navy : C.border}`, backgroundColor: edit.symbols.includes(sym) ? C.navy : 'white', color: edit.symbols.includes(sym) ? 'white' : C.muted, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {sym.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Country facts */}
            <div style={SECTION}>
              <div style={SECTION_HDR}>{t('Country Facts', 'Faits sur le pays')}</div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {edit.country_facts.map((cf, i) => (
                  <div key={i} style={{ padding: '12px', backgroundColor: C.bg, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted }}>Fact {i + 1}</span>
                      {edit.country_facts.length > 1 && (
                        <button onClick={() => removeCFact(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '13px' }}>✕</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input value={cf.fact_en} onChange={e => updateCFact(i, 'fact_en', e.target.value)}
                        placeholder={t('Fact in English…', 'Fait en anglais…')} style={INPUT} />
                      <input value={cf.fact_fr} onChange={e => updateCFact(i, 'fact_fr', e.target.value)}
                        placeholder={t('Fact in French…', 'Fait en français…')} style={INPUT} />
                      <select value={cf.category} onChange={e => updateCFact(i, 'category', e.target.value)}
                        style={{ ...INPUT, appearance: 'none' }}>
                        {FACT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button onClick={addCFact} style={{ fontSize: '12px', color: C.navy, background: 'none', border: `1px dashed ${C.border}`, borderRadius: '8px', padding: '7px', cursor: 'pointer', fontWeight: '600' }}>
                  + {t('Add country fact', 'Ajouter un fait pays')}
                </button>
              </div>
            </div>
          </>)}

          {/* Submission metadata */}
          <div style={SECTION}>
            <div style={SECTION_HDR}>{t('Submission Info', 'Info soumission')}</div>
            <div style={{ padding: '16px' }}>
              {[
                [t('Type', 'Type'),              s.flag_type],
                [t('Submitted by', 'Par'),        s.profiles?.username || 'Unknown'],
                [t('Date', 'Date'),               new Date(s.created_at).toLocaleString()],
                ['File',                          `${s.file_path} (${s.file_type})`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '12px', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, minWidth: '100px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '12px', color: C.navy }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save edits button */}
          {open && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '11px 24px', backgroundColor: C.navy, color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? t('Saving…', 'Enregistrement…') : t('Save edits', 'Enregistrer')}
              </button>
              {saveMsg && <span style={{ fontSize: '13px', color: C.green, fontWeight: '600' }}>{saveMsg}</span>}
              {saveErr && <span style={{ fontSize: '13px', color: C.red, fontWeight: '600' }}>{saveErr}</span>}
            </div>
          )}
        </div>

        {/* ── RIGHT (en haut sur mobile) : décision ── */}
        <div className="kf-adm-side" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {open && (
            <div style={SECTION}>
              <div style={{ ...SECTION_HDR, fontSize: '13px', color: C.navy }}>
                {status === 'manual_review' ? t('Manual review', 'Forçage manuel') : t('Review Decision', 'Décision')}
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {status === 'pending' && (
                  <p style={{ margin: 0, fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>
                    {t('Claude checks the flag, files it in the right place and completes it from Wikipedia before publishing. If in doubt, it goes to manual review.',
                       'Claude vérifie le drapeau, le range au bon endroit et le complète avec Wikipédia avant publication. En cas de doute, il part en forçage manuel.')}
                  </p>
                )}

                <div className="kf-adm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={() => setAction('accept')} disabled={reviewing}
                    style={{ minHeight: '46px', padding: '10px', borderRadius: '10px', border: `2px solid ${action === 'accept' ? C.green : C.border}`, backgroundColor: action === 'accept' ? '#DCFCE7' : 'white', color: action === 'accept' ? '#166534' : C.navy, fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    {status === 'manual_review' ? t('Force publish', 'Forcer la publication') : t('Accept', 'Accepter')}
                  </button>
                  <button onClick={() => setAction('reject')} disabled={reviewing}
                    style={{ minHeight: '46px', padding: '10px', borderRadius: '10px', border: `2px solid ${action === 'reject' ? C.red : C.border}`, backgroundColor: action === 'reject' ? '#FEE2E2' : 'white', color: action === 'reject' ? C.red : C.navy, fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    {t('Reject', 'Refuser')}
                  </button>
                </div>

                {action && (
                  <div>
                    <label style={LABEL}>{action === 'reject' ? t('Reason (required, sent to the author)', "Raison (obligatoire, envoyée à l'auteur)") : t('Note (optional)', 'Note (optionnelle)')}</label>
                    <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                      placeholder={action === 'reject' ? t('Explain why…', 'Expliquez pourquoi…') : t('Optional note…', 'Note optionnelle…')}
                      style={{ ...INPUT, resize: 'vertical', fontSize: '16px' }} />
                  </div>
                )}

                {reviewErr && <div style={{ padding: '10px', backgroundColor: '#FEE2E2', borderRadius: '8px', fontSize: '12px', color: C.red, overflowWrap: 'anywhere' }}>{reviewErr}</div>}

                {action === 'accept' && (
                  <button onClick={() => status === 'manual_review' ? handleAccept({ skipCheck: true }) : handleAccept()} disabled={reviewing}
                    style={{ minHeight: '48px', padding: '12px', backgroundColor: C.green, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: reviewing ? 'wait' : 'pointer', opacity: reviewing ? 0.75 : 1 }}>
                    {aiStep === 'saving' ? t('Saving…', 'Enregistrement…')
                      : aiStep === 'checking' ? t('Claude is checking… (up to 1 min)', 'Claude vérifie… (jusqu’à 1 min)')
                      : aiStep === 'publishing' ? t('Publishing…', 'Publication…')
                      : status === 'manual_review' ? t('Publish as is', 'Publier tel quel')
                      : t('Check with Claude and publish', 'Vérifier avec Claude et publier')}
                  </button>
                )}
                {action === 'reject' && (
                  <button onClick={handleReject} disabled={!adminNote.trim() || reviewing}
                    style={{ minHeight: '48px', padding: '12px', backgroundColor: adminNote.trim() ? C.red : C.border, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: adminNote.trim() ? 'pointer' : 'not-allowed', opacity: reviewing ? 0.75 : 1 }}>
                    {reviewing ? t('Processing…', 'En cours…') : t('Confirm rejection', 'Confirmer le refus')}
                  </button>
                )}
                {status === 'manual_review' && (
                  <button onClick={() => handleAccept()} disabled={reviewing}
                    style={{ minHeight: '44px', padding: '9px', backgroundColor: 'transparent', color: C.navy, border: `1.5px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {t('Re-run Claude check after my edits', 'Relancer Claude après mes corrections')}
                  </button>
                )}
              </div>
            </div>
          )}

          {report && (
            <div style={SECTION}>
              <div style={{ ...SECTION_HDR, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span>{t('Claude report', 'Rapport de Claude')}</span>
                <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                  backgroundColor: report.verdict === 'doubt' ? '#FEE2E2' : report.verdict === 'ok' ? '#DCFCE7' : '#FEF3C7',
                  color: report.verdict === 'doubt' ? '#D62828' : report.verdict === 'ok' ? '#16A34A' : '#92400E' }}>
                  {report.verdict === 'doubt' ? t('Doubt', 'Doute') : report.verdict === 'ok' ? 'OK' : t('Corrected', 'Corrigé')}
                </span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.summary_fr && <p style={{ margin: 0, fontSize: '13px', color: C.navy, lineHeight: 1.55 }}>{report.summary_fr}</p>}
                {report.image_matches === false && (
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: C.red }}>{t('The image does not seem to match.', 'L’image ne semble pas correspondre.')}</p>
                )}
                {(report.checks || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {report.checks.map((c, i) => {
                      const col = c.status === 'doubt' ? C.red : c.status === 'ok' ? C.green : '#92400E'
                      return (
                        <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', lineHeight: 1.45 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col, flexShrink: 0, marginTop: '5px' }} />
                          <span style={{ color: C.navy }}><b>{c.field}</b> · {c.message_fr}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {(report.sources || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                    {report.sources.map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563EB', overflowWrap: 'anywhere' }}>{src.title || src.url}</a>
                    ))}
                  </div>
                )}
                {status === 'manual_review' && report.suggestions && (
                  <button onClick={applyReport}
                    style={{ minHeight: '44px', padding: '9px', backgroundColor: C.navy, color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {t('Apply Claude suggestions to the form', 'Reprendre les propositions de Claude')}
                  </button>
                )}
                {report.checked_at && <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{new Date(report.checked_at).toLocaleString()}</span>}
              </div>
            </div>
          )}

          {!open && s.admin_notes && (
            <div style={SECTION}>
              <div style={SECTION_HDR}>{t('Admin note', 'Note admin')}</div>
              <div style={{ padding: '16px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: C.navy, lineHeight: 1.6 }}>{s.admin_notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
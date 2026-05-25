// DESTINATION: components/admin/AdminSubmissionDetail.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  navy: '#0B1F3B', cream: '#F4F1E6', border: '#E2DDD5',
  muted: '#8A8278', green: '#426A5A', red: '#C0392B', bg: '#F7F5EF',
  blue: '#9EB7E5',
}

const LABEL = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#8A8278', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const INPUT = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2DDD5', fontSize: '13px', color: '#0B1F3B', backgroundColor: 'white', outline: 'none', fontFamily: 'inherit' }
const SECTION = { backgroundColor: 'white', borderRadius: '14px', border: '1px solid #E2DDD5', overflow: 'hidden', marginBottom: '0' }
const SECTION_HDR = { padding: '12px 16px', borderBottom: '1px solid #E2DDD5', fontSize: '12px', fontWeight: '700', color: '#8A8278', textTransform: 'uppercase', letterSpacing: '0.5px' }

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
  const [reviewing, setReviewing] = useState(false)
  const [done,      setDone]      = useState(false)
  const [reviewErr, setReviewErr] = useState('')

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
    // Country-specific
    adopted_year: s.adopted_year || '',
    ratio:        s.ratio        || '',
    shape:        s.shape        || '',
    colors:       s.colors       || [],
    symbols:      s.symbols      || [],
    // Country facts
    country_facts: s.country_facts || [{ fact_en: '', fact_fr: '', category: 'history' }],
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

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    setSaveErr('')
    try {
      const res = await fetch('/api/update-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, ...edit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setSaveMsg(t('Saved!', 'Enregistré !'))
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) { setSaveErr(e.message) }
    setSaving(false)
  }

  async function handleReview() {
    setReviewing(true)
    setReviewErr('')
    try {
      const res = await fetch('/api/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, action, adminNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setDone(true)
      setTimeout(() => router.push(`/${locale}/admin/submissions`), 2000)
    } catch (e) { setReviewErr(e.message) }
    setReviewing(false)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>{action === 'accept' ? '✅' : '❌'}</div>
        <h2 style={{ color: C.navy, fontSize: '22px', fontWeight: '900' }}>
          {action === 'accept' ? t('Accepted!', 'Acceptée !') : t('Rejected.', 'Refusée.')}
        </h2>
        <p style={{ color: C.muted }}>{t('Redirecting…', 'Redirection…')}</p>
      </div>
    </div>
  )

  const isCountry = s.flag_type === 'country' || s.flag_type === 'historic'

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ backgroundColor: C.navy, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href={`/${locale}/admin/submissions`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13px' }}>← {t('Back', 'Retour')}</Link>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'white', flex: 1 }}>{s.label_en || s.name || t('Submission', 'Soumission')}</h1>
        <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
          backgroundColor: s.status === 'pending' ? '#fefce8' : s.status === 'accepted' ? '#f0fdf4' : '#fef2f2',
          color: s.status === 'pending' ? '#854d0e' : s.status === 'accepted' ? '#166534' : '#991b1b' }}>
          {s.status}
        </span>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL}>{t('Name (EN)', 'Nom (EN)')} *</label>
                  <input value={edit.label_en} onChange={e => setF('label_en', e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{t('Name (FR)', 'Nom (FR)')}</label>
                  <input value={edit.label_fr} onChange={e => setF('label_fr', e.target.value)} style={INPUT} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
          {s.status === 'pending' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '11px 24px', backgroundColor: C.navy, color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? t('Saving…', 'Enregistrement…') : t('💾 Save edits', '💾 Enregistrer')}
              </button>
              {saveMsg && <span style={{ fontSize: '13px', color: C.green, fontWeight: '600' }}>{saveMsg}</span>}
              {saveErr && <span style={{ fontSize: '13px', color: C.red, fontWeight: '600' }}>{saveErr}</span>}
            </div>
          )}
        </div>

        {/* ── RIGHT: review panel ── */}
        <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {s.status === 'pending' && (
            <div style={SECTION}>
              <div style={{ ...SECTION_HDR, fontSize: '13px', color: C.navy }}>{t('Review Decision', 'Décision')}</div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setAction('accept')}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `2px solid ${action === 'accept' ? '#16a34a' : C.border}`, backgroundColor: action === 'accept' ? '#f0fdf4' : 'white', color: action === 'accept' ? '#166534' : C.muted, fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  ✅ {t('Accept', 'Accepter')}
                </button>
                <button onClick={() => setAction('reject')}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `2px solid ${action === 'reject' ? C.red : C.border}`, backgroundColor: action === 'reject' ? '#fef2f2' : 'white', color: action === 'reject' ? C.red : C.muted, fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  ❌ {t('Reject', 'Refuser')}
                </button>
                <div>
                  <label style={LABEL}>{action === 'reject' ? t('Reason (required)', 'Raison (obligatoire)') : t('Note (optional)', 'Note (optionnelle)')}</label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={4}
                    placeholder={action === 'reject' ? t('Explain why…', 'Expliquez pourquoi…') : t('Optional note…', 'Note optionnelle…')}
                    style={{ ...INPUT, resize: 'vertical' }} />
                </div>
                {reviewErr && <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '12px', color: C.red }}>{reviewErr}</div>}
                <button onClick={handleReview}
                  disabled={!action || (action === 'reject' && !adminNote.trim()) || reviewing}
                  style={{ width: '100%', padding: '13px', backgroundColor: !action || (action === 'reject' && !adminNote.trim()) ? C.border : action === 'accept' ? C.green : C.red, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: !action ? 'not-allowed' : 'pointer', opacity: reviewing ? 0.7 : 1 }}>
                  {reviewing ? t('Processing…', 'En cours…') : t('Confirm decision', 'Confirmer')}
                </button>
                <p style={{ margin: 0, fontSize: '11px', color: C.muted, textAlign: 'center' }}>
                  {t('Save your edits before accepting.', 'Enregistrez vos modifications avant d\'accepter.')}
                </p>
              </div>
            </div>
          )}

          {s.status !== 'pending' && s.admin_notes && (
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
'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

const C = {
  navy: '#0B1F3B', blue: '#9EB7E5', cream: '#F4F1E6', green: '#426A5A',
  border: '#E2DDD5', muted: '#8A8278', red: '#ef4444', bg: '#F7F5EF',
}
const LABEL = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#8A8278', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const INPUT = { width: '100%', boxSizing: 'border-box', padding: '9px 13px', borderRadius: '8px', border: '1.5px solid #E2DDD5', fontSize: '14px', color: '#0B1F3B', backgroundColor: 'white', outline: 'none', fontFamily: 'inherit' }

const FLAG_TYPES = [
  { key: 'country',      icon: '🌍', en: 'Country',      fr: 'Pays' },
  { key: 'region',       icon: '🗺️', en: 'Region',       fr: 'Région' },
  { key: 'city',         icon: '🏙️', en: 'City',         fr: 'Ville' },
  { key: 'organisation', icon: '🏛️', en: 'Organisation', fr: 'Organisation' },
  { key: 'historic',     icon: '📜', en: 'Historic',     fr: 'Historique' },
]

const SUBTYPES = [
  { key: 'new_flag',   icon: '🆕', en: 'New official flag',        fr: 'Nouveau drapeau officiel',      desc_en: 'A new flag was officially adopted. The current one will be archived.',     desc_fr: 'Un nouveau drapeau a été adopté. L\'actuel sera archivé.' },
  { key: 'correction', icon: '✏️', en: 'Correction / wrong image', fr: 'Correction / image incorrecte', desc_en: 'The current image is wrong or poor quality. The old will be kept in archive.', desc_fr: 'L\'image actuelle est incorrecte. L\'ancienne sera archivée.' },
]

const MODAL_STYLE = `
  .flag-submit-modal {
    background: white;
    width: 100%;
    height: 100dvh;
    border-radius: 20px 20px 0 0;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.2);
  }
  @media (min-width: 640px) {
    .flag-submit-overlay { align-items: center !important; padding: 24px; }
    .flag-submit-modal {
      max-width: 680px; height: auto;
      min-height: 600px; max-height: 88vh;
      border-radius: 20px;
    }
  }
`

// ── Reusable entity picker ────────────────────────────────────────────────────
function EntityPicker({ value, onChange, items, getLabel, getKey, locale, placeholder, allowNew, newLabel }) {
  const [search, setSearch] = useState('')
  const filtered = items.filter(i => getLabel(i).toLowerCase().includes(search.toLowerCase())).slice(0, 8)
  const selected = items.find(i => getKey(i) === value)

  if (value) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 13px', backgroundColor: value === '__new__' ? '#f0f9ff' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${value === '__new__' ? '#bae6fd' : '#bbf7d0'}` }}>
      {value === '__new__' ? <span>➕</span> : null}
      <span style={{ fontSize: '13px', fontWeight: '700', color: C.navy, flex: 1 }}>
        {value === '__new__' ? newLabel : (selected ? getLabel(selected) : value)}
      </span>
      <button onClick={() => { onChange(''); setSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '14px' }}>✕</button>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} style={INPUT} />
      {search && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden', marginTop: '4px', maxHeight: '220px', overflowY: 'auto' }}>
          {allowNew && (
            <button onMouseDown={e => { e.preventDefault(); onChange('__new__'); setSearch('') }}
              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', borderBottom: `1px solid ${C.border}`, backgroundColor: '#f0f9ff', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: C.navy }}>
              ➕ {newLabel}
            </button>
          )}
          {filtered.map(item => (
            <button key={getKey(item)} onMouseDown={e => { e.preventDefault(); onChange(getKey(item)); setSearch('') }}
              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', borderBottom: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', color: C.navy, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {getLabel(item)}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: '12px', fontSize: '13px', color: C.muted, textAlign: 'center' }}>No results</div>}
        </div>
      )}
    </div>
  )
}

// ── Country picker with flag ──────────────────────────────────────────────────
function CountryPicker({ value, onChange, countries, locale, placeholder, allowNew, newLabel }) {
  const getName = c => locale === 'fr' ? c.name_fr : c.name_en
  const [search, setSearch] = useState('')
  const filtered = countries.filter(c =>
    getName(c).toLowerCase().includes(search.toLowerCase()) ||
    c.iso_code.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)
  const selected = countries.find(c => c.iso_code === value)

  if (value) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 13px', backgroundColor: value === '__new__' ? '#f0f9ff' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${value === '__new__' ? '#bae6fd' : '#bbf7d0'}` }}>
      {value !== '__new__' && selected && <img src={`https://flagcdn.com/w40/${value.toLowerCase()}.png`} width="24" height="16" style={{ borderRadius: '2px' }} />}
      {value === '__new__' && <span>➕</span>}
      <span style={{ fontSize: '13px', fontWeight: '700', color: C.navy, flex: 1 }}>
        {value === '__new__' ? newLabel : (selected ? getName(selected) : value)}
      </span>
      <button onClick={() => { onChange(''); setSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '14px' }}>✕</button>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} style={INPUT} />
      {search && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden', marginTop: '4px', maxHeight: '220px', overflowY: 'auto' }}>
          {allowNew && (
            <button onMouseDown={e => { e.preventDefault(); onChange('__new__'); setSearch('') }}
              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', borderBottom: `1px solid ${C.border}`, backgroundColor: '#f0f9ff', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: C.navy }}>
              ➕ {newLabel}
            </button>
          )}
          {filtered.map(c => (
            <button key={c.iso_code} onMouseDown={e => { e.preventDefault(); onChange(c.iso_code); setSearch('') }}
              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', borderBottom: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.navy }}>
              <img src={`https://flagcdn.com/w40/${c.iso_code.toLowerCase()}.png`} width="24" height="16" style={{ borderRadius: '2px', flexShrink: 0 }} />
              {getName(c)} <span style={{ color: C.muted, fontSize: '11px' }}>({c.iso_code.toUpperCase()})</span>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: '12px', fontSize: '13px', color: C.muted, textAlign: 'center' }}>No results</div>}
        </div>
      )}
    </div>
  )
}

// ── Subtype selector ──────────────────────────────────────────────────────────
function SubtypeSelector({ value, onChange, changeDate, onChangeDate, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {SUBTYPES.map(st => (
        <button key={st.key} onClick={() => onChange(st.key)}
          style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${value === st.key ? C.navy : C.border}`, backgroundColor: value === st.key ? '#f0f4ff' : 'white', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{st.icon}</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy }}>{t(st.en, st.fr)}</div>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px', lineHeight: 1.4 }}>{t(st.desc_en, st.desc_fr)}</div>
          </div>
          {value === st.key && <span style={{ marginLeft: 'auto', color: C.navy, flexShrink: 0 }}>✓</span>}
        </button>
      ))}
      {value === 'new_flag' && (
        <div style={{ marginTop: '4px' }}>
          <label style={LABEL}>{t('Date of flag change', 'Date du changement')} *</label>
          <input type="date" value={changeDate} onChange={e => onChangeDate(e.target.value)} style={INPUT} />
          <p style={{ margin: '5px 0 0', fontSize: '11px', color: C.muted }}>
            {t('The previous flag will be archived with this end date.', 'L\'ancien drapeau sera archivé avec cette date de fin.')}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FlagSubmitModal({ onClose, defaultCountry = '' }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [user, setUser]             = useState(null)
  const [step, setStep]             = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState('')

  // Data
  const [countries,     setCountries]     = useState([])
  const [regions,       setRegions]       = useState([])
  const [cities,        setCities]        = useState([])
  const [organisations, setOrganisations] = useState([])

  // Entity selection
  const [flagType,    setFlagType]    = useState('')
  const [subtype,     setSubtype]     = useState('') // new_flag | correction | new_entity
  const [countryCode, setCountryCode] = useState(defaultCountry)
  const [regionSlug,  setRegionSlug]  = useState('')
  const [entitySlug,  setEntitySlug]  = useState(defaultCountry) // for country: iso_code, for others: slug
  const [changeDate,  setChangeDate]  = useState('')

  // New entity fields
  const [newIso,      setNewIso]      = useState('')
  const [newNameEn,   setNewNameEn]   = useState('')
  const [newNameFr,   setNewNameFr]   = useState('')
  const [newCapital,  setNewCapital]  = useState('')
  const [newRegion,   setNewRegion]   = useState('')
  const [newEntityType, setNewEntityType] = useState('sovereign')
  const [newParentIso,  setNewParentIso]  = useState('')
  const [newOrgType,  setNewOrgType]  = useState('intergovernmental')
  const [newFounded,  setNewFounded]  = useState('')
  const [newWebsite,  setNewWebsite]  = useState('')

  // Details
  const [labelEn,     setLabelEn]     = useState('')
  const [labelFr,     setLabelFr]     = useState('')
  const [description, setDescription] = useState('')
  const [sourceUrl,   setSourceUrl]   = useState('')
  const [facts,       setFacts]       = useState([''])
  const [validFrom,   setValidFrom]   = useState('')
  const [validTo,     setValidTo]     = useState('')
  const [isPermanent, setIsPermanent] = useState(true)

  // File
  const [file,        setFile]        = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const fileRef = useRef(null)

  const isNewEntity   = entitySlug === '__new__'
  const isNewRegion   = regionSlug === '__new__'
  const getName = c => locale === 'fr' ? c.name_fr : c.name_en

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    supabase.from('countries').select('iso_code, name_en, name_fr').order('name_en')
      .then(({ data }) => { if (data) setCountries(data) })
    supabase.from('organisations').select('id, slug, name_en, name_fr')
      .then(({ data }) => { if (data) setOrganisations(data) })
  }, [])

  // Load regions when country selected
  useEffect(() => {
    if (!countryCode || countryCode === '__new__') { setRegions([]); return }
    const supabase = createClient()
    supabase.from('subnational_flags').select('slug, name_en, name_fr')
      .eq('iso_code', countryCode.toLowerCase()).eq('type', 'region')
      .order('name_en')
      .then(({ data }) => { if (data) setRegions(data) })
  }, [countryCode])

  // Load cities when region selected
  useEffect(() => {
    if (!regionSlug || regionSlug === '__new__') { setCities([]); return }
    const supabase = createClient()
    supabase.from('subnational_flags').select('slug, name_en, name_fr')
      .eq('iso_code', countryCode.toLowerCase()).eq('type', 'city')
      .like('slug', `${regionSlug}%`)
      .then(({ data }) => { if (data) setCities(data) })
  }, [regionSlug, countryCode])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/svg+xml', 'image/png'].includes(f.type)) { setError(t('SVG or PNG only.', 'SVG ou PNG uniquement.')); return }
    if (f.size > 5 * 1024 * 1024) { setError(t('Max 5MB.', 'Max 5Mo.')); return }
    setFile(f); setError('')
    const reader = new FileReader()
    reader.onload = ev => setFilePreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  // ── Reset cascade when type changes ──
  function handleTypeChange(type) {
    setFlagType(type)
    setSubtype('')
    setEntitySlug('')
    setCountryCode(defaultCountry)
    setRegionSlug('')
    setChangeDate('')
  }

  // ── Reset region/city cascade when country changes ──
  function handleCountryChange(code) {
    setCountryCode(code)
    setRegionSlug('')
    setEntitySlug('')
  }

  function handleRegionChange(slug) {
    setRegionSlug(slug)
    setEntitySlug('')
  }

  function canProceed() {
    if (step === 0) return !!flagType
    if (step === 1) {
      if (flagType === 'country') {
        if (!entitySlug) return false
        if (isNewEntity) return true
        return !!subtype && (subtype !== 'new_flag' || !!changeDate)
      }
      if (flagType === 'region') {
        if (!countryCode) return false
        if (!entitySlug) return false
        if (entitySlug === '__new__') return !!newNameEn && !!newIso
        return !!subtype && (subtype !== 'new_flag' || !!changeDate)
      }
      if (flagType === 'city') {
        if (!countryCode) return false
        // Region is mandatory
        if (!regionSlug) return false
        // If new region selected, need name + slug
        if (regionSlug === '__new__' && (!newNameEn || !newIso)) return false
        if (!entitySlug) return false
        // If new city, need name + slug
        if (entitySlug === '__new__') return !!newNameEn && !!newIso
        return !!subtype && (subtype !== 'new_flag' || !!changeDate)
      }
      if (flagType === 'organisation') {
        if (!entitySlug) return false
        if (isNewEntity) return true
        return !!subtype && (subtype !== 'new_flag' || !!changeDate)
      }
      if (flagType === 'historic') return !!countryCode
      return true
    }
    if (step === 2) return !!labelEn
    if (step === 3) return !!file
    return true
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true); setError('')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const entityKey = isNewEntity ? (newIso || newNameEn?.toLowerCase().replace(/\s+/g, '-')) : entitySlug
      const fileName = `${flagType}_${entityKey}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('flag-submissions').upload(fileName, file)
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('submissions').insert({
        user_id:            user.id,
        name:               labelEn,
        description,
        flag_type:          flagType,
        submission_subtype: isNewEntity ? 'new_entity' : subtype,
        entity_code:        entityKey,
        country_code:       flagType === 'country' ? entityKey : countryCode,
        file_path:          fileName,
        file_type:          ext,
        label_en:           labelEn,
        label_fr:           labelFr,
        source_url:         sourceUrl,
        facts:              facts.filter(f => f.trim()),
        valid_from:         validFrom || changeDate || null,
        valid_to:           isPermanent ? null : (validTo || null),
        is_permanent:       isPermanent,
        status:             'pending',
        metadata: {
          region_slug:       regionSlug === '__new__' ? newIso : (regionSlug || null),
          change_date:       changeDate  || null,
          new_iso:           newIso      || null,
          new_name_en:       newNameEn   || null,
          new_name_fr:       newNameFr   || null,
          new_capital:       newCapital  || null,
          new_region:        newRegion   || null,
          new_entity_type:   newEntityType || 'sovereign',
          new_parent_iso:    (newEntityType === 'constituent_country' || newEntityType === 'dependent_territory' || newEntityType === 'autonomous_region') ? (newParentIso || null) : null,
          new_org_type:      newOrgType  || null,
          new_founded:       newFounded  || null,
          new_website:       newWebsite  || null,
          // If region is also new for a city submission
          new_region_slug:   regionSlug === '__new__' ? newIso : null,
          new_region_name_en: regionSlug === '__new__' ? newNameEn : null,
          new_region_name_fr: regionSlug === '__new__' ? newNameFr : null,
        },
      })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (e) {
      console.error(e)
      setError(t('An error occurred. Please try again.', 'Une erreur est survenue.'))
    }
    setSubmitting(false)
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <style>{MODAL_STYLE}</style>
      <div style={{ background: 'white', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '40px 24px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏳️</div>
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '900', color: C.navy }}>{t('Sign in to submit a flag', 'Connectez-vous pour soumettre')}</h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.muted, lineHeight: 1.6 }}>{t('You need an account to contribute.', 'Vous avez besoin d\'un compte.')}</p>
        <a href={`/${locale}/auth/login`} style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: C.navy, color: C.cream, borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', marginRight: '10px' }}>{t('Sign in', 'Se connecter')}</a>
        <button onClick={onClose} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>{t('Cancel', 'Annuler')}</button>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <style>{MODAL_STYLE}</style>
      <div style={{ background: 'white', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '40px 24px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '900', color: C.navy }}>{t('Submission received!', 'Soumission reçue !')}</h2>
        <p style={{ margin: '0 0 8px', fontSize: '14px', color: C.muted, lineHeight: 1.6 }}>{t('Our team will review your flag and notify you by email.', 'Notre équipe va examiner votre drapeau et vous notifier par e-mail.')}</p>
        <button onClick={onClose} style={{ marginTop: '20px', padding: '12px 28px', backgroundColor: C.navy, color: C.cream, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{t('Close', 'Fermer')}</button>
      </div>
    </div>
  )

  const STEPS = ['type', 'entity', 'details', 'file', 'review']

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,31,59,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} className="flag-submit-overlay" onClick={onClose}>
      <style>{MODAL_STYLE}</style>
      <div className="flag-submit-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: C.navy }}>🏳️ {t('Submit a Flag', 'Soumettre un Drapeau')}</h2>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: C.muted }}>{t('Contribute a flag to KnowFlags.', 'Contribuez un drapeau à KnowFlags.')}</p>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '99px', backgroundColor: i <= step ? C.navy : C.border, transition: 'background-color 0.2s' }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>

          {/* STEP 0 — Type */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: C.navy }}>{t('What type of flag are you submitting?', 'Quel type de drapeau soumettez-vous ?')}</p>
              {FLAG_TYPES.map(ft => (
                <button key={ft.key} onClick={() => handleTypeChange(ft.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', border: `2px solid ${flagType === ft.key ? C.navy : C.border}`, backgroundColor: flagType === ft.key ? C.navy : 'white', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '22px' }}>{ft.icon}</span>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: flagType === ft.key ? 'white' : C.navy }}>{t(ft.en, ft.fr)}</span>
                  {flagType === ft.key && <span style={{ marginLeft: 'auto', color: 'white' }}>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 — Entity */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* ── COUNTRY ── */}
              {flagType === 'country' && (<>
                <div>
                  <label style={LABEL}>{t('Select country', 'Sélectionner le pays')} *</label>
                  <CountryPicker value={entitySlug} onChange={v => { setEntitySlug(v); setSubtype(''); setChangeDate('') }}
                    countries={countries} locale={locale}
                    placeholder={t('Search a country…', 'Chercher un pays…')}
                    allowNew newLabel={t('+ New country (not in list)', '+ Nouveau pays (absent de la liste)')} />
                </div>
                {entitySlug && !isNewEntity && (
                  <div>
                    <label style={LABEL}>{t('Type of submission', 'Type de soumission')} *</label>
                    <SubtypeSelector value={subtype} onChange={setSubtype} changeDate={changeDate} onChangeDate={setChangeDate} t={t} />
                  </div>
                )}
                {isNewEntity && (
                  <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>{t('New country information', 'Informations du nouveau pays')}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>ISO code *</label><input value={newIso} onChange={e => setNewIso(e.target.value.toLowerCase().slice(0,3))} placeholder="xx" maxLength={3} style={INPUT} /></div>
                      <div><label style={LABEL}>{t('Region', 'Région')}</label>
                        <select value={newRegion} onChange={e => setNewRegion(e.target.value)} style={{ ...INPUT, appearance: 'none' }}>
                          <option value="">—</option>
                          {['Africa','Americas','Asia','Europe','Oceania'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>{t('Name EN', 'Nom EN')} *</label><input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} style={INPUT} /></div>
                      <div><label style={LABEL}>{t('Name FR', 'Nom FR')}</label><input value={newNameFr} onChange={e => setNewNameFr(e.target.value)} style={INPUT} /></div>
                    </div>
                    <div><label style={LABEL}>{t('Capital', 'Capitale')}</label><input value={newCapital} onChange={e => setNewCapital(e.target.value)} style={INPUT} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>{t('Type', 'Type')}</label>
                        <select value={newEntityType} onChange={e => { setNewEntityType(e.target.value); if (e.target.value === 'sovereign' || e.target.value === 'partially_recognized') setNewParentIso('') }} style={{ ...INPUT, appearance: 'none' }}>
                          <option value="sovereign">{t('Sovereign country', 'Pays souverain')}</option>
                          <option value="constituent_country">{t('Constituent country', 'Nation constitutive')}</option>
                          <option value="dependent_territory">{t('Dependent territory', 'Territoire dépendant')}</option>
                          <option value="autonomous_region">{t('Autonomous region', 'Région autonome')}</option>
                          <option value="partially_recognized">{t('Limited recognition', 'Reconnaissance limitée')}</option>
                        </select>
                      </div>
                      {(newEntityType === 'constituent_country' || newEntityType === 'dependent_territory' || newEntityType === 'autonomous_region') && (
                        <div><label style={LABEL}>{t('Parent country', 'Pays parent')} *</label>
                          <CountryPicker value={newParentIso} onChange={setNewParentIso} countries={countries} locale={locale} placeholder={t('Choose…', 'Choisir…')} allowNew={false} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>)}

              {/* ── REGION ── */}
              {flagType === 'region' && (<>
                <div>
                  <label style={LABEL}>{t('Country', 'Pays')} *</label>
                  <CountryPicker value={countryCode} onChange={handleCountryChange}
                    countries={countries} locale={locale}
                    placeholder={t('Which country?', 'Quel pays ?')} />
                </div>

                {countryCode && (
                  <div>
                    <label style={LABEL}>{t('Region', 'Région')} *</label>
                    <EntityPicker value={entitySlug} onChange={v => { setEntitySlug(v); setSubtype(''); setChangeDate('') }}
                      items={regions} getLabel={r => locale === 'fr' ? r.name_fr : r.name_en} getKey={r => r.slug}
                      locale={locale} placeholder={t('Search a region…', 'Chercher une région…')}
                      allowNew newLabel={t('+ New region (not in list)', '+ Nouvelle région (absente de la liste)')} />
                  </div>
                )}

                {/* New region inline form */}
                {entitySlug === '__new__' && (
                  <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>
                      {t('New region details', 'Détails de la nouvelle région')}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>{t('Name EN', 'Nom EN')} *</label>
                        <input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} style={INPUT} /></div>
                      <div><label style={LABEL}>{t('Name FR', 'Nom FR')}</label>
                        <input value={newNameFr} onChange={e => setNewNameFr(e.target.value)} style={INPUT} /></div>
                    </div>
                    <div>
                      <label style={LABEL}>{t('Slug', 'Slug')} *</label>
                      <input value={newIso} onChange={e => setNewIso(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder={`${countryCode}-region-name`} style={INPUT} />
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.muted }}>
                        {t('Unique identifier, e.g. france-bretagne', 'Identifiant unique, ex. france-bretagne')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Subtype for existing region */}
                {entitySlug && entitySlug !== '__new__' && (
                  <div>
                    <label style={LABEL}>{t('Type of submission', 'Type de soumission')} *</label>
                    <SubtypeSelector value={subtype} onChange={setSubtype} changeDate={changeDate} onChangeDate={setChangeDate} t={t} />
                  </div>
                )}
              </>)}

              {/* ── CITY ── */}
              {flagType === 'city' && (<>

                {/* 1. Country */}
                <div>
                  <label style={LABEL}>{t('Country', 'Pays')} *</label>
                  <CountryPicker value={countryCode} onChange={handleCountryChange}
                    countries={countries} locale={locale}
                    placeholder={t('Select country…', 'Sélectionner un pays…')} />
                </div>

                {/* 2. Region — mandatory, from DB list */}
                {countryCode && (
                  <div>
                    <label style={LABEL}>{t('Region', 'Région')} *</label>
                    <EntityPicker value={regionSlug} onChange={handleRegionChange}
                      items={regions} getLabel={r => locale === 'fr' ? r.name_fr : r.name_en} getKey={r => r.slug}
                      locale={locale} placeholder={t('Search a region…', 'Chercher une région…')}
                      allowNew newLabel={t('+ New region (not in list)', '+ Nouvelle région (absente de la liste)')} />
                  </div>
                )}

                {/* 2b. New region inline form */}
                {regionSlug === '__new__' && (
                  <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>
                      {t('New region details', 'Détails de la nouvelle région')}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>{t('Name EN', 'Nom EN')} *</label>
                        <input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} style={INPUT} /></div>
                      <div><label style={LABEL}>{t('Name FR', 'Nom FR')}</label>
                        <input value={newNameFr} onChange={e => setNewNameFr(e.target.value)} style={INPUT} /></div>
                    </div>
                    <div>
                      <label style={LABEL}>{t('Region slug', 'Slug région')} *</label>
                      <input value={newIso} onChange={e => setNewIso(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder={`${countryCode}-region-name`} style={INPUT} />
                    </div>
                  </div>
                )}

                {/* 3. City — show once region is chosen or new region name+slug filled */}
                {countryCode && regionSlug && (regionSlug !== '__new__' || (newNameEn && newIso)) && (
                  <div>
                    <label style={LABEL}>{t('City', 'Ville')} *</label>
                    <EntityPicker value={entitySlug} onChange={v => { setEntitySlug(v); setSubtype(''); setChangeDate('') }}
                      items={cities} getLabel={c => locale === 'fr' ? c.name_fr : c.name_en} getKey={c => c.slug}
                      locale={locale} placeholder={t('Search a city…', 'Chercher une ville…')}
                      allowNew newLabel={t('+ New city (not in list)', '+ Nouvelle ville (absente de la liste)')} />
                  </div>
                )}

                {/* 3b. New city inline form */}
                {entitySlug === '__new__' && (
                  <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>
                      {t('New city details', 'Détails de la nouvelle ville')}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>{t('Name EN', 'Nom EN')} *</label>
                        <input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} style={INPUT} /></div>
                      <div><label style={LABEL}>{t('Name FR', 'Nom FR')}</label>
                        <input value={newNameFr} onChange={e => setNewNameFr(e.target.value)} style={INPUT} /></div>
                    </div>
                    <div>
                      <label style={LABEL}>{t('City slug', 'Slug ville')} *</label>
                      <input value={newIso} onChange={e => setNewIso(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder={regionSlug !== '__new__' && regionSlug ? `${regionSlug}-city-name` : `${countryCode}-city-name`}
                        style={INPUT} />
                    </div>
                  </div>
                )}

                {/* Subtype for existing city */}
                {entitySlug && entitySlug !== '__new__' && (
                  <div>
                    <label style={LABEL}>{t('Type of submission', 'Type de soumission')} *</label>
                    <SubtypeSelector value={subtype} onChange={setSubtype} changeDate={changeDate} onChangeDate={setChangeDate} t={t} />
                  </div>
                )}
              </>)}

              {/* ── ORGANISATION ── */}
              {flagType === 'organisation' && (<>
                <div>
                  <label style={LABEL}>{t('Organisation', 'Organisation')} *</label>
                  <EntityPicker value={entitySlug} onChange={v => { setEntitySlug(v); setSubtype(''); setChangeDate('') }}
                    items={organisations} getLabel={o => locale === 'fr' ? o.name_fr : o.name_en} getKey={o => o.slug}
                    locale={locale} placeholder={t('Search an organisation…', 'Chercher une organisation…')}
                    allowNew newLabel={t('+ New organisation', '+ Nouvelle organisation')} />
                </div>
                {entitySlug && !isNewEntity && (
                  <div>
                    <label style={LABEL}>{t('Type of submission', 'Type de soumission')} *</label>
                    <SubtypeSelector value={subtype} onChange={setSubtype} changeDate={changeDate} onChangeDate={setChangeDate} t={t} />
                  </div>
                )}
                {isNewEntity && (
                  <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>{t('New organisation information', 'Informations de la nouvelle organisation')}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={LABEL}>{t('Name EN', 'Nom EN')} *</label><input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} style={INPUT} /></div>
                      <div><label style={LABEL}>{t('Name FR', 'Nom FR')}</label><input value={newNameFr} onChange={e => setNewNameFr(e.target.value)} style={INPUT} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={LABEL}>{t('Type', 'Type')}</label>
                        <select value={newOrgType} onChange={e => setNewOrgType(e.target.value)} style={{ ...INPUT, appearance: 'none' }}>
                          {['intergovernmental','sports','economic','military','other'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div><label style={LABEL}>{t('Founded year', 'Année fondation')}</label><input type="number" value={newFounded} onChange={e => setNewFounded(e.target.value)} placeholder="1945" style={INPUT} /></div>
                    </div>
                    <div><label style={LABEL}>{t('Slug', 'Slug')} *</label><input value={newIso} onChange={e => setNewIso(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="united-nations" style={INPUT} /></div>
                    <div><label style={LABEL}>{t('Website', 'Site web')}</label><input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="https://…" style={INPUT} /></div>
                  </div>
                )}
              </>)}

              {/* ── HISTORIC ── */}
              {flagType === 'historic' && (<>
                <div>
                  <label style={LABEL}>{t('Country this flag belongs to', 'Pays auquel appartient ce drapeau')} *</label>
                  <CountryPicker value={countryCode} onChange={setCountryCode}
                    countries={countries} locale={locale}
                    placeholder={t('Select country…', 'Sélectionner un pays…')} />
                </div>
                {countryCode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={LABEL}>{t('Valid from', 'Valide depuis')} *</label><input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} style={INPUT} /></div>
                    <div><label style={LABEL}>{t('Valid until', "Valide jusqu'au")}</label><input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} style={INPUT} /></div>
                  </div>
                )}
              </>)}
            </div>
          )}

          {/* STEP 2 — Details */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LABEL}>{t('Name EN', 'Nom EN')} *</label><input value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="Flag of France" style={INPUT} /></div>
                <div><label style={LABEL}>{t('Name FR', 'Nom FR')}</label><input value={labelFr} onChange={e => setLabelFr(e.target.value)} placeholder="Drapeau de la France" style={INPUT} /></div>
              </div>
              <div>
                <label style={LABEL}>{t('Description', 'Description')}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder={t('History and symbolism…', 'Histoire et symbolisme…')} style={{ ...INPUT, resize: 'vertical' }} />
              </div>
              <div>
                <label style={LABEL}>{t('Source URL', 'URL source')}</label>
                <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://wikipedia.org/…" style={INPUT} />
              </div>
              <div>
                <label style={LABEL}>{t('Fun facts', 'Anecdotes')}</label>
                {facts.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input value={f} onChange={e => setFacts(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                      placeholder={t(`Fact ${i+1}…`, `Anecdote ${i+1}…`)} style={{ ...INPUT, flex: 1 }} />
                    {facts.length > 1 && (
                      <button onClick={() => setFacts(prev => prev.filter((_, j) => j !== i))}
                        style={{ padding: '0 10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', color: C.muted }}>✕</button>
                    )}
                  </div>
                ))}
                {facts.length < 5 && (
                  <button onClick={() => setFacts(p => [...p, ''])}
                    style={{ fontSize: '12px', color: C.navy, background: 'none', border: `1px dashed ${C.border}`, borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', width: '100%', fontWeight: '600' }}>
                    + {t('Add a fact', 'Ajouter une anecdote')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — File */}
          {step === 3 && (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: C.muted }}>{t('Upload the flag image. SVG preferred.', 'Téléchargez l\'image. SVG préféré.')}</p>
              <input ref={fileRef} type="file" accept=".svg,.png" style={{ display: 'none' }} onChange={handleFile} />
              {!file ? (
                <button onClick={() => fileRef.current?.click()}
                  style={{ width: '100%', padding: '40px 20px', border: `2px dashed ${C.border}`, borderRadius: '14px', backgroundColor: C.bg, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: C.navy, marginBottom: '4px' }}>{t('Click to upload', 'Cliquer pour uploader')}</div>
                  <div style={{ fontSize: '12px', color: C.muted }}>SVG ou PNG · max 5MB</div>
                </button>
              ) : (
                <div style={{ border: '2px solid #16a34a', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#f0fdf4' }}>
                  {filePreview && (
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: 'white' }}>
                      <img src={filePreview} alt="preview" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    </div>
                  )}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>✅</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy }}>{file.name}</div>
                      <div style={{ fontSize: '11px', color: C.muted }}>{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button onClick={() => { setFile(null); setFilePreview(null) }}
                      style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: C.muted }}>
                      {t('Change', 'Changer')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: C.muted }}>{t('Review before submitting.', 'Vérifiez avant d\'envoyer.')}</p>
              {[
                [t('Type', 'Type'),        FLAG_TYPES.find(f => f.key === flagType)?.[locale === 'fr' ? 'fr' : 'en']],
                [t('Subtype', 'Sous-type'), isNewEntity ? t('New entity', 'Nouvelle entité') : (subtype || '—')],
                [t('Entity', 'Entité'),    isNewEntity ? `${newNameEn} (${newIso})` : entitySlug],
                [t('Country', 'Pays'),     flagType !== 'country' ? (countries.find(c => c.iso_code === countryCode)?.[locale === 'fr' ? 'name_fr' : 'name_en'] || countryCode) : null],
                [t('Region', 'Région'),    flagType === 'city' ? (regions.find(r => r.slug === regionSlug)?.[locale === 'fr' ? 'name_fr' : 'name_en'] || regionSlug) : null],
                ['Name EN',               labelEn],
                [t('File', 'Fichier'),    file?.name],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '12px', padding: '9px 12px', backgroundColor: C.bg, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, minWidth: '70px' }}>{label}</span>
                  <span style={{ fontSize: '12px', color: C.navy, fontWeight: '600' }}>{value}</span>
                </div>
              ))}
              {filePreview && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', marginTop: '4px' }}>
                  <img src={filePreview} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', backgroundColor: 'white', padding: '10px' }} />
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ margin: '12px 0', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', fontSize: '13px', color: C.red }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
            style={{ padding: '10px 18px', backgroundColor: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            {step === 0 ? t('Cancel', 'Annuler') : t('← Back', '← Retour')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: C.muted }}>{t(`Step ${step + 1} of ${STEPS.length}`, `Étape ${step + 1} sur ${STEPS.length}`)}</span>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                style={{ padding: '10px 22px', backgroundColor: canProceed() ? C.navy : C.border, color: canProceed() ? 'white' : C.muted, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                {t('Next →', 'Suivant →')}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '10px 22px', backgroundColor: C.green, color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? t('Submitting…', 'Envoi…') : t('Submit 🏳️', 'Soumettre 🏳️')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const CLOSE_BTN = {
  position: 'absolute', top: '16px', right: '16px',
  width: '32px', height: '32px', borderRadius: '50%',
  backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
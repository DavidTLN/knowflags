'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useLocale } from 'next-intl'

// ── Image resolution ──────────────────────────────────────────
// Priority: 1) image_url from DB  2) /flags/history/{iso}-{year}.{ext}  3) placeholder
const EXTENSIONS = ['png', 'svg', 'jpg', 'jpeg', 'webp']

function getLocalPath(isoCode, dateStart) {
  if (!isoCode || !dateStart) return null
  const year = new Date(dateStart).getFullYear()
  return `/flags/history/${isoCode}-${year}`
}

function FlagImage({ imageUrl, isoCode, dateStart, alt, style }) {
  const localBase = getLocalPath(isoCode, dateStart)
  const [src, setSrc] = useState(imageUrl || (localBase ? `${localBase}.png` : null))
  const [extIndex, setExtIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setSrc(imageUrl || (localBase ? `${localBase}.png` : null))
    setExtIndex(0)
    setFailed(false)
  }, [imageUrl, isoCode, dateStart])

  function handleError() {
    // If we were trying image_url, fall back to local
    if (src === imageUrl && localBase) {
      setSrc(`${localBase}.png`)
      setExtIndex(0)
      return
    }
    // Try next extension for local path
    const nextIndex = extIndex + 1
    if (localBase && nextIndex < EXTENSIONS.length) {
      setExtIndex(nextIndex)
      setSrc(`${localBase}.${EXTENSIONS[nextIndex]}`)
    } else {
      setFailed(true)
    }
  }

  if (failed || !src) {
    return (
      <div style={{
        ...style,
        backgroundColor: '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', color: '#94a3b8', fontWeight: '600',
        textAlign: 'center', padding: '4px',
      }}>
        {dateStart ? new Date(dateStart).getFullYear() : '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={handleError}
    />
  )
}

// ── Main component ────────────────────────────────────────────
export default function FlagHistoryModule({ countryCode, countryName }) {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [flags, setFlags]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!countryCode) return
    const supabase = createClient()
    supabase
      .from('country_flag_history')
      .select('*')
      .eq('iso_code', countryCode.toLowerCase())
      .order('date_start', { ascending: true, nullsFirst: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setFlags(data)
          const current = data.find(f => !f.date_end) ?? data[data.length - 1]
          setSelected(current)
        }
        setLoading(false)
      })
  }, [countryCode])

  if (loading) return (
    <section style={{ marginTop: '48px' }}>
      <div style={{ height: '200px', backgroundColor: '#f0ede4', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </section>
  )

  if (flags.length === 0) return null

  const label = (flag) => flag ? (locale === 'fr' ? flag.label_fr : flag.label_en) : ''

  return (
    <section style={{ marginTop: '48px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
        {t('Flag Evolution', 'Évolution du drapeau')}
      </h2>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Selected flag preview */}
        {selected && (
          <div style={{
            flex: '0 0 auto', width: 'min(280px, 100%)',
            backgroundColor: 'white', borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ backgroundColor: '#f8f5ed', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}>
              <FlagImage
                imageUrl={selected.image_url}
                isoCode={countryCode}
                dateStart={selected.date_start}
                alt={label(selected)}
                style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
              />
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0B1F3B', marginBottom: '4px' }}>
                {label(selected)}
                {!selected.date_end && (
                  <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: '99px' }}>
                    {t('Current', 'Actuel')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {formatDateRange(selected.date_start, selected.date_end, locale)}
              </div>
              {(selected.notes_en || selected.notes_fr) && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                  {locale === 'fr' ? selected.notes_fr : selected.notes_en}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '20px', top: '24px',
              bottom: '24px', width: '2px',
              backgroundColor: '#e2e8f0',
              zIndex: 0,
            }} />
            {flags.map((flag, i) => {
              const isSelected = selected?.id === flag.id
              const isCurrent  = !flag.date_end
              const lbl        = label(flag)
              return (
                <div key={flag.id} onClick={() => setSelected(flag)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: i < flags.length - 1 ? '16px' : '0', cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '42px', height: '42px', flexShrink: 0, borderRadius: '50%',
                    border: `3px solid ${isSelected ? '#0B1F3B' : isCurrent ? '#22c55e' : '#e2e8f0'}`,
                    backgroundColor: isSelected ? '#0B1F3B' : isCurrent ? '#dcfce7' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 0 0 4px rgba(11,31,59,0.12)' : 'none',
                  }}>
                    <FlagImage
                      imageUrl={flag.image_url}
                      isoCode={countryCode}
                      dateStart={flag.date_start}
                      alt={lbl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{
                    flex: 1, backgroundColor: isSelected ? '#f8f5ed' : 'white',
                    borderRadius: '12px', padding: '10px 14px',
                    border: `1.5px solid ${isSelected ? '#0B1F3B' : '#e2e8f0'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{lbl}</span>
                      {isCurrent && (
                        <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '99px' }}>
                          {t('Current', 'Actuel')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {formatDateRange(flag.date_start, flag.date_end, locale)}
                    </div>
                    {flag.date_start && flag.date_end && (
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '1px' }}>
                        {getDuration(flag.date_start, flag.date_end, locale)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function formatDateRange(start, end, locale) {
  const t = (en, fr) => locale === 'fr' ? fr : en
  const fmt = (d) => d ? new Date(d).getFullYear() : null
  const s = fmt(start), e = fmt(end)
  if (!s && !e) return t('Date unknown', 'Date inconnue')
  if (!s) return `? – ${e}`
  if (!e) return `${s} – ${t('present', "aujourd'hui")}`
  return `${s} – ${e}`
}

function getDuration(start, end, locale) {
  if (!start || !end) return null
  const years = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 365.25))
  if (years < 1) return locale === 'fr' ? "Moins d'un an" : 'Less than a year'
  return `${years} ${years === 1 ? (locale === 'fr' ? 'an' : 'year') : (locale === 'fr' ? 'ans' : 'years')}`
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

// ── DS Tokens ─────────────────────────────────────────────────────────────────
const DS = {
  navy:    '#0B1F3B',
  navyL:   '#1A3A6B',
  bg:      '#FFFFFF',
  bgAlt:   '#FAFAF7',
  border:  '#E2DDD5',
  muted:   '#8A8278',
  gold:    '#F4B400',
  green:   '#16A34A',
}

// Fallback if the DB fetch fails — South Africa (striking flag)
const FALLBACK = { code: 'za', name_en: 'South Africa', name_fr: 'Afrique du Sud' }

// Deterministic daily pick: stable shuffle (seeded) + index by day → no repeat
// until every flag has been shown once, same flag for everyone on a given day.
function seededShuffle(arr, seed) {
  let a = seed >>> 0
  const rng = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pickDailyFlag(countries) {
  if (!countries || countries.length === 0) return FALLBACK
  const sorted = [...countries].sort((x, y) => x.code.localeCompare(y.code))
  const shuffled = seededShuffle(sorted, 0x4B6E0F)   // constant seed → fixed order
  const dayIndex = Math.floor(Date.now() / 86400000)
  return shuffled[dayIndex % shuffled.length]
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ isMobile }) {
  return (
    <div style={{
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '24px' : '56px', alignItems: isMobile ? 'stretch' : 'center',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : 'min(440px, 48%)', aspectRatio: '3/2', backgroundColor: DS.border, borderRadius: '16px', opacity: 0.5 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '120px', height: '10px', backgroundColor: DS.border, borderRadius: '99px' }} />
        <div style={{ width: '75%', height: '36px', backgroundColor: DS.border, borderRadius: '8px' }} />
        <div style={{ width: '55%', height: '36px', backgroundColor: DS.border, borderRadius: '8px' }} />
        <div style={{ width: '90%', height: '14px', backgroundColor: DS.border, borderRadius: '6px' }} />
        <div style={{ width: '140px', height: '46px', backgroundColor: DS.border, borderRadius: '12px', marginTop: '6px' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}

// Highlighted country name — gold marker, stands out from the navy title
function FlagName({ children }) {
  return (
    <span style={{
      color: DS.navy,
      backgroundColor: 'rgba(244,180,0,0.30)',
      padding: '0 10px', borderRadius: '8px',
      boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

// ── Main Hero component ───────────────────────────────────────────────────────
export default function Hero() {
  const locale = useLocale()
  const isFr   = locale === 'fr'

  const [flag,     setFlag]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [imgHover, setImgHover] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = await createClient()
        const { data } = await supabase.from('countries').select('iso_code, name_en, name_fr')
        if (cancelled) return
        const list = (data || []).map(c => ({ code: c.iso_code, name_en: c.name_en, name_fr: c.name_fr }))
        setFlag(pickDailyFlag(list))
      } catch {
        if (!cancelled) setFlag(FALLBACK)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const name       = flag ? (isFr ? (flag.name_fr || flag.name_en) : flag.name_en) : ''
  const detailLink = flag ? `/${locale}/countries/${flag.code}` : `/${locale}/countries`
  const imageUrl   = flag ? `https://flagcdn.com/w640/${flag.code}.png` : null

  return (
    <section style={{ backgroundColor: DS.bg, padding: isMobile ? '28px 16px 16px' : '48px 24px 32px' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        {loading ? (
          <Skeleton isMobile={isMobile} />
        ) : (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '24px' : '56px', alignItems: isMobile ? 'stretch' : 'center' }}>

            {/* ── Flag image → flag detail page ── */}
            <Link href={detailLink} style={{ textDecoration: 'none', flex: '0 0 auto', width: isMobile ? '100%' : 'min(460px, 50%)' }}>
              <div
                onMouseEnter={() => setImgHover(true)}
                onMouseLeave={() => setImgHover(false)}
                style={{
                  borderRadius: '16px', overflow: 'hidden',
                  boxShadow: imgHover ? '0 16px 48px rgba(11,31,59,0.22)' : '0 8px 32px rgba(11,31,59,0.14)',
                  border: `1px solid ${DS.border}`, backgroundColor: DS.bgAlt,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  transform: imgHover ? 'translateY(-4px)' : 'translateY(0)',
                }}>
                <img src={imageUrl} alt={name} style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', display: 'block' }} />
              </div>
            </Link>

            {/* ── Text content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Overline — Daily Featured Flag */}
              <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '800', color: DS.green, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: DS.green, borderRadius: '2px' }} />
                {isFr ? 'Drapeau du jour' : 'Daily Featured Flag'}
              </p>

              {/* Title — Discover {Country} flag, name highlighted */}
              <h1 style={{ margin: '0 0 16px', fontSize: isMobile ? '28px' : '42px', fontWeight: '900', color: DS.navy, letterSpacing: '-0.03em', lineHeight: 1.25, fontFamily: 'var(--font-display, system-ui)' }}>
                {isFr
                  ? <>Découvrez le drapeau <FlagName>{name}</FlagName></>
                  : <>Discover <FlagName>{name}</FlagName>{"'s flag"}</>}
              </h1>

              {/* Description */}
              <p style={{ margin: '0 0 28px', fontSize: isMobile ? '15px' : '16px', color: DS.muted, lineHeight: 1.65, maxWidth: '480px' }}>
                {isFr
                  ? 'Un nouveau drapeau chaque jour — découvrez son histoire, son symbolisme et ses récits.'
                  : 'A new flag every day — explore its history, symbolism and the stories behind it.'}
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href={detailLink}
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 22px', backgroundColor: btnHover ? DS.navyL : DS.navy, color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', transition: 'background-color 0.15s', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                  {isFr ? 'Explorer ce drapeau' : 'Explore this flag'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>

                <Link href={`/${locale}/countries`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: 'transparent', color: DS.navy, border: `1.5px solid ${DS.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', transition: 'border-color 0.15s', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = DS.navy}
                  onMouseLeave={e => e.currentTarget.style.borderColor = DS.border}
                >
                  {isFr ? 'Voir tous les drapeaux' : 'See all flags'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
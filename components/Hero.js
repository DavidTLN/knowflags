'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { createClient } from 'contentful'

// ── DS Tokens ─────────────────────────────────────────────────────────────────
const DS = {
  navy:    '#0B1F3B',
  navyL:   '#1A3A6B',
  bg:      '#FFFFFF',   // Page background — white
  bgAlt:   '#FAFAF7',
  surface: '#F4F1E6',   // Card/bloc — beige
  surfaceAlt: '#FAFAF7', // Inputs — near white
  border:  '#E2DDD5',
  muted:   '#8A8278',
  light:   '#A89F8E',
  steel:   '#9EB7E5',
  gold:    '#FEB12F',
  green:   '#16A34A',
}

// ── Fallback data shown if Contentful is missing/empty ────────────────────────
const FALLBACK = {
  tag:         { en: 'Featured Flag',  fr: 'Drapeau à la une'       },
  title:       { en: 'Discover the World Through Flags', fr: 'Découvrez le monde à travers les drapeaux' },
  description: { en: 'Explore the history, symbolism and stories behind every flag on Earth.', fr: 'Explorez l\'histoire, le symbolisme et les récits derrière chaque drapeau du monde.' },
  buttonText:  { en: 'Explore Flags',  fr: 'Explorer les drapeaux'  },
  buttonLink:  '/countries',
  imageCode:   'za',   // South Africa — striking flag, great default
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '24px' : '56px',
      alignItems: isMobile ? 'stretch' : 'center',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : 'min(440px, 48%)', aspectRatio: '3/2', backgroundColor: DS.border, borderRadius: '16px', opacity: 0.5 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '90px', height: '10px', backgroundColor: DS.border, borderRadius: '99px' }} />
        <div style={{ width: '75%', height: '36px', backgroundColor: DS.border, borderRadius: '8px' }} />
        <div style={{ width: '55%', height: '36px', backgroundColor: DS.border, borderRadius: '8px' }} />
        <div style={{ width: '90%', height: '14px', backgroundColor: DS.border, borderRadius: '6px' }} />
        <div style={{ width: '60%', height: '14px', backgroundColor: DS.border, borderRadius: '6px' }} />
        <div style={{ width: '140px', height: '46px', backgroundColor: DS.border, borderRadius: '12px', marginTop: '6px' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}

// ── Main Hero component ───────────────────────────────────────────────────────
export default function Hero() {
  const locale   = useLocale()
  const isFr     = locale === 'fr'
  const t        = (obj) => isFr ? obj.fr : obj.en

  const [data,     setData]     = useState(null)
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
    const space       = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID
    const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN

    // No Contentful config → use fallback immediately (no loading flash)
    if (!space || !accessToken) {
      setData(null)
      setLoading(false)
      return
    }

    const client = createClient({ space, accessToken })

    client
      .getEntries({ content_type: 'featuredFlag', limit: 1 })
      .then(res => {
        if (res.items.length > 0) {
          const f = res.items[0].fields
          const get = (field) => {
            if (!field) return ''
            if (typeof field === 'object' && (field['en-US'] !== undefined || field['fr'] !== undefined)) {
              return isFr ? (field['fr'] || field['en-US'] || '') : (field['en-US'] || '')
            }
            if (typeof field === 'string') return field
            return ''
          }
          const parsed = {
            tag:         get(f.tag),
            title:       get(f.title),
            description: get(f.description),
            buttonText:  get(f.buttonText),
            buttonLink:  get(f.buttonLink) || `/${locale}/countries`,
            imageUrl:    f.image?.fields?.file?.url ? 'https:' + f.image.fields.file.url : null,
            imageAlt:    f.image?.fields?.title     || get(f.title) || '',
          }
          // Only use Contentful data if it has a title (sanity check)
          if (parsed.title) {
            setData(parsed)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isFr, locale])

  // Resolve display data — Contentful or fallback
  const display = data
    ? data
    : {
        tag:         t(FALLBACK.tag),
        title:       t(FALLBACK.title),
        description: t(FALLBACK.description),
        buttonText:  t(FALLBACK.buttonText),
        buttonLink:  `/${locale}${FALLBACK.buttonLink}`,
        imageUrl:    `https://flagcdn.com/w640/${FALLBACK.imageCode}.png`,
        imageAlt:    'Featured Flag',
      }

  return (
    <section style={{
      backgroundColor: DS.bg,
      padding: isMobile ? '28px 16px 16px' : '48px 24px 32px',
    }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

        {loading ? (
          <Skeleton isMobile={isMobile} />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '24px' : '56px',
            alignItems: isMobile ? 'stretch' : 'center',
          }}>

            {/* ── Flag image ── */}
            <Link href={display.buttonLink} style={{ textDecoration: 'none', flex: '0 0 auto', width: isMobile ? '100%' : 'min(460px, 50%)' }}>
              <div
                onMouseEnter={() => setImgHover(true)}
                onMouseLeave={() => setImgHover(false)}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: imgHover ? '0 16px 48px rgba(11,31,59,0.22)' : '0 8px 32px rgba(11,31,59,0.14)',
                  border: `1px solid ${DS.border}`,
                  backgroundColor: DS.bgAlt,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  transform: imgHover ? 'translateY(-4px)' : 'translateY(0)',
                }}>
                <img
                  src={display.imageUrl}
                  alt={display.imageAlt}
                  style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </Link>

            {/* ── Text content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Overline tag */}
              {display.tag && (
                <p style={{
                  margin: '0 0 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: DS.green,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: DS.green, borderRadius: '2px' }} />
                  {display.tag}
                </p>
              )}

              {/* Title */}
              <h1 style={{
                margin: '0 0 16px',
                fontSize: isMobile ? '28px' : '42px',
                fontWeight: '900',
                color: DS.navy,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                fontFamily: 'var(--font-display, system-ui)',
              }}>
                {display.title}
              </h1>

              {/* Description */}
              <p style={{
                margin: '0 0 28px',
                fontSize: isMobile ? '15px' : '16px',
                color: DS.muted,
                lineHeight: 1.65,
                maxWidth: '480px',
              }}>
                {display.description}
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href={display.buttonLink}
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '13px 22px',
                    backgroundColor: btnHover ? DS.navyL : DS.navy,
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
                  }}>
                  {display.buttonText || t({ en: 'Explore', fr: 'Explorer' })}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>

                {!isMobile && (
                  <Link href={`/${locale}/countries`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '12px 20px',
                      backgroundColor: 'transparent', color: DS.navy,
                      border: `1.5px solid ${DS.border}`, borderRadius: '10px',
                      fontSize: '14px', fontWeight: '600',
                      textDecoration: 'none', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = DS.navy}
                    onMouseLeave={e => e.currentTarget.style.borderColor = DS.border}
                  >
                    {isFr ? 'Tous les pays' : 'All countries'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
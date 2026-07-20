'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

const C = {
  navy: '#16324F', muted: '#6B7280', text: '#0F1923',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  surface: '#FFFFFF', secondary: '#EEF2F7', bgAlt: '#FAFAF7',
}

function SearchIcon({ size = 18, color = C.muted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function DocIcon({ size = 16, color = C.navy }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  )
}

export default function GlobalSearch() {
  const locale = useLocale()
  const router = useRouter()
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  const [q, setQ]           = useState('')
  const [res, setRes]       = useState({ countries: [], posts: [] })
  const [open, setOpen]     = useState(false)
  const [loading, setLoad]  = useState(false)
  const [active, setActive] = useState(-1)
  const [isMobile, setMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const boxRef   = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  // Responsive flag
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setMobile(mq.matches)
    on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Flattened items for keyboard navigation
  const items = [
    ...res.countries.map(c => ({ kind: 'country', href: `/${locale}/countries/${c.iso}`, data: c })),
    ...res.posts.map(p => ({ kind: 'post', href: `/${locale}/blog/${p.slug}`, data: p })),
  ]

  // Debounced fetch
  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) { setRes({ countries: [], posts: [] }); setLoad(false); return }
    setLoad(true)
    const id = setTimeout(async () => {
      try {
        abortRef.current?.abort()
        const ctrl = new AbortController(); abortRef.current = ctrl
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`, { signal: ctrl.signal })
        const data = await r.json()
        setRes({ countries: data.countries || [], posts: data.posts || [] })
        setActive(-1)
      } catch (e) { if (e.name !== 'AbortError') setRes({ countries: [], posts: [] }) }
      finally { setLoad(false) }
    }, 250)
    return () => clearTimeout(id)
  }, [q, locale])

  // Close on outside click (desktop)
  useEffect(() => {
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const reset = useCallback(() => {
    setQ(''); setRes({ countries: [], posts: [] }); setOpen(false); setMobileOpen(false); setActive(-1)
  }, [])

  const go = useCallback((href) => { router.push(href); reset() }, [router, reset])

  function onKeyDown(e) {
    if (!items.length && e.key !== 'Escape') return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { if (active >= 0 && items[active]) go(items[active].href) }
    else if (e.key === 'Escape') { reset(); inputRef.current?.blur() }
  }

  const showPanel = (isMobile ? mobileOpen : open) && q.trim().length >= 2

  // ── Result rows ──────────────────────────────────────────────────────────
  const CatLabel = ({ children }) => (
    <div style={{ padding: '10px 14px 4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{children}</div>
  )
  const Chip = ({ children }) => (
    <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.navy, backgroundColor: C.secondary, padding: '2px 8px', borderRadius: '9999px' }}>{children}</span>
  )
  const Row = ({ item, idx }) => {
    const isActive = idx === active
    const base = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 14px', cursor: 'pointer', border: 'none', textAlign: 'left', backgroundColor: isActive ? C.secondary : 'transparent', transition: 'background-color 0.1s' }
    if (item.kind === 'country') {
      const c = item.data
      return (
        <button style={base} onMouseEnter={() => setActive(idx)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(item.href)}>
          <img src={`https://flagcdn.com/${c.iso}.svg`} alt="" width={28} height={20}
               style={{ borderRadius: '3px', border: `1px solid ${C.border}`, objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
          <Chip>{t('Country', 'Pays')}</Chip>
        </button>
      )
    }
    const p = item.data
    return (
      <button style={base} onMouseEnter={() => setActive(idx)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(item.href)}>
        <span style={{ width: 28, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DocIcon /></span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
        <Chip>{t('Article', 'Article')}</Chip>
      </button>
    )
  }

  const Panel = () => (
    <div style={{
      backgroundColor: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: isMobile ? '0 0 16px 16px' : '12px',
      boxShadow: '0 8px 32px rgba(22,50,79,0.12)',
      overflow: 'hidden', maxHeight: '70vh', overflowY: 'auto',
    }}>
      {loading && !items.length && (
        <div style={{ padding: '16px 14px', fontSize: '13px', color: C.muted }}>{t('Searching…', 'Recherche…')}</div>
      )}
      {!loading && !items.length && (
        <div style={{ padding: '16px 14px', fontSize: '13px', color: C.muted }}>
          {t('No results for', 'Aucun résultat pour')} “{q.trim()}”
        </div>
      )}
      {res.countries.length > 0 && (
        <>
          <CatLabel>{t('Countries', 'Pays')}</CatLabel>
          {res.countries.map((c, i) => <Row key={`c-${c.iso}`} item={items[i]} idx={i} />)}
        </>
      )}
      {res.posts.length > 0 && (
        <>
          <CatLabel>{t('Blog', 'Blog')}</CatLabel>
          {res.posts.map((p, i) => {
            const idx = res.countries.length + i
            return <Row key={`p-${p.slug}`} item={items[idx]} idx={idx} />
          })}
        </>
      )}
    </div>
  )

  // ── Mobile: icon button → top overlay ──────────────────────────────────────
  // IMPORTANT iOS : l'input reste MONTÉ en permanence (juste caché quand fermé)
  // et le focus() est appelé de manière STRICTEMENT SYNCHRONE dans le geste tap,
  // sans setTimeout, pour que iOS Safari lève le clavier natif au premier tap.
  if (isMobile) {
    const openMobile = () => {
      // Focus AVANT le setState, dans le même tick que le tap utilisateur.
      // iOS n'ouvre le clavier que si focus() est appelé de façon synchrone
      // depuis un vrai geste utilisateur — pas depuis un useEffect ou un setTimeout.
      inputRef.current?.focus()
      setMobileOpen(true)
    }

    return (
      <>
        <button
          aria-label={t('Search', 'Rechercher')}
          onMouseDown={(e) => e.preventDefault()}  // évite que le bouton "vole" le focus au geste
          onClick={openMobile}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
          <SearchIcon size={20} color="#FFFFFF" />
        </button>

        {/* Overlay + input toujours montés dans le DOM, visibilité contrôlée par mobileOpen */}
        <div
          onClick={reset}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15,25,35,0.35)', zIndex: 1200,
            opacity: mobileOpen ? 1 : 0,
            visibility: mobileOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.18s ease',
            pointerEvents: mobileOpen ? 'auto' : 'none',
          }}
        />
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300,
            backgroundColor: C.navy, padding: '10px 12px',
            transform: mobileOpen ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.2s ease',
            pointerEvents: mobileOpen ? 'auto' : 'none',
          }}
          aria-hidden={!mobileOpen}
        >
          <div ref={boxRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: C.surface, borderRadius: '10px', padding: '0 12px' }}>
              <SearchIcon />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                // tabIndex négatif quand fermé pour ne pas être atteignable au clavier
                tabIndex={mobileOpen ? 0 : -1}
                placeholder={t('Search a country or article…', 'Rechercher un pays ou un article…')}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: '16px', color: C.text, backgroundColor: 'transparent' }}
              />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={reset}
                style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                {t('Cancel', 'Annuler')}
              </button>
            </div>
            {showPanel && <div style={{ marginTop: '8px' }}><Panel /></div>}
          </div>
        </div>
      </>
    )
  }

  // ── Desktop: inline input + dropdown ──────────────────────────────────────
  return (
    <div ref={boxRef} className="global-search" style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', width: '220px',
        backgroundColor: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', padding: '0 12px',
        transition: 'background-color 0.12s',
      }}>
        <SearchIcon color="rgba(255,255,255,0.7)" size={16} />
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('Search…', 'Rechercher…')}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 0', fontSize: '13px', color: '#FFFFFF', backgroundColor: 'transparent' }}
        />
      </div>
      {showPanel && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '360px', zIndex: 1100 }}>
          <Panel />
        </div>
      )}
      <style jsx>{`
        .global-search input::placeholder { color: rgba(255,255,255,0.6); }
      `}</style>
    </div>
  )
}
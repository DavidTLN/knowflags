'use client'

// « Où se trouve X ? » — carte de localisation de la page pays.
//
// - Formes des pays (world-atlas 50m, déjà utilisé par True Size), sans tuiles : terres beige,
//   mers bleu pâle, le pays en navy avec sa carte-drapeau épinglée dessus.
// - Vue initiale cadrée sur le pays (sa plus grande partie : France métropolitaine, USA contigus…),
//   bouton « recentrer » pour y revenir. Zoom +/− et plein écran.
// - Clic sur un autre pays : aperçu (drapeau, capitale, « Voir la page »).
// - Voisins (CIA World Factbook) : liste à droite sur desktop, puces sous la carte sur mobile.
// - Mobile : la carte ne capture pas le défilement de la page ; on la déplace avec deux doigts.
// - La carte (Leaflet + formes, ~700 ko) ne se charge que lorsque le bloc approche de l'écran.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

const C = {
  navy: '#16324F', sea: '#DCE8F2', land: '#F4F1E6', stroke: '#CFC6B8', gold: '#F4B400', goldLight: '#FEF3C7',
  border: '#E2DDD5', muted: '#6B7280', light: '#9CA3AF', surface: '#FFFFFF', bg: '#F4F1E6', secondary: '#EEF2F7',
}
const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'

// Chargements partagés entre les rendus (une seule fois par visite)
let worldPromise = null
let countriesPromise = null
function loadWorld() {
  if (!worldPromise) {
    worldPromise = Promise.all([fetch(WORLD_URL).then(r => r.json()), import('topojson-client')])
      .then(([world, topo]) => topo.feature(world, world.objects.countries).features)
      .catch(e => { worldPromise = null; throw e })
  }
  return worldPromise
}
function loadCountries() {
  if (!countriesPromise) {
    countriesPromise = createClient().from('countries')
      .select('iso_code, name_en, name_fr, capital, capital_fr, iso_numeric')
      .then(({ data }) => data || [])
      .catch(e => { countriesPromise = null; throw e })
  }
  return countriesPromise
}

const flagSrc = (iso, w = 80) => `https://flagcdn.com/w${w}/${iso}.png`
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
const fmtKm = (n, locale) => `${Math.round(Number(n)).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} km`

// Plus grande partie d'un pays (aire planaire en degrés, suffisant pour comparer)
function ringArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2) }
function mainPart(feature) {
  const g = feature.geometry
  if (!g) return null
  if (g.type === 'Polygon') return { type: 'Feature', geometry: g, properties: {} }
  let best = null, bestA = -1
  for (const p of g.coordinates) { const a = ringArea(p[0]); if (a > bestA) { bestA = a; best = p } }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: best }, properties: {} }
}

const Icon = {
  target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  expand: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>,
  shrink: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" /></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>,
}

export default function CountryLocationMap({ country, locale = 'en' }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)
  const name = locale === 'fr' ? country.fr : country.en
  const iso = (country.code || '').toLowerCase()
  const neighbours = useMemo(() => (Array.isArray(country.neighbours) ? country.neighbours : []), [country.neighbours])

  const wrapRef = useRef(null)
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const api = useRef({})            // fonctions exposées par l'effet Leaflet (select, reset)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [all, setAll] = useState(null)        // pays de la base (noms, capitales, codes)
  const [selected, setSelected] = useState(null)  // iso du pays sélectionné
  const [full, setFull] = useState(false)
  const [hint, setHint] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const on = () => setIsMobile(mq.matches)
    on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Chargement différé : la carte démarre quand le bloc arrive à 400 px de l'écran
  useEffect(() => {
    const el = wrapRef.current
    if (!el || visible) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  useEffect(() => { loadCountries().then(setAll).catch(() => setAll([])) }, [])

  const byIso = useMemo(() => Object.fromEntries((all || []).map(c => [c.iso_code, c])), [all])
  const label = (c) => c ? ((locale === 'fr' ? c.name_fr : c.name_en) || c.name_en) : ''
  const capitalOf = (c) => c ? ((locale === 'fr' ? c.capital_fr : c.capital) || c.capital || '') : ''

  // ── Leaflet ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !all || !mapEl.current || mapRef.current) return
    let cancelled = false
    Promise.all([import('leaflet'), loadWorld()]).then(([Lmod, features]) => {
      if (cancelled || !mapEl.current) return
      const L = Lmod.default || Lmod
      const numToIso = {}
      for (const c of all) if (c.iso_numeric) numToIso[c.iso_numeric] = c.iso_code
      const isoOf = (f) => numToIso[f.id] || (f.properties?.name === 'Kosovo' ? 'xk' : null)
      const target = features.find(f => (country.isoNumeric && f.id === country.isoNumeric) || isoOf(f) === iso)
      if (!target) { setFailed(true); return }
      const nbSet = new Set(neighbours.map(n => n.iso))
      const touch = window.matchMedia('(pointer: coarse)').matches

      const map = L.map(mapEl.current, {
        zoomControl: false, attributionControl: false, scrollWheelZoom: false, worldCopyJump: false,
        dragging: !touch, tap: false, minZoom: 2, maxZoom: 9, zoomSnap: 0.25,
        maxBounds: [[-85, -200], [85, 200]], maxBoundsViscosity: 0.8,
      })
      mapRef.current = map

      // Vue initiale : la plus grande partie du pays, avec de la marge ; minimum ~4° pour les micro-États
      const core = L.geoJSON(mainPart(target)).getBounds()
      const c0 = core.getCenter()
      const span = Math.max(core.getNorth() - core.getSouth(), (core.getEast() - core.getWest()) * 0.7, 4)
      const initial = L.latLngBounds(core.getSouthWest(), core.getNorthEast()).extend([[c0.lat - span / 2, c0.lng - span / 2], [c0.lat + span / 2, c0.lng + span / 2]]).pad(0.35)

      let sel = null
      const style = (f) => {
        const i = isoOf(f)
        if (f === target) return { fillColor: C.navy, fillOpacity: 1, color: '#FFFFFF', weight: 1.5 }
        if (i && i === sel) return { fillColor: C.goldLight, fillOpacity: 1, color: C.gold, weight: 2 }
        return { fillColor: C.land, fillOpacity: 1, color: C.stroke, weight: 0.8 }
      }
      const layer = L.geoJSON({ type: 'FeatureCollection', features }, {
        style,
        onEachFeature: (f, lyr) => {
          const i = isoOf(f)
          if (f === target) return
          lyr.on('mouseover', () => { if (i !== sel) lyr.setStyle({ fillColor: '#FBF6E6' }) })
          lyr.on('mouseout', () => layer.resetStyle(lyr))
          lyr.on('click', (e) => { if (i && byIsoRef.current[i]) select(i, e.latlng) })
        },
      }).addTo(map)

      // Noms des voisins (desktop ; sur mobile ils sont dans les puces sous la carte)
      const small = window.matchMedia('(max-width: 899px)').matches
      for (const f of (small ? [] : features)) {
        const i = isoOf(f)
        if (!i || !nbSet.has(i)) continue
        const part = mainPart(f)
        if (!part) continue
        L.tooltip({ permanent: true, direction: 'center', className: 'kf-map-label', interactive: false })
          .setLatLng(L.geoJSON(part).getBounds().getCenter()).setContent(esc(label(byIsoRef.current[i]) || f.properties.name)).addTo(map)
      }

      // Carte-drapeau du pays
      const flagHtml = `<div class="kf-flagpin"><img src="${esc(country.flag_url || flagSrc(iso, 160))}" alt="" /><span>${esc(name)}</span></div><i class="kf-flagpin-tip"></i>`
      // Épinglée sur le bord nord du pays : le drapeau ne cache pas la forme
      const pinAt = [core.getNorth() - (core.getNorth() - core.getSouth()) * 0.08, c0.lng]
      L.marker(pinAt, { icon: L.divIcon({ html: flagHtml, className: 'kf-flagpin-wrap' + (small ? ' kf-small' : ''), iconSize: small ? [68, 60] : [84, 74], iconAnchor: small ? [34, 60] : [42, 74] }), interactive: false, keyboard: false }).addTo(map)

      const popup = L.popup({ className: 'kf-map-popup', closeButton: false, autoPanPadding: [16, 16], offset: [0, -4], maxWidth: 260 })
      const centerOf = (i) => {
        const f = features.find(x => isoOf(x) === i)
        return f ? L.geoJSON(mainPart(f)).getBounds().getCenter() : null
      }
      let swapping = false   // ouvrir un nouvel aperçu ferme l'ancien : ne pas effacer la nouvelle sélection
      function select(i, at) {
        sel = i
        layer.setStyle(style)
        setSelected(i)
        if (!i) { map.closePopup(); return }
        const c = byIsoRef.current[i]
        const where = at || centerOf(i)
        if (isMobileRef.current) map.closePopup()
        else if (where && c) {
          const km = nbKm.current[i]
          popup.setLatLng(where).setContent(
            `<div class="kf-pop"><div class="kf-pop-top"><img src="${flagSrc(i)}" alt="" /><button type="button" class="kf-pop-x" aria-label="${esc(t('Close', 'Fermer'))}">×</button></div>` +
            `<strong>${esc(label(c))}</strong><span>${esc(capitalOf(c) ? t('Capital: ', 'Capitale : ') + capitalOf(c) : '')}${km ? ' · ' + esc(fmtKm(km, locale)) + ' ' + esc(t('shared border', 'de frontière commune')) : ''}</span>` +
            `<a href="/${locale}/countries/${esc(i)}">${esc(t('See page', 'Voir la page'))} →</a></div>`
          )
          swapping = true; popup.openOn(map); swapping = false
          popup.getElement()?.querySelector('.kf-pop-x')?.addEventListener('click', () => select(null))
        }
      }
      map.on('popupclose', () => { if (sel && !swapping) { sel = null; layer.setStyle(style); setSelected(null) } })

      api.current = {
        select,
        reset: () => { select(null); map.flyToBounds(initial, { duration: 0.6 }) },
        resize: () => map.invalidateSize(),
        zoom: (d) => map.setZoom(map.getZoom() + d),
      }
      map.fitBounds(initial)

      // Mobile : un doigt fait défiler la page, deux doigts déplacent la carte
      if (touch) {
        const el = mapEl.current
        let timer = null
        const start = (e) => {
          if (e.touches.length >= 2 || fullRef.current) { map.dragging.enable(); setHint(false) }
          else map.dragging.disable()
        }
        const move = (e) => {
          if (e.touches.length === 1 && !fullRef.current) { setHint(true); clearTimeout(timer); timer = setTimeout(() => setHint(false), 1400) }
        }
        el.addEventListener('touchstart', start, { passive: true })
        el.addEventListener('touchmove', move, { passive: true })
      }
      setReady(true)
    }).catch(() => setFailed(true))
    return () => { cancelled = true }
  }, [visible, all]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null }, [])

  // Valeurs lues par les gestionnaires Leaflet (créés une seule fois)
  const byIsoRef = useRef({}); byIsoRef.current = byIso
  const isMobileRef = useRef(false); isMobileRef.current = isMobile
  const fullRef = useRef(false); fullRef.current = full
  const nbKm = useRef({}); nbKm.current = Object.fromEntries(neighbours.map(n => [n.iso, n.km]))

  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : ''
    const id = setTimeout(() => api.current.resize?.(), 60)
    const onKey = (e) => { if (e.key === 'Escape') setFull(false) }
    if (full) window.addEventListener('keydown', onKey)
    return () => { clearTimeout(id); window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [full])

  if (failed) return null

  const nbRows = neighbours.map(n => ({ ...n, c: byIso[n.iso] })).filter(n => n.c)
  const sel = selected && byIso[selected]
  const selKm = selected ? (neighbours.find(n => n.iso === selected)?.km) : null
  const land = country.landBorderKm, coast = country.coastlineKm
  const stats = [
    land != null && { k: t('Land borders', 'Frontières terrestres'), v: Number(land) > 0 ? fmtKm(land, locale) : t('None', 'Aucune') },
    coast != null && { k: t('Coastline', 'Littoral'), v: Number(coast) > 0 ? fmtKm(coast, locale) : t('Landlocked', 'Enclavé') },
  ].filter(Boolean)

  const ctrlBtn = { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(22,50,79,0.12)', backgroundColor: C.surface, color: C.navy, cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,50,79,0.12)', fontSize: '20px', fontWeight: 600, padding: 0 }
  const mobileBtn = { ...ctrlBtn, width: '44px', height: '44px' }

  const mapBox = (
    <div style={full
      ? { position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: C.sea }
      : { position: 'relative', width: '100%', height: isMobile ? '300px' : '460px', backgroundColor: C.sea, borderRadius: isMobile ? 0 : '12px', overflow: 'hidden', flexShrink: 0 }}>
      <div ref={mapEl} style={{ position: 'absolute', inset: 0, backgroundColor: C.sea }} aria-label={t(`Map of ${name} and neighbouring countries`, `Carte de ${name} et des pays voisins`)} role="region" />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '13px' }}>
          {t('Loading map…', 'Chargement de la carte…')}
        </div>
      )}
      {ready && (
        <div style={{ position: 'absolute', right: '10px', top: full ? 'calc(10px + env(safe-area-inset-top))' : '10px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(22,50,79,0.12)', boxShadow: '0 2px 8px rgba(22,50,79,0.12)' }}>
              <button type="button" onClick={() => api.current.zoom?.(1)} aria-label={t('Zoom in', 'Zoom avant')} style={{ ...ctrlBtn, borderRadius: 0, border: 'none', borderBottom: `1px solid ${C.border}`, boxShadow: 'none' }}>+</button>
              <button type="button" onClick={() => api.current.zoom?.(-1)} aria-label={t('Zoom out', 'Zoom arrière')} style={{ ...ctrlBtn, borderRadius: 0, border: 'none', boxShadow: 'none' }}>−</button>
            </div>
          )}
          <button type="button" onClick={() => api.current.reset?.()} aria-label={t(`Back to ${name}`, `Recentrer sur ${name}`)} title={t(`Back to ${name}`, `Recentrer sur ${name}`)} style={isMobile ? mobileBtn : ctrlBtn}>{Icon.target}</button>
          <button type="button" onClick={() => setFull(v => !v)} aria-label={full ? t('Exit full screen', 'Quitter le plein écran') : t('Full screen', 'Plein écran')} style={isMobile ? mobileBtn : ctrlBtn}>{full ? Icon.shrink : Icon.expand}</button>
        </div>
      )}
      {ready && isMobile && !full && !sel && (
        <div style={{ position: 'absolute', left: '8px', bottom: '8px', zIndex: 500, padding: '7px 12px', borderRadius: '9999px', backgroundColor: hint ? 'rgba(15,25,35,0.85)' : 'rgba(15,25,35,0.6)', color: 'white', fontSize: '12px', fontWeight: 600, transition: 'background-color 0.2s', pointerEvents: 'none' }}>
          {t('Use two fingers to move the map', 'Utilisez deux doigts pour déplacer la carte')}
        </div>
      )}
      {ready && isMobile && sel && (
        <div style={{ position: 'absolute', left: '8px', right: '8px', bottom: 'calc(8px + env(safe-area-inset-bottom))', zIndex: 500, backgroundColor: C.surface, borderRadius: '12px', boxShadow: '0 8px 32px rgba(22,50,79,0.22)', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={flagSrc(selected)} alt="" style={{ width: '54px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${C.border}`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label(sel)}</span>
            <span style={{ fontSize: '12px', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{capitalOf(sel) && `${t('Capital: ', 'Capitale : ')}${capitalOf(sel)}`}{selKm ? ` · ${fmtKm(selKm, locale)}` : ''}</span>
          </div>
          <Link prefetch={false} href={`/${locale}/countries/${selected}`} style={{ minHeight: '40px', padding: '0 14px', borderRadius: '10px', backgroundColor: C.navy, color: 'white', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>{t('See page', 'Voir la page')}</Link>
          <button type="button" onClick={() => api.current.select?.(null)} aria-label={t('Close', 'Fermer')} style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>{Icon.close}</button>
        </div>
      )}
    </div>
  )

  const statTiles = stats.length > 0 && (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`, gap: '8px' }}>
      {stats.map(s => (
        <div key={s.k} style={{ backgroundColor: C.bg, borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.k}</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: C.navy }}>{s.v}</span>
        </div>
      ))}
    </div>
  )
  const overline = { margin: 0, fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const noNeighbours = (
    <p style={{ margin: 0, fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>
      {Number(land) === 0 ? t(`${name} has no land border.`, `${name} n’a aucune frontière terrestre.`) : t('No neighbouring country listed.', 'Aucun pays voisin répertorié.')}
    </p>
  )

  return (
    <section ref={wrapRef} style={{ backgroundColor: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px', overflow: 'hidden' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .kf-flagpin-wrap{background:none;border:none}
        .kf-flagpin{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 4px 5px;background:#fff;border-radius:8px;box-shadow:0 8px 24px rgba(22,50,79,.28);width:max-content;margin:0 auto}
        .kf-flagpin img{width:64px;height:43px;object-fit:cover;border-radius:4px;display:block}
        .kf-flagpin span{font:800 11px Inter,system-ui,sans-serif;color:${C.navy};max-width:96px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kf-small .kf-flagpin img{width:46px;height:31px}.kf-small .kf-flagpin span{font-size:10px}
        .leaflet-container .kf-small + .kf-map-label{font-size:11px}
        .kf-flagpin-tip{display:block;width:12px;height:12px;background:#fff;transform:rotate(45deg);margin:-7px auto 0}
        .leaflet-tooltip.kf-map-label{background:none;border:none;box-shadow:none;padding:0;font:600 12px Inter,system-ui,sans-serif;color:${C.muted};text-shadow:0 0 3px ${C.land},0 0 3px ${C.land}}
        .leaflet-tooltip.kf-map-label:before{display:none}
        .kf-map-popup .leaflet-popup-content-wrapper{border-radius:14px;box-shadow:0 16px 48px rgba(22,50,79,.22);padding:0;overflow:hidden;border-top:4px solid ${C.gold}}
        .kf-map-popup .leaflet-popup-content{margin:12px;width:216px!important}
        .kf-pop{display:flex;flex-direction:column;gap:6px;font-family:Inter,system-ui,sans-serif}
        .kf-pop-top{display:flex;justify-content:space-between;align-items:flex-start}
        .kf-pop img{width:66px;height:44px;object-fit:cover;border-radius:5px;border:1px solid ${C.border}}
        .kf-pop-x{width:30px;height:30px;border:none;border-radius:9999px;background:${C.secondary};color:${C.navy};font-size:18px;line-height:1;cursor:pointer}
        .kf-pop strong{font-size:15px;color:${C.navy}}
        .kf-pop span{font-size:12px;color:${C.muted};line-height:1.4}
        .kf-pop a{margin-top:4px;min-height:38px;border-radius:10px;background:${C.navy};color:#fff!important;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center}
        .leaflet-container{font-family:Inter,system-ui,sans-serif;background:${C.sea}}
        .kf-nb-row:hover{border-color:${C.gold}!important}
        .kf-nb-chips{scrollbar-width:none}.kf-nb-chips::-webkit-scrollbar{display:none}
      `}</style>

      <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: 900, color: C.navy, letterSpacing: '-0.2px' }}>
        {t(`Where is ${name}?`, `Où se trouve ${name} ?`)}
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: '13px', fontStyle: 'italic', color: C.muted, lineHeight: 1.5 }}>
        {t('Location, neighbouring countries and borders.', 'Situation, pays voisins et frontières.')}
      </p>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ margin: '0 -20px' }}>{mapBox}</div>
          {statTiles}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={overline}>{t('Neighbours', 'Pays voisins')} · {nbRows.length}</p>
            {nbRows.length === 0 ? noNeighbours : (
              <div className="kf-nb-chips" style={{ display: 'flex', gap: '8px', overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
                {nbRows.map(n => {
                  const on = n.iso === selected
                  return (
                    <button key={n.iso} type="button" onClick={() => api.current.select?.(on ? null : n.iso)}
                      style={{ flexShrink: 0, minHeight: '44px', padding: '0 12px 0 8px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: on ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: on ? C.navy : C.surface, color: on ? 'white' : C.navy, transition: 'all 0.15s' }}>
                      <img src={flagSrc(n.iso, 40)} alt="" style={{ width: '27px', height: '18px', objectFit: 'cover', borderRadius: '3px', border: `1px solid ${C.border}` }} />
                      {label(n.c)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>{mapBox}</div>
          <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '460px' }}>
            {statTiles}
            <p style={overline}>{t('Neighbours', 'Pays voisins')} · {nbRows.length}</p>
            {nbRows.length === 0 ? noNeighbours : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', minHeight: 0 }}>
                {nbRows.map(n => {
                  const on = n.iso === selected
                  return (
                    <div key={n.iso} className="kf-nb-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '10px', border: on ? `2px solid ${C.gold}` : `1px solid ${C.border}`, backgroundColor: on ? C.goldLight : C.surface, transition: 'all 0.15s' }}>
                      <button type="button" onClick={() => api.current.select?.(on ? null : n.iso)} aria-pressed={on}
                        style={{ flex: 1, minWidth: 0, minHeight: '40px', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                        <img src={flagSrc(n.iso, 80)} alt="" style={{ width: '40px', height: '27px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${C.border}`, flexShrink: 0 }} />
                        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label(n.c)}</span>
                          <span style={{ fontSize: '11px', color: C.muted }}>{n.km ? fmtKm(n.km, locale) : capitalOf(n.c)}</span>
                        </span>
                      </button>
                      <Link prefetch={false} href={`/${locale}/countries/${n.iso}`} aria-label={t(`See ${label(n.c)} page`, `Voir la page ${label(n.c)}`)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}>{Icon.chevron}</Link>
                    </div>
                  )
                })}
              </div>
            )}
            <p style={{ margin: 'auto 0 0', fontSize: '11px', color: C.light }}>{t('Borders and coastline: CIA World Factbook.', 'Frontières et littoral : CIA World Factbook.')}</p>
          </div>
        </div>
      )}
    </section>
  )
}

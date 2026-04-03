'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

// ── Country metadata ──────────────────────────────────────────────────────────
const COUNTRIES = [
  { id: 4,   code: 'af', en: 'Afghanistan',       fr: 'Afghanistan',        area: 652230    },
  { id: 8,   code: 'al', en: 'Albania',            fr: 'Albanie',            area: 28748     },
  { id: 12,  code: 'dz', en: 'Algeria',            fr: 'Algérie',            area: 2381741   },
  { id: 24,  code: 'ao', en: 'Angola',             fr: 'Angola',             area: 1246700   },
  { id: 32,  code: 'ar', en: 'Argentina',          fr: 'Argentine',          area: 2780400   },
  { id: 36,  code: 'au', en: 'Australia',          fr: 'Australie',          area: 7692024   },
  { id: 40,  code: 'at', en: 'Austria',            fr: 'Autriche',           area: 83871     },
  { id: 50,  code: 'bd', en: 'Bangladesh',         fr: 'Bangladesh',         area: 147570    },
  { id: 56,  code: 'be', en: 'Belgium',            fr: 'Belgique',           area: 30528     },
  { id: 68,  code: 'bo', en: 'Bolivia',            fr: 'Bolivie',            area: 1098581   },
  { id: 76,  code: 'br', en: 'Brazil',             fr: 'Brésil',             area: 8515767   },
  { id: 100, code: 'bg', en: 'Bulgaria',           fr: 'Bulgarie',           area: 110879    },
  { id: 116, code: 'kh', en: 'Cambodia',           fr: 'Cambodge',           area: 181035    },
  { id: 120, code: 'cm', en: 'Cameroon',           fr: 'Cameroun',           area: 475442    },
  { id: 124, code: 'ca', en: 'Canada',             fr: 'Canada',             area: 9984670   },
  { id: 152, code: 'cl', en: 'Chile',              fr: 'Chili',              area: 756102    },
  { id: 156, code: 'cn', en: 'China',              fr: 'Chine',              area: 9596960   },
  { id: 170, code: 'co', en: 'Colombia',           fr: 'Colombie',           area: 1141748   },
  { id: 180, code: 'cd', en: 'DR Congo',           fr: 'RD Congo',           area: 2344858   },
  { id: 178, code: 'cg', en: 'Congo',              fr: 'Congo',              area: 342000    },
  { id: 203, code: 'cz', en: 'Czechia',            fr: 'Tchéquie',           area: 78867     },
  { id: 208, code: 'dk', en: 'Denmark',            fr: 'Danemark',           area: 42924     },
  { id: 818, code: 'eg', en: 'Egypt',              fr: 'Égypte',             area: 1002450   },
  { id: 231, code: 'et', en: 'Ethiopia',           fr: 'Éthiopie',           area: 1104300   },
  { id: 246, code: 'fi', en: 'Finland',            fr: 'Finlande',           area: 338145    },
  { id: 250, code: 'fr', en: 'France',             fr: 'France',             area: 551695    },
  { id: 276, code: 'de', en: 'Germany',            fr: 'Allemagne',          area: 357114    },
  { id: 288, code: 'gh', en: 'Ghana',              fr: 'Ghana',              area: 238533    },
  { id: 300, code: 'gr', en: 'Greece',             fr: 'Grèce',              area: 131957    },
  { id: 356, code: 'in', en: 'India',              fr: 'Inde',               area: 3287263   },
  { id: 360, code: 'id', en: 'Indonesia',          fr: 'Indonésie',          area: 1904569   },
  { id: 364, code: 'ir', en: 'Iran',               fr: 'Iran',               area: 1648195   },
  { id: 368, code: 'iq', en: 'Iraq',               fr: 'Irak',               area: 438317    },
  { id: 372, code: 'ie', en: 'Ireland',            fr: 'Irlande',            area: 70273     },
  { id: 380, code: 'it', en: 'Italy',              fr: 'Italie',             area: 301340    },
  { id: 392, code: 'jp', en: 'Japan',              fr: 'Japon',              area: 377930    },
  { id: 398, code: 'kz', en: 'Kazakhstan',         fr: 'Kazakhstan',         area: 2724900   },
  { id: 404, code: 'ke', en: 'Kenya',              fr: 'Kenya',              area: 580367    },
  { id: 408, code: 'kp', en: 'North Korea',        fr: 'Corée du Nord',      area: 120538    },
  { id: 410, code: 'kr', en: 'South Korea',        fr: 'Corée du Sud',       area: 100210    },
  { id: 434, code: 'ly', en: 'Libya',              fr: 'Libye',              area: 1759540   },
  { id: 458, code: 'my', en: 'Malaysia',           fr: 'Malaisie',           area: 329847    },
  { id: 484, code: 'mx', en: 'Mexico',             fr: 'Mexique',            area: 1964375   },
  { id: 504, code: 'ma', en: 'Morocco',            fr: 'Maroc',              area: 446550    },
  { id: 516, code: 'na', en: 'Namibia',            fr: 'Namibie',            area: 824292    },
  { id: 524, code: 'np', en: 'Nepal',              fr: 'Népal',              area: 147181    },
  { id: 528, code: 'nl', en: 'Netherlands',        fr: 'Pays-Bas',           area: 41543     },
  { id: 554, code: 'nz', en: 'New Zealand',        fr: 'Nouvelle-Zélande',   area: 270467    },
  { id: 562, code: 'ne', en: 'Niger',              fr: 'Niger',              area: 1267000   },
  { id: 566, code: 'ng', en: 'Nigeria',            fr: 'Nigéria',            area: 923768    },
  { id: 578, code: 'no', en: 'Norway',             fr: 'Norvège',            area: 385207    },
  { id: 586, code: 'pk', en: 'Pakistan',           fr: 'Pakistan',           area: 881913    },
  { id: 604, code: 'pe', en: 'Peru',               fr: 'Pérou',              area: 1285216   },
  { id: 616, code: 'pl', en: 'Poland',             fr: 'Pologne',            area: 312696    },
  { id: 620, code: 'pt', en: 'Portugal',           fr: 'Portugal',           area: 92212     },
  { id: 642, code: 'ro', en: 'Romania',            fr: 'Roumanie',           area: 238397    },
  { id: 643, code: 'ru', en: 'Russia',             fr: 'Russie',             area: 17098242  },
  { id: 682, code: 'sa', en: 'Saudi Arabia',       fr: 'Arabie Saoudite',    area: 2149690   },
  { id: 706, code: 'so', en: 'Somalia',            fr: 'Somalie',            area: 637657    },
  { id: 710, code: 'za', en: 'South Africa',       fr: 'Afrique du Sud',     area: 1219090   },
  { id: 724, code: 'es', en: 'Spain',              fr: 'Espagne',            area: 505990    },
  { id: 729, code: 'sd', en: 'Sudan',              fr: 'Soudan',             area: 1861484   },
  { id: 752, code: 'se', en: 'Sweden',             fr: 'Suède',              area: 450295    },
  { id: 756, code: 'ch', en: 'Switzerland',        fr: 'Suisse',             area: 41285     },
  { id: 764, code: 'th', en: 'Thailand',           fr: 'Thaïlande',          area: 513120    },
  { id: 792, code: 'tr', en: 'Turkey',             fr: 'Turquie',            area: 783562    },
  { id: 800, code: 'ug', en: 'Uganda',             fr: 'Ouganda',            area: 241550    },
  { id: 804, code: 'ua', en: 'Ukraine',            fr: 'Ukraine',            area: 603550    },
  { id: 826, code: 'gb', en: 'United Kingdom',     fr: 'Royaume-Uni',        area: 242495    },
  { id: 840, code: 'us', en: 'United States',      fr: 'États-Unis',         area: 9833517   },
  { id: 862, code: 've', en: 'Venezuela',          fr: 'Venezuela',          area: 912050    },
  { id: 704, code: 'vn', en: 'Vietnam',            fr: 'Vietnam',            area: 331212    },
  { id: 894, code: 'zm', en: 'Zambia',             fr: 'Zambie',             area: 752612    },
  { id: 466, code: 'ml', en: 'Mali',               fr: 'Mali',               area: 1240192   },
  { id: 450, code: 'mg', en: 'Madagascar',         fr: 'Madagascar',         area: 587041    },
  { id: 204, code: 'bj', en: 'Benin',              fr: 'Bénin',              area: 114763    },
  { id: 384, code: 'ci', en: "Côte d'Ivoire",      fr: "Côte d'Ivoire",      area: 322463    },
  { id: 854, code: 'bf', en: 'Burkina Faso',       fr: 'Burkina Faso',       area: 274222    },
  { id: 218, code: 'ec', en: 'Ecuador',            fr: 'Équateur',           area: 283561    },
  { id: 170, code: 'co', en: 'Colombia',           fr: 'Colombie',           area: 1141748   },
  { id: 76,  code: 'br', en: 'Brazil',             fr: 'Brésil',             area: 8515767   },
]

const COLORS = ['#E63946','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4','#FF5722','#3F51B5']

function formatArea(km2) {
  if (km2 >= 1000000) return `${(km2/1000000).toFixed(2)}M km²`
  return `${km2.toLocaleString()} km²`
}

// ── Mercator scale factor ─────────────────────────────────────────────────────
// The key insight: on Mercator, a country at latitude φ is stretched by 1/cos(φ)
// So to show true size at lat φ_dest, we scale by cos(φ_orig)/cos(φ_dest)
function mercatorScaleFactor(latOrigDeg, latDestDeg) {
  const toRad = d => d * Math.PI / 180
  const cosOrig = Math.cos(toRad(latOrigDeg))
  const cosDest = Math.cos(toRad(Math.max(-75, Math.min(75, latDestDeg))))
  if (cosDest === 0) return 1
  return cosOrig / cosDest
}

export default function TrueSizeMap() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const svgRef       = useRef(null)
  const containerRef = useRef(null)
  const stateRef     = useRef({
    topoData: null,
    projection: null,
    pathGen: null,
    zoom: null,
    transform: d3.zoomIdentity,
    W: 0, H: 0,
  })

  const [loaded, setLoaded]       = useState(false)
  const [search, setSearch]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [overlays, setOverlays]   = useState([])
  const overlaysRef               = useRef([])
  overlaysRef.current             = overlays
  const colorIdxRef               = useRef(0)

  const uniqueCountries = COUNTRIES.filter((c, i, a) => a.findIndex(x => x.id === c.id) === i)

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container || !svgRef.current) return
    let cancelled = false

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        if (cancelled) return
        const s = stateRef.current
        s.topoData = world

        const W = container.clientWidth
        const H = container.clientHeight
        s.W = W; s.H = H

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        // Projection: standard Mercator, scale so full world fits
        const proj = d3.geoMercator()
          .scale(W / (2 * Math.PI))
          .translate([W / 2, H / 2 + H * 0.08])
          .center([0, 20])
        s.projection = proj

        const pathGen = d3.geoPath().projection(proj)
        s.pathGen = pathGen

        const countries = topojson.feature(world, world.objects.countries)
        const borders   = topojson.mesh(world, world.objects.countries, (a, b) => a !== b)

        // Groups
        const baseG     = svg.append('g').attr('class', 'base')
        svg.append('g').attr('class', 'overlays')

        // Ocean
        baseG.append('rect')
          .attr('x', -W * 2).attr('y', -H * 2)
          .attr('width', W * 6).attr('height', H * 6)
          .attr('fill', '#B8D4E8')

        // Land
        baseG.selectAll('path.country')
          .data(countries.features)
          .enter().append('path')
          .attr('class', 'country')
          .attr('d', pathGen)
          .attr('fill', '#D6E3EE')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.4)

        // Borders
        baseG.append('path')
          .datum(borders)
          .attr('d', pathGen)
          .attr('fill', 'none')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.6)

        // Equator line (reference)
        const equatorLine = { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-180,0],[180,0]] } }
        baseG.append('path')
          .datum(equatorLine)
          .attr('d', pathGen)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(0,0,0,0.12)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4')

        // Zoom
        const zoom = d3.zoom()
          .scaleExtent([0.5, 16])
          .on('zoom', event => {
            s.transform = event.transform
            baseG.attr('transform', event.transform)
            svg.select('g.overlays').attr('transform', event.transform)
          })
        s.zoom = zoom
        svg.call(zoom)

        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  // ── Render overlays ─────────────────────────────────────────────────────────
  // Each overlay: translate to pixel position, then scale by Mercator factor
  const renderOverlays = useCallback(() => {
    const s = stateRef.current
    if (!s.projection || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    const overlayG = svg.select('g.overlays')
    const proj = s.projection
    const pathGen = s.pathGen

    overlayG.selectAll('.ov').remove()

    overlaysRef.current.forEach(ov => {
      // Project centroid at ORIGIN lat to get baseline pixel position
      const [origPxX, origPxY] = proj([ov.origLon, ov.origLat])

      // Current destination in pixels
      const [destPxX, destPxY] = proj([ov.destLon, ov.destLat])

      // Mercator scale factor: how much bigger/smaller does the shape appear
      const scale = mercatorScaleFactor(ov.origLat, ov.destLat)

      // The group: translate to destination, scale around centroid
      const g = overlayG.append('g')
        .attr('class', 'ov')
        .attr('data-id', ov.id)
        .style('cursor', 'grab')
        // Move centroid from origin to destination, apply scale
        .attr('transform', `translate(${destPxX - origPxX * scale},${destPxY - origPxY * scale}) scale(${scale})`)

      g.append('path')
        .datum(ov.feature)
        .attr('d', pathGen)
        .attr('fill', ov.color)
        .attr('fill-opacity', 0.55)
        .attr('stroke', ov.color)
        .attr('stroke-width', 1.5 / scale)
        .attr('stroke-opacity', 0.9)
        .style('pointer-events', 'all')

      // Drag on g
      const drag = d3.drag()
        .on('start', function() { d3.select(this).style('cursor', 'grabbing').raise() })
        .on('drag', function(event) {
          const k = s.transform.k  // current zoom level

          // Convert pixel drag to geographic delta at current zoom
          // We need to account for both zoom transform and the scale factor of the overlay group
          // dx/dy are in screen pixels; divide by k to get SVG pixels
          const dx = event.dx / k
          const dy = event.dy / k

          setOverlays(prev => prev.map(o => {
            if (o.id !== ov.id) return o
            // Invert: find current dest pixel, add delta, project back to lon/lat
            const [curPx, curPy] = proj([o.destLon, o.destLat])
            const newCoords = proj.invert([curPx + dx, curPy + dy])
            if (!newCoords) return o
            const newLon = newCoords[0]
            const newLat = Math.max(-75, Math.min(75, newCoords[1]))
            return { ...o, destLon: newLon, destLat: newLat }
          }))
        })
        .on('end', function() { d3.select(this).style('cursor', 'grab') })

      g.call(drag)
    })
  }, [])

  useEffect(() => { renderOverlays() }, [overlays, renderOverlays])

  // ── Add country ─────────────────────────────────────────────────────────────
  const addCountry = useCallback((meta) => {
    const s = stateRef.current
    if (!s.topoData) return
    if (overlaysRef.current.find(o => o.meta.id === meta.id)) {
      setSearch(''); setSuggestions([]); return
    }

    const countries = topojson.feature(s.topoData, s.topoData.objects.countries)
    const feature = countries.features.find(f => parseInt(f.id) === meta.id)
    if (!feature) { console.warn('Feature not found for', meta.id); return }

    const [origLon, origLat] = d3.geoCentroid(feature)
    const color = COLORS[colorIdxRef.current % COLORS.length]
    colorIdxRef.current++

    setOverlays(prev => [...prev, {
      id: Date.now(),
      meta,
      feature,
      origLon,
      origLat,
      destLon: origLon,   // start at original position
      destLat: origLat,
      color,
    }])
    setSearch('')
    setSuggestions([])
  }, [])

  const removeOverlay = useCallback((id) => setOverlays(p => p.filter(o => o.id !== id)), [])

  const resetOverlay = useCallback((id) => {
    setOverlays(prev => prev.map(o => {
      if (o.id !== id) return o
      return { ...o, destLon: o.origLon, destLat: o.origLat }
    }))
  }, [])

  // ── Search ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); return }
    const q = search.toLowerCase()
    setSuggestions(
      uniqueCountries
        .filter(c => (locale === 'fr' ? c.fr : c.en).toLowerCase().includes(q))
        .slice(0, 8)
    )
  }, [search, locale])

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const zoomBy = (factor) => {
    const svg = d3.select(svgRef.current)
    svg.transition().duration(250).call(stateRef.current.zoom.scaleBy, factor)
  }
  const zoomReset = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().duration(350).call(stateRef.current.zoom.transform, d3.zoomIdentity)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', fontFamily: 'var(--font-body)', overflow: 'hidden', backgroundColor: '#B8D4E8' }}>

      {/* Top bar */}
      <div style={{ flexShrink: 0, backgroundColor: 'white', borderBottom: '1px solid #E2DDD5', padding: '8px 16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', zIndex: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        <span style={{ fontSize: '16px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-0.3px', flexShrink: 0 }}>
          🌍 {t('True Size Map', 'Vraie Taille des Pays')}
        </span>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Add a country...', 'Ajouter un pays...')}
            style={{ width: '100%', padding: '7px 12px', borderRadius: '8px', border: '2px solid #E2DDD5', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8F7F4' }}
            onFocus={e => e.target.style.borderColor = '#9EB7E5'}
            onBlur={e => { e.target.style.borderColor = '#E2DDD5'; setTimeout(() => setSuggestions([]), 200) }}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E2DDD5', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100 }}>
              {suggestions.map(s => (
                <button key={s.id} onMouseDown={e => { e.preventDefault(); addCountry(s) }}
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #F4F1E6', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '600', color: '#0B1F3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4F1E6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <img src={`https://flagcdn.com/w40/${s.code}.png`} width="18" height="12" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                  {locale === 'fr' ? s.fr : s.en}
                  <span style={{ fontSize: '11px', color: '#8A8278', marginLeft: 'auto' }}>{formatArea(s.area)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {overlays.map(o => (
            <div key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 5px', borderRadius: '99px', backgroundColor: o.color + '18', border: `1.5px solid ${o.color}` }}>
              <img src={`https://flagcdn.com/w40/${o.meta.code}.png`} width="16" height="11" style={{ borderRadius: '2px', objectFit: 'cover' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0B1F3B' }}>{locale === 'fr' ? o.meta.fr : o.meta.en}</span>
              <span style={{ fontSize: '10px', color: '#8A8278' }}>{formatArea(o.meta.area)}</span>
              <button onClick={() => resetOverlay(o.id)} title="Reset" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9EB7E5', fontSize: '13px', padding: '0 1px', lineHeight: 1 }}>↺</button>
              <button onClick={() => removeOverlay(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '0', lineHeight: 1 }}>×</button>
            </div>
          ))}
          {overlays.length > 1 && (
            <button onClick={() => setOverlays([])}
              style={{ padding: '3px 10px', backgroundColor: '#F4F1E6', border: '1px solid #E2DDD5', borderRadius: '99px', fontSize: '11px', fontWeight: '600', color: '#8A8278', cursor: 'pointer' }}>
              {t('Clear', 'Effacer')}
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!loaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#B8D4E8' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌍</div>
              <p style={{ fontWeight: '700', fontSize: '15px', color: '#0B1F3B' }}>{t('Loading map...', 'Chargement...')}</p>
            </div>
          </div>
        )}
        <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Hint */}
        {loaded && overlays.length === 0 && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(11,31,59,0.85)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '10px 18px', color: 'white', fontSize: '13px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            {t('Search a country → drag it to compare its real size', 'Cherchez un pays → glissez-le pour voir sa vraie taille')}
          </div>
        )}

        {/* Equator label */}
        {loaded && (
          <div style={{ position: 'absolute', bottom: '20px', right: '16px', fontSize: '11px', color: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }}>
            {t('Dashed line = equator', 'Ligne pointillée = équateur')}
          </div>
        )}

        {/* Zoom controls */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[{l:'+', a:()=>zoomBy(1.5)},{l:'−', a:()=>zoomBy(0.67)},{l:'⌂', a:zoomReset}].map(({l,a}) => (
            <button key={l} onClick={a} style={{ width: '34px', height: '34px', backgroundColor: 'white', border: '1px solid #E2DDD5', borderRadius: '8px', fontSize: l==='⌂'?'16px':'20px', fontWeight: '700', cursor: 'pointer', color: '#0B1F3B', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Scale info for dragged country */}
        {overlays.length > 0 && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {overlays.map(o => {
              const scale = mercatorScaleFactor(o.origLat, o.destLat)
              const pct = Math.round((1/scale - 1) * 100)
              const latLabel = Math.abs(Math.round(o.destLat)) + '°' + (o.destLat >= 0 ? 'N' : 'S')
              return (
                <div key={o.id} style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: o.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: '700', color: '#0B1F3B' }}>{locale === 'fr' ? o.meta.fr : o.meta.en}</span>
                  <span style={{ color: '#64748b' }}>{latLabel}</span>
                  {pct !== 0 && (
                    <span style={{ fontWeight: '700', color: pct > 0 ? '#4CAF50' : '#E63946' }}>
                      {pct > 0 ? `+${pct}%` : `${pct}%`} {t('at origin', 'à l\'origine')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'

const WIKI_FLAG_SLUGS = {
  'france-ile-de-france': 'Flag_of_Île-de-France',
  'france-auvergne-rhone-alpes': 'Flag_of_Auvergne-Rhône-Alpes',
  'france-nouvelle-aquitaine': 'Flag_of_Nouvelle-Aquitaine',
  'france-occitanie': 'Flag_of_Occitanie',
  'france-hauts-de-france': 'Flag_of_Hauts-de-France',
  'france-grand-est': 'Flag_of_Grand_Est',
  'france-pays-de-la-loire': 'Flag_of_Pays_de_la_Loire',
  'france-bretagne': 'Gwenn-ha-du',
  'france-normandie': 'Flag_of_Normandy',
  'france-provence-alpes': 'Flag_of_Provence-Alpes-Côte_d%27Azur',
  'france-bourgogne': 'Flag_of_Bourgogne-Franche-Comté',
  'france-centre-val-de-loire': 'Flag_of_Centre-Val_de_Loire',
  'france-corse': 'Flag_of_Corsica',
  'uk-england': 'Flag_of_England',
  'uk-scotland': 'Flag_of_Scotland',
  'uk-wales': 'Flag_of_Wales',
  'uk-ni': 'Flag_of_Ulster',
  'de-bavaria': 'Flag_of_Bavaria',
  'de-berlin': 'Flag_of_Berlin',
  'de-hamburg': 'Flag_of_Hamburg',
  'de-nrw': 'Flag_of_North_Rhine-Westphalia',
  'de-bw': 'Flag_of_Baden-Württemberg',
  'de-saxony': 'Flag_of_Saxony',
  'de-hesse': 'Flag_of_Hesse',
  'de-thuringia': 'Flag_of_Thuringia',
  'de-saxony-anhalt': 'Flag_of_Saxony-Anhalt',
  'de-mecklenburg': 'Flag_of_Mecklenburg-Vorpommern',
  'de-saarland': 'Flag_of_Saarland',
  'de-rhineland': 'Flag_of_Rhineland-Palatinate',
  'de-schleswig': 'Flag_of_Schleswig-Holstein',
  'de-lower-saxony': 'Flag_of_Lower_Saxony',
  'de-brandenburg': 'Flag_of_Brandenburg',
  'de-bremen': 'Flag_of_Bremen',
  'ch-zurich': 'Flag_of_canton_of_Zürich',
  'ch-bern': 'Flag_of_canton_of_Bern',
  'ch-lucerne': 'Flag_of_canton_of_Lucerne',
  'ch-uri': 'Flag_of_canton_of_Uri',
  'ch-schwyz': 'Flag_of_canton_of_Schwyz',
  'ch-obwalden': 'Flag_of_canton_of_Obwalden',
  'ch-nidwalden': 'Flag_of_canton_of_Nidwalden',
  'ch-glarus': 'Flag_of_canton_of_Glarus',
  'ch-zug': 'Flag_of_canton_of_Zug',
  'ch-fribourg': 'Flag_of_canton_of_Fribourg',
  'ch-solothurn': 'Flag_of_canton_of_Solothurn',
  'ch-basel-stadt': 'Flag_of_canton_of_Basel-Stadt',
  'ch-basel-land': 'Flag_of_canton_of_Basel-Landschaft',
  'ch-schaffhausen': 'Flag_of_canton_of_Schaffhausen',
  'ch-appenzell-ar': 'Flag_of_canton_of_Appenzell_Ausserrhoden',
  'ch-appenzell-ir': 'Flag_of_canton_of_Appenzell_Innerrhoden',
  'ch-st-gallen': 'Flag_of_canton_of_St._Gallen',
  'ch-graubunden': 'Flag_of_the_canton_of_Graubünden',
  'ch-aargau': 'Flag_of_canton_of_Aargau',
  'ch-thurgau': 'Flag_of_canton_of_Thurgau',
  'ch-ticino': 'Flag_of_canton_of_Ticino',
  'ch-vaud': 'Flag_of_canton_of_Vaud',
  'ch-valais': 'Flag_of_canton_of_Valais',
  'ch-neuchatel': 'Flag_of_canton_of_Neuchâtel',
  'ch-geneva': 'Flag_of_canton_of_Geneva',
  'ch-jura': 'Flag_of_canton_of_Jura',
  'us-alabama': 'Flag_of_Alabama', 'us-alaska': 'Flag_of_Alaska', 'us-arizona': 'Flag_of_Arizona',
  'us-arkansas': 'Flag_of_Arkansas', 'us-california': 'Flag_of_California', 'us-colorado': 'Flag_of_Colorado',
  'us-connecticut': 'Flag_of_Connecticut', 'us-delaware': 'Flag_of_Delaware', 'us-florida': 'Flag_of_Florida',
  'us-georgia': 'Flag_of_Georgia_(U.S._state)', 'us-hawaii': 'Flag_of_Hawaii', 'us-idaho': 'Flag_of_Idaho',
  'us-illinois': 'Flag_of_Illinois', 'us-indiana': 'Flag_of_Indiana', 'us-iowa': 'Flag_of_Iowa',
  'us-kansas': 'Flag_of_Kansas', 'us-kentucky': 'Flag_of_Kentucky', 'us-louisiana': 'Flag_of_Louisiana',
  'us-maine': 'Flag_of_Maine', 'us-maryland': 'Flag_of_Maryland', 'us-massachusetts': 'Flag_of_Massachusetts',
  'us-michigan': 'Flag_of_Michigan', 'us-minnesota': 'Flag_of_Minnesota', 'us-mississippi': 'Flag_of_Mississippi',
  'us-missouri': 'Flag_of_Missouri', 'us-montana': 'Flag_of_Montana', 'us-nebraska': 'Flag_of_Nebraska',
  'us-nevada': 'Flag_of_Nevada', 'us-new-hampshire': 'Flag_of_New_Hampshire', 'us-new-jersey': 'Flag_of_New_Jersey',
  'us-new-mexico': 'Flag_of_New_Mexico', 'us-new-york': 'Flag_of_New_York', 'us-north-carolina': 'Flag_of_North_Carolina',
  'us-north-dakota': 'Flag_of_North_Dakota', 'us-ohio': 'Flag_of_Ohio', 'us-oklahoma': 'Flag_of_Oklahoma',
  'us-oregon': 'Flag_of_Oregon', 'us-pennsylvania': 'Flag_of_Pennsylvania', 'us-rhode-island': 'Flag_of_Rhode_Island',
  'us-south-carolina': 'Flag_of_South_Carolina', 'us-south-dakota': 'Flag_of_South_Dakota', 'us-tennessee': 'Flag_of_Tennessee',
  'us-texas': 'Flag_of_Texas', 'us-utah': 'Flag_of_Utah', 'us-vermont': 'Flag_of_Vermont',
  'us-virginia': 'Flag_of_Virginia', 'us-washington': 'Flag_of_Washington_(state)', 'us-west-virginia': 'Flag_of_West_Virginia',
  'us-wisconsin': 'Flag_of_Wisconsin', 'us-wyoming': 'Flag_of_Wyoming',
  'ca-ontario': 'Flag_of_Ontario', 'ca-quebec': 'Flag_of_Quebec', 'ca-bc': 'Flag_of_British_Columbia',
  'ca-alberta': 'Flag_of_Alberta', 'ca-manitoba': 'Flag_of_Manitoba', 'ca-saskatchewan': 'Flag_of_Saskatchewan',
  'ca-nova-scotia': 'Flag_of_Nova_Scotia', 'ca-nb': 'Flag_of_New_Brunswick', 'ca-pei': 'Flag_of_Prince_Edward_Island',
  'ca-newfoundland': 'Flag_of_Newfoundland_and_Labrador', 'ca-nwt': 'Flag_of_the_Northwest_Territories',
  'ca-yukon': 'Flag_of_Yukon', 'ca-nunavut': 'Flag_of_Nunavut',
  'paris': 'Flag_of_Paris', 'london': 'Flag_of_the_City_of_London',
  'berlin': 'Flag_of_Berlin', 'hamburg': 'Flag_of_Hamburg', 'munich': 'Flag_of_Munich',
  'new-york-city': 'Flag_of_New_York_City', 'chicago': 'Flag_of_Chicago',
  'washington-dc': 'Flag_of_Washington,_D.C.', 'seattle': 'Flag_of_Seattle',
  'san-francisco': 'Flag_of_San_Francisco', 'portland': 'Flag_of_Portland,_Oregon',
  'houston': 'Flag_of_Houston', 'los-angeles': 'Flag_of_Los_Angeles',
  'geneva': 'Flag_of_Geneva', 'zurich': 'Flag_of_Zürich', 'bern': 'Flag_of_Bern',
  'basel': 'Flag_of_Basel', 'lausanne': 'Flag_of_Lausanne',
  'marseille': 'Flag_of_Marseille', 'lyon': 'Flag_of_Lyon',
  'glasgow': 'Flag_of_Glasgow', 'edinburgh': 'Flag_of_Edinburgh',
  'cardiff': 'Flag_of_Cardiff', 'belfast': 'Flag_of_Belfast',
  'cologne': 'Flag_of_Cologne', 'frankfurt': 'Flag_of_Frankfurt', 'dresden': 'Flag_of_Dresden',
}

// Cache : { url } si résolu (url peut être null si Wikimedia n'a pas d'image),
// ou { promise } si la requête est en cours (déduplique les fetch simultanés).
const wikiCache = new Map()

async function fetchWikimediaUrl(slug) {
  const cached = wikiCache.get(slug)
  if (cached) {
    if ('url' in cached) return cached.url
    if ('promise' in cached) return cached.promise
  }

  const wikiSlug = WIKI_FLAG_SLUGS[slug]
  if (!wikiSlug) {
    wikiCache.set(slug, { url: null })
    return null
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSlug}`,
        { headers: { 'Api-User-Agent': 'KnowFlags/1.0' } }
      )
      if (!res.ok) return null
      const data = await res.json()
      return data?.thumbnail?.source ?? data?.originalimage?.source ?? null
    } catch {
      return null
    }
  })()

  wikiCache.set(slug, { promise })
  const url = await promise
  wikiCache.set(slug, { url })
  return url
}

/**
 * FlagImage — smart flag with automatic fallback chain:
 *   1. /public/{prefix}/{slug}.svg
 *   2. /public/{prefix}/{slug}.png
 *   3. Wikimedia REST API
 *   4. Acronym badge
 *
 * Uses an explicit state machine to avoid render loops.
 */
export default function FlagImage({
  slug, prefix = '/flags/regions', name, acronym,
  color = '#0B1F3B', width = 120, height = 80, style = {},
}) {
  // Une machine à états simple : on avance étape par étape, jamais en arrière.
  // 'svg' → 'png' → 'wiki-loading' → 'wiki' (ou 'badge') → 'badge'
  const [step, setStep]       = useState('svg')
  const [wikiUrl, setWikiUrl] = useState(null)

  // Ref pour ignorer les réponses obsolètes si le slug change en cours de fetch.
  const currentSlugRef = useRef(slug)

  // Reset propre à chaque changement de slug.
  useEffect(() => {
    currentSlugRef.current = slug
    setStep('svg')
    setWikiUrl(null)
  }, [slug, prefix])

  // Chargement Wikimedia UNIQUEMENT quand on atteint l'étape 'wiki-loading'.
  // Plus de fetch parallèle inutile au montage.
  useEffect(() => {
    if (step !== 'wiki-loading' || !slug) return
    let cancelled = false
    fetchWikimediaUrl(slug).then(url => {
      if (cancelled || currentSlugRef.current !== slug) return
      if (url) {
        setWikiUrl(url)
        setStep('wiki')
      } else {
        setStep('badge')
      }
    })
    return () => { cancelled = true }
  }, [step, slug])

  // Handler d'erreur : avance d'une étape, jamais de boucle.
  const handleError = () => {
    setStep(prev => {
      if (prev === 'svg')  return 'png'
      if (prev === 'png')  return 'wiki-loading'
      if (prev === 'wiki') return 'badge'
      return prev
    })
  }

  // Badge fallback final (ou pas de slug).
  if (step === 'badge' || !slug) {
    return (
      <div style={{
        width, height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `1.5px solid ${color}25`, borderRadius: '6px', flexShrink: 0, ...style,
      }}>
        <span style={{ fontSize: Math.min(width, height) * 0.28, fontWeight: '900', color, textAlign: 'center', padding: '4px' }}>
          {acronym || (name || slug || '').slice(0, 3).toUpperCase()}
        </span>
      </div>
    )
  }

  // Pendant la résolution Wikimedia, on garde le rendu du .png qui vient d'échouer
  // caché : on affiche une div vide de la même taille pour éviter le flash.
  if (step === 'wiki-loading') {
    return (
      <div style={{
        width, height, backgroundColor: `${color}0A`,
        borderRadius: '6px', flexShrink: 0, ...style,
      }} />
    )
  }

  const src =
    step === 'svg'  ? `${prefix}/${slug}.svg`
  : step === 'png'  ? `${prefix}/${slug}.png`
  : step === 'wiki' ? wikiUrl
  : null

  if (!src) {
    // Sécurité : ne devrait pas arriver, mais on tombe sur le badge.
    return null
  }

  return (
    <img
      key={src}
      src={src}
      alt={name || slug}
      onError={handleError}
      style={{ width, height, objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.12))', display: 'block', ...style }}
    />
  )
}
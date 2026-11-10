// app/api/review-submission/ai-check/route.js
//
// Vérification d'une soumission de drapeau par Claude, avant publication.
//
// Claude regarde l'image, range le drapeau au bon endroit (type, pays, région parente),
// complète les informations manquantes avec la source Wikipédia et vérifie le reste sur le web.
//   - Vérification claire  -> ses corrections sont appliquées à la soumission,
//                             réponse { outcome: 'ready' } : le client publie ensuite.
//   - Doute ou problème    -> la soumission passe en status 'manual_review' (section
//                             « Forçage manuel » de l'admin), avec le rapport complet.
// Dans les deux cas le rapport est gardé dans submissions.metadata.ai_check.
//
// Variables Vercel : ANTHROPIC_API_KEY (obligatoire), ANTHROPIC_MODEL (facultatif).

import { createAuthClient } from '@/lib/supabase-server-auth'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
const FLAG_TYPES = ['country', 'region', 'city', 'organisation', 'historic']

const SYSTEM = `Tu es le vérificateur éditorial de KnowFlags (knowflags.com), une encyclopédie bilingue FR/EN des drapeaux.
Un membre a proposé un drapeau. Avant publication, tu dois :
1. Regarder l'image et dire si elle correspond bien à l'entité annoncée.
2. Ranger le drapeau au bon endroit : type (country, region, city, organisation, historic), pays de rattachement (code ISO), et pour une ville sa région parente. Utilise de préférence une région déjà présente dans la liste fournie ; sinon propose une nouvelle région parente.
3. Vérifier chaque information sur le web (Wikipédia FR et EN en priorité, puis sites officiels) : noms FR et EN, rattachement, dates de validité, description, anecdotes.
4. Compléter ce qui manque. Le champ source_url doit être l'article Wikipédia de l'entité (FR si la soumission est en français, sinon EN).

Règles KnowFlags :
- Codes ISO en minuscules. Code d'entité d'une région ou d'une ville : suivre le format des slugs existants du même pays (liste fournie), en minuscules, sans accents, mots séparés par des tirets.
- Rédaction en prose simple, sans tirets cadratins, sans formules creuses ni affirmations non vérifiées.
- country_facts (anecdotes pays) : elles servent à un quiz où l'on devine le pays ; elles ne doivent JAMAIS contenir le nom du pays, de sa capitale, de ses villes, ni un nom propre local qui le trahirait.
- N'invente rien. Ce que tu ne peux pas vérifier va dans "checks" avec le statut "doubt".

Choix du verdict :
- "ok" : tout est vérifié, rien à changer.
- "corrections" : tu as corrigé ou complété des champs, et tout est désormais vérifié.
- "doubt" : l'image ne correspond pas, l'entité n'existe pas ou n'a pas de drapeau officiel, une information importante reste invérifiable, ou la soumission ressemble à un canular ou à du spam.

Réponds en terminant OBLIGATOIREMENT par un unique bloc \`\`\`json contenant exactement cet objet :
{
  "verdict": "ok" | "corrections" | "doubt",
  "summary_fr": "2 ou 3 phrases pour l'admin",
  "image_matches": true | false | null,
  "checks": [ { "field": "label_fr", "status": "ok" | "fixed" | "added" | "doubt", "message_fr": "..." } ],
  "suggestions": {
    "flag_type": "", "country_code": "", "entity_code": "",
    "parent_region_slug": "", "new_parent_region": { "slug": "", "name_en": "", "name_fr": "" },
    "label_en": "", "label_fr": "", "description": "", "source_url": "",
    "valid_from": "AAAA-MM-JJ ou vide", "valid_to": "", "is_permanent": null,
    "facts": [], "country_facts": [ { "fact_en": "", "fact_fr": "", "category": "history" } ]
  },
  "sources": [ { "title": "", "url": "" } ]
}
Dans "suggestions", ne remplis que les champs que tu changes ou complètes ; laisse les autres vides ("" ou [] ou null).`

function extractJson(text) {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)]
  const raw = blocks.length ? blocks[blocks.length - 1][1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  return JSON.parse(raw)
}

async function callClaude(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
      messages,
    }),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : '')

// Applique les suggestions de Claude aux colonnes et au metadata de la soumission
function applySuggestions(sub, sg = {}) {
  const meta = { ...(sub.metadata || {}) }
  const up = {}
  const set = (col, v) => { if (v) up[col] = v }

  set('label_en', str(sg.label_en))
  set('label_fr', str(sg.label_fr))
  set('description', str(sg.description))
  set('source_url', /^https?:\/\//.test(str(sg.source_url)) ? str(sg.source_url) : '')
  set('entity_code', str(sg.entity_code).toLowerCase())
  set('country_code', str(sg.country_code).toLowerCase())
  set('valid_from', isoDate(sg.valid_from))
  if (FLAG_TYPES.includes(str(sg.flag_type))) up.flag_type = str(sg.flag_type)
  if (typeof sg.is_permanent === 'boolean') {
    up.is_permanent = sg.is_permanent
    up.valid_to = sg.is_permanent ? null : (isoDate(sg.valid_to) || sub.valid_to || null)
  } else if (isoDate(sg.valid_to)) {
    up.valid_to = isoDate(sg.valid_to)
  }
  const facts = (sg.facts || []).map(str).filter(Boolean)
  if (facts.length) up.facts = [...new Set([...(sub.facts || []).filter(Boolean), ...facts])]

  const cfacts = (sg.country_facts || []).filter(f => str(f?.fact_en) && str(f?.fact_fr))
  if (cfacts.length) meta.country_facts = [...(meta.country_facts || []), ...cfacts.map(f => ({ fact_en: str(f.fact_en), fact_fr: str(f.fact_fr), category: str(f.category) || 'history' }))]

  // Rangement : région parente d'une ville, noms d'une nouvelle entité
  const parent = str(sg.parent_region_slug).toLowerCase()
  if (parent) { meta.region_slug = parent; meta.new_region_slug = null }
  const np = sg.new_parent_region || {}
  if (str(np.slug) && str(np.name_en)) {
    meta.new_region_slug = str(np.slug).toLowerCase()
    meta.new_region_name_en = str(np.name_en)
    meta.new_region_name_fr = str(np.name_fr) || str(np.name_en)
  }
  if (up.label_en) meta.new_name_en = up.label_en
  if (up.label_fr) meta.new_name_fr = up.label_fr

  return { up, meta }
}

export async function POST(request) {
  try {
    // Clé absente ou encore à la valeur provisoire : la page propose de publier sans vérification
    if (!process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquante dans Vercel : la vérification par Claude est indisponible.', code: 'no_key' }, { status: 503 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: sub } = await supabase.from('submissions').select('*').eq('id', id).single()
    if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    // Contexte KnowFlags : pays de rattachement et entités déjà présentes pour ce pays
    const iso = (sub.country_code || '').toLowerCase()
    const [{ data: country }, { data: siblings }] = await Promise.all([
      iso ? supabase.from('countries').select('iso_code, name_en, name_fr').eq('iso_code', iso).maybeSingle() : Promise.resolve({ data: null }),
      iso ? supabase.from('subnational_flags').select('slug, name_fr, type').eq('iso_code', iso).order('type').limit(150) : Promise.resolve({ data: [] }),
    ])

    // Image soumise
    const content = []
    if (sub.file_path) {
      const { data: file } = await supabase.storage.from('flag-submissions').download(sub.file_path)
      if (file) {
        const ext = (sub.file_type || '').toLowerCase()
        if (IMAGE_TYPES[ext]) {
          const b64 = Buffer.from(await file.arrayBuffer()).toString('base64')
          content.push({ type: 'image', source: { type: 'base64', media_type: IMAGE_TYPES[ext], data: b64 } })
        } else if (ext === 'svg') {
          content.push({ type: 'text', text: `Image du drapeau (SVG) :\n${(await file.text()).slice(0, 40000)}` })
        }
      }
    }
    if (!content.length) content.push({ type: 'text', text: 'Aucune image n’a pu être lue pour cette soumission.' })

    const fields = {
      id: sub.id, flag_type: sub.flag_type, submission_subtype: sub.submission_subtype,
      label_en: sub.label_en, label_fr: sub.label_fr, entity_code: sub.entity_code, country_code: sub.country_code,
      description: sub.description, source_url: sub.source_url,
      valid_from: sub.valid_from, valid_to: sub.valid_to, is_permanent: sub.is_permanent,
      facts: sub.facts, metadata: Object.fromEntries(Object.entries(sub.metadata || {}).filter(([k]) => k !== 'ai_check')),
    }
    const siblingList = (siblings || []).map(s => `${s.type} · ${s.slug} · ${s.name_fr}`).join('\n') || 'aucune'
    content.push({
      type: 'text',
      text: `Pays de rattachement en base KnowFlags : ${country ? `${country.name_fr} / ${country.name_en} (${country.iso_code})` : 'aucun ou inconnu'}.\n\nRégions et villes déjà publiées pour ce pays (type · slug · nom) :\n${siblingList}\n\nSoumission (JSON) :\n${JSON.stringify(fields, null, 2)}`,
    })

    // La recherche web peut demander de reprendre le tour (pause_turn)
    const messages = [{ role: 'user', content }]
    let reply = null
    for (let i = 0; i < 3; i++) {
      reply = await callClaude(messages)
      if (reply.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: reply.content })
    }

    const text = (reply?.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
    let result
    try { result = extractJson(text) } catch {
      return NextResponse.json({ error: 'Réponse de Claude illisible. Réessaie.', raw: text.slice(-800) }, { status: 502 })
    }

    const cited = []
    for (const b of reply.content || []) for (const c of b.citations || []) if (c.url) cited.push({ title: c.title || c.url, url: c.url })
    const seen = new Set()
    result.sources = [...(result.sources || []), ...cited].filter(s => s?.url && !seen.has(s.url) && seen.add(s.url)).slice(0, 8)
    result.model = MODEL
    result.checked_at = new Date().toISOString()

    const doubtful = result.verdict === 'doubt'
      || result.image_matches === false
      || (result.checks || []).some(c => c?.status === 'doubt')

    if (doubtful) {
      // Section « Forçage manuel » : rien n'est modifié, le rapport attend l'admin
      await supabase.from('submissions').update({
        status: 'manual_review',
        metadata: { ...(sub.metadata || {}), ai_check: { ...result, applied: false } },
      }).eq('id', sub.id)
      return NextResponse.json({ outcome: 'manual', report: result })
    }

    const { up, meta } = applySuggestions(sub, result.suggestions)
    const { error } = await supabase.from('submissions').update({
      ...up,
      metadata: { ...meta, ai_check: { ...result, applied: true } },
    }).eq('id', sub.id)
    if (error) throw new Error(`Mise à jour de la soumission : ${error.message}`)

    return NextResponse.json({ outcome: 'ready', report: result, applied: Object.keys(up) })
  } catch (e) {
    console.error('ai-check error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

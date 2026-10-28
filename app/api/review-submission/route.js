// DESTINATION: app/api/review-submission/route.js
//
// Acceptation ou refus d'une soumission de drapeau par un admin.
// Toutes les ecritures passent par la session de l'admin : les politiques RLS
// "Admins can insert/update ..." (migration flag_submit_admin_write_policies) les autorisent.
// Les codes ISO sont toujours stockes en minuscules.

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SITE = 'https://knowflags.com'

// Leve une erreur lisible si une ecriture Supabase echoue (avant, les erreurs etaient ignorees).
function check(result, what) {
  if (result?.error) throw new Error(`${what}: ${result.error.message}`)
  return result
}

async function ensureCountry(supabase, iso, meta) {
  if (!iso) return
  const { data: existing } = await supabase.from('countries').select('iso_code').eq('iso_code', iso).maybeSingle()
  if (existing) return
  check(await supabase.from('countries').insert({
    iso_code: iso,
    name_en:  meta.name_en || iso.toUpperCase(),
    name_fr:  meta.name_fr || meta.name_en || iso.toUpperCase(),
    capital:  meta.capital || null,
    region:   meta.region  || null,
  }), 'Country insert')
}

async function findSubnational(supabase, slug, type) {
  const { data } = await supabase.from('subnational_flags').select('id').eq('slug', slug).eq('type', type).maybeSingle()
  return data
}

export async function POST(request) {
  try {
    const { id, action, adminNote } = await request.json()

    if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
    if (action === 'reject' && !adminNote?.trim()) return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('user_id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: sub, error: fetchError } = await supabase
      .from('submissions').select('*').eq('id', id).single()
    if (fetchError || !sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    const meta      = sub.metadata || {}
    const isNew     = sub.submission_subtype === 'new_entity'
    const entity    = (sub.entity_code || '').toLowerCase()
    const countryIso = (sub.country_code || '').toLowerCase()

    if (action === 'accept') {

      // 1. Copie du fichier vers le bucket public flags
      let publicFileUrl = null
      if (sub.file_path) {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('flag-submissions').download(sub.file_path)
        if (dlErr) throw new Error(`File download: ${dlErr.message}`)

        const finalPath = `${sub.flag_type}/${entity}.${sub.file_type}`

        // Correction : on archive l'ancienne image avant de l'ecraser
        if (sub.submission_subtype === 'correction') {
          const { data: oldFile } = await supabase.storage.from('flags').download(finalPath)
          if (oldFile) {
            await supabase.storage.from('flags')
              .upload(`archive/${entity}_${Date.now()}.${sub.file_type}`, oldFile, { upsert: false })
          }
        }

        const { error: upErr } = await supabase.storage.from('flags')
          .upload(finalPath, fileData, { upsert: true, contentType: fileData.type || undefined })
        if (upErr) throw new Error(`File upload: ${upErr.message}`)
        publicFileUrl = supabase.storage.from('flags').getPublicUrl(finalPath).data?.publicUrl || null
      }

      // 2. Routage par type
      if (sub.flag_type === 'country') {
        const iso = isNew ? (meta.new_iso || entity).toLowerCase() : entity

        if (isNew) {
          await ensureCountry(supabase, iso, {
            name_en: meta.new_name_en || sub.label_en, name_fr: meta.new_name_fr,
            capital: meta.new_capital, region: meta.new_region,
          })
        }

        if (isNew || sub.submission_subtype === 'new_flag') {
          const changeDate = meta.change_date || sub.valid_from || new Date().toISOString().split('T')[0]

          if (!isNew) {
            // Ferme l'entree d'historique courante
            const { data: current } = await supabase.from('country_flag_history')
              .select('id').eq('iso_code', iso).is('date_end', null)
              .order('date_start', { ascending: false }).limit(1).maybeSingle()
            if (current) {
              check(await supabase.from('country_flag_history')
                .update({ date_end: changeDate }).eq('id', current.id), 'History close')
            }
          }

          check(await supabase.from('country_flag_history').insert({
            iso_code:      iso,
            image_url:     publicFileUrl,
            date_start:    changeDate,
            date_end:      null,
            label_en:      sub.label_en,
            label_fr:      sub.label_fr || sub.label_en,
            notes_en:      sub.description,
            notes_fr:      sub.description,
            submitted_by:  sub.user_id,
            submission_id: sub.id,
          }), 'History insert')

          const flagUpdates = {}
          if (meta.adopted_year)     flagUpdates.adopted_year = meta.adopted_year
          if (meta.ratio)            flagUpdates.ratio        = meta.ratio
          if (meta.shape)            flagUpdates.shape        = meta.shape
          if (meta.colors?.length)   flagUpdates.colors       = meta.colors
          if (meta.symbols?.length)  flagUpdates.symbols      = meta.symbols
          if (Object.keys(flagUpdates).length > 0) {
            check(await supabase.from('countries').update(flagUpdates).eq('iso_code', iso), 'Country update')
          }
        }
        // correction : l'image est remplacee dans le bucket (etape 1), rien d'autre a faire

        const cfacts = (meta.country_facts || []).filter(f => f.fact_en?.trim())
        if (cfacts.length > 0) {
          check(await supabase.from('country_facts').insert(cfacts.map(f => ({
            country_code: iso,
            fact_en:      f.fact_en,
            fact_fr:      f.fact_fr || f.fact_en,
            category:     f.category || 'history',
          }))), 'Facts insert')
        }

      } else if (sub.flag_type === 'historic') {
        check(await supabase.from('country_flag_history').insert({
          iso_code:      countryIso || entity,
          image_url:     publicFileUrl,
          date_start:    sub.valid_from || null,
          date_end:      sub.is_permanent ? null : sub.valid_to,
          label_en:      sub.label_en,
          label_fr:      sub.label_fr || sub.label_en,
          notes_en:      sub.description,
          notes_fr:      sub.description,
          submitted_by:  sub.user_id,
          submission_id: sub.id,
        }), 'History insert')

      } else if (sub.flag_type === 'region' || sub.flag_type === 'city') {
        // Pays absent de la liste, saisi dans le formulaire
        if (meta.new_country_iso) {
          await ensureCountry(supabase, meta.new_country_iso.toLowerCase(), {
            name_en: meta.new_country_name_en, name_fr: meta.new_country_name_fr,
          })
        }

        // Ville dans une region qui n'existe pas encore : on cree la region d'abord (sans image)
        let parentId = null
        if (sub.flag_type === 'city') {
          const regionSlug = (meta.new_region_slug || meta.region_slug || '').toLowerCase()
          if (regionSlug) {
            let region = await findSubnational(supabase, regionSlug, 'region')
            if (!region && meta.new_region_slug) {
              const { data, error } = await supabase.from('subnational_flags').insert({
                iso_code: countryIso, slug: regionSlug, type: 'region',
                name_en: meta.new_region_name_en || regionSlug,
                name_fr: meta.new_region_name_fr || meta.new_region_name_en || regionSlug,
                submitted_by: sub.user_id, submission_id: sub.id,
              }).select('id').single()
              if (error) throw new Error(`Region insert: ${error.message}`)
              region = data
            }
            parentId = region?.id || null
          }
        }

        const existing = isNew ? null : await findSubnational(supabase, entity, sub.flag_type)
        if (existing) {
          // Nouveau drapeau ou correction d'une entite existante : on remplace l'image
          check(await supabase.from('subnational_flags')
            .update({ image_path: publicFileUrl }).eq('id', existing.id), 'Subnational update')
        } else {
          check(await supabase.from('subnational_flags').insert({
            iso_code:      countryIso,
            slug:          entity,
            name_en:       meta.new_name_en || sub.label_en,
            name_fr:       meta.new_name_fr || sub.label_fr || sub.label_en,
            type:          sub.flag_type,
            image_path:    publicFileUrl,
            parent_id:     parentId,
            metadata:      { description: sub.description, source: sub.source_url, facts: sub.facts },
            submitted_by:  sub.user_id,
            submission_id: sub.id,
          }), 'Subnational insert')
        }

      } else if (sub.flag_type === 'organisation') {
        const { data: existing } = isNew ? { data: null }
          : await supabase.from('organisations').select('id').eq('slug', entity).maybeSingle()
        if (existing) {
          check(await supabase.from('organisations')
            .update({ flag_url: publicFileUrl }).eq('id', existing.id), 'Organisation update')
        } else {
          check(await supabase.from('organisations').insert({
            slug:           entity,
            name_en:        meta.new_name_en || sub.label_en,
            name_fr:        meta.new_name_fr || sub.label_fr || sub.label_en,
            description_en: sub.description,
            description_fr: sub.description,
            flag_url:       publicFileUrl,
            website_url:    meta.new_website || null,
            founded_year:   meta.new_founded ? parseInt(meta.new_founded, 10) : null,
            type:           meta.new_org_type || 'other',
            submitted_by:   sub.user_id,
            submission_id:  sub.id,
          }), 'Organisation insert')
        }
      }

      check(await supabase.from('submissions').update({
        status:      'accepted',
        admin_notes: adminNote || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq('id', id), 'Submission update')

    } else {
      check(await supabase.from('submissions').update({
        status:      'rejected',
        admin_notes: adminNote,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq('id', id), 'Submission update')
    }

    // 3. E-mail a l'auteur. Un echec d'envoi ne bloque pas la moderation.
    const emailSent = await notifyAuthor(supabase, sub, action, adminNote)

    return NextResponse.json({ success: true, emailSent })
  } catch (e) {
    console.error('review-submission error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── Notification Resend ───────────────────────────────────────────────────────
// Variables Vercel : RESEND_API_KEY (obligatoire pour envoyer),
// RESEND_FROM (facultatif, adresse d'un domaine verifie dans Resend).
async function notifyAuthor(supabase, sub, action, adminNote) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { console.warn('RESEND_API_KEY missing: no email sent'); return false }

  try {
    const { data } = await supabase.rpc('submission_author_email', { p_submission_id: sub.id })
    const author = Array.isArray(data) ? data[0] : data
    if (!author?.email) return false

    const fr = author.locale === 'fr'
    const accepted = action === 'accept'
    const name = (fr ? sub.label_fr : sub.label_en) || sub.label_en || sub.name || ''
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

    const subject = accepted
      ? (fr ? `Votre drapeau « ${name} » a été accepté` : `Your flag "${name}" was accepted`)
      : (fr ? `Votre soumission « ${name} » n’a pas été retenue` : `Your submission "${name}" was not accepted`)

    const intro = accepted
      ? (fr ? 'Merci pour votre contribution. Votre drapeau est maintenant publié sur KnowFlags.'
            : 'Thank you for your contribution. Your flag is now live on KnowFlags.')
      : (fr ? 'Merci pour votre contribution. Après examen, nous ne pouvons pas la publier pour le moment.'
            : 'Thank you for your contribution. After review, we cannot publish it for now.')

    const noteLabel = fr ? 'Message de l’équipe' : 'Message from the team'
    const cta = fr ? 'Voir mes soumissions' : 'See my submissions'
    const locale = fr ? 'fr' : 'en'

    const html = `
<div style="font-family:Inter,Arial,sans-serif;background:#F4F1E6;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid rgba(22,50,79,0.12)">
    <div style="background:#16324F;color:#FFFFFF;padding:20px 24px;font-size:18px;font-weight:800">KnowFlags</div>
    <div style="padding:24px;color:#0F1923;font-size:15px;line-height:1.6">
      <p style="margin:0 0 12px;font-size:20px;font-weight:800;color:#16324F">${esc(name)}</p>
      <p style="margin:0 0 16px">${intro}</p>
      ${adminNote ? `<div style="background:#FAFAF7;border:1px solid #E2DDD5;border-radius:10px;padding:12px 14px;margin:0 0 16px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin-bottom:4px">${noteLabel}</div>
        ${esc(adminNote)}</div>` : ''}
      <a href="${SITE}/${locale}/profile" style="display:inline-block;background:#16324F;color:#FFFFFF;text-decoration:none;font-weight:600;padding:10px 20px;border-radius:10px">${cta}</a>
    </div>
  </div>
</div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'KnowFlags <notifications@knowflags.com>',
        to: [author.email],
        subject,
        html,
      }),
    })
    if (!res.ok) { console.error('Resend error:', res.status, await res.text()); return false }
    return true
  } catch (e) {
    console.error('notifyAuthor error:', e)
    return false
  }
}

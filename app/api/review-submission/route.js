// DESTINATION: app/api/review-submission/route.js
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { id, action, adminNote } = await request.json()

    if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
    if (action === 'reject' && !adminNote?.trim()) return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('user_id', session.user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: sub, error: fetchError } = await supabase
      .from('submissions').select('*').eq('id', id).single()
    if (fetchError || !sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    if (action === 'accept') {
      const meta = sub.metadata || {}

      // 1. Upload file to public flags bucket
      let publicFileUrl = null
      if (sub.file_path) {
        const { data: fileData } = await supabase.storage
          .from('flag-submissions').download(sub.file_path)

        if (fileData) {
          const finalPath = `${sub.flag_type}/${sub.entity_code}.${sub.file_type}`
          await supabase.storage.from('flags').upload(finalPath, fileData, { upsert: true })
          const { data: urlData } = supabase.storage.from('flags').getPublicUrl(finalPath)
          publicFileUrl = urlData?.publicUrl
        }
      }

      // 2. Route by type + subtype
      if (sub.flag_type === 'country') {
        const isoCode = (sub.entity_code || '').toUpperCase()

        if (sub.submission_subtype === 'new_entity') {
          // Create new country
          const insertData = {
            iso_code:  (meta.new_iso?.toLowerCase()) || sub.entity_code,
            name_en:   meta.new_name_en || sub.label_en,
            name_fr:   meta.new_name_fr || meta.new_name_en || sub.label_en,
            capital:   meta.new_capital || null,
            region:    meta.new_region  || null,
          }
          console.log('Inserting new country:', insertData)
          const { error: insertErr } = await supabase.from('countries').insert(insertData)
          if (insertErr) {
            console.error('Failed to insert country:', insertErr)
            return NextResponse.json({ error: `Country insert failed: ${insertErr.message}` }, { status: 500 })
          }
          console.log('Country inserted successfully')

        } else if (sub.submission_subtype === 'new_flag') {
          // Archive current flag in history with end date
          const changeDate = meta.change_date || sub.valid_from || new Date().toISOString().split('T')[0]

          // Get current country flag to archive
          const { data: currentCountry } = await supabase
            .from('countries').select('*').eq('iso_code', isoCode).single()

          if (currentCountry) {
            // Find current flag history entry without end date
            const { data: currentHistory } = await supabase
              .from('country_flag_history')
              .select('*').eq('iso_code', isoCode).is('date_end', null)
              .order('date_start', { ascending: false }).limit(1).single()

            if (currentHistory) {
              // Close current history entry
              await supabase.from('country_flag_history')
                .update({ date_end: changeDate })
                .eq('id', currentHistory.id)
            }
          }

          // Insert new flag in history as current (no end date)
          await supabase.from('country_flag_history').insert({
            iso_code:      isoCode,
            image_url:     publicFileUrl,
            date_start:    changeDate,
            date_end:      null,
            label_en:      sub.label_en,
            label_fr:      sub.label_fr,
            notes_en:      sub.description,
            notes_fr:      sub.description,
            submitted_by:  sub.user_id,
            submission_id: sub.id,
          })

          // Update country flag properties if provided
          const flagUpdates = {}
          if (meta.adopted_year) flagUpdates.adopted_year = meta.adopted_year
          if (meta.ratio)        flagUpdates.ratio        = meta.ratio
          if (meta.shape)        flagUpdates.shape        = meta.shape
          if (meta.colors?.length)   flagUpdates.colors   = meta.colors
          if (meta.symbols?.length)  flagUpdates.symbols  = meta.symbols
          if (Object.keys(flagUpdates).length > 0) {
            await supabase.from('countries').update(flagUpdates).eq('iso_code', isoCode)
          }

        } else if (sub.submission_subtype === 'correction') {
          // Archive old file with timestamp in storage
          if (sub.file_path) {
            const oldPath = `${sub.flag_type}/${sub.entity_code}.${sub.file_type}`
            const archivePath = `archive/${sub.entity_code}_${Date.now()}.${sub.file_type}`
            const { data: oldFile } = await supabase.storage.from('flags').download(oldPath)
            if (oldFile) {
              await supabase.storage.from('flags').upload(archivePath, oldFile, { upsert: false })
            }
          }
          // No history entry — just replace the image
        }

        // Insert country facts if provided
        const cfacts = meta.country_facts || []
        if (cfacts.length > 0) {
          const toInsert = cfacts.filter(f => f.fact_en?.trim()).map(f => ({
            country_code: isoCode,
            fact_en:      f.fact_en,
            fact_fr:      f.fact_fr || f.fact_en,
            category:     f.category || 'history',
          }))
          if (toInsert.length > 0) await supabase.from('country_facts').insert(toInsert)
        }

      } else if (sub.flag_type === 'historic') {
        // Historical flag — goes straight to country_flag_history with dates
        await supabase.from('country_flag_history').insert({
          iso_code:      (sub.country_code || sub.entity_code || '').toUpperCase(),
          image_url:     publicFileUrl,
          date_start:    sub.valid_from || null,
          date_end:      sub.is_permanent ? null : sub.valid_to,
          label_en:      sub.label_en,
          label_fr:      sub.label_fr,
          notes_en:      sub.description,
          notes_fr:      sub.description,
          submitted_by:  sub.user_id,
          submission_id: sub.id,
        })

      } else if (sub.flag_type === 'region' || sub.flag_type === 'city') {
        await supabase.from('subnational_flags').insert({
          iso_code:      (sub.country_code || '').toUpperCase(),
          slug:          sub.entity_code,
          name_en:       sub.label_en,
          name_fr:       sub.label_fr || sub.label_en,
          type:          sub.flag_type,
          image_path:    publicFileUrl,
          metadata:      { description: sub.description, source: sub.source_url, facts: sub.facts },
          submitted_by:  sub.user_id,
          submission_id: sub.id,
        })

      } else if (sub.flag_type === 'organisation') {
        await supabase.from('organisations').insert({
          slug:          sub.entity_code,
          name_en:       sub.label_en,
          name_fr:       sub.label_fr || sub.label_en,
          description_en: sub.description,
          description_fr: sub.description,
          flag_url:      publicFileUrl,
          website_url:   meta.new_website  || null,
          founded_year:  meta.new_founded  ? parseInt(meta.new_founded) : null,
          type:          meta.new_org_type || 'other',
          submitted_by:  sub.user_id,
          submission_id: sub.id,
        })
      }

      // 3. Update submission status
      await supabase.from('submissions').update({
        status:      'accepted',
        admin_notes: adminNote || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      }).eq('id', id)

    } else {
      // Reject
      await supabase.from('submissions').update({
        status:      'rejected',
        admin_notes: adminNote,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      }).eq('id', id)
    }

    // TODO: send Resend email notification

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('review-submission error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
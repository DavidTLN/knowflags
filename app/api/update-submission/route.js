// DESTINATION: app/api/update-submission/route.js
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { id, label_en, label_fr, entity_code, country_code, description, source_url,
            valid_from, valid_to, is_permanent, facts, adopted_year, ratio, shape,
            colors, symbols, country_facts } = await request.json()

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createClient()

    // Check admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('user_id', session.user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Update submissions table
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        label_en:     label_en     || null,
        label_fr:     label_fr     || null,
        entity_code:  entity_code  || null,
        country_code: country_code || null,
        description:  description  || null,
        source_url:   source_url   || null,
        valid_from:   valid_from   || null,
        valid_to:     is_permanent ? null : (valid_to || null),
        is_permanent: is_permanent ?? true,
        facts:        (facts || []).filter(f => f.trim()),
        // Store extra fields in metadata jsonb for country-specific data
        metadata: {
          adopted_year:   adopted_year  || null,
          ratio:          ratio         || null,
          shape:          shape         || null,
          colors:         colors        || [],
          symbols:        symbols       || [],
          country_facts:  (country_facts || []).filter(f => f.fact_en.trim()),
        },
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('update-submission error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
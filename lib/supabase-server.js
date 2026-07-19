// lib/supabase-server.js
//
// Supabase client for SERVER Components / route handlers.
// Read-only, anonymous: it reads public content (countries, facts, flag history)
// during server rendering so the HTML is complete for users and crawlers alike.
//
// Keep using '@/lib/supabase-client' inside 'use client' components.
//
// If some of these tables are protected by RLS policies that depend on the
// signed-in user, this anonymous client will return no rows — in that case
// switch to @supabase/ssr's createServerClient with the cookie store.

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
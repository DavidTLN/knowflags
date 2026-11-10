// lib/supabase-server-auth.js
//
// Supabase client for route handlers that act AS THE SIGNED-IN USER:
// auth callback (PKCE code exchange, recovery links), admin API routes.
// It reads and writes the auth cookies set by the browser client (@supabase/ssr).
//
// Do NOT use it for public server rendering: reading cookies makes the page dynamic.
// Public content keeps using '@/lib/supabase-server' (anonymous, cacheable).

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAuthClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component: cookies are read-only there, the middleware refreshes them.
          }
        },
      },
    }
  )
}

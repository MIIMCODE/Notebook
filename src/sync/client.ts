import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null | undefined

/** کلاینت Supabase — از env؛ اگر کلید نباشد null (حالت فقط آفلاین) */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key || url.includes('your-project')) {
    cached = null
    return null
  }
  cached = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return cached
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null
}

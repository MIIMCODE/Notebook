import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '../../sync/client'

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    void sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return session
}

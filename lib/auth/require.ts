import 'server-only'

import { createClient } from '@/lib/supabase/server'

// Server actions are publicly reachable HTTP endpoints. Every admin action
// must call this before touching data — page-level checks (e.g. in
// app/admin/page.tsx) only protect the UI, not the actions themselves.
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }

  return user
}

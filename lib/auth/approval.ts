import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Silent launch: completing Google/LinkedIn OAuth always creates or logs
// into a Supabase Auth identity, regardless of app-level approval — unlike
// magic link, which already refuses to create a new identity for an
// unknown email (shouldCreateUser: false in lib/auth/actions.ts). Without
// this check, OAuth alone was enough to reach /home with no `users` row.
// Used by app/auth/callback/route.ts right after exchanging the code —
// gates on either being the admin or already having a `users` row, which
// covers both OAuth and magic link since both land there.
//
// Deliberately framework-agnostic (no `server-only`, no `next/headers`) so
// tests/auth-approval.spec.ts can call the real function against the real
// database with a plain service-role client, rather than reimplementing
// the logic — see that file's header comment for why a full HTTP
// round-trip through the route isn't feasible to test.
export async function isApprovedMember(
  supabase: SupabaseClient<Database>,
  email: string | undefined
): Promise<boolean> {
  if (!email) return false
  if (process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
    return true
  }
  // users.email is always stored lowercased (set at approval time from the
  // application's already-lowercased email) — plain eq is enough, and
  // avoids ilike's wildcard chars being meaningful in a query value.
  const { data } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle()
  return !!data
}

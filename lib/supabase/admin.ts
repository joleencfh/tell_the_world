import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely.
// Only import this in server-side code (Server Components, Server Actions, API routes).
// Never expose to the browser or pass to client components.
//
// Initialised lazily so the missing env var doesn't crash the build process.
// The key is only required at runtime when an admin action is actually invoked.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, 'public', any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminClient(): SupabaseClient<any, 'public', any> {
  if (!_client) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local.')
    }
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return _client
}

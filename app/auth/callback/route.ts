import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Silent launch: completing Google/LinkedIn OAuth always creates or logs
// into a Supabase Auth identity, regardless of app-level approval — unlike
// magic link, which already refuses to create a new identity for an
// unknown email (shouldCreateUser: false in lib/auth/actions.ts). Without
// this check, OAuth alone was enough to reach /home with no `users` row.
// So after exchanging the code, gate on either being the admin or already
// having a `users` row — same check covers both OAuth and magic link,
// since both land here.
async function isApprovedMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (await isApprovedMember(supabase, data.user?.email)) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      // Authenticated with Supabase but not an approved member — don't
      // leave them signed in with nowhere approved to go.
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=not_approved`)
    }
  }

  // Auth error — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth`)
}

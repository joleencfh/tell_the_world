import { createClient } from '@/lib/supabase/server'
import { isApprovedMember } from '@/lib/auth/approval'
import { logEvent } from '@/lib/analytics/log'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (await isApprovedMember(supabase, data.user?.email)) {
        if (data.user) {
          await logEvent({ eventType: 'login', userId: data.user.id, metadata: { email: data.user.email ?? null } })
        }
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

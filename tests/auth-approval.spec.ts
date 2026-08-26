import { test, expect } from '@playwright/test'
import { isApprovedMember } from '../lib/auth/approval'
import { getTestAdminClient } from './helpers/supabase'

// ---------------------------------------------------------------------------
// Regression tests for lib/auth/approval.ts's isApprovedMember — the gate
// app/auth/callback/route.ts applies to every OAuth and magic-link sign-in
// (silent-launch auth wall).
//
// This is not a browser/HTTP round-trip through the actual route: doing
// that for real would mean driving a genuine Google/LinkedIn OAuth
// completion or clicking a real emailed magic link, neither of which is
// available here. A close admin-API substitute was tried and ruled out —
// Supabase's admin.generateLink() (already used by tests/helpers/auth.ts
// for the approved-user fixtures) returns an implicit-flow link
// (`#access_token=...`, a fragment the server never sees), not the
// `?code=...` our callback's exchangeCodeForSession expects — confirmed by
// fetching a generated link directly and inspecting the redirect. Only a
// real browser-initiated OTP/OAuth flow produces that, and reproducing one
// needs either a real inbox or real provider credentials.
//
// So instead, this calls the actual gate function against the real
// database with a service-role client — same logic the route runs, same
// data, just without the HTTP hop.
// ---------------------------------------------------------------------------

test.describe('isApprovedMember', () => {
  test('an approved member (creator fixture) passes', async () => {
    const email = process.env.TEST_CREATOR_EMAIL
    if (!email) { test.skip(true, 'TEST_CREATOR_EMAIL not set'); return }
    const supabase = getTestAdminClient()
    expect(await isApprovedMember(supabase, email)).toBe(true)
  })

  test('an approved member (expert fixture) passes', async () => {
    const email = process.env.TEST_EXPERT_EMAIL
    if (!email) { test.skip(true, 'TEST_EXPERT_EMAIL not set'); return }
    const supabase = getTestAdminClient()
    expect(await isApprovedMember(supabase, email)).toBe(true)
  })

  test('email casing does not affect the match', async () => {
    const email = process.env.TEST_CREATOR_EMAIL
    if (!email) { test.skip(true, 'TEST_CREATOR_EMAIL not set'); return }
    const supabase = getTestAdminClient()
    expect(await isApprovedMember(supabase, email.toUpperCase())).toBe(true)
  })

  test('the real ADMIN_EMAIL passes', async () => {
    const email = process.env.ADMIN_EMAIL
    if (!email) { test.skip(true, 'ADMIN_EMAIL not set'); return }
    const supabase = getTestAdminClient()
    expect(await isApprovedMember(supabase, email)).toBe(true)
  })

  test('the ADMIN_EMAIL branch bypasses the users-row check', async () => {
    // Whether the real admin account happens to also have a `users` row is
    // live production state that can change (it does today) and isn't this
    // test's business either way — the sibling test above already confirms
    // an email with no row fails, so pointing ADMIN_EMAIL at exactly that
    // email isolates the bypass branch itself, independent of any account's
    // actual row state.
    const noRowEmail = 'definitely-not-a-real-ttw-member-xyz123@example.com'
    const supabase = getTestAdminClient()
    const original = process.env.ADMIN_EMAIL
    process.env.ADMIN_EMAIL = noRowEmail
    try {
      expect(await isApprovedMember(supabase, noRowEmail)).toBe(true)
      expect(await isApprovedMember(supabase, noRowEmail.toUpperCase())).toBe(true)
    } finally {
      process.env.ADMIN_EMAIL = original
    }
  })

  test('an email with no users row and not ADMIN_EMAIL fails', async () => {
    const supabase = getTestAdminClient()
    expect(await isApprovedMember(supabase, 'definitely-not-a-real-ttw-member-xyz123@example.com')).toBe(false)
  })

  test('no email at all fails', async () => {
    const supabase = getTestAdminClient()
    expect(await isApprovedMember(supabase, undefined)).toBe(false)
  })
})

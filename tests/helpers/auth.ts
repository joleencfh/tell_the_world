/**
 * Shared session-generation helper for Playwright auth fixtures.
 *
 * Extracted from tests/global-setup.ts so the same magic-link → verifyOtp →
 * cookie-injection technique (see that file's own doc comment for the full
 * rationale) can be reused by scripts that authenticate a fixture outside
 * the normal creator/expert pair — e.g. an admin fixture, see
 * two-ink-bold-plan.md's Part 9b.
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const COOKIE_NAME = 'sb-kofimpjhjpgjotjanglq-auth-token'
const BASE64_PREFIX = 'base64-'
const MAX_CHUNK_SIZE = 3180

function encodeSession(session: object): string {
  const json = JSON.stringify(session)
  const b64url = Buffer.from(json, 'utf8').toString('base64url')
  return BASE64_PREFIX + b64url
}

function createChunks(key: string, encoded: string): Array<{ name: string; value: string }> {
  if (encoded.length <= MAX_CHUNK_SIZE) {
    return [{ name: key, value: encoded }]
  }
  const chunks: string[] = []
  for (let offset = 0; offset < encoded.length; offset += MAX_CHUNK_SIZE) {
    chunks.push(encoded.slice(offset, offset + MAX_CHUNK_SIZE))
  }
  return chunks.map((value, i) => ({ name: `${key}.${i}`, value }))
}

/**
 * Generate a real Supabase session for `email` via the admin API (no browser
 * redirect, no email delivery) and persist it as Playwright storageState at
 * `storagePath`. Verifies the session by navigating to `verifyPath` first.
 */
export async function authenticateUser(
  email: string,
  storagePath: string,
  baseURL: string,
  verifyPath: string = '/home',
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
    )
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anonClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 0. Ensure the auth user exists and is confirmed first. Pre-existing
  //    fixture accounts (creator/expert) already went through the real
  //    approval flow's createUser({ email_confirm: true }) — see
  //    lib/admin/actions.ts — so generateLink + verifyOtp just works for
  //    them. A brand-new fixture email (e.g. a freshly introduced
  //    TEST_ADMIN_EMAIL) has no auth.users row yet, and generateLink alone
  //    does not reliably produce a verifiable magiclink token for an
  //    unconfirmed/nonexistent user — verifyOtp fails with "Email link is
  //    invalid or has expired". createUser is idempotent here: if the
  //    account already exists this just errors, which we ignore.
  await adminClient.auth.admin.createUser({ email, email_confirm: true })

  // 1. Generate a magic link — we need the hashed_token OTP value
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseURL}/auth/callback` },
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(
      `Failed to generate magic link for "${email}": ${linkError?.message ?? 'no hashed_token returned'}`
    )
  }

  const { hashed_token } = linkData.properties

  // 2. Exchange the OTP for a real session (server-side — no browser redirect needed)
  const { data: otpData, error: otpError } = await anonClient.auth.verifyOtp({
    token_hash: hashed_token,
    type: 'magiclink',
  })

  if (otpError || !otpData.session) {
    throw new Error(`verifyOtp failed for "${email}": ${otpError?.message ?? 'no session returned'}`)
  }

  const { session } = otpData

  // 3. Serialize the session as @supabase/ssr expects
  const encoded = encodeSession({
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: session.user,
  })
  const cookieChunks = createChunks(COOKIE_NAME, encoded)

  // 4. Launch a browser, set the cookies, and verify the session is valid
  const browser = await chromium.launch()
  const context = await browser.newContext()

  try {
    const page = await context.newPage()

    await context.addCookies(
      cookieChunks.map(({ name, value }) => ({
        name,
        value,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
      }))
    )

    // 5. Navigate to a protected route — if the session is accepted we
    //    should land on verifyPath, not get redirected to /login
    await page.goto(`${baseURL}${verifyPath}`)
    await page.waitForURL(`${baseURL}${verifyPath}`, { timeout: 15000 })

    // 6. Persist all cookies so tests can reuse this session
    fs.mkdirSync(path.dirname(storagePath), { recursive: true })
    await context.storageState({ path: storagePath })
  } finally {
    await browser.close()
  }
}

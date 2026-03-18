/**
 * Playwright global setup — authenticates test users before the suite runs.
 *
 * Strategy
 * ────────
 * We avoid the browser-based magic link redirect (which uses implicit flow /
 * hash tokens) and instead use the Supabase admin API to:
 *   1. Generate a magic link → get the `hashed_token` OTP token
 *   2. Call `verifyOtp({ token_hash })` to obtain a real session server-side
 *   3. Serialize the session as a cookie in the exact format `@supabase/ssr`
 *      expects: `base64-<base64url(JSON.stringify(session))>` (chunked at
 *      3180 chars if needed)
 *   4. Set the cookie(s) directly on a Playwright browser context
 *   5. Navigate to /home to confirm the session is valid, then save
 *      storageState to playwright/.auth/{creator,expert}.json
 *
 * Required .env.local vars:
 *   NEXT_PUBLIC_SUPABASE_URL          — project URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — anon/publishable key
 *   SUPABASE_SERVICE_ROLE_KEY         — service role key (admin)
 *   TEST_CREATOR_EMAIL                — pre-approved creator test account
 *   TEST_EXPERT_EMAIL                 — pre-approved expert test account
 */

import { chromium, FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Cookie helpers — mirrors the internals of @supabase/ssr@0.9.0
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'sb-kofimpjhjpgjotjanglq-auth-token'
const BASE64_PREFIX = 'base64-'
const MAX_CHUNK_SIZE = 3180

/**
 * Encode the session the same way @supabase/ssr does:
 *   base64- + base64url(UTF-8 JSON of session)
 */
function encodeSession(session: object): string {
  const json = JSON.stringify(session)
  const b64url = Buffer.from(json, 'utf8').toString('base64url')
  return BASE64_PREFIX + b64url
}

/**
 * Split an encoded value into chunks ≤ MAX_CHUNK_SIZE characters.
 * Returns an array of { name, value } pairs.
 */
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

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------

async function globalSetup(config: FullConfig) {
  loadEnvConfig(process.cwd())

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const creatorEmail = process.env.TEST_CREATOR_EMAIL
  const expertEmail = process.env.TEST_EXPERT_EMAIL

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
    )
  }
  if (!creatorEmail || !expertEmail) {
    throw new Error('TEST_CREATOR_EMAIL and TEST_EXPERT_EMAIL must be set in .env.local')
  }

  // Admin client for generateLink + getUserById
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Anon/publishable client for verifyOtp (requires non-service-role key)
  const anonClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const baseURL =
    (config.projects[0]?.use as { baseURL?: string })?.baseURL ??
    'http://localhost:3000'

  // Ensure the .auth directory exists
  const authDir = path.join(process.cwd(), 'playwright', '.auth')
  fs.mkdirSync(authDir, { recursive: true })

  // ── Authenticate a single user ──────────────────────────────────────────

  async function authenticateUser(email: string, storagePath: string): Promise<void> {
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
      throw new Error(
        `verifyOtp failed for "${email}": ${otpError?.message ?? 'no session returned'}`
      )
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

      // Set the session cookie(s) on the app's domain
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
      //    should land on /home, not get redirected to /login
      await page.goto(`${baseURL}/home`)
      await page.waitForURL(`${baseURL}/home`, { timeout: 15000 })

      // 6. Persist all cookies so tests can reuse this session
      await context.storageState({ path: storagePath })
    } finally {
      await browser.close()
    }
  }

  // ── Authenticate both test users ─────────────────────────────────────────

  console.log('  Setting up auth sessions for test users…')
  await authenticateUser(creatorEmail, path.join(authDir, 'creator.json'))
  console.log(`  ✓ Creator session saved (${creatorEmail})`)
  await authenticateUser(expertEmail, path.join(authDir, 'expert.json'))
  console.log(`  ✓ Expert session saved (${expertEmail})`)
}

export default globalSetup

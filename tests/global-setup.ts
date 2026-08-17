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
 *      storageState to playwright/.auth/{creator,expert,admin}.json
 * See tests/helpers/auth.ts for the shared implementation.
 *
 * Required .env.local vars:
 *   NEXT_PUBLIC_SUPABASE_URL          — project URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — anon/publishable key
 *   SUPABASE_SERVICE_ROLE_KEY         — service role key (admin)
 *   TEST_CREATOR_EMAIL                — pre-approved creator test account
 *   TEST_EXPERT_EMAIL                 — pre-approved expert test account
 *
 * Optional:
 *   TEST_ADMIN_EMAIL — a dedicated test-admin account (two-ink-bold-plan.md
 *   Part 9b). Deliberately NOT the real ADMIN_EMAIL — a Supabase session for
 *   TEST_ADMIN_EMAIL only grants access to /admin if the dev server this
 *   suite runs against was itself started with ADMIN_EMAIL=TEST_ADMIN_EMAIL
 *   (that variable gates the real /admin route by direct equality check, see
 *   app/admin/page.tsx). In CI (.github/workflows/ci.yml), ADMIN_EMAIL is
 *   pointed at the TEST_ADMIN_EMAIL secret for the whole job, so admin
 *   tests run for real there. Locally, ADMIN_EMAIL is NOT repointed by this
 *   file — your .env.local's ADMIN_EMAIL presumably gates your own real
 *   /admin route, and this project has one Supabase project shared across
 *   dev and CI with no separate staging, so that value is left alone.
 *   admin.json is still generated whenever TEST_ADMIN_EMAIL is set, but
 *   tests/two-ink-bold-11f-admin.spec.ts (the only spec that uses it)
 *   needs a manual env override to actually reach /admin locally — see the
 *   header comment there. If TEST_ADMIN_EMAIL isn't set at all, admin.json
 *   generation is skipped — every other fixture and test is unaffected.
 */

import { FullConfig } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as path from 'path'
import { authenticateUser } from './helpers/auth'

async function globalSetup(config: FullConfig) {
  loadEnvConfig(process.cwd())

  const creatorEmail = process.env.TEST_CREATOR_EMAIL
  const expertEmail = process.env.TEST_EXPERT_EMAIL
  const adminEmail = process.env.TEST_ADMIN_EMAIL

  if (!creatorEmail || !expertEmail) {
    throw new Error('TEST_CREATOR_EMAIL and TEST_EXPERT_EMAIL must be set in .env.local')
  }

  const baseURL =
    (config.projects[0]?.use as { baseURL?: string })?.baseURL ??
    'http://localhost:3000'

  const authDir = path.join(process.cwd(), 'playwright', '.auth')

  console.log('  Setting up auth sessions for test users…')
  await authenticateUser(creatorEmail, path.join(authDir, 'creator.json'), baseURL)
  console.log(`  ✓ Creator session saved (${creatorEmail})`)
  await authenticateUser(expertEmail, path.join(authDir, 'expert.json'), baseURL)
  console.log(`  ✓ Expert session saved (${expertEmail})`)

  if (adminEmail) {
    await authenticateUser(adminEmail, path.join(authDir, 'admin.json'), baseURL)
    console.log(`  ✓ Admin session saved (${adminEmail}) — /admin itself only works if this dev server was started with ADMIN_EMAIL=${adminEmail}`)
  } else {
    console.log('  ○ TEST_ADMIN_EMAIL not set — skipping admin.json (see this file\'s doc comment)')
  }
}

export default globalSetup

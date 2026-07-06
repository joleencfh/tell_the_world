import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Load .env.local so env vars are available in the test process
// (Next.js loads these for the app server, but not for the Playwright runner)
// ---------------------------------------------------------------------------

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Selects a role from the role dropdown and waits for the section to appear. */
async function selectRole(page: Page, role: string) {
  // The role <select> is the first select on the page
  await page.locator('select').first().selectOption(role)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Application form (/apply)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apply')
  })

  // ── 1. Base fields ────────────────────────────────────────────────────────

  test('renders with all base fields visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Apply to join' })).toBeVisible()

    // Universal fields always present
    await expect(page.getByPlaceholder('First name')).toBeVisible()
    await expect(page.getByPlaceholder('Last name')).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.getByPlaceholder('A short introduction…')).toBeVisible()

    // Role-specific fields must not be visible before a role is chosen
    await expect(page.getByPlaceholder('e.g. 50000')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. Oxford Future of Humanity Institute')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. Centre for AI Safety')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. MIT Technology Review')).not.toBeVisible()

    // Submit button present
    await expect(page.getByRole('button', { name: 'Submit application' })).toBeVisible()
  })

  // ── 2. Creator role ───────────────────────────────────────────────────────

  test('creator role shows creator fields and hides expert/org/journalist fields', async ({ page }) => {
    await selectRole(page, 'creator')

    // Creator-specific fields
    await expect(page.getByPlaceholder('e.g. 50000')).toBeVisible()              // audience size
    await expect(page.getByPlaceholder('e.g. English, Spanish')).toBeVisible()   // content language

    // Expert fields must be absent
    await expect(page.getByPlaceholder('e.g. Oxford Future of Humanity Institute')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. Research Scientist')).not.toBeVisible()

    // Organisation fields must be absent
    await expect(page.getByPlaceholder('e.g. Centre for AI Safety')).not.toBeVisible()

    // Journalist-only fields must be absent
    await expect(page.getByPlaceholder('e.g. MIT Technology Review')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. AI and emerging technology')).not.toBeVisible()
  })

  // ── 3. Expert role ────────────────────────────────────────────────────────

  test('expert role shows expert fields and hides creator/org/journalist fields', async ({ page }) => {
    await selectRole(page, 'expert')

    // Expert-specific fields
    await expect(page.getByPlaceholder('e.g. Oxford Future of Humanity Institute')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. Research Scientist')).toBeVisible()

    // Creator fields must be absent
    await expect(page.getByPlaceholder('e.g. 50000')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. English, Spanish')).not.toBeVisible()

    // Organisation fields must be absent
    await expect(page.getByPlaceholder('e.g. Centre for AI Safety')).not.toBeVisible()

    // Journalist-only fields must be absent
    await expect(page.getByPlaceholder('e.g. MIT Technology Review')).not.toBeVisible()
  })

  // ── 4. Organisation role ──────────────────────────────────────────────────

  test('organisation role shows org fields and hides creator/expert/journalist fields', async ({ page }) => {
    await selectRole(page, 'organisation')

    // Org-specific fields
    await expect(page.getByPlaceholder('e.g. Centre for AI Safety')).toBeVisible()

    // Creator fields must be absent
    await expect(page.getByPlaceholder('e.g. 50000')).not.toBeVisible()

    // Expert fields must be absent
    await expect(page.getByPlaceholder('e.g. Oxford Future of Humanity Institute')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. Research Scientist')).not.toBeVisible()

    // Journalist fields must be absent
    await expect(page.getByPlaceholder('e.g. MIT Technology Review')).not.toBeVisible()
    await expect(page.getByPlaceholder('e.g. AI and emerging technology')).not.toBeVisible()
  })

  // ── 5. Journalist role ────────────────────────────────────────────────────

  test('journalist role shows journalist fields and hides creator/expert/org fields', async ({ page }) => {
    await selectRole(page, 'journalist')

    // Journalist-specific fields
    await expect(page.getByPlaceholder('e.g. MIT Technology Review')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. AI and emerging technology')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. English, Italian')).toBeVisible()

    // Creator fields must be absent
    await expect(page.getByPlaceholder('e.g. 50000')).not.toBeVisible()

    // Expert fields must be absent
    await expect(page.getByPlaceholder('e.g. Oxford Future of Humanity Institute')).not.toBeVisible()

    // Org fields must be absent
    await expect(page.getByPlaceholder('e.g. Centre for AI Safety')).not.toBeVisible()
  })

  // ── 6. Validation errors on empty submit ──────────────────────────────────

  test('submitting with missing required fields shows inline validation errors', async ({ page }) => {
    // Select a role so all required fields are active, then submit empty
    await selectRole(page, 'creator')
    await page.getByRole('button', { name: 'Submit application' }).click()

    // Error summary should appear
    await expect(page.getByText(/a few fields need your attention/i)).toBeVisible()

    // Individual field error messages
    await expect(page.getByText('Required').first()).toBeVisible()

    // Creator-specific required fields should also flag
    await expect(page.getByRole('button', { name: 'First name' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Email address' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bio' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Primary platform' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Channel / profile URL' })).toBeVisible()

    // Page should not have navigated away
    await expect(page).toHaveURL('/apply')
  })

  // ── 7. Full valid creator submission ─────────────────────────────────────

  test('complete valid creator form redirects to /apply/pending and saves the record', async ({ page }) => {
    // Use a timestamped email so the record is uniquely identifiable.
    // Note: on Resend's free tier, confirmation emails can only be sent to the
    // verified account email. If the email step fails, the form will show an
    // error rather than redirecting. In that case we still verify the DB record
    // was saved, which is the meaningful part of this test.
    const testEmail = `playwright-test-${Date.now()}@example.com`

    // ── Fill universal fields ──────────────────────────────────────────────
    await page.getByPlaceholder('First name').fill('Playwright')
    await page.getByPlaceholder('Last name').fill('Test')
    await page.getByPlaceholder('you@example.com').fill(testEmail)
    await selectRole(page, 'creator')
    await page.getByPlaceholder('A short introduction…').fill(
      'This is an automated Playwright test submission. Safe to delete.'
    )

    // ── Fill creator-specific fields ───────────────────────────────────────
    // Primary platform — second <select> on page after role is selected
    await page.locator('select').nth(1).selectOption('youtube')
    // Channel / profile URL — second https:// field (website_url is the first)
    await page.getByPlaceholder('https://').nth(1).fill('https://youtube.com/@playwright-test')

    // ── Submit ─────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Submit application' }).click()

    // Allow up to 15 s for the network round-trips (Supabase insert + Resend)
    try {
      await page.waitForURL('**/apply/pending', { timeout: 15000 })
      await expect(page.getByText(/application received/i)).toBeVisible()
    } catch {
      // Resend free-tier restriction: email to @example.com fails.
      // The record was still saved — verify the error message says so.
      await expect(
        page.getByText(/application was saved.*confirmation email failed/i)
      ).toBeVisible({ timeout: 5000 })
    }

    // ── Verify the database record ─────────────────────────────────────────
    // Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
    // The service role is needed because the applications table has no public SELECT policy.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.warn(
        'Skipping DB assertion — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'
      )
      return
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('applications')
      .select('email, status, desired_role, first_name')
      .eq('email', testEmail)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.status).toBe('pending')
    expect(data!.desired_role).toBe('creator')
    expect(data!.first_name).toBe('Playwright')

    console.log(
      `\nTest record created: email=${testEmail} — clean up manually in Supabase if needed.`
    )
  })
})

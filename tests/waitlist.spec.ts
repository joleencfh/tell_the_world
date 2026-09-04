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

const ALL_ROLES = [
  'Creator',
  'Journalist',
  'Researcher/Expert',
  'Organisation',
  'Communications Specialist',
  'Other',
]

async function openWaitlistModal(page: Page) {
  await page.getByRole('button', { name: 'Join the waitlist' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

function selectWaitlistRole(page: Page, label: string) {
  return page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click()
}

function dialog(page: Page) {
  return page.getByRole('dialog')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Waitlist modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // ── 1. Rendering ──────────────────────────────────────────────────────────

  test('opens with all six "I am a" role options visible', async ({ page }) => {
    await openWaitlistModal(page)
    for (const label of ALL_ROLES) {
      await expect(dialog(page).getByRole('button', { name: label, exact: true })).toBeVisible()
    }
  })

  test('no uncaught JS errors while opening the modal and switching between every role', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await openWaitlistModal(page)
    for (const label of ALL_ROLES) {
      await selectWaitlistRole(page, label)
    }

    expect(errors).toHaveLength(0)
  })

  // ── 2. Per-role field labeling and required-ness ─────────────────────────
  // Regression coverage for the reported bug: the link field is only ever
  // required for creator (a "Channel link"). For every other role it must
  // stay optional and labeled as a generic LinkedIn/website field — a user
  // should be able to submit without filling it in.

  for (const label of ALL_ROLES.filter((r) => r !== 'Creator')) {
    test(`${label} role: link field is optional, labeled "LinkedIn or personal site"`, async ({ page }) => {
      await openWaitlistModal(page)
      await selectWaitlistRole(page, label)

      await expect(dialog(page).getByText('LinkedIn or personal site')).toBeVisible()
      await expect(dialog(page).getByPlaceholder('linkedin.com/in/…')).toBeVisible()

      await dialog(page).getByPlaceholder('Jordan Reyes').fill(`Test ${label}`)
      await dialog(page).getByPlaceholder('you@example.com').fill('nobody@example.com')

      // Link and affiliation both left blank — submit must not be disabled.
      await expect(dialog(page).getByRole('button', { name: 'Join the waitlist' })).toBeEnabled()
    })
  }

  test('Creator role: affiliation and channel link become required — submit stays disabled until both are filled', async ({ page }) => {
    await openWaitlistModal(page)
    await selectWaitlistRole(page, 'Creator')

    await expect(dialog(page).getByText('Platform & channel name')).toBeVisible()
    await expect(dialog(page).getByText('Channel link')).toBeVisible()
    await expect(dialog(page).getByPlaceholder('youtube.com/@…')).toBeVisible()

    const submit = dialog(page).getByRole('button', { name: 'Join the waitlist' })

    await dialog(page).getByPlaceholder('Jordan Reyes').fill('Test Creator')
    await dialog(page).getByPlaceholder('you@example.com').fill('nobody@example.com')
    await expect(submit).toBeDisabled() // affiliation + link still empty

    await dialog(page).getByPlaceholder('e.g. YouTube, Jordan’s AI Corner').fill('YouTube, Test Channel')
    await expect(submit).toBeDisabled() // link still empty

    await dialog(page).getByPlaceholder('youtube.com/@…').fill('youtube.com/@testcreator')
    await expect(submit).toBeEnabled()
  })

  // ── 3. Full submissions ──────────────────────────────────────────────────
  // Two real submissions only — the server enforces a 3-per-10-min per-IP
  // rate limit (lib/waitlist/actions.ts), so this file keeps actual inserts
  // to a minimum, same approach as tests/application.spec.ts.

  test('regression: Creator submits a bare-domain channel link (no https://, exactly what the placeholder shows) and succeeds', async ({ page }) => {
    // Previously this failed server-side with "Please enter a valid LinkedIn
    // or website URL" — new URL() rejected a scheme-less string, and the
    // message named LinkedIn even though creators are asked for a channel
    // link. lib/waitlist/actions.ts now normalizes a scheme-less value to
    // https:// before validating, and the error text is role-aware.
    const testEmail = `playwright-wl-creator-${Date.now()}@example.com`

    await openWaitlistModal(page)
    await selectWaitlistRole(page, 'Creator')
    await dialog(page).getByPlaceholder('Jordan Reyes').fill('Playwright Creator')
    await dialog(page).getByPlaceholder('you@example.com').fill(testEmail)
    await dialog(page).getByPlaceholder('e.g. YouTube, Jordan’s AI Corner').fill('YouTube, Playwright Test')
    await dialog(page).getByPlaceholder('youtube.com/@…').fill('youtube.com/@playwright-test')

    await dialog(page).getByRole('button', { name: 'Join the waitlist' }).click()

    await expect(dialog(page).getByRole('heading', { name: /you.re on the list/i })).toBeVisible({ timeout: 10000 })
    await expect(dialog(page).getByText(/valid LinkedIn or website URL/i)).not.toBeVisible()

    await verifyAndCleanUp(testEmail, (row) => {
      expect(row.role).toBe('creator')
      // Stored with the protocol the server normalized it to.
      expect(row.linkedin_or_website_url).toBe('https://youtube.com/@playwright-test')
    })
  })

  test('Organisation submits with the optional link field left empty and succeeds', async ({ page }) => {
    const testEmail = `playwright-wl-org-${Date.now()}@example.com`

    await openWaitlistModal(page)
    await selectWaitlistRole(page, 'Organisation')
    await dialog(page).getByPlaceholder('Jordan Reyes').fill('Playwright Org Contact')
    await dialog(page).getByPlaceholder('you@example.com').fill(testEmail)
    // affiliation and link both left blank — only creator requires them.

    await dialog(page).getByRole('button', { name: 'Join the waitlist' }).click()

    await expect(dialog(page).getByRole('heading', { name: /you.re on the list/i })).toBeVisible({ timeout: 10000 })

    await verifyAndCleanUp(testEmail, (row) => {
      expect(row.role).toBe('organisation')
      expect(row.linkedin_or_website_url).toBeNull()
    })
  })

  // ── DB helper ─────────────────────────────────────────────────────────────

  async function verifyAndCleanUp(
    email: string,
    assertRow: (row: { role: string; linkedin_or_website_url: string | null; full_name: string }) => void,
  ) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.warn('Skipping DB assertion — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
      return
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('waitlist_signups')
      .select('role, full_name, linkedin_or_website_url')
      .eq('email', email)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    if (data) assertRow(data as { role: string; linkedin_or_website_url: string | null; full_name: string })

    await supabase.from('waitlist_signups').delete().eq('email', email)
  }
})

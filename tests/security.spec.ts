import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Security regression tests
//
// Prerequisites:
//   1. Seed the test briefs:  bun scripts/seed-test-briefs.ts
//      (creates test-public-brief / test-members-brief with known section
//       content — see the seed script for the exact strings asserted below)
//   2. Apply supabase/013_public_brief_read.sql and
//      supabase/018_anon_tldr_read.sql in the Supabase SQL Editor.
//
// All tests run as a logged-out visitor.
// ---------------------------------------------------------------------------

const MEMBERS_URL = '/briefs/test-members-brief'
const PUBLIC_URL = '/briefs/test-public-brief'

// Known section content from scripts/seed-test-briefs.ts
const SECTION_CONTENT = 'Test content for featured news.'
const SECTION_SOURCE = 'A basic source for testing'
const TLDR_CONTENT = 'This is a test brief used for end-to-end testing. It is safe to ignore.'

// ---------------------------------------------------------------------------
// Members-only content must not be served to logged-out visitors at all —
// not just visually hidden. We assert on the raw HTTP response body, which
// includes the RSC payload where hidden props would leak.
// ---------------------------------------------------------------------------

test.describe('Members-only brief — logged-out visitor', () => {
  test('section content is absent from the raw page response', async ({ request }) => {
    const response = await request.get(MEMBERS_URL)
    expect(response.ok()).toBeTruthy()

    const body = await response.text()
    expect(body).not.toContain(SECTION_CONTENT)
    expect(body).not.toContain(SECTION_SOURCE)
  })

  test('title and tldr are still served for the locked preview', async ({ request }) => {
    const response = await request.get(MEMBERS_URL)
    const body = await response.text()
    expect(body).toContain('Test Members Brief')
    // 018_anon_tldr_read.sql: the tldr brief_section is readable regardless
    // of brief visibility, distinct from other section types which stay
    // gated to public briefs (asserted absent above).
    expect(body).toContain(TLDR_CONTENT)
  })
})

test.describe('Public brief — logged-out visitor', () => {
  test('section content is served in full', async ({ request }) => {
    const response = await request.get(PUBLIC_URL)
    expect(response.ok()).toBeTruthy()

    const body = await response.text()
    expect(body).toContain(SECTION_CONTENT)
  })
})

// ---------------------------------------------------------------------------
// Admin surface
// ---------------------------------------------------------------------------

test.describe('Admin routes — logged-out visitor', () => {
  test('/admin redirects to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/admin/briefs/some-id redirects to /login', async ({ page }) => {
    await page.goto('/admin/briefs/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// Application form spam controls
// ---------------------------------------------------------------------------

test.describe('Application submission limits', () => {
  // Opt-in: submitting 4 real applications trips the per-IP limiter for every
  // other test in the run (all tests share localhost's IP) and leaves rows to
  // clean up. Run explicitly with:
  //   RATE_LIMIT_E2E=1 bunx playwright test tests/security.spec.ts
  test.skip(!process.env.RATE_LIMIT_E2E, 'Set RATE_LIMIT_E2E=1 to run the rate limit test')

  test('repeated submissions from the same client are rate limited', async ({ page }) => {
    // The server action allows 3 submissions per 10 minutes per IP. Submitting
    // the form 4 times must surface the rate-limit message on the 4th attempt.
    // Uses a unique email per attempt so the duplicate-email check (which
    // fires after the rate limiter) doesn't mask it.
    test.setTimeout(120_000)

    let lastError = ''

    for (let i = 0; i < 4; i++) {
      await page.goto('/apply')

      await page.getByPlaceholder('First name').fill('Rate')
      await page.getByPlaceholder('Last name').fill('Limit Test')
      await page
        .getByPlaceholder('you@example.com')
        .fill(`rate-limit-test-${Date.now()}-${i}@example.com`)
      // Role <select> is the first select on the page
      await page.locator('select').first().selectOption('expert')
      await page
        .getByPlaceholder('e.g. Oxford Future of Humanity Institute')
        .fill('Test University')
      await page.getByPlaceholder('e.g. Research Scientist').fill('Tester')
      await page
        .getByPlaceholder('A short introduction…')
        .fill('Automated rate limit regression test. Safe to delete.')

      await page.getByRole('button', { name: 'Submit application' }).click()

      // Either we land on /apply/pending (accepted) or an error is shown
      await page.waitForURL('**/apply/pending', { timeout: 10_000 }).catch(() => {})

      if (!page.url().includes('/apply/pending')) {
        lastError = (await page.locator('body').innerText()) ?? ''
      }
    }

    expect(lastError).toContain('Too many submissions')
  })
})

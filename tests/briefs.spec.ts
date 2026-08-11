import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Brief page visibility tests
//
// Prerequisites — seed these two records in Supabase before running:
//
//   briefs table:
//     { title: 'Test Public Brief',   slug: 'test-public-brief',   visibility: 'public' }
//     { title: 'Test Members Brief',  slug: 'test-members-brief',  visibility: 'members_only' }
//
//   Add at least one brief_section row per brief so sections render.
//   All tests run as a logged-out visitor (no auth setup required).
// ---------------------------------------------------------------------------

const PUBLIC_URL  = '/briefs/test-public-brief'
const MEMBERS_URL = '/briefs/test-members-brief'

// ---------------------------------------------------------------------------
// Public brief — logged-out visitor
// ---------------------------------------------------------------------------

test.describe('Public brief — logged-out visitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLIC_URL)
  })

  test('shows the brief title as the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Test Public Brief',
    )
  })

  test('shows the TLDR below the title as its own numbered section', async ({ page }) => {
    // TL;DR is split out of the hero into its own SectionHeader'd section
    // (two-ink-bold-plan.md §3 Part 1) — no longer an inline hero paragraph.
    await expect(page.getByRole('heading', { name: 'TL;DR' })).toBeVisible()
  })

  test('shows the full brief sections without a lock', async ({ page }) => {
    // Logged-out visitors can read public briefs in full — no "Members Only"
    // panel should be rendered
    await expect(page.getByText('Members Only')).not.toBeVisible()
  })

  test('does not show the locked "Apply to Join" CTA', async ({ page }) => {
    // The lock panel CTA uses the text "Apply to Join"; the nav link says "Apply"
    // We check specifically for the lock panel button text
    const lockCta = page.getByRole('link', { name: 'Apply to Join' })
    await expect(lockCta).not.toBeVisible()
  })

  test('nav links point to /apply and /login for logged-out visitors', async ({ page }) => {
    const nav = page.getByRole('banner')
    await expect(nav.getByRole('link', { name: 'Apply' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Login' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Members-only brief — logged-out visitor sees title and TLDR
// ---------------------------------------------------------------------------

test.describe('Members-only brief — logged-out visitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MEMBERS_URL)
  })

  test('shows the brief title as the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Test Members Brief',
    )
  })

  test('shows the TL;DR section — 018 grants anon read on tldr sections regardless of brief visibility', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'TL;DR' })).toBeVisible()
  })

  test('does not show other section content headings', async ({ page }) => {
    // These h2s are only rendered when sections are unlocked
    await expect(
      page.getByRole('heading', { name: 'Featured News' }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Going Deeper' }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Common Questions' }),
    ).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Members-only brief — locked state indicators
// ---------------------------------------------------------------------------

test.describe('Members-only brief — locked state indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MEMBERS_URL)
  })

  test('shows the "Members Only" heading in the lock panel', async ({ page }) => {
    await expect(page.getByText('Members Only')).toBeVisible()
  })

  test('shows an "Apply to Join" link in the lock panel', async ({ page }) => {
    const applyLink = page.getByRole('link', { name: 'Apply to Join' })
    await expect(applyLink).toBeVisible()
    await expect(applyLink).toHaveAttribute('href', '/apply')
  })

  test('"Apply to Join" link navigates to the application form', async ({ page }) => {
    await page.getByRole('link', { name: 'Apply to Join' }).click()
    await expect(page).toHaveURL('/apply')
  })

  test('shows a "Already a member? Login" link in the lock panel', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /already a member/i })
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveAttribute('href', '/login')
  })
})

// ---------------------------------------------------------------------------
// Q&A section — not visible to logged-out visitors on any brief
// ---------------------------------------------------------------------------

test.describe('Q&A section — not visible to logged-out visitors', () => {
  test('Q&A section is absent on a public brief', async ({ page }) => {
    await page.goto(PUBLIC_URL)
    await expect(
      page.getByRole('heading', { name: 'Community Q&A' }),
    ).not.toBeVisible()
  })

  test('Q&A section is absent on a members-only brief', async ({ page }) => {
    await page.goto(MEMBERS_URL)
    await expect(
      page.getByRole('heading', { name: 'Community Q&A' }),
    ).not.toBeVisible()
  })

  test('"Submit Question" form is not present on a public brief', async ({ page }) => {
    await page.goto(PUBLIC_URL)
    await expect(page.getByRole('button', { name: 'Submit Question' })).not.toBeVisible()
  })

  test('"Submit Question" form is not present on a members-only brief', async ({ page }) => {
    await page.goto(MEMBERS_URL)
    await expect(page.getByRole('button', { name: 'Submit Question' })).not.toBeVisible()
  })
})

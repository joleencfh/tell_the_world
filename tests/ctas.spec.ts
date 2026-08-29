/**
 * Calls to Action — end-to-end tests (two-ink-bold-plan.md Part 6)
 *
 * Prerequisites
 * ─────────────
 * 1. Seed the test briefs:  bun scripts/seed-test-briefs.ts
 * 2. Apply supabase/026_brief_ctas.sql in the Supabase SQL Editor.
 * 3. `playwright/.auth/expert.json` must exist (written by global-setup.ts).
 *
 * What this does — and doesn't — cover
 * ─────────────────────────────────────
 * Same split as tests/faq-answers.spec.ts (no admin auth fixture yet, see
 * two-ink-bold-plan.md's Part 9b): the submission test drives the real
 * "Suggest a call to action" modal and verifies a pending brief_ctas row
 * lands in the database with the right shape; the display test seeds an
 * already-published row directly (bypassing the approval UI) and verifies
 * the carousel renders it. The approve/dismiss buttons themselves are a
 * one-line status update / delete, already covered by lib/admin/actions.ts
 * following the identical pattern as FAQ-answer approval.
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  getTestBrief,
  findCtas,
  insertPublishedCta,
  deleteTestCtas,
  TestUser,
  TestBrief,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const expertEmail = process.env.TEST_EXPERT_EMAIL ?? ''
if (!expertEmail) {
  throw new Error('TEST_EXPERT_EMAIL must be set in .env.local')
}

const BRIEF_SLUG = 'test-public-brief'

// ---------------------------------------------------------------------------
// Submission — expert-authenticated
// ---------------------------------------------------------------------------

test.describe('Calls to Action "Suggest a call to action" — authenticated expert', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  let expert: TestUser
  let brief: TestBrief
  // Set by each test before it submits, so afterEach can clean up only this
  // test's own row. Titles are timestamped per-test (not a fixed literal)
  // because this brief is shared across concurrent CI runs — a fixed title
  // would let one run's insert/delete race another's.
  let currentTitle = ''

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    if (currentTitle) await deleteTestCtas(brief.id, currentTitle)
  })

  test('submitting a CTA creates a pending brief_ctas row', async ({ page }) => {
    currentTitle = `Playwright test CTA ${Date.now()}`
    await page.goto(`/briefs/${BRIEF_SLUG}`)

    await page.getByRole('button', { name: '+ New CTA' }).click()
    await expect(page.getByRole('dialog', { name: 'Suggest a call to action' })).toBeVisible()

    await page.getByLabel('Title').fill(currentTitle)
    await page.getByLabel('Description (optional)').fill('A Playwright-submitted description.')
    await page.getByLabel('Link URL').fill('https://example.com/playwright-cta')
    await page.getByRole('button', { name: 'Submit for review' }).click()

    await expect(page.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })

    const rows = await findCtas(brief.id)
    const row = rows.find((r) => r.title === currentTitle)
    expect(row).toBeTruthy()
    expect(row!.author_user_id).toBe(expert.id)
    expect(row!.link_url).toBe('https://example.com/playwright-cta')
    expect(row!.status).toBe('pending')
  })

  test('a pending CTA does not appear in the carousel', async ({ page }) => {
    currentTitle = `Playwright test CTA ${Date.now()}`
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: '+ New CTA' }).click()
    await page.getByLabel('Title').fill(currentTitle)
    await page.getByLabel('Link URL').fill('https://example.com/playwright-cta')
    await page.getByRole('button', { name: 'Submit for review' }).click()
    await expect(page.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })

    await page.reload()
    await expect(page.getByText(currentTitle)).not.toBeVisible()
  })

  test('the submit button is disabled until title and link URL are filled', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: '+ New CTA' }).click()

    const submit = page.getByRole('button', { name: 'Submit for review' })
    await expect(submit).toBeDisabled()

    await page.getByLabel('Title').fill('x')
    await expect(submit).toBeDisabled()

    await page.getByLabel('Link URL').fill('https://example.com')
    await expect(submit).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Display — published CTAs, logged-out visitor
// ---------------------------------------------------------------------------

test.describe('Calls to Action carousel — published CTAs, logged-out visitor', () => {
  let expert: TestUser
  let brief: TestBrief
  // Timestamped per-test for the same reason as the describe block above —
  // avoids racing a concurrent CI run's insert/delete on this shared brief.
  let currentTitle = ''

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    if (currentTitle) await deleteTestCtas(brief.id, currentTitle)
  })

  test('zero CTAs shows the empty state, not an empty carousel shell', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await expect(page.getByText('No calls to action yet.')).toBeVisible()
  })

  test('a published CTA renders with title, description, link, and author', async ({ page }) => {
    currentTitle = `Playwright published CTA ${Date.now()}`
    await insertPublishedCta(brief.id, expert.id, {
      title: currentTitle,
      description: 'Read the full report for more detail.',
      linkUrl: 'https://example.com/published-cta',
    })

    await page.goto(`/briefs/${BRIEF_SLUG}`)

    await expect(page.getByText(currentTitle)).toBeVisible()
    await expect(page.getByText('Read the full report for more detail.')).toBeVisible()
    // The arrow link's accessible name comes from the CTA's own title now
    // (no more author-chosen button label — see ctas.tsx's own comment).
    const link = page.getByRole('link', { name: currentTitle })
    await expect(link).toHaveAttribute('href', 'https://example.com/published-cta')

    const authorName = expert.display_name ?? expertEmail.split('@')[0]
    await expect(page.getByText(authorName, { exact: false }).first()).toBeVisible()
  })
})

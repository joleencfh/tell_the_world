/**
 * FAQ accordion — "more answers" end-to-end tests
 * (two-ink-bold-plan.md Part 4b)
 *
 * Prerequisites
 * ─────────────
 * 1. Seed the test briefs:  bun scripts/seed-test-briefs.ts
 *    (adds a faq-type section to test-public-brief with the exact
 *     question text asserted below)
 * 2. Apply supabase/021_brief_faq_answers.sql in the Supabase SQL Editor.
 * 3. `playwright/.auth/expert.json` must exist (written by global-setup.ts).
 *
 * What this does — and doesn't — cover
 * ─────────────────────────────────────
 *   - the submission test verifies a pending row lands in the database with
 *     the right shape and is NOT visible under "More answers" while pending
 *   - the display test seeds an already-published row directly (bypassing
 *     the approval UI, same as findMessage/deleteTestMessages does for the
 *     contact-modal tests) and verifies it renders correctly
 *   - the moderation-loop test below (two-ink-bold-plan.md Part 9b's payoff
 *     for the admin auth fixture) drives the real thing end to end: submit
 *     as expert, click the actual Approve button in the admin UI, confirm
 *     it shows up for a logged-out visitor. It needs
 *     playwright/.auth/admin.json (see tests/two-ink-bold-11f-admin.spec.ts's
 *     header comment for when that exists and reaches /admin) and skips
 *     itself with an explanatory message otherwise, same pattern as that
 *     file and tests/security.spec.ts's "Admin routes — admin session"
 *     block.
 * Together these cover the things that actually differ per-request
 * (validation + gating, read-side rendering, and — when the fixture is
 * available — the real moderation click-through).
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'
import {
  getTestUser,
  getTestBrief,
  findFaqAnswers,
  insertPublishedFaqAnswer,
  deleteFaqAnswers,
  TestUser,
  TestBrief,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const expertEmail = process.env.TEST_EXPERT_EMAIL ?? ''
if (!expertEmail) {
  throw new Error('TEST_EXPERT_EMAIL must be set in .env.local')
}

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

const BRIEF_SLUG = 'test-public-brief'
const QUESTION = 'What is this test brief for?'

// ---------------------------------------------------------------------------
// Submission — expert-authenticated
// ---------------------------------------------------------------------------

test.describe('FAQ "Add an answer" — authenticated expert', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  let expert: TestUser
  let brief: TestBrief
  // Set by each test before it submits, so afterEach can delete only this
  // test's own row. QUESTION is shared, fixed fixture text (it has to match
  // the seeded accordion trigger), so deleting by question alone would also
  // wipe out a concurrent CI run's in-flight row on the same brief.
  let currentBody = ''

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    if (currentBody) await deleteFaqAnswers(brief.id, QUESTION, currentBody)
  })

  test('submitting an answer creates a pending brief_faq_answers row', async ({ page }) => {
    const body = (currentBody = `Playwright test answer ${Date.now()}`)

    await page.goto(`/briefs/${BRIEF_SLUG}`)

    const trigger = page.getByRole('button', { name: QUESTION })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.getByRole('button', { name: /add an answer/i }).click()
    await page.locator('[contenteditable="true"]').click()
    await page.keyboard.type(body)
    await page.getByRole('button', { name: /submit answer/i }).click()

    await expect(page.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })

    const rows = await findFaqAnswers(brief.id, QUESTION, body)
    expect(rows).toHaveLength(1)
    expect(rows[0].author_user_id).toBe(expert.id)
    expect(rows[0].body).toBe(body)
    expect(rows[0].status).toBe('pending')
  })

  test('a pending answer does not appear under "More answers"', async ({ page }) => {
    // Submit, then reload fresh — the pending row must not be readable.
    const body = (currentBody = `Playwright pending-visibility test ${Date.now()}`)

    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()
    await page.getByRole('button', { name: /add an answer/i }).click()
    await page.locator('[contenteditable="true"]').click()
    await page.keyboard.type(body)
    await page.getByRole('button', { name: /submit answer/i }).click()
    await expect(page.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })

    await page.reload()
    await page.getByRole('button', { name: QUESTION }).click()
    await expect(page.getByRole('button', { name: /more answers/i })).not.toBeVisible()
  })

  test('the submit button is disabled until the editor has content', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()
    await page.getByRole('button', { name: /add an answer/i }).click()

    const submit = page.getByRole('button', { name: /submit answer/i })
    await expect(submit).toBeDisabled()

    await page.locator('[contenteditable="true"]').click()
    await page.keyboard.type('x')
    await expect(submit).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Display — published answers, logged-out visitor
// ---------------------------------------------------------------------------

test.describe('FAQ "More answers" — published answers, logged-out visitor', () => {
  let expert: TestUser
  let brief: TestBrief
  // Deleted individually in afterEach (rather than a blanket delete by
  // QUESTION) so a concurrent CI run's own published row on this shared
  // question isn't wiped out mid-test.
  let currentBodies: string[] = []

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    await Promise.all(currentBodies.map((body) => deleteFaqAnswers(brief.id, QUESTION, body)))
    currentBodies = []
  })

  test('a question with zero answers shows no "More answers" toggle', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()
    await expect(page.getByRole('button', { name: /more answers/i })).not.toBeVisible()
  })

  test('published answers render under "More answers (N)" with author and body', async ({ page }) => {
    const bodyOne = `The metric that matters is usable compute per run, not aggregate capacity. ${Date.now()}`
    const bodyTwo = `We track this quarterly and the gap has narrowed but not closed. ${Date.now()}`
    currentBodies = [bodyOne, bodyTwo]
    await insertPublishedFaqAnswer(brief.id, QUESTION, expert.id, bodyOne)
    await insertPublishedFaqAnswer(brief.id, QUESTION, expert.id, bodyTwo)

    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()

    const toggle = page.getByRole('button', { name: 'More answers (2)' })
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    // Cards aren't mounted until the toggle is opened.
    await expect(page.getByText(bodyOne)).not.toBeVisible()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText(bodyOne)).toBeVisible()
    await expect(page.getByText(bodyTwo)).toBeVisible()

    const authorName = expert.display_name ?? expertEmail.split('@')[0]
    await expect(page.getByText(authorName, { exact: false }).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Moderation — full loop, driven through the real admin UI
// (two-ink-bold-plan.md Part 9b)
// ---------------------------------------------------------------------------

test.describe('FAQ answer moderation — full loop (expert submits, admin approves)', () => {
  let brief: TestBrief
  // Scoped to this test's own row (not a blanket delete by QUESTION) so a
  // concurrent CI run's in-flight row on the same shared question survives.
  let currentBody = ''

  test.beforeAll(async () => {
    brief = await getTestBrief(BRIEF_SLUG)
  })

  test.afterEach(async () => {
    if (currentBody) await deleteFaqAnswers(brief.id, QUESTION, currentBody)
  })

  test('expert submits, admin approves via Approve button, then a logged-out visitor sees it under "More answers"', async ({ browser }) => {
    test.skip(
      !adminFixtureExists,
      'playwright/.auth/admin.json not generated — set TEST_ADMIN_EMAIL and rerun the suite',
    )

    const body = (currentBody = `Playwright moderation-loop test ${Date.now()}`)

    // 1. Submit as expert — same flow as the submission tests above, in its
    //    own context so it doesn't share state with the admin/visitor steps.
    const expertContext = await browser.newContext({ storageState: 'playwright/.auth/expert.json' })
    try {
      const expertPage = await expertContext.newPage()
      await expertPage.goto(`/briefs/${BRIEF_SLUG}`)
      await expertPage.getByRole('button', { name: QUESTION }).click()
      await expertPage.getByRole('button', { name: /add an answer/i }).click()
      await expertPage.locator('[contenteditable="true"]').click()
      await expertPage.keyboard.type(body)
      await expertPage.getByRole('button', { name: /submit answer/i }).click()
      await expect(expertPage.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })
    } finally {
      await expertContext.close()
    }

    const rows = await findFaqAnswers(brief.id, QUESTION, body)
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('pending')

    // 2. Approve as admin — click the real Approve button, not a direct
    //    service-role status update.
    const adminContext = await browser.newContext({ storageState: adminFixturePath })
    try {
      const adminPage = await adminContext.newPage()
      await adminPage.goto('/admin')
      test.skip(
        !adminPage.url().includes('/admin'),
        'Redirected away from /admin — this dev server must be started with ADMIN_EMAIL=<TEST_ADMIN_EMAIL value> (see tests/two-ink-bold-11f-admin.spec.ts header comment)',
      )

      await adminPage.getByRole('button', { name: /faq answers/i }).click()

      // Scope to this answer's own card (unique body text) rather than a
      // loose "div containing this text" filter, which would also match
      // every ancestor wrapper and make the Approve lookup ambiguous.
      const bodyText = adminPage.getByText(body, { exact: true })
      await expect(bodyText).toBeVisible()
      const card = bodyText.locator('xpath=ancestor::div[contains(@class, "border-line")][1]')
      await card.getByRole('button', { name: 'Approve' }).click()

      // The action's revalidatePath('/admin') drops it from the pending list.
      await expect(bodyText).not.toBeVisible({ timeout: 10000 })
    } finally {
      await adminContext.close()
    }

    const rowsAfterApproval = await findFaqAnswers(brief.id, QUESTION, body)
    expect(rowsAfterApproval[0]?.status).toBe('published')

    // 3. Confirm it renders for a logged-out visitor.
    const visitorContext = await browser.newContext()
    try {
      const visitorPage = await visitorContext.newPage()
      await visitorPage.goto(`/briefs/${BRIEF_SLUG}`)
      await visitorPage.getByRole('button', { name: QUESTION }).click()
      const toggle = visitorPage.getByRole('button', { name: /more answers/i })
      await expect(toggle).toBeVisible()
      await toggle.click()
      await expect(visitorPage.getByText(body)).toBeVisible()
    } finally {
      await visitorContext.close()
    }
  })
})

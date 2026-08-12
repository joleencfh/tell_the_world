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
 * There's no admin auth fixture yet (see two-ink-bold-plan.md's engineering
 * conventions section), so the admin-approval step itself isn't driven
 * through the admin UI here. Instead:
 *   - the submission test verifies a pending row lands in the database with
 *     the right shape and is NOT visible under "More answers" while pending
 *   - the display test seeds an already-published row directly (bypassing
 *     the approval UI, same as findMessage/deleteTestMessages does for the
 *     contact-modal tests) and verifies it renders correctly
 * Together these cover the two things that actually differ per-request
 * (validation + gating, and read-side rendering); the approval button
 * itself is a one-line status update already covered by lib/admin/actions.ts
 * following the identical pattern as correction-proposal approval.
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
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

const BRIEF_SLUG = 'test-public-brief'
const QUESTION = 'What is this test brief for?'

// ---------------------------------------------------------------------------
// Submission — expert-authenticated
// ---------------------------------------------------------------------------

test.describe('FAQ "Add an answer" — authenticated expert', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  let expert: TestUser
  let brief: TestBrief

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    await deleteFaqAnswers(brief.id, QUESTION)
  })

  test('submitting an answer creates a pending brief_faq_answers row', async ({ page }) => {
    const body = `Playwright test answer ${Date.now()}`

    await page.goto(`/briefs/${BRIEF_SLUG}`)

    const trigger = page.getByRole('button', { name: QUESTION })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.getByRole('button', { name: /add an answer/i }).click()
    await page.getByPlaceholder(/share your own answer/i).fill(body)
    await page.getByRole('button', { name: /submit answer/i }).click()

    await expect(page.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })

    const rows = await findFaqAnswers(brief.id, QUESTION)
    expect(rows).toHaveLength(1)
    expect(rows[0].author_user_id).toBe(expert.id)
    expect(rows[0].body).toBe(body)
    expect(rows[0].status).toBe('pending')
  })

  test('a pending answer does not appear under "More answers"', async ({ page }) => {
    // Submit, then reload fresh — the pending row must not be readable.
    const body = `Playwright pending-visibility test ${Date.now()}`

    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()
    await page.getByRole('button', { name: /add an answer/i }).click()
    await page.getByPlaceholder(/share your own answer/i).fill(body)
    await page.getByRole('button', { name: /submit answer/i }).click()
    await expect(page.getByText(/submitted for review/i)).toBeVisible({ timeout: 10000 })

    await page.reload()
    await page.getByRole('button', { name: QUESTION }).click()
    await expect(page.getByRole('button', { name: /more answers/i })).not.toBeVisible()
  })

  test('the submit button is disabled until the textarea has content', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()
    await page.getByRole('button', { name: /add an answer/i }).click()

    const submit = page.getByRole('button', { name: /submit answer/i })
    await expect(submit).toBeDisabled()

    await page.getByPlaceholder(/share your own answer/i).fill('x')
    await expect(submit).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Display — published answers, logged-out visitor
// ---------------------------------------------------------------------------

test.describe('FAQ "More answers" — published answers, logged-out visitor', () => {
  let expert: TestUser
  let brief: TestBrief

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    await deleteFaqAnswers(brief.id, QUESTION)
  })

  test('a question with zero answers shows no "More answers" toggle', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    await page.getByRole('button', { name: QUESTION }).click()
    await expect(page.getByRole('button', { name: /more answers/i })).not.toBeVisible()
  })

  test('published answers render under "More answers (N)" with author and body', async ({ page }) => {
    const bodyOne = 'The metric that matters is usable compute per run, not aggregate capacity.'
    const bodyTwo = 'We track this quarterly and the gap has narrowed but not closed.'
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

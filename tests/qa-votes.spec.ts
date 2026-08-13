/**
 * Community Q&A — upvote toggle end-to-end tests
 * (two-ink-bold-plan.md Part 5 follow-up)
 *
 * Prerequisites
 * ─────────────
 * 1. Apply supabase/025_vote_delete_policies.sql in the Supabase SQL Editor
 *    — without it, voteQuestion's delete branch is rejected by RLS and a
 *    vote can never be removed (the bug these tests were written to catch).
 * 2. `playwright/.auth/creator.json` must exist (written by global-setup.ts).
 *
 * What this covers
 * ─────────────────
 * The upvote button used to be one-way: voteQuestion upserted with
 * ignoreDuplicates, so a second click on an already-voted question was a
 * silent no-op and the vote could never be undone. voteQuestion now
 * toggles (insert if absent, delete if present) — these tests seed a
 * fresh question per test, vote once, assert the row + UI reflect "voted",
 * vote again, and assert both revert to "not voted". Also covers the
 * hover tooltip text and the pointer cursor added alongside the fix.
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  getTestBrief,
  insertApprovedQuestion,
  deleteTestQuestion,
  hasQuestionVote,
  TestUser,
  TestBrief,
  QuestionRecord,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

const BRIEF_SLUG = 'test-public-brief'

test.describe('Community Q&A — upvote toggle', () => {
  test.use({ storageState: 'playwright/.auth/creator.json' })

  let creator: TestUser
  let brief: TestBrief
  let question: QuestionRecord

  test.beforeAll(async () => {
    ;[creator, brief] = await Promise.all([getTestUser(creatorEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.beforeEach(async () => {
    question = await insertApprovedQuestion(brief.id, creator.id, `Playwright upvote-toggle test ${Date.now()}`)
  })

  test.afterEach(async () => {
    await deleteTestQuestion(question.id)
  })

  test('clicking the upvote button casts a vote, and clicking it again removes it', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    const card = page.locator('div.outline', { has: page.getByText(question.question_text, { exact: true }) })

    const voteBtn = card.getByRole('button', { name: 'Upvote' })
    await expect(voteBtn).toBeVisible()
    // Zero votes: the count badge next to the triangle isn't rendered yet.
    await expect(card.getByRole('button', { name: '1' })).not.toBeVisible()

    await voteBtn.click()
    await expect(card.getByRole('button', { name: 'Remove your upvote' })).toBeVisible()
    await expect(card.getByRole('button', { name: '1' })).toBeVisible()
    expect(await hasQuestionVote(question.id, creator.id)).toBe(true)

    // The bug: this second click used to be a silent no-op.
    await card.getByRole('button', { name: 'Remove your upvote' }).click()
    await expect(card.getByRole('button', { name: 'Upvote' })).toBeVisible()
    await expect(card.getByRole('button', { name: '1' })).not.toBeVisible()
    expect(await hasQuestionVote(question.id, creator.id)).toBe(false)
  })

  test('the upvote button shows an "Upvote" / "Remove upvote" tooltip on hover', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    const card = page.locator('div.outline', { has: page.getByText(question.question_text, { exact: true }) })
    const voteBtn = card.getByRole('button', { name: 'Upvote' })

    const tooltipId = await voteBtn.getAttribute('aria-describedby')
    expect(tooltipId).toBeTruthy()
    const tooltip = page.locator(`#${tooltipId}`)

    await voteBtn.hover()
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveText('Upvote')

    await voteBtn.click()
    await expect(card.getByRole('button', { name: 'Remove your upvote' })).toBeVisible()
    await card.getByRole('button', { name: 'Remove your upvote' }).hover()
    await expect(tooltip).toHaveText('Remove upvote')
  })

  test('the upvote button and vote count show a pointer cursor, not the default arrow', async ({ page }) => {
    await page.goto(`/briefs/${BRIEF_SLUG}`)
    const card = page.locator('div.outline', { has: page.getByText(question.question_text, { exact: true }) })

    const voteBtn = card.getByRole('button', { name: 'Upvote' })
    await expect(voteBtn).toHaveCSS('cursor', 'pointer')

    const expandBtn = card.getByRole('button', { name: 'Expand answers' })
    await expect(expandBtn).toHaveCSS('cursor', 'pointer')

    await voteBtn.click()
    const countBtn = card.getByRole('button', { name: '1' })
    await expect(countBtn).toBeVisible()
    await expect(countBtn).toHaveCSS('cursor', 'pointer')
  })
})

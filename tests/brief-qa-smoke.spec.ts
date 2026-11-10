/**
 * Brief page Q&A, feedback and endorse - behaviour-only smoke test
 * (design-system-phase4c, step 1)
 *
 * Written BEFORE the Phase 4c restyling so it pins behaviour on the old UI and
 * keeps passing on the new one. Assertions use roles, text and behaviour, never
 * classes or colours. Every locator for the dialogs, the thread and the votes
 * lives in the `qa` helper below, so later steps change only that helper.
 *
 * Prerequisites
 * -------------
 * `playwright/.auth/creator.json` and `playwright/.auth/expert.json` must exist
 * (written by global-setup.ts) and TEST_CREATOR_EMAIL must be set in
 * .env.local. The spec creates and deletes its own throwaway brief, question,
 * answer and vote rows. UNEXECUTED when written: Playwright was not run in the
 * authoring environment.
 *
 * Already covered elsewhere (not repeated here):
 *  - tests/qa-votes.spec.ts: upvote toggle (Upvote / Remove your upvote), the
 *    hover tooltip text, pointer cursors, 'Expand answers' and the count
 *    button named '1'.
 *  - tests/faq-answers.spec.ts: FAQ add-an-answer, submit-answer and
 *    admin approval flows.
 *  - tests/ctas.spec.ts: the CTA dialog (not Q&A).
 *
 * Added here: (a) ask-a-question dialog opens and Cancel/Close dismisses it,
 * (b) feedback dialog opens and Cancel dismisses it, (c) propose-correction
 * dialog (expert) opens and dismisses, (d) review-endorse dialog (expert) opens
 * and Cancel/Close dismisses it, (e) a seeded question with one answer shows
 * its text, the answer count and the answer text, (f) the voters list opens
 * from a non-zero vote count and dismisses.
 *
 * Escape-to-close and focus return are NOT behaviour of the old hand-rolled
 * modals, so they are `test.fixme` below. The step that moves each modal onto
 * the shared Modal must enable the matching test.
 */

import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  createTestBrief,
  deleteTestBrief,
  insertApprovedQuestion,
  deleteTestQuestion,
  getTestAdminClient,
  TestUser,
  TestBrief,
  QuestionRecord,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

// ---------------------------------------------------------------------------
// Markup helper: the ONLY place that knows how the Contribute menu, the Q&A
// thread, the vote count and the dialogs are built. Later steps of the plan
// restyle them; update here only.
// ---------------------------------------------------------------------------

const qa = {
  section: (page: Page) => page.locator('#section-qa'),

  /** The hero's Contribute dropdown trigger. */
  contributeTrigger: (page: Page) => page.getByRole('button', { name: /^Contribute/ }),

  /** Open the Contribute menu and click one of its items by name. */
  async openFromContribute(page: Page, item: string | RegExp) {
    await qa.contributeTrigger(page).click()
    await page.getByRole('button', { name: item, exact: typeof item === 'string' }).click()
  },

  /** The footer link that opens the propose-correction dialog (expert and organisation only). */
  proposeCorrectionEntry: (page: Page) => page.getByRole('button', { name: /Propose a correction or addition/ }),

  askDialog: (page: Page) => page.getByRole('dialog', { name: 'Ask a question' }),
  feedbackDialog: (page: Page) => page.getByRole('dialog', { name: 'Send feedback' }),
  correctionDialog: (page: Page) => page.getByRole('dialog', { name: 'Propose a correction or addition' }),
  reviewDialog: (page: Page) => page.getByRole('dialog', { name: 'Review or endorse this brief' }),
  votersDialog: (page: Page) => page.getByRole('dialog', { name: 'Voted up by' }),

  /** Dismiss control inside a dialog: Cancel (forms) or the Close icon button. */
  dismiss: (dialog: ReturnType<Page['getByRole']>) =>
    dialog.getByRole('button', { name: /^(Cancel|Close)$/ }).first(),

  /** Question text inside the Q&A section. */
  questionText: (page: Page, text: string) => qa.section(page).getByText(text, { exact: true }),

  /** The answer-count line of the (only) question, e.g. "1 answer". */
  answerCount: (page: Page) => qa.section(page).getByText(/^1 answer$/),

  expandAnswers: (page: Page) => qa.section(page).getByRole('button', { name: 'Expand answers' }),

  /** Answer text, visible once the thread is expanded. */
  answerText: (page: Page, text: string) => qa.section(page).getByText(text),

  /** The vote count button (named by its number) of the only question. */
  voteCount: (page: Page) => qa.section(page).getByRole('button', { name: '1', exact: true }),
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stamp = Date.now()
const SLUG = `ds4c-qa-${stamp}`
const QUESTION_TEXT = `How will the new ranking rules be audited ${stamp}?`
const ANSWER_TEXT = `An independent auditor will publish the findings ${stamp}`

test.describe('Brief Q&A, feedback and endorse smoke test', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let brief: TestBrief
  let question: QuestionRecord

  test.beforeAll(async () => {
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4C QA ${stamp}`, slug: SLUG, visibility: 'public' })
    question = await insertApprovedQuestion(brief.id, creator.id, QUESTION_TEXT)

    const client = getTestAdminClient()
    const { error } = await client
      .from('question_answers')
      .insert({ question_id: question.id, author_user_id: creator.id, body: ANSWER_TEXT, status: 'published' })
    if (error) throw new Error(`Failed to seed question_answers row: ${error.message}`)

    // One upvote so the vote count (and the voters list) is non-zero.
    const { error: voteError } = await client
      .from('question_votes')
      .insert({ question_id: question.id, user_id: creator.id })
    if (voteError) throw new Error(`Failed to seed question_votes row: ${voteError.message}`)
  })

  test.afterAll(async () => {
    // Answers and votes cascade with the question; the brief cascades the rest.
    if (question) await deleteTestQuestion(question.id)
    if (brief) await deleteTestBrief(brief.id)
  })

  test.describe('signed-in creator', () => {
    test.use({ storageState: 'playwright/.auth/creator.json' })

    test('(a) "Ask a question" opens a dialog; Cancel or Close dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.openFromContribute(page, 'Ask a question')
      const dialog = qa.askDialog(page)
      await expect(dialog).toBeVisible()

      await qa.dismiss(dialog).click()
      await expect(dialog).toHaveCount(0)
    })

    test('(b) "Send feedback on this page" opens the feedback dialog; Cancel dismisses it without a submit', async ({
      page,
    }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.openFromContribute(page, 'Send feedback on this page')
      const dialog = qa.feedbackDialog(page)
      await expect(dialog).toBeVisible()

      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    })

    test('(e) shows the seeded question, the answer count and, once expanded, the answer text', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await expect(qa.questionText(page, QUESTION_TEXT)).toBeVisible()
      await expect(qa.answerCount(page)).toBeVisible()

      await qa.expandAnswers(page).click()
      await expect(qa.answerText(page, ANSWER_TEXT)).toBeVisible()
    })

    test('(f) the voters list opens from the vote count; Close dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.voteCount(page).click()
      const dialog = qa.votersDialog(page)
      await expect(dialog).toBeVisible()

      await dialog.getByRole('button', { name: 'Close' }).click()
      await expect(dialog).toHaveCount(0)
    })

    // Escape and focus return are not old-UI behaviour. The step that moves
    // each modal to the shared Modal enables its test (see the plan).
    test.fixme('(a2) Escape closes the ask-a-question dialog and returns focus to the Contribute control', async ({
      page,
    }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.openFromContribute(page, 'Ask a question')
      await expect(qa.askDialog(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(qa.askDialog(page)).toHaveCount(0)
      await expect(qa.contributeTrigger(page)).toBeFocused()
    })

    test.fixme('(b2) Escape closes the feedback dialog and returns focus to the Contribute control', async ({
      page,
    }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.openFromContribute(page, 'Send feedback on this page')
      await expect(qa.feedbackDialog(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(qa.feedbackDialog(page)).toHaveCount(0)
      await expect(qa.contributeTrigger(page)).toBeFocused()
    })

    test.fixme('(f2) Escape closes the voters list and returns focus to the vote count', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.voteCount(page).click()
      await expect(qa.votersDialog(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(qa.votersDialog(page)).toHaveCount(0)
      await expect(qa.voteCount(page)).toBeFocused()
    })
  })

  test.describe('signed-in expert', () => {
    test.use({ storageState: 'playwright/.auth/expert.json' })

    test('(c) "Propose a correction or addition" opens its dialog; Cancel dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.proposeCorrectionEntry(page).click()
      const dialog = qa.correctionDialog(page)
      await expect(dialog).toBeVisible()

      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    })

    test('(d) "Review or endorse this brief" opens its dialog; Close dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.openFromContribute(page, 'Review or endorse this brief')
      const dialog = qa.reviewDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Mark as reviewed' })).toBeVisible()

      await dialog.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    })

    test.fixme('(c2) Escape closes the propose-correction dialog and returns focus to its entry', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.proposeCorrectionEntry(page).click()
      await expect(qa.correctionDialog(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(qa.correctionDialog(page)).toHaveCount(0)
      await expect(qa.proposeCorrectionEntry(page)).toBeFocused()
    })

    test.fixme('(d2) Escape closes the review-endorse dialog and returns focus to the Contribute control', async ({
      page,
    }) => {
      await page.goto(`/briefs/${SLUG}`)
      await qa.openFromContribute(page, 'Review or endorse this brief')
      await expect(qa.reviewDialog(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(qa.reviewDialog(page)).toHaveCount(0)
      await expect(qa.contributeTrigger(page)).toBeFocused()
    })
  })
})

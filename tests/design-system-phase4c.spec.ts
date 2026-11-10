import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  createTestBrief,
  deleteTestBrief,
  insertApprovedQuestion,
  deleteTestQuestion,
  getTestAdminClient,
  TestBrief,
  TestUser,
  QuestionRecord,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

// Phase 4c of the design-system migration: the Q&A area of the brief page.
// Roles, text and behaviour, apart from the serif answer text (the visible
// proof the thread migrated). Throwaway brief, question and answer, cleaned up
// afterwards. The FAQ check uses the seeded `test-public-brief`
// (bun scripts/seed-test-briefs.ts), as tests/faq-answers.spec.ts does.

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

const stamp = Date.now()
const SLUG = `ds4c-spec-${stamp}`
const QUESTION_TEXT = `Who audits the ranking rules ${stamp}?`
const ANSWER_TEXT = `An independent auditor publishes the findings ${stamp}`
const FAQ_BRIEF_SLUG = 'test-public-brief'
const FAQ_QUESTION = 'What is this test brief for?'

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('Phase 4c: brief Q&A', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let brief: TestBrief
  let question: QuestionRecord

  test.beforeAll(async () => {
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4C Spec ${stamp}`, slug: SLUG, visibility: 'public' })
    question = await insertApprovedQuestion(brief.id, creator.id, QUESTION_TEXT)
    const { error } = await getTestAdminClient()
      .from('question_answers')
      .insert({ question_id: question.id, author_user_id: creator.id, body: ANSWER_TEXT, status: 'published' })
    if (error) throw new Error(`Failed to seed question_answers row: ${error.message}`)
  })

  test.afterAll(async () => {
    if (question) await deleteTestQuestion(question.id)
    if (brief) await deleteTestBrief(brief.id)
  })

  test.describe('signed-in member', () => {
    test.use({ storageState: 'playwright/.auth/creator.json' })

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      test(`the Q&A section renders with no console errors and no overflow at ${viewport.width}px`, async ({
        page,
      }) => {
        const errors: string[] = []
        page.on('pageerror', (e) => errors.push(e.message))
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

        await page.setViewportSize(viewport)
        await page.goto(`/briefs/${SLUG}`)
        await expect(page.locator('#section-qa').getByText(QUESTION_TEXT, { exact: true })).toBeVisible()

        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
        expect(errors).toEqual([])
      })
    }

    test('the answer text is set in the serif family', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const section = page.locator('#section-qa')
      await section.getByRole('button', { name: 'Expand answers' }).click()
      const text = section.getByText(ANSWER_TEXT).first()
      await expect(text).toBeVisible()
      const family = await text.evaluate((el) => getComputedStyle(el).fontFamily)
      expect(family).toMatch(/EB Garamond|Georgia|serif/)
      expect(family).not.toContain('Inter')
    })

    test('the ask-a-question dialog opens as a dialog and closes on Escape', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await page.getByRole('button', { name: /^Contribute/ }).click()
      await page.getByRole('button', { name: 'Ask a question', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Ask a question' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })
  })

  test('the FAQ section renders its question buttons', async ({ page }) => {
    await page.goto(`/briefs/${FAQ_BRIEF_SLUG}`)
    await expect(page.getByRole('button', { name: FAQ_QUESTION })).toBeVisible()
  })
})

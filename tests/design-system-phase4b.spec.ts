import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  createTestBrief,
  deleteTestBrief,
  insertPublishedQuotePost,
  deleteTestContentPost,
  TestBrief,
  TestUser,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

// Phase 4b of the design-system migration: the quotes area of the brief page.
// Roles, text and behaviour, apart from the serif quote text (the visible proof
// the Quote card migrated). Throwaway brief and quotes, cleaned up afterwards.

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

const stamp = Date.now()
const SLUG = `ds4b-spec-${stamp}`
const QUOTE_TEXT = `Open ranking rules help everyone ${stamp}`

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('Phase 4b: brief quotes', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let brief: TestBrief
  let quoteId: string

  test.beforeAll(async () => {
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4B Spec ${stamp}`, slug: SLUG, visibility: 'public' })
    const row = await insertPublishedQuotePost(brief.id, creator.id, { title: QUOTE_TEXT, body: QUOTE_TEXT })
    quoteId = row.id
  })

  test.afterAll(async () => {
    if (quoteId) await deleteTestContentPost(quoteId)
    if (brief) await deleteTestBrief(brief.id)
  })

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`the Quotes section renders with no console errors and no overflow at ${viewport.width}px`, async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      await page.setViewportSize(viewport)
      await page.goto(`/briefs/${SLUG}`)
      await expect(page.locator('#section-quotes').getByText(QUOTE_TEXT)).toBeVisible()

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }

  test('the quote text is set in the serif family', async ({ page }) => {
    await page.goto(`/briefs/${SLUG}`)
    const text = page.locator('#section-quotes').getByText(QUOTE_TEXT).first()
    await expect(text).toBeVisible()
    const family = await text.evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toMatch(/EB Garamond|Georgia|serif/)
    expect(family).not.toContain('Inter')
  })

  test('opening a quote shows a dialog that closes on Escape', async ({ page }) => {
    await page.goto(`/briefs/${SLUG}`)
    await page
      .locator('#section-quotes')
      .getByRole('button')
      .filter({ hasText: QUOTE_TEXT })
      .first()
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(QUOTE_TEXT)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test.describe('signed-in creator', () => {
    test.use({ storageState: 'playwright/.auth/creator.json' })

    test('the Add quote dialog opens and closes without a write', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const add = page.getByRole('button', { name: '+ Add quote' })
      test.skip((await add.count()) === 0, 'Add quote control is not offered to this role')
      await add.click()
      const dialog = page.getByRole('dialog', { name: 'Add a quote' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })
  })
})

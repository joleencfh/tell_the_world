/**
 * Brief page quotes - behaviour-only smoke test (design-system-phase4b, step 1)
 *
 * Written BEFORE the Phase 4b restyling so it pins behaviour on the old UI and
 * keeps passing on the new one. Assertions use roles, text and behaviour, never
 * classes or colours. Every locator for the carousel, cards and dialogs lives in
 * the `quotes` helper below, so later steps change only that helper.
 *
 * Prerequisites
 * -------------
 * `playwright/.auth/creator.json` and `playwright/.auth/expert.json` must exist
 * (written by global-setup.ts) and TEST_CREATOR_EMAIL / TEST_EXPERT_EMAIL must
 * be set in .env.local. The spec creates and deletes its own throwaway briefs
 * and quote rows. UNEXECUTED when written: Playwright was not run in the
 * authoring environment.
 *
 * Already covered elsewhere (not repeated here): nothing on the brief page.
 * tests/home-dashboard.spec.ts only covers quotes inside the dashboard
 * Highlighted card; tests/briefs.spec.ts and tests/brief-shell-smoke.spec.ts
 * do not touch the Quotes section.
 *
 * Not covered on purpose: posting a new quote and clarity gating (need new
 * server action fixtures), admin edit (the quote author edit path covers the
 * same dialog).
 */

import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  createTestBrief,
  deleteTestBrief,
  insertPublishedQuotePost,
  deleteTestContentPost,
  TestUser,
  TestBrief,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

// ---------------------------------------------------------------------------
// Markup helper: the ONLY place that knows how the quotes carousel, cards and
// dialogs are built. Later steps of the plan restyle them; update here only.
// ---------------------------------------------------------------------------

const quotes = {
  section: (page: Page) => page.locator('#section-quotes'),

  /** The card for a quote, found by its text (a keyboard-operable button-like element). */
  card: (page: Page, text: string) =>
    quotes.section(page).getByRole('button').filter({ hasText: text }).first(),

  /** The copy control inside a card. */
  copyButton: (page: Page, text: string) =>
    quotes.card(page, text).getByRole('button', { name: /^Copy quote$|^Copied$/ }),

  /** The like toggle inside a card (a button for signed-in members). */
  likeButton: (page: Page, text: string) =>
    quotes.card(page, text).getByRole('button', { name: /^(Like|Unlike)$/ }),

  /** The quote detail dialog. */
  detailDialog: (page: Page) => page.getByRole('dialog', { name: 'Quote detail' }),

  /** The edit control inside the detail dialog. */
  editControl: (page: Page) => quotes.detailDialog(page).getByRole('button', { name: 'Edit', exact: true }),

  /** The edit quote dialog. */
  editDialog: (page: Page) => page.getByRole('dialog', { name: 'Edit quote' }),

  /** The quote text field inside the edit dialog. */
  editBodyField: (page: Page) => quotes.editDialog(page).getByLabel('Quote', { exact: true }),

  /** The cancel control inside the edit dialog. */
  editCancel: (page: Page) => quotes.editDialog(page).getByRole('button', { name: 'Cancel', exact: true }),

  /** The empty-state sentence for members who may add a quote. */
  emptyStateForContributors: (page: Page) =>
    page.getByText('Add the first quote, from yourself, a colleague, or a source document.'),
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stamp = Date.now()
const SLUG = `ds4b-quotes-${stamp}`
const EMPTY_SLUG = `ds4b-quotes-empty-${stamp}`
const QUOTE_ONE = `Platforms should publish their ranking rules in plain language ${stamp}`
const QUOTE_TWO = `Independent audits only work when the data is open ${stamp}`

function authorName(user: TestUser): string {
  return user.display_name?.trim() || user.email.split('@')[0] || 'Member'
}

test.describe('Brief quotes smoke test', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let brief: TestBrief
  let emptyBrief: TestBrief
  const quoteIds: string[] = []

  test.beforeAll(async () => {
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4B Quotes ${stamp}`, slug: SLUG, visibility: 'public' })
    emptyBrief = await createTestBrief({
      title: `DS4B Quotes Empty ${stamp}`,
      slug: EMPTY_SLUG,
      visibility: 'public',
    })
    for (const text of [QUOTE_ONE, QUOTE_TWO]) {
      const row = await insertPublishedQuotePost(brief.id, creator.id, { title: text, body: text })
      quoteIds.push(row.id)
    }
  })

  test.afterAll(async () => {
    for (const id of quoteIds) await deleteTestContentPost(id)
    if (brief) await deleteTestBrief(brief.id)
    if (emptyBrief) await deleteTestBrief(emptyBrief.id)
  })

  test.describe('logged-out visitor', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('(a) sees the Quotes section with both quote texts and the author name', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await expect(quotes.section(page)).toBeVisible()
      await expect(quotes.section(page).getByText('Quotes', { exact: true }).first()).toBeVisible()
      await expect(quotes.section(page).getByText(QUOTE_ONE)).toBeVisible()
      await expect(quotes.section(page).getByText(QUOTE_TWO)).toBeVisible()
      await expect(quotes.section(page).getByText(authorName(creator)).first()).toBeVisible()
    })

    test('(b) opening a quote with Enter shows a dialog with its text; Close dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const card = quotes.card(page, QUOTE_ONE)
      await card.focus()
      await page.keyboard.press('Enter')

      const dialog = quotes.detailDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText(QUOTE_ONE)).toBeVisible()

      await dialog.getByRole('button', { name: 'Close' }).click()
      await expect(dialog).toHaveCount(0)
    })

    test('(b2) Escape closes the quote dialog and returns focus to the card', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const card = quotes.card(page, QUOTE_ONE)
      await card.focus()
      await page.keyboard.press('Enter')

      const dialog = quotes.detailDialog(page)
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(card).toBeFocused()
    })

    test('(c) the copy button is reachable by keyboard and has an accessible name', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const copy = quotes.copyButton(page, QUOTE_ONE)
      await expect(copy).toBeVisible()
      await copy.focus()
      await expect(copy).toBeFocused()
      await expect(copy).toHaveAccessibleName(/copy quote/i)
    })
  })

  test.describe('signed-in creator (quote author)', () => {
    test.use({ storageState: 'playwright/.auth/creator.json' })

    test('(d) the like toggle changes the count by one and back', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const like = quotes.likeButton(page, QUOTE_TWO)
      await expect(like).toBeVisible()
      await expect(like).toHaveAttribute('aria-pressed', 'false')
      await expect(like).toHaveText('0')

      await like.click()
      await expect(like).toHaveAttribute('aria-pressed', 'true')
      await expect(like).toHaveText('1')

      await like.click()
      await expect(like).toHaveAttribute('aria-pressed', 'false')
      await expect(like).toHaveText('0')
    })

    test('(f) the edit control opens the edit dialog pre-filled; Cancel closes it without saving', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await quotes.card(page, QUOTE_ONE).click()
      await expect(quotes.detailDialog(page)).toBeVisible()

      await quotes.editControl(page).click()
      await expect(quotes.editDialog(page)).toBeVisible()
      await expect(quotes.editBodyField(page)).toHaveValue(QUOTE_ONE)

      await quotes.editCancel(page).click()
      await expect(quotes.editDialog(page)).toHaveCount(0)

      // Nothing was saved: the text is unchanged on the page after a reload.
      await page.reload()
      await expect(quotes.section(page).getByText(QUOTE_ONE)).toBeVisible()
    })
  })

  test.describe('signed-in expert on a brief with no quotes', () => {
    test.use({ storageState: 'playwright/.auth/expert.json' })

    test('(e) shows the empty state text for the Quotes section', async ({ page }) => {
      await page.goto(`/briefs/${EMPTY_SLUG}`)
      await expect(quotes.section(page)).toBeVisible()
      await expect(quotes.emptyStateForContributors(page)).toBeVisible()
    })
  })
})

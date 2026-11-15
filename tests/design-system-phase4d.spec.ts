import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  getTestAdminClient,
  createTestBrief,
  deleteTestBrief,
  insertBriefSection,
  insertPublishedCoverage,
  deleteTestCoverage,
  TestBrief,
  TestUser,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

// Phase 4d of the design-system migration: sources, timeline, coverage, CTAs
// and the rest of the brief page. Roles, text and computed colours only.
// Throwaway brief, coverage and timeline rows, cleaned up afterwards.
// UNEXECUTED when written: Playwright was not run in the authoring environment.

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

const BAND_SOFT = 'rgb(229, 234, 246)' // --color-band-soft in app/app-theme.css
const OLD_COVERAGE_BG = 'rgb(12, 13, 14)' // retired --color-coverage-bg (#0C0D0E)

const stamp = Date.now()
const SLUG = `ds4d-spec-${stamp}`
const SOURCE_ONE = `Platform transparency report ${stamp}`
const EVENT_ONE = `Regulation proposed ${stamp}`
const EVENT_TWO = `Regulation adopted ${stamp}`
const COVERAGE_TITLE = `Coverage headline ${stamp}`

const SOURCES_TEXT = [
  `• ${SOURCE_ONE}`,
  'Publisher: Example Press',
  'A first source description.',
  'https://example.com/source-one',
].join('\n')

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('Phase 4d: brief extras', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let brief: TestBrief
  let coverageId = ''

  test.beforeAll(async () => {
    const db = getTestAdminClient()
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4D Spec ${stamp}`, slug: SLUG, visibility: 'public' })
    await insertBriefSection(brief.id, {
      section_type: 'explainer',
      title: 'First subsection',
      content: 'The first paragraph of the explainer.',
      display_order: 1,
    })
    await insertBriefSection(brief.id, { section_type: 'going_deeper', content: SOURCES_TEXT, display_order: 2 })
    const { error } = await db.from('brief_timeline_events').insert([
      { brief_id: brief.id, event_name: EVENT_ONE, event_date: '2024-01-15', display_order: 1 },
      { brief_id: brief.id, event_name: EVENT_TWO, event_date: '2024-06-20', display_order: 2 },
    ])
    if (error) throw new Error(`Failed to insert timeline events: ${error.message}`)
    const coverage = await insertPublishedCoverage(brief.id, creator.id, {
      title: COVERAGE_TITLE,
      url: 'https://example.com/coverage-article',
      outletName: 'Example Outlet',
    })
    coverageId = coverage.id
  })

  test.afterAll(async () => {
    const db = getTestAdminClient()
    if (brief) await db.from('brief_timeline_events').delete().eq('brief_id', brief.id)
    if (coverageId) await deleteTestCoverage(coverageId)
    if (brief) await deleteTestBrief(brief.id)
  })

  test.describe('logged-out visitor', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      test(`the page renders with no console errors and no overflow at ${viewport.width}px`, async ({ page }) => {
        const errors: string[] = []
        page.on('pageerror', (e) => errors.push(e.message))
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

        await page.setViewportSize(viewport)
        await page.goto(`/briefs/${SLUG}`)
        await expect(page.locator('#section-explainer').getByText(SOURCE_ONE).first()).toBeVisible()
        await expect(page.locator('#section-explainer').getByText(EVENT_ONE).first()).toBeAttached()
        await expect(page.locator('#section-coverage').getByText(COVERAGE_TITLE).first()).toBeVisible()

        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
        expect(errors).toEqual([])
      })
    }

    test('the "Covered by" section sits on the band-soft background and no element uses the old dark colour', async ({
      page,
    }) => {
      await page.goto(`/briefs/${SLUG}`)
      const section = page.locator('#section-coverage')
      await expect(section).toBeVisible()
      const bg = await section.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(bg).toBe(BAND_SOFT)

      const darkCount = await page.evaluate(
        (dark) =>
          Array.from(document.querySelectorAll('body *')).filter(
            (el) => getComputedStyle(el).backgroundColor === dark,
          ).length,
        OLD_COVERAGE_BG,
      )
      expect(darkCount).toBe(0)
    })

    test('the coverage detail dialog opens as a dialog and closes on Escape', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await page
        .locator('#section-coverage')
        .getByRole('button')
        .filter({ hasText: COVERAGE_TITLE })
        .first()
        .click()
      const dialog = page.getByRole('dialog', { name: 'Coverage detail' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })

    test('the sources drawer opens and closes', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const explainer = page.locator('#section-explainer')
      const heading = explainer.getByText(/^Source \d+ . Summary$/)
      await expect(heading).toHaveCount(0)
      await explainer.getByRole('button').filter({ hasText: SOURCE_ONE }).first().click()
      await expect(heading).toBeVisible()
      await explainer.getByRole('button', { name: 'Close summary' }).click()
      await expect(heading).toHaveCount(0)
    })
  })
})

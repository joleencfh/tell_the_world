/**
 * Design system Phase 5c: admin acceptance over every tab, plus the Analytics tab.
 *
 * Gating mirrors tests/design-system-phase5a.spec.ts and the 5b spec: needs
 * playwright/.auth/admin.json and a dev server started with
 * ADMIN_EMAIL=<TEST_ADMIN_EMAIL>, otherwise it skips. Read-only: it only opens
 * tabs and never clicks anything that writes.
 */

import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

// All 15 admin tabs: Applications, the 12 moderation queues, Recently approved, Analytics.
const ALL_TABS = [
  'Applications',
  'Questions',
  'Correction proposals',
  'FAQ answers',
  'Contentious points',
  'Q&A answers',
  'Calls to action',
  'Contributor submissions',
  'Coverage',
  'Feedback',
  'Reviews & endorsements',
  'Brief proposals',
  'Waitlist',
  'Recently approved',
  'Analytics',
]

/** Pages through the tab row until the tab is visible, then clicks it. */
async function openTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole('button', { name: new RegExp(`^${label}`) })
  const more = page.getByRole('button', { name: 'More tabs' })
  for (let i = 0; i < 4 && (await tab.count()) === 0; i++) await more.click()
  await tab.click()
  await expect(page.getByRole('heading', { level: 1, name: label, exact: true })).toBeVisible()
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

test.describe('Design system Phase 5c: whole admin and Analytics', () => {
  test.use({ storageState: adminFixtureExists ? adminFixturePath : undefined })

  test.beforeEach(async ({ page }) => {
    test.skip(
      !adminFixtureExists,
      'playwright/.auth/admin.json not generated: set TEST_ADMIN_EMAIL in .env.local and rerun the suite',
    )
    await page.goto('/admin')
    if (!page.url().includes('/admin')) {
      test.skip(true, 'Redirected away from /admin: start the dev server with ADMIN_EMAIL=<TEST_ADMIN_EMAIL value>')
    }
  })

  for (const width of [390, 1440]) {
    test(`all 15 admin tabs open cleanly at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/admin')

      const nav = page.getByRole('navigation', { name: 'Admin sections' })
      for (const label of ALL_TABS) {
        await openTab(page, label)
        expect(await horizontalOverflow(page), `horizontal overflow on ${label}`).toBeLessThanOrEqual(0)
        await expect(nav.locator('[aria-current="page"]'), `current tab after opening ${label}`).toHaveCount(1)
      }
      expect(errors).toEqual([])
    })
  }

  test('the Analytics tab shows the activity list or the empty state', async ({ page }) => {
    await openTab(page, 'Analytics')
    const list = page.getByTestId('admin-analytics-list')
    const empty = page.getByText('No activity recorded yet.')
    await expect(list.or(empty).first()).toBeVisible()
  })
})

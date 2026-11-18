/**
 * Phase 5a smoke test: admin shell and Applications tab, behaviour only.
 *
 * Written BEFORE the restyle so the same file can prove the migration kept
 * behaviour. Every locator goes by role, name or text (never class or colour)
 * and lives in the `ui` helper below, so the migrating step only edits one
 * place. The one planned change is the reject flow: today the quick reject
 * control swaps in an inline "Yes / No"; step 4 replaces it with a
 * ConfirmDialog. That case is split into a current-behaviour test and a
 * test.fixme for the dialog.
 *
 * Gating mirrors tests/two-ink-bold-11f-admin.spec.ts: needs
 * playwright/.auth/admin.json and a dev server started with
 * ADMIN_EMAIL=<TEST_ADMIN_EMAIL>, otherwise it skips.
 *
 * Never clicks Approve or a confirming Reject (both write).
 */

import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'
import { ADMIN_PAGE_SIZE } from '../lib/data/admin'
import { getTestAdminClient, insertPendingApplication, deleteTestApplication } from './helpers/supabase'

loadEnvConfig(process.cwd())

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

const SEED_NAME = 'Playwright Five A'
const SEED_BIO = 'Seeded by tests/admin-applications-5a-smoke.spec.ts'

// All locators in one place. Step 4 may change the reject flow to a dialog.
const ui = {
  pageHeading: (page: Page, name: string) => page.getByRole('heading', { level: 1, name }),
  newBrief: (page: Page) => page.getByRole('button', { name: '+ New brief' }),
  tab: (page: Page, label: string) => page.getByRole('button', { name: new RegExp(`^${label}`) }),
  moreTabs: (page: Page) => page.getByRole('button', { name: 'More tabs' }),
  previousTabs: (page: Page) => page.getByRole('button', { name: 'Previous tabs' }),
  summary: (page: Page) => page.getByRole('button', { name: new RegExp(SEED_NAME) }),
  // The summary button's parent is the row; the row's parent is the card.
  row: (page: Page) => ui.summary(page).locator('xpath=..'),
  card: (page: Page) => ui.summary(page).locator('xpath=../..'),
  quickReject: (page: Page) => ui.row(page).getByRole('button', { name: 'Reject this application' }),
  // Current inline confirm (replaced by a dialog in step 4).
  inlineCancel: (page: Page) => ui.row(page).getByRole('button', { name: 'No', exact: true }),
}

/**
 * Seeds one pending application and returns the page it lands on. The list is
 * ordered oldest first, so a new row is last: compute its page from the
 * current pending count rather than assuming page 1.
 */
async function seedPending(email: string): Promise<number> {
  const { count, error } = await getTestAdminClient()
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw new Error(`Could not count pending applications: ${error.message}`)
  await insertPendingApplication(email, { fullName: SEED_NAME, desiredRole: 'creator', bio: SEED_BIO })
  return Math.max(1, Math.ceil(((count ?? 0) + 1) / ADMIN_PAGE_SIZE))
}

test.describe('Admin 5a smoke: shell and applications (behaviour only)', () => {
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

  test('shell shows the page heading, New brief control and the Applications tab', async ({ page }) => {
    await expect(ui.pageHeading(page, 'Applications')).toBeVisible()
    await expect(ui.newBrief(page)).toBeVisible()
    await expect(ui.tab(page, 'Applications')).toBeVisible()
  })

  test('the Applications tab shows a count when a pending application exists', async ({ page }) => {
    const email = `playwright-5a-${Date.now()}@example.com`
    await seedPending(email)
    try {
      await page.reload()
      await expect(ui.tab(page, 'Applications')).toHaveAccessibleName(/^Applications\s*\d+/)
    } finally {
      await deleteTestApplication(email)
    }
  })

  test('More tabs advances the visible tabs and Previous tabs returns', async ({ page }) => {
    await expect(ui.tab(page, 'Applications')).toBeVisible()
    await expect(ui.tab(page, 'Brief proposals')).toHaveCount(0)

    await ui.moreTabs(page).click()
    await expect(ui.tab(page, 'Brief proposals')).toBeVisible()
    await expect(ui.tab(page, 'Applications')).toHaveCount(0)

    await ui.previousTabs(page).click()
    await expect(ui.tab(page, 'Applications')).toBeVisible()
    await expect(ui.tab(page, 'Brief proposals')).toHaveCount(0)
  })

  test('clicking a tab changes the page heading to its label', async ({ page }) => {
    await ui.moreTabs(page).click()
    await ui.moreTabs(page).click()
    await ui.tab(page, 'Recently approved').click()
    await expect(ui.pageHeading(page, 'Recently approved')).toBeVisible()
  })

  test('a pending application expands to show its bio and the Approve and Reject buttons', async ({ page }) => {
    const email = `playwright-5a-${Date.now()}@example.com`
    const pendingPage = await seedPending(email)
    try {
      await page.goto(`/admin?pendingPage=${pendingPage}`)
      const summary = ui.summary(page)
      await expect(summary).toBeVisible()
      await expect(summary).toHaveAttribute('aria-expanded', 'false')

      await summary.click()
      await expect(summary).toHaveAttribute('aria-expanded', 'true')
      const card = ui.card(page)
      await expect(card.getByText(SEED_BIO)).toBeVisible()
      await expect(card.getByRole('button', { name: 'Approve', exact: true })).toBeVisible()
      await expect(card.getByRole('button', { name: 'Reject', exact: true })).toBeVisible()
    } finally {
      await deleteTestApplication(email)
    }
  })

  // Current behaviour: the quick reject control swaps in an inline Yes / No.
  // Step 4 replaces this with a ConfirmDialog; update this test there (the
  // cancel path must still leave the row listed and unconfirmed).
  test('cancelling the quick reject returns to the unconfirmed state', async ({ page }) => {
    const email = `playwright-5a-${Date.now()}@example.com`
    const pendingPage = await seedPending(email)
    try {
      await page.goto(`/admin?pendingPage=${pendingPage}`)
      await expect(ui.summary(page)).toBeVisible()

      await ui.quickReject(page).click()
      await expect(ui.quickReject(page)).toHaveCount(0)

      await ui.inlineCancel(page).click()
      await expect(ui.quickReject(page)).toBeVisible()
      await expect(ui.summary(page)).toBeVisible()
    } finally {
      await deleteTestApplication(email)
    }
  })

  // Enable in step 4, when the quick reject opens a ConfirmDialog.
  test.fixme('the quick reject opens a dialog named for the applicant and Cancel keeps the row', async ({ page }) => {
    const email = `playwright-5a-${Date.now()}@example.com`
    const pendingPage = await seedPending(email)
    try {
      await page.goto(`/admin?pendingPage=${pendingPage}`)
      await ui.quickReject(page).click()
      const dialog = page.getByRole('dialog', { name: new RegExp(SEED_NAME) })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Cancel' }).click()
      await expect(dialog).toHaveCount(0)
      await expect(ui.summary(page)).toBeVisible()
    } finally {
      await deleteTestApplication(email)
    }
  })
})

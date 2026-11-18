/**
 * Design system Phase 5b: admin moderation queues.
 *
 * Gating mirrors tests/design-system-phase5a.spec.ts: needs
 * playwright/.auth/admin.json and a dev server started with
 * ADMIN_EMAIL=<TEST_ADMIN_EMAIL>, otherwise it skips. Never clicks Approve,
 * Dismiss, Decline, Convert, Link, Remove or a confirming Reject (all write).
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

const SEED_NAME = 'Playwright Five B Spec'
const MIN_TARGET = 44

const QUEUE_TABS = [
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
]

/** Pages through the tab row until the tab is visible, then clicks it. */
async function openTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole('button', { name: new RegExp(`^${label}`) })
  const more = page.getByRole('button', { name: 'More tabs' })
  for (let i = 0; i < 4 && (await tab.count()) === 0; i++) await more.click()
  await tab.click()
  await expect(page.getByRole('heading', { level: 1, name: label, exact: true })).toBeVisible()
}

async function seedPending(email: string): Promise<number> {
  const { count, error } = await getTestAdminClient()
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw new Error(`Could not count pending applications: ${error.message}`)
  await insertPendingApplication(email, {
    fullName: SEED_NAME,
    desiredRole: 'creator',
    bio: 'Seeded by tests/design-system-phase5b.spec.ts',
  })
  return Math.max(1, Math.ceil(((count ?? 0) + 1) / ADMIN_PAGE_SIZE))
}

test.describe('Design system Phase 5b: admin moderation queues', () => {
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
    test(`every queue tab opens without console errors or horizontal overflow at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/admin')

      for (const label of QUEUE_TABS) {
        await openTab(page, label)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, `horizontal overflow on ${label}`).toBeLessThanOrEqual(0)
      }
      expect(errors).toEqual([])
    })
  }

  test('buttons in the first queue item are at least 44px high at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/admin')

    for (const label of QUEUE_TABS) {
      await openTab(page, label)
      const list = page.getByTestId('admin-queue-list')
      if ((await list.count()) === 0) continue
      const firstItem = list.first().locator('> *').first()
      const buttons = firstItem.getByRole('button')
      const count = await buttons.count()
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        if (!(await button.isVisible())) continue
        const box = await button.boundingBox()
        expect(box, `no box for a button on ${label}`).not.toBeNull()
        expect(box!.height, `button ${i} on ${label}`).toBeGreaterThanOrEqual(MIN_TARGET)
      }
    }
  })

  test('the expanded Reject opens a dialog named for the applicant and Escape closes it without rejecting', async ({
    page,
  }) => {
    const email = `playwright-5b-spec-${Date.now()}@example.com`
    const pendingPage = await seedPending(email)
    try {
      await page.goto(`/admin?pendingPage=${pendingPage}`)
      const card = page.getByTestId('application-card').filter({ hasText: SEED_NAME })
      const summary = card.getByRole('button', { name: new RegExp(SEED_NAME) })
      await expect(summary).toBeVisible()
      await summary.click()
      await expect(summary).toHaveAttribute('aria-expanded', 'true')

      await card.getByRole('button', { name: 'Reject', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: new RegExp(SEED_NAME) })
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(card).toBeVisible()
    } finally {
      await deleteTestApplication(email)
    }
  })
})

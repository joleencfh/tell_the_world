/**
 * Design system Phase 5a: admin shell, tab row, applications list and detail.
 *
 * Gating mirrors tests/two-ink-bold-11f-admin.spec.ts: needs
 * playwright/.auth/admin.json and a dev server started with
 * ADMIN_EMAIL=<TEST_ADMIN_EMAIL>, otherwise it skips. Never clicks Approve or
 * a confirming Reject (both write).
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

const SEED_NAME = 'Playwright Five A Spec'
const MIN_TARGET = 44

async function seedPending(email: string): Promise<number> {
  const { count, error } = await getTestAdminClient()
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw new Error(`Could not count pending applications: ${error.message}`)
  await insertPendingApplication(email, {
    fullName: SEED_NAME,
    desiredRole: 'creator',
    bio: 'Seeded by tests/design-system-phase5a.spec.ts',
  })
  return Math.max(1, Math.ceil(((count ?? 0) + 1) / ADMIN_PAGE_SIZE))
}

async function expectMinHeight(page: Page, name: string) {
  const box = await page.getByRole('button', { name, exact: true }).boundingBox()
  expect(box, `no box for ${name}`).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(MIN_TARGET)
}

test.describe('Design system Phase 5a: admin shell and applications', () => {
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
    test(`shell renders without console errors or horizontal overflow at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/admin')

      await expect(page.getByRole('heading', { level: 1, name: 'Applications' })).toBeVisible()
      const nav = page.getByRole('navigation', { name: 'Admin sections' })
      await expect(nav.getByRole('button', { name: /^Applications/ })).toHaveAttribute('aria-current', 'page')

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }

  test('tab buttons, paging buttons and New brief are at least 44px high at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/admin')
    const tabs = page.getByRole('navigation', { name: 'Admin sections' }).getByRole('button')
    const count = await tabs.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const box = await tabs.nth(i).boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(MIN_TARGET)
    }
    await expectMinHeight(page, 'Previous tabs')
    await expectMinHeight(page, 'More tabs')
    await expectMinHeight(page, '+ New brief')
  })

  test('Reject opens a dialog named for the applicant, Escape closes it and the row stays', async ({ page }) => {
    const email = `playwright-5a-spec-${Date.now()}@example.com`
    const pendingPage = await seedPending(email)
    try {
      await page.goto(`/admin?pendingPage=${pendingPage}`)
      const summary = page.getByRole('button', { name: new RegExp(SEED_NAME) })
      await expect(summary).toBeVisible()
      await summary.click()
      await expect(summary).toHaveAttribute('aria-expanded', 'true')

      await summary.locator('xpath=../..').getByRole('button', { name: 'Reject this application' }).click()
      const dialog = page.getByRole('dialog', { name: new RegExp(SEED_NAME) })
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(summary).toBeVisible()
    } finally {
      await deleteTestApplication(email)
    }
  })

  test('the Recently approved tab opens and the heading changes', async ({ page }) => {
    const more = page.getByRole('button', { name: 'More tabs' })
    const approved = page.getByRole('button', { name: /^Recently approved/ })
    for (let i = 0; i < 3 && (await approved.count()) === 0; i++) await more.click()
    await approved.click()
    await expect(page.getByRole('heading', { level: 1, name: 'Recently approved' })).toBeVisible()
  })
})

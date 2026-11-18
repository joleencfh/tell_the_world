import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'
import { getTestUser, createTestBrief, deleteTestBrief, TestBrief, TestUser } from './helpers/supabase'

loadEnvConfig(process.cwd())

// Phase 4e of the design-system migration: the three modals on the shared
// Modal, the Lexical toolbar and the admin edit-brief screen. Roles and text
// only. Throwaway brief, cleaned up afterwards.
// UNEXECUTED when written: Playwright was not run in the authoring environment.

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
const expertEmail = process.env.TEST_EXPERT_EMAIL ?? ''
if (!creatorEmail || !expertEmail) {
  throw new Error('TEST_CREATOR_EMAIL and TEST_EXPERT_EMAIL must be set in .env.local')
}

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

const stamp = Date.now()
const SLUG = `ds4e-spec-${stamp}`

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('Phase 4e: modals, editor and admin brief screen', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let expert: TestUser
  let brief: TestBrief

  test.beforeAll(async () => {
    ;[creator, expert] = await Promise.all([getTestUser(creatorEmail), getTestUser(expertEmail)])
    brief = await createTestBrief({ title: `DS4E Spec ${stamp}`, slug: SLUG, visibility: 'public' })
  })

  test.afterAll(async () => {
    if (brief) await deleteTestBrief(brief.id)
  })

  test.describe('as the creator', () => {
    test.use({ storageState: 'playwright/.auth/creator.json' })

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      test(`(a) the propose-brief dialog opens, has no console errors or overflow at ${viewport.width}px, and closes on Escape`, async ({
        page,
      }) => {
        const errors: string[] = []
        page.on('pageerror', (e) => errors.push(e.message))
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

        await page.setViewportSize(viewport)
        await page.goto(`/briefs/${SLUG}`)
        await page.getByRole('button', { name: /^Propose a new brief/ }).click()
        const dialog = page.getByRole('dialog', { name: 'Propose a new brief' })
        await expect(dialog).toBeVisible()

        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
        expect(errors).toEqual([])

        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
      })
    }

    test('(b) the post modal on the own profile opens as a dialog and closes on Escape', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      await page.getByRole('button', { name: 'New Post', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Share something' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })

    test('(c) the contact dialog keeps its recipient heading', async ({ page }) => {
      await page.goto(`/profile/${expert.id}`)
      await page.getByRole('button', { name: /contact/i }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const recipientName = expert.display_name ?? expertEmail.split('@')[0]
      await expect(dialog.getByRole('heading', { name: recipientName })).toBeVisible()
    })
  })

  test.describe('as the admin', () => {
    test.use({ storageState: adminFixtureExists ? adminFixturePath : undefined })

    test('(d) an open section editor shows a toolbar with the Bold button', async ({ page }) => {
      test.skip(!adminFixtureExists, 'playwright/.auth/admin.json not generated (set TEST_ADMIN_EMAIL)')
      await page.goto(`/admin/briefs/${brief.id}`)
      if (!page.url().includes('/admin')) {
        test.skip(true, 'Redirected away from /admin: the dev server needs ADMIN_EMAIL=<TEST_ADMIN_EMAIL value>')
      }
      await expect(page.getByRole('heading', { name: 'Edit Brief' })).toBeVisible()

      await page.getByRole('button', { name: '+ Add explainer subsection' }).click()
      const toolbar = page.getByRole('toolbar').first()
      await expect(toolbar).toBeVisible()
      await expect(toolbar.locator('button[title="Bold"]')).toBeVisible()
    })
  })
})

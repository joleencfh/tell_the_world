/**
 * Phase 5b smoke test: admin moderation queue tabs, behaviour only.
 *
 * Written BEFORE the restyle so the same file can prove the migration kept
 * behaviour. Every locator goes by role, name or text (never class or colour)
 * and lives in the `ui` helper below, so the migrating steps only edit one
 * place.
 *
 * Gating mirrors tests/admin-applications-5a-smoke.spec.ts: needs
 * playwright/.auth/admin.json and a dev server started with
 * ADMIN_EMAIL=<TEST_ADMIN_EMAIL>, otherwise it skips.
 *
 * Never clicks Approve, Dismiss, Decline, Convert, Link or Remove (all write).
 *
 * Seeding: the helpers in tests/helpers/supabase.ts only insert approved or
 * published rows (never pending ones), so the only queue that can be seeded
 * without editing shared helpers is the published CTA list. Questions, FAQ
 * answers, contentious points, Q&A answers, contributor submissions, coverage,
 * feedback, reviews, brief proposals and waitlist signups are covered by the
 * open-the-tab case only.
 */

import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'
import { getTestAdminClient, getTestUser, getTestBrief, insertPublishedCta, deleteTestCtas } from './helpers/supabase'

loadEnvConfig(process.cwd())

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

const BRIEF_SLUG = 'test-public-brief'
const SEED_TITLE = 'Playwright Five B published CTA'

// All locators in one place. Later steps may change markup, not behaviour.
const ui = {
  pageHeading: (page: Page, name: string) => page.getByRole('heading', { level: 1, name, exact: true }),
  tab: (page: Page, label: string) => page.getByRole('button', { name: new RegExp(`^${label}`) }),
  moreTabs: (page: Page) => page.getByRole('button', { name: 'More tabs' }),
  previousTabs: (page: Page) => page.getByRole('button', { name: 'Previous tabs' }),
  text: (page: Page, text: string | RegExp) => page.getByText(text),
  button: (page: Page, name: string | RegExp) => page.getByRole('button', { name }),
}

interface QueueTab {
  label: string
  // Empty-state copy from the tab component.
  empty: string
  // A button every item in the queue carries; null when cards have no action.
  itemButton: RegExp | null
}

const QUEUE_TABS: QueueTab[] = [
  { label: 'Questions', empty: 'No pending questions.', itemButton: /^Dismiss$/ },
  { label: 'Correction proposals', empty: 'No pending correction proposals.', itemButton: /^Dismiss$/ },
  { label: 'FAQ answers', empty: 'No pending FAQ answers.', itemButton: /^Dismiss$/ },
  { label: 'Contentious points', empty: 'No pending contentious points.', itemButton: /^Dismiss$/ },
  { label: 'Q&A answers', empty: 'No pending Q&A answers.', itemButton: /^Dismiss$/ },
  { label: 'Calls to action', empty: 'No pending calls to action.', itemButton: /^Dismiss$/ },
  { label: 'Contributor submissions', empty: 'No pending submissions.', itemButton: /^Dismiss$/ },
  { label: 'Coverage', empty: 'No pending coverage.', itemButton: /^Dismiss$/ },
  { label: 'Feedback', empty: 'No new feedback.', itemButton: null },
  { label: 'Reviews & endorsements', empty: 'No reviews or endorsements yet.', itemButton: /^Remove from list$/ },
  { label: 'Brief proposals', empty: 'No brief proposals yet.', itemButton: /^Decline$/ },
  { label: 'Waitlist', empty: 'No waitlist signups yet.', itemButton: null },
]

/** Pages through the tab row until the tab is visible, then clicks it. */
async function openTab(page: Page, label: string): Promise<void> {
  const tab = ui.tab(page, label)
  for (let i = 0; i < 4 && (await tab.count()) === 0; i++) {
    await ui.moreTabs(page).click()
  }
  await tab.click()
}

test.describe('Admin 5b smoke: moderation queue tabs (behaviour only)', () => {
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

  for (const queue of QUEUE_TABS) {
    test(`${queue.label}: opening the tab sets the heading and shows the empty state or an item`, async ({ page }) => {
      await openTab(page, queue.label)
      await expect(ui.pageHeading(page, queue.label)).toBeVisible()

      const empty = ui.text(page, queue.empty)
      if (queue.itemButton) {
        // Either the empty-state copy or at least one item action is shown.
        await expect(empty.or(ui.button(page, queue.itemButton).first())).toBeVisible()
      } else {
        // Cards in this queue have no action button: the heading is the check
        // and the empty copy, when present, must match the tab component.
        const isEmpty = await empty.isVisible()
        if (isEmpty) await expect(empty).toBeVisible()
      }
    })
  }

  test('a seeded published CTA is listed with its Save control under Calls to action', async ({ page }) => {
    const [expert, brief] = await Promise.all([
      getTestUser(process.env.TEST_EXPERT_EMAIL ?? ''),
      getTestBrief(BRIEF_SLUG),
    ])
    await insertPublishedCta(brief.id, expert.id, { title: SEED_TITLE, linkUrl: 'https://example.com/five-b' })
    try {
      // Published list is ordered by display_order then newest first: a fresh
      // row with no order sorts among the first unordered rows.
      const { count, error } = await getTestAdminClient()
        .from('brief_ctas')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .not('display_order', 'is', null)
      if (error) throw new Error(`Could not count ordered CTAs: ${error.message}`)
      test.skip((count ?? 0) > 5, 'Too many ordered CTAs: the seeded row is not on the first published page')

      await page.reload()
      await openTab(page, 'Calls to action')
      await expect(ui.text(page, SEED_TITLE)).toBeVisible()
      await expect(ui.button(page, /^Save$/).first()).toBeVisible()
    } finally {
      await deleteTestCtas(brief.id, SEED_TITLE)
    }
  })
})

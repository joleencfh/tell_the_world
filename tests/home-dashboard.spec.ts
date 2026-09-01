/**
 * Home dashboard — Highlighted module and This Week feed
 * (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md §2, Parts 3/4)
 *
 * Prerequisites
 * ─────────────
 * 1. Seed the test briefs: bun scripts/seed-test-briefs.ts
 * 2. `playwright/.auth/expert.json` must exist (written by global-setup.ts).
 *
 * Both sections are additive and render nothing when there's no data (no
 * dashboard_featured brief, no activity in the trailing 7-day window) —
 * these tests seed their own rows via the service-role client (bypassing
 * the admin curation UI and submission flows, same pattern as
 * tests/faq-answers.spec.ts) so the assertions don't depend on whatever
 * state happens to already exist in the shared dev database, and restore
 * that state in afterEach.
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  getTestBrief,
  getFeaturedBriefId,
  setFeaturedBrief,
  insertPublishedCoverage,
  deleteTestCoverage,
  insertPublishedQuotePost,
  deleteTestContentPost,
  TestUser,
  TestBrief,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const expertEmail = process.env.TEST_EXPERT_EMAIL ?? ''
if (!expertEmail) {
  throw new Error('TEST_EXPERT_EMAIL must be set in .env.local')
}

const BRIEF_SLUG = 'test-public-brief'

// ---------------------------------------------------------------------------
// Highlighted module
// ---------------------------------------------------------------------------

test.describe('Home dashboard — Highlighted module', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  let expert: TestUser
  let brief: TestBrief
  let previousFeaturedId: string | null
  let quoteId: string | null = null
  let coverageId: string | null = null

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
    previousFeaturedId = await getFeaturedBriefId()
  })

  test.afterEach(async () => {
    if (quoteId) await deleteTestContentPost(quoteId)
    if (coverageId) await deleteTestCoverage(coverageId)
    quoteId = null
    coverageId = null
    await setFeaturedBrief(previousFeaturedId)
  })

  test('no brief is dashboard_featured — the section renders nothing', async ({ page }) => {
    await setFeaturedBrief(null)

    await page.goto('/home')

    await expect(page.getByText('Spotlight')).toHaveCount(0)
    await expect(page.getByText('This brief is worth your time')).toHaveCount(0)
  })

  test('a featured brief shows its title, quote, and coverage with no score badge', async ({ page }) => {
    const stamp = Date.now()
    const quoteBody = `Highlighted-module Playwright quote ${stamp}`
    const coverageTitle = `Highlighted-module Playwright coverage ${stamp}`

    const quote = await insertPublishedQuotePost(brief.id, expert.id, {
      title: quoteBody,
      body: quoteBody,
    })
    quoteId = quote.id

    const coverage = await insertPublishedCoverage(brief.id, expert.id, {
      title: coverageTitle,
      url: 'https://example.com/playwright-coverage',
      outletName: 'Playwright Times',
    })
    coverageId = coverage.id

    await setFeaturedBrief(brief.id)

    await page.goto('/home')

    // Scoped to the Highlighted <section> itself — the seeded quote/coverage
    // also legitimately show up elsewhere on the page (This Week's river,
    // From Your Network's author feed), so a page-wide text search would hit
    // strict-mode ambiguity.
    const highlighted = page.locator('section').filter({ hasText: 'Spotlight' })

    await expect(highlighted.getByText('Spotlight')).toBeVisible()
    await expect(highlighted.getByRole('heading', { name: brief.title, level: 3 })).toBeVisible()

    const quotesTab = highlighted.getByRole('tab', { name: 'Selected Quotes' })
    await quotesTab.click()
    await expect(quotesTab).toHaveAttribute('aria-selected', 'true')
    await expect(highlighted.getByText(quoteBody).first()).toBeVisible()

    const coverageTab = highlighted.getByRole('tab', { name: 'Covered By' })
    await coverageTab.click()
    await expect(coverageTab).toHaveAttribute('aria-selected', 'true')
    await expect(highlighted.getByText(coverageTitle)).toBeVisible()
    await expect(highlighted.getByText('Playwright Times')).toBeVisible()

    // CoverageCard's dashboard-local sibling never renders a score badge —
    // brief-page-part2-plan.md Part 9 already dropped it from the real
    // CoverageCard, and this must stay true here too (this plan's §0).
    await expect(highlighted.getByText(/score/i)).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// This Week feed
// ---------------------------------------------------------------------------

test.describe('Home dashboard — This Week feed', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  let expert: TestUser
  let brief: TestBrief
  let quoteId: string | null = null
  let coverageId: string | null = null

  test.beforeAll(async () => {
    ;[expert, brief] = await Promise.all([getTestUser(expertEmail), getTestBrief(BRIEF_SLUG)])
  })

  test.afterEach(async () => {
    if (quoteId) await deleteTestContentPost(quoteId)
    if (coverageId) await deleteTestCoverage(coverageId)
    quoteId = null
    coverageId = null
  })

  test('a freshly published quote and coverage row appear, internal linking to the brief and external opening the source url', async ({ page }) => {
    const stamp = Date.now()
    const quoteBody = `This-Week Playwright quote ${stamp}`
    const coverageTitle = `This-Week Playwright coverage ${stamp}`
    const coverageUrl = 'https://example.com/playwright-this-week-coverage'

    const quote = await insertPublishedQuotePost(brief.id, expert.id, {
      title: quoteBody,
      body: quoteBody,
    })
    quoteId = quote.id

    const coverage = await insertPublishedCoverage(brief.id, expert.id, {
      title: coverageTitle,
      url: coverageUrl,
      outletName: 'Playwright Weekly',
    })
    coverageId = coverage.id

    await page.goto('/home')

    await expect(page.getByRole('heading', { name: 'What moved since Monday' })).toBeVisible()

    // Internal row (a quote attached to a brief) links to the brief itself.
    const quoteLink = page.getByRole('link', { name: new RegExp(quoteBody) })
    await expect(quoteLink).toBeVisible()
    await expect(quoteLink).toHaveAttribute('href', `/briefs/${brief.slug}`)

    // External/coverage row opens the source in a new tab, not an in-app route.
    const coverageLink = page.getByRole('link', { name: new RegExp(`covered.*${coverageTitle}`) })
    await expect(coverageLink).toBeVisible()
    await expect(coverageLink).toHaveAttribute('href', coverageUrl)
    await expect(coverageLink).toHaveAttribute('target', '_blank')
    await expect(coverageLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

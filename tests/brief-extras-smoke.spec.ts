/**
 * Brief page extras - behaviour-only smoke test (design-system-phase4d, step 1)
 *
 * Covers sources, timeline, related briefs, coverage, the Contribute menu's
 * suggest-CTA path, explainer comments and the "useful" likers dialog.
 * Written BEFORE the Phase 4d restyling so it pins behaviour on the old UI and
 * keeps passing on the new one. Assertions use roles, text and behaviour, never
 * classes or colours. Every locator lives in the `extras` helper below, so later
 * steps change only that helper.
 *
 * Prerequisites
 * -------------
 * `playwright/.auth/creator.json` must exist (written by global-setup.ts) and
 * TEST_CREATOR_EMAIL must be set in .env.local. The spec creates and deletes its
 * own throwaway briefs and rows. UNEXECUTED when written: Playwright was not run
 * in the authoring environment.
 *
 * Already covered elsewhere (not repeated here): tests/ctas.spec.ts covers
 * submitting a CTA through "+ New CTA" and the published CTA card. Nothing else
 * in this area (sources, timeline, related briefs, coverage, comments, useful
 * likers) has a spec.
 *
 * Not covered on purpose: posting a comment, adding coverage or a CTA (server
 * actions that write rows), contentious points (needs an expert-only flow), and
 * the reviewers dialog (needs a seeded review or endorsement fixture with no
 * existing helper).
 *
 * test.fixme cases below are the Escape and focus-return behaviours the old
 * hand-rolled modals do not have; the migrating steps enable them once the
 * modals move onto the shared Modal.
 */

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
  TestUser,
  TestBrief,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

// ---------------------------------------------------------------------------
// Markup helper: the ONLY place that knows how these components are built.
// Later steps of the plan restyle them; update here only.
// ---------------------------------------------------------------------------

const extras = {
  explainer: (page: Page) => page.locator('#section-explainer'),
  coverageSection: (page: Page) => page.locator('#section-coverage'),

  /** A source card, found by its title (a keyboard-operable button-like element). */
  sourceCard: (page: Page, title: string) =>
    extras.explainer(page).getByRole('button').filter({ hasText: title }).first(),

  /** The visit link inside a source card. */
  sourceLink: (page: Page, title: string) =>
    extras.explainer(page).getByRole('link', { name: `Visit source: ${title}` }),

  /** The summary drawer of an opened source, and its close control. */
  sourceDrawerHeading: (page: Page) => extras.explainer(page).getByText(/^Source \d+ . Summary$/),
  sourceDrawerClose: (page: Page) => extras.explainer(page).getByRole('button', { name: 'Close summary' }),

  /** The timeline list that contains the given event name, and its items. */
  timelineItems: (page: Page, containing: string) =>
    extras.explainer(page).locator('ol').filter({ hasText: containing }).getByRole('listitem'),

  /** The link to a related brief, found by its title. */
  relatedBriefLink: (page: Page, title: string) =>
    page.locator('#section-related').getByRole('link', { name: new RegExp(title) }),

  /** A coverage card, found by its title. */
  coverageCard: (page: Page, title: string) =>
    extras.coverageSection(page).getByRole('button').filter({ hasText: title }).first(),

  coverageDetailDialog: (page: Page) => page.getByRole('dialog', { name: 'Coverage detail' }),
  coverageDetailClose: (page: Page) =>
    extras.coverageDetailDialog(page).getByRole('button', { name: 'Close', exact: true }),

  addCoverageButton: (page: Page) => extras.coverageSection(page).getByRole('button', { name: '+ Add coverage' }),
  addCoverageDialog: (page: Page) => page.getByRole('dialog', { name: 'Add coverage' }),
  addCoverageCancel: (page: Page) =>
    extras.addCoverageDialog(page).getByRole('button', { name: 'Cancel', exact: true }),

  contributeButton: (page: Page) => page.getByRole('button', { name: /^Contribute/ }),
  suggestCtaMenuItem: (page: Page) => page.getByRole('button', { name: 'Suggest a call to action' }),
  suggestCtaDialog: (page: Page) => page.getByRole('dialog', { name: 'Suggest a call to action' }),
  suggestCtaCancel: (page: Page) =>
    extras.suggestCtaDialog(page).getByRole('button', { name: 'Cancel', exact: true }),

  /** A published comment's text, and the reply control and field. */
  commentText: (page: Page, text: string) => page.locator('#explainer-comments').getByText(text),
  replyButton: (page: Page) => page.locator('#explainer-comments').getByRole('button', { name: 'Reply' }).first(),
  replyField: (page: Page) => page.locator('#explainer-comments').getByLabel(/^Reply to /),

  /** The "useful" count control in the explainer header (its text is the count) and its dialog. */
  usefulCountButton: (page: Page, count: number) =>
    extras.explainer(page).getByRole('button', { name: String(count), exact: true }).first(),
  usefulLikersDialog: (page: Page) => page.getByRole('dialog', { name: 'Found this useful' }),
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stamp = Date.now()
const SLUG = `ds4d-extras-${stamp}`
const RELATED_SLUG = `ds4d-extras-related-${stamp}`
const TOPIC_TAG = `ds4d-topic-${stamp}`
const SOURCE_ONE = `Platform transparency report ${stamp}`
const SOURCE_TWO = `Independent audit of ranking systems ${stamp}`
const EVENT_ONE = `Regulation proposed ${stamp}`
const EVENT_TWO = `Regulation adopted ${stamp}`
const COVERAGE_TITLE = `Coverage headline ${stamp}`
const COMMENT_BODY = `A thoughtful comment ${stamp}`
const RELATED_TITLE = `DS4D Extras Related ${stamp}`

const SOURCES_TEXT = [
  `• ${SOURCE_ONE}`,
  'Publisher: Example Press',
  'A first source description.',
  'https://example.com/source-one',
  `• ${SOURCE_TWO}`,
  'Publisher: Example Institute',
  'A second source description.',
  'https://example.com/source-two',
].join('\n')

function authorName(user: TestUser): string {
  return user.display_name?.trim() || user.email.split('@')[0] || 'Member'
}

test.describe('Brief extras smoke test', () => {
  test.describe.configure({ mode: 'serial' })

  let creator: TestUser
  let brief: TestBrief
  let relatedBrief: TestBrief
  let coverageId = ''

  test.beforeAll(async () => {
    const db = getTestAdminClient()
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4D Extras ${stamp}`, slug: SLUG, visibility: 'public' })
    relatedBrief = await createTestBrief({ title: RELATED_TITLE, slug: RELATED_SLUG, visibility: 'public' })

    // Related briefs match on a shared topic tag.
    for (const id of [brief.id, relatedBrief.id]) {
      const { error } = await db.from('briefs').update({ topic_tags: [TOPIC_TAG] }).eq('id', id)
      if (error) throw new Error(`Failed to set topic_tags: ${error.message}`)
    }

    await insertBriefSection(brief.id, {
      section_type: 'explainer',
      title: 'First subsection',
      content: 'The first paragraph of the explainer.',
      display_order: 1,
    })
    await insertBriefSection(brief.id, { section_type: 'going_deeper', content: SOURCES_TEXT, display_order: 2 })

    const { error: timelineError } = await db.from('brief_timeline_events').insert([
      { brief_id: brief.id, event_name: EVENT_ONE, event_date: '2024-01-15', display_order: 1 },
      { brief_id: brief.id, event_name: EVENT_TWO, event_date: '2024-06-20', display_order: 2 },
    ])
    if (timelineError) throw new Error(`Failed to insert timeline events: ${timelineError.message}`)

    const coverage = await insertPublishedCoverage(brief.id, creator.id, {
      title: COVERAGE_TITLE,
      url: 'https://example.com/coverage-article',
      outletName: 'Example Outlet',
    })
    coverageId = coverage.id

    const { error: commentError } = await db
      .from('explainer_comments')
      .insert({ brief_id: brief.id, user_id: creator.id, body: COMMENT_BODY })
    if (commentError) throw new Error(`Failed to insert explainer comment: ${commentError.message}`)

    const { error: voteError } = await db
      .from('explainer_useful_votes')
      .insert({ brief_id: brief.id, user_id: creator.id })
    if (voteError) throw new Error(`Failed to insert useful vote: ${voteError.message}`)
  })

  test.afterAll(async () => {
    const db = getTestAdminClient()
    if (brief) {
      await db.from('explainer_comments').delete().eq('brief_id', brief.id)
      await db.from('explainer_useful_votes').delete().eq('brief_id', brief.id)
      await db.from('brief_timeline_events').delete().eq('brief_id', brief.id)
    }
    if (coverageId) await deleteTestCoverage(coverageId)
    if (brief) await deleteTestBrief(brief.id)
    if (relatedBrief) await deleteTestBrief(relatedBrief.id)
  })

  test.describe('logged-out visitor', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('(a) sources render with links; a source drawer opens in place and closes again', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await expect(extras.sourceCard(page, SOURCE_ONE)).toBeVisible()
      await expect(extras.sourceCard(page, SOURCE_TWO)).toBeVisible()
      await expect(extras.sourceLink(page, SOURCE_ONE)).toHaveAttribute('href', 'https://example.com/source-one')
      await expect(extras.sourceLink(page, SOURCE_TWO)).toHaveAttribute('href', 'https://example.com/source-two')
      await expect(extras.sourceDrawerHeading(page)).toHaveCount(0)

      await extras.sourceCard(page, SOURCE_ONE).click()
      await expect(extras.sourceDrawerHeading(page)).toBeVisible()
      await expect(extras.sourceDrawerClose(page)).toBeVisible()

      await extras.sourceDrawerClose(page).click()
      await expect(extras.sourceDrawerHeading(page)).toHaveCount(0)
    })

    test('(a2) the timeline entries render in display order', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const items = extras.timelineItems(page, EVENT_ONE)
      await expect(items).toHaveCount(2)
      await expect(items.nth(0)).toContainText(EVENT_ONE)
      await expect(items.nth(1)).toContainText(EVENT_TWO)
    })

    test('(b) the related brief renders as a link to its page', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const link = extras.relatedBriefLink(page, RELATED_TITLE)
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', `/briefs/${RELATED_SLUG}`)
    })

    test('(c) a coverage card shows its title; clicking it opens the detail dialog and Close dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await expect(extras.coverageSection(page).getByText(COVERAGE_TITLE).first()).toBeVisible()

      await extras.coverageCard(page, COVERAGE_TITLE).click()
      const dialog = extras.coverageDetailDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText(COVERAGE_TITLE)).toBeVisible()

      await extras.coverageDetailClose(page).click()
      await expect(dialog).toHaveCount(0)
    })

    // Old hand-rolled modal has no Escape handling or focus return; enabled by
    // the step that moves it onto the shared Modal. The opener is the card,
    // which stays mounted, so focus return is assertable.
    test.fixme('(c2) Escape closes the coverage detail dialog and returns focus to the card', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const card = extras.coverageCard(page, COVERAGE_TITLE)
      await card.focus()
      await page.keyboard.press('Enter')

      const dialog = extras.coverageDetailDialog(page)
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(card).toBeFocused()
    })

    test('(f) a seeded comment is visible and the reply control reveals a log-in prompt', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await expect(extras.commentText(page, COMMENT_BODY)).toBeVisible()
      await expect(extras.replyButton(page)).toHaveAttribute('aria-expanded', 'false')

      await extras.replyButton(page).click()
      await expect(extras.replyButton(page)).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('#explainer-comments').getByRole('link', { name: 'Log in' })).toBeVisible()
    })
  })

  test.describe('signed-in creator', () => {
    test.use({ storageState: 'playwright/.auth/creator.json' })

    test('(d) "+ Add coverage" opens the add-coverage dialog and Cancel dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await extras.addCoverageButton(page).click()
      const dialog = extras.addCoverageDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByLabel('Article URL')).toBeVisible()

      await extras.addCoverageCancel(page).click()
      await expect(dialog).toHaveCount(0)
    })

    test.fixme('(d2) Escape closes the add-coverage dialog and returns focus to "+ Add coverage"', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const opener = extras.addCoverageButton(page)
      await opener.click()
      const dialog = extras.addCoverageDialog(page)
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(opener).toBeFocused()
    })

    // tests/ctas.spec.ts covers the "+ New CTA" path as an expert; this is the
    // creator's Contribute menu path to the same dialog.
    test('(e) the Contribute menu "Suggest a call to action" opens its dialog and Cancel dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await extras.contributeButton(page).click()
      await extras.suggestCtaMenuItem(page).click()
      const dialog = extras.suggestCtaDialog(page)
      await expect(dialog).toBeVisible()

      await extras.suggestCtaCancel(page).click()
      await expect(dialog).toHaveCount(0)
    })

    // The opener (a menu item) unmounts on select, so focus return is NOT asserted.
    test.fixme('(e2) Escape closes the suggest-CTA dialog', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await extras.contributeButton(page).click()
      await extras.suggestCtaMenuItem(page).click()
      const dialog = extras.suggestCtaDialog(page)
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })

    test('(f2) the reply control reveals a reply field for a signed-in member', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await expect(extras.commentText(page, COMMENT_BODY)).toBeVisible()

      await extras.replyButton(page).click()
      await expect(extras.replyField(page)).toBeVisible()
    })

    test('(g) the useful count opens the likers dialog listing the voter; Close dismisses it', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await extras.usefulCountButton(page, 1).click()

      const dialog = extras.usefulLikersDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText(authorName(creator))).toBeVisible()

      await dialog.getByRole('button', { name: 'Close' }).click()
      await expect(dialog).toHaveCount(0)
    })

    // The opener (the count button) stays mounted, so focus return is assertable.
    test.fixme('(g2) Escape closes the likers dialog and returns focus to the count', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const opener = extras.usefulCountButton(page, 1)
      await opener.click()
      const dialog = extras.usefulLikersDialog(page)
      await expect(dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(opener).toBeFocused()
    })
  })
})

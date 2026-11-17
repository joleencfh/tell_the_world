/**
 * Brief modals - behaviour-only smoke test (design-system-phase4e, step 1)
 *
 * Covers ProposeBriefModal (opened from the brief page footer) and PostModal
 * (opened from the creator's own profile page). Written BEFORE the Phase 4e
 * restyling so it pins behaviour on the old UI and keeps passing on the new
 * one. Assertions use roles, text and behaviour, never classes or colours.
 * Every locator for a dialog or form lives in the `modals` helper below, so
 * the migrating steps change only that helper.
 *
 * Prerequisites
 * -------------
 * `playwright/.auth/creator.json` must exist (written by global-setup.ts) and
 * TEST_CREATOR_EMAIL must be set in .env.local. The spec creates and deletes
 * its own throwaway brief and quote post. UNEXECUTED when written: Playwright
 * was not run in the authoring environment.
 *
 * Already covered elsewhere (not repeated here):
 * - ContactModal: tests/contact.spec.ts covers opening, the recipient heading,
 *   "Sending as", validation, sending and the "message sent" status.
 * - Rich text editor: tests/richtext-editor.spec.ts covers the toolbar, link
 *   and image sub-forms, saving and the legacy textarea path.
 * - Nothing covered ProposeBriefModal or PostModal before this file.
 *
 * Not covered on purpose: submitting a proposal, creating a post, saving an
 * edit or confirming a delete (server actions that write rows).
 *
 * Today ProposeBriefModal and PostModal have no role="dialog" (ContactModal
 * does), so the helper locates them by heading and field label. The steps that
 * move them onto the shared Modal switch the helper to dialog roles and enable
 * the test.fixme cases (dialog role, focus return).
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
// Markup helper: the ONLY place that knows how these components are built.
// Later steps of the plan restyle them; update here only.
// ---------------------------------------------------------------------------

const modals = {
  // --- ProposeBriefModal ---
  proposeOpenButton: (page: Page) => page.getByRole('button', { name: /^Propose a new brief/ }),
  proposeHeading: (page: Page) => page.getByRole('dialog', { name: 'Propose a new brief' }),
  proposeTopicField: (page: Page) => page.getByPlaceholder('e.g. AI governance frameworks in the EU'),
  proposeCancel: (page: Page) => page.getByRole('button', { name: 'Cancel', exact: true }),
  proposeClose: (page: Page) => page.getByRole('button', { name: 'Close', exact: true }),
  /** ProposeBriefModal is on the shared Modal (dialog role). */
  proposeDialog: (page: Page) => page.getByRole('dialog', { name: 'Propose a new brief' }),

  // --- PostModal ---
  newPostButton: (page: Page) => page.getByRole('button', { name: 'New Post', exact: true }),
  editPostButton: (page: Page) => page.getByRole('button', { name: 'Edit post' }).first(),
  postCreateHeading: (page: Page) => page.getByRole('dialog', { name: 'Share something' }),
  postEditHeading: (page: Page) => page.getByRole('dialog', { name: 'Edit your post' }),
  postTypeButton: (page: Page, label: string) => page.getByRole('radio', { name: label, exact: true }),
  postTitleField: (page: Page) => page.getByPlaceholder(/^(Title of your post|The quote itself)$/),
  postCancel: (page: Page) => page.getByRole('button', { name: 'Cancel', exact: true }),
  postClose: (page: Page) => page.getByRole('button', { name: 'Close', exact: true }),
  postDeleteStart: (page: Page) => page.getByRole('button', { name: 'Delete post', exact: true }),
  postDeleteHeading: (page: Page) => page.getByText('Delete this post?', { exact: true }),
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stamp = Date.now()
const SLUG = `ds4e-modals-${stamp}`
const POST_TITLE = `DS4E modal quote ${stamp}`

test.describe('Brief modals smoke test', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ storageState: 'playwright/.auth/creator.json' })

  let creator: TestUser
  let brief: TestBrief
  let postId = ''

  test.beforeAll(async () => {
    creator = await getTestUser(creatorEmail)
    brief = await createTestBrief({ title: `DS4E Modals ${stamp}`, slug: SLUG, visibility: 'public' })
    const post = await insertPublishedQuotePost(brief.id, creator.id, {
      title: POST_TITLE,
      body: 'A short attribution for the throwaway quote.',
    })
    postId = post.id
  })

  test.afterAll(async () => {
    if (postId) await deleteTestContentPost(postId)
    if (brief) await deleteTestBrief(brief.id)
  })

  test.describe('ProposeBriefModal', () => {
    test('(a) "Propose a new brief" opens the form and Cancel dismisses it without submitting', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await modals.proposeOpenButton(page).click()
      await expect(modals.proposeHeading(page)).toBeVisible()
      await expect(modals.proposeTopicField(page)).toBeVisible()

      await modals.proposeCancel(page).click()
      await expect(modals.proposeHeading(page)).toHaveCount(0)
    })

    test('(a2) the Close control dismisses the form', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await modals.proposeOpenButton(page).click()
      await expect(modals.proposeHeading(page)).toBeVisible()

      await modals.proposeClose(page).click()
      await expect(modals.proposeHeading(page)).toHaveCount(0)
    })

    test('(a3) Escape closes the form', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      await modals.proposeOpenButton(page).click()
      await expect(modals.proposeHeading(page)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(modals.proposeHeading(page)).toHaveCount(0)
    })

    // Shared Modal: named dialog and focus return; the opener stays mounted.
    test('(a4) the form is a named dialog and Escape returns focus to the opener', async ({ page }) => {
      await page.goto(`/briefs/${SLUG}`)
      const opener = modals.proposeOpenButton(page)
      await opener.click()
      await expect(modals.proposeDialog(page)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(modals.proposeDialog(page)).toHaveCount(0)
      await expect(opener).toBeFocused()
    })
  })

  test.describe('PostModal', () => {
    test('(b) "New Post" opens the create form with the post-type and title fields; Cancel dismisses it', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      await modals.newPostButton(page).click()
      await expect(modals.postCreateHeading(page)).toBeVisible()
      await expect(modals.postTypeButton(page, 'Article')).toBeVisible()
      await expect(modals.postTypeButton(page, 'Quote')).toBeVisible()
      await expect(modals.postTitleField(page)).toBeVisible()

      await modals.postCancel(page).click()
      await expect(modals.postCreateHeading(page)).toHaveCount(0)
    })

    test('(b2) the Close control and Escape both dismiss the create form', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      await modals.newPostButton(page).click()
      await expect(modals.postCreateHeading(page)).toBeVisible()
      await modals.postClose(page).click()
      await expect(modals.postCreateHeading(page)).toHaveCount(0)

      await modals.newPostButton(page).click()
      await expect(modals.postCreateHeading(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(modals.postCreateHeading(page)).toHaveCount(0)
    })

    test('(c) editing the seeded post opens the form with its title prefilled', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      await expect(page.getByText(POST_TITLE).first()).toBeVisible()

      // The seeded post is the newest, so its Edit control is the first one.
      await modals.editPostButton(page).click()
      await expect(modals.postEditHeading(page)).toBeVisible()
      await expect(modals.postTitleField(page)).toHaveValue(POST_TITLE)

      await modals.postCancel(page).click()
      await expect(modals.postEditHeading(page)).toHaveCount(0)
    })

    test('(d) Delete post shows the confirmation and Cancel returns to the form without deleting', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      await modals.editPostButton(page).click()
      await expect(modals.postEditHeading(page)).toBeVisible()

      await modals.postDeleteStart(page).click()
      await expect(modals.postDeleteHeading(page)).toBeVisible()
      await expect(modals.postTitleField(page)).toHaveCount(0)

      // Cancel in the confirmation returns to the form; the post is untouched.
      await modals.postCancel(page).click()
      await expect(modals.postDeleteHeading(page)).toHaveCount(0)
      await expect(modals.postTitleField(page)).toHaveValue(POST_TITLE)
    })

    test('(d2) Escape in the delete confirmation returns to the form, a second Escape closes the modal', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      await modals.editPostButton(page).click()
      await modals.postDeleteStart(page).click()
      await expect(modals.postDeleteHeading(page)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(modals.postDeleteHeading(page)).toHaveCount(0)
      await expect(modals.postEditHeading(page)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(modals.postEditHeading(page)).toHaveCount(0)
    })

    // Shared Modal: named dialog and focus return; the "New Post" opener stays mounted.
    test('(b3) the create form is a named dialog and Escape returns focus to "New Post"', async ({ page }) => {
      await page.goto(`/profile/${creator.id}`)
      const opener = modals.newPostButton(page)
      await opener.click()
      await expect(modals.postCreateHeading(page)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(modals.postCreateHeading(page)).toHaveCount(0)
      await expect(opener).toBeFocused()
    })
  })
})

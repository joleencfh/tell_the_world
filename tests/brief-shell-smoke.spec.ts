/**
 * Brief page shell - behaviour-only smoke test (design-system-phase4a, step 1)
 *
 * Written BEFORE the Phase 4a restyling so it pins behaviour on the old UI and
 * keeps passing on the new one. Assertions use roles, text and behaviour, never
 * classes or colours. Everything that depends on the header or section nav
 * markup lives in the `shell` helper below, so the section nav rebuild (step 5)
 * only has to change that helper.
 *
 * Prerequisites
 * -------------
 * `playwright/.auth/creator.json` must exist (written by global-setup.ts) and
 * TEST_CREATOR_EMAIL must be set in .env.local. The spec creates and deletes
 * its own throwaway briefs.
 *
 * Already covered elsewhere (not repeated here):
 *   - tests/briefs.spec.ts: logged-out public brief (h1, TL;DR heading, no
 *     lock, no "Apply to Join", Apply and Login links in the banner);
 *     logged-out members-only brief (h1, TL;DR, "Members Only", "Apply to
 *     Join" to /apply, "Already a member? Login" to /login, other sections
 *     hidden); Q&A absent when logged out.
 *   - tests/qa-votes.spec.ts: the Q&A upvote toggle.
 */

import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import {
  getTestUser,
  createTestBrief,
  insertBriefSection,
  deleteTestBrief,
  TestUser,
  TestBrief,
} from './helpers/supabase'

loadEnvConfig(process.cwd())

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
if (!creatorEmail) {
  throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
}

// ---------------------------------------------------------------------------
// Markup helper: the ONLY place that knows how the header and the section nav
// are built. Step 5 of the plan rebuilds the section nav; update here only.
// ---------------------------------------------------------------------------

const shell = {
  banner: (page: Page) => page.getByRole('banner'),

  /** Opens the account menu when the header keeps the account links in one. */
  async revealAccountLinks(page: Page) {
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Account menu' })
    if (await trigger.count()) await trigger.click()
  },

  profileLink: (page: Page) =>
    page.getByRole('link', { name: 'Profile', exact: true }).or(page.getByRole('menuitem', { name: 'Profile', exact: true })),

  signOutControl: (page: Page) =>
    page.getByRole('button', { name: /sign out/i }).or(page.getByRole('menuitem', { name: /sign out/i })),

  /** Opens the section nav if it is collapsed behind a trigger. */
  async openSectionNav(page: Page) {
    const trigger = page.getByRole('button', { name: 'Jump to section' })
    if (await trigger.count()) {
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click()
    }
  },

  /** The control that jumps to a section, by its visible label. */
  sectionEntry: (page: Page, label: string) => {
    // The nav button's accessible name is "<number> <label>" (e.g. "02 Explainer"), so match the label
    // at the end of the name, and never the 'Jump to section' trigger.
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return page.getByRole('button', { name: new RegExp(`^(?!Jump to section).*${escaped}$`) })
  },

  /** Asserts which section the nav reports as the current one. */
  async expectCurrentSection(page: Page, label: string) {
    const trigger = page.getByRole('button', { name: 'Jump to section' })
    await expect(trigger).toContainText(label)
  },

  /** The section wrapper that a nav entry scrolls to. */
  sectionBlock: (page: Page, type: string) => page.locator(`#section-${type}`),
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stamp = Date.now()
const PUBLIC_SLUG = `ds4a-shell-${stamp}`
const MEMBERS_SLUG = `ds4a-shell-members-${stamp}`
const KEY_TERM = 'bandwidth'
const KEY_TERM_DEFINITION = 'The maximum rate of data transfer'
const EXPLAINER_TITLE = 'Why the rule matters'
const EXPLAINER_PARAGRAPH = `Platforms differ in how much ${'{{'}${KEY_TERM}|${KEY_TERM_DEFINITION}${'}}'} they can offer to each creator.`

async function seedSections(briefId: string) {
  await insertBriefSection(briefId, {
    section_type: 'tldr',
    content: 'First summary line\nSecond summary line\nThird summary line',
    display_order: 1,
  })
  await insertBriefSection(briefId, {
    section_type: 'explainer',
    title: EXPLAINER_TITLE,
    content: EXPLAINER_PARAGRAPH,
    display_order: 2,
  })
  await insertBriefSection(briefId, {
    section_type: 'faq',
    content: 'Placeholder question content',
    display_order: 3,
  })
}

test.describe('Brief page shell smoke test', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ storageState: 'playwright/.auth/creator.json' })

  let creator: TestUser
  let publicBrief: TestBrief
  let membersBrief: TestBrief

  test.beforeAll(async () => {
    creator = await getTestUser(creatorEmail)
    publicBrief = await createTestBrief({
      title: `DS4A Shell ${stamp}`,
      slug: PUBLIC_SLUG,
      visibility: 'public',
    })
    await seedSections(publicBrief.id)
    membersBrief = await createTestBrief({
      title: `DS4A Shell Members ${stamp}`,
      slug: MEMBERS_SLUG,
      visibility: 'members_only',
    })
    await seedSections(membersBrief.id)
  })

  test.afterAll(async () => {
    if (publicBrief) await deleteTestBrief(publicBrief.id)
    if (membersBrief) await deleteTestBrief(membersBrief.id)
  })

  test('(a) signed-in header links to the own profile, offers sign out, hides Apply and Login', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('DS4A Shell')

    await shell.revealAccountLinks(page)
    const profile = shell.profileLink(page)
    await expect(profile).toBeVisible()
    await expect(profile).toHaveAttribute('href', `/profile/${creator.id}`)
    await expect(shell.signOutControl(page)).toBeVisible()

    const banner = shell.banner(page)
    await expect(banner.getByRole('link', { name: 'Apply', exact: true })).toHaveCount(0)
    await expect(banner.getByRole('link', { name: 'Login', exact: true })).toHaveCount(0)
  })

  test('(b) section nav lists the rendered sections and jumps to and marks the chosen one', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('DS4A Shell')

    await shell.openSectionNav(page)
    for (const label of ['TL;DR', 'Explainer', 'Common Questions']) {
      await expect(shell.sectionEntry(page, label)).toBeVisible()
    }

    await shell.sectionEntry(page, 'Common Questions').click()
    await expect(shell.sectionBlock(page, 'faq')).toBeInViewport()
    await shell.expectCurrentSection(page, 'Common Questions')

    await shell.openSectionNav(page)
    await shell.sectionEntry(page, 'Explainer').click()
    await expect(shell.sectionBlock(page, 'explainer')).toBeInViewport()
    await shell.expectCurrentSection(page, 'Explainer')
  })

  test('(c) a key term shows its definition on hover and on keyboard focus', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    const term = page.getByText(KEY_TERM, { exact: true })
    const tooltip = page.getByRole('tooltip').filter({ hasText: KEY_TERM_DEFINITION })
    await expect(term).toBeVisible()
    await expect(tooltip).toHaveCount(1)
    await expect(tooltip).toHaveCSS('opacity', '0')

    await term.hover()
    await expect(tooltip).toHaveCSS('opacity', '1')

    await page.mouse.move(0, 0)
    await expect(tooltip).toHaveCSS('opacity', '0')

    await term.focus()
    await expect(tooltip).toHaveCSS('opacity', '1')
  })

  test('(d) the Explainer renders its title and paragraph', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    const block = shell.sectionBlock(page, 'explainer')
    await expect(block.getByText(EXPLAINER_TITLE)).toBeVisible()
    await expect(block.getByText('Platforms differ in how much')).toBeVisible()
  })

  test('(e) the hero contribute control opens, lists items and closes on an outside click', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    const trigger = page.getByRole('button', { name: /^Contribute/ })
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const item = page.getByRole('button', { name: 'Send feedback on this page' }).or(
      page.getByRole('menuitem', { name: 'Send feedback on this page' }),
    )
    await expect(item).toBeVisible()

    await page.getByRole('heading', { level: 1 }).click()
    await expect(item).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('(f) a members-only brief shows its sections and no lock panel to a signed-in member', async ({ page }) => {
    await page.goto(`/briefs/${MEMBERS_SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('DS4A Shell Members')
    await expect(shell.sectionBlock(page, 'explainer').getByText(EXPLAINER_TITLE)).toBeVisible()
    await expect(page.getByText('Members Only')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Apply to Join' })).toHaveCount(0)
  })
})

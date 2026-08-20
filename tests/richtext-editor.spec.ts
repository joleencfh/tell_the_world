/**
 * Explainer rich text editor — end-to-end tests (docs/design/brief-feature/
 * brief-page-part2-plan.md §2, Part 0b).
 *
 * Prerequisites
 * ─────────────
 * 1. Apply supabase/033_brief_sections_rich_content.sql in the Supabase SQL
 *    Editor.
 * 2. `playwright/.auth/admin.json` must exist (written by global-setup.ts,
 *    requires TEST_ADMIN_EMAIL in .env.local) AND the dev server this suite
 *    runs against must be started with ADMIN_EMAIL=<the same
 *    TEST_ADMIN_EMAIL value> — see tests/two-ink-bold-11f-admin.spec.ts's
 *    header comment for the full explanation and the local override
 *    command. The beforeEach below skips with a clear message instead of
 *    failing confusingly if that's not the case.
 *
 * What this covers
 * ─────────────────
 * The plan's own Part 0b verify step, end to end: a legacy plain-text
 * explainer subsection keeps its textarea and is unaffected on load; a
 * brand-new subsection goes straight to the Lexical editor; Bold + an
 * internal link + an external link round-trip through Save into
 * brief_sections.rich_content and back (re-verified after a page reload,
 * which re-seeds Lexical's own editorState from what's in the DB); an
 * invalid link URL is rejected at creation time, not just at render time;
 * a legacy subsection can be switched over one-way; and the public page
 * renders the result as real <strong>/<a> elements — never literal markup.
 *
 * Runs against a dedicated throwaway brief, not test-public-brief — unlike
 * the additive child-row fixtures other specs use (CTAs, FAQ answers,
 * questions), these tests edit a brief's own brief_sections rows through
 * the admin editor and need deterministic section count/order to locate a
 * specific subsection in the DOM, so sharing the fixture other specs also
 * render concurrently isn't worth the risk.
 *
 * Tests within the describe block run in sequence (Playwright's default for
 * one file) and build on each other: the "brand-new subsection" added and
 * saved in one test is the "new" 4th section every later test locates by
 * position — see the beforeAll seed order below.
 */

import { test, expect, type Locator, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'
import { createTestBrief, deleteTestBrief, insertBriefSection, type TestBrief } from './helpers/supabase'

loadEnvConfig(process.cwd())

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

const LEGACY_CONTENT = 'Legacy paragraph with a {{keyterm|a definition}} inline.'
const LINK_INPUT_PLACEHOLDER = '/briefs/some-brief-slug or https://example.com'

function sectionContainers(page: Page): Locator {
  return page.locator('div.border.border-line.bg-paper-raised')
}

test.describe('Explainer rich text editor (Part 0b)', () => {
  test.use({ storageState: adminFixtureExists ? adminFixturePath : undefined })

  let brief: TestBrief

  test.beforeAll(async () => {
    brief = await createTestBrief({
      title: 'Playwright Rich Text Test Brief',
      slug: `playwright-richtext-${Date.now()}`,
      visibility: 'public',
    })

    // Seed order matters — tests below locate subsections by position
    // (sectionContainers().nth(i)), sorted by display_order same as the
    // admin editor itself.
    await insertBriefSection(brief.id, {
      section_type: 'tldr',
      content: 'This is a test brief used for rich text editor end-to-end testing.',
      display_order: 1,
    })
    await insertBriefSection(brief.id, {
      section_type: 'explainer',
      content: LEGACY_CONTENT,
      display_order: 2,
    })
    await insertBriefSection(brief.id, {
      section_type: 'faq',
      content: 'Q: Is this real?\nA: No, it is a Playwright test fixture.',
      display_order: 3,
    })
  })

  test.afterAll(async () => {
    if (brief) await deleteTestBrief(brief.id)
  })

  test.beforeEach(async ({ page }) => {
    test.skip(
      !adminFixtureExists,
      'playwright/.auth/admin.json not generated — set TEST_ADMIN_EMAIL in .env.local and rerun the suite',
    )
    await page.goto(`/admin/briefs/${brief.id}`)
    if (!page.url().includes('/admin')) {
      test.skip(
        true,
        'Redirected away from /admin — this dev server must be started with ADMIN_EMAIL=<TEST_ADMIN_EMAIL value> (see tests/two-ink-bold-11f-admin.spec.ts header comment)',
      )
    }
    await expect(page.getByRole('heading', { name: 'Edit Brief' })).toBeVisible()
  })

  test('an existing plain-text explainer subsection keeps the textarea and offers a switch to rich text', async ({ page }) => {
    const legacy = sectionContainers(page).nth(1)
    await expect(legacy.locator('textarea')).toHaveValue(LEGACY_CONTENT)
    await expect(legacy.getByRole('button', { name: /Switch to rich text editor/ })).toBeVisible()
    await expect(legacy.locator('[contenteditable="true"]')).toHaveCount(0)
  })

  test('every other section type stays on the plain textarea, with no formatting toolbar', async ({ page }) => {
    const tldr = sectionContainers(page).nth(0)
    await expect(tldr.locator('textarea')).toBeVisible()
    await expect(tldr.locator('button[title="Bold"]')).toHaveCount(0)

    const faq = sectionContainers(page).nth(2)
    await expect(faq.locator('textarea')).toBeVisible()
    await expect(faq.locator('button[title="Bold"]')).toHaveCount(0)
  })

  test('a brand-new explainer subsection goes straight to the rich text editor', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add explainer subsection' }).click()
    const added = sectionContainers(page).nth(3)
    await expect(added.locator('[contenteditable="true"]')).toBeVisible()
    await expect(added.locator('textarea')).toHaveCount(0)
    await expect(added.locator('button[title="Bold"]')).toBeVisible()
    await expect(added.locator('button[title="Link"]')).toBeVisible()
  })

  test('bold + internal link + external link format correctly, an invalid URL is rejected, and Save persists the doc', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add explainer subsection' }).click()
    const added = sectionContainers(page).nth(3)
    const editor = added.locator('[contenteditable="true"]')

    await editor.click()
    await page.keyboard.type('bold-target')
    await page.keyboard.press('Enter')
    await page.keyboard.type('internal-link-target')
    await page.keyboard.press('Enter')
    await page.keyboard.type('external-link-target')
    await page.keyboard.press('Enter')
    await page.keyboard.type('invalid-link-target')

    // Paragraph 1 — bold
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Shift+End')
    await added.locator('button[title="Bold"]').click()
    await expect(editor.locator('p').nth(0).locator('strong')).toHaveText('bold-target')

    // Paragraph 2 — internal link (a path, not a full URL)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End')
    await added.locator('button[title="Link"]').click()
    await added.getByPlaceholder(LINK_INPUT_PLACEHOLDER).fill('/briefs/test-members-brief')
    await added.getByRole('button', { name: 'Apply' }).click()
    const internalLink = editor.locator('p').nth(1).locator('a')
    await expect(internalLink).toHaveText('internal-link-target')
    await expect(internalLink).toHaveAttribute('href', '/briefs/test-members-brief')

    // Paragraph 3 — external link
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End')
    await added.locator('button[title="Link"]').click()
    await added.getByPlaceholder(LINK_INPUT_PLACEHOLDER).fill('https://example.com/playwright-richtext')
    await added.getByRole('button', { name: 'Apply' }).click()
    // target/rel aren't asserted here — the editor's own LinkNode DOM never
    // sets them (TOGGLE_LINK_COMMAND is dispatched with just a URL), since
    // internal-vs-external and target/rel are entirely a read-time decision
    // made by lib/richtext/render.tsx from the URL shape, not authored
    // metadata stored on the node. See the public-page test below for that.
    const externalLink = editor.locator('p').nth(2).locator('a')
    await expect(externalLink).toHaveText('external-link-target')
    await expect(externalLink).toHaveAttribute('href', 'https://example.com/playwright-richtext')

    // Paragraph 4 — invalid URL, rejected at creation (isValidLinkUrl in
    // rich-text-editor.tsx), not just at render time
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End')
    await added.locator('button[title="Link"]').click()
    await added.getByPlaceholder(LINK_INPUT_PLACEHOLDER).fill('not a url')
    await added.getByRole('button', { name: 'Apply' }).click()
    await expect(editor.locator('p').nth(3).locator('a')).toHaveCount(0)
    await expect(editor.locator('p').nth(3)).toHaveText('invalid-link-target')

    // Save, then reload — a real round trip through brief_sections.rich_content,
    // not just client state. Reload re-seeds Lexical's own editorState from
    // what's in the DB, so this also confirms what we wrote is what Lexical
    // itself can read back, not only what our own renderer expects.
    await page.getByRole('button', { name: 'Save' }).first().click()
    await expect(page.getByText('Saved.').first()).toBeVisible()

    await page.reload()
    const reloadedEditor = sectionContainers(page).nth(3).locator('[contenteditable="true"]')
    await expect(reloadedEditor.locator('p').nth(0).locator('strong')).toHaveText('bold-target')
    await expect(reloadedEditor.locator('p').nth(1).locator('a')).toHaveAttribute('href', '/briefs/test-members-brief')
    await expect(reloadedEditor.locator('p').nth(2).locator('a')).toHaveAttribute('href', 'https://example.com/playwright-richtext')
    await expect(reloadedEditor.locator('p').nth(3).locator('a')).toHaveCount(0)
  })

  test('switching a legacy subsection to rich text carries the text over literally, and the switch persists after Save', async ({ page }) => {
    const legacy = sectionContainers(page).nth(1)
    await legacy.getByRole('button', { name: /Switch to rich text editor/ }).click()

    const editor = legacy.locator('[contenteditable="true"]')
    await expect(editor).toBeVisible()
    await expect(legacy.locator('textarea')).toHaveCount(0)
    // Keyterm syntax carries over as literal text, not a tooltip — no
    // special parsing on the rich-text side (out of scope for Part 0b).
    await expect(editor).toContainText(LEGACY_CONTENT)

    await page.getByRole('button', { name: 'Save' }).first().click()
    await expect(page.getByText('Saved.').first()).toBeVisible()

    await page.reload()
    const reloadedLegacy = sectionContainers(page).nth(1)
    await expect(reloadedLegacy.locator('[contenteditable="true"]')).toBeVisible()
    await expect(reloadedLegacy.locator('textarea')).toHaveCount(0)
    await expect(reloadedLegacy.getByRole('button', { name: /Switch to rich text editor/ })).toHaveCount(0)
  })

  test('the public page renders the saved rich text as real elements, and other section types render unaffected', async ({ page }) => {
    await page.goto(`/briefs/${brief.slug}`)

    await expect(page.locator('strong', { hasText: 'bold-target' })).toBeVisible()

    const internalLink = page.locator('a[href="/briefs/test-members-brief"]', { hasText: 'internal-link-target' })
    await expect(internalLink).toBeVisible()
    await expect(internalLink).not.toHaveAttribute('target', '_blank')

    const externalLink = page.locator('a[href="https://example.com/playwright-richtext"]')
    await expect(externalLink).toBeVisible()
    await expect(externalLink).toHaveAttribute('target', '_blank')

    // "invalid-link-target" was rejected as a link in the earlier test — it
    // should still be present as plain text, not missing or a dangling <a>.
    await expect(page.getByText('invalid-link-target')).toBeVisible()

    // The legacy explainer subsection was switched over in the previous
    // test; confirm a genuinely untouched section type (FAQ) still renders.
    await expect(page.getByText('Is this real?')).toBeVisible()
  })
})

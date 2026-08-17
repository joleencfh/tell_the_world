/**
 * Two-Ink Bold — Part 11f (admin) token regression checks.
 *
 * What this proves: every migrated admin class resolves to a real Two-Ink
 * Bold color value (not an undefined Tailwind utility, which is the exact
 * "invisible text" failure mode this whole Part 11 migration exists to
 * avoid — see two-ink-bold-plan.md's Part 11 intro). It does NOT diff
 * against the old Punchy Media Brand values — several old/new near-black
 * tokens (e.g. the old --color-dark #0D0D0D vs. the new --color-ink
 * #0C0D0E) are close enough that "did the hex change" is a weak signal;
 * "does the class resolve to a real, expected value" is the actual bar.
 *
 * Prerequisites
 * ─────────────
 * 1. `playwright/.auth/admin.json` must exist (written by global-setup.ts,
 *    but ONLY if TEST_ADMIN_EMAIL is set — see that file's doc comment for
 *    why this is optional). Admin auth in this app is a single ADMIN_EMAIL
 *    equality check (app/admin/page.tsx), not a role column, so a valid
 *    admin.json session only reaches /admin if the dev server THIS SUITE
 *    RUNS AGAINST was itself started with ADMIN_EMAIL=<the same
 *    TEST_ADMIN_EMAIL value>.
 *      - In CI (.github/workflows/ci.yml): already true — ADMIN_EMAIL is
 *        pointed at the TEST_ADMIN_EMAIL secret for the whole job, so this
 *        spec runs for real on every PR/push, no override needed.
 *      - Locally: your .env.local's ADMIN_EMAIL is presumably your own
 *        real admin address, not TEST_ADMIN_EMAIL, and
 *        playwright.config.ts reuses an already-running dev server
 *        (reuseExistingServer) — so running the suite the normal way will
 *        see admin.json's session get redirected away from /admin; this
 *        file's beforeEach detects that and skips with a message rather
 *        than failing confusingly. To actually exercise it locally:
 *          1. Stop any dev server already running on :3000 (e.g. one open
 *             in a Browser pane / preview_start) — Playwright needs to
 *             spawn its own with the override, not reuse yours.
 *          2. Run:
 *             ADMIN_EMAIL=<your TEST_ADMIN_EMAIL value> bunx playwright test tests/two-ink-bold-11f-admin.spec.ts
 *    This mirrors the tradeoff two-ink-bold-plan.md's Part 9b documents:
 *    one shared Supabase project across dev/CI, no separate staging, so
 *    the real local ADMIN_EMAIL isn't silently repointed — only CI's is,
 *    since CI's dev server is thrown away after every run.
 * 2. Seed the test briefs: bun scripts/seed-test-briefs.ts
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'
import { getTestBrief, insertPendingApplication, deleteTestApplication } from './helpers/supabase'

loadEnvConfig(process.cwd())

const PUBLIC_BRIEF_SLUG = 'test-public-brief'

// Two-Ink Bold token values (app/globals.css) as computed rgb() strings.
const TOKEN = {
  ink: 'rgb(12, 13, 14)',
  line: 'rgb(226, 227, 229)',
  paper: 'rgb(255, 255, 255)',
  blue: 'rgb(30, 79, 235)',
}

const adminFixturePath = path.join(process.cwd(), 'playwright', '.auth', 'admin.json')
const adminFixtureExists = fs.existsSync(adminFixturePath)

test.describe('Admin — Two-Ink Bold tokens', () => {
  test.use({ storageState: adminFixtureExists ? adminFixturePath : undefined })

  test.beforeEach(async ({ page }) => {
    test.skip(
      !adminFixtureExists,
      'playwright/.auth/admin.json not generated — set TEST_ADMIN_EMAIL in .env.local and rerun the suite (see this file\'s header comment)',
    )
    await page.goto('/admin')
    if (!page.url().includes('/admin')) {
      // Wrong-email admin sessions are still authenticated, so
      // app/admin/page.tsx's redirect('/login') gets bounced again by
      // proxy.ts (already-logged-in visitors can't sit on /login) — net
      // destination is /home, not /login. Check we left /admin at all.
      test.skip(
        true,
        'Redirected away from /admin — this dev server must be started with ADMIN_EMAIL=<TEST_ADMIN_EMAIL value> for this describe block (see this file\'s header comment)',
      )
    }
  })

  test('dashboard masthead, header rule, and tab underline resolve to real ink/line values', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()

    const styles = await page.evaluate(() => {
      const header = document.querySelector('header')!
      const wordmark = header.querySelector('span')!
      const em = wordmark.querySelector('em')!
      return {
        headerBorder: getComputedStyle(header).borderBottomColor,
        wordmarkColor: getComputedStyle(wordmark).color,
        emColor: getComputedStyle(em).color,
      }
    })

    expect(styles.headerBorder).toBe(TOKEN.line)
    expect(styles.wordmarkColor).toBe(TOKEN.ink)
    // The <em> no longer carries its own text-live color — it should
    // inherit the same ink as the rest of the wordmark.
    expect(styles.emColor).toBe(styles.wordmarkColor)
  })

  test('a pending application renders a blue tab-count badge and a border-line card', async ({ page }) => {
    // Seed a row so this passes even on an empty dev DB — but the dev DB
    // this ran against already had ~79 pre-existing pending applications
    // (unrelated test debris), ordered oldest-first (lib/data/admin.ts), so
    // a freshly-inserted row lands on a later page, not page 1. Check the
    // first *rendered* card rather than searching for this specific row by
    // text, so the assertion doesn't depend on pagination position.
    const email = `playwright-11f-${Date.now()}@example.com`
    await insertPendingApplication(email, {
      fullName: 'Playwright Eleven F',
      desiredRole: 'creator',
      bio: 'Seeded by tests/two-ink-bold-11f-admin.spec.ts',
    })

    try {
      await page.reload()

      const badge = page.getByRole('button', { name: 'Applications' }).locator('span').last()
      await expect(badge).toBeVisible()
      const badgeBg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(badgeBg).toBe(TOKEN.blue)

      const styles = await page.evaluate(() => {
        const heading = [...document.querySelectorAll('h1')].find((h) => h.textContent === 'Applications')!
        const list = heading.closest('div')!.parentElement!.querySelector('.flex.flex-col.gap-2')!
        const firstCard = list.firstElementChild as HTMLElement
        return { cardBorder: getComputedStyle(firstCard).borderTopColor }
      })
      expect(styles.cardBorder).toBe(TOKEN.line)
    } finally {
      await deleteTestApplication(email)
    }
  })

  test('brief editor fields, visibility toggle, and save button resolve to real ink/line/paper values', async ({ page }) => {
    const brief = await getTestBrief(PUBLIC_BRIEF_SLUG)
    await page.goto(`/admin/briefs/${brief.id}`)
    if (!page.url().includes('/admin')) {
      test.skip(true, 'Redirected away from /admin mid-test — see this file\'s header comment')
    }

    await expect(page.getByRole('heading', { name: 'Edit Brief' })).toBeVisible()

    const styles = await page.evaluate(() => {
      const titleInput = document.querySelector('input[placeholder="Brief title"]') as HTMLElement
      const saveButtons = [...document.querySelectorAll('button')].filter((b) => b.textContent?.trim() === 'Save')
      const activeToggle = [...document.querySelectorAll('button')].find(
        (b) => (b.textContent === 'Members only' || b.textContent === 'Public') &&
          getComputedStyle(b).backgroundColor !== 'rgba(0, 0, 0, 0)',
      )!
      return {
        titleBorder: getComputedStyle(titleInput).borderColor,
        saveBg: getComputedStyle(saveButtons[0]).backgroundColor,
        saveColor: getComputedStyle(saveButtons[0]).color,
        toggleBg: getComputedStyle(activeToggle).backgroundColor,
        toggleColor: getComputedStyle(activeToggle).color,
      }
    })

    expect(styles.titleBorder).toBe(TOKEN.line)
    expect(styles.saveBg).toBe(TOKEN.ink)
    expect(styles.saveColor).toBe(TOKEN.paper)
    expect(styles.toggleBg).toBe(TOKEN.ink)
    expect(styles.toggleColor).toBe(TOKEN.paper)
  })
})

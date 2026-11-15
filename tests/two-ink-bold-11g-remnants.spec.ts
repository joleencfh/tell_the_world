/**
 * Two-Ink Bold — Part 11g (Brief-page leftover remnants) token regression
 * checks.
 *
 * What this proves: every migrated class resolves to a real Two-Ink Bold
 * color value (not an undefined Tailwind utility, which is the exact
 * "invisible text" failure mode this whole Part 11 migration exists to
 * avoid — see two-ink-bold-plan.md's Part 11 intro). It does NOT diff
 * against the old Punchy Media Brand values — several old/new near-black
 * tokens are close enough that "did the hex change" is a weak signal;
 * "does the class resolve to a real, expected value" is the actual bar.
 *
 * Prerequisites
 * ─────────────
 * 1. Seed the test briefs: bun scripts/seed-test-briefs.ts
 * 2. `playwright/.auth/expert.json` must exist (written by global-setup.ts —
 *    requires TEST_EXPERT_EMAIL in .env.local, already required repo-wide).
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const PUBLIC_BRIEF_SLUG = 'test-public-brief'
const MEMBERS_BRIEF_SLUG = 'test-members-brief'

// ---------------------------------------------------------------------------
// Members Only gate + footer, logged-out visitor
// ---------------------------------------------------------------------------

test.describe('Brief page dark-token remnants — Two-Ink Bold, logged-out visitor', () => {
  // The gate moved to the design-system LockedPanel in Phase 4a (no dark
  // coverage band any more), so assert the behaviour, not old token colours.
  test('Members Only gate shows the locked panel with Apply and Login links', async ({ page }) => {
    await page.goto(`/briefs/${MEMBERS_BRIEF_SLUG}`)

    await expect(page.getByText('Members Only', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Apply to Join' })).toHaveAttribute('href', '/apply')
    await expect(page.getByRole('link', { name: /Already a member\? Login/ })).toHaveAttribute('href', '/login')
  })

  // The shared Footer moved to the design system in Phase 2 (one variant, no
  // "bold" 2px ink rule): a 1px `rule` hairline above, Inter text.
  test('page footer is the design-system footer: 1px rule hairline and the Inter UI font', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_BRIEF_SLUG}`)

    const styles = await page.evaluate(() => {
      const footer = document.querySelector('footer')!
      const span = footer.querySelector('span')!
      return {
        borderColor: getComputedStyle(footer).borderTopColor,
        borderWidth: getComputedStyle(footer).borderTopWidth,
        fontFamily: getComputedStyle(span).fontFamily,
      }
    })

    expect(styles.borderColor).toBe('rgb(222, 219, 211)') // --color-rule
    expect(styles.borderWidth).toBe('1px')
    expect(styles.fontFamily).toContain('Inter')
  })
})

// ---------------------------------------------------------------------------
// Correction proposal modal, authenticated expert
// ---------------------------------------------------------------------------

test.describe('Correction proposal modal — Two-Ink Bold, authenticated expert', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  // The correction modal moved to the shared Modal in Phase 4c: assert the
  // behaviour (dialog, eyebrow label, Cancel closes), not the retired colours.
  test('correction proposal modal opens with its eyebrow label and Cancel closes it', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_BRIEF_SLUG}`)

    await page.getByRole('button', { name: 'Propose a correction or addition' }).click()
    const dialog = page.getByRole('dialog', { name: 'Propose a correction or addition' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Correction proposal', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })
})

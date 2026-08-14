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

// Two-Ink Bold token values (app/globals.css) as computed rgb() strings.
const TOKEN = {
  paper: 'rgb(255, 255, 255)',
  line: 'rgb(226, 227, 229)',
  ink: 'rgb(12, 13, 14)',
  blueInk: 'rgb(11, 44, 153)',
  pinkInk: 'rgb(153, 7, 90)',
  pink: 'rgb(240, 25, 126)',
  coverageBg: 'rgb(12, 13, 14)', // literally --color-ink's value too — the dark band is deliberately fixed, not a coincidence
  coverageFg: 'rgb(241, 242, 243)',
}

// ---------------------------------------------------------------------------
// Members Only gate + footer, logged-out visitor
// ---------------------------------------------------------------------------

test.describe('Brief page dark-token remnants — Two-Ink Bold, logged-out visitor', () => {
  test('Members Only gate banner resolves to real coverage-bg/coverage-fg/pink-ink values', async ({ page }) => {
    await page.goto(`/briefs/${MEMBERS_BRIEF_SLUG}`)

    const heading = page.getByText('Members Only', { exact: true })
    await expect(heading).toBeVisible()

    const styles = await page.evaluate(() => {
      const h = [...document.querySelectorAll('p')].find((p) => p.textContent?.trim() === 'Members Only')!
      const card = h.closest('div')!
      const applyLink = [...document.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Apply to Join')!
      const svg = card.querySelector('svg')!
      return {
        cardBg: getComputedStyle(card).backgroundColor,
        headingColor: getComputedStyle(h).color,
        applyBg: getComputedStyle(applyLink).backgroundColor,
        applyColor: getComputedStyle(applyLink).color,
        svgColor: getComputedStyle(svg).color,
      }
    })

    expect(styles.cardBg).toBe(TOKEN.coverageBg)
    expect(styles.headingColor).toBe(TOKEN.coverageFg)
    expect(styles.applyBg).toBe(TOKEN.pinkInk)
    expect(styles.applyColor).toBe(TOKEN.paper)
    expect(styles.svgColor).toBe(TOKEN.pink)
  })

  test('page footer resolves to border-ink (2px, reference artifact match) and the system font stack, not the retired serif stack', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_BRIEF_SLUG}`)

    const styles = await page.evaluate(() => {
      const footer = document.querySelector('footer')!
      // The rule lives on the inner max-width wrapper, not <footer> itself —
      // matches the reference artifact's .foot-inner structure.
      const inner = footer.querySelector(':scope > div')!
      const span = footer.querySelector('span')!
      return {
        borderColor: getComputedStyle(inner).borderTopColor,
        borderWidth: getComputedStyle(inner).borderTopWidth,
        fontFamily: getComputedStyle(span).fontFamily,
      }
    })

    expect(styles.borderColor).toBe(TOKEN.ink)
    expect(styles.borderWidth).toBe('2px')
    expect(styles.fontFamily).toContain('Segoe UI')
    expect(styles.fontFamily.toLowerCase()).not.toContain('georgia')
  })
})

// ---------------------------------------------------------------------------
// Correction proposal modal, authenticated expert
// ---------------------------------------------------------------------------

test.describe('Correction proposal modal — Two-Ink Bold, authenticated expert', () => {
  test.use({ storageState: 'playwright/.auth/expert.json' })

  test('modal panel and eyebrow label resolve to bg-paper / blue-ink, not the retired cream/amber', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_BRIEF_SLUG}`)

    await page.getByRole('button', { name: 'Propose a correction or addition' }).click()
    const dialog = page.getByRole('dialog', { name: 'Propose a correction or addition' })
    await expect(dialog).toBeVisible()

    const styles = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role="dialog"][aria-label="Propose a correction or addition"]')!
      const panel = dialogEl.querySelector(':scope > div:last-child') as HTMLElement
      const eyebrow = [...dialogEl.querySelectorAll('p')].find((p) => p.textContent?.trim() === 'Correction proposal')!
      return {
        panelBg: getComputedStyle(panel).backgroundColor,
        eyebrowColor: getComputedStyle(eyebrow).color,
      }
    })

    expect(styles.panelBg).toBe(TOKEN.paper)
    expect(styles.eyebrowColor).toBe(TOKEN.blueInk)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })
})

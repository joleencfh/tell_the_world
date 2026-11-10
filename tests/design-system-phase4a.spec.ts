import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createTestBrief, insertBriefSection, deleteTestBrief, TestBrief } from './helpers/supabase'

loadEnvConfig(process.cwd())

// Phase 4a of the design-system migration: the brief page shell (header, page
// header, sticky section nav, reading column, Locked panel). Roles and
// behaviour, not classes, apart from the parchment canvas and the reading
// column width, which are the visible proof the shell migrated. Everything
// runs as a signed-out visitor against throwaway briefs.

const PARCHMENT = 'rgb(247, 244, 238)' // --color-parchment
const READING_MAX_PX = 704 // --container-reading (max-w-reading)

const stamp = Date.now()
const PUBLIC_SLUG = `ds4a-spec-${stamp}`
const MEMBERS_SLUG = `ds4a-spec-members-${stamp}`

async function seedSections(briefId: string) {
  await insertBriefSection(briefId, {
    section_type: 'tldr',
    content: 'First summary line\nSecond summary line\nThird summary line',
    display_order: 1,
  })
  await insertBriefSection(briefId, {
    section_type: 'explainer',
    title: 'Why the rule matters',
    content: 'Platforms differ in how much capacity they can offer to each creator.',
    display_order: 2,
  })
  await insertBriefSection(briefId, {
    section_type: 'faq',
    content: 'Placeholder question content',
    display_order: 3,
  })
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('Phase 4a: brief page shell', () => {
  test.describe.configure({ mode: 'serial' })

  let publicBrief: TestBrief
  let membersBrief: TestBrief

  test.beforeAll(async () => {
    publicBrief = await createTestBrief({
      title: `DS4A Spec ${stamp}`,
      slug: PUBLIC_SLUG,
      visibility: 'public',
    })
    await seedSections(publicBrief.id)
    membersBrief = await createTestBrief({
      title: `DS4A Spec Members ${stamp}`,
      slug: MEMBERS_SLUG,
      visibility: 'members_only',
    })
    await seedSections(membersBrief.id)
  })

  test.afterAll(async () => {
    if (publicBrief) await deleteTestBrief(publicBrief.id)
    if (membersBrief) await deleteTestBrief(membersBrief.id)
  })

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`renders on the new canvas with one h1, the shared footer, no console errors and no overflow at ${viewport.width}px`, async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      await page.setViewportSize(viewport)
      await page.goto(`/briefs/${PUBLIC_SLUG}`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('DS4A Spec')

      const canvas = await page.evaluate(() => {
        const root = document.querySelector('#app-root > div') as HTMLElement
        return getComputedStyle(root).backgroundColor
      })
      expect(canvas).toBe(PARCHMENT)

      const footer = page.getByRole('contentinfo')
      await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
      await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }

  test('the section nav scrolls horizontally at 390px while the page does not', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/briefs/${PUBLIC_SLUG}`)

    const nav = page.getByRole('navigation', { name: 'Sections' })
    await expect(nav).toBeVisible()
    const scroller = nav.locator('> div')
    const { scrollWidth, clientWidth } = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(scrollWidth).toBeGreaterThan(clientWidth)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  test('the signed-out header shows Apply and Login in the banner', async ({ page }) => {
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    const banner = page.getByRole('banner')
    await expect(banner.getByRole('link', { name: 'Apply', exact: true })).toHaveAttribute('href', '/apply')
    await expect(banner.getByRole('link', { name: 'Login', exact: true })).toHaveAttribute('href', '/login')
  })

  test('a members-only brief shows the Locked panel to a signed-out visitor', async ({ page }) => {
    await page.goto(`/briefs/${MEMBERS_SLUG}`)
    await expect(page.getByRole('heading', { name: 'Members Only' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Apply to Join' })).toHaveAttribute('href', '/apply')
    await expect(page.getByRole('link', { name: /Already a member\? Login/ })).toHaveAttribute('href', '/login')
  })

  test('the reading column is no wider than 704px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/briefs/${PUBLIC_SLUG}`)
    const paragraph = page
      .locator('#section-explainer')
      .getByText('Platforms differ in how much capacity')
    await expect(paragraph).toBeVisible()
    const width = await paragraph.evaluate((el) => {
      const column = el.closest('[class*="max-w-reading"]') ?? el
      return column.getBoundingClientRect().width
    })
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThanOrEqual(READING_MAX_PX)
  })
})

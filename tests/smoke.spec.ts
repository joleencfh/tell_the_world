import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('no uncaught JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    expect(errors).toHaveLength(0)
  })

  test('page title and heading', async ({ page }) => {
    await expect(page).toHaveTitle('Tell The World')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'AI safety is'
    )
  })

  test('nav — brand and login link', async ({ page }) => {
    const header = page.getByRole('banner')
    await expect(header).toContainText('Tell The World')
    const loginLink = header.getByRole('link', { name: 'Log in' })
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveAttribute('href', '/login')
  })

  test('hero — apply CTA links to /apply', async ({ page }) => {
    const applyLinks = page.getByRole('link', { name: 'Apply to join' })
    await expect(applyLinks.first()).toBeVisible()
    await expect(applyLinks.first()).toHaveAttribute('href', '/apply')
  })

  test('hero — "See active briefs" anchor', async ({ page }) => {
    const anchor = page.getByRole('link', { name: /see active briefs/i })
    await expect(anchor).toBeVisible()
    await expect(anchor).toHaveAttribute('href', '#briefs')
  })

  test("who's here — lists experts and organisations", async ({ page }) => {
    await expect(page.getByText('Experts').first()).toBeVisible()
    await expect(page.getByText('Organisations').first()).toBeVisible()
    await expect(page.getByText('Dr. Stuart Russell')).toBeVisible()
    await expect(page.getByText('UK AI Safety Institute')).toBeVisible()
  })

  test('public briefs — titles visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Who Controls the Off Switch?' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Inside the Alignment Labs' })
    ).toBeVisible()
  })

  test('public briefs — "Cover this story" links to /apply', async ({ page }) => {
    const links = page.getByRole('link', { name: /cover this story/i })
    await expect(links.first()).toBeVisible()
    await expect(links.first()).toHaveAttribute('href', '/apply')
  })

  test('members-only briefs — title and TLDR visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'The Compute Governance Gap' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Safety vs Speed/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Are AI Safety Tests/i })
    ).toBeVisible()
  })

  test('members-only briefs — show "Members only" badge and join prompt', async ({
    page,
  }) => {
    await expect(page.getByText('Members only').first()).toBeVisible()
    await expect(page.getByText('Full brief for members.').first()).toBeVisible()
  })

  test('members-only briefs — blurred section content is hidden from assistive tech', async ({
    page,
  }) => {
    const hiddenBlocks = page.locator('[aria-hidden="true"].blur-\\[3px\\]')
    await expect(hiddenBlocks.first()).toBeAttached()
    await expect(hiddenBlocks.first()).toHaveAttribute('aria-hidden', 'true')
  })

  test('footer — login link', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    const loginLink = footer.getByRole('link', { name: 'Log in' })
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveAttribute('href', '/login')
  })

  test('mobile — page renders without layout errors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Apply to join' }).first()).toBeVisible()
  })
})

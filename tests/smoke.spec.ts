import { test, expect } from '@playwright/test'

// Landing page was replaced with a silent-launch page (waitlist signup,
// no public briefs/apply flow) — see
// docs/design/landing-page/temp-landing-page-plan.md. The old page these
// tests targeted (briefs teaser grid, trust strip, "Apply to join") still
// exists at components/landing/LegacyLandingPage.tsx but isn't routed
// anywhere right now, so there's nothing left to test it against.

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
      'AI safety research rarely reaches'
    )
  })

  test('nav — brand and sign in link', async ({ page }) => {
    const header = page.getByRole('banner')
    await expect(header).toContainText('Tell The World')
    const signInLink = header.getByRole('link', { name: 'Sign in' })
    await expect(signInLink).toBeVisible()
    await expect(signInLink).toHaveAttribute('href', '/login')
  })

  test('hero — Join the waitlist opens the signup form', async ({ page }) => {
    const cta = page.getByRole('button', { name: 'Join the waitlist' }).first()
    await expect(cta).toBeVisible()
    await cta.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tell us who you are' })).toBeVisible()
  })

  test('two-circles section — both audiences visible', async ({ page }) => {
    await expect(page.getByText('Creators & journalists')).toBeVisible()
    await expect(page.getByText('Researchers & organisations')).toBeVisible()
  })

  test('closing section — waitlist and early-tester CTAs visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Join the waitlist' }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Become an early tester' })).toBeVisible()
  })

  test('closing section — early tester shows the intro step first', async ({ page }) => {
    await page.getByRole('button', { name: 'Become an early tester' }).click()
    await expect(page.getByRole('heading', { name: 'Before you sign up' })).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Tell us who you are' })).toBeVisible()
  })

  test('footer — brand mark, no links', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    await expect(footer).toContainText('Tell The World')
    // The footer is deliberately link-free — Sign in lives in the nav instead.
    await expect(footer.getByRole('link')).toHaveCount(0)
  })

  test('mobile — page renders without layout errors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Join the waitlist' }).first()).toBeVisible()
  })
})

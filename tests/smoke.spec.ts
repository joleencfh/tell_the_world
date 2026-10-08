import { test, expect } from '@playwright/test'

// Landing page was replaced with a silent-launch page (waitlist signup,
// no public briefs/apply flow) — see
// docs/design/landing-page/plans/temp-landing-page-plan.md. The old page these
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

  test('hero — both audience cards visible', async ({ page }) => {
    // The two audience cards are headed by their labels; the circle legend
    // repeats the same words, so query the headings, not loose text.
    await expect(page.getByRole('heading', { name: 'Creators & journalists' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Researchers & organisations' })).toBeVisible()
  })

  test('the researchers card button pre-selects the matching role in the form', async ({ page }) => {
    await page
      .getByRole('region', { name: 'Researchers & organisations' })
      .getByRole('button', { name: 'Join the waitlist' })
      .click()
    await expect(page.getByRole('dialog').getByRole('radio', { name: 'Researcher/Expert' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  test('header — no Apply link, one waitlist action', async ({ page }) => {
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: 'Apply' })).toHaveCount(0)
    await expect(header.getByRole('button', { name: 'Join the waitlist' })).toBeVisible()
  })

  test('demos — each has a Pause control and an illustrative label', async ({ page }) => {
    const pauses = page.getByRole('button', { name: 'Pause the animated example' })
    await expect(pauses).toHaveCount(2)
    await pauses.first().click()
    await expect(page.getByRole('button', { name: 'Play the animated example' })).toHaveCount(1)
    await expect(page.getByText('Illustrative example, sample content')).toHaveCount(2)
  })

  test('waitlist dialog — labelled, focus moves in, Escape closes and focus returns', async ({ page }) => {
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Join the waitlist' })
    await trigger.focus()
    await trigger.click()
    const dlg = page.getByRole('dialog', { name: 'Tell us who you are' })
    await expect(dlg).toBeVisible()
    await expect(dlg.getByRole('heading', { name: 'Tell us who you are' })).toBeFocused()
    // The page behind is inert while the dialog is open.
    await expect(page.locator('[inert]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
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

  test('footer — brand mark, privacy and contact links', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    await expect(footer).toContainText('Tell The World')
    // Sign in lives in the nav, not the footer — the footer only links to
    // the legally-required privacy policy and the contact form.
    await expect(footer.getByRole('link')).toHaveCount(2)
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  })

  test('mobile — page renders without layout errors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Join the waitlist' }).first()).toBeVisible()
  })
})

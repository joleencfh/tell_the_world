import { test, expect, type Page } from '@playwright/test'

// Phase 2 of the design-system migration: login, apply (form and status
// pages), contact and privacy. One smoke test per screen (new canvas, one h1,
// no console errors, shared footer) plus the form behaviours the shared Field
// and Alert primitives are responsible for. Roles and behaviour, not classes,
// apart from the page canvas, which is the visible proof a screen migrated.

const PARCHMENT = 'rgb(247, 244, 238)' // --color-parchment

const SCREENS = [
  { path: '/login', h1: 'Sign in to your account' },
  { path: '/apply', h1: 'Apply to join' },
  { path: '/apply/pending', h1: 'You’re in the queue' },
  { path: '/apply/rejected', h1: 'Not right now' },
  { path: '/contact', h1: 'Contact us' },
  { path: '/privacy', h1: 'Privacy Policy' },
]

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('Phase 2 screens: smoke', () => {
  for (const { path, h1 } of SCREENS) {
    test(`${path} renders on the new canvas with one h1, the shared footer and no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1)

      const canvas = await page.evaluate(() => {
        const root = document.querySelector('#app-root > div') as HTMLElement
        return getComputedStyle(root).backgroundColor
      })
      expect(canvas).toBe(PARCHMENT)

      const footer = page.getByRole('contentinfo')
      await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
      await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')

      expect(errors).toEqual([])
    })

    test(`${path} has no horizontal scroll at 390px`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(path)
      await expectNoOverflow(page)
    })
  }
})

test.describe('Login', () => {
  test('email field has a visible label', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email address')).toBeVisible()
  })

  test('an auth failure shows a danger alert', async ({ page }) => {
    await page.goto('/login?error=auth')
    await expect(page.getByRole('alert').filter({ hasText: 'Sign-in failed' })).toBeVisible()
  })

  test('keyboard: Tab reaches Google, LinkedIn, the email field and the submit button in order', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Tell The World' }).first().focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Continue with LinkedIn' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Email address')).toBeFocused()
  })
})

test.describe('Apply form', () => {
  test('says once that all fields are required unless marked Optional, and marks optional fields', async ({ page }) => {
    await page.goto('/apply')
    await expect(page.getByText('All fields are required unless marked Optional.')).toBeVisible()
    await expect(page.getByLabel('Website (Optional)')).toBeVisible()
    // Required fields carry no asterisk and no "(Optional)".
    await expect(page.getByLabel('First name', { exact: true })).toBeVisible()
    await expect(page.locator('[aria-label="required"]')).toHaveCount(0)
  })

  test('an empty submit links each error to its control and announces it', async ({ page }) => {
    await page.goto('/apply')
    await page.locator('select').first().selectOption('creator')
    await page.getByRole('button', { name: 'Submit application' }).click()

    const first = page.getByLabel('First name', { exact: true })
    await expect(first).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await first.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy!.split(' ').pop()}`)).toHaveText('Required')

    // The summary alert's entry moves focus to the control.
    await page.getByRole('button', { name: 'Email address' }).click()
    await expect(page.getByLabel('Email address')).toBeFocused()
  })

  test('the submit button goes pending, not just disabled, while submitting', async ({ page }) => {
    await page.route('**/apply', async (route) => {
      if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 1500))
      await route.continue()
    })
    await page.goto('/apply')
    await page.getByPlaceholder('First name').fill('Pat')
    await page.getByPlaceholder('Last name').fill('Doe')
    await page.getByPlaceholder('you@example.com').fill('pat@example.com')
    await page.locator('select').first().selectOption('other')
    await page.getByLabel('Please describe your role').fill('Illustrator')
    await page.getByPlaceholder('A short introduction…').fill('Hello there.')
    await page.getByRole('button', { name: 'Submit application' }).click()
    await expect(page.getByRole('button', { name: 'Submitting…' })).toHaveAttribute('aria-busy', 'true')
  })
})

test.describe('Contact form', () => {
  test('empty submit shows linked, announced errors and keeps the page', async ({ page }) => {
    await page.goto('/contact')
    await page.getByRole('button', { name: 'Send message' }).click()
    const name = page.getByLabel('Name', { exact: true })
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('alert').filter({ hasText: 'Required' }).first()).toBeVisible()
    await expect(page.getByLabel('Topic')).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL('/contact')
  })

  test('rejects a malformed email inline', async ({ page }) => {
    await page.goto('/contact')
    await page.getByLabel('Name', { exact: true }).fill('Pat')
    await page.getByLabel('Email', { exact: true }).fill('not-an-email')
    await page.getByLabel('Topic').selectOption('general')
    await page.getByLabel('Message').fill('Hello')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })
})

test.describe('Privacy', () => {
  test('every numbered section has an h2 and the legal-basis table has column headers', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(12)
    await expect(page.getByRole('columnheader', { name: 'Legal basis' })).toBeVisible()
  })
})

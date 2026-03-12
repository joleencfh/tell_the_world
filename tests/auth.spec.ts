import { test, expect } from '@playwright/test'

// All tests run with a fresh browser context (no cookies, no session).
// This matches the "logged-out" state without any extra setup.

test.describe('Route protection — unauthenticated redirects', () => {
  test('visiting /home while logged out redirects to /login', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL('/login')
  })

  test('visiting /directory while logged out redirects to /login', async ({ page }) => {
    await page.goto('/directory')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders the page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Sign in to your account' })
    ).toBeVisible()
  })

  test('renders a Google sign-in button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /continue with google/i })
    ).toBeVisible()
  })

  test('renders a LinkedIn sign-in button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /continue with linkedin/i })
    ).toBeVisible()
  })

  test('renders a magic link email input', async ({ page }) => {
    await expect(
      page.getByPlaceholder('your@email.com')
    ).toBeVisible()
  })

  test('renders a send magic link button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /send magic link/i })
    ).toBeVisible()
  })

  test('send magic link button is disabled when email input is empty', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /send magic link/i })
    ).toBeDisabled()
  })

  test('send magic link button becomes enabled when a valid email is entered', async ({ page }) => {
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await expect(
      page.getByRole('button', { name: /send magic link/i })
    ).toBeEnabled()
  })

  test('links to /apply for non-members', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /apply to join/i })
    ).toHaveAttribute('href', '/apply')
  })
})

test.describe('Public routes — accessible without authentication', () => {
  test('landing page (/) is accessible without logging in', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page).toHaveTitle('Tell The World')
  })

  test('application form (/apply) is accessible without logging in', async ({ page }) => {
    await page.goto('/apply')
    await expect(page).toHaveURL('/apply')
  })
})

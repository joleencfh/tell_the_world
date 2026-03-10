import { test, expect } from '@playwright/test'

test('landing page loads without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')

  // Page title is present
  await expect(page).toHaveTitle(/Create Next App/)

  // Main heading is visible
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // At least one call-to-action link is visible
  await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible()

  // No uncaught JS errors
  expect(errors).toHaveLength(0)
})

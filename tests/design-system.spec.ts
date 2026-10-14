import { test, expect, type Page } from '@playwright/test'

// Keyboard behaviour of the shared design-system primitives, exercised on the
// dev-only reference page (app/dev/design-system). Roles and behaviour only.

test.describe('Design system primitives (keyboard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/design-system')
  })

  test.describe('Modal', () => {
    test('opens labelled, focuses the title, makes the page inert, and Escape returns focus to the trigger', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'Open modal' })
      await trigger.focus()
      await page.keyboard.press('Enter')

      const dialog = page.getByRole('dialog', { name: 'Tell us who you are' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('heading', { name: 'Tell us who you are' })).toBeFocused()
      await expect(page.locator('#app-root')).toHaveAttribute('inert', '')
      await expect(page.locator('[inert]')).toHaveCount(1)

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.locator('[inert]')).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })

    test('Tab is trapped inside the dialog in both directions', async ({ page }) => {
      await page.getByRole('button', { name: 'Open modal' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('heading')).toBeFocused()

      // Focusable inside: Close, the name input, Next. Tab through more than
      // that and focus must never leave the dialog.
      for (let i = 0; i < 7; i++) {
        await page.keyboard.press('Tab')
        expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      }
      for (let i = 0; i < 7; i++) {
        await page.keyboard.press('Shift+Tab')
        expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      }
    })

    test('a click on the scrim closes it, a click inside does not', async ({ page }) => {
      await page.getByRole('button', { name: 'Open modal' }).click()
      await page.getByRole('dialog').getByText('This is the shared modal shell').click()
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.mouse.click(5, 5)
      await expect(page.getByRole('dialog')).toHaveCount(0)
    })

    test('moving to a new step puts focus back on the title', async ({ page }) => {
      await page.getByRole('button', { name: 'Open modal' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Next' }).click()
      await expect(page.getByRole('dialog', { name: 'One more thing' }).getByRole('heading')).toBeFocused()
    })

    test('Escape closes only the topmost of two stacked dialogs', async ({ page }) => {
      await page.getByRole('button', { name: 'Open modal' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Next' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Finish' }).click()
      await expect(page.getByRole('dialog', { name: 'Finish and close?' })).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog', { name: 'Finish and close?' })).toHaveCount(0)
      const first = page.getByRole('dialog', { name: 'One more thing' })
      await expect(first).toBeVisible()
      // The modal underneath is live again (not left inert); the page is not.
      await expect(first.getByRole('button', { name: 'Finish' })).toBeEnabled()
      await expect(page.locator('#app-root')).toHaveAttribute('inert', '')

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.locator('[inert]')).toHaveCount(0)
    })
  })

  test.describe('ConfirmDialog', () => {
    test('names the action, puts the safe choice first, and Cancel closes without acting', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete brief' }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Delete this brief?' })
      const buttons = dialog.getByRole('button')
      await expect(buttons.nth(1)).toHaveText('Cancel')
      await expect(buttons.nth(2)).toHaveText('Delete brief')

      await dialog.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByText('Brief deleted.')).toHaveCount(0)
    })

    test('confirming runs the action and shows a toast', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete brief' }).first().click()
      await page.getByRole('dialog').getByRole('button', { name: 'Delete brief' }).click()
      await expect(page.getByRole('status').getByText('Brief deleted.')).toBeVisible()
    })
  })

  test.describe('Menu', () => {
    test('ArrowDown opens on the first item; arrows wrap; Enter selects and returns focus to the trigger', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'Account menu' })
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.focus()
      await page.keyboard.press('ArrowDown')

      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const items = page.getByRole('menuitem')
      await expect(items).toHaveCount(3)
      await expect(items.nth(0)).toBeFocused()

      await page.keyboard.press('ArrowUp') // wraps to the last
      await expect(items.nth(2)).toBeFocused()
      await page.keyboard.press('Home')
      await expect(items.nth(0)).toBeFocused()
      await page.keyboard.press('End')
      await expect(items.nth(2)).toBeFocused()
      await page.keyboard.press('ArrowDown') // wraps to the first
      await expect(items.nth(0)).toBeFocused()

      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('menu')).toHaveCount(0)
      await expect(page.getByTestId('menu-choice')).toHaveText('settings')
      await expect(trigger).toBeFocused()
    })

    test('Escape closes it and returns focus to the trigger', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'Account menu' })
      await trigger.click()
      await expect(page.getByRole('menuitem').first()).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu')).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })

    test('an outside click closes it', async ({ page }) => {
      await page.getByRole('button', { name: 'Account menu' }).click()
      await expect(page.getByRole('menu')).toBeVisible()
      await page.getByRole('heading', { name: 'Design system primitives' }).click()
      await expect(page.getByRole('menu')).toHaveCount(0)
    })
  })

  test.describe('ChoiceChips', () => {
    const group = (page: Page) => page.getByRole('radiogroup', { name: 'I am a' })

    test('is a radiogroup with one tab stop on the selected chip', async ({ page }) => {
      const radios = group(page).getByRole('radio')
      await expect(radios).toHaveCount(3)
      await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true')
      await expect(radios.nth(0)).toHaveAttribute('tabindex', '0')
      await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1')
    })

    test('arrow keys move and select, wrapping at both ends; Home and End jump', async ({ page }) => {
      const radios = group(page).getByRole('radio')
      await radios.nth(0).focus()

      await page.keyboard.press('ArrowRight')
      await expect(radios.nth(1)).toBeFocused()
      await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true')
      await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'false')

      await page.keyboard.press('ArrowDown')
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true')
      await page.keyboard.press('ArrowRight') // wraps forward
      await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true')
      await page.keyboard.press('ArrowLeft') // wraps back
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true')
      await page.keyboard.press('Home')
      await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true')
      await page.keyboard.press('End')
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true')
    })
  })

  test.describe('Toast', () => {
    test('a success toast is announced in the status region and can be dismissed', async ({ page }) => {
      await page.getByRole('button', { name: 'Success toast' }).click()
      const toast = page.getByRole('status').getByText('Quote published.')
      await expect(toast).toBeVisible()
      await page.getByRole('button', { name: 'Dismiss' }).click()
      await expect(toast).toHaveCount(0)
    })

    test('an error toast goes in the alert region and stays until dismissed', async ({ page }) => {
      await page.getByRole('button', { name: 'Error toast' }).click()
      await expect(page.getByRole('alert').getByText('Could not publish. Try again.')).toBeVisible()
    })
  })
})

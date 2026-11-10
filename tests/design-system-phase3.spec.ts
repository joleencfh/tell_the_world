import { test, expect, type Locator, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { getTestUser, type TestUser } from './helpers/supabase'

loadEnvConfig(process.cwd())

const PARCHMENT = 'rgb(247, 244, 238)' // --color-parchment

// Phase 3 of the design-system migration. The first part covers the shared
// AppHeader on the dev-only reference page (app/dev/design-system), which
// needs no sign-in. The second part signs in as the test creator and covers
// the three migrated screens. Roles and behaviour, not classes, apart from the computed
// style checks that prove the old header look is gone.

async function appHeaderSection(page: Page) {
  await page.goto('/dev/design-system')
  return page.getByRole('region', { name: 'App header' })
}

// The first showcase header: Directory is the active link, creator avatar.
function firstHeader(section: Locator) {
  return section.locator('header').first()
}

test.describe('AppHeader (showcase)', () => {
  test('marks the current page with aria-current and no other link', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    const nav = header.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link', { name: 'Directory' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link')).toHaveCount(2)
  })

  test('logo links to /home and the links keep their hrefs', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    await expect(header.getByRole('link', { name: 'Tell The World' })).toHaveAttribute('href', '/home')
    const nav = header.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    await expect(nav.getByRole('link', { name: 'Directory' })).toHaveAttribute('href', '/directory')
  })

  test('has a 1px rule, no uppercase or mono links', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    const styles = await header.evaluate((el) => {
      const link = el.querySelector('nav a') as HTMLElement
      const s = getComputedStyle(el)
      const l = getComputedStyle(link)
      return { border: s.borderBottomWidth, transform: l.textTransform, font: l.fontFamily }
    })
    expect(styles.border).toBe('1px')
    expect(styles.transform).toBe('none')
    expect(styles.font.toLowerCase()).not.toContain('mono')
  })

  test('links and the account trigger are at least 44px tall', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    const targets = [
      ...(await header.getByRole('navigation', { name: 'Main' }).getByRole('link').all()),
      header.getByRole('button', { name: 'Account menu' }),
    ]
    for (const target of targets) {
      const box = await target.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
    const trigger = await header.getByRole('button', { name: 'Account menu' }).boundingBox()
    expect(trigger?.width ?? 0).toBeGreaterThanOrEqual(44)
  })

  test('keyboard focus shows a visible ring on links and the trigger', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    const focusables = [
      header.getByRole('link', { name: 'Tell The World' }),
      header.getByRole('link', { name: 'Home' }),
      header.getByRole('button', { name: 'Account menu' }),
    ]
    for (const target of focusables) {
      await target.focus()
      // focus() from a script does not always count as :focus-visible, so
      // move there with the keyboard from the previous element.
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(target).toBeFocused()
      const outline = await target.evaluate((el) => {
        const s = getComputedStyle(el)
        return { style: s.outlineStyle, width: s.outlineWidth }
      })
      expect(outline.style).toBe('solid')
      expect(outline.width).toBe('2px')
    }
  })

  test('the avatar menu opens with the keyboard, arrows move, Escape returns focus', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    const trigger = header.getByRole('button', { name: 'Account menu' })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')

    const menu = header.getByRole('menu', { name: 'Account menu' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Profile' })).toBeFocused()
    await expect(menu.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/profile/demo')

    await page.keyboard.press('ArrowDown')
    await expect(menu.getByRole('menuitem', { name: 'Sign out' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(menu.getByRole('menuitem', { name: 'Profile' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('Tab closes the avatar menu', async ({ page }) => {
    const header = firstHeader(await appHeaderSection(page))
    await header.getByRole('button', { name: 'Account menu' }).click()
    const menu = header.getByRole('menu')
    await expect(menu).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(menu).toHaveCount(0)
  })

  test('without a user there is no account menu', async ({ page }) => {
    const section = await appHeaderSection(page)
    await expect(section.locator('header')).toHaveCount(3)
    await expect(section.getByRole('button', { name: 'Account menu' })).toHaveCount(2)
  })

  test.describe('narrow screens', () => {
    test.use({ viewport: { width: 375, height: 800 } })

    test('the account menu carries Home and Directory on phones', async ({ page }) => {
      const header = firstHeader(await appHeaderSection(page))
      await header.getByRole('button', { name: 'Account menu' }).click()
      const menu = header.getByRole('menu', { name: 'Account menu' })
      await expect(menu.getByRole('menuitem', { name: 'Home' })).toHaveAttribute('href', '/home')
      await expect(menu.getByRole('menuitem', { name: 'Directory' })).toHaveAttribute('href', '/directory')
      await expect(menu.getByRole('menuitem', { name: 'Profile' })).toBeVisible()
      await expect(menu.getByRole('menuitem', { name: 'Home' })).toBeFocused()
    })

    test('the links hide below 640px, logo and avatar stay, nothing overflows', async ({ page }) => {
      const header = firstHeader(await appHeaderSection(page))
      await expect(header.getByRole('navigation', { name: 'Main' })).toBeHidden()
      await expect(header.getByRole('link', { name: 'Tell The World' })).toBeVisible()
      await expect(header.getByRole('button', { name: 'Account menu' })).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Migrated screens (signed in as the test creator)
// ---------------------------------------------------------------------------

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('Phase 3 screens', () => {
  test.use({ storageState: 'playwright/.auth/creator.json' })

  let creator: TestUser

  test.beforeAll(async () => {
    if (!creatorEmail) throw new Error('TEST_CREATOR_EMAIL must be set in .env.local')
    creator = await getTestUser(creatorEmail)
  })

  function screens() {
    return [
      { path: '/home', current: 'Home' as string | null },
      { path: '/directory', current: 'Directory' as string | null },
      { path: `/profile/${creator.id}`, current: null },
    ]
  }

  for (const index of [0, 1, 2]) {
    test(`screen ${index + 1} of 3 (home, directory, own profile) renders on the new canvas with one h1, the shared header and footer, no console errors`, async ({ page }) => {
      const { path, current } = screens()[index]
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

      const canvas = await page.evaluate(() => {
        const root = document.querySelector('#app-root > div') as HTMLElement
        return getComputedStyle(root).backgroundColor
      })
      expect(canvas).toBe(PARCHMENT)

      const header = page.getByRole('banner')
      await expect(header.getByRole('link', { name: 'Tell The World' })).toHaveAttribute('href', '/home')
      await expect(header.getByRole('button', { name: 'Account menu' })).toBeVisible()
      if (current) {
        await expect(header.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page')
      }

      const footer = page.getByRole('contentinfo')
      await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')

      expect(errors).toEqual([])
    })

    test(`screen ${index + 1} of 3 has no horizontal scroll at 390px`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(screens()[index].path)
      await expectNoOverflow(page)
    })
  }

  test('the account menu opens with the keyboard and Escape returns focus to the trigger', async ({ page }) => {
    await page.goto('/home')
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Account menu' })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    const menu = page.getByRole('menu', { name: 'Account menu' })
    await expect(menu.getByRole('menuitem', { name: 'Profile' })).toBeFocused()
    await expect(menu.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', `/profile/${creator.id}`)
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('the directory filters are radiogroups and the search field has a label', async ({ page }) => {
    await page.goto('/directory')
    await expect(page.getByLabel('Search')).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Role' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Availability' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'All roles' })).toBeChecked()
  })

  test('Edit Profile opens a labelled dialog and Escape closes it, returning focus to the trigger', async ({ page }) => {
    await page.goto(`/profile/${creator.id}`)
    const trigger = page.getByRole('button', { name: 'Edit Profile' })
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible()
    await expect(dialog.getByLabel('Display name')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

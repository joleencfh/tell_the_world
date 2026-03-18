/**
 * Contact modal — end-to-end tests
 *
 * Prerequisites
 * ─────────────
 * 1. Two approved users must exist in the database:
 *    - A creator:  TEST_CREATOR_EMAIL in .env.local
 *    - An expert:  TEST_EXPERT_EMAIL  in .env.local
 * 2. `playwright/.auth/creator.json` and `playwright/.auth/expert.json` must
 *    exist (written by global-setup.ts before this suite runs).
 *
 * Each test is independent — no shared state between them.
 */

import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { getTestUser, findMessage, deleteTestMessages, TestUser } from './helpers/supabase'

// Load env vars for the helper module (it also self-loads, but being explicit
// here means we can read TEST_* vars in the describe scope below).
loadEnvConfig(process.cwd())

// ---------------------------------------------------------------------------
// Resolve test-user emails once, before any describe block runs.
// ---------------------------------------------------------------------------

const creatorEmail = process.env.TEST_CREATOR_EMAIL ?? ''
const expertEmail = process.env.TEST_EXPERT_EMAIL ?? ''

if (!creatorEmail || !expertEmail) {
  throw new Error('TEST_CREATOR_EMAIL and TEST_EXPERT_EMAIL must be set in .env.local')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Subject prefix used across tests that submit the form, for easy cleanup. */
const TEST_SUBJECT_PREFIX = '[playwright-contact-test]'

function uniqueSubject(): string {
  return `${TEST_SUBJECT_PREFIX} ${Date.now()}`
}

// ---------------------------------------------------------------------------
// Authenticated tests (tests 1–6) — run as the creator user
// ---------------------------------------------------------------------------

test.describe('Contact modal — authenticated creator viewing expert profile', () => {
  test.use({ storageState: 'playwright/.auth/creator.json' })

  let creator: TestUser
  let expert: TestUser

  test.beforeAll(async () => {
    ;[creator, expert] = await Promise.all([
      getTestUser(creatorEmail),
      getTestUser(expertEmail),
    ])
  })

  // Clean up any messages written during this suite
  test.afterAll(async () => {
    await deleteTestMessages(creator.id, TEST_SUBJECT_PREFIX)
  })

  // ─── Test 1 ─────────────────────────────────────────────────────────────

  test('contact button is visible on an expert profile when viewed by a logged-in creator', async ({ page }) => {
    await page.goto(`/profile/${expert.id}`)

    const contactButton = page.getByRole('button', { name: /contact/i })
    await expect(contactButton).toBeVisible()
  })

  // ─── Test 2 ─────────────────────────────────────────────────────────────

  test('clicking the contact button opens the contact modal', async ({ page }) => {
    await page.goto(`/profile/${expert.id}`)

    await page.getByRole('button', { name: /contact/i }).click()

    // The modal is identifiable by its dialog role or a unique heading
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
  })

  // ─── Test 3 ─────────────────────────────────────────────────────────────

  test('the modal shows the recipient\'s name and role badge', async ({ page }) => {
    await page.goto(`/profile/${expert.id}`)
    await page.getByRole('button', { name: /contact/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Recipient display name is shown in the modal header as a heading
    const recipientName = expert.display_name ?? expertEmail.split('@')[0]
    await expect(modal.getByRole('heading', { name: recipientName })).toBeVisible()

    // Role badge for the expert role
    await expect(modal.getByText('Expert')).toBeVisible()
  })

  // ─── Test 4 ─────────────────────────────────────────────────────────────

  test('the sender\'s name and role are pre-filled and not editable', async ({ page }) => {
    await page.goto(`/profile/${expert.id}`)
    await page.getByRole('button', { name: /contact/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // The "Sending as" section contains the creator's name but no text input
    const sendingAsSection = modal.locator('text=Sending as').locator('..')
    const senderName = creator.display_name ?? creatorEmail.split('@')[0]

    // Sender name appears somewhere in the modal
    await expect(modal.getByText(senderName, { exact: false })).toBeVisible()

    // The sender section must NOT contain any editable input or textarea
    // (it is rendered as a read-only display block)
    const editableInputs = sendingAsSection.locator('input:not([type="hidden"]), textarea')
    await expect(editableInputs).toHaveCount(0)
  })

  // ─── Test 5 ─────────────────────────────────────────────────────────────

  test('submitting the form creates a message record in the database with status = pending', async ({ page }) => {
    const subject = uniqueSubject()
    const body = 'Hello from the Playwright contact modal test.'

    await page.goto(`/profile/${expert.id}`)
    await page.getByRole('button', { name: /contact/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Fill in the form (labels don't use htmlFor — target by placeholder)
    await modal.getByPlaceholder('What is this about?').fill(subject)
    await modal.getByPlaceholder(/introduce yourself/i).fill(body)

    // Submit
    await modal.getByRole('button', { name: /send/i }).click()

    // Wait for the modal to reach its success state (confirmation message)
    await expect(modal.getByText(/message sent|sent successfully/i)).toBeVisible({ timeout: 10000 })

    // Verify the record was written to the database
    const message = await findMessage(creator.id, expert.id, subject)

    expect(message).not.toBeNull()
    expect(message!.sender_id).toBe(creator.id)
    expect(message!.recipient_id).toBe(expert.id)
    expect(message!.status).toBe('pending')
    expect(message!.body).toBe(body)

    // Cleanup for this specific test (afterAll also covers it, but being tidy)
    await deleteTestMessages(creator.id, subject)
  })

  // ─── Test 6 ─────────────────────────────────────────────────────────────

  test('after submission the modal shows a confirmation message', async ({ page }) => {
    const subject = uniqueSubject()

    await page.goto(`/profile/${expert.id}`)
    await page.getByRole('button', { name: /contact/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    await modal.getByPlaceholder('What is this about?').fill(subject)
    await modal.getByPlaceholder(/introduce yourself/i).fill('Test message body for confirmation step.')

    await modal.getByRole('button', { name: /send/i }).click()

    // A success / confirmation message must be visible inside the modal
    await expect(modal.getByText(/message sent|sent successfully/i)).toBeVisible({ timeout: 10000 })

    // The form inputs should no longer be present (replaced by the confirmation view)
    await expect(modal.getByPlaceholder('What is this about?')).not.toBeVisible()
    await expect(modal.getByPlaceholder(/introduce yourself/i)).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Logged-out test (test 7) — fresh context, no storage state
// ---------------------------------------------------------------------------

test.describe('Contact modal — logged-out visitor', () => {
  let expert: TestUser

  test.beforeAll(async () => {
    expert = await getTestUser(expertEmail)
  })

  test('the contact button is not visible to logged-out visitors', async ({ page }) => {
    await page.goto(`/profile/${expert.id}`)

    // The page should be accessible (public profile) but the Contact button
    // must not appear for unauthenticated viewers.
    const contactButton = page.getByRole('button', { name: /contact/i })
    await expect(contactButton).not.toBeVisible()
  })
})

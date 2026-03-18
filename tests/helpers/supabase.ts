/**
 * Shared Supabase admin client and helper utilities for Playwright tests.
 *
 * The admin client uses the service-role key and bypasses RLS, making it
 * suitable for seeding data, querying results, and cleaning up after tests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

// Load .env.local so env vars are available outside of Next.js
loadEnvConfig(process.cwd())

let _adminClient: SupabaseClient | null = null

export function getTestAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
      )
    }

    _adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _adminClient
}

// ---------------------------------------------------------------------------
// User helpers
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string
  display_name: string | null
  email: string
  role: string
}

export async function getTestUser(email: string): Promise<TestUser> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('users')
    .select('id, display_name, email, role')
    .eq('email', email)
    .single()

  if (error || !data) {
    throw new Error(`Test user not found for email "${email}": ${error?.message}`)
  }

  return data as TestUser
}

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

export interface MessageRecord {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  body: string
  status: string
  created_at: string
}

/**
 * Find the most recently created message with the given subject between two users.
 * Returns null if none found.
 */
export async function findMessage(
  senderId: string,
  recipientId: string,
  subject: string,
): Promise<MessageRecord | null> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('messages')
    .select('id, sender_id, recipient_id, subject, body, status, created_at')
    .eq('sender_id', senderId)
    .eq('recipient_id', recipientId)
    .eq('subject', subject)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query messages: ${error.message}`)
  }

  return (data as MessageRecord | null)
}

/**
 * Delete all messages matching the given subject sent by senderId.
 * Call in afterEach / afterAll to clean up test records.
 */
export async function deleteTestMessages(senderId: string, subject: string): Promise<void> {
  const client = getTestAdminClient()
  const { error } = await client
    .from('messages')
    .delete()
    .eq('sender_id', senderId)
    .eq('subject', subject)

  if (error) {
    console.warn(`Failed to clean up test messages: ${error.message}`)
  }
}

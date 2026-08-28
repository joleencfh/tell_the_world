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
// Brief helpers
// ---------------------------------------------------------------------------

export interface TestBrief {
  id: string
  slug: string
  title: string
}

export async function getTestBrief(slug: string): Promise<TestBrief> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('briefs')
    .select('id, slug, title')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error(`Test brief not found for slug "${slug}": ${error?.message}`)
  }

  return data as TestBrief
}

// ---------------------------------------------------------------------------
// FAQ answer helpers (brief_faq_answers — two-ink-bold-plan.md Part 4b)
// ---------------------------------------------------------------------------

export interface FaqAnswerRecord {
  id: string
  brief_id: string
  question: string
  author_user_id: string
  body: string
  status: string
  created_at: string
}

/**
 * brief_faq_answers rows for a given (brief, question) pair, any status.
 * Pass `body` (tests always give their rows a unique, timestamped body) to
 * scope to this test's own row(s) — the question text itself is shared,
 * fixed fixture content, so without it concurrent CI runs against the same
 * brief would see each other's rows.
 */
export async function findFaqAnswers(
  briefId: string,
  question: string,
  body?: string,
): Promise<FaqAnswerRecord[]> {
  const client = getTestAdminClient()
  let query = client
    .from('brief_faq_answers')
    .select('id, brief_id, question, author_user_id, body, status, created_at')
    .eq('brief_id', briefId)
    .eq('question', question)
  if (body !== undefined) {
    query = query.eq('body', body)
  }
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to query brief_faq_answers: ${error.message}`)
  }

  return (data as FaqAnswerRecord[]) ?? []
}

/** Seed an already-published answer directly (bypasses the admin-approval UI). */
export async function insertPublishedFaqAnswer(
  briefId: string,
  question: string,
  authorId: string,
  body: string,
): Promise<FaqAnswerRecord> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('brief_faq_answers')
    .insert({ brief_id: briefId, question, author_user_id: authorId, body, status: 'published' })
    .select('id, brief_id, question, author_user_id, body, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert brief_faq_answers row: ${error?.message}`)
  }

  return data as FaqAnswerRecord
}

/**
 * Delete brief_faq_answers rows for a (brief, question) pair. Call in
 * afterEach/afterAll. Pass `body` to delete only this test's own row(s) —
 * without it, a blanket delete on the shared question text would also wipe
 * out any concurrent CI run's still-in-flight row for the same question.
 */
export async function deleteFaqAnswers(briefId: string, question: string, body?: string): Promise<void> {
  const client = getTestAdminClient()
  let query = client.from('brief_faq_answers').delete().eq('brief_id', briefId).eq('question', question)
  if (body !== undefined) {
    query = query.eq('body', body)
  }
  const { error } = await query

  if (error) {
    console.warn(`Failed to clean up test brief_faq_answers: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// Community Q&A vote helpers (question_votes — two-ink-bold-plan.md Part 5
// upvote-toggle fix, 2026-08-13)
// ---------------------------------------------------------------------------

export interface QuestionRecord {
  id: string
  brief_id: string
  user_id: string
  question_text: string
  status: string
  created_at: string
}

/** Seed an already-approved question directly (bypasses the admin-approval UI). */
export async function insertApprovedQuestion(
  briefId: string,
  userId: string,
  questionText: string,
): Promise<QuestionRecord> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('questions')
    .insert({ brief_id: briefId, user_id: userId, question_text: questionText, status: 'approved' })
    .select('id, brief_id, user_id, question_text, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert questions row: ${error?.message}`)
  }

  return data as QuestionRecord
}

/** Delete a question row — question_votes rows cascade with it. Call in afterEach/afterAll. */
export async function deleteTestQuestion(questionId: string): Promise<void> {
  const client = getTestAdminClient()
  const { error } = await client.from('questions').delete().eq('id', questionId)

  if (error) {
    console.warn(`Failed to clean up test question: ${error.message}`)
  }
}

/** Whether a (question, user) question_votes row currently exists. */
export async function hasQuestionVote(questionId: string, userId: string): Promise<boolean> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('question_votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query question_votes: ${error.message}`)
  }

  return data !== null
}

// ---------------------------------------------------------------------------
// Calls to action helpers (brief_ctas — two-ink-bold-plan.md Part 6)
// ---------------------------------------------------------------------------

export interface CtaRecord {
  id: string
  brief_id: string
  author_user_id: string | null
  title: string
  description: string | null
  link_url: string
  status: string
  created_at: string
}

/** All brief_ctas rows for a brief, any status. */
export async function findCtas(briefId: string): Promise<CtaRecord[]> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('brief_ctas')
    .select('id, brief_id, author_user_id, title, description, link_url, status, created_at')
    .eq('brief_id', briefId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to query brief_ctas: ${error.message}`)
  }

  return (data as CtaRecord[]) ?? []
}

/** Seed an already-published CTA directly (bypasses the admin-approval UI). */
export async function insertPublishedCta(
  briefId: string,
  authorId: string,
  fields: { title: string; description?: string | null; linkUrl: string },
): Promise<CtaRecord> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('brief_ctas')
    .insert({
      brief_id: briefId,
      author_user_id: authorId,
      title: fields.title,
      description: fields.description ?? null,
      link_url: fields.linkUrl,
      status: 'published',
    })
    .select('id, brief_id, author_user_id, title, description, link_url, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert brief_ctas row: ${error?.message}`)
  }

  return data as CtaRecord
}

/** Delete all brief_ctas rows for a brief with the given title. Call in afterEach/afterAll. */
export async function deleteTestCtas(briefId: string, title: string): Promise<void> {
  const client = getTestAdminClient()
  const { error } = await client
    .from('brief_ctas')
    .delete()
    .eq('brief_id', briefId)
    .eq('title', title)

  if (error) {
    console.warn(`Failed to clean up test brief_ctas: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// Application helpers (applications — two-ink-bold-plan.md Part 11f styling
// checks: gives the admin dashboard a deterministic pending row to render)
// ---------------------------------------------------------------------------

export interface ApplicationRecord {
  id: string
  full_name: string
  email: string
  desired_role: string
  bio: string
  status: string
  created_at: string
}

/** Seed a pending application directly (bypasses the public apply form). */
export async function insertPendingApplication(
  email: string,
  fields: { fullName: string; desiredRole: string; bio: string },
): Promise<ApplicationRecord> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('applications')
    .insert({
      email,
      full_name: fields.fullName,
      desired_role: fields.desiredRole,
      bio: fields.bio,
      status: 'pending',
    })
    .select('id, full_name, email, desired_role, bio, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert applications row: ${error?.message}`)
  }

  return data as ApplicationRecord
}

/** Delete all applications rows with the given email. Call in afterEach/afterAll. */
export async function deleteTestApplication(email: string): Promise<void> {
  const client = getTestAdminClient()
  const { error } = await client.from('applications').delete().eq('email', email)

  if (error) {
    console.warn(`Failed to clean up test application: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// Brief + brief_sections helpers (brief-page-part2-plan.md Part 0b rich text
// editor tests). Unlike the additive child-row helpers above (CTAs, FAQ
// answers, questions — independent tables that coexist fine with other specs
// sharing test-public-brief), these tests edit a brief's own
// brief_sections rows through the same admin editor UI other specs' pages
// render, and need deterministic section count/order to locate a specific
// subsection in the DOM — so they get a dedicated throwaway brief instead of
// piggybacking on the shared fixtures.
// ---------------------------------------------------------------------------

/** Create a throwaway brief for a test file's own fixtures — delete it in afterAll (cascades brief_sections). */
export async function createTestBrief(fields: {
  title: string
  slug: string
  visibility: 'public' | 'members_only'
}): Promise<TestBrief> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('briefs')
    .insert({ title: fields.title, slug: fields.slug, visibility: fields.visibility })
    .select('id, slug, title')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert test brief: ${error?.message}`)
  }

  return data as TestBrief
}

/** Delete a brief created with createTestBrief — brief_sections cascade with it. */
export async function deleteTestBrief(id: string): Promise<void> {
  const client = getTestAdminClient()
  const { error } = await client.from('briefs').delete().eq('id', id)

  if (error) {
    console.warn(`Failed to clean up test brief: ${error.message}`)
  }
}

export interface TestBriefSection {
  id: string
  brief_id: string
  section_type: string
  title: string | null
  content: string
  rich_content: unknown
  display_order: number
}

/** Seed a brief_sections row directly (bypasses the admin editor). */
export async function insertBriefSection(
  briefId: string,
  fields: { section_type: string; content: string; display_order: number; title?: string | null },
): Promise<TestBriefSection> {
  const client = getTestAdminClient()
  const { data, error } = await client
    .from('brief_sections')
    .insert({
      brief_id: briefId,
      section_type: fields.section_type,
      content: fields.content,
      display_order: fields.display_order,
      title: fields.title ?? null,
    })
    .select('id, brief_id, section_type, title, content, rich_content, display_order')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert brief_sections row: ${error?.message}`)
  }

  return data as TestBriefSection
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

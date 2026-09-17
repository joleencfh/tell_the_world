'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/analytics/log'
import type { UserRole, TablesInsert } from '@/lib/types'
import { CONTRIBUTOR_ROLES } from '@/lib/types'
import type { Json } from '@/lib/database.types'
import { checkClarity } from '@/lib/clarity/check'

// Part 4: an expert/organisation's quote explicitly attached to this brief
// (content_posts.brief_id, added in Part 0a) — a free-text submission, so
// it follows the propose/moderate pattern like submitFaqAnswer/submitCta
// above rather than publishing immediately (confirmed with the user during
// this part's build: content_posts has no existing moderation queue — the
// profile "share something" flow, lib/posts/actions.ts's createPost,
// publishes immediately and is untouched — but a quote posted straight to
// a brief's public page needed one). Admin submissions go through the same
// pending queue as everyone else rather than an immediate-publish bypass
// like submitCta's admin branch: unlike brief_ctas, content_posts' insert
// RLS policy was never role-restricted (008_member_read_policies.sql), so
// there's no RLS obstacle a bypass would need to work around — admin's own
// quote just waits in the same "Quotes" admin tab as anyone else's.
export async function submitQuote(
  briefId: string,
  briefSlug: string,
  body: string,
  tags: string[],
): Promise<{ error?: string; success?: boolean; status?: 'published' | 'pending' }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to add a quote.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role as UserRole | undefined
  if (!role || !(CONTRIBUTOR_ROLES.includes(role) || role === 'admin')) {
    return { error: 'Only experts and organisations can add quotes.' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Quote cannot be empty.' }
  if (trimmed.length > 500) return { error: 'Quote must be under 500 characters.' }

  const cleanTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 10)

  // Deterministic clarity check (lib/clarity/check.ts) — server-side,
  // authoritative (defense in depth: server actions are public HTTP
  // endpoints, the client-side check in useClarityGate.ts is UX only).
  // Admin keeps its pre-existing unconditional 'pending' status (see the
  // comment above this function) — that's an existing quirk unrelated to
  // this feature, not something the clarity check should change.
  let status: 'published' | 'pending' = 'published'
  let flaggedTerms: Json | null = null
  if (role === 'admin') {
    status = 'pending'
  } else {
    const { flaggedTerms: flags, isClean } = checkClarity(trimmed)
    if (!isClean) {
      status = 'pending'
      flaggedTerms = flags as unknown as Json
    }
  }

  // title holds the quote text itself (content_posts.title is not null;
  // QuoteCard renders `body || title`, so leaving body null here falls
  // straight back to what was just typed — same shape a bare-title quote
  // authored any other way already renders as). flagged_terms is only
  // ever included when the clarity check actually flagged something
  // (never for admin's unconditional pending, and never when clean) — so
  // the common case's insert is byte-for-byte what it was before this
  // column existed, and doesn't depend on flagged_terms being present.
  const insertPayload: TablesInsert<'content_posts'> = {
    user_id: user.id,
    post_type: 'quote',
    title: trimmed,
    brief_id: briefId,
    topic_tags: cleanTags,
    status,
    ...(flaggedTerms !== null ? { flagged_terms: flaggedTerms } : {}),
  }
  const { error } = await supabase.from('content_posts').insert(insertPayload)

  if (error) return { error: 'Failed to submit quote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true, status }
}

// A member editing their own previously-submitted quote (RLS's own "Members
// can update own posts" policy, 008_member_read_policies.sql, already
// scopes this to the caller's rows — the .eq('user_id', ...) below is
// belt-and-suspenders for a clear affected-rows count, not the sole guard).
// Only body/tags are editable here: a 'member'-sourced quote has no
// source_name/detail/url/platform/org to edit (those are always null for
// this quote_source), so this is already the quote's full field set.
// Re-runs the same clarity gate as first submission — otherwise an edit
// could smuggle in flagged content a member's own initial submission would
// have been blocked on.
export async function updateOwnQuote(
  quoteId: string,
  briefSlug: string,
  body: string,
  tags: string[],
): Promise<{ error?: string; success?: boolean; status?: 'published' | 'pending' }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to edit a quote.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Quote cannot be empty.' }
  if (trimmed.length > 500) return { error: 'Quote must be under 500 characters.' }

  const cleanTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 10)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role as UserRole | undefined

  let status: 'published' | 'pending' = 'published'
  let flaggedTerms: Json | null = null
  if (role === 'admin') {
    status = 'pending'
  } else {
    const { flaggedTerms: flags, isClean } = checkClarity(trimmed)
    if (!isClean) {
      status = 'pending'
      flaggedTerms = flags as unknown as Json
    }
  }

  const { error, count } = await supabase
    .from('content_posts')
    .update(
      { title: trimmed, topic_tags: cleanTags, status, flagged_terms: flaggedTerms },
      { count: 'exact' },
    )
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .eq('post_type', 'quote')

  if (error) return { error: 'Failed to update quote. Please try again.' }
  if (!count) return { error: 'Quote not found.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true, status }
}

// A member's like on a quote — any logged-in member, true toggle, same
// shape as likeCoverage below.
export async function likeQuote(contentPostId: string, briefSlug: string): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to like this.' }

  const { data: existing } = await supabase
    .from('content_post_likes')
    .select('id')
    .eq('content_post_id', contentPostId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('content_post_likes').delete().eq('id', existing.id)
    : await supabase.from('content_post_likes').insert({ content_post_id: contentPostId, user_id: user.id })

  if (error) return { error: 'Failed to record your like. Please try again.' }

  if (!existing) {
    await logEvent({ eventType: 'like_added', userId: user.id, targetType: 'quote', targetId: contentPostId })
  }

  revalidatePath(`/briefs/${briefSlug}`)
  return { liked: !existing }
}

// Records a copy-event on a quote (content_usage, migration 031) — the
// card-level and detail-view copy buttons both call this. Logged-out
// copies still count (user_id null); no revalidatePath since nothing
// visible changes from this beyond the button's own "Copied" state.
export async function logQuoteUsage(contentPostId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('content_usage').insert({
    content_post_id: contentPostId,
    user_id: user?.id ?? null,
  })

  if (error) return { error: 'Failed to record usage.' }
  return { success: true }
}

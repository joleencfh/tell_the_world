'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { CONTRIBUTOR_ROLES } from '@/lib/types'
import type { Json } from '@/lib/database.types'

// Part 4b: an expert/organisation's additional answer to an existing FAQ
// item, submitted pending admin approval (unlike setReviewStatus below —
// this is free text, not a binary trust signal, so it follows the
// propose/moderate pattern instead of publishing immediately).
export async function submitFaqAnswer(
  briefId: string,
  briefSlug: string,
  question: string,
  body: string,
  richContent?: unknown,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to add an answer.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can add FAQ answers.' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Answer cannot be empty.' }
  if (trimmed.length > 2000) return { error: 'Answer must be under 2000 characters.' }

  const { error } = await supabase.from('brief_faq_answers').insert({
    brief_id: briefId,
    question,
    author_user_id: user.id,
    body: trimmed,
    // rich_content (migration 042) is the Lexical editorState.toJSON() tree
    // from the same shared editor Explainer subsections use (Part 0b);
    // `body` stays the not-null plain-text mirror the fallback render path
    // and any plain-text consumers read.
    rich_content: (richContent ?? null) as Json,
    status: 'pending',
  })

  if (error) return { error: 'Failed to submit answer. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Part 6: an expert/organisation's suggested call to action, submitted
// pending admin approval — free text + a link, so it follows the same
// propose/moderate pattern as submitFaqAnswer above rather than publishing
// immediately.
//
// Admin gets a second path (added 2026-08-13, admin-preview request): the
// "+ New CTA" button is also shown to admin so they don't need a separate
// expert/org test account just to see the flow, but admin isn't in
// CONTRIBUTOR_ROLES and brief_ctas' insert RLS policy only allows expert/
// organisation — an admin-authenticated insert through the normal RLS
// client would be rejected. Rather than widen that policy (a real
// capability change), an admin submission here is routed through the
// service-role client and saved as an editorial "Tell The World" CTA
// (author_user_id null, status published immediately) — the same shape
// migration 026's header comment already describes for editorial CTAs,
// just reachable from this form instead of only the Supabase dashboard.
export async function submitCta(
  briefId: string,
  briefSlug: string,
  title: string,
  description: string,
  linkUrl: string,
): Promise<{ error?: string; success?: boolean; published?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to suggest a call to action.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isContributor = !!userData && CONTRIBUTOR_ROLES.includes(userData.role)
  const isAdmin = userData?.role === 'admin'
  if (!isContributor && !isAdmin) {
    return { error: 'Only experts and organisations can suggest calls to action.' }
  }

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const trimmedUrl = linkUrl.trim()

  if (!trimmedTitle) return { error: 'Title cannot be empty.' }
  if (trimmedTitle.length > 120) return { error: 'Title must be under 120 characters.' }
  if (trimmedDescription.length > 600) return { error: 'Description must be under 600 characters.' }
  if (!trimmedUrl) return { error: 'Link URL cannot be empty.' }
  if (trimmedUrl.length > 500) return { error: 'Link URL must be under 500 characters.' }
  if (!/^https?:\/\//i.test(trimmedUrl)) return { error: 'Link URL must start with http:// or https://.' }

  const row = {
    brief_id: briefId,
    title: trimmedTitle,
    description: trimmedDescription || null,
    link_url: trimmedUrl,
  }

  const { error } = isAdmin
    ? await getAdminClient()
        .from('brief_ctas')
        .insert({ ...row, author_user_id: null, status: 'published' })
    : await supabase
        .from('brief_ctas')
        .insert({ ...row, author_user_id: user.id, status: 'pending' })

  if (error) return { error: 'Failed to submit call to action. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true, published: isAdmin }
}

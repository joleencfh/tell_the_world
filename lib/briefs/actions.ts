'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendBriefProposalEmail } from '@/lib/email/send-brief-proposal'
import { getMaxContentVersion } from '@/lib/data/contributions'
import { fetchLinkPreview } from '@/lib/links/link-preview'
import { getCoverageComments, getCoverageLikers } from '@/lib/data/coverage'
import type { CoverageComment, CoverageAuthor } from '@/lib/data/coverage'
import type { UserRole } from '@/lib/types'
import type { Json } from '@/lib/database.types'

const CONTRIBUTOR_ROLES = ['expert', 'organisation']

export async function submitCorrectionProposal(
  briefId: string,
  briefSlug: string,
  proposalText: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to submit a correction.' }

  // Verify role server-side (belt-and-suspenders — RLS also enforces this)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['expert', 'organisation'].includes(userData.role)) {
    return { error: 'Only experts and organisations can propose corrections.' }
  }

  const trimmed = proposalText.trim()
  if (!trimmed) return { error: 'Correction cannot be empty.' }
  if (trimmed.length > 3000) return { error: 'Correction must be under 3000 characters.' }

  const { error } = await supabase
    .from('brief_correction_proposals')
    .insert({ brief_id: briefId, user_id: user.id, contribution_text: trimmed })

  if (error) return { error: 'Failed to submit correction. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

export async function submitQuestion(
  briefId: string,
  briefSlug: string,
  questionText: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to submit a question.' }

  const trimmed = questionText.trim()
  if (!trimmed) return { error: 'Question cannot be empty.' }
  if (trimmed.length > 1000) return { error: 'Question must be under 1000 characters.' }

  const { error } = await supabase
    .from('questions')
    .insert({ brief_id: briefId, user_id: user.id, question_text: trimmed })

  if (error) return { error: 'Failed to submit question. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

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

// Part 7: a member's submission of a press coverage link — any logged-in
// member, not just experts/organisations (deliberate deviation from
// submitCta above, confirmed with the user during this part's build).
// URL-only form: outlet name, article title, and image all come from the
// page's own Open Graph tags, fetched server-side here at submission time
// (lib/links/link-preview.ts never throws, so this always has something
// usable to insert even if the fetch fails or the site has no OG tags).
export async function submitCoverage(
  briefId: string,
  briefSlug: string,
  url: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to add coverage.' }

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return { error: 'Link URL cannot be empty.' }
  if (trimmedUrl.length > 500) return { error: 'Link URL must be under 500 characters.' }
  if (!/^https?:\/\//i.test(trimmedUrl)) return { error: 'Link URL must start with http:// or https://.' }

  let parsed: URL
  try {
    parsed = new URL(trimmedUrl)
  } catch {
    return { error: 'That doesn’t look like a valid URL.' }
  }

  const preview = await fetchLinkPreview(parsed.toString())

  const { error } = await supabase.from('brief_coverage').insert({
    brief_id: briefId,
    url: parsed.toString(),
    outlet_name: preview.outletName,
    title: preview.title,
    image_url: preview.imageUrl,
    published_date: preview.publishedDate,
    submitted_by: user.id,
    status: 'pending',
  })

  if (error) return { error: 'Failed to submit coverage. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

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
): Promise<{ error?: string; success?: boolean }> {
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

  // title holds the quote text itself (content_posts.title is not null;
  // QuoteCard renders `body || title`, so leaving body null here falls
  // straight back to what was just typed — same shape a bare-title quote
  // authored any other way already renders as).
  const { error } = await supabase.from('content_posts').insert({
    user_id: user.id,
    post_type: 'quote',
    title: trimmed,
    brief_id: briefId,
    topic_tags: cleanTags,
    status: 'pending',
  })

  if (error) return { error: 'Failed to submit quote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
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

// A member's like on a coverage row — any logged-in member, true toggle
// (insert if absent, delete if present), same shape as voteQuestion below.
export async function likeCoverage(coverageId: string, briefSlug: string): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to like this.' }

  const { data: existing } = await supabase
    .from('brief_coverage_likes')
    .select('id')
    .eq('coverage_id', coverageId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('brief_coverage_likes').delete().eq('id', existing.id)
    : await supabase.from('brief_coverage_likes').insert({ coverage_id: coverageId, user_id: user.id })

  if (error) return { error: 'Failed to record your like. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { liked: !existing }
}

// ---------------------------------------------------------------------------
// Part 9: Covered By click-through modal — comments (any logged-in member,
// no moderation queue, posts immediately) and their up/down votes. No
// revalidatePath on these two: comments/votes aren't part of the page's
// initial SSR data (Coverage doesn't carry them, see lib/data/coverage.ts),
// so there's nothing cached on /briefs/[slug] for either to invalidate —
// the modal manages its own state entirely client-side once opened.
// ---------------------------------------------------------------------------

export async function submitCoverageComment(coverageId: string, body: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to comment.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comment cannot be empty.' }
  if (trimmed.length > 1000) return { error: 'Comment must be under 1000 characters.' }

  const { error } = await supabase.from('brief_coverage_comments').insert({
    coverage_id: coverageId,
    user_id: user.id,
    body: trimmed,
  })

  if (error) return { error: 'Failed to post your comment. Please try again.' }
  return { success: true }
}

// A member's up/down vote on a coverage comment — unlike likeCoverage's
// plain toggle, this is directional: casting the vote you already hold
// removes it, casting the other one switches it (migration 045's update
// policy lets this happen in one round trip instead of delete-then-insert).
export async function voteCoverageComment(
  commentId: string,
  direction: 'up' | 'down',
): Promise<{ error?: string; myVote?: 'up' | 'down' | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to vote.' }

  const { data: existing } = await supabase
    .from('brief_coverage_comment_votes')
    .select('id, direction')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  let writeError
  let myVote: 'up' | 'down' | null
  if (existing?.direction === direction) {
    ;({ error: writeError } = await supabase.from('brief_coverage_comment_votes').delete().eq('id', existing.id))
    myVote = null
  } else if (existing) {
    ;({ error: writeError } = await supabase.from('brief_coverage_comment_votes').update({ direction }).eq('id', existing.id))
    myVote = direction
  } else {
    ;({ error: writeError } = await supabase.from('brief_coverage_comment_votes').insert({ comment_id: commentId, user_id: user.id, direction }))
    myVote = direction
  }

  if (writeError) return { error: 'Failed to record your vote. Please try again.' }
  return { myVote }
}

// The click-through modal's data: comments (with vote tallies) and "who
// liked this" — fetched together on demand when a viewer opens the modal,
// not bundled into the page's initial load (mirrors getVoters below). No
// login required: Covered By, and everything in this modal, is visible to
// logged-out visitors on public briefs.
export async function getCoverageDetail(coverageId: string): Promise<{ comments: CoverageComment[]; likers: CoverageAuthor[] }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [comments, likers] = await Promise.all([
    getCoverageComments(supabase, coverageId, user?.id ?? null),
    getCoverageLikers(supabase, coverageId),
  ])

  return { comments, likers }
}

// Part 5: a member's vote on a Community Q&A question — one row per
// (question, user), a true toggle (insert if absent, delete if present —
// migration 025 added the delete RLS policy this needs; a repeat click
// used to upsert-with-ignoreDuplicates, which meant a vote could never be
// undone, reported 2026-08-13). Any logged-in member can vote. Displayed
// split by voter segment (pink creator/journalist vs. blue expert/
// organisation, lib/data/questions.ts's VoteSplit) rather than as two
// separate vote buttons, since a voter's own role already decides which
// bucket their single vote lands in.
export async function voteQuestion(questionId: string, briefSlug: string): Promise<{ error?: string; voted?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to vote.' }

  const { data: existing } = await supabase
    .from('question_votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('question_votes').delete().eq('id', existing.id)
    : await supabase.from('question_votes').insert({ question_id: questionId, user_id: user.id })

  if (error) return { error: 'Failed to record your vote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { voted: !existing }
}

// Part 5 follow-up (2026-08-13): a member's vote on a specific answer —
// "this was helpful", distinct from endorseAnswer below ("an expert
// vouches this is accurate"). Answers are now their own rows
// (question_answers, a flat list, no threading), so this targets an
// answer_id rather than the question. Toggles the same way voteQuestion
// does, above.
export async function voteAnswer(answerId: string, briefSlug: string): Promise<{ error?: string; voted?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to vote.' }

  const { data: existing } = await supabase
    .from('question_answer_votes')
    .select('id')
    .eq('answer_id', answerId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('question_answer_votes').delete().eq('id', existing.id)
    : await supabase.from('question_answer_votes').insert({ answer_id: answerId, user_id: user.id })

  if (error) return { error: 'Failed to record your vote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { voted: !existing }
}

// Part 7: an expert/organisation/admin's answer to a Community Q&A
// question — question_answers previously had no submission path at all
// (migration 024's own comment flagged this as deferred). Propose-then-
// pending like submitFaqAnswer above; admin bypasses to immediate publish
// via the service role, same shape as submitCta's admin branch.
export async function submitAnswer(
  briefSlug: string,
  questionId: string,
  body: string,
): Promise<{ error?: string; success?: boolean; published?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to add an answer.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role as UserRole | undefined
  const isContributor = !!role && CONTRIBUTOR_ROLES.includes(role)
  const isAdmin = role === 'admin'
  if (!isContributor && !isAdmin) {
    return { error: 'Only experts, organisations, and admins can add answers.' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Answer cannot be empty.' }
  if (trimmed.length > 2000) return { error: 'Answer must be under 2000 characters.' }

  const row = { question_id: questionId, author_user_id: user.id, body: trimmed }

  const { error } = isAdmin
    ? await getAdminClient().from('question_answers').insert({ ...row, status: 'published' })
    : await supabase.from('question_answers').insert({ ...row, status: 'pending' })

  if (error) return { error: 'Failed to submit answer. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true, published: isAdmin }
}

// An expert/organisation's endorsement of a specific answer — role-gated
// (belt-and-suspenders, RLS also enforces this). No "has an answer" check
// needed anymore since an answer_id only ever exists once the answer row
// itself does.
export async function endorseAnswer(answerId: string, briefSlug: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to endorse an answer.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can endorse answers.' }
  }

  const { error } = await supabase
    .from('question_answer_endorsements')
    .upsert({ answer_id: answerId, user_id: user.id }, { onConflict: 'answer_id,user_id', ignoreDuplicates: true })

  if (error) return { error: 'Failed to endorse. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Voter list — the "who voted/endorsed this" modal (requested 2026-08-13).
// Read-only, fetched on demand (only when a viewer opens the modal) rather
// than bundled into the page's initial data, since most viewers never open
// it and a popular question/answer could have a long voter list.
// ---------------------------------------------------------------------------

export interface Voter {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole | null
  affiliation: string | null
  org_name: string | null
}

const VOTER_TABLES = {
  question_votes: { table: 'question_votes', idColumn: 'question_id' },
  answer_votes: { table: 'question_answer_votes', idColumn: 'answer_id' },
  answer_endorsements: { table: 'question_answer_endorsements', idColumn: 'answer_id' },
} as const

export async function getVoters(
  kind: keyof typeof VOTER_TABLES,
  id: string,
): Promise<{ voters: Voter[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { voters: [], error: 'You must be logged in to see who voted.' }

  const { table, idColumn } = VOTER_TABLES[kind]
  const { data, error } = await supabase
    .from(table)
    .select(`users(id, display_name, email, avatar_url, role, affiliation, org_name)`)
    .eq(idColumn, id)

  if (error) return { voters: [], error: 'Failed to load voters. Please try again.' }

  return { voters: (data ?? []).map((row) => (row as unknown as { users: Voter }).users).filter(Boolean) }
}

// Part 0c: shared "send feedback to moderators" mechanism, reused by five
// later parts (Contribute menu, TL;DR, Explainer ×2, FAQ) rather than
// built five times. Unlike submitCorrectionProposal/submitFaqAnswer/
// submitCta above, this isn't gated to expert/organisation — any signed-in
// member can submit — but login is required (confirmed with the user;
// brief_feedback's insert RLS policy, migration 034, is authenticated-
// only). `section` is a loose, caller-defined key (e.g. 'tldr',
// 'faq:<question>', 'explainer:<section id>', or omitted for brief-level
// feedback) — this action doesn't validate its shape.
export async function submitBriefFeedback(
  briefId: string,
  section: string | null,
  body: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to send feedback.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Feedback cannot be empty.' }
  if (trimmed.length > 2000) return { error: 'Feedback must be under 2000 characters.' }

  const { error } = await supabase.from('brief_feedback').insert({
    brief_id: briefId,
    section,
    user_id: user.id,
    body: trimmed,
  })

  if (error) return { error: 'Failed to submit feedback. Please try again.' }

  return { success: true }
}

export async function proposeBrief(
  topicTitle: string,
  whyItMatters: string,
  fromBriefTitle?: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to propose a brief.' }

  const { data: userData } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  if (!userData) return { error: 'Failed to load your profile.' }

  const title = topicTitle.trim()
  const why = whyItMatters.trim()
  if (!title) return { error: 'Topic title is required.' }
  if (!why) return { error: 'Please explain why this topic matters.' }

  const submitterName = userData.display_name || userData.email.split('@')[0]

  // Persist to DB so the admin can see all proposals in the admin panel
  const { error: insertError } = await supabase.from('brief_proposals').insert({
    user_id: user.id,
    submitter_name: submitterName,
    submitter_email: userData.email,
    topic_title: title,
    why_it_matters: why,
    from_brief_title: fromBriefTitle ?? null,
  })

  if (insertError) return { error: 'Failed to submit proposal. Please try again.' }

  // Also email the admin — fire and forget (DB record is the source of truth)
  sendBriefProposalEmail({
    submitter_name: submitterName,
    submitter_email: userData.email,
    topic_title: title,
    why_it_matters: why,
    from_brief_title: fromBriefTitle ?? null,
  }).catch((err) => console.error('Brief proposal email failed:', err))

  return { success: true }
}

// Reused brief_contributions self-serve mechanism (design plan §2): a simple
// "Mark as reviewed" / "Endorse" toggle for experts/organisations, brief-level
// (sectionId null, Part 1) or section-level (Part 3). One row per (user,
// target) — the review→endorsement transition upgrades the existing row in
// place rather than inserting a second one, matching the DB's partial unique
// indexes (migration 017).
export async function setReviewStatus(
  briefId: string,
  briefSlug: string,
  sectionId: string | null,
  targetType: 'review' | 'endorsement',
  body?: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to review or endorse briefs.' }

  const trimmedBody = body?.trim() || null
  if (trimmedBody && trimmedBody.length > 500) {
    return { error: 'Comment must be under 500 characters.' }
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can review or endorse briefs.' }
  }

  const existingBase = supabase
    .from('brief_contributions')
    .select('id')
    .eq('brief_id', briefId)
    .eq('user_id', user.id)
    .in('type', ['review', 'endorsement'])
    .limit(1)
  const { data: existingRows } = await (sectionId
    ? existingBase.eq('section_id', sectionId)
    : existingBase.is('section_id', null))
  const existing = existingRows?.[0] ?? null

  if (targetType === 'endorsement' && !existing) {
    return { error: 'Mark as reviewed before endorsing.' }
  }

  // Pin the current content_version so a later substantive edit can mark
  // this contribution stale — getEndorsementBarCounts already handles that
  // comparison, untouched by this plan (§2).
  let sectionVersion: number
  if (sectionId) {
    const { data: section } = await supabase
      .from('brief_sections')
      .select('content_version')
      .eq('id', sectionId)
      .single()
    if (!section) return { error: 'Section not found.' }
    sectionVersion = section.content_version
  } else {
    const { data: sections } = await supabase
      .from('brief_sections')
      .select('content_version')
      .eq('brief_id', briefId)
    sectionVersion = getMaxContentVersion(sections ?? [])
  }

  // An untyped comment on the endorsement/review upgrade doesn't overwrite
  // an earlier one — only include body in the update when the caller
  // actually typed something this time.
  const { error } = existing
    ? await supabase
        .from('brief_contributions')
        .update({
          type: targetType,
          section_version: sectionVersion,
          status: 'published',
          ...(trimmedBody ? { body: trimmedBody } : {}),
        })
        .eq('id', existing.id)
    : await supabase.from('brief_contributions').insert({
        brief_id: briefId,
        section_id: sectionId,
        user_id: user.id,
        type: targetType,
        section_version: sectionVersion,
        status: 'published',
        body: trimmedBody,
      })

  if (error) return { error: 'Failed to save. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Self-withdraw — a contributor removing their own review/endorsement,
// triggered from the profile history list (lib/data/contributions.ts's
// getUserReviewHistory). Same 'archived' status admin's archiveBriefReview
// (lib/admin/actions.ts) uses, and the same RLS policy ("Contributors can
// update their own review or endorsement", migration 017) that already
// allows this — the .eq('user_id', ...) below is defense in depth, not the
// actual enforcement. Archiving (not deleting) is what makes this show up
// in the user's own history as "withdrawn" rather than vanishing.
export async function withdrawReview(contributionId: string, briefSlug: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in.' }

  const { error } = await supabase
    .from('brief_contributions')
    .update({ status: 'archived' })
    .eq('id', contributionId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to withdraw. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchLinkPreview } from '@/lib/links/link-preview'
import { fetchAndStoreImage } from '@/lib/links/store-image'
import { getCoverageComments, getCoverageLikers } from '@/lib/data/coverage'
import { logEvent } from '@/lib/analytics/log'
import type { CoverageComment, CoverageAuthor } from '@/lib/data/coverage'

// Part 7: a member's submission of a press coverage link — any logged-in
// member, not just experts/organisations (deliberate deviation from
// submitCta above, confirmed with the user during this part's build).
// URL-only form: outlet name, article title, and image all come from the
// page's own Open Graph tags, fetched server-side here at submission time
// (lib/links/link-preview.ts never throws, so this always has something
// usable to insert even if the fetch fails or the site has no OG tags).
// The og:image itself is re-hosted through Supabase storage
// (lib/links/store-image.ts) rather than stored as the outlet's own CDN
// URL — the CSP's img-src doesn't allow-list arbitrary third-party hosts,
// so a hotlinked image_url would silently never render in the browser.
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
  const imageUrl = preview.imageUrl ? await fetchAndStoreImage(supabase, preview.imageUrl, user.id) : null

  const { error } = await supabase.from('brief_coverage').insert({
    brief_id: briefId,
    url: parsed.toString(),
    outlet_name: preview.outletName,
    title: preview.title,
    image_url: imageUrl,
    published_date: preview.publishedDate,
    submitted_by: user.id,
    status: 'pending',
  })

  if (error) return { error: 'Failed to submit coverage. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
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

  await logEvent({ eventType: 'comment_submitted', userId: user.id, targetType: 'coverage_comment', targetId: coverageId })

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

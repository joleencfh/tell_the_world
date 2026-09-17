'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendBriefProposalApprovedEmail } from '@/lib/email/send-brief-proposal-approved'
import { slugify, uniqueSlug } from '../slug'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'
import { getSiteUrl } from './shared'

// ---------------------------------------------------------------------------
// Brief proposals
// ---------------------------------------------------------------------------

export interface BriefProposal {
  id: string
  user_id: string | null
  submitter_name: string
  submitter_email: string
  topic_title: string
  why_it_matters: string
  from_brief_title: string | null
  status: 'pending' | 'approved' | 'declined'
  // Part 10 (docs/design/brief-feature/brief-page-part2-plan.md §2) —
  // set together by convertProposalToBrief/linkProposalToBrief below.
  published_brief_id: string | null
  minor_changes_flag: boolean
  created_at: string
}

export async function getBriefProposals(page = 1): Promise<PagedResult<BriefProposal>> {
  await requireAdmin()
  return adminData.getBriefProposals(getAdminClient(), page)
}

export async function declineBriefProposal(proposalId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_proposals')
    .update({ status: 'declined' })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Brief proposals — approve (convert to new brief, or link an existing one)
// ---------------------------------------------------------------------------

// Shared by both paths below: marks the proposal approved + linked, and
// notifies the submitter — the trigger for that email is published_brief_id
// being set, per the Notion Story's scope note (submitter notification is
// part of this story, not a separate one).
async function resolveBriefProposal(
  proposalId: string,
  briefId: string,
  briefSlug: string,
  minorChanges: boolean,
  submitterName: string,
  submitterEmail: string,
  topicTitle: string,
): Promise<{ error?: string }> {
  const { error } = await getAdminClient()
    .from('brief_proposals')
    .update({ status: 'approved', published_brief_id: briefId, minor_changes_flag: minorChanges })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  const siteUrl = await getSiteUrl()
  sendBriefProposalApprovedEmail({
    submitter_name: submitterName,
    submitter_email: submitterEmail,
    topic_title: topicTitle,
    brief_url: `${siteUrl}/briefs/${briefSlug}`,
    minor_changes: minorChanges,
  }).catch((err) => console.error('Brief proposal approval email failed:', err))

  revalidatePath('/admin')
  return {}
}

// "Convert to new brief" — creates a real briefs row pre-filled from the
// proposal (title from topic_title, the seeded Explainer subsection from
// why_it_matters — a starting draft, not final copy), same section scaffold
// createBrief uses, then resolves the proposal and redirects into the admin
// editor so the admin can finish writing it up.
export async function convertProposalToBrief(
  proposalId: string,
  minorChanges: boolean,
): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = getAdminClient()

  const { data: proposal, error: fetchError } = await admin
    .from('brief_proposals')
    .select('topic_title, why_it_matters, submitter_name, submitter_email, status')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) return { error: 'Proposal not found.' }
  if (proposal.status !== 'pending') return { error: 'This proposal has already been resolved.' }

  const briefId = randomUUID()
  const slug = await uniqueSlug(slugify(proposal.topic_title), briefId)

  const { error: briefError } = await admin
    .from('briefs')
    .insert({ id: briefId, title: proposal.topic_title, slug, visibility: 'members_only' })

  if (briefError) return { error: briefError.message }

  // Same scaffold as createBrief (brief-actions.ts) — use_this/featured_news/
  // where_experts_stand are old-IA types, not seeded on new briefs.
  await admin.from('brief_sections').insert([
    { brief_id: briefId, section_type: 'tldr', content: '', display_order: 1 },
    { brief_id: briefId, section_type: 'explainer', content: proposal.why_it_matters, display_order: 2 },
    { brief_id: briefId, section_type: 'going_deeper', content: '', display_order: 3 },
    { brief_id: briefId, section_type: 'faq', content: '', display_order: 4 },
  ])

  const resolved = await resolveBriefProposal(
    proposalId, briefId, slug, minorChanges, proposal.submitter_name, proposal.submitter_email, proposal.topic_title,
  )
  if (resolved.error) return resolved

  redirect(`/admin/briefs/${briefId}`)
}

// "Link to existing brief" — for when the admin already wrote a brief based
// on the proposal separately, rather than starting from its scaffold.
export async function linkProposalToBrief(
  proposalId: string,
  briefId: string,
  minorChanges: boolean,
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = getAdminClient()

  const { data: proposal, error: fetchError } = await admin
    .from('brief_proposals')
    .select('topic_title, submitter_name, submitter_email, status')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) return { error: 'Proposal not found.' }
  if (proposal.status !== 'pending') return { error: 'This proposal has already been resolved.' }

  const { data: brief, error: briefFetchError } = await admin
    .from('briefs')
    .select('slug')
    .eq('id', briefId)
    .single()

  if (briefFetchError || !brief) return { error: 'Brief not found.' }

  const resolved = await resolveBriefProposal(
    proposalId, briefId, brief.slug, minorChanges, proposal.submitter_name, proposal.submitter_email, proposal.topic_title,
  )
  if (resolved.error) return resolved

  return { success: true }
}

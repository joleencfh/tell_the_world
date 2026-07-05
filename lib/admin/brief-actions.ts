'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Brief {
  id: string
  title: string
  slug: string
  tldr: string
  visibility: 'public' | 'members_only'
  created_at: string
  updated_at: string
}

export interface BriefSection {
  id: string
  brief_id: string
  section_type: 'recent_developments' | 'sources_basic' | 'sources_advanced' | 'faq'
  content: string
  display_order: number
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createBrief(): Promise<never> {
  await requireAdmin()

  const slug = `brief-${randomUUID()}`

  const { data: brief, error } = await getAdminClient()
    .from('briefs')
    .insert({ title: 'Untitled', slug, tldr: '', visibility: 'members_only' })
    .select('id')
    .single()

  if (error || !brief) throw new Error(error?.message ?? 'Failed to create brief')

  await getAdminClient().from('brief_sections').insert([
    { brief_id: brief.id, section_type: 'recent_developments', content: '', display_order: 1 },
    { brief_id: brief.id, section_type: 'sources_basic',        content: '', display_order: 2 },
    { brief_id: brief.id, section_type: 'sources_advanced',     content: '', display_order: 3 },
    { brief_id: brief.id, section_type: 'faq',                  content: '', display_order: 4 },
  ])

  redirect(`/admin/briefs/${brief.id}`)
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getBrief(id: string): Promise<{
  brief: Brief | null
  sections: BriefSection[]
  error: string | null
}> {
  await requireAdmin()

  const [briefResult, sectionsResult] = await Promise.all([
    getAdminClient().from('briefs').select('*').eq('id', id).single(),
    getAdminClient().from('brief_sections').select('*').eq('brief_id', id).order('display_order'),
  ])

  if (briefResult.error) return { brief: null, sections: [], error: briefResult.error.message }

  return {
    brief: briefResult.data as Brief,
    sections: (sectionsResult.data ?? []) as BriefSection[],
    error: null,
  }
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export async function saveBrief(
  briefId: string,
  data: {
    title: string
    tldr: string
    visibility: 'public' | 'members_only'
    sections: Array<{ id: string; content: string; display_order: number }>
  }
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error: briefError } = await getAdminClient()
    .from('briefs')
    .update({ title: data.title, tldr: data.tldr, visibility: data.visibility })
    .eq('id', briefId)

  if (briefError) return { error: briefError.message }

  for (const section of data.sections) {
    const { error } = await getAdminClient()
      .from('brief_sections')
      .update({ content: section.content, display_order: section.display_order })
      .eq('id', section.id)

    if (error) return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/briefs/${briefId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteBrief(briefId: string): Promise<never> {
  await requireAdmin()

  await getAdminClient().from('briefs').delete().eq('id', briefId)
  redirect('/admin')
}

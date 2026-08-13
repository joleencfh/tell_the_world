import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// Data-access layer for brief_ctas reads. See lib/data/faq-answers.ts for
// the closest existing pattern (two-ink-bold-plan.md Part 6).

type DB = SupabaseClient<Database>

// No email — same anon-column-grant reasoning as FaqAnswerAuthor in
// lib/data/faq-answers.ts. Null when a CTA was authored editorially by
// Tell The World rather than a specific expert/org (author_user_id null).
export interface CtaAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  affiliation: string | null
  org_name: string | null
}

export interface Cta {
  id: string
  title: string
  description: string | null
  link_url: string
  created_at: string
  users: CtaAuthor | null
}

const CTA_SELECT =
  'id, title, description, link_url, created_at, users(id, display_name, avatar_url, role, affiliation, org_name)'

// Published CTAs for a brief, most recent first — this is a small "what's
// new/featured" carousel, not an evergreen reference list like FAQ answers,
// so newest-first reads better than the oldest-first convention used there.
export async function getPublishedCtas(db: DB, briefId: string): Promise<Cta[]> {
  const { data } = await db
    .from('brief_ctas')
    .select(CTA_SELECT)
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as Cta[]
}

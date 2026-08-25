import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Data-access layer for brief_faq_meta reads (migration 041, Part 6). See
// lib/data/briefs.ts for the pattern.

type DB = SupabaseClient<Database>

// No email — same anon-column-grant reasoning as QuoteAuthor in
// lib/data/posts.ts: names in the triple-dot "info" panel are visible to
// anon visitors on public briefs.
export interface FaqMetaUser {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export interface FaqMeta {
  collaborators: FaqMetaUser[]
  feedbackGivers: FaqMetaUser[]
  richContent: unknown
}

// brief_faq_meta has no FK to a specific FAQ item — like brief_faq_answers,
// it keys off (brief_id, question) against the question's exact parsed
// text (lib/briefs/parse-faq.ts). collaborator_user_ids/feedback_giver_user_ids
// are plain uuid[] columns (no join table), so resolving them to display
// names takes a second query rather than a PostgREST embed.
export async function getFaqMeta(db: DB, briefId: string): Promise<Map<string, FaqMeta>> {
  const { data: rows } = await db
    .from('brief_faq_meta')
    .select('question, collaborator_user_ids, feedback_giver_user_ids, answer_rich_content')
    .eq('brief_id', briefId)

  const result = new Map<string, FaqMeta>()
  if (!rows || rows.length === 0) return result

  const allUserIds = new Set<string>()
  for (const row of rows) {
    for (const id of row.collaborator_user_ids) allUserIds.add(id)
    for (const id of row.feedback_giver_user_ids) allUserIds.add(id)
  }

  const usersById = new Map<string, FaqMetaUser>()
  if (allUserIds.size > 0) {
    const { data: users } = await db
      .from('users')
      .select('id, display_name, avatar_url')
      .in('id', [...allUserIds])
    for (const user of users ?? []) usersById.set(user.id, user)
  }

  for (const row of rows) {
    result.set(row.question, {
      collaborators: row.collaborator_user_ids.map((id) => usersById.get(id)).filter((u): u is FaqMetaUser => !!u),
      feedbackGivers: row.feedback_giver_user_ids.map((id) => usersById.get(id)).filter((u): u is FaqMetaUser => !!u),
      richContent: row.answer_rich_content,
    })
  }

  return result
}

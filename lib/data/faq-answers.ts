import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// Data-access layer for brief_faq_answers reads. See lib/data/briefs.ts for
// the pattern.

type DB = SupabaseClient<Database>

// No email — same anon-column-grant reasoning as QuoteAuthor in
// lib/data/posts.ts: this backs the brief page's "More answers" cards,
// which anon visitors can read on public briefs.
export interface FaqAnswerAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  affiliation: string | null
  org_name: string | null
}

export interface FaqAnswer {
  id: string
  question: string
  body: string
  // Lexical editorState.toJSON() tree (migration 040) — see lib/richtext's
  // read-side contract. Null for answers submitted before Part 6, or an
  // author who didn't add any links/bold.
  rich_content: unknown
  created_at: string
  users: FaqAnswerAuthor
}

const FAQ_ANSWER_SELECT =
  'id, question, body, rich_content, created_at, users(id, display_name, avatar_url, role, affiliation, org_name)'

// Published FAQ answers for a brief, grouped by exact question text — the
// table has no FK to a specific FAQ item (questions are parsed out of
// brief_sections.content, not their own rows), so grouping is a plain
// string match against the parsed Q: line (two-ink-bold-plan.md Part 4b).
export async function getPublishedFaqAnswers(
  db: DB,
  briefId: string,
): Promise<Map<string, FaqAnswer[]>> {
  const { data } = await db
    .from('brief_faq_answers')
    .select(FAQ_ANSWER_SELECT)
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  const result = new Map<string, FaqAnswer[]>()
  for (const row of (data ?? []) as unknown as FaqAnswer[]) {
    const list = result.get(row.question) ?? []
    list.push(row)
    result.set(row.question, list)
  }
  return result
}

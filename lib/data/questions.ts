import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// Data-access layer for brief Q&A reads. See lib/data/briefs.ts for the pattern.

type DB = SupabaseClient<Database>

export interface QuestionAuthor {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role?: UserRole | null
}

export interface Question {
  id: string
  question_text: string
  answer_text: string | null
  created_at: string
  users: QuestionAuthor
}

// Approved questions for a brief, oldest first, with their authors.
export async function getApprovedQuestions(db: DB, briefId: string): Promise<Question[]> {
  const { data } = await db
    .from('questions')
    .select(
      'id, question_text, answer_text, created_at, users(id, display_name, email, avatar_url, role)',
    )
    .eq('brief_id', briefId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  return (data ?? []) as unknown as Question[]
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// Data-access layer for brief Q&A reads. See lib/data/briefs.ts for the
// pattern. Answers are their own rows now (lib/data/question-answers.ts) —
// a question can have a flat list of answers, no threading.

type DB = SupabaseClient<Database>

export interface QuestionAuthor {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole | null
  affiliation: string | null
  org_name: string | null
  channel_name: string | null
  platform_url: string | null
}

// A vote tally split by voter segment — pink (creator/journalist) vs. blue
// (expert/organisation), per §1.1's semantic color mapping — plus the
// current viewer's own vote state. Requested 2026-08-13: separates "how
// many people found this good" from "which audience found it good", so a
// question popular only with AI-safety insiders reads differently from one
// creators/journalists also rate highly. Votes from any other role (just
// 'admin' today) aren't bucketed into either count.
export interface VoteSplit {
  pinkCount: number
  blueCount: number
  myVote: boolean
}

export interface Question {
  id: string
  question_text: string
  created_at: string
  users: QuestionAuthor
  questionVotes: VoteSplit
}

const AUTHOR_SELECT = 'id, display_name, email, avatar_url, role, affiliation, org_name, channel_name, platform_url'

interface QuestionRow {
  id: string
  question_text: string
  created_at: string
  users: QuestionAuthor
}

interface VoteRow {
  question_id: string
  user_id: string
  users: { role: UserRole | null } | null
}

export function emptySplit(): { pink: number; blue: number; myVote: boolean } {
  return { pink: 0, blue: 0, myVote: false }
}

export function bucketRole(role: UserRole | null | undefined): 'pink' | 'blue' | null {
  if (role === 'creator' || role === 'journalist') return 'pink'
  if (role === 'expert' || role === 'organisation') return 'blue'
  return null
}

// Approved questions for a brief, oldest first, with their askers and the
// question-level vote split (react-best-practices' async-parallel: one bulk
// query for votes rather than one per question, aggregated in JS, matching
// getExplainerUsefulness's shape in lib/data/explainer-engagement.ts).
export async function getApprovedQuestions(db: DB, briefId: string, userId: string): Promise<Question[]> {
  const { data: rows } = await db
    .from('questions')
    .select(`id, question_text, created_at, users(${AUTHOR_SELECT})`)
    .eq('brief_id', briefId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  const questions = (rows ?? []) as unknown as QuestionRow[]
  const questionIds = questions.map((q) => q.id)
  if (questionIds.length === 0) return []

  const { data: votes } = await db.from('question_votes').select('question_id, user_id, users(role)').in('question_id', questionIds)

  const voteSplits = new Map<string, ReturnType<typeof emptySplit>>()
  for (const v of (votes ?? []) as unknown as VoteRow[]) {
    const split = voteSplits.get(v.question_id) ?? emptySplit()
    const bucket = bucketRole(v.users?.role)
    if (bucket === 'pink') split.pink += 1
    else if (bucket === 'blue') split.blue += 1
    if (v.user_id === userId) split.myVote = true
    voteSplits.set(v.question_id, split)
  }

  return questions.map((q) => {
    const split = voteSplits.get(q.id) ?? emptySplit()
    return {
      id: q.id,
      question_text: q.question_text,
      created_at: q.created_at,
      users: q.users,
      questionVotes: { pinkCount: split.pink, blueCount: split.blue, myVote: split.myVote },
    }
  })
}

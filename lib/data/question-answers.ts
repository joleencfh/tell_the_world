import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { QuestionAuthor, VoteSplit } from '@/lib/data/questions'
import { emptySplit, bucketRole } from '@/lib/data/questions'
import type { UserRole } from '@/lib/types'

// Data-access layer for Community Q&A answers — a flat list per question,
// no threading/replies on an answer (two-ink-bold-plan.md Part 5 follow-up,
// requested 2026-08-13). See lib/data/questions.ts for the sibling
// question-level read and lib/data/faq-answers.ts for the closest existing
// pattern (FAQ's "more answers" — the difference is answers here hang off
// a real question_id, not a text-matched question line).

type DB = SupabaseClient<Database>

const AUTHOR_SELECT = 'id, display_name, email, avatar_url, role, affiliation, org_name, channel_name, platform_url'

export interface QuestionAnswer {
  id: string
  question_id: string
  body: string
  created_at: string
  users: QuestionAuthor
  votes: VoteSplit
  endorsedCount: number
  myEndorsement: boolean
}

interface AnswerRow {
  id: string
  question_id: string
  body: string
  created_at: string
  users: QuestionAuthor
}

interface VoteRow {
  answer_id: string
  user_id: string
  users: { role: UserRole | null } | null
}

// Answers for a set of questions, oldest first, grouped by question_id —
// two extra bulk queries (votes, endorsements) rather than one per answer,
// same async-parallel shape as getApprovedQuestions.
export async function getQuestionAnswers(db: DB, questionIds: string[], userId: string): Promise<Map<string, QuestionAnswer[]>> {
  if (questionIds.length === 0) return new Map()

  const { data: rows } = await db
    .from('question_answers')
    .select(`id, question_id, body, created_at, users!question_answers_author_user_id_fkey(${AUTHOR_SELECT})`)
    .in('question_id', questionIds)
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  const answers = (rows ?? []) as unknown as AnswerRow[]
  const answerIds = answers.map((a) => a.id)
  if (answerIds.length === 0) return new Map()

  const [{ data: votes }, { data: endorsements }] = await Promise.all([
    db.from('question_answer_votes').select('answer_id, user_id, users(role)').in('answer_id', answerIds),
    db.from('question_answer_endorsements').select('answer_id, user_id').in('answer_id', answerIds),
  ])

  const voteSplits = new Map<string, ReturnType<typeof emptySplit>>()
  for (const v of (votes ?? []) as unknown as VoteRow[]) {
    const split = voteSplits.get(v.answer_id) ?? emptySplit()
    const bucket = bucketRole(v.users?.role)
    if (bucket === 'pink') split.pink += 1
    else if (bucket === 'blue') split.blue += 1
    if (v.user_id === userId) split.myVote = true
    voteSplits.set(v.answer_id, split)
  }

  const endorsedCounts = new Map<string, number>()
  const myEndorsements = new Set<string>()
  for (const e of endorsements ?? []) {
    endorsedCounts.set(e.answer_id, (endorsedCounts.get(e.answer_id) ?? 0) + 1)
    if (e.user_id === userId) myEndorsements.add(e.answer_id)
  }

  const result = new Map<string, QuestionAnswer[]>()
  for (const a of answers) {
    const split = voteSplits.get(a.id) ?? emptySplit()
    const list = result.get(a.question_id) ?? []
    list.push({
      id: a.id,
      question_id: a.question_id,
      body: a.body,
      created_at: a.created_at,
      users: a.users,
      votes: { pinkCount: split.pink, blueCount: split.blue, myVote: split.myVote },
      endorsedCount: endorsedCounts.get(a.id) ?? 0,
      myEndorsement: myEndorsements.has(a.id),
    })
    result.set(a.question_id, list)
  }
  return result
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { submitQuestion, submitCorrectionProposal } from '@/lib/briefs/actions'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { getDisplayName, formatDate } from './helpers'
import type { Question, QuestionAuthor } from './page'

// ---------------------------------------------------------------------------
// Category display helpers
// ---------------------------------------------------------------------------

const EXPERT_CATEGORY_COLORS: Record<string, string> = {
  'Technical AI Safety': 'bg-sky-900/60 text-sky-300 border-sky-700/40',
  'AI Governance': 'bg-purple-900/60 text-purple-300 border-purple-700/40',
  'Technical AI Governance': 'bg-indigo-900/60 text-indigo-300 border-indigo-700/40',
}

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'bg-red-900/50 text-red-300 border-red-700/40',
  TikTok: 'bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-700/40',
  Podcast: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
}

function CategoryChips({ author }: { author: QuestionAuthor }) {
  if (author.role === 'expert' && author.expert_category) {
    const colorClass = EXPERT_CATEGORY_COLORS[author.expert_category] ?? 'bg-white/10 text-white/60 border-white/10'
    return (
      <span className={`font-mono text-[8px] tracking-[0.08em] uppercase border rounded px-1.5 py-0.5 ${colorClass}`}>
        {author.expert_category}
      </span>
    )
  }
  if (author.role === 'creator' && author.creator_platforms?.length) {
    return (
      <>
        {author.creator_platforms.map((p: string) => {
          const colorClass = PLATFORM_COLORS[p] ?? 'bg-white/10 text-white/60 border-white/10'
          return (
            <span key={p} className={`font-mono text-[8px] tracking-[0.08em] uppercase border rounded px-1.5 py-0.5 ${colorClass}`}>
              {p}
            </span>
          )
        })}
      </>
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// Q&A components
// ---------------------------------------------------------------------------

function AuthorStrip({ author, date }: { author: QuestionAuthor; date?: string }) {
  const name = getDisplayName(author)
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Avatar
        name={name}
        avatarUrl={author.avatar_url}
        palette="colored"
        size="xs"
        ringClassName="ring-2 ring-white/10"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/profile/${author.id}`}
            className="font-serif text-xs font-semibold text-dark hover:text-live transition-colors truncate"
          >
            {name}
          </Link>
          {author.role && <RoleBadge role={author.role} variant="outline" />}
          <CategoryChips author={author} />
        </div>
        {date && (
          <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-soft mt-0.5">
            {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  )
}

export function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="border border-edge rounded-2xl overflow-hidden bg-card">
      {/* Question */}
      <div className="p-5">
        <AuthorStrip author={question.users} date={question.created_at} />
        <p className="font-serif text-sm text-dark font-semibold leading-snug mt-3">
          {question.question_text}
        </p>
      </div>

      {/* Answer */}
      {question.answer_text ? (
        <div className="border-t border-edge bg-base px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-0.5 self-stretch bg-live/40 rounded-full shrink-0 mt-0.5 mb-0.5" />
            <div className="min-w-0 flex-1 space-y-3">
              {question.answered_by && (
                <AuthorStrip author={question.answered_by} />
              )}
              <p className="font-serif text-sm text-text leading-relaxed">
                {question.answer_text}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-edge px-5 py-3">
          <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-soft/50">
            Awaiting answer
          </p>
        </div>
      )}
    </div>
  )
}

export function QuestionForm({ briefId, briefSlug }: { briefId: string; briefSlug: string }) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success'
    message: string
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitQuestion(briefId, briefSlug, text)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setText('')
        setFeedback({
          type: 'success',
          message: 'Question submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-3">
      <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft block">
        Ask a question
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Something you're curious about after reading this brief…"
        disabled={isPending}
        className="w-full bg-base border border-edge rounded-xl px-4 py-3 font-serif text-sm text-text placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-live/30 focus:border-live/50 resize-none disabled:opacity-50 transition"
      />
      {feedback && (
        <p
          className={`font-mono text-[10px] tracking-[0.1em] ${
            feedback.type === 'error' ? 'text-red-600' : 'text-green-700'
          }`}
        >
          {feedback.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="font-display uppercase tracking-widest text-xs bg-dark text-base px-6 py-3 hover:bg-text transition-colors disabled:opacity-40"
      >
        {isPending ? 'Submitting…' : 'Submit Question'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Propose correction modal — experts and organisations only
// ---------------------------------------------------------------------------

export function ProposeCorrectionModal({
  briefId,
  briefSlug,
  briefTitle,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCorrectionProposal(briefId, briefSlug, text)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: 'Correction submitted for review. Once approved, it will appear on your profile.',
        })
        setText('')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Propose a correction or addition"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-base rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-edge">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live mb-1">
              Correction proposal
            </p>
            <h2 className="font-display uppercase text-dark text-xl leading-tight">
              Propose a correction or addition
            </h2>
            <p className="font-serif text-xs text-soft mt-1.5 leading-snug">
              For: <em>{briefTitle}</em>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-full bg-edge/50 hover:bg-edge flex items-center justify-center text-soft hover:text-dark transition-all text-lg leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft block mb-2">
              Your correction
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={3000}
              placeholder="Describe what you'd like to correct or add — include any sources or context that would help the admin review your suggestion…"
              disabled={isPending || feedback?.type === 'success'}
              className="w-full bg-card border border-edge rounded-xl px-4 py-3 font-serif text-sm text-text placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-live/30 focus:border-live/50 resize-none disabled:opacity-50 transition"
            />
            <p className="font-mono text-[9px] text-soft/50 mt-1 text-right">
              {text.length} / 3000
            </p>
          </div>

          {feedback && (
            <p
              className={`font-mono text-[10px] tracking-[0.1em] leading-relaxed ${
                feedback.type === 'error' ? 'text-red-600' : 'text-green-700'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            {feedback?.type !== 'success' && (
              <button
                type="submit"
                disabled={isPending || !text.trim()}
                className="font-display uppercase tracking-widest text-xs bg-dark text-base px-6 py-3 hover:bg-text transition-colors disabled:opacity-40"
              >
                {isPending ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors"
            >
              {feedback?.type === 'success' ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

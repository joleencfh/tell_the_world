'use client'

import { useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Field, { Select, Textarea } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import { submitContentiousPoint, submitContentiousPointLike } from '@/lib/briefs/explainer-engagement-actions'
import { getDisplayName } from '../helpers'
import type { ContentiousPoint, ExplainerComment } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import { LikeReplyBar, ReplyArea, ReplyRow } from './shared'

export interface ExplainerSubsectionOption {
  id: string
  title: string
}

// ---------------------------------------------------------------------------
// Flag a contentious point — expert/organisation/admin, pending admin
// approval (same propose-then-pending shape as AddCoverageModal/
// SuggestCtaModal). Optional subsection dropdown, same denormalized-label
// tagging shape as FeedbackModal's own (feedback.tsx).
// ---------------------------------------------------------------------------

export function FlagContentiousPointModal({
  briefId,
  briefSlug,
  briefTitle,
  subsections,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  subsections: ExplainerSubsectionOption[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [subsectionId, setSubsectionId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const bodyId = useId()
  const subsectionFieldId = useId()

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = body.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    const label = subsections.find((s) => s.id === subsectionId)?.title ?? null
    startTransition(async () => {
      const result = await submitContentiousPoint(briefId, briefSlug, body, label)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        bodyRef.current?.focus()
      } else {
        setBody('')
        setFeedback({ type: 'success', message: 'Thanks — submitted for review. It will appear here once approved.' })
      }
    })
  }

  return (
    <Modal open onClose={onClose} size="narrow" eyebrow="Public · visible to every reader" title="Flag a contentious point">
      <p className="font-ui text-ui-sm text-umber-soft">For: {briefTitle}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {subsections.length > 0 && (
          <Field id={subsectionFieldId} label="Which part is this about? (optional)">
            {(p) => (
              <Select {...p} value={subsectionId} onChange={(e) => setSubsectionId(e.target.value)} disabled={isPending || isSubmitted}>
                <option value="">General — about the Explainer as a whole</option>
                {subsections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <Field id={bodyId} label="Your take">
          {(p) => (
            <Textarea
              {...p}
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="What's contentious here, and what's your read on it?"
              disabled={isPending || isSubmitted}
            />
          )}
        </Field>

        {feedback && (
          <Alert tone={feedback.type === 'error' ? 'danger' : 'success'}>{feedback.message}</Alert>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isSubmitted && (
            <Button type="submit" disabled={!canSubmit} pending={isPending} style={{ touchAction: 'manipulation' }}>
              {isPending ? 'Submitting…' : 'Submit for review'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {isSubmitted ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Contentious points panel
// ---------------------------------------------------------------------------

function ContentiousPointRow({
  point,
  briefId,
  briefSlug,
  currentUser,
  replies,
  onReplyPosted,
}: {
  point: ContentiousPoint
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  replies: ExplainerComment[]
  onReplyPosted: (reply: ExplainerComment) => void
}) {
  const name = getDisplayName({ display_name: point.users.display_name })
  const credential = [point.users.job_title, point.users.affiliation || point.users.org_name].filter(Boolean).join(', ')
  const [likeCount, setLikeCount] = useState(point.likeCount)
  const [liked, setLiked] = useState(point.myLike)
  const [likePending, startLikeTransition] = useTransition()
  const [replyOpen, setReplyOpen] = useState(false)

  function handleLike() {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)))
    startLikeTransition(async () => {
      const result = await submitContentiousPointLike(point.id, briefSlug)
      if (result.error) {
        setLiked(!next)
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)))
      }
    })
  }

  return (
    <div className="py-3 first:pt-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-rule">
      <div className="flex gap-2.5">
        <Avatar name={name} avatarUrl={point.users.avatar_url} size="xs" palette="colored" shape={point.users.role === 'organisation' ? 'square' : 'circle'} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/profile/${point.users.id}`} className="focus-ring rounded-control font-ui text-ui-sm font-semibold text-umber transition-colors hover:text-cobalt">
              {name}
            </Link>
            {credential && <span className="font-ui text-caption text-umber-soft">{credential}</span>}
            {point.subsection_label && (
              <span className="rounded-control border border-rule bg-vellum px-1.5 py-0.5 font-ui text-caption text-umber-deep">
                on &ldquo;{point.subsection_label}&rdquo;
              </span>
            )}
          </p>
          <p className="mt-0.5 break-words font-ui text-ui text-umber-body">{point.body}</p>
          <LikeReplyBar
            isLoggedIn={!!currentUser}
            showLike
            likeCount={likeCount}
            myLike={liked}
            onLike={handleLike}
            likePending={likePending}
            replyCount={replies.length}
            onToggleReply={() => setReplyOpen((o) => !o)}
            replyOpen={replyOpen}
          />
          <ReplyArea
            open={replyOpen}
            briefId={briefId}
            briefSlug={briefSlug}
            currentUser={currentUser}
            contentiousPointId={point.id}
            replyToName={name}
            onPosted={(r) => {
              onReplyPosted(r)
              setReplyOpen(false)
            }}
          />
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-[2.65rem] mt-1 border-l border-rule pl-3">
          {replies.map((r) => (
            <ReplyRow
              key={r.id}
              reply={r}
              briefId={briefId}
              briefSlug={briefSlug}
              currentUser={currentUser}
              rootId={point.id}
              rootKind="contentious"
              onReplyPosted={onReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Collapsed to the first point by default (2026-08-27) — a "Show N more"
// reveal, same plain-reveal shape as SourcesGrid's own (sources.tsx), just
// capped at 1 instead of 6 since these read more like individual posts
// than a grid.
export function ContentiousPointsList({
  points,
  briefId,
  briefSlug,
  currentUser,
  repliesByPoint,
  onReplyPosted,
}: {
  points: ContentiousPoint[]
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  repliesByPoint: Map<string, ExplainerComment[]>
  onReplyPosted: (reply: ExplainerComment) => void
}) {
  const [showAll, setShowAll] = useState(false)
  if (points.length === 0) return null

  const visible = showAll ? points : points.slice(0, 1)
  const remaining = points.length - visible.length

  return (
    <div className="rounded-control bg-bone px-4 py-3.5">
      <p className="mb-1 flex items-center gap-1.5 font-mono text-label uppercase text-umber-deep">
        <span aria-hidden>⚡</span> Contested &middot; {points.length} {points.length === 1 ? 'expert' : 'experts'}
      </p>
      {visible.map((p) => (
        <ContentiousPointRow
          key={p.id}
          point={p}
          briefId={briefId}
          briefSlug={briefSlug}
          currentUser={currentUser}
          replies={repliesByPoint.get(p.id) ?? []}
          onReplyPosted={onReplyPosted}
        />
      ))}
      {points.length > 1 && (
        <Button type="button" variant="secondary" small onClick={() => setShowAll((s) => !s)} className="mt-2" style={{ touchAction: 'manipulation' }}>
          {showAll ? 'Show less' : `Show ${remaining} more`}
        </Button>
      )}
    </div>
  )
}

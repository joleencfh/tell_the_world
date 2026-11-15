'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { submitCta } from '@/lib/briefs/actions'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Field, { TextInput, Textarea } from '@/components/ui/Field'
import { Carousel } from '@/components/ui/Carousel'
import { getDisplayName, formatDate } from './helpers'
import type { Cta } from '@/lib/data/ctas'

// ---------------------------------------------------------------------------
// CTA card: 300px, byline row (avatar + name) above the title, footer row
// (date + link) below a hairline divider. Cards sit on vellum with a hairline
// shadow. A null author is a Tell The World editorial CTA and gets its own
// "TTW" byline so every card has one.
//
// The link is a bare arrow; the arrow alone is not an accessible name, so the
// link's name comes from the CTA's own title (the old "button text" field was
// dropped in migration 027).
//
// Every card gets a top reserve (pt-1) and the first card a left reserve
// (first:pl-1): the card is the direct child of the shared Carousel.Track,
// which sets overflow-x:auto, and per the CSS overflow spec that clips
// anything poking past the un-padded edges.
// ---------------------------------------------------------------------------

const EDITORIAL_NAME = 'Tell The World'

function CtaCard({ cta }: { cta: Cta }) {
  const author = cta.users
  const authorName = author ? getDisplayName(author) : EDITORIAL_NAME
  const isOrg = author?.role === 'organisation'

  return (
    <div className="w-[300px] shrink-0 snap-start pt-1 first:pl-1">
      <div className="flex h-full flex-col gap-3 rounded-control bg-vellum p-5 text-umber shadow-hairline transition-shadow duration-150 motion-reduce:transition-none hover:shadow-menu">
        <div className="flex items-center gap-[0.55rem]">
          {author ? (
            <Avatar
              name={authorName}
              avatarUrl={author.avatar_url}
              palette="blue"
              shape={isOrg ? 'square' : 'circle'}
              size="2xs"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-umber text-[0.75rem] font-medium text-parchment"
            >
              TTW
            </div>
          )}
          <span className="truncate font-mono text-label uppercase text-umber-soft">
            {authorName}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="break-words font-serif text-card-title text-umber line-clamp-2">
            {cta.title}
          </h3>
          {cta.description && (
            <p className="break-words font-ui text-ui-sm text-umber-deep line-clamp-4">
              {cta.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
          <span className="truncate font-mono text-label tabular-nums text-umber-soft">{formatDate(cta.created_at)}</span>
          <a
            href={cta.link_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={cta.title}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className="group/link focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-cobalt transition-colors hover:text-cobalt-deep"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className="h-4 w-4 stroke-current stroke-[1.6] transition-all duration-150 motion-reduce:transition-none group-hover/link:translate-x-0.5 group-hover/link:scale-125 group-hover/link:stroke-[2.4]"
            >
              <path d="M4 10h11.5M10.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CTA carousel — explicit empty state rather than an empty carousel shell
// (§1.4): with zero published CTAs there's nothing to scroll through, and
// the fade/prev/next affordances would just be decorative noise.
// ---------------------------------------------------------------------------

// canSuggestCta branches the empty copy (brief-page onboarding pass,
// 2026-08-28): only expert/organisation/admin can suggest a CTA, so
// everyone else gets an explanation of what this section is for instead of
// a bare "yet" that doesn't say what's coming or why it's blank.
export function CtaCarousel({ ctas, canSuggestCta }: { ctas: Cta[]; canSuggestCta: boolean }) {
  if (ctas.length === 0) {
    return (
      <p className="font-ui text-ui-sm text-umber-soft">
        {canSuggestCta
          ? 'No calls to action yet. Suggest one: sign a petition, contact someone, share a resource.'
          : 'No calls to action yet.'}
      </p>
    )
  }

  return (
    <Carousel.Provider>
      <Carousel.PrevButton />
      <Carousel.NextButton />
      <Carousel.Track fadeColor="var(--color-parchment)" ariaLabel="Calls to action">
        {ctas.map((cta) => (
          <CtaCard key={cta.id} cta={cta} />
        ))}
      </Carousel.Track>
    </Carousel.Provider>
  )
}

// ---------------------------------------------------------------------------
// Suggest a call to action — expert/organisation self-service, propose-
// then-pending pattern (modal form, then a pending row). Also reachable by
// admin (BriefView gates the trigger button on canContribute ||
// role==='admin') as a preview/convenience path — submitCta in
// lib/briefs/actions.ts routes an admin submission through a different,
// immediate-publish branch; the form just reflects back whichever feedback
// message the action returns.
// ---------------------------------------------------------------------------

export function SuggestCtaModal({
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descId = useId()
  const linkUrlId = useId()

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = title.trim() && linkUrl.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCta(briefId, briefSlug, title, description, linkUrl)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        titleRef.current?.focus()
      } else {
        setTitle('')
        setDescription('')
        setLinkUrl('')
        setFeedback({
          type: 'success',
          message: result.published
            ? 'Call to action published.'
            : 'Call to action submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <Modal open onClose={onClose} size="narrow" eyebrow="Call to action" title="Suggest a call to action">
      <p className="font-ui text-ui-sm text-umber-soft">For: {briefTitle}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field id={titleId} label="Title">
          {(p) => (
            <TextInput
              {...p}
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="E.g.: Sign our petition"
              disabled={isPending || isSubmitted}
            />
          )}
        </Field>

        <Field id={descId} label="Description (optional)">
          {(p) => (
            <Textarea
              {...p}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="What should readers expect if they click through?"
              disabled={isPending || isSubmitted}
            />
          )}
        </Field>

        <Field id={linkUrlId} label="Link URL">
          {(p) => (
            <TextInput
              {...p}
              type="url"
              inputMode="url"
              autoComplete="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
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

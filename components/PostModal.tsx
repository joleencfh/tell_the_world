'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPost, updatePost, deletePost } from '@/lib/posts/actions'
import type { PostType } from '@/lib/posts/actions'
import { useClarityGate } from '@/lib/clarity/useClarityGate'
import { ClarityFlagsPanel } from '@/components/ClarityFlagsPanel'
import type { UserRole } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import ChoiceChips from '@/components/ui/ChoiceChips'
import Field, { TextInput, Textarea } from '@/components/ui/Field'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostData {
  id: string
  post_type: string
  title: string
  body: string | null
  url: string | null
  topic_tags: string[]
}

interface PostModalProps {
  currentUserId: string
  /** Gates the clarity-check fix-it loop — only expert/organisation, and only in create mode (see useClarityGate wiring below). */
  currentUserRole?: UserRole
  /** Pass an existing post to open in edit mode; omit or null for create mode */
  existingPost?: PostData | null
  onClose: () => void
  /** Called after a successful create, update, or delete */
  onSuccess: () => void
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'paper', label: 'Paper' },
  { value: 'quote', label: 'Quote' },
  { value: 'resource', label: 'Resource' },
]

// ---------------------------------------------------------------------------
// Tag input (for topic_tags)
// ---------------------------------------------------------------------------

function TagInput({
  tags,
  onChange,
  ...fieldProps
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  id?: string
  'aria-describedby'?: string
}) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-control border border-field-line bg-white px-3 py-1.5 focus-within:border-umber focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-umber">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-tag border border-window-line px-2 py-0.5 font-mono text-label uppercase text-umber-soft"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="-my-3 -mr-3 grid size-11 place-items-center rounded-control text-umber-soft hover:text-umber focus-ring"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        {...fieldProps}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) addTag(draft)
        }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
        className="min-h-9 min-w-[120px] flex-1 bg-transparent font-ui text-base text-umber outline-none placeholder:text-umber-soft"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export default function PostModal({
  currentUserId,
  currentUserRole,
  existingPost,
  onClose,
  onSuccess,
}: PostModalProps) {
  const isEditMode = !!existingPost
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [postType, setPostType] = useState<PostType>(
    (existingPost?.post_type as PostType) ?? 'article',
  )
  const [title, setTitle] = useState(existingPost?.title ?? '')
  const [body, setBody] = useState(existingPost?.body ?? '')
  const [url, setUrl] = useState(existingPost?.url ?? '')
  const [topicTags, setTopicTags] = useState<string[]>(existingPost?.topic_tags ?? [])

  // Clarity check only applies to new expert/org submissions (createPost) —
  // updatePost isn't checked (see lib/posts/actions.ts), so the gate stays
  // off in edit mode. Server-side re-checks independently either way.
  const isGated = !isEditMode && (currentUserRole === 'expert' || currentUserRole === 'organisation')
  const clarityGate = useClarityGate(`${title}\n\n${body}`, isGated)
  const needsFlagReview = isGated && clarityGate.status === 'flagged' && !clarityGate.confirmedAnyway

  // Escape: the shared Modal closes the dialog on Escape while the main form
  // shows. During the delete confirm the Modal is not dismissible, so the first
  // Escape only cancels the confirm (as before) and the next one closes.
  useEffect(() => {
    if (!confirmDelete) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmDelete(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmDelete])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // First submit attempt while flagged: show the flags instead of
    // publishing/queuing anything yet. A second click (button now reads
    // "Submit anyway") re-enters here with confirmedAnyway already true.
    if (needsFlagReview) {
      clarityGate.confirmAnyway()
      return
    }

    startTransition(async () => {
      const payload = {
        post_type: postType,
        title,
        body: body.trim() || null,
        url: url.trim() || null,
        topic_tags: topicTags,
      }

      const result = isEditMode
        ? await updatePost(existingPost!.id, payload)
        : await createPost(payload)

      if (result.error) {
        setError(result.error)
        return
      }

      onSuccess()
      onClose()
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deletePost(existingPost!.id)
      if (result.error) {
        setError(result.error)
        setConfirmDelete(false)
        return
      }
      onSuccess()
      onClose()
    })
  }

  // Callers render this conditionally, so it is always open while mounted.
  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!confirmDelete}
      eyebrow={isEditMode ? 'Edit post' : 'New post'}
      title={isEditMode ? 'Edit your post' : 'Share something'}
      focusKey={confirmDelete ? 'confirm' : 'form'}
    >
      {confirmDelete ? (
        <div className="pt-2">
          <p className="mb-2 font-ui text-ui font-medium text-umber">Delete this post?</p>
          <p className="mb-6 font-ui text-ui-sm text-umber-soft">
            This cannot be undone. The post will be permanently removed.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} pending={isPending}>
              {isPending ? 'Deleting…' : 'Delete post'}
            </Button>
          </div>
          {error && (
            <Alert tone="danger" className="mt-4">
              {error}
            </Alert>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-4 space-y-5" noValidate>
          <ChoiceChips
            label="Post type"
            options={POST_TYPES}
            value={postType}
            onChange={setPostType}
            disabled={isPending}
            className="grid-cols-2 sm:grid-cols-5"
          />

          <Field label="Title">
            {(p) => (
              <TextInput
                {...p}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={postType === 'quote' ? 'The quote itself' : 'Title of your post'}
                required
                disabled={isPending}
              />
            )}
          </Field>

          <Field label={postType === 'quote' ? 'Body (attribution or context)' : 'Body (optional)'}>
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  postType === 'quote'
                    ? 'Attribution, context, or a note…'
                    : 'A short description or excerpt…'
                }
                disabled={isPending}
              />
            )}
          </Field>

          <Field label="URL (optional)">
            {(p) => (
              <TextInput
                {...p}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                disabled={isPending}
              />
            )}
          </Field>

          <Field label="Topic tags" hint="Press Enter or comma to add a tag">
            {(p) => <TagInput {...p} tags={topicTags} onChange={setTopicTags} />}
          </Field>

          {isGated && <ClarityFlagsPanel flaggedTerms={clarityGate.flaggedTerms} />}

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex items-center justify-between gap-3 pt-1">
            {isEditMode ? (
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={isPending}>
                Delete post
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" pending={isPending} disabled={!title.trim()}>
                {isPending
                  ? isEditMode
                    ? 'Saving…'
                    : clarityGate.confirmedAnyway
                      ? 'Submitting…'
                      : 'Publishing…'
                  : isEditMode
                    ? 'Save changes'
                    : needsFlagReview
                      ? 'Review flags'
                      : isGated && clarityGate.status === 'flagged'
                        ? 'Submit anyway'
                        : 'Publish post'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}

'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPost, updatePost, deletePost } from '@/lib/posts/actions'
import type { PostType } from '@/lib/posts/actions'

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
  /** Pass an existing post to open in edit mode; omit or null for create mode */
  existingPost?: PostData | null
  onClose: () => void
  /** Called after a successful create, update, or delete */
  onSuccess: () => void
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'

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

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
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
    <div className="border border-gray-300 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-blue-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-gray-400 hover:text-gray-700 leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) addTag(draft)
        }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
        className="text-sm outline-none flex-1 min-w-[120px] bg-transparent"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export default function PostModal({
  currentUserId,
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

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmDelete) {
          setConfirmDelete(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, confirmDelete])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !confirmDelete) onClose()
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-gray-400 mb-0.5">
              {isEditMode ? 'Edit post' : 'New post'}
            </p>
            <h2 className="text-sm font-semibold text-gray-900">
              {isEditMode ? 'Edit your post' : 'Share something'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Delete confirmation */}
        {confirmDelete ? (
          <div className="px-6 py-8 text-center">
            <p className="text-base font-semibold text-gray-900 mb-2">Delete this post?</p>
            <p className="text-sm text-gray-500 mb-6">
              This cannot be undone. The post will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Deleting…' : 'Delete post'}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-4">{error}</p>
            )}
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSave} className="px-6 py-6 space-y-5" noValidate>

            {/* Post type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Post type</label>
              <div className="flex flex-wrap gap-2">
                {POST_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPostType(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      postType === value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={postType === 'quote' ? 'The quote itself' : 'Title of your post'}
                className={inputCls}
                required
                disabled={isPending}
              />
            </div>

            {/* Body — optional */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Body{' '}
                <span className="text-gray-400 font-normal">
                  {postType === 'quote' ? '(attribution or context)' : '(optional)'}
                </span>
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  postType === 'quote'
                    ? 'Attribution, context, or a note…'
                    : 'A short description or excerpt…'
                }
                className={inputCls}
                disabled={isPending}
              />
            </div>

            {/* URL — optional */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                className={inputCls}
                disabled={isPending}
              />
            </div>

            {/* Topic tags */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Topic tags</label>
              <TagInput tags={topicTags} onChange={setTopicTags} />
              <p className="text-xs text-gray-400">Press Enter or comma to add a tag</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-2 bg-red-50">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {isEditMode ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors"
                  disabled={isPending}
                >
                  Delete post
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !title.trim()}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPending
                    ? isEditMode
                      ? 'Saving…'
                      : 'Publishing…'
                    : isEditMode
                      ? 'Save changes'
                      : 'Publish post'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useTransition } from 'react'
import { proposeBrief } from '@/lib/briefs/actions'

interface ProposeBriefModalProps {
  /** Display name of the logged-in user (pre-filled, not editable) */
  submitterName: string
  /** Email of the logged-in user (pre-filled, not editable) */
  submitterEmail: string
  /** Optional: title of the brief page where this was triggered, sent as context */
  fromBriefTitle?: string | null
  onClose: () => void
}

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function ProposeBriefModal({
  submitterName,
  submitterEmail,
  fromBriefTitle,
  onClose,
}: ProposeBriefModalProps) {
  const [isPending, startTransition] = useTransition()
  const [topicTitle, setTopicTitle] = useState('')
  const [whyItMatters, setWhyItMatters] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await proposeBrief(topicTitle, whyItMatters, fromBriefTitle)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-gray-400 mb-0.5">
              Tell The World
            </p>
            <h2 className="text-sm font-semibold text-gray-900">Propose a new brief</h2>
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

        {success ? (
          /* Success state */
          <div className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-600">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-2">Proposal sent</p>
            <p className="text-sm text-gray-500 mb-6">
              Your proposal has been sent to the admin for review. We&apos;ll be in touch if we decide to publish a brief on this topic.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-500 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5" noValidate>

            <p className="text-sm text-gray-500 leading-relaxed">
              Proposals are reviewed by the admin. We consider topics based on relevance, timeliness,
              and the strength of the case for why creators need this brief.
            </p>

            {/* Topic title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Proposed topic title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. AI governance frameworks in the EU"
                className={inputCls}
                required
                disabled={isPending}
              />
            </div>

            {/* Why it matters */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Why this topic matters and what it should cover <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={whyItMatters}
                onChange={(e) => setWhyItMatters(e.target.value)}
                placeholder="Explain why creators need this brief — what's the angle, what's happening now, and what would be most useful to cover…"
                className={inputCls}
                required
                disabled={isPending}
              />
            </div>

            {/* Pre-filled submitter info */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2 border border-gray-100">
              <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-gray-400">
                Submitting as
              </p>
              <p className="text-sm text-gray-700">{submitterName}</p>
              <p className="text-xs text-gray-400">{submitterEmail}</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-2 bg-red-50">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
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
                disabled={isPending || !topicTitle.trim() || !whyItMatters.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Sending…' : 'Send proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

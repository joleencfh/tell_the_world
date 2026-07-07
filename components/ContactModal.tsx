'use client'

import { useEffect, useState, useTransition } from 'react'
import { sendMessage } from '@/lib/messages/actions'
import type { UserRole } from '@/lib/types'

interface ContactModalProps {
  recipient: {
    id: string
    display_name: string | null
    email: string
    role: UserRole
  }
  sender: {
    display_name: string | null
    role: UserRole
  }
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'

function RoleBadge({ role }: { role: UserRole }) {
  const cls: Record<UserRole, string> = {
    creator: 'bg-blue-100 text-blue-700',
    journalist: 'bg-purple-100 text-purple-700',
    expert: 'bg-green-100 text-green-700',
    organisation: 'bg-amber-100 text-amber-700',
    admin: 'bg-red-100 text-red-700',
  }
  const label: Record<UserRole, string> = {
    creator: 'Creator',
    journalist: 'Journalist',
    expert: 'Expert',
    organisation: 'Organisation',
    admin: 'Admin',
  }
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[9px] tracking-[0.12em] uppercase ${cls[role]}`}
    >
      {label[role]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export default function ContactModal({ recipient, sender, onClose }: ContactModalProps) {
  const [isPending, startTransition] = useTransition()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const recipientName = recipient.display_name || recipient.email.split('@')[0]
  const senderName = sender.display_name || 'You'

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
      const result = await sendMessage({
        recipient_id: recipient.id,
        subject: subject.trim(),
        body: body.trim(),
      })

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
      <div role="dialog" aria-modal="true" className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">

        {/* Header — recipient info */}
        <div className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-gray-400 mb-1">
                Contact
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-gray-900">{recipientName}</h2>
                <RoleBadge role={recipient.role} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl leading-none shrink-0 mt-0.5"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {success ? (
          /* Success state */
          <div className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-600">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-2">Message sent</p>
            <p className="text-sm text-gray-500 mb-6">
              {recipientName} has been notified by email. It&apos;s now up to them whether to respond.
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

            {/* Subject */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                className={inputCls}
                required
                disabled={isPending}
              />
            </div>

            {/* Message body */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Introduce yourself and explain what you're hoping to collaborate on…"
                className={inputCls}
                required
                disabled={isPending}
              />
            </div>

            {/* Pre-filled sender info */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5 border border-gray-100">
              <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-gray-400">
                Sending as
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{senderName}</span>
                <RoleBadge role={sender.role} />
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {recipientName} will be notified by email. This is a one-way contact request — replies happen outside the platform for now.
            </p>

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
                disabled={isPending || !subject.trim() || !body.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { proposeBrief } from '@/lib/briefs/actions'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Field, { TextInput, Textarea } from '@/components/ui/Field'

interface ProposeBriefModalProps {
  /** Display name of the logged-in user (pre-filled, not editable) */
  submitterName: string
  /** Email of the logged-in user (pre-filled, not editable) */
  submitterEmail: string
  /** Optional: title of the brief page where this was triggered, sent as context */
  fromBriefTitle?: string | null
  onClose: () => void
}

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

  // Callers render this conditionally, so it is always open while mounted.
  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Tell The World"
      title="Propose a new brief"
      focusKey={success ? 'sent' : 'form'}
    >
      {success ? (
        <div className="pt-2">
          <Alert tone="success" lead="Proposal sent">
            Your proposal has been sent to the admin for review. We&apos;ll be in touch if we decide to publish a brief on this topic.
          </Alert>
          <div className="mt-6 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
          <p className="font-ui text-ui-sm text-umber-soft">
            Proposals are reviewed by the admin. We consider topics based on relevance, timeliness,
            and the strength of the case for why creators need this brief.
          </p>

          <Field label="Proposed topic title">
            {(p) => (
              <TextInput
                {...p}
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. AI governance frameworks in the EU"
                required
                disabled={isPending}
              />
            )}
          </Field>

          <Field label="Why this topic matters and what it should cover">
            {(p) => (
              <Textarea
                {...p}
                rows={5}
                value={whyItMatters}
                onChange={(e) => setWhyItMatters(e.target.value)}
                placeholder="Explain why creators need this brief — what's the angle, what's happening now, and what would be most useful to cover…"
                required
                disabled={isPending}
              />
            )}
          </Field>

          {/* Pre-filled submitter info */}
          <div className="space-y-1.5 rounded-control border border-window-line bg-bone px-4 py-3">
            <p className="font-mono text-label uppercase text-umber-soft">Submitting as</p>
            <p className="font-ui text-ui-sm text-umber">{submitterName}</p>
            <p className="font-ui text-caption text-umber-soft">{submitterEmail}</p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              pending={isPending}
              disabled={!topicTitle.trim() || !whyItMatters.trim()}
            >
              {isPending ? 'Sending…' : 'Send proposal'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

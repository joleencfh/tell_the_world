'use client'

import { useState, useTransition } from 'react'
import { sendMessage } from '@/lib/messages/actions'
import type { UserRole } from '@/lib/types'
import RoleBadge from '@/components/ui/RoleBadge'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Field, { TextInput, Textarea } from '@/components/ui/Field'

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

  // Callers render this conditionally, so it is always open while mounted.
  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Contact"
      title={
        <span className="flex flex-wrap items-center gap-3">
          <span>{recipientName}</span>
          <RoleBadge role={recipient.role} />
        </span>
      }
      focusKey={success ? 'sent' : 'form'}
    >
      {success ? (
        <div className="pt-2">
          <Alert tone="success" lead="Message sent">
            {recipientName} has been notified by email. It&apos;s now up to them whether to respond.
          </Alert>
          <div className="mt-6 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
          <Field label="Subject">
            {(p) => (
              <TextInput
                {...p}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                required
                disabled={isPending}
              />
            )}
          </Field>

          <Field label="Message">
            {(p) => (
              <Textarea
                {...p}
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Introduce yourself and explain what you're hoping to collaborate on…"
                required
                disabled={isPending}
              />
            )}
          </Field>

          {/* Pre-filled sender info */}
          <div className="space-y-1.5 rounded-control border border-window-line bg-bone px-4 py-3">
            <p className="font-mono text-label uppercase text-umber-soft">Sending as</p>
            <div className="flex items-center gap-2">
              <span className="font-ui text-ui-sm text-umber">{senderName}</span>
              <RoleBadge role={sender.role} />
            </div>
          </div>

          <p className="font-ui text-caption text-umber-soft">
            {recipientName} will be notified by email. This is a one-way contact request — replies happen outside the platform for now.
          </p>

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" pending={isPending} disabled={!subject.trim() || !body.trim()}>
              {isPending ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

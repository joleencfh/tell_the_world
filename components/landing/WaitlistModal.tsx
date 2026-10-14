'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { submitWaitlistSignup } from '@/lib/waitlist/actions'
import CirclePair from '@/components/landing/CirclePair'
import Alert from '@/components/ui/Alert'
import Button, { type ButtonVariant } from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import ChoiceChips, { type ChoiceOption } from '@/components/ui/ChoiceChips'
import Field, { TextInput, Textarea } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import type { UserRole } from '@/lib/types'

// The landing page's waitlist form, built from the shared design-system
// primitives (Modal, Field set, ChoiceChips, Button, Alert).
//
// Behavioural shape is unchanged: mode 'waitlist' goes straight to the form,
// 'early-tester' shows a short intro step first (with a real checkbox,
// defaulted on) before the same shared form. Same fields, same table, one
// submission either way; wants_early_access (040) is the one difference.
//
// Dialog behaviour (labelled, focus on the heading on open and on each step,
// Tab trapped, Escape and scrim close, page behind inert, focus returned to
// the trigger) lives in the shared Modal. The role picker is a radio group
// with arrow-key movement; selection shows as a dot and a heavier border as
// well as a tint, never colour alone.

interface WaitlistModalProps {
  mode: 'waitlist' | 'early-tester'
  onClose: () => void
  /** Pre-selects a role in the form step. */
  defaultRole?: UserRole
}

// 'admin' is a real UserRole but never a waitlist choice.
type PublicRole = Exclude<UserRole, 'admin'>

const ROLE_OPTIONS: ChoiceOption<PublicRole>[] = [
  { value: 'creator', label: 'Creator', tone: 'rose' },
  { value: 'journalist', label: 'Journalist', tone: 'rose' },
  { value: 'expert', label: 'Researcher/Expert', tone: 'cobalt' },
  { value: 'organisation', label: 'Organisation', tone: 'cobalt' },
  { value: 'comms_specialist', label: 'Communications Specialist', tone: 'neutral' },
  { value: 'other', label: 'Other', tone: 'neutral' },
]

// The submit button takes the audience colour of the chosen role.
const SUBMIT_VARIANT: Record<PublicRole, ButtonVariant> = {
  creator: 'rose',
  journalist: 'rose',
  expert: 'cobalt',
  organisation: 'cobalt',
  comms_specialist: 'primary',
  other: 'primary',
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export default function WaitlistModal({ mode, onClose, defaultRole }: WaitlistModalProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState<'intro' | 'form'>(mode === 'early-tester' ? 'intro' : 'form')
  const [wantsEarlyAccess, setWantsEarlyAccess] = useState(mode === 'early-tester')
  const [role, setRole] = useState<PublicRole>((defaultRole as PublicRole | undefined) ?? 'creator')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [affiliation, setAffiliation] = useState('')
  const [link, setLink] = useState('')
  const [more, setMore] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isCreator = role === 'creator'
  const stage = success ? 'success' : step

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await submitWaitlistSignup({
        role,
        full_name: fullName.trim(),
        email: email.trim(),
        affiliation: affiliation.trim(),
        linkedin_or_website_url: link.trim(),
        additional_info: more.trim(),
        wants_early_access: wantsEarlyAccess,
        honeypot,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
    })
  }

  const eyebrow =
    stage === 'success' ? (
      <CirclePair className="mb-3 h-auto w-[72px]" />
    ) : stage === 'intro' ? (
      'Become an early tester'
    ) : wantsEarlyAccess ? (
      'Become an early tester'
    ) : (
      'Join the waitlist'
    )

  const title =
    stage === 'success' ? 'You’re on the list' : stage === 'intro' ? 'Before you sign up' : 'Tell us who you are'

  return (
    <Modal open={open} onClose={() => setOpen(false)} onExited={onClose} title={title} eyebrow={eyebrow} focusKey={stage}>
      {stage === 'success' && (
        <div className="anim-step-in">
          <p className="font-ui text-ui text-umber-soft">
            {wantsEarlyAccess
              ? "We’ll email you if we’re ready for early testers."
              : "We’ll email you when there’s something to see."}
          </p>
          <Button fullWidth className="mt-6" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      )}

      {stage === 'intro' && (
        <div className="anim-step-in">
          <p className="mb-5 font-ui text-ui text-umber-soft">
            We&rsquo;ll reach out soon to a handful of early testers. Thank you for wanting to help us shape it while
            it&rsquo;s still rough around the edges.
          </p>

          <Checkbox
            className="mb-6"
            checked={wantsEarlyAccess}
            onChange={(e) => setWantsEarlyAccess(e.target.checked)}
            label="Yes, I’d like to be considered as an early tester."
          />

          <Button fullWidth onClick={() => setStep('form')}>
            Next
          </Button>
        </div>
      )}

      {stage === 'form' && (
        <div className="anim-step-in">
          <p className="mb-2 font-ui text-ui text-umber-soft">
            {wantsEarlyAccess
              ? "We’ll reach out by email if we’re ready for early testers."
              : "We’ll reach out when Tell The World opens."}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
            {/* Honeypot: hidden from real users via CSS, bots fill it anyway */}
            <div className="hidden" aria-hidden="true">
              <label>
                Leave this field empty
                <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>

            <ChoiceChips label="I am a" options={ROLE_OPTIONS} value={role} onChange={setRole} disabled={isPending} />

            <Field label="Full name">
              {(p) => (
                <TextInput
                  {...p}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Reyes"
                  required
                  disabled={isPending}
                />
              )}
            </Field>

            <Field label="Email" error={emailError ? 'Enter an email address like you@example.com.' : undefined}>
              {(p) => (
                <TextInput
                  {...p}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError && EMAIL_PATTERN.test(e.target.value.trim())) setEmailError(false)
                  }}
                  onBlur={() => setEmailError(email.trim() !== '' && !EMAIL_PATTERN.test(email.trim()))}
                  placeholder="you@example.com"
                  required
                  disabled={isPending}
                />
              )}
            </Field>

            <Field label={isCreator ? 'Platform & channel name' : 'Affiliation'}>
              {(p) => (
                <TextInput
                  {...p}
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder={isCreator ? 'e.g. YouTube, Jordan’s AI Corner' : 'Where you work, publish, or post'}
                  required={isCreator}
                  disabled={isPending}
                />
              )}
            </Field>

            <Field label={isCreator ? 'Channel link' : 'LinkedIn or personal site'}>
              {(p) => (
                <TextInput
                  {...p}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={isCreator ? 'youtube.com/@…' : 'linkedin.com/in/…'}
                  required={isCreator}
                  disabled={isPending}
                />
              )}
            </Field>

            <Field label="Anything else?" optional>
              {(p) => (
                <Textarea
                  {...p}
                  value={more}
                  onChange={(e) => setMore(e.target.value)}
                  placeholder="Optional"
                  rows={3}
                  disabled={isPending}
                />
              )}
            </Field>

            {error && <Alert tone="danger">{error}</Alert>}

            <Button
              type="submit"
              variant={SUBMIT_VARIANT[role]}
              fullWidth
              className="mt-1"
              pending={isPending}
              disabled={
                !fullName.trim() || !email.trim() || (isCreator && (!affiliation.trim() || !link.trim()))
              }
            >
              {isPending ? 'Joining…' : wantsEarlyAccess ? 'Become an early tester' : 'Join the waitlist'}
            </Button>
            <p className="font-ui text-ui-sm text-umber-soft">
              We use your details only to contact you about Tell The World. See our{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-umber">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>
      )}
    </Modal>
  )
}

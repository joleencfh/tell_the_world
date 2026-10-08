'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { submitWaitlistSignup } from '@/lib/waitlist/actions'
import CirclePair from '@/components/landing/CirclePair'
import type { UserRole } from '@/lib/types'

// The landing page's waitlist form, in the new design system
// (docs/design/landing-page/current/design-system.md, Modal / Form field / Role chip).
//
// Behavioural shape is unchanged: mode 'waitlist' goes straight to the form,
// 'early-tester' shows a short intro step first (with a real checkbox,
// defaulted on) before the same shared form. Same fields, same table, one
// submission either way; wants_early_access (040) is the one difference.
//
// Dialog behaviour (audit P1): labelled by its heading, focus moves to the
// heading on open and on each step change, Tab is trapped inside, Escape and
// a click on the scrim close it, and WaitlistProvider returns focus to the
// trigger and keeps the page behind inert. The role picker is a radio group
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

const ROLE_OPTIONS: { value: PublicRole; label: string }[] = [
  { value: 'creator', label: 'Creator' },
  { value: 'journalist', label: 'Journalist' },
  { value: 'expert', label: 'Researcher/Expert' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'comms_specialist', label: 'Communications Specialist' },
  { value: 'other', label: 'Other' },
]

// Selected-chip tint by side of the audience pair (design-system.md).
const CHIP_SELECTED: Record<PublicRole, string> = {
  creator: 'bg-rose-wash',
  journalist: 'bg-rose-wash',
  expert: 'bg-cobalt-wash',
  organisation: 'bg-cobalt-wash',
  comms_specialist: 'bg-bone',
  other: 'bg-bone',
}

const SUBMIT_VARIANT: Record<PublicRole, string> = {
  creator: 'bg-rose text-white',
  journalist: 'bg-rose text-white',
  expert: 'bg-cobalt text-white',
  organisation: 'bg-cobalt text-white',
  comms_specialist: 'bg-umber text-parchment',
  other: 'bg-umber text-parchment',
}

const fieldCls =
  'w-full min-h-11 rounded-control border border-field-line bg-white px-3 py-2.5 font-ui text-base text-umber placeholder:text-umber-soft focus-visible:border-umber focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-umber disabled:border-disabled disabled:bg-disabled disabled:text-umber-soft aria-[invalid=true]:border-2 aria-[invalid=true]:border-rose-deep aria-[invalid=true]:px-[11px] aria-[invalid=true]:py-[9px]'

const labelCls = 'mb-1.5 mt-4 block font-ui text-ui-sm font-medium text-umber'

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

// Matches .anim-modal-panel-out's duration in app/globals.css.
const CLOSE_ANIMATION_MS = 180

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled):not([type=hidden]), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

function ErrorLine({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 font-ui text-ui-sm text-rose-deep">
      <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-rose-deep text-label font-semibold text-white">
        !
      </span>
      <span>{children}</span>
    </p>
  )
}

export default function WaitlistModal({ mode, onClose, defaultRole }: WaitlistModalProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'intro' | 'form'>(mode === 'early-tester' ? 'intro' : 'form')
  const [closing, setClosing] = useState(false)
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

  const panelRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()
  const headingId = `${uid}-heading`
  const roleLabelId = `${uid}-role`
  const emailErrId = `${uid}-email-err`

  const isCreator = role === 'creator'
  const stage = success ? 'success' : step

  function handleClose() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
    setTimeout(onClose, CLOSE_ANIMATION_MS)
  }

  // Escape closes; Tab is kept inside the panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === headingRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus the heading on open and whenever the step changes.
  useEffect(() => {
    headingRef.current?.focus()
  }, [stage])

  function pickRole(index: number) {
    const next = ROLE_OPTIONS[(index + ROLE_OPTIONS.length) % ROLE_OPTIONS.length]
    setRole(next.value)
    radioRefs.current[ROLE_OPTIONS.indexOf(next)]?.focus()
  }

  function onRadioKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      pickRole(index + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      pickRole(index - 1)
    }
  }

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

  const headingCls = 'm-0 mb-2.5 mt-2.5 font-serif text-[1.875rem] font-normal leading-[1.05] tracking-[-0.02em] text-umber outline-none'
  const eyebrowCls = 'font-mono text-label uppercase text-umber-soft'
  const primaryBtn =
    'inline-flex min-h-11 w-full items-center justify-center rounded-control border-2 border-transparent px-[22px] font-ui text-ui font-medium leading-none transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber disabled:cursor-not-allowed disabled:bg-disabled disabled:text-umber-soft'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-scrim md:items-center md:p-8 ${closing ? 'anim-modal-backdrop-out' : 'anim-modal-backdrop-in'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`relative max-h-dvh w-full max-w-[520px] overflow-y-auto rounded-control bg-vellum px-5 pb-7 pt-6 text-umber shadow-modal max-md:rounded-b-none md:px-8 md:py-8 ${closing ? 'anim-modal-panel-out' : 'anim-modal-panel-in'}`}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-control text-umber transition-colors hover:bg-bone focus-visible:outline-2 focus-visible:outline-umber"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {success ? (
          <div key="success" className="anim-step-in pr-8">
            <CirclePair className="mb-3 h-auto w-[72px]" />
            <h3 id={headingId} ref={headingRef} tabIndex={-1} className={headingCls}>
              You&rsquo;re on the list
            </h3>
            <p className="font-ui text-ui text-umber-soft">
              {wantsEarlyAccess
                ? "We'll email you if we're ready for early testers."
                : "We'll email you when there's something to see."}
            </p>
            <button type="button" onClick={handleClose} className={`${primaryBtn} mt-6 bg-umber text-parchment hover:bg-umber-hover`}>
              Close
            </button>
          </div>
        ) : step === 'intro' ? (
          <div key="intro" className="anim-step-in pr-8">
            <span className={eyebrowCls}>Become an early tester</span>
            <h3 id={headingId} ref={headingRef} tabIndex={-1} className={headingCls}>
              Before you sign up
            </h3>
            <p className="mb-5 font-ui text-ui text-umber-soft">
              We&rsquo;ll reach out soon to a handful of early testers. Thank you for wanting to help us shape it
              while it&rsquo;s still rough around the edges.
            </p>

            <label className="mb-6 flex min-h-11 cursor-pointer items-start gap-3 font-ui text-ui text-umber">
              <input
                type="checkbox"
                checked={wantsEarlyAccess}
                onChange={(e) => setWantsEarlyAccess(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="mt-px grid size-6 shrink-0 place-items-center rounded-tag border-2 border-umber bg-white text-[15px] font-semibold text-umber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-umber [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10.5L8 14.5L16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="pt-0.5 leading-snug">Yes, I&rsquo;d like to be considered as an early tester.</span>
            </label>

            <button type="button" onClick={() => setStep('form')} className={`${primaryBtn} bg-umber text-parchment hover:bg-umber-hover`}>
              Next
            </button>
          </div>
        ) : (
          <div key="form" className="anim-step-in">
            <span className={eyebrowCls}>{wantsEarlyAccess ? 'Become an early tester' : 'Join the waitlist'}</span>
            <h3 id={headingId} ref={headingRef} tabIndex={-1} className={`${headingCls} pr-8`}>
              Tell us who you are
            </h3>
            <p className="mb-2 font-ui text-ui text-umber-soft">
              {wantsEarlyAccess
                ? "We'll reach out by email if we're ready for early testers."
                : "We'll reach out when Tell The World opens."}
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot: hidden from real users via CSS, bots fill it anyway */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Leave this field empty
                  <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
              </div>

              <span id={roleLabelId} className={labelCls}>
                I am a
              </span>
              <div role="radiogroup" aria-labelledby={roleLabelId} className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {ROLE_OPTIONS.map((opt, i) => {
                  const selected = role === opt.value
                  return (
                    <button
                      key={opt.value}
                      ref={(el) => {
                        radioRefs.current[i] = el
                      }}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      disabled={isPending}
                      onClick={() => setRole(opt.value)}
                      onKeyDown={(e) => onRadioKeyDown(e, i)}
                      className={[
                        'flex min-h-11 items-center justify-center gap-1.5 rounded-control px-2.5 py-2 text-center font-ui text-sm font-medium leading-tight text-umber transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber',
                        selected
                          ? `border-2 border-umber px-[9px] py-[7px] before:size-3 before:shrink-0 before:rounded-full before:border before:border-umber before:bg-umber before:shadow-[inset_0_0_0_3px_var(--color-vellum)] before:content-[''] ${CHIP_SELECTED[opt.value]}`
                          : 'border border-field-line hover:bg-bone',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              <label className={labelCls} htmlFor="wl-name">
                Full name
              </label>
              <input
                id="wl-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Reyes"
                className={fieldCls}
                required
                disabled={isPending}
              />

              <label className={labelCls} htmlFor="wl-email">
                Email
              </label>
              <input
                id="wl-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError && EMAIL_PATTERN.test(e.target.value.trim())) setEmailError(false)
                }}
                onBlur={() => setEmailError(email.trim() !== '' && !EMAIL_PATTERN.test(email.trim()))}
                placeholder="you@example.com"
                className={fieldCls}
                required
                disabled={isPending}
                aria-invalid={emailError}
                aria-describedby={emailError ? emailErrId : undefined}
              />
              {emailError && <ErrorLine id={emailErrId}>Enter an email address like you@example.com.</ErrorLine>}

              <label className={labelCls} htmlFor="wl-affiliation">
                {isCreator ? 'Platform & channel name' : 'Affiliation'}
              </label>
              <input
                id="wl-affiliation"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder={isCreator ? 'e.g. YouTube, Jordan’s AI Corner' : 'Where you work, publish, or post'}
                className={fieldCls}
                required={isCreator}
                disabled={isPending}
              />

              <label className={labelCls} htmlFor="wl-link">
                {isCreator ? 'Channel link' : 'LinkedIn or personal site'}
              </label>
              <input
                id="wl-link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={isCreator ? 'youtube.com/@…' : 'linkedin.com/in/…'}
                className={fieldCls}
                required={isCreator}
                disabled={isPending}
              />

              <label className={labelCls} htmlFor="wl-more">
                Anything else? <span className="font-normal text-umber-soft">(Optional)</span>
              </label>
              <textarea
                id="wl-more"
                value={more}
                onChange={(e) => setMore(e.target.value)}
                placeholder="Optional"
                rows={3}
                className={`${fieldCls} resize-y`}
                disabled={isPending}
              />

              {error && (
                <div className="mt-4 rounded-control bg-rose-wash px-3 py-2.5">
                  <ErrorLine>{error}</ErrorLine>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isPending ||
                  !fullName.trim() ||
                  !email.trim() ||
                  (isCreator && (!affiliation.trim() || !link.trim()))
                }
                className={`${primaryBtn} mt-[22px] hover:brightness-90 ${SUBMIT_VARIANT[role]}`}
              >
                {isPending ? 'Joining…' : wantsEarlyAccess ? 'Count me in' : 'Join the waitlist'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

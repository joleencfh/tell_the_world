'use client'

import { useEffect, useState, useTransition } from 'react'
import { submitWaitlistSignup } from '@/lib/waitlist/actions'
import type { UserRole } from '@/lib/types'

// docs/design/landing-page/temp-landing-page-plan.md §2, Part 2 — the
// silent-launch landing page's "Join Waitlist" form. Behavioral shape
// (Escape/overlay-click to close, useTransition, success state) follows
// ContactModal/ProposeBriefModal; visual styling follows the signed-off
// Direction A mockup (docs Part 0) — the Two-Ink Bold tokens, not those
// two modals' older gray palette.
//
// mode differentiates the two closing-section buttons: 'waitlist' goes
// straight to the form; 'early-tester' shows a short intro step first
// (what "early tester" actually means) with a real checkbox — defaulted
// on, since they clicked that button on purpose, but not assumed — and
// a "Next" button before the same shared form. Same fields, same table,
// one submission either way; wants_early_access (040) is the one thing
// that differs, and it's a real boolean column rather than a tag buried
// in additional_info, so admin (WaitlistCard) can show it directly.

interface WaitlistModalProps {
  mode: 'waitlist' | 'early-tester'
  onClose: () => void
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'creator', label: 'Creator' },
  { value: 'journalist', label: 'Journalist' },
  { value: 'expert', label: 'Researcher/Expert' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'comms_specialist', label: 'Communications Specialist' },
  { value: 'other', label: 'Other' },
]

const inputCls =
  'w-full border border-line bg-paper text-ink font-body text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-ink transition-colors disabled:opacity-50'

const labelCls = 'block font-mono text-[10px] tracking-[0.1em] uppercase text-ink-soft mb-1.5'

// Matches .anim-modal-panel-out's duration in app/globals.css.
const CLOSE_ANIMATION_MS = 180

export default function WaitlistModal({ mode, onClose }: WaitlistModalProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'intro' | 'form'>(mode === 'early-tester' ? 'intro' : 'form')
  const [closing, setClosing] = useState(false)
  const [wantsEarlyAccess, setWantsEarlyAccess] = useState(mode === 'early-tester')
  const [role, setRole] = useState<UserRole>('creator')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [link, setLink] = useState('')
  const [more, setMore] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isCreator = role === 'creator'

  function handleClose() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
    setTimeout(onClose, CLOSE_ANIMATION_MS)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center bg-ink/45 px-4 py-[3.5vh] overflow-y-auto ${closing ? 'anim-modal-backdrop-out' : 'anim-modal-backdrop-in'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative bg-paper border border-line w-full max-w-md px-8 py-9 ${closing ? 'anim-modal-panel-out' : 'anim-modal-panel-in'}`}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 font-mono text-[11px] tracking-[0.1em] uppercase text-ink-soft hover:text-ink transition-colors"
        >
          Close
        </button>

        {success ? (
          <div key="success" className="anim-step-in text-center py-4">
            <div className="w-10 h-10 rounded-full bg-pink-soft flex items-center justify-center mx-auto mb-4">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10.5L8 14.5L16 5.5" className="stroke-pink-ink" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-display font-extrabold text-xl text-ink mb-1.5">You&rsquo;re on the list</h3>
            <p className="font-body text-sm text-ink-soft">
              {wantsEarlyAccess
                ? "We'll email you if we're ready for early testers."
                : "We'll email you when there's something to see."}
            </p>
          </div>
        ) : step === 'intro' ? (
          <div key="intro" className="anim-step-in">
            <span className="block font-mono text-[10px] tracking-[0.2em] uppercase text-pink-ink mb-2.5">
              Become an early tester
            </span>
            <h3 className="font-display font-extrabold text-xl text-ink mb-1">Before you sign up</h3>
            <p className="font-body text-sm text-ink-soft leading-relaxed mb-5">
              We&rsquo;ll reach out soon to a handful of early testers. Thank you for wanting to help us shape it while it&rsquo;s still rough around the edges.
            </p>

            <label className="mb-6 flex cursor-pointer items-start gap-3 border border-line rounded-sm px-3.5 py-3 transition-colors hover:border-ink-soft">
              <input
                type="checkbox"
                checked={wantsEarlyAccess}
                onChange={(e) => setWantsEarlyAccess(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-pink-ink"
              />
              <span className="font-body text-sm text-ink leading-snug">
                Yes, I&rsquo;d like to be considered as an early tester.
              </span>
            </label>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full font-display uppercase tracking-widest text-sm bg-pink-ink text-white px-6 py-3.5 hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          </div>
        ) : (
          <div key="form" className="anim-step-in">
            <span className="block font-mono text-[10px] tracking-[0.2em] uppercase text-pink-ink mb-2.5">
              {wantsEarlyAccess ? 'Become an early tester' : 'Join the waitlist'}
            </span>
            <h3 className="font-display font-extrabold text-xl text-ink mb-1">Tell us who you are</h3>
            <p className="font-body text-sm text-ink-soft leading-relaxed mb-6">
              {wantsEarlyAccess
                ? "We'll reach out by email if we're ready for early testers. No spam, no mailing list sold to anyone else."
                : "We'll reach out when Tell The World opens. No spam, no mailing list sold to anyone else."}
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot — hidden from real users via CSS, bots fill it anyway */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Leave this field empty
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </label>
              </div>

              <div className="mb-4">
                <label className={labelCls}>I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      disabled={isPending}
                      className={[
                        'text-left border rounded-sm px-3 py-2 text-[13px] leading-tight font-body transition-colors',
                        role === opt.value
                          ? 'bg-pink-soft border-pink-ink text-pink-ink font-semibold'
                          : 'border-line text-ink-soft hover:border-ink-soft',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className={labelCls} htmlFor="wl-name">Full name</label>
                <input
                  id="wl-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Reyes"
                  className={inputCls}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="mb-4">
                <label className={labelCls} htmlFor="wl-email">Email</label>
                <input
                  id="wl-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="mb-4">
                <label className={labelCls} htmlFor="wl-affiliation">
                  {isCreator ? 'Platform & channel name' : 'Affiliation'}
                </label>
                <input
                  id="wl-affiliation"
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder={isCreator ? 'e.g. YouTube — Jordan’s AI Corner' : 'Where you work, publish, or post'}
                  className={inputCls}
                  required={isCreator}
                  disabled={isPending}
                />
              </div>

              <div className="mb-4">
                <label className={labelCls} htmlFor="wl-link">
                  {isCreator ? 'Channel link' : 'LinkedIn or personal site'}
                </label>
                <input
                  id="wl-link"
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={isCreator ? 'youtube.com/@…' : 'linkedin.com/in/…'}
                  className={inputCls}
                  required={isCreator}
                  disabled={isPending}
                />
              </div>

              <div className="mb-6">
                <label className={labelCls} htmlFor="wl-more">Anything else?</label>
                <textarea
                  id="wl-more"
                  value={more}
                  onChange={(e) => setMore(e.target.value)}
                  placeholder="Optional"
                  rows={3}
                  className={`${inputCls} resize-y`}
                  disabled={isPending}
                />
              </div>

              {error && (
                <p className="font-body text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  isPending ||
                  !fullName.trim() ||
                  !email.trim() ||
                  (isCreator && (!affiliation.trim() || !link.trim()))
                }
                className="w-full font-display uppercase tracking-widest text-sm bg-pink-ink text-white px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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

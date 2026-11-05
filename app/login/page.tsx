'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle, signInWithLinkedIn, signInWithMagicLink } from '@/lib/auth/actions'
import Alert from '@/components/ui/Alert'
import Button, { buttonClasses } from '@/components/ui/Button'
import Field, { TextInput } from '@/components/ui/Field'
import Footer from '@/components/ui/Footer'
import { Icon } from '@/components/ui/icons'
import Logo from '@/components/ui/Logo'

// ─── Icons ───────────────────────────────────────────────────────────────────
// Single-colour marks (design-system.md 2.6: no chromatic icons), so they take
// the button's text colour.

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <rect width="18" height="18" rx="2" />
      <path className="fill-bone" d="M4.5 7H6.5V13.5H4.5V7ZM5.5 6C4.948 6 4.5 5.552 4.5 5C4.5 4.448 4.948 4 5.5 4C6.052 4 6.5 4.448 6.5 5C6.5 5.552 6.052 6 5.5 6Z" />
      <path className="fill-bone" d="M8 7H9.9V7.9H9.926C10.174 7.44 10.773 6.95 11.666 6.95C13.692 6.95 14.065 8.26 14.065 9.993V13.5H12.065V10.373C12.065 9.627 12.05 8.67 11.017 8.67C9.97 8.67 9.81 9.48 9.81 10.32V13.5H7.81V7H8Z" />
    </svg>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

const TEXT_LINK =
  'inline-flex min-h-11 items-center rounded-control text-ui-sm text-umber underline underline-offset-[5px] hover:decoration-2 focus-ring'

function LoginForm() {
  const searchParams = useSearchParams()
  const hasAuthError = searchParams.get('error') === 'auth'

  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState<'google' | 'linkedin' | 'magic' | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showFormAnyway, setShowFormAnyway] = useState(false)
  // Reached either via the OAuth callback's redirect (?error=not_approved,
  // for an unapproved Google/LinkedIn sign-in) or directly from
  // handleMagicLink below (an email with no Supabase Auth identity yet) —
  // same gated message either way.
  const [gated, setGated] = useState(searchParams.get('error') === 'not_approved')
  const [error, setError] = useState<string | null>(
    hasAuthError ? 'Sign-in failed. Please try again, or use a different method.' : null
  )

  const handleGoogle = async () => {
    setLoading('google')
    setError(null)
    const result = await signInWithGoogle()
    if (result.url) {
      window.location.href = result.url
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const handleLinkedIn = async () => {
    setLoading('linkedin')
    setError(null)
    const result = await signInWithLinkedIn()
    if (result.url) {
      window.location.href = result.url
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading('magic')
    setError(null)
    const result = await signInWithMagicLink(email.trim(), honeypot)
    if (result.success) {
      setMagicLinkSent(true)
    } else if (result.notApproved) {
      setGated(true)
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
    }
    setLoading(null)
  }

  const isAnyLoading = loading !== null

  return (
    <div className="flex min-h-screen flex-col bg-parchment font-ui text-umber">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">

        {/* Wordmark */}
        <Logo href="/" className="mb-8" />

        {/* Card */}
        <div className="w-full max-w-narrow rounded-control bg-vellum px-6 py-8 shadow-hairline md:px-8">

          <h1 className="mb-1 font-serif text-section text-umber">Sign in to your account</h1>
          <p className="mb-6 font-ui text-ui-sm text-umber-soft">Approved members only.</p>

          {/* Error banner */}
          {error && (
            <Alert tone="danger" className="mb-5">
              {error}
            </Alert>
          )}

          {/* Gated state — Tell The World is in a silent launch, sign-in is
              restricted to approved members. Replaces the sign-in options
              rather than sitting alongside them, so the message reads as
              the actual wall rather than a dismissible error under buttons
              that don't work anyway. "Try a different account" stays
              available since someone may have just picked the wrong Google
              account, not actually be unapproved. */}
          {gated && !showFormAnyway ? (
            <div className="flex flex-col items-center py-2 text-center">
              <div className="mb-4 grid size-10 place-items-center rounded-full bg-bone text-umber">
                <Icon name="lock" size={20} />
              </div>
              <p className="mb-1.5 font-serif text-card-title text-umber">Approved members only</p>
              <p className="mb-6 font-ui text-ui-sm text-umber-soft">
                Tell The World is in a private, invite-only phase right now.
                Join the waitlist and we&rsquo;ll reach out when we open up.
              </p>
              <Link href="/" className={buttonClasses({ fullWidth: true, className: 'mb-2' })}>
                Join the waitlist
              </Link>
              <button type="button" onClick={() => setShowFormAnyway(true)} className={TEXT_LINK}>
                Try a different account
              </button>
            </div>
          ) : magicLinkSent ? (
            <div role="status" className="flex flex-col items-center py-2 text-center">
              <div className="mb-4 grid size-10 place-items-center rounded-full bg-bone text-umber">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M2.5 5.5L10 11L17.5 5.5" className="stroke-umber" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="2.5" y="4" width="15" height="12" rx="1.5" className="stroke-umber" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="mb-1 font-serif text-card-title text-umber">Check your inbox</p>
              <p className="font-ui text-ui-sm text-umber-soft">
                We sent a sign-in link to{' '}
                <span className="font-medium text-umber">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => { setMagicLinkSent(false); setEmail('') }}
                className={`${TEXT_LINK} mt-3`}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* OAuth buttons */}
              <div className="mb-6 flex flex-col gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleGoogle}
                  disabled={isAnyLoading}
                  pending={loading === 'google'}
                >
                  {loading === 'google' ? <Spinner /> : <GoogleIcon />}
                  Continue with Google
                </Button>

                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleLinkedIn}
                  disabled={isAnyLoading}
                  pending={loading === 'linkedin'}
                >
                  {loading === 'linkedin' ? <Spinner /> : <LinkedInIcon />}
                  Continue with LinkedIn
                </Button>
              </div>

              {/* Divider */}
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-rule" />
                <span className="font-mono text-label uppercase text-umber-soft">or</span>
                <div className="h-px flex-1 bg-rule" />
              </div>

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
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
                <Field label="Email address">
                  {(p) => (
                    <TextInput
                      {...p}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      required
                      disabled={isAnyLoading}
                    />
                  )}
                </Field>
                <Button
                  type="submit"
                  fullWidth
                  disabled={isAnyLoading || !email.trim()}
                  pending={loading === 'magic'}
                >
                  {loading === 'magic' ? 'Sending…' : 'Send magic link'}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer note — links to the waitlist, not /apply: during the silent
            launch, the waitlist is the only intended entry point for new
            people, and "Apply to join" right under a members-only wall was
            a contradictory leftover from the pre-launch flow. */}
        <p className="mt-6 max-w-xs text-center font-ui text-ui-sm text-umber-soft">
          Not a member?{' '}
          <Link href="/" className="text-umber underline underline-offset-[5px] hover:decoration-2 focus-ring">
            Join the waitlist
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="motion-safe:animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

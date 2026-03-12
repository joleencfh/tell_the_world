'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle, signInWithLinkedIn, signInWithMagicLink } from '@/lib/auth/actions'

// ─── Icons ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect width="18" height="18" rx="2" fill="#0A66C2"/>
      <path d="M4.5 7H6.5V13.5H4.5V7ZM5.5 6C4.948 6 4.5 5.552 4.5 5C4.5 4.448 4.948 4 5.5 4C6.052 4 6.5 4.448 6.5 5C6.5 5.552 6.052 6 5.5 6Z" fill="white"/>
      <path d="M8 7H9.9V7.9H9.926C10.174 7.44 10.773 6.95 11.666 6.95C13.692 6.95 14.065 8.26 14.065 9.993V13.5H12.065V10.373C12.065 9.627 12.05 8.67 11.017 8.67C9.97 8.67 9.81 9.48 9.81 10.32V13.5H7.81V7H8Z" fill="white"/>
    </svg>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams()
  const hasAuthError = searchParams.get('error') === 'auth'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<'google' | 'linkedin' | 'magic' | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
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
    const result = await signInWithMagicLink(email.trim())
    if (result.success) {
      setMagicLinkSent(true)
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
    }
    setLoading(null)
  }

  const isAnyLoading = loading !== null

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-4 py-16">

      {/* Wordmark */}
      <div className="mb-10 text-center">
        <p
          className="text-xs tracking-[0.2em] uppercase text-[#6B7A8D] font-mono mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Members
        </p>
        <h1
          className="text-3xl text-[#0D0D0D] leading-none tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          TELL THE WORLD
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-[#E0DAD4] rounded-sm px-8 py-9">

        <h2
          className="text-lg text-[#1C1C1C] mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Sign in to your account
        </h2>
        <p
          className="text-sm text-[#6B7A8D] mb-7"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Approved members only.
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700"
            style={{ fontFamily: 'var(--font-serif)' }}>
            {error}
          </div>
        )}

        {/* Magic link sent state */}
        {magicLinkSent ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-[#C8810A]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M2.5 5.5L10 11L17.5 5.5" stroke="#C8810A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2.5" y="4" width="15" height="12" rx="1.5" stroke="#C8810A" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-[#1C1C1C] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
              Check your inbox
            </p>
            <p className="text-sm text-[#6B7A8D]" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              We sent a sign-in link to{' '}
              <span className="not-italic text-[#1C1C1C]">{email}</span>
            </p>
            <button
              onClick={() => { setMagicLinkSent(false); setEmail('') }}
              className="mt-5 text-xs text-[#6B7A8D] underline underline-offset-2 hover:text-[#1C1C1C] transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* OAuth buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={handleGoogle}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-3 w-full h-11 border border-[#E0DAD4] rounded-sm bg-white text-sm text-[#1C1C1C] hover:bg-[#FAF9F6] hover:border-[#6B7A8D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {loading === 'google' ? (
                  <Spinner />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <button
                onClick={handleLinkedIn}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-3 w-full h-11 border border-[#E0DAD4] rounded-sm bg-white text-sm text-[#1C1C1C] hover:bg-[#FAF9F6] hover:border-[#6B7A8D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {loading === 'linkedin' ? (
                  <Spinner />
                ) : (
                  <LinkedInIcon />
                )}
                Continue with LinkedIn
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#E0DAD4]" />
              <span
                className="text-xs text-[#6B7A8D] tracking-wider uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                or
              </span>
              <div className="flex-1 h-px bg-[#E0DAD4]" />
            </div>

            {/* Magic link form */}
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isAnyLoading}
                className="w-full h-11 px-3 border border-[#E0DAD4] rounded-sm bg-white text-sm text-[#1C1C1C] placeholder-[#6B7A8D] focus:outline-none focus:border-[#C8810A] transition-colors disabled:opacity-50"
                style={{ fontFamily: 'var(--font-serif)' }}
              />
              <button
                type="submit"
                disabled={isAnyLoading || !email.trim()}
                className="flex items-center justify-center gap-2 w-full h-11 bg-[#C8810A] text-white text-sm rounded-sm hover:bg-[#b37209] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {loading === 'magic' ? <Spinner light /> : 'Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer note */}
      <p
        className="mt-8 text-xs text-[#6B7A8D] text-center max-w-xs"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Not a member?{' '}
        <a href="/apply" className="underline underline-offset-2 hover:text-[#1C1C1C] transition-colors">
          Apply to join
        </a>
      </p>
    </div>
  )
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke={light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'} strokeWidth="2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke={light ? 'white' : '#C8810A'} strokeWidth="2" strokeLinecap="round"/>
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

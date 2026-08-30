'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/ui/Footer'
import { submitContactForm } from '@/lib/contact/actions'
import { Field, TextInput, TextareaInput, SelectInput } from '@/app/apply/form-fields'

interface FormState {
  name: string
  email: string
  topic: string
  message: string
  honeypot: string
}

const EMPTY: FormState = { name: '', email: '', topic: '', message: '', honeypot: '' }

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): Partial<Record<keyof FormState, string>> {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!isValidEmail(form.email.trim())) e.email = 'Please enter a valid email address'
    if (!form.topic) e.topic = 'Please select a topic'
    if (!form.message.trim()) e.message = 'Required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.honeypot) {
      setSent(true) // Silently pretend it worked
      return
    }

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitError(null)
    setSubmitting(true)

    const result = await submitContactForm(form)

    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between py-4">
          <Logo href="/" />
          <Link
            href="/"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-14">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft shrink-0" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-soft">
              Get in touch
            </span>
          </div>
          <h1 className="font-display uppercase leading-[0.96] tracking-tight text-[2.25rem] sm:text-[2.75rem] text-ink mb-4">
            Contact us
          </h1>
          <p className="font-body text-base leading-[1.7] text-ink-soft mb-10 max-w-md">
            Questions, feedback, or a data privacy request: send us a message
            and we&rsquo;ll get back to you. See our{' '}
            <Link href="/privacy" className="text-ink underline underline-offset-2 hover:text-ink-soft transition-colors">
              privacy policy
            </Link>{' '}
            for how we handle your data.
          </p>

          {sent ? (
            <div className="border border-line rounded-sm bg-paper-raised px-8 py-9 text-center">
              <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" className="stroke-ink" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22 4 12 14.01 9 11.01" className="stroke-ink" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-body text-ink mb-1.5">Message sent</p>
              <p className="font-body italic text-sm text-ink-soft leading-relaxed">
                Thanks for reaching out. We&rsquo;ll get back to you at{' '}
                <span className="not-italic text-ink">{form.email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot — hidden from real users via CSS, bots fill it anyway */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Leave this field empty
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.honeypot}
                    onChange={(e) => set('honeypot', e.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-5 mb-8">
                <Field label="Name" required error={errors.name}>
                  <TextInput
                    type="text"
                    value={form.name}
                    onChange={(v) => set('name', v)}
                    hasError={!!errors.name}
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email" required error={errors.email}>
                  <TextInput
                    type="email"
                    value={form.email}
                    onChange={(v) => set('email', v)}
                    hasError={!!errors.email}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Topic" required error={errors.topic}>
                  <SelectInput
                    value={form.topic}
                    onChange={(v) => set('topic', v)}
                    hasError={!!errors.topic}
                  >
                    <option value="" disabled>Select a topic&hellip;</option>
                    <option value="privacy">Privacy / data request</option>
                    <option value="general">General enquiry</option>
                    <option value="press">Press</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </SelectInput>
                </Field>

                <Field label="Message" required error={errors.message}>
                  <TextareaInput
                    value={form.message}
                    onChange={(v) => set('message', v)}
                    rows={6}
                    hasError={!!errors.message}
                    placeholder="How can we help?"
                  />
                </Field>
              </div>

              {submitError && (
                <div className="font-body mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="font-body flex items-center justify-center w-full h-11 bg-ink text-paper text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

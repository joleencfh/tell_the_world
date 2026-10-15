'use client'

import { useState } from 'react'
import Link from 'next/link'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Field, { Select, Textarea, TextInput } from '@/components/ui/Field'
import Footer from '@/components/ui/Footer'
import { Icon } from '@/components/ui/icons'
import SiteHeader from '@/components/ui/SiteHeader'
import { submitContactForm } from '@/lib/contact/actions'

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
    <div className="flex min-h-screen flex-col bg-parchment font-ui text-umber">
      <SiteHeader action={{ href: '/', label: 'Back home' }} />

      <main className="flex-1 px-4 py-section md:px-gutter">
        <div className="mx-auto max-w-reading">
          <p className="mb-3 font-mono text-label uppercase text-umber-soft">Get in touch</p>
          <h1 className="mb-4 font-serif text-title text-umber">Contact us</h1>
          <p className="mb-10 max-w-prose font-serif text-lead text-umber-soft">
            Questions, feedback, or a data privacy request: send us a message
            and we&rsquo;ll get back to you. See our{' '}
            <Link
              href="/privacy"
              className="text-umber underline underline-offset-[5px] hover:decoration-2 focus-ring"
            >
              privacy policy
            </Link>{' '}
            for how we handle your data.
          </p>

          {sent ? (
            <div role="status" className="rounded-control bg-vellum px-6 py-8 text-center shadow-hairline md:px-8">
              <div className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-bone text-umber">
                <Icon name="check" size={20} />
              </div>
              <p className="mb-1.5 font-serif text-card-title text-umber">Message sent</p>
              <p className="font-ui text-ui-sm text-umber-soft">
                Thanks for reaching out. We&rsquo;ll get back to you at{' '}
                <span className="font-medium text-umber">{form.email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex max-w-narrow flex-col gap-6">
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

              <Field label="Name" error={errors.name}>
                {(p) => (
                  <TextInput
                    {...p}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    autoComplete="name"
                  />
                )}
              </Field>

              <Field label="Email" error={errors.email}>
                {(p) => (
                  <TextInput
                    {...p}
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    autoComplete="email"
                  />
                )}
              </Field>

              <Field label="Topic" error={errors.topic}>
                {(p) => (
                  <Select {...p} value={form.topic} onChange={(e) => set('topic', e.target.value)}>
                    <option value="" disabled>Select a topic&hellip;</option>
                    <option value="privacy">Privacy / data request</option>
                    <option value="general">General enquiry</option>
                    <option value="press">Press</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </Select>
                )}
              </Field>

              <Field label="Message" error={errors.message}>
                {(p) => (
                  <Textarea
                    {...p}
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    rows={6}
                    placeholder="How can we help?"
                  />
                )}
              </Field>

              {submitError && <Alert tone="danger">{submitError}</Alert>}

              <Button type="submit" fullWidth pending={submitting}>
                {submitting ? 'Sending…' : 'Send message'}
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

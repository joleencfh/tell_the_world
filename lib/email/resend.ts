import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// Fallback to Resend's shared test sender when EMAIL_FROM is not set.
// onboarding@resend.dev works on all accounts but can only send to your
// Resend account's verified email address. Set EMAIL_FROM in .env.local
// to a verified sending domain for production use.
export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

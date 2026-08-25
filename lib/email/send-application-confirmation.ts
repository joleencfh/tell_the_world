import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, MONO, esc, nl2br, eyebrow, emailShell } from './brand'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApplicationConfirmationData {
  first_name: string
  last_name: string
  email: string
  desired_role: string
  desired_role_other?: string
  bio: string
  website_url?: string
  // Creator
  primary_platform?: string
  primary_platform_other?: string
  platform_url?: string
  audience_size?: string
  content_language?: string
  // Journalist
  publication_name?: string
  publication_url?: string
  reporting_beat?: string
  // Expert
  affiliation?: string
  job_title?: string
  credibility_url?: string
  // Organisation
  org_name?: string
  org_size?: string
  // Universal optional
  sample_work_url?: string
  referral_source?: string
  referral_source_other?: string
  additional_info?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function row(label: string, value: string | undefined): string {
  if (!value?.trim()) return ''
  return `
    <tr>
      <td style="padding:10px 20px 10px 0;font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${COLOR.inkFaint};white-space:nowrap;vertical-align:top;border-bottom:1px solid ${COLOR.line};">${esc(label)}</td>
      <td style="padding:10px 0;font-family:${FONT};font-size:14px;color:${COLOR.ink};line-height:1.7;border-bottom:1px solid ${COLOR.line};">${nl2br(value)}</td>
    </tr>`
}

const ROLE_LABELS: Record<string, string> = {
  creator:      'Creator',
  journalist:   'Journalist',
  expert:       'Expert / Researcher',
  organisation: 'Organisation',
  other:        'Other',
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube:    'YouTube',
  podcast:    'Podcast',
  instagram:  'Instagram',
  tiktok:     'TikTok',
  newsletter: 'Newsletter',
}

const ORG_SIZE_LABELS: Record<string, string> = {
  small:  'Small (1–10 people)',
  medium: 'Medium (11–50 people)',
  large:  'Large (50+ people)',
}

const REFERRAL_LABELS: Record<string, string> = {
  search_engine:       'Search engine',
  social_media:        'Social media',
  word_of_mouth:       'Word of mouth / colleague',
  newsletter_podcast:  'Newsletter or podcast',
  linkedin:            'LinkedIn',
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function sendApplicationConfirmation(
  data: ApplicationConfirmationData,
) {
  const roleLabel =
    data.desired_role === 'other' && data.desired_role_other?.trim()
      ? `Other — ${data.desired_role_other.trim()}`
      : (ROLE_LABELS[data.desired_role] ?? data.desired_role)

  const platformLabel =
    data.primary_platform === 'other' && data.primary_platform_other?.trim()
      ? data.primary_platform_other.trim()
      : (PLATFORM_LABELS[data.primary_platform ?? ''] ?? data.primary_platform ?? '')

  const referralLabel =
    data.referral_source === 'other' && data.referral_source_other?.trim()
      ? data.referral_source_other.trim()
      : (REFERRAL_LABELS[data.referral_source ?? ''] ?? data.referral_source ?? '')

  const orgSizeLabel = ORG_SIZE_LABELS[data.org_size ?? ''] ?? data.org_size ?? ''

  const summaryRows = [
    row('Name',            `${data.first_name} ${data.last_name}`),
    row('Email',           data.email),
    row('Role',            roleLabel),
    row('Bio',             data.bio),
    row('Website',         data.website_url),
    // Creator
    row('Platform',        platformLabel || undefined),
    row('Profile URL',     data.platform_url),
    row('Audience size',   data.audience_size),
    row('Language',        data.content_language),
    // Journalist
    row('Publication',     data.publication_name),
    row('Publication URL', data.publication_url),
    row('Reporting beat',  data.reporting_beat),
    // Expert
    row('Affiliation',     data.affiliation),
    row('Job title',       data.job_title),
    row('Credibility link',data.credibility_url),
    // Organisation
    row('Organisation',    data.org_name),
    row('Org size',        orgSizeLabel || undefined),
    // Universal optional
    row('Work sample',     data.sample_work_url),
    row('How you found us',referralLabel || undefined),
    row('Additional info', data.additional_info),
  ].join('')

  const bodyHtml = `
    ${eyebrow('Application received')}
    <p style="margin:0 0 32px;font-family:${FONT};font-size:15px;line-height:1.75;color:${COLOR.inkSoft};">
      Hi ${esc(data.first_name)}, thanks for applying! Here&rsquo;s a copy of your submission.
    </p>
    <p style="margin:0 0 0;font-family:${MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${COLOR.inkFaint};border-top:1px solid ${COLOR.line};padding-top:20px;">
      Your submission
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      ${summaryRows}
    </table>
    <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.inkFaint};">
      If anything above looks wrong, just reply to this email and let us know.
    </p>`

  const html = emailShell({ bodyHtml, maxWidth: 560 })

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set — confirmation email cannot be sent')
  }

  const result = await sendEmail({
    to: data.email,
    subject: 'Your application to Tell The World',
    html,
  })

  if (result.error) {
    throw new Error(`Resend error: ${result.error}`)
  }

  return result
}

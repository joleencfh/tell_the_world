import type { ProfileUser } from './page'
import Tag from '@/components/ui/Tag'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Key-value rows (design-system.md 3.5): a two-column grid, the label in
// mono (160px), the value in text-ui-sm, a hairline between rows.
const ROW = 'grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[160px_1fr]'
const LABEL = 'font-mono text-label uppercase text-umber-soft'

function DetailRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={ROW}>
      <dt className={LABEL}>{label}</dt>
      <dd className={`font-ui text-ui-sm text-umber${multiline ? ' leading-relaxed' : ''}`}>{value}</dd>
    </div>
  )
}

function DetailLinkRow({ label, url }: { label: string; url: string }) {
  return (
    <div className={ROW}>
      <dt className={LABEL}>{label}</dt>
      <dd className="min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate rounded-control font-ui text-ui-sm text-umber underline decoration-umber-soft/40 underline-offset-[5px] hover:decoration-umber focus-ring"
        >
          {extractDomain(url)}
        </a>
      </dd>
    </div>
  )
}

function DetailsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule pt-10">
      <h2 className="mb-2 font-mono text-label uppercase text-umber-soft">{title}</h2>
      <dl className="divide-y divide-rule">{children}</dl>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Role-specific detail panels (extracted to keep ProfileView manageable)
// ---------------------------------------------------------------------------

export function RoleDetails({ user }: { user: ProfileUser }) {
  const hasAny = (fields: (string | number | string[] | null | undefined)[]) =>
    fields.some((f) => f != null && f !== '' && !(Array.isArray(f) && f.length === 0))

  if (user.role === 'expert') {
    if (!hasAny([user.affiliation, user.job_title, user.credibility_url, user.areas_of_focus])) {
      return null
    }
    return (
      <DetailsSection title="Expert details">
        {user.job_title && <DetailRow label="Job title" value={user.job_title} />}
        {user.affiliation && <DetailRow label="Affiliation" value={user.affiliation} />}
        {user.credibility_url && <DetailLinkRow label="Credibility" url={user.credibility_url} />}
        {user.areas_of_focus && user.areas_of_focus.length > 0 && (
          <div className={ROW}>
            <dt className={LABEL}>Areas of focus</dt>
            <dd className="flex flex-wrap gap-2">
              {user.areas_of_focus.map((area) => (
                <Tag key={area}>{area}</Tag>
              ))}
            </dd>
          </div>
        )}
      </DetailsSection>
    )
  }

  if (user.role === 'organisation') {
    if (!hasAny([user.org_name, user.org_size, user.org_mission])) return null
    return (
      <DetailsSection title="Organisation details">
        {user.org_name && <DetailRow label="Organisation" value={user.org_name} />}
        {user.org_size && (
          <DetailRow label="Size" value={user.org_size.charAt(0).toUpperCase() + user.org_size.slice(1)} />
        )}
        {user.org_mission && <DetailRow label="Mission" value={user.org_mission} multiline />}
      </DetailsSection>
    )
  }

  if (user.role === 'creator' || user.role === 'journalist') {
    const isJournalist = user.role === 'journalist'
    const fields = [
      user.channel_name,
      user.primary_platform,
      user.platform_url,
      user.audience_size,
      user.content_language,
      ...(isJournalist ? [user.publication_name, user.publication_url, user.reporting_beat] : []),
    ]
    if (!hasAny(fields)) return null

    return (
      <DetailsSection title={isJournalist ? 'Journalist details' : 'Creator details'}>
        {user.channel_name && <DetailRow label="Channel / publication" value={user.channel_name} />}
        {user.primary_platform && (
          <DetailRow
            label="Primary platform"
            value={user.primary_platform.charAt(0).toUpperCase() + user.primary_platform.slice(1)}
          />
        )}
        {user.platform_url && <DetailLinkRow label="Channel / page" url={user.platform_url} />}
        {user.audience_size != null && (
          <DetailRow label="Audience size" value={user.audience_size.toLocaleString()} />
        )}
        {user.content_language && <DetailRow label="Content language" value={user.content_language} />}
        {isJournalist && user.publication_name && <DetailRow label="Publication" value={user.publication_name} />}
        {isJournalist && user.publication_url && (
          <DetailLinkRow label="Publication URL" url={user.publication_url} />
        )}
        {isJournalist && user.reporting_beat && <DetailRow label="Reporting beat" value={user.reporting_beat} />}
      </DetailsSection>
    )
  }

  return null
}

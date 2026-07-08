import type { ProfileUser } from './page'

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft">
        {label}
      </span>
      <span className="font-serif text-sm text-text">{value}</span>
    </div>
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
      <section className="border-t border-edge pt-8">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft mb-5">
          Expert details
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {user.job_title && <DetailRow label="Job title" value={user.job_title} />}
          {user.affiliation && <DetailRow label="Affiliation" value={user.affiliation} />}
          {user.credibility_url && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft">
                Credibility
              </span>
              <a
                href={user.credibility_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-sm text-live hover:opacity-75 transition-opacity truncate"
              >
                {extractDomain(user.credibility_url)}
              </a>
            </div>
          )}
          {user.areas_of_focus && user.areas_of_focus.length > 0 && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft">
                Areas of focus
              </span>
              <div className="flex flex-wrap gap-2">
                {user.areas_of_focus.map((area) => (
                  <span
                    key={area}
                    className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-mono text-[9px] tracking-[0.1em]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  if (user.role === 'organisation') {
    if (!hasAny([user.org_name, user.org_size, user.org_mission])) return null
    return (
      <section className="border-t border-edge pt-8">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft mb-5">
          Organisation details
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {user.org_name && <DetailRow label="Organisation" value={user.org_name} />}
          {user.org_size && (
            <DetailRow
              label="Size"
              value={user.org_size.charAt(0).toUpperCase() + user.org_size.slice(1)}
            />
          )}
          {user.org_mission && (
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft">
                Mission
              </span>
              <p className="font-serif text-sm text-text leading-relaxed">{user.org_mission}</p>
            </div>
          )}
        </div>
      </section>
    )
  }

  if (user.role === 'creator' || user.role === 'journalist') {
    const isJournalist = user.role === 'journalist'
    const fields = [
      user.primary_platform,
      user.platform_url,
      user.audience_size,
      user.content_language,
      ...(isJournalist ? [user.publication_name, user.publication_url, user.reporting_beat] : []),
    ]
    if (!hasAny(fields)) return null

    return (
      <section className="border-t border-edge pt-8">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft mb-5">
          {isJournalist ? 'Journalist details' : 'Creator details'}
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {user.primary_platform && (
            <DetailRow
              label="Primary platform"
              value={user.primary_platform.charAt(0).toUpperCase() + user.primary_platform.slice(1)}
            />
          )}
          {user.platform_url && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft">
                Channel / page
              </span>
              <a
                href={user.platform_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-sm text-live hover:opacity-75 transition-opacity truncate"
              >
                {extractDomain(user.platform_url)}
              </a>
            </div>
          )}
          {user.audience_size != null && (
            <DetailRow
              label="Audience size"
              value={user.audience_size.toLocaleString()}
            />
          )}
          {user.content_language && (
            <DetailRow label="Content language" value={user.content_language} />
          )}
          {isJournalist && user.publication_name && (
            <DetailRow label="Publication" value={user.publication_name} />
          )}
          {isJournalist && user.publication_url && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft">
                Publication URL
              </span>
              <a
                href={user.publication_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-sm text-live hover:opacity-75 transition-opacity truncate"
              >
                {extractDomain(user.publication_url)}
              </a>
            </div>
          )}
          {isJournalist && user.reporting_beat && (
            <DetailRow label="Reporting beat" value={user.reporting_beat} />
          )}
        </div>
      </section>
    )
  }

  return null
}

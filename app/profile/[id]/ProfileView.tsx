'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import EditProfileModal from './EditProfileModal'
import PostModal from '@/components/PostModal'
import ContactModal from '@/components/ContactModal'
import type { PostData } from '@/components/PostModal'
import type { ProfileUser, ProfilePost, ProfileContribution, UserRole, AvailabilityStatus } from './page'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(user: { display_name: string | null; email: string }): string {
  return user.display_name?.trim() || user.email.split('@')[0]
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PostTypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    video: 'bg-red-100 text-red-700',
    article: 'bg-blue-100 text-blue-700',
    paper: 'bg-green-100 text-green-700',
    quote: 'bg-purple-100 text-purple-700',
    resource: 'bg-amber-100 text-amber-700',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full font-mono text-[9px] tracking-[0.1em] uppercase ${cls[type] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {type}
    </span>
  )
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  if (status === 'unavailable') return null
  const isOpen = status === 'open'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${isOpen ? 'bg-green-500' : 'bg-amber-400'}`}
        aria-hidden
      />
      <span
        className={`font-mono text-[9px] tracking-[0.12em] uppercase ${isOpen ? 'text-green-700' : 'text-amber-600'}`}
      >
        {isOpen ? 'Available' : 'Limited availability'}
      </span>
    </span>
  )
}

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

function PostCard({ post, onEdit }: { post: ProfilePost; onEdit?: () => void }) {
  return (
    <article className="bg-card border border-edge rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-sm font-bold text-dark leading-snug flex-1">
          {post.title}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <PostTypeBadge type={post.post_type} />
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="font-mono text-[9px] tracking-[0.1em] uppercase text-soft/60 hover:text-text transition-colors"
              aria-label="Edit post"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {post.body && (
        <p className="font-serif text-sm text-soft leading-relaxed">
          {truncate(post.body, 200)}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 mt-auto pt-1">
        <span className="font-mono text-[9px] text-soft/70">{formatDate(post.created_at)}</span>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group"
          >
            View source{' '}
            <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
              →
            </span>
          </a>
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// ProfileView (main client component)
// ---------------------------------------------------------------------------

interface ProfileViewProps {
  profileUser: ProfileUser | null
  posts: ProfilePost[]
  contributions: ProfileContribution[]
  isOwnProfile: boolean
  currentUserId: string
  currentUser: { id: string; display_name: string | null; email: string; role: UserRole } | null
}

export default function ProfileView({
  profileUser,
  posts,
  contributions,
  isOwnProfile,
  currentUserId,
  currentUser,
}: ProfileViewProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostData | null>(null)
  const [contactOpen, setContactOpen] = useState(false)

  function openNewPost() {
    setEditingPost(null)
    setPostModalOpen(true)
  }

  function openEditPost(post: ProfilePost) {
    setEditingPost({
      id: post.id,
      post_type: post.post_type,
      title: post.title,
      body: post.body,
      url: post.url,
      topic_tags: post.topic_tags ?? [],
    })
    setPostModalOpen(true)
  }

  function handlePostSuccess() {
    router.refresh()
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const showsAvailability =
    profileUser?.role === 'creator' || profileUser?.role === 'journalist'

  const profileName = profileUser ? getDisplayName(profileUser) : null

  return (
    <div className="min-h-screen bg-base text-text">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur-sm border-b border-edge px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <Link
            href="/home"
            className="font-serif text-base font-bold tracking-tight text-text"
          >
            Tell <em className="italic text-live">The</em> World
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/directory"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors hidden sm:block"
            >
              Directory
            </Link>
            <Link
              href="/briefs"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors hidden sm:block"
            >
              Briefs
            </Link>
            <Link
              href={`/profile/${currentUserId}`}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-14">

          {/* Profile not found */}
          {!profileUser && (
            <div className="py-20 text-center">
              <p className="font-display uppercase text-3xl text-dark mb-3">
                Profile not found
              </p>
              <p className="font-serif text-sm text-soft mb-8">
                This profile doesn&rsquo;t exist or the link may be incorrect.
              </p>
              <Link
                href="/directory"
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-2"
              >
                ← Browse directory
              </Link>
            </div>
          )}

          {/* Profile header */}
          {profileUser && (
            <>
              <section>
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Avatar */}
                  <Avatar
                    name={profileName!}
                    avatarUrl={profileUser.avatar_url}
                    size="3xl"
                  />

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="font-display uppercase text-2xl sm:text-3xl text-dark leading-tight">
                        {profileName}
                      </h1>
                      <RoleBadge role={profileUser.role} />
                    </div>

                    {/* Availability — creator and journalist only */}
                    {showsAvailability && (
                      <div className="mb-3">
                        <AvailabilityBadge status={profileUser.availability} />
                      </div>
                    )}

                    {/* Bio */}
                    {profileUser.bio && (
                      <p className="font-serif text-base leading-[1.8] text-text mb-3 max-w-xl">
                        {profileUser.bio}
                      </p>
                    )}

                    {/* Website */}
                    {profileUser.website_url && (
                      <a
                        href={profileUser.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group mb-4 block"
                      >
                        {extractDomain(profileUser.website_url)}{' '}
                        <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
                          →
                        </span>
                      </a>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 flex-wrap mt-4">
                      {isOwnProfile ? (
                        <>
                          <button
                            onClick={() => setEditOpen(true)}
                            className="font-display uppercase tracking-widest text-xs bg-dark text-base px-5 py-2.5 hover:opacity-80 transition-opacity"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={openNewPost}
                            className="font-display uppercase tracking-widest text-xs border border-edge text-soft px-5 py-2.5 hover:text-text hover:border-text transition-colors"
                          >
                            New Post
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setContactOpen(true)}
                          className="font-display uppercase tracking-widest text-xs bg-dark text-base px-5 py-2.5 hover:opacity-80 transition-opacity"
                        >
                          Contact
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Role-specific details */}
              <RoleDetails user={profileUser} />

              {/* Posts section */}
              <section>
                <div className="flex items-center gap-5 mb-7">
                  <h2 className="font-display uppercase tracking-[0.18em] text-dark text-sm shrink-0">
                    Posts by {profileName}
                  </h2>
                  <div className="flex-1 h-px bg-edge" />
                </div>

                {posts.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={isOwnProfile ? () => openEditPost(post) : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="font-serif text-sm text-soft/60 italic py-4">
                    {isOwnProfile
                      ? "You haven't shared any posts yet. Share your first post to get started."
                      : 'No posts yet.'}
                  </p>
                )}
              </section>

              {/* Contributions section — experts and organisations only */}
              {(profileUser.role === 'expert' || profileUser.role === 'organisation') &&
                (contributions.length > 0 || isOwnProfile) && (
                <section>
                  <div className="flex items-center gap-5 mb-7">
                    <h2 className="font-display uppercase tracking-[0.18em] text-dark text-sm shrink-0">
                      Brief contributions
                    </h2>
                    <div className="flex-1 h-px bg-edge" />
                  </div>

                  {contributions.length > 0 ? (
                    <div className="space-y-4">
                      {contributions.map((c) => (
                        <ContributionCard key={c.id} contribution={c} isOwnProfile={isOwnProfile} />
                      ))}
                    </div>
                  ) : (
                    <p className="font-serif text-sm text-soft/60 italic py-4">
                      No contributions yet.
                    </p>
                  )}
                </section>
              )}
            </>
          )}

        </div>
      </main>

      <footer className="border-t border-edge px-6 py-6 mt-16">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <span className="font-serif text-sm font-bold text-soft/60 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
        </div>
      </footer>

      {/* Edit profile modal */}
      {editOpen && profileUser && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Post modal (create or edit) */}
      {postModalOpen && (
        <PostModal
          currentUserId={currentUserId}
          existingPost={editingPost}
          onClose={() => setPostModalOpen(false)}
          onSuccess={handlePostSuccess}
        />
      )}

      {/* Contact modal */}
      {contactOpen && profileUser && currentUser && (
        <ContactModal
          recipient={{
            id: profileUser.id,
            display_name: profileUser.display_name,
            email: profileUser.email,
            role: profileUser.role,
          }}
          sender={{
            display_name: currentUser.display_name,
            role: currentUser.role,
          }}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contribution card
// ---------------------------------------------------------------------------

function ContributionCard({
  contribution,
  isOwnProfile,
}: {
  contribution: ProfileContribution
  isOwnProfile: boolean
}) {
  const isPending = contribution.status === 'pending'
  return (
    <article className="bg-card border border-edge rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/briefs/${contribution.briefs.slug}`}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity"
        >
          {contribution.briefs.title} →
        </Link>
        {isOwnProfile && isPending && (
          <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Pending review
          </span>
        )}
      </div>
      <p className="font-serif text-sm text-text leading-relaxed whitespace-pre-wrap">
        {contribution.contribution_text}
      </p>
      <span className="font-mono text-[9px] text-soft/70">{formatDate(contribution.created_at)}</span>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Role-specific detail panels (extracted to keep ProfileView manageable)
// ---------------------------------------------------------------------------

function RoleDetails({ user }: { user: ProfileUser }) {
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import EditProfileModal from './EditProfileModal'
import PostModal from '@/components/PostModal'
import ContactModal from '@/components/ContactModal'
import type { PostData } from '@/components/PostModal'
import type { ProfileUser, ProfilePost, ProfileCorrectionProposal, UserRole, AvailabilityStatus } from './page'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { PostCard, CorrectionProposalCard } from './cards'
import { RoleDetails, extractDomain } from './RoleDetails'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(user: { display_name: string | null; email: string }): string {
  return user.display_name?.trim() || user.email.split('@')[0]
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ProfileView (main client component)
// ---------------------------------------------------------------------------

interface ProfileViewProps {
  profileUser: ProfileUser | null
  posts: ProfilePost[]
  correctionProposals: ProfileCorrectionProposal[]
  isOwnProfile: boolean
  currentUserId: string
  currentUser: { id: string; display_name: string | null; email: string; role: UserRole } | null
}

export default function ProfileView({
  profileUser,
  posts,
  correctionProposals,
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
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-line px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <Link
            href="/home"
            className="font-body text-base font-bold tracking-tight text-ink"
          >
            Tell <em className="italic">The</em> World
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/directory"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors hidden sm:block"
            >
              Directory
            </Link>
            <Link
              href="/briefs"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors hidden sm:block"
            >
              Briefs
            </Link>
            <Link
              href={`/profile/${currentUserId}`}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
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
              <p className="font-display uppercase text-3xl text-ink mb-3">
                Profile not found
              </p>
              <p className="font-body text-sm text-ink-soft mb-8">
                This profile doesn&rsquo;t exist or the link may be incorrect.
              </p>
              <Link
                href="/directory"
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-2"
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
                      <h1 className="font-display uppercase text-2xl sm:text-3xl text-ink leading-tight">
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
                      <p className="font-body text-base leading-[1.8] text-ink mb-3 max-w-xl">
                        {profileUser.bio}
                      </p>
                    )}

                    {/* Website */}
                    {profileUser.website_url && (
                      <a
                        href={profileUser.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-1 group mb-4 block"
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
                            className="font-display uppercase tracking-widest text-xs bg-ink text-paper px-5 py-2.5 hover:opacity-80 transition-opacity"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={openNewPost}
                            className="font-display uppercase tracking-widest text-xs border border-line text-ink-soft px-5 py-2.5 hover:text-ink hover:border-ink transition-colors"
                          >
                            New Post
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setContactOpen(true)}
                          className="font-display uppercase tracking-widest text-xs bg-ink text-paper px-5 py-2.5 hover:opacity-80 transition-opacity"
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
                  <h2 className="font-display uppercase tracking-[0.18em] text-ink text-sm shrink-0">
                    Posts by {profileName}
                  </h2>
                  <div className="flex-1 h-px bg-line" />
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
                  <p className="font-body text-sm text-ink-soft/60 italic py-4">
                    {isOwnProfile
                      ? "You haven't shared any posts yet. Share your first post to get started."
                      : 'No posts yet.'}
                  </p>
                )}
              </section>

              {/* Correction proposals section — experts and organisations only */}
              {(profileUser.role === 'expert' || profileUser.role === 'organisation') &&
                (correctionProposals.length > 0 || isOwnProfile) && (
                <section>
                  <div className="flex items-center gap-5 mb-7">
                    <h2 className="font-display uppercase tracking-[0.18em] text-ink text-sm shrink-0">
                      Correction proposals
                    </h2>
                    <div className="flex-1 h-px bg-line" />
                  </div>

                  {correctionProposals.length > 0 ? (
                    <div className="space-y-4">
                      {correctionProposals.map((c) => (
                        <CorrectionProposalCard key={c.id} proposal={c} isOwnProfile={isOwnProfile} />
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-sm text-ink-soft/60 italic py-4">
                      No correction proposals yet.
                    </p>
                  )}
                </section>
              )}
            </>
          )}

        </div>
      </main>

      <footer className="border-t border-line px-6 py-6 mt-16">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <span className="font-body text-sm font-bold text-ink-soft/60 tracking-tight">
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

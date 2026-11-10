'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EditProfileModal from './EditProfileModal'
import PostModal from '@/components/PostModal'
import ContactModal from '@/components/ContactModal'
import type { PostData } from '@/components/PostModal'
import type { ProfileUser, ProfilePost, ProfileCorrectionProposal, ProfileReview, UserRole, AvailabilityStatus } from './page'
import Avatar from '@/components/ui/Avatar'
import RoleLabel from '@/components/ui/RoleLabel'
import Button, { buttonClasses } from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Footer from '@/components/ui/Footer'
import AppHeader from '@/components/ui/AppHeader'
import { PostCard, CorrectionProposalCard, ReviewHistoryCard } from './cards'
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

// A dot plus a word, so it is never colour alone: cobalt for "open", neutral
// for "limited".
function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  if (status === 'unavailable') return null
  const isOpen = status === 'open'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`size-2 shrink-0 rounded-full ${isOpen ? 'bg-cobalt-bright' : 'bg-umber-soft'}`}
        aria-hidden
      />
      <span className={`font-mono text-label uppercase ${isOpen ? 'text-cobalt' : 'text-umber-soft'}`}>
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
  reviews: ProfileReview[]
  isOwnProfile: boolean
  currentUserId: string
  currentUser: { id: string; display_name: string | null; email: string; role: UserRole; avatar_url: string | null } | null
}

export default function ProfileView({
  profileUser,
  posts,
  correctionProposals,
  reviews,
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

  const showsAvailability =
    profileUser?.role === 'creator' || profileUser?.role === 'journalist'

  const profileName = profileUser ? getDisplayName(profileUser) : null

  return (
    <div className="min-h-screen bg-parchment font-ui text-umber">
      <AppHeader
        user={
          currentUser
            ? {
                id: currentUser.id,
                name: currentUser.display_name?.trim() || currentUser.email.split('@')[0],
                avatarUrl: currentUser.avatar_url,
                role: currentUser.role,
              }
            : null
        }
        current={isOwnProfile ? 'profile' : undefined}
      />

      <main className="px-4 py-10 md:px-gutter md:py-14">
        <div className="mx-auto max-w-content space-y-12">

          {/* Profile not found */}
          {!profileUser && (
            <EmptyState
              title="Profile not found"
              className="py-16"
              action={
                <Link href="/directory" className={buttonClasses({ variant: 'secondary', small: true })}>
                  ← Browse directory
                </Link>
              }
            >
              This profile doesn&rsquo;t exist or the link may be incorrect.
            </EmptyState>
          )}

          {/* Profile header */}
          {profileUser && (
            <>
              <section>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <Avatar
                    name={profileName!}
                    avatarUrl={profileUser.avatar_url}
                    role={profileUser.role}
                    size="3xl"
                  />

                  {/* Identity: the Author parts (initial, name with role
                      label), with the name as the page's h1. */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h1 className="font-serif text-title text-umber">{profileName}</h1>
                      <RoleLabel role={profileUser.role} />
                    </div>

                    {/* Availability — creator and journalist only */}
                    {showsAvailability && (
                      <div className="mb-3">
                        <AvailabilityBadge status={profileUser.availability} />
                      </div>
                    )}

                    {/* Bio */}
                    {profileUser.bio && (
                      <p className="mb-3 max-w-reading font-serif text-reading text-umber">{profileUser.bio}</p>
                    )}

                    {/* Website */}
                    {profileUser.website_url && (
                      <a
                        href={profileUser.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex min-h-11 items-center gap-1 rounded-control font-ui text-ui-sm text-umber-soft underline decoration-umber-soft/40 underline-offset-[5px] hover:text-umber hover:decoration-umber focus-ring"
                      >
                        {extractDomain(profileUser.website_url)}{' '}
                        <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                          →
                        </span>
                      </a>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {isOwnProfile ? (
                        <>
                          <Button variant="primary" onClick={() => setEditOpen(true)}>
                            Edit Profile
                          </Button>
                          <Button variant="secondary" onClick={openNewPost}>
                            New Post
                          </Button>
                        </>
                      ) : (
                        <Button variant="primary" onClick={() => setContactOpen(true)}>
                          Contact
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Role-specific details */}
              <RoleDetails user={profileUser} />

              {/* Posts section */}
              <section className="border-t border-rule pt-10">
                <h2 className="mb-6 font-serif text-section text-umber">Posts by {profileName}</h2>

                {posts.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={isOwnProfile ? () => openEditPost(post) : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-2 font-ui text-ui-sm text-umber-soft">
                    {isOwnProfile
                      ? "You haven't shared any posts yet. Share your first post to get started."
                      : 'No posts yet.'}
                  </p>
                )}
              </section>

              {/* Correction proposals section — experts and organisations only */}
              {(profileUser.role === 'expert' || profileUser.role === 'organisation') &&
                (correctionProposals.length > 0 || isOwnProfile) && (
                <section className="border-t border-rule pt-10">
                  <h2 className="mb-6 font-serif text-section text-umber">Correction proposals</h2>

                  {correctionProposals.length > 0 ? (
                    <div className="space-y-4">
                      {correctionProposals.map((c) => (
                        <CorrectionProposalCard key={c.id} proposal={c} isOwnProfile={isOwnProfile} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 font-ui text-ui-sm text-umber-soft">No correction proposals yet.</p>
                  )}
                </section>
              )}

              {/* Review/endorsement history — experts and organisations
                  only, same gate as correction proposals above. Visitors
                  only ever see published rows (RLS), so "withdrawn" rows
                  only appear when isOwnProfile. */}
              {(profileUser.role === 'expert' || profileUser.role === 'organisation') &&
                (reviews.length > 0 || isOwnProfile) && (
                <section className="border-t border-rule pt-10">
                  <h2 className="mb-6 font-serif text-section text-umber">Reviews &amp; endorsements</h2>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <ReviewHistoryCard key={r.id} review={r} isOwnProfile={isOwnProfile} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 font-ui text-ui-sm text-umber-soft">No briefs reviewed or endorsed yet.</p>
                  )}
                </section>
              )}
            </>
          )}

        </div>
      </main>

      <Footer />

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
          currentUserRole={currentUser?.role}
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

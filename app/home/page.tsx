import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'
import { getRecentBriefs, getUserBriefProposals, type UserBriefProposal } from '@/lib/data/briefs'
import { getUserBasic, getRecentUsers, getExpertOrgIds } from '@/lib/data/users'
import { getPostsByAuthors } from '@/lib/data/posts'
import { getHeroDigest } from '@/lib/data/home'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/ui/Footer'
import SignOutButton from '@/components/ui/SignOutButton'
import Highlighted, { getHighlightedSectionData } from './highlighted'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Brief {
  id: string
  title: string
  slug: string
  tldr: string
  created_at: string
}

interface PostAuthor {
  display_name: string | null
  email: string
  role: UserRole
  avatar_url: string | null
}

interface ContentPost {
  id: string
  user_id: string
  post_type: string
  title: string
  body: string | null
  url: string | null
  created_at: string
  users: PostAuthor
}

interface RecentUser {
  id: string
  display_name: string
  email: string
  role: UserRole
  avatar_url: string | null
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(user: { display_name: string | null; email: string }): string {
  return user.display_name?.trim() || user.email.split('@')[0]
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
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

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center gap-5 mb-7">
      <h2 className="font-display uppercase tracking-[0.18em] text-ink text-sm shrink-0">
        {title}
      </h2>
      <div className="flex-1 h-px bg-line" />
      {href && linkLabel && (
        <Link
          href={href}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors shrink-0"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="font-body text-sm text-ink-soft/60 italic py-4">{message}</p>
  )
}

// Part 10 (docs/design/brief-feature/brief-page-part2-plan.md §2) — status
// card for the submitter's own brief_proposals rows.
const PROPOSAL_STATUS_LABEL: Record<UserBriefProposal['status'], string> = {
  pending: 'Pending review',
  approved: 'Approved',
  declined: 'Declined',
}

const PROPOSAL_STATUS_CLASS: Record<UserBriefProposal['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-gray-100 text-gray-600',
}

function ProposalCard({ proposal }: { proposal: UserBriefProposal }) {
  return (
    <article className="bg-paper-raised border border-line rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-body text-sm font-bold text-ink leading-snug flex-1">
          {proposal.topic_title}
        </h3>
        <span
          className={`shrink-0 inline-block px-2 py-0.5 rounded-full font-mono text-[9px] tracking-[0.1em] uppercase ${PROPOSAL_STATUS_CLASS[proposal.status]}`}
        >
          {PROPOSAL_STATUS_LABEL[proposal.status]}
        </span>
      </div>
      {proposal.status === 'approved' && proposal.published_brief_slug && (
        <Link
          href={`/briefs/${proposal.published_brief_slug}`}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-1 group mt-auto"
        >
          Read brief{' '}
          <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
            →
          </span>
        </Link>
      )}
    </article>
  )
}

function BriefCard({ brief }: { brief: Brief }) {
  return (
    <article className="bg-paper-raised border border-line rounded-xl p-5 flex flex-col gap-3">
      <h3 className="font-body text-sm font-bold text-ink leading-snug">
        {brief.title}
      </h3>
      <p className="font-body text-sm text-ink-soft leading-relaxed flex-1">
        {truncate(brief.tldr, 120)}
      </p>
      <Link
        href={`/briefs/${brief.slug}`}
        className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-1 group mt-auto"
      >
        Read brief{' '}
        <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
          →
        </span>
      </Link>
    </article>
  )
}

function PostCard({ post }: { post: ContentPost }) {
  const authorName = getDisplayName(post.users)
  return (
    <article className="bg-paper-raised border border-line rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={authorName} avatarUrl={post.users.avatar_url} size="xs" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.user_id}`}
            className="font-body text-xs font-semibold text-ink hover:text-blue-ink transition-colors block truncate"
          >
            {authorName}
          </Link>
          <div className="mt-0.5">
            <RoleBadge role={post.users.role} size="sm" />
          </div>
        </div>
        <PostTypeBadge type={post.post_type} />
      </div>
      <div>
        <p className="font-body text-sm font-semibold text-ink leading-snug mb-1">
          {post.title}
        </p>
        {post.body && (
          <p className="font-body text-sm text-ink-soft leading-relaxed">
            {truncate(post.body, 180)}
          </p>
        )}
      </div>
      {post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-blue-ink hover:opacity-75 transition-opacity inline-flex items-center gap-1 group mt-auto"
        >
          View source{' '}
          <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
            →
          </span>
        </a>
      )}
    </article>
  )
}

function UserChip({ user }: { user: RecentUser }) {
  const name = getDisplayName(user)
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-2.5 bg-paper-raised border border-line rounded-full px-3 py-2 hover:border-ink-soft transition-colors shrink-0"
    >
      <Avatar name={name} avatarUrl={user.avatar_url} size="xs" />
      <div className="min-w-0">
        <p className="font-body text-xs font-semibold text-ink truncate max-w-[100px]">
          {name}
        </p>
        <RoleBadge role={user.role} size="sm" />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Round 1 — parallel: current user, briefs, recently joined, expert/org IDs
  const [currentUser, briefs, recentUsers, expertOrgIds, myProposals, heroDigest] = await Promise.all([
    getUserBasic(supabase, user.id),
    getRecentBriefs(supabase, 5),
    getRecentUsers(supabase, user.id, 8),
    getExpertOrgIds(supabase),
    getUserBriefProposals(supabase, user.id),
    getHeroDigest(supabase, user.id),
  ])

  // Round 2 — posts filtered by expert/org user IDs, and the Highlighted
  // module's own bundle (returns null internally when no brief is
  // dashboard_featured) — independent of each other, fetched together
  // rather than one after another.
  const [posts, highlighted] = await Promise.all([
    getPostsByAuthors(supabase, expertOrgIds, 10),
    getHighlightedSectionData(supabase, user.id),
  ])

  const welcomeName = currentUser
    ? getDisplayName(currentUser)
    : user.email?.split('@')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <Logo href="/home" />
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
            {currentUser && (
              <Link
                href={`/profile/${currentUser.id}`}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
              >
                Profile
              </Link>
            )}
            <SignOutButton className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors" />
          </nav>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-16">

          {/* Welcome */}
          <section>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-soft mb-3">
              Dashboard
            </p>
            <h1 className="font-display uppercase leading-tight text-ink mb-6 text-[2.5rem] sm:text-[3.5rem]">
              Welcome back,
              <br />
              {welcomeName}
            </h1>
            {heroDigest && (
              <p className="font-body text-base text-ink-soft leading-relaxed max-w-xl mb-6">
                {heroDigest}
              </p>
            )}
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/directory"
                className="font-display uppercase tracking-widest text-xs bg-ink text-paper px-6 py-3 hover:opacity-90 transition-opacity"
              >
                Browse Directory
              </Link>
            </div>
          </section>

          {/* Profile not set up yet */}
          {!currentUser && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-5">
              <p className="font-body text-sm text-amber-900">
                Your profile isn&rsquo;t set up yet. Contact the platform admin to
                complete your onboarding.
              </p>
            </div>
          )}

          {/* Highlighted — one admin-curated brief with its quotes/coverage
              already attached (home-dashboard-plan.md §2, Part 3). No
              placeholder when nothing is featured yet, same convention as
              every other empty-state on this page. */}
          {highlighted && <Highlighted data={highlighted} />}

          {/* Your Proposals — only shown to members who've actually
              proposed a brief; no empty-state fallback for everyone else,
              same "additive, no empty-state chip" spirit as the
              Contributors list this pairs with on BriefView.tsx. */}
          {myProposals.length > 0 && (
            <section>
              <SectionHeader title="Your Proposals" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </div>
            </section>
          )}

          {/* Active Briefs */}
          <section>
            <SectionHeader title="Active Briefs" href="/briefs" linkLabel="View all" />
            {briefs.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {briefs.map((b) => (
                  <BriefCard key={b.id} brief={b} />
                ))}
              </div>
            ) : (
              <EmptyState message="No briefs published yet — check back soon." />
            )}
          </section>

          {/* Recent Posts from experts and organisations */}
          <section>
            <SectionHeader title="Recent Posts" />
            {posts.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <EmptyState message="No posts from experts and organisations yet." />
            )}
          </section>

          {/* Recently Joined */}
          <section>
            <SectionHeader
              title="Recently Joined"
              href="/directory"
              linkLabel="Browse all"
            />
            {recentUsers.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {recentUsers.map((u) => (
                  <UserChip key={u.id} user={u} />
                ))}
              </div>
            ) : (
              <EmptyState message="You're the first one here — others will join soon." />
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}

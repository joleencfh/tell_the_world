import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'
import { getRecentBriefs, getUserBriefProposals, type UserBriefProposal } from '@/lib/data/briefs'
import { getUserBasic, getRecentUsers, getExpertOrgIds } from '@/lib/data/users'
import { getPostsByAuthors } from '@/lib/data/posts'
import { getHeroDigest } from '@/lib/data/home'
import { getThisWeekActivity } from '@/lib/data/activity'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/ui/Footer'
import SignOutButton from '@/components/ui/SignOutButton'
import ThisWeek from './this-week'
import Highlighted, { getHighlightedSectionData } from './highlighted'
import Thumb from '@/components/ui/Thumb'
import CardGoLink from '@/components/ui/CardGoLink'
import DashboardCarousel from './dashboard-carousel'
import DashboardSectionHeader, { DASH_SECTION_BORDER_CLASSES, DASH_ACTION_LINK_CLASSES } from './dashboard-section-header'

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

// Two-Ink Bold treats proposal status as a status axis, not a role axis —
// one neutral bordered mono chip for every status rather than borrowing
// blue/pink or a stock traffic-light palette (home-dashboard-plan.md §2
// Part 5 step 4).
const PROPOSAL_STATUS_CLASS = 'border border-ink-faint text-ink-soft'

function ProposalCard({ proposal }: { proposal: UserBriefProposal }) {
  return (
    <article className="bg-paper-raised border border-line p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-body text-sm font-bold text-ink leading-snug flex-1">
          {proposal.topic_title}
        </h3>
        <span
          className={`shrink-0 inline-block px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase ${PROPOSAL_STATUS_CLASS}`}
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
    <div className="w-[250px] shrink-0 snap-start pt-1 first:pl-1">
      <article className="flex h-full flex-col border border-line border-t-[3px] border-t-ink bg-paper">
        <Thumb id={brief.id} className="h-[92px] w-full" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="font-body text-sm font-bold text-ink leading-snug">
            {brief.title}
          </h3>
          <p className="font-body text-sm text-ink-soft leading-relaxed flex-1">
            {truncate(brief.tldr, 120)}
          </p>
          <CardGoLink href={`/briefs/${brief.slug}`} ariaLabel={`Read ${brief.title}`} />
        </div>
      </article>
    </div>
  )
}

// Two of every three cards get a Thumb (home-dashboard-plan.md §2 Part 5
// step 2) — not all, since not every post has an attached image; the
// middle card of each group of three is left text-only.
function PostCard({ post, showThumb }: { post: ContentPost; showThumb: boolean }) {
  const authorName = getDisplayName(post.users)
  return (
    <div className="w-[260px] shrink-0 snap-start pt-1 first:pl-1">
      <article className="flex h-full flex-col gap-3 border border-line border-t-[3px] border-t-blue bg-paper">
        <div className="flex items-center gap-3 px-4 pt-4">
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
        {showThumb && <Thumb id={post.id} className="h-[100px] w-full" />}
        <div className="flex-1 px-4">
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
          <div className="flex justify-end px-4 pb-4">
            <CardGoLink
              href={post.url}
              ariaLabel={`View source: ${post.title}`}
              variant="external"
              tone="blue"
            />
          </div>
        )}
      </article>
    </div>
  )
}

// Left-border accent per role, same split as app/directory/UserCard.tsx's
// ROLE_BORDER: blue = expert/org, pink = creator/journalist, neutral for
// admin/comms_specialist/other.
const ROLE_BORDER: Record<UserRole, string> = {
  creator: 'border-l-pink/40',
  journalist: 'border-l-pink/40',
  expert: 'border-l-blue/40',
  organisation: 'border-l-blue/40',
  admin: 'border-l-line-strong',
  comms_specialist: 'border-l-line-strong',
  other: 'border-l-line-strong',
}

function UserChip({ user }: { user: RecentUser }) {
  const name = getDisplayName(user)
  return (
    <Link
      href={`/profile/${user.id}`}
      className={`flex items-center gap-2.5 bg-paper border border-line border-l-[3px] ${ROLE_BORDER[user.role]} px-3 py-2 hover:bg-paper-raised transition-colors shrink-0`}
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
  const [currentUser, briefs, recentUsers, expertOrgIds, myProposals, heroDigest, thisWeekItems] = await Promise.all([
    getUserBasic(supabase, user.id),
    getRecentBriefs(supabase, 5),
    getRecentUsers(supabase, user.id, 8),
    getExpertOrgIds(supabase),
    getUserBriefProposals(supabase, user.id),
    getHeroDigest(supabase, user.id),
    getThisWeekActivity(supabase),
  ])

  // Round 2 — posts filtered by expert/org user IDs, and the Highlighted
  // module's own bundle (returns null internally when no brief is
  // dashboard_featured) — independent of each other, fetched together
  // rather than one after another.
  const [posts, highlighted] = await Promise.all([
    getPostsByAuthors(supabase, expertOrgIds, 10),
    getHighlightedSectionData(supabase, user.id),
  ])

  // First name only in the hero heading (the user's call — a full
  // display_name reads as an odd "Welcome back, Firstname Lastname" on a
  // dashboard greeting; getDisplayName's full name is still used everywhere
  // else on the page, e.g. profile chips).
  const welcomeName = (currentUser ? getDisplayName(currentUser) : user.email?.split('@')[0] ?? 'there').split(
    /\s+/,
  )[0]

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
          <section className="anim-rise" style={{ animationDelay: '0ms' }}>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-soft mb-3">
              Dashboard
            </p>
            <h1 className="font-display font-extrabold uppercase leading-none tracking-tight text-balance text-ink mb-6 text-[2.5rem] sm:text-[3.5rem]">
              Welcome back, {welcomeName}
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
            <div className="border-2 border-ink bg-paper-raised p-5 anim-rise" style={{ animationDelay: '60ms' }}>
              <p className="font-body text-sm text-ink">
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

          {/* This Week — a chronological river mixing internal items (new/
              updated briefs, quotes) with external items (coverage, posts
              linking out) instead of splitting them into separate feeds
              (home-dashboard-plan.md §2, Part 4). No placeholder when
              there's nothing this week, same empty-state convention as
              every other additive section on this page. */}
          {thisWeekItems.length > 0 && <ThisWeek items={thisWeekItems} />}

          {/* Your Proposals — only shown to members who've actually
              proposed a brief; no empty-state fallback for everyone else,
              same "additive, no empty-state chip" spirit as the
              Contributors list this pairs with on BriefView.tsx. */}
          {myProposals.length > 0 && (
            <section className={`border-t-4 ${DASH_SECTION_BORDER_CLASSES.ink} pt-8 anim-rise`} style={{ animationDelay: '100ms' }}>
              <DashboardSectionHeader tone="ink" label="Your Proposals" title="Awaiting review" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </div>
            </section>
          )}

          {/* Active Briefs */}
          <section className={`border-t-4 ${DASH_SECTION_BORDER_CLASSES.ink} pt-8 anim-rise`} style={{ animationDelay: '140ms' }}>
            <DashboardSectionHeader
              tone="ink"
              label="Active Briefs"
              title="Following"
              action={
                <Link href="/briefs" className={DASH_ACTION_LINK_CLASSES}>
                  View all →
                </Link>
              }
            />
            {briefs.length > 0 ? (
              <DashboardCarousel fadeColor="var(--color-paper)" ariaLabel="Active briefs">
                {briefs.map((b) => (
                  <BriefCard key={b.id} brief={b} />
                ))}
              </DashboardCarousel>
            ) : (
              <EmptyState message="No briefs published yet. Check back soon." />
            )}
          </section>

          {/* From Your Network — recent posts from experts and organisations */}
          <section className={`border-t-4 ${DASH_SECTION_BORDER_CLASSES.blue} pt-8 anim-rise`} style={{ animationDelay: '180ms' }}>
            <DashboardSectionHeader tone="blue" label="From Your Network" title="Recent posts from experts & orgs" />
            {posts.length > 0 ? (
              <div className="bg-paper-sunken-blue p-5 sm:p-6">
                <DashboardCarousel fadeColor="var(--color-paper-sunken-blue)" ariaLabel="Recent posts from your network">
                  {posts.map((p, i) => (
                    <PostCard key={p.id} post={p} showThumb={i % 3 !== 1} />
                  ))}
                </DashboardCarousel>
              </div>
            ) : (
              <EmptyState message="No posts from experts and organisations yet." />
            )}
          </section>

          {/* Community — recently joined members */}
          <section className={`border-t-4 ${DASH_SECTION_BORDER_CLASSES.ink} pt-8 anim-rise`} style={{ animationDelay: '220ms' }}>
            <DashboardSectionHeader
              tone="ink"
              label="Community"
              title="Recently joined"
              action={
                <Link href="/directory" className={DASH_ACTION_LINK_CLASSES}>
                  Browse directory →
                </Link>
              }
            />
            {recentUsers.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {recentUsers.map((u) => (
                  <UserChip key={u.id} user={u} />
                ))}
              </div>
            ) : (
              <EmptyState message="You're the first one here. Others will join soon." />
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}

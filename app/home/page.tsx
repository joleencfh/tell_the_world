import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'
import { getRecentBriefs, getUserBriefProposals, type UserBriefProposal } from '@/lib/data/briefs'
import { getUserBasic, getRecentUsers, getExpertOrgIds } from '@/lib/data/users'
import { getPostsByAuthors } from '@/lib/data/posts'
import { getHeroDigest } from '@/lib/data/home'
import { getThisWeekActivity } from '@/lib/data/activity'
import Author from '@/components/ui/Author'
import { buttonClasses } from '@/components/ui/Button'
import CategoryChip, { type PostCategory } from '@/components/ui/CategoryChip'
import EmptyState from '@/components/ui/EmptyState'
import StatusChip from '@/components/ui/StatusChip'
import Footer from '@/components/ui/Footer'
import AppHeader from '@/components/ui/AppHeader'
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

const POST_CATEGORIES: readonly PostCategory[] = ['video', 'article', 'paper', 'quote', 'resource']

// Post types are told apart by an icon and a word, never by hue. A type the
// design system does not know falls back to "resource".
function PostTypeBadge({ type }: { type: string }) {
  const category = POST_CATEGORIES.find((c) => c === type) ?? 'resource'
  return <CategoryChip category={category} />
}

// Part 10 (docs/design/brief-feature/brief-page-part2-plan.md §2) — status
// card for the submitter's own brief_proposals rows.
const PROPOSAL_STATUS_LABEL: Record<UserBriefProposal['status'], string> = {
  pending: 'Pending review',
  approved: 'Approved',
  declined: 'Declined',
}

function ProposalCard({ proposal }: { proposal: UserBriefProposal }) {
  return (
    <article className="flex flex-col gap-3 rounded-control bg-vellum p-5 shadow-hairline">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 font-ui text-ui font-semibold leading-snug text-umber">
          {proposal.topic_title}
        </h3>
        {/* Neutral for every status outside admin (design decision 2). */}
        <StatusChip status={proposal.status} label={PROPOSAL_STATUS_LABEL[proposal.status]} className="shrink-0" />
      </div>
      {proposal.status === 'approved' && proposal.published_brief_slug && (
        <Link
          href={`/briefs/${proposal.published_brief_slug}`}
          className="group mt-auto inline-flex min-h-11 items-center gap-1 rounded-control font-ui text-ui-sm text-umber-soft underline decoration-umber-soft/40 underline-offset-[5px] hover:text-umber hover:decoration-umber focus-ring"
        >
          Read brief{' '}
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
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
      <article className="flex h-full flex-col overflow-hidden rounded-control bg-vellum shadow-hairline">
        <Thumb id={brief.id} className="h-[92px] w-full" />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="font-serif text-card-title text-umber">{brief.title}</h3>
          <p className="flex-1 font-ui text-ui-sm text-umber-soft">{truncate(brief.tldr, 120)}</p>
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
      <article className="flex h-full flex-col gap-3 overflow-hidden rounded-control bg-vellum shadow-hairline">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <Link
            href={`/profile/${post.user_id}`}
            className="min-w-0 rounded-control hover:underline focus-ring"
          >
            <Author name={authorName} avatarUrl={post.users.avatar_url} role={post.users.role} size="xs" />
          </Link>
          <PostTypeBadge type={post.post_type} />
        </div>
        {showThumb && <Thumb id={post.id} className="h-[100px] w-full" />}
        <div className="flex-1 px-5">
          <p className="mb-1 font-ui text-ui font-semibold leading-snug text-umber">{post.title}</p>
          {post.body && <p className="font-ui text-ui-sm text-umber-soft">{truncate(post.body, 180)}</p>}
        </div>
        {post.url && (
          <div className="flex justify-end px-5 pb-5">
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

// Member card: the Author block is the whole card, one link to the profile.
// The role label beside the name tells the side (rose or cobalt); there is no
// coloured edge any more.
function UserChip({ user }: { user: RecentUser }) {
  const name = getDisplayName(user)
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex min-h-11 shrink-0 items-center rounded-control bg-vellum px-4 py-3 shadow-hairline transition-colors hover:bg-bone focus-ring"
    >
      <Author name={name} avatarUrl={user.avatar_url} role={user.role} size="xs" />
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
    <div className="min-h-screen bg-parchment font-ui text-umber">
      <AppHeader
        user={
          currentUser
            ? { id: currentUser.id, name: getDisplayName(currentUser), avatarUrl: currentUser.avatar_url, role: currentUser.role }
            : null
        }
        current="home"
      />

      <main className="px-4 py-10 md:px-gutter md:py-14">
        <div className="mx-auto max-w-page space-y-14">

          {/* Welcome */}
          <section className="anim-rise" style={{ animationDelay: '0ms' }}>
            <p className="mb-3 font-mono text-label uppercase text-umber-soft">Dashboard</p>
            <h1 className="mb-6 text-balance font-serif text-title text-umber">Welcome back, {welcomeName}</h1>
            {heroDigest && (
              <p className="mb-6 max-w-reading font-serif text-lead text-umber-soft">{heroDigest}</p>
            )}
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/directory" className={buttonClasses({ variant: 'primary' })}>
                Browse Directory
              </Link>
            </div>
          </section>

          {/* Profile not set up yet */}
          {!currentUser && (
            <div className="anim-rise rounded-control bg-bone p-5" style={{ animationDelay: '60ms' }}>
              <p className="font-ui text-ui text-umber">
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
            <section className={`${DASH_SECTION_BORDER_CLASSES.neutral} pt-8 anim-rise`} style={{ animationDelay: '100ms' }}>
              <DashboardSectionHeader tone="neutral" label="Your Proposals" title="Awaiting review" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </div>
            </section>
          )}

          {/* Active Briefs */}
          <section className={`${DASH_SECTION_BORDER_CLASSES.neutral} pt-8 anim-rise`} style={{ animationDelay: '140ms' }}>
            <DashboardSectionHeader
              tone="neutral"
              label="Active Briefs"
              title="Following"
              action={
                <Link href="/briefs" className={DASH_ACTION_LINK_CLASSES}>
                  View all →
                </Link>
              }
            />
            {briefs.length > 0 ? (
              <DashboardCarousel fadeColor="var(--color-parchment)" ariaLabel="Active briefs">
                {briefs.map((b) => (
                  <BriefCard key={b.id} brief={b} />
                ))}
              </DashboardCarousel>
            ) : (
              <EmptyState title="No briefs published yet. Check back soon." />
            )}
          </section>

          {/* From Your Network — recent posts from experts and organisations */}
          <section className={`${DASH_SECTION_BORDER_CLASSES.cobalt} pt-8 anim-rise`} style={{ animationDelay: '180ms' }}>
            <DashboardSectionHeader tone="cobalt" label="From Your Network" title="Recent posts from experts & orgs" />
            {posts.length > 0 ? (
              <div className="rounded-control bg-card-cobalt p-5 sm:p-6">
                <DashboardCarousel fadeColor="var(--color-card-cobalt)" ariaLabel="Recent posts from your network">
                  {posts.map((p, i) => (
                    <PostCard key={p.id} post={p} showThumb={i % 3 !== 1} />
                  ))}
                </DashboardCarousel>
              </div>
            ) : (
              <EmptyState title="No posts from experts and organisations yet." />
            )}
          </section>

          {/* Community — recently joined members */}
          <section className={`${DASH_SECTION_BORDER_CLASSES.neutral} pt-8 anim-rise`} style={{ animationDelay: '220ms' }}>
            <DashboardSectionHeader
              tone="neutral"
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
              <EmptyState title="You're the first one here. Others will join soon." />
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}

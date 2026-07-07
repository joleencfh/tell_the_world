import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CurrentUser {
  id: string
  email: string
  full_name: string
  display_name: string
  role: UserRole
  avatar_url: string | null
}

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

function initials(name: string): string {
  return name.charAt(0).toUpperCase()
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string
  avatarUrl: string | null
  size?: 'sm' | 'md'
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
  }
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gray-200 text-gray-600 font-semibold flex items-center justify-center shrink-0 select-none`}
    >
      {initials(name)}
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const cls: Record<UserRole, string> = {
    creator: 'bg-blue-100 text-blue-700',
    journalist: 'bg-purple-100 text-purple-700',
    expert: 'bg-green-100 text-green-700',
    organisation: 'bg-amber-100 text-amber-700',
    admin: 'bg-red-100 text-red-700',
  }
  const label: Record<UserRole, string> = {
    creator: 'Creator',
    journalist: 'Journalist',
    expert: 'Expert',
    organisation: 'Organisation',
    admin: 'Admin',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full font-mono text-[9px] tracking-[0.1em] uppercase ${cls[role]}`}
    >
      {label[role]}
    </span>
  )
}

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
      <h2 className="font-display uppercase tracking-[0.18em] text-dark text-sm shrink-0">
        {title}
      </h2>
      <div className="flex-1 h-px bg-edge" />
      {href && linkLabel && (
        <Link
          href={href}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors shrink-0"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="font-serif text-sm text-soft/60 italic py-4">{message}</p>
  )
}

function BriefCard({ brief }: { brief: Brief }) {
  return (
    <article className="bg-card border border-edge rounded-xl p-5 flex flex-col gap-3">
      <h3 className="font-serif text-sm font-bold text-dark leading-snug">
        {brief.title}
      </h3>
      <p className="font-serif text-sm text-soft leading-relaxed flex-1">
        {truncate(brief.tldr, 120)}
      </p>
      <Link
        href={`/briefs/${brief.slug}`}
        className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group mt-auto"
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
    <article className="bg-card border border-edge rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={authorName} avatarUrl={post.users.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.user_id}`}
            className="font-serif text-xs font-semibold text-dark hover:text-live transition-colors block truncate"
          >
            {authorName}
          </Link>
          <div className="mt-0.5">
            <RoleBadge role={post.users.role} />
          </div>
        </div>
        <PostTypeBadge type={post.post_type} />
      </div>
      <div>
        <p className="font-serif text-sm font-semibold text-dark leading-snug mb-1">
          {post.title}
        </p>
        {post.body && (
          <p className="font-serif text-sm text-soft leading-relaxed">
            {truncate(post.body, 180)}
          </p>
        )}
      </div>
      {post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group mt-auto"
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
      className="flex items-center gap-2.5 bg-card border border-edge rounded-full px-3 py-2 hover:border-live/40 transition-colors shrink-0"
    >
      <Avatar name={name} avatarUrl={user.avatar_url} size="sm" />
      <div className="min-w-0">
        <p className="font-serif text-xs font-semibold text-dark truncate max-w-[100px]">
          {name}
        </p>
        <RoleBadge role={user.role} />
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
  const [currentUserResult, briefsResult, recentUsersResult, expertOrgResult] =
    await Promise.all([
      supabase
        .from('users')
        .select('id, email, full_name, display_name, role, avatar_url')
        .eq('id', user.id)
        .single(),
      supabase
        .from('briefs')
        .select('id, title, slug, tldr, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('users')
        .select('id, display_name, email, role, avatar_url, created_at')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('users').select('id').in('role', ['expert', 'organisation']),
    ])

  // Round 2 — posts filtered by expert/org user IDs
  const expertOrgIds = (expertOrgResult.data ?? []).map((u: { id: string }) => u.id)
  const { data: postsRaw } =
    expertOrgIds.length > 0
      ? await supabase
          .from('content_posts')
          .select(
            'id, user_id, post_type, title, body, url, created_at, users(display_name, email, role, avatar_url)'
          )
          .in('user_id', expertOrgIds)
          .order('created_at', { ascending: false })
          .limit(10)
      : { data: [] }

  const currentUser = currentUserResult.data as CurrentUser | null
  const briefs = (briefsResult.data ?? []) as Brief[]
  const recentUsers = (recentUsersResult.data ?? []) as RecentUser[]
  const posts = (postsRaw ?? []) as unknown as ContentPost[]

  const welcomeName = currentUser
    ? getDisplayName(currentUser)
    : user.email?.split('@')[0] ?? 'there'

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
            {currentUser && (
              <Link
                href={`/profile/${currentUser.id}`}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors"
              >
                Profile
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-16">

          {/* Welcome */}
          <section>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-soft mb-3">
              Dashboard
            </p>
            <h1 className="font-display uppercase leading-tight text-dark mb-6 text-[2.5rem] sm:text-[3.5rem]">
              Welcome back,
              <br />
              {welcomeName}
            </h1>
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/directory"
                className="font-display uppercase tracking-widest text-xs bg-dark text-base px-6 py-3 hover:bg-text transition-colors"
              >
                Browse Directory
              </Link>
              <Link
                href="/briefs"
                className="font-mono text-[10px] tracking-[0.2em] uppercase text-soft hover:text-text transition-colors inline-flex items-center gap-2"
              >
                View Briefs <span aria-hidden>→</span>
              </Link>
            </div>
          </section>

          {/* Profile not set up yet */}
          {!currentUser && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-5">
              <p className="font-serif text-sm text-amber-900">
                Your profile isn&rsquo;t set up yet. Contact the platform admin to
                complete your onboarding.
              </p>
            </div>
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

      <footer className="border-t border-edge px-6 py-6 mt-16">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <span className="font-serif text-sm font-bold text-soft/60 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
        </div>
      </footer>
    </div>
  )
}

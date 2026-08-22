-- =============================================================
-- Tell The World — content_posts moderation status + content_post_likes
-- Applied via the Supabase Management API (see memory
-- supabase_management_api_sql.md), not pasted into the SQL Editor by hand.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 4): the new "+ Add quote" button on the Quotes carousel lets
-- org/expert/admin attach a quote directly to a brief (content_posts.
-- brief_id, added in 030). Confirmed with the user during this part's
-- build that these submissions need admin review before going live —
-- unlike the existing profile "share something" flow (lib/posts/
-- actions.ts's createPost, PostModal.tsx), which keeps publishing
-- immediately with zero behavior change here.
-- =============================================================

alter table content_posts
  add column status text not null default 'published' check (status in ('pending', 'published'));

-- Default 'published' so every existing row, and every future insert
-- through createPost (which never sets status), keeps behaving exactly as
-- before. Only the new brief-scoped submitQuote action (lib/briefs/
-- actions.ts) explicitly inserts 'pending'.
create index content_posts_status_idx on content_posts (status);

-- Replace the two unconditional read policies (008_member_read_policies,
-- 020_anon_content_posts_read) with status-aware ones — a pending quote
-- shouldn't appear on the brief page, a profile, or the home feed until
-- approved. Authenticated users additionally see their own row regardless
-- of status (mirrors brief_coverage's "submitters can read their own"
-- policy, 028), so a submitter isn't RLS-locked out of their own pending
-- quote if a future UI wants to surface "your pending submissions" —
-- nothing in this part's UI actually renders a pending row anywhere, all
-- of lib/data/posts.ts's read queries explicitly filter to
-- status = 'published' too (defense in depth, matching the
-- getPublishedCtas/getPublishedCoverage convention of filtering in the
-- query as well as relying on RLS).
drop policy "Members can read all content posts" on content_posts;
drop policy "Anyone can read content posts" on content_posts;

create policy "Anyone can read published content posts"
  on content_posts
  for select
  to anon
  using (status = 'published');

create policy "Members can read published content posts"
  on content_posts
  for select
  to authenticated
  using (status = 'published');

create policy "Submitters can read their own content posts"
  on content_posts
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ─── content_post_likes ─────────────────────────────────────────────────
-- De-duplicated liking, one row per (quote, user) — same toggle shape as
-- brief_coverage_likes (028). No "is the parent brief public" condition to
-- check here, unlike brief_coverage_likes: content_posts' own read
-- policies above have no per-brief visibility gating (a quote is sitewide
-- content, only additionally associated with a brief via brief_id), so the
-- only condition that matters is whether the quote itself is published.

create table content_post_likes (
  id              uuid primary key default gen_random_uuid(),
  content_post_id uuid not null references content_posts(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (content_post_id, user_id)
);

create index content_post_likes_content_post_id_idx on content_post_likes (content_post_id);

alter table content_post_likes enable row level security;

create policy "Anyone can read likes on published quotes"
  on content_post_likes
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from content_posts
      where content_posts.id = content_post_likes.content_post_id
        and content_posts.status = 'published'
    )
  );

create policy "Members can like a quote"
  on content_post_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Members can remove their own quote like"
  on content_post_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

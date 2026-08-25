-- =============================================================
-- Tell The World — Covered By: click-through comments + votes
-- Run this in the Supabase SQL Editor (or via the Management API).
--
-- Part 9 (brief-page-part2-plan.md §2): the click-through modal opened by
-- a Covered By card needs somewhere to store comments and their per-comment
-- up/down votes. No comment system exists anywhere else in the app to
-- reuse — this is genuinely new, unlike brief_coverage_likes (028), which
-- this mirrors for the read/RLS shape (public/members read split gated on
-- the parent coverage row being published on a public brief, any logged-in
-- member can write).
--
-- brief_coverage_comment_votes is directional (up/down), unlike every other
-- vote table in this schema (question_votes, brief_coverage_likes, etc.),
-- which are plain toggles — so it needs an update policy too, for switching
-- direction in place, not just insert/delete.
--
-- Already applied to the live DB 2026-08-25 (Management API) before this
-- session had to move into an isolated worktree — this file is committed
-- for the record, not re-applied.
-- =============================================================

create table brief_coverage_comments (
  id           uuid primary key default gen_random_uuid(),
  coverage_id  uuid not null references brief_coverage(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index brief_coverage_comments_coverage_id_idx on brief_coverage_comments (coverage_id);

alter table brief_coverage_comments enable row level security;

create policy "Anyone can read coverage comments on public briefs"
  on brief_coverage_comments
  for select
  to anon
  using (
    exists (
      select 1 from brief_coverage
      join briefs on briefs.id = brief_coverage.brief_id
      where brief_coverage.id = brief_coverage_comments.coverage_id
        and brief_coverage.status = 'published'
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read coverage comments"
  on brief_coverage_comments
  for select
  to authenticated
  using (true);

-- Any logged-in member can comment — no moderation queue (unlike quotes/
-- CTAs/FAQ answers, which are propose-then-pending). A comment posts
-- immediately, the same way a like does.
create policy "Members can add coverage comments"
  on brief_coverage_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── brief_coverage_comment_votes ───────────────────────────────────────
-- One row per (comment, user) — a plain unique index is enough here (no
-- soft-delete/status column on this table to scope a partial index
-- around), same shape as brief_coverage_likes' unique(coverage_id, user_id).

create table brief_coverage_comment_votes (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references brief_coverage_comments(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  direction   text not null check (direction in ('up', 'down')),
  created_at  timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index brief_coverage_comment_votes_comment_id_idx on brief_coverage_comment_votes (comment_id);

alter table brief_coverage_comment_votes enable row level security;

create policy "Anyone can read coverage comment votes on public briefs"
  on brief_coverage_comment_votes
  for select
  to anon
  using (
    exists (
      select 1 from brief_coverage_comments
      join brief_coverage on brief_coverage.id = brief_coverage_comments.coverage_id
      join briefs on briefs.id = brief_coverage.brief_id
      where brief_coverage_comments.id = brief_coverage_comment_votes.comment_id
        and brief_coverage.status = 'published'
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read coverage comment votes"
  on brief_coverage_comment_votes
  for select
  to authenticated
  using (true);

create policy "Members can cast a coverage comment vote"
  on brief_coverage_comment_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Switching direction (up -> down or back) updates the existing row in
-- place rather than delete-then-insert, so voteCoverageComment
-- (lib/briefs/actions.ts) can do it in one round trip.
create policy "Members can change their own coverage comment vote"
  on brief_coverage_comment_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Members can remove their own coverage comment vote"
  on brief_coverage_comment_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

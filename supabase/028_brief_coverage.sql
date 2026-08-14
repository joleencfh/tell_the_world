-- =============================================================
-- Tell The World — Covered By (press coverage)
-- Run this in the Supabase SQL Editor.
--
-- Two-Ink Bold plan Part 7 (docs/design/brief-feature/two-ink-bold-plan.md
-- §3, Part 7): a new dark-band brief section listing press coverage of the
-- topic, moderated by the admin before it appears.
--
-- Design decided during this part's build (2026-08-14), superseding the
-- plan doc's original "outlet name, title, submitted manually" shape: the
-- submitter pastes a URL only. outlet_name/title/image_url are extracted
-- server-side from the page's Open Graph tags at submission time
-- (lib/links/link-preview.ts) and stored on the row — not re-fetched on
-- every page view. image_url is nullable; when a page has no usable
-- og:image (or the fetch fails entirely), the card falls back to Part 0's
-- duotone placeholder graphic, same as the "no photo yet" case the plan
-- doc originally scoped this column for.
--
-- Gating also deviates from Part 6's Calls to Action on purpose (confirmed
-- with the user): any logged-in member can submit coverage, not just
-- experts/organisations, so there's no editorial-null-author case here
-- either — submitted_by is always a real user.
--
-- Otherwise same shape as brief_ctas (026): pending/published only status,
-- public/members read split gated on published + public brief, submitter
-- can always read their own row.
-- =============================================================

create table brief_coverage (
  id             uuid primary key default gen_random_uuid(),
  brief_id       uuid not null references briefs(id) on delete cascade,
  url            text not null,
  outlet_name    text not null,
  title          text not null,
  image_url      text,
  published_date date,
  submitted_by   uuid not null references users(id) on delete cascade,
  score          numeric,
  status         text not null default 'pending' check (status in ('pending', 'published')),
  created_at     timestamptz not null default now()
);

create index brief_coverage_brief_id_idx on brief_coverage (brief_id);
create index brief_coverage_status_idx on brief_coverage (status);

alter table brief_coverage enable row level security;

-- Public/members read split, gated on status = 'published' — same shape as
-- brief_ctas (026) / brief_faq_answers (021). Covered By is shown to
-- logged-out visitors on public briefs too (like CTAs), not members-only
-- like Community Q&A.
create policy "Anyone can read published coverage on public briefs"
  on brief_coverage
  for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1 from briefs
      where briefs.id = brief_coverage.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read published coverage"
  on brief_coverage
  for select
  to authenticated
  using (status = 'published');

-- A submitter can always see their own row regardless of status, so their
-- pending coverage doesn't just silently vanish from their own view.
create policy "Submitters can read their own coverage"
  on brief_coverage
  for select
  to authenticated
  using (auth.uid() = submitted_by);

-- Any logged-in member can submit coverage (unlike brief_ctas' expert/org-
-- only insert policy) — and only as pending, with score left null: score
-- is admin-only (set at approval time via the service role, which bypasses
-- RLS), and without this check a member could set an arbitrary score on
-- their own submission by calling the RLS-authenticated client directly
-- instead of going through submitCoverage (which never sets it either, but
-- RLS is the actual enforcement boundary, not the server action).
create policy "Members can insert their own pending coverage"
  on brief_coverage
  for insert
  to authenticated
  with check (
    auth.uid() = submitted_by
    and status = 'pending'
    and score is null
  );

-- ─── brief_coverage_likes ───────────────────────────────────────────────
-- De-duplicated liking, one row per (coverage, user) — same toggle shape
-- as question_votes (022, delete policy added in 025). Read is open to
-- anon too (unlike question_votes, which only needs authenticated read
-- since all of Community Q&A is members-only) — Covered By is visible to
-- logged-out visitors on public briefs, and like counts aren't sensitive.

create table brief_coverage_likes (
  id           uuid primary key default gen_random_uuid(),
  coverage_id  uuid not null references brief_coverage(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (coverage_id, user_id)
);

create index brief_coverage_likes_coverage_id_idx on brief_coverage_likes (coverage_id);

alter table brief_coverage_likes enable row level security;

create policy "Anyone can read coverage likes on public briefs"
  on brief_coverage_likes
  for select
  to anon
  using (
    exists (
      select 1 from brief_coverage
      join briefs on briefs.id = brief_coverage.brief_id
      where brief_coverage.id = brief_coverage_likes.coverage_id
        and brief_coverage.status = 'published'
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read coverage likes"
  on brief_coverage_likes
  for select
  to authenticated
  using (true);

create policy "Members can like coverage"
  on brief_coverage_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Members can remove their own coverage like"
  on brief_coverage_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

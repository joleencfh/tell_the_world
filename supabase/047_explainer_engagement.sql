-- =============================================================
-- Tell The World — Explainer engagement: contentious points, comments,
-- usefulness vote
-- Applied via the Supabase Management API (see
-- [[supabase_management_api_sql]] memory), not pasted into the SQL Editor.
--
-- Design ref: docs/design/brief-feature/brief-page-part2-plan.md Part 5
-- step 6, superseded by a signed-off design pass (Explainer Engagement
-- Options artifact, 2026-08-26): subsection-level review/endorse is
-- dropped (brief_contributions' sectionId usage on explainer rows stops;
-- the brief-level control is untouched) in favor of three section-level
-- mechanisms living once at the bottom of the whole Explainer, not
-- repeated per subsection:
--   1. Contentious points — expert/organisation only, moderated
--      (pending -> published) the same way brief_faq_answers (021) is.
--   2. Open comments — any logged-in member, immediate publish, no
--      moderation queue, same shape as brief_coverage_comments (045).
--   3. A "was this useful?" vote — creator/journalist only, one row per
--      user per brief, switchable.
-- The existing private "send feedback to moderators" mechanism
-- (brief_feedback, migration 034) needed no schema change: its `section`
-- column already accepts a loose caller-defined key, so an optional
-- subsection tag on a feedback message is encoded there at the app layer
-- (e.g. 'explainer:<subsection id>') rather than here.
-- =============================================================

-- ─── explainer_contentious_points ───────────────────────────────────────
-- subsection_label is a denormalized text snapshot taken at submit time
-- (from whichever subsection the author picked in the flag modal, or null
-- for a section-wide point), not a foreign key to brief_sections — the
-- same "fragile but accepted" tradeoff brief_faq_answers' question-text
-- matching already uses elsewhere in this schema, chosen so a later
-- subsection retitle/reorder/delete can't orphan or silently relabel a
-- published contentious point.

create table explainer_contentious_points (
  id               uuid primary key default gen_random_uuid(),
  brief_id         uuid not null references briefs(id) on delete cascade,
  author_user_id   uuid not null references users(id) on delete cascade,
  subsection_label text,
  body             text not null,
  status           text not null default 'pending' check (status in ('pending', 'published')),
  created_at       timestamptz not null default now()
);

create index explainer_contentious_points_brief_id_idx on explainer_contentious_points (brief_id);
create index explainer_contentious_points_status_idx on explainer_contentious_points (status);

alter table explainer_contentious_points enable row level security;

create policy "Anyone can read published contentious points on public briefs"
  on explainer_contentious_points
  for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1 from briefs
      where briefs.id = explainer_contentious_points.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read published contentious points"
  on explainer_contentious_points
  for select
  to authenticated
  using (status = 'published');

-- An author can always see their own submission regardless of status, so
-- their pending point doesn't just silently vanish from their own view —
-- same convenience brief_faq_answers gives its authors.
create policy "Authors can read their own contentious points"
  on explainer_contentious_points
  for select
  to authenticated
  using (auth.uid() = author_user_id);

-- Only experts and organisations, and only as pending — admin publishes
-- via the service role, which bypasses RLS, so no update policy is needed
-- here (mirrors brief_faq_answers' insert policy exactly).
create policy "Experts and orgs can flag their own contentious points"
  on explainer_contentious_points
  for insert
  to authenticated
  with check (
    auth.uid() = author_user_id
    and status = 'pending'
    and exists (
      select 1 from users
      where id = auth.uid()
        and role in ('expert', 'organisation')
    )
  );

-- ─── explainer_comments ──────────────────────────────────────────────────
-- Flat, section-level (brief_id only, no subsection reference) — comments
-- were deliberately scoped to the whole Explainer, not per subsection, in
-- the signed-off design. No moderation queue, same as brief_coverage_
-- comments (045): a comment posts immediately.

create table explainer_comments (
  id         uuid primary key default gen_random_uuid(),
  brief_id   uuid not null references briefs(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index explainer_comments_brief_id_idx on explainer_comments (brief_id);

alter table explainer_comments enable row level security;

create policy "Anyone can read explainer comments on public briefs"
  on explainer_comments
  for select
  to anon
  using (
    exists (
      select 1 from briefs
      where briefs.id = explainer_comments.brief_id
        and briefs.visibility = 'public'
    )
  );

-- No visibility gate for members — same "trust the app layer" shape as
-- brief_coverage_comments' matching policy (045); the /briefs/[slug] page
-- itself already restricts a members-only brief's sections from a
-- non-member's view.
create policy "Members can read explainer comments"
  on explainer_comments
  for select
  to authenticated
  using (true);

-- Any logged-in member — no role gate, unlike contentious points above.
create policy "Members can add explainer comments"
  on explainer_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── explainer_useful_votes ──────────────────────────────────────────────
-- One row per (brief, user) — a vote is switchable (up<->down) via update,
-- not delete-then-insert, mirroring brief_coverage_comment_votes' shape.
-- Restricted to creator/journalist: the roles this signal is meant to
-- represent (Explainer usefulness "for the person about to go make
-- something with this"), not experts/orgs, who have review/endorse for
-- their own trust signal instead.

create table explainer_useful_votes (
  id         uuid primary key default gen_random_uuid(),
  brief_id   uuid not null references briefs(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  is_useful  boolean not null,
  created_at timestamptz not null default now(),
  unique (brief_id, user_id)
);

create index explainer_useful_votes_brief_id_idx on explainer_useful_votes (brief_id);

alter table explainer_useful_votes enable row level security;

create policy "Anyone can read useful votes on public briefs"
  on explainer_useful_votes
  for select
  to anon
  using (
    exists (
      select 1 from briefs
      where briefs.id = explainer_useful_votes.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read useful votes"
  on explainer_useful_votes
  for select
  to authenticated
  using (true);

create policy "Creators and journalists can cast a useful vote"
  on explainer_useful_votes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users
      where id = auth.uid()
        and role in ('creator', 'journalist')
    )
  );

-- Switching the vote (useful <-> not useful) updates the existing row in
-- place, same one-round-trip shape as brief_coverage_comment_votes'
-- matching update policy.
create policy "Creators and journalists can change their own useful vote"
  on explainer_useful_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users
      where id = auth.uid()
        and role in ('creator', 'journalist')
    )
  );

create policy "Members can remove their own useful vote"
  on explainer_useful_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

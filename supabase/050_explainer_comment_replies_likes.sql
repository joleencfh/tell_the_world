-- =============================================================
-- Tell The World — Explainer comments: replies + likes
-- Applied via the Supabase Management API (see
-- [[supabase_management_api_sql]] memory).
--
-- Follow-up to 047: comments and contentious points were both dead ends —
-- nothing could respond to them. Design ref: Explainer Engagement Options
-- artifact, Option A adapted to a LinkedIn-style flat comment/reply shape
-- (confirmed with the user 2026-08-27) — replies are one level deep (a
-- "reply to a reply" just posts another flat reply under the same root,
-- there's no second indent), and every comment or reply — root or not —
-- can be liked.
--
-- One row shape covers three cases via two nullable, mutually exclusive
-- pointers:
--   parent_comment_id null,     contentious_point_id null      -> a root
--     Explainer comment (unchanged from 047)
--   parent_comment_id set,      contentious_point_id null      -> a reply
--     to that comment (always the root's own id, never another reply's —
--     enforced at the app layer, not RLS, same "trust the app" shape as
--     the loose `section` key on brief_feedback)
--   parent_comment_id null,     contentious_point_id set       -> a reply
--     to that contentious point
-- =============================================================

alter table explainer_comments
  add column parent_comment_id uuid references explainer_comments(id) on delete cascade,
  add column contentious_point_id uuid references explainer_contentious_points(id) on delete cascade,
  add constraint explainer_comments_one_parent_chk
    check (not (parent_comment_id is not null and contentious_point_id is not null));

create index explainer_comments_parent_comment_id_idx on explainer_comments (parent_comment_id);
create index explainer_comments_contentious_point_id_idx on explainer_comments (contentious_point_id);

-- ─── explainer_comment_likes ─────────────────────────────────────────────
-- One row per (comment, user) — a plain like/unlike toggle, same shape as
-- brief_coverage_likes, not directional like brief_coverage_comment_votes
-- (no "dislike" here, matching the rest of this feature's single-thumb
-- convention).

create table explainer_comment_likes (
  id         uuid primary key default gen_random_uuid(),
  comment_id uuid not null references explainer_comments(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index explainer_comment_likes_comment_id_idx on explainer_comment_likes (comment_id);

alter table explainer_comment_likes enable row level security;

create policy "Anyone can read explainer comment likes on public briefs"
  on explainer_comment_likes
  for select
  to anon
  using (
    exists (
      select 1 from explainer_comments
      join briefs on briefs.id = explainer_comments.brief_id
      where explainer_comments.id = explainer_comment_likes.comment_id
        and briefs.visibility = 'public'
    )
  );

-- No visibility gate for members — same "trust the app layer" shape as
-- explainer_comments' own matching read policy (047).
create policy "Members can read explainer comment likes"
  on explainer_comment_likes
  for select
  to authenticated
  using (true);

create policy "Members can like an explainer comment"
  on explainer_comment_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Members can remove their own explainer comment like"
  on explainer_comment_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================
-- Tell The World — Contentious points: likes
-- Applied via the Supabase Management API (see
-- [[supabase_management_api_sql]] memory).
--
-- Follow-up to 050: comments/replies got likes, contentious points didn't
-- (deliberately scoped that way at the time). The user asked for parity
-- (2026-08-27) — same plain like/unlike toggle, own table since a
-- contentious point isn't a row in explainer_comments.
-- =============================================================

create table explainer_contentious_point_likes (
  id                   uuid primary key default gen_random_uuid(),
  contentious_point_id uuid not null references explainer_contentious_points(id) on delete cascade,
  user_id              uuid not null references users(id) on delete cascade,
  created_at           timestamptz not null default now(),
  unique (contentious_point_id, user_id)
);

create index explainer_contentious_point_likes_point_id_idx on explainer_contentious_point_likes (contentious_point_id);

alter table explainer_contentious_point_likes enable row level security;

create policy "Anyone can read contentious point likes on public briefs"
  on explainer_contentious_point_likes
  for select
  to anon
  using (
    exists (
      select 1 from explainer_contentious_points
      join briefs on briefs.id = explainer_contentious_points.brief_id
      where explainer_contentious_points.id = explainer_contentious_point_likes.contentious_point_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read contentious point likes"
  on explainer_contentious_point_likes
  for select
  to authenticated
  using (true);

create policy "Members can like a contentious point"
  on explainer_contentious_point_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Members can remove their own contentious point like"
  on explainer_contentious_point_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

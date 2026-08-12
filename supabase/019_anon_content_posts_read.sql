-- =============================================================
-- Tell The World — Anon read access for Quotes/Media on public briefs
-- Run this in the Supabase SQL Editor.
--
-- The brief page's Quotes and Media sections (app/briefs/[slug]/page.tsx)
-- read content_posts via the RLS client so logged-out visitors can see
-- them on public briefs. 008_member_read_policies.sql only granted
-- "to authenticated", so anon visitors got zero rows and the sections
-- silently rendered empty (quotes.length > 0 gates the whole section).
--
-- content_posts has no visibility/status column — quotes and media
-- aren't brief-scoped or gated the way brief_sections are (013, 018),
-- so the anon policy is unconditional, mirroring 008's authenticated one.
--
-- The embedded author (content_posts.user_id -> users) also needs to be
-- readable by anon for the join to return rows at all (PostgREST embeds
-- via inner join by default). Unlike content_posts, users holds data
-- (email) that shouldn't go to anonymous API callers just because a
-- member posted a quote — so row access is opened to anon, but column
-- access is restricted with an explicit GRANT to only the fields the
-- Quotes/Media cards render (id, display_name, avatar_url, role,
-- affiliation, org_name). lib/data/posts.ts's queries were updated to
-- stop selecting email from this join so anon requests don't hit the
-- now-revoked column and fail with a permission error.
-- =============================================================

create policy "Anyone can read content posts"
  on content_posts
  for select
  to anon
  using (true);

revoke select on users from anon;

grant select (id, display_name, avatar_url, role, affiliation, org_name)
  on users to anon;

create policy "Anyone can read public author fields"
  on users
  for select
  to anon
  using (true);

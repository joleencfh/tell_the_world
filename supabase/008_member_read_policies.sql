-- =============================================================
-- Tell The World — Member read policies
-- Run this in the Supabase SQL Editor.
--
-- All approved members (any authenticated user) can read:
--   - all user profiles
--   - all briefs and brief sections
--   - all content posts
--
-- Members can also update and delete their own rows where relevant.
-- =============================================================

-- ─── users ────────────────────────────────────────────────────

-- Any logged-in member can read all user profiles (for directory, profile pages, etc.)
create policy "Members can read all users"
  on users
  for select
  to authenticated
  using (true);

-- Members can update their own profile row
create policy "Members can update own profile"
  on users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── briefs ───────────────────────────────────────────────────

-- Any logged-in member can read all briefs
create policy "Members can read all briefs"
  on briefs
  for select
  to authenticated
  using (true);

-- ─── brief_sections ───────────────────────────────────────────

-- Any logged-in member can read all brief sections
create policy "Members can read all brief sections"
  on brief_sections
  for select
  to authenticated
  using (true);

-- ─── content_posts ────────────────────────────────────────────

-- Any logged-in member can read all content posts
create policy "Members can read all content posts"
  on content_posts
  for select
  to authenticated
  using (true);

-- Members can insert their own posts
create policy "Members can insert own posts"
  on content_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Members can update their own posts
create policy "Members can update own posts"
  on content_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Members can delete their own posts
create policy "Members can delete own posts"
  on content_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

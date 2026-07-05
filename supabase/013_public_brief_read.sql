-- =============================================================
-- Tell The World — Public brief read policies
-- Run this in the Supabase SQL Editor.
--
-- The brief page previously fetched all content with the service
-- role and hid members-only sections in the UI only — the full
-- content was still present in the page source for logged-out
-- visitors. These policies let the page use the normal RLS client
-- instead, so the database enforces visibility:
--
--   - anyone (logged out) can read brief metadata — title and tldr
--     power the locked previews on the landing and brief pages
--   - logged-out visitors can only read sections of public briefs
--
-- Members keep full access via the existing policies in 008.
-- =============================================================

create policy "Anyone can read brief metadata"
  on briefs
  for select
  to anon
  using (true);

create policy "Anyone can read public brief sections"
  on brief_sections
  for select
  to anon
  using (
    exists (
      select 1 from briefs
      where briefs.id = brief_sections.brief_id
        and briefs.visibility = 'public'
    )
  );

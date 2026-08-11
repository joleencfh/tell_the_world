-- =============================================================
-- Tell The World — Fix anon TL;DR read on members-only briefs
-- Run this in the Supabase SQL Editor.
--
-- 013's "Anyone can read brief metadata" policy was written when
-- tldr was a plain column on briefs, so it powered the locked
-- preview for logged-out visitors on every brief regardless of
-- visibility. 017 moved tldr into a brief_sections row instead,
-- which only the "Anyone can read public brief sections" policy
-- covers — and that policy is scoped to visibility = 'public', so
-- logged-out visitors now get zero tldr rows on members_only
-- briefs. The teaser 013 describes never renders for those briefs.
--
-- Fix: grant anon SELECT on brief_sections specifically for
-- section_type = 'tldr' rows, regardless of the parent brief's
-- visibility — mirroring 013's original intent, scoped to just
-- the tldr row. Other section types stay gated by the existing
-- public-only policy from 017.
-- =============================================================

create policy "Anyone can read tldr sections"
  on brief_sections
  for select
  to anon
  using (section_type = 'tldr');

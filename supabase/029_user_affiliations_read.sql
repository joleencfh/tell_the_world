-- =============================================================
-- Tell The World — user_affiliations read policy
-- Run this in the Supabase SQL Editor.
--
-- user_affiliations had row level security enabled since 001 but never
-- got a select policy — 008_member_read_policies.sql covers users,
-- briefs, brief_sections, and content_posts, but this table was missed.
-- With RLS on and zero policies, every query (authenticated or anon)
-- silently returns zero rows rather than erroring.
--
-- Concretely this meant getEndorsementBarCounts's org-affiliation lookup
-- (lib/data/contributions.ts) could never produce a non-zero orgCount, so
-- the brief hero's "· N orgs" clause never appeared regardless of how
-- many real affiliations existed — caught while seeding mock review data
-- for the header (2026-08-14).
--
-- The table only holds a user_id/organisation_id link (plus a job title
-- override and a primary flag) — no PII — so, like content_posts (020),
-- it's safe to open to anon unconditionally rather than gating on
-- authenticated only: the brief hero's endorsement chip renders for
-- logged-out visitors too.
-- =============================================================

create policy "Anyone can read user affiliations"
  on user_affiliations
  for select
  to anon, authenticated
  using (true);

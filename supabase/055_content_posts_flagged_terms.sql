-- =============================================================
-- Tell The World — clarity-check flagged terms on content_posts
-- Applied via the Supabase Management API (see memory
-- supabase_management_api_sql.md), not pasted into the SQL Editor by hand.
--
-- Deterministic glossary-match clarity check (lib/clarity/check.ts):
-- expert/organisation submissions (profile posts via createPost, and
-- brief-scoped quotes via submitQuote) run the check both client-side (the
-- fix-it loop, lib/clarity/useClarityGate.ts) and server-side (defense in
-- depth — server actions are public HTTP endpoints). A clean check
-- publishes immediately; a flagged one is inserted as 'pending' with the
-- matched terms recorded here, so the admin reviewing it doesn't need the
-- check re-run to see why it was flagged. Populated only when status is
-- set to 'pending' by this feature — null on every unconditionally-
-- published row (createSourcedQuote's admin-authored quotes, admin's own
-- submissions, and every pre-existing row).
-- =============================================================

alter table content_posts
  add column flagged_terms jsonb;

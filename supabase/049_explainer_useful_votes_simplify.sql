-- =============================================================
-- Tell The World — Usefulness vote: simplify to a plain like
-- Applied via the Supabase Management API (see
-- [[supabase_management_api_sql]] memory).
--
-- Follow-up to 047/048: the design settled on a single thumbs-up, not a
-- two-directional useful/not-useful vote ("only vote in case of
-- usefulness, by clicking directly on the icon — no full-blown button
-- needed", confirmed with the user 2026-08-26). A row's mere presence now
-- means "found this useful" — same shape as brief_coverage_likes/
-- content_post_likes — so the is_useful column and the update policy that
-- let a voter switch direction are both dead. Existing rows (including
-- the mock "not useful" votes seeded on the AI Alignment brief) become
-- plain likes, which is exactly what the approved design mockup shows
-- (a single combined count).
-- =============================================================

drop policy "Creators, journalists, and admin can change their own useful vote" on explainer_useful_votes;

alter table explainer_useful_votes drop column is_useful;

-- =============================================================
-- Tell The World — extend anon column grant on users to job_title
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 1 step 2): the reviewers modal's expert credential line
-- ("Job Title, Affiliation") needs job_title. 020_anon_content_posts_read.sql
-- already opened `affiliation` to anon but not `job_title`, so
-- getEndorsementBar's embedded users(...) select — which anon visitors hit
-- on the logged-out brief page — silently failed and zeroed out the whole
-- Reviewed/Endorsed button. job_title is the same class of public
-- professional info as affiliation (already shown to logged-out visitors
-- on the landing page's "Trusted by" section), so it's added to the same
-- grant rather than treated differently.
-- =============================================================

grant select (job_title) on users to anon;

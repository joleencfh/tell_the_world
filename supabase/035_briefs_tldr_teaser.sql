-- =============================================================
-- Tell The World — briefs.tldr_teaser
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 3 step 1): replaces the hardcoded, inaccurate TL;DR
-- SECTION_META description ("The three-minute version") with a
-- per-brief, content-specific one-liner — the reference artifact's
-- actual pattern (e.g. "Three races, conflated constantly — the skim
-- version"), not a time estimate.
--
-- Nullable: a brief without one set falls back to the old generic
-- string in the app layer (BriefView.tsx), confirmed with the user
-- rather than showing a blank description.
-- =============================================================

alter table briefs add column tldr_teaser text;

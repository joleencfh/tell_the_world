-- =============================================================
-- Tell The World — users.channel_name
-- Run this in the Supabase SQL Editor (or via the Management API).
--
-- Part 7 (brief-page-part2-plan.md §2 step 2): creators have
-- primary_platform (an enum: youtube/podcast/instagram/tiktok/other) and
-- platform_url, but no short display name for their channel/show — the
-- only options today are rendering the raw platform enum ("Youtube") or
-- the bare URL. Confirmed with the user (2026-08-22): add a proper field
-- rather than continuing to render just the platform name. Shared with
-- journalists too, since EditProfileModal.tsx's "Content" section is
-- already shared between the two roles for primary_platform/platform_url —
-- left optional and independent of publication_name (journalists' existing
-- equivalent field), not merged with it, so publication_name's existing
-- data and behavior are untouched.
-- =============================================================

alter table users add column channel_name text;

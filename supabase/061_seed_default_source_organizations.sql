-- =============================================================
-- Tell The World — Seed default organization logos
-- Applied via the Supabase Management API (see memory
-- supabase_management_api_sql.md), not pasted into the SQL Editor by hand.
--
-- Ships one default so quotes attributed to OpenAI (quote_source 'ai' or
-- 'document', Organization field "OpenAI") get a real logo out of the box
-- instead of needing an admin to upload one on first use. logo_url points
-- at a static asset (public/Icons/chat-gpt.png, supplied 2026-09-03) rather
-- than the source-logos storage bucket — same-origin, so 060's CSP-allowed
-- img-src list doesn't need touching, and it ships with the app instead of
-- needing a separate upload step. on conflict is keyed on name_key (060's
-- generated lower(trim(name)) column) so re-running this migration is safe.
-- =============================================================

insert into source_organizations (name, logo_url)
values ('OpenAI', '/Icons/chat-gpt.png')
on conflict (name_key) do update set logo_url = excluded.logo_url;

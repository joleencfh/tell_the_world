-- =============================================================
-- Tell The World — Attribute quotes to non-platform-members
-- Applied via the Supabase Management API (see memory
-- supabase_management_api_sql.md), not pasted into the SQL Editor by hand.
--
-- Admins can now attribute a quote to a person who isn't a platform member,
-- a document/report, or an AI model — not just a real users row. user_id
-- becomes nullable; quote_source discriminates the four cases; source_name/
-- source_detail hold the free-text attribution for the three non-member
-- cases; the existing (previously unused by the Quotes UI) url column
-- becomes the required source link for them. The check constraint keeps
-- every existing row and every other post_type exactly as guaranteed
-- today (quote_source defaults to 'member', which requires user_id).
-- =============================================================

alter table content_posts
  alter column user_id drop not null;

alter table content_posts
  add column quote_source text not null default 'member'
    check (quote_source in ('member', 'person', 'document', 'ai')),
  add column source_name text,
  add column source_detail text;

alter table content_posts
  add constraint content_posts_quote_attribution_check check (
    (quote_source = 'member' and user_id is not null)
    or (quote_source <> 'member' and source_name is not null and url is not null)
  );

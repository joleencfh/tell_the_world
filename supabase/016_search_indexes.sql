-- =============================================================
-- Tell The World — Search & lookup indexes
-- Run this in the Supabase SQL Editor.
--
-- The directory search uses ILIKE '%term%' on several text columns, which is
-- a sequential scan without an index — fine at tens of users, slow at
-- thousands. pg_trgm GIN indexes make substring/ILIKE matching index-backed.
-- The btree indexes cover the equality/order filters on the hot query paths
-- (admin queues, brief Q&A, quote listing, messages).
--
-- All indexes are created IF NOT EXISTS so this migration is idempotent.
-- =============================================================

create extension if not exists pg_trgm;

-- ─── Directory people search (searchUsers .or ILIKE) ──────────────────────
create index if not exists users_display_name_trgm on users using gin (display_name gin_trgm_ops);
create index if not exists users_bio_trgm          on users using gin (bio gin_trgm_ops);
create index if not exists users_affiliation_trgm  on users using gin (affiliation gin_trgm_ops);
create index if not exists users_org_name_trgm     on users using gin (org_name gin_trgm_ops);

-- Directory filters (role / language / availability) and areas_of_focus contains
create index if not exists users_role_idx             on users (role);
create index if not exists users_content_language_idx on users (content_language);
create index if not exists users_areas_of_focus_gin   on users using gin (areas_of_focus);

-- ─── Quote search (searchQuotes ILIKE body, post_type = 'quote') ───────────
create index if not exists content_posts_body_trgm       on content_posts using gin (body gin_trgm_ops);
create index if not exists content_posts_type_created_idx on content_posts (post_type, created_at desc);
create index if not exists content_posts_user_id_idx      on content_posts (user_id);
create index if not exists content_posts_topic_tags_gin   on content_posts using gin (topic_tags);

-- ─── Admin queues & moderation (status filters, created order) ─────────────
create index if not exists applications_status_created_idx  on applications (status, created_at);
create index if not exists questions_brief_status_idx       on questions (brief_id, status);
create index if not exists brief_contributions_status_idx   on brief_contributions (status);
create index if not exists brief_proposals_status_idx       on brief_proposals (status);

-- ─── Brief page & relations ───────────────────────────────────────────────
create index if not exists brief_sections_brief_id_idx      on brief_sections (brief_id);
create index if not exists user_affiliations_user_idx       on user_affiliations (user_id);
create index if not exists user_affiliations_org_idx        on user_affiliations (organisation_id);

-- ─── Contact requests ─────────────────────────────────────────────────────
create index if not exists messages_recipient_idx on messages (recipient_id);
create index if not exists messages_sender_idx    on messages (sender_id);

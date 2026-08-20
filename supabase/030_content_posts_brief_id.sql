-- =============================================================
-- Tell The World — content_posts.brief_id
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 0a): lets a quote/take be explicitly attached to a specific
-- brief (Part 4's "+ Add quote"), distinct from the existing topic-tag
-- matching (getQuotesByTopicTag in lib/data/posts.ts stays as-is — this
-- is additive, not a replacement).
--
-- content_posts schema re-audited fresh against the original 5-type spec
-- (001_initial_schema.sql) before this migration: post_type enum is still
-- exactly {video, article, paper, quote, resource}, no drift.
-- =============================================================

alter table content_posts
  add column brief_id uuid references briefs(id) on delete set null;

-- Nullable: brief_id set null on brief deletion (matching
-- pinned_media_post_id's on delete set null in 017), never cascades — a
-- brief being deleted shouldn't delete a quote/take that lives on
-- independently via topic-tag matching too.

create index content_posts_brief_id_idx on content_posts (brief_id);

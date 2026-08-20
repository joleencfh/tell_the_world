-- =============================================================
-- Tell The World — briefs.topic_tag → briefs.topic_tags
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 0a step 3): a brief can carry more than one topic tag, mirroring
-- content_posts.topic_tags (already text[], GIN-indexed since 016). This
-- is schema + data-layer only — BriefView.tsx's hero still reads a single
-- tag until Part 1's multi-tag row update; lib/data/briefs.ts and
-- lib/admin/brief-actions.ts keep exposing a derived singular topic_tag
-- (first element) for those UI call sites in the meantime, tracked with a
-- TODO(Part 1) comment at each spot — see that plan part's step 4.
--
-- Null → empty array (not a one-element array of null), so the new
-- array-overlap queries (getQuotesByTopicTag, getRelatedBriefs) can
-- short-circuit / naturally match nothing without a null check, same as
-- content_posts.topic_tags' own not-null-default-'{}' shape.
-- =============================================================

alter table briefs add column topic_tags text[] not null default '{}';

update briefs
set topic_tags = case
  when topic_tag is not null and topic_tag <> '' then array[topic_tag]
  else '{}'
end;

alter table briefs drop column topic_tag;

create index briefs_topic_tags_gin on briefs using gin (topic_tags);

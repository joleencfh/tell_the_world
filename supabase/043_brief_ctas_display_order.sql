-- =============================================================
-- Tell The World — brief_ctas.display_order
-- Applied via the Supabase Management API (see
-- [[supabase_management_api_sql]] memory), not the SQL Editor.
--
-- brief-page-part2-plan.md §2, Part 8: admin manual reorder/pin to
-- highlight. Default ordering (getPublishedCtas: created_at descending)
-- is unchanged — display_order is nullable and only overrides that
-- default when an admin explicitly sets it, so every existing row keeps
-- behaving exactly as before this migration. Nulls sort last; a lower
-- number promotes a CTA earlier in the carousel.
-- =============================================================

alter table brief_ctas add column display_order int;

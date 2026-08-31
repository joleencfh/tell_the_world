-- =============================================================
-- Tell The World — briefs.dashboard_featured
--
-- Home dashboard Two-Ink Bold rebuild, Part 1
-- (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md §2, Part 1
-- step 1) — admin-curated "Highlighted" brief on the home dashboard
-- (option (a), confirmed with the user over option (b) per-user
-- personalization). Nullable rather than not-null-default-false so the
-- common "no brief chosen yet" state has no row to update — every brief
-- just starts with dashboard_featured null until an admin opts one in.
-- =============================================================

alter table briefs
  add column dashboard_featured boolean;

-- At most one true row at a time. A plain boolean column can't express
-- that on its own — this partial unique index does: only rows where the
-- column is true participate in the uniqueness check, so any number of
-- null/false rows coexist freely.
create unique index briefs_dashboard_featured_unique
  on briefs (dashboard_featured)
  where dashboard_featured;

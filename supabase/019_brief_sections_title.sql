-- =============================================================
-- Tell The World — Explainer subsection titles
-- Run this in the Supabase SQL Editor.
--
-- Two-Ink Bold plan Part 3 (docs/design/brief-feature/two-ink-bold-plan.md
-- §3): lets the admin editor author multiple titled Explainer subsections
-- per brief instead of one untitled block. Nullable and generic across all
-- section_types (not just 'explainer') since it's a plain column, not a
-- type-specific one — other section types simply leave it null for now.
-- No RLS changes needed: brief_sections' existing row-level policies
-- (008, 013) already govern the whole row, and this isn't a
-- column-grants setup (that's Phase 3, still not built).
-- =============================================================

alter table brief_sections add column title text;

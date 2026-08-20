-- =============================================================
-- Tell The World — briefs.last_reviewed_at auto-write
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 1 step 3): briefs.last_reviewed_at existed and BriefView.tsx
-- already rendered it conditionally, but nothing ever wrote to it —
-- setReviewStatus (lib/briefs/actions.ts) only ever touched
-- brief_contributions.
--
-- Implemented as a trigger rather than a write inside setReviewStatus:
-- setReviewStatus runs on the contributor's own RLS session, and briefs
-- has no UPDATE policy for non-admin users (013_public_brief_read.sql
-- only grants SELECT) — a plain application-code write would be silently
-- dropped by RLS. A SECURITY DEFINER trigger bypasses that the same way
-- service-role writes do elsewhere, and stays correct regardless of which
-- code path inserts/updates a review or endorsement row (the admin
-- dashboard, a future bulk-import, etc.), not just this one call site.
-- =============================================================

create or replace function update_brief_last_reviewed_at()
returns trigger as $$
begin
  if new.status = 'published' and new.type in ('review', 'endorsement') then
    update briefs set last_reviewed_at = now() where id = new.brief_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger brief_contributions_last_reviewed_at
  after insert or update on brief_contributions
  for each row execute function update_brief_last_reviewed_at();

-- =============================================================
-- Tell The World — brief_proposals conversion flow
-- Applied via the Supabase Management API (see the
-- supabase_management_api_sql memory) rather than the SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 10) + Notion Story "Admin: convert a brief proposal into a new
-- brief" — lets an admin turn an accepted brief_proposals row into a real
-- brief (or link one they wrote separately), and notifies the submitter.
--
-- published_brief_id: set once the proposal has been converted/linked —
-- this is also the trigger the submitter-notification email fires on.
-- minor_changes_flag: admin-set context for that email ("largely what you
-- pitched" vs "reshaped along the way") — no other reader depends on it.
-- status: widened from pending/dismissed to pending/approved/declined so
-- "converted"/"linked" is representable; existing 'dismissed' rows become
-- 'declined' (same meaning, wording aligned with the new enum).
-- =============================================================

alter table brief_proposals
  add column published_brief_id uuid references briefs(id) on delete set null,
  add column minor_changes_flag boolean not null default false;

update brief_proposals set status = 'declined' where status = 'dismissed';

alter table brief_proposals
  drop constraint brief_proposals_status_check,
  add constraint brief_proposals_status_check
    check (status in ('pending', 'approved', 'declined'));

create index brief_proposals_published_brief_id_idx on brief_proposals (published_brief_id);

-- Submitters need to read their own proposals (any status) for the home
-- dashboard status card — no select policy existed before this migration,
-- only the insert policy from 014.
create policy "Members can view own brief proposals"
  on brief_proposals
  for select
  to authenticated
  using (auth.uid() = user_id);

-- The public Contributors list (BriefView.tsx hero) needs to read resolved,
-- linked proposals regardless of viewer — but only the converted/linked
-- rows, never raw pending/declined submissions.
create policy "Anyone can view converted brief proposals"
  on brief_proposals
  for select
  to anon, authenticated
  using (status = 'approved' and published_brief_id is not null);

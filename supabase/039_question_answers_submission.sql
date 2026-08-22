-- =============================================================
-- Tell The World — Community Q&A: answer submission flow
-- Run this in the Supabase SQL Editor (or via the Management API).
--
-- Part 7 (brief-page-part2-plan.md §2): question_answers has existed since
-- migration 024, but deliberately shipped with no submission flow — that
-- migration's own header comment flagged it as deferred work (two-ink-
-- bold-plan.md's Part 5b), admin/seed-content only, written via the
-- service role. This migration adds the propose-then-pending shape
-- brief_faq_answers already uses (migration 021): pending → published via
-- admin approval; expert/organisation submissions insert via RLS as
-- pending; admin's own submission bypasses straight to published via the
-- service-role client (same shape submitCta uses for brief_ctas,
-- lib/briefs/actions.ts) rather than widening this policy to include admin.
-- =============================================================

alter table question_answers
  add column status text not null default 'pending' check (status in ('pending', 'published'));

-- Backfill: every row that predates this column was written via the
-- service role for admin/seed content (migration 024's own comment) —
-- treat it all as already published so nothing already-visible vanishes.
update question_answers set status = 'published';

create index question_answers_status_idx on question_answers (status);

-- Replace the old "read everything" policy — Q&A stays members-only, no
-- anon policy needed (mirrors questions' own read policy, migration 011)
-- — now gated on status = 'published' like brief_faq_answers.
drop policy "Members can read question answers" on question_answers;

create policy "Members can read published question answers"
  on question_answers
  for select
  to authenticated
  using (status = 'published');

-- An author can always see their own pending submission, so it doesn't
-- just silently vanish from their own view (mirrors brief_faq_answers'
-- equivalent policy).
create policy "Authors can read their own question answers"
  on question_answers
  for select
  to authenticated
  using (auth.uid() = author_user_id);

-- Only experts and organisations can submit answers via RLS, and only as
-- pending — admin's own submission goes through the service role instead
-- (bypasses RLS, publishes immediately), so no admin case is needed here.
create policy "Experts and orgs can insert their own question answers"
  on question_answers
  for insert
  to authenticated
  with check (
    auth.uid() = author_user_id
    and status = 'pending'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role in ('expert', 'organisation')
    )
  );

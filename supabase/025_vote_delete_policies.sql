-- =============================================================
-- Tell The World — allow removing one's own Community Q&A vote
-- Run this in the Supabase SQL Editor.
--
-- voteQuestion/voteAnswer (lib/briefs/actions.ts) only ever inserted a
-- vote row (upsert with ignoreDuplicates) — there was no way to undo one,
-- so the upvote button got permanently stuck "on" once clicked (reported
-- 2026-08-13). Fixed by making the button a true toggle: insert if no row
-- exists, delete if one does. That delete needs its own RLS policy — the
-- insert-only policies from migration 024 don't cover it.
-- =============================================================

create policy "Members can remove their own question vote"
  on question_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Members can remove their own answer vote"
  on question_answer_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

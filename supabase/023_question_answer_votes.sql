-- =============================================================
-- Tell The World — Community Q&A: separate votes on the question and
-- on the answer
-- Run this in the Supabase SQL Editor.
--
-- Follow-up to migration 022 (Two-Ink Bold plan Part 5), requested
-- 2026-08-13: a vote on the question ("this is a good/important
-- question") and a vote on the answer ("this answer was helpful") are
-- now distinct signals, separate from the expert-only Endorse signal
-- ("this answer is accurate"). Existing rows all meant a vote on the
-- question, so they backfill to target='question'.
-- =============================================================

alter table question_votes
  add column target text not null default 'question' check (target in ('question', 'answer'));

alter table question_votes drop constraint question_votes_question_id_user_id_key;
alter table question_votes add constraint question_votes_question_id_user_id_target_key
  unique (question_id, user_id, target);

-- =============================================================
-- Tell The World — Community Q&A: flat answer list per question
-- Run this in the Supabase SQL Editor.
--
-- Follow-up to migrations 022/023, requested 2026-08-13: a question can
-- now have multiple answers (a flat list — no threading/replies on an
-- answer), each independently likeable (any member) and endorsable
-- (expert/organisation). This replaces the single answer_text/answered_by
-- columns on questions, which never had a real write path, and moves
-- endorsement + one flavor of voting from being question-scoped to
-- answer-scoped, since "this answer is accurate/helpful" is a property of
-- a specific answer, not the question.
--
-- Deliberately NOT included here: a submission flow for question_answers.
-- There is no UI yet for anyone to insert a row — that's tracked as a
-- separate, deferred piece of work (two-ink-bold-plan.md's Part 5b). This
-- table is admin/seed-content only for now, written via the service role,
-- which bypasses RLS — no insert policy needed yet.
-- =============================================================

alter table questions drop column answer_text;
alter table questions drop column answered_by;

-- question_votes goes back to being a pure "vote on the question" table —
-- answer votes get their own table below now that answers are real rows,
-- so the target column from migration 023 is no longer needed.
alter table question_votes drop constraint question_votes_question_id_user_id_target_key;
alter table question_votes drop column target;

-- This feature's own verification scripts left test rows voting under both
-- the old 'question' and 'answer' targets for the same (question_id,
-- user_id) pair — collapsing into duplicates now that target is gone.
-- Dedupe before the 2-column unique constraint can be added. Safe: this
-- table has no real user data yet, only test/seed rows.
delete from question_votes a
using question_votes b
where a.id > b.id
  and a.question_id = b.question_id
  and a.user_id = b.user_id;

alter table question_votes add constraint question_votes_question_id_user_id_key unique (question_id, user_id);

-- The old question-scoped endorsement table is replaced by an
-- answer-scoped one below.
drop table question_endorsements;

-- ─── question_answers — flat list, no threading ─────────────────────────

create table question_answers (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references questions(id) on delete cascade,
  author_user_id uuid not null references users(id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now()
);

create index question_answers_question_id_idx on question_answers (question_id);

alter table question_answers enable row level security;

-- Members-only read, matching the original "questions" table's shape
-- before its own submission/approval flow existed (migration 010).
create policy "Members can read question answers"
  on question_answers
  for select
  to authenticated
  using (true);

-- ─── question_answer_votes — "this answer was helpful", any member ─────

create table question_answer_votes (
  id         uuid primary key default gen_random_uuid(),
  answer_id  uuid not null references question_answers(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (answer_id, user_id)
);

create index question_answer_votes_answer_id_idx on question_answer_votes (answer_id);

alter table question_answer_votes enable row level security;

create policy "Members can read answer votes"
  on question_answer_votes
  for select
  to authenticated
  using (true);

create policy "Members can vote on answers"
  on question_answer_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── question_answer_endorsements — "this answer is accurate", expert/org only ─

create table question_answer_endorsements (
  id         uuid primary key default gen_random_uuid(),
  answer_id  uuid not null references question_answers(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (answer_id, user_id)
);

create index question_answer_endorsements_answer_id_idx on question_answer_endorsements (answer_id);

alter table question_answer_endorsements enable row level security;

create policy "Members can read answer endorsements"
  on question_answer_endorsements
  for select
  to authenticated
  using (true);

-- Same pattern as brief_contributions' insert policy in migration 017.
create policy "Experts and orgs can endorse answers"
  on question_answer_endorsements
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users
      where id = auth.uid()
      and role in ('expert', 'organisation')
    )
  );

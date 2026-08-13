-- =============================================================
-- Tell The World — Community Q&A: votes and expert endorsements
-- Run this in the Supabase SQL Editor.
--
-- Two-Ink Bold plan Part 5 (docs/design/brief-feature/two-ink-bold-plan.md
-- §3, Part 5): adds a member vote count and an expert/organisation
-- endorsement to each answered question, plus the answered_by column
-- migration 011 left out.
-- =============================================================

alter table questions add column answered_by uuid references users(id);

-- ─── question_votes ─────────────────────────────────────────────────────
-- Any logged-in member can vote once per question — one row per
-- (question, user), enforced by the unique constraint so a repeat click
-- is a no-op upsert rather than a second vote.

create table question_votes (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (question_id, user_id)
);

create index question_votes_question_id_idx on question_votes (question_id);

alter table question_votes enable row level security;

-- Read is unrestricted across all authenticated members, same shape as
-- the "Members can read questions" policy this table hangs off of (010) —
-- counts and who-voted-what aren't sensitive.
create policy "Members can read question votes"
  on question_votes
  for select
  to authenticated
  using (true);

create policy "Members can vote on questions"
  on question_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── question_endorsements ──────────────────────────────────────────────
-- Same shape as question_votes, but insert is restricted to expert/
-- organisation roles — same pattern as brief_contributions' insert policy
-- in migration 017.

create table question_endorsements (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (question_id, user_id)
);

create index question_endorsements_question_id_idx on question_endorsements (question_id);

alter table question_endorsements enable row level security;

create policy "Members can read question endorsements"
  on question_endorsements
  for select
  to authenticated
  using (true);

create policy "Experts and orgs can endorse questions"
  on question_endorsements
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

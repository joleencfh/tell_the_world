-- =============================================================
-- Tell The World — Questions table
-- Run this in the Supabase SQL Editor.
--
-- Stores member questions on briefs, with optional admin answers.
-- =============================================================

create table questions (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid not null references briefs(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  question_text text not null,
  answer_text   text,
  created_at    timestamptz not null default now()
);

alter table questions enable row level security;

-- Any authenticated member can read all questions
create policy "Members can read questions"
  on questions
  for select
  to authenticated
  using (true);

-- Members can submit their own questions
create policy "Members can insert own questions"
  on questions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Admins can update questions (to add or edit answers)
create policy "Admins can update questions"
  on questions
  for update
  to authenticated
  using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

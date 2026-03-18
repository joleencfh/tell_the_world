-- =============================================================
-- Tell The World — Questions approval flow
-- Run this in the Supabase SQL Editor.
--
-- Adds a status column to questions so members can submit
-- questions for review, and only approved questions are visible.
-- =============================================================

-- Add status column (pending by default, approved when admin approves)
alter table questions
  add column status text not null default 'pending'
  check (status in ('pending', 'approved'));

-- Update member read policy: only show approved questions
drop policy if exists "Members can read questions" on questions;

create policy "Members can read approved questions"
  on questions
  for select
  to authenticated
  using (status = 'approved');

-- Admin can read all questions (including pending) — used from service role
-- (service role bypasses RLS, so no additional policy needed for admin client)

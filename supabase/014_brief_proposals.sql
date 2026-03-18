-- ─── Brief proposals ────────────────────────────────────────────────────────
-- Stores proposals for new briefs submitted by members via the modal.
-- Run this in the Supabase SQL editor.

create table brief_proposals (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references users(id) on delete set null,
  submitter_name  text        not null,
  submitter_email text        not null,
  topic_title     text        not null,
  why_it_matters  text        not null,
  from_brief_title text,
  status          text        not null default 'pending'
                              check (status in ('pending', 'dismissed')),
  created_at      timestamptz not null default now()
);

alter table brief_proposals enable row level security;

-- Only the service-role key (admin) can read or modify proposals.
-- Regular members have no access — they only submit via the server action.
-- (No authenticated policy needed: the proposeBrief action uses the regular
--  client to INSERT, relying on the policy below.)

-- Members can insert their own proposals
create policy "Members can submit brief proposals"
  on brief_proposals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

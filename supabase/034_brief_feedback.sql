-- =============================================================
-- Tell The World — Brief feedback
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 0c): a single shared "send feedback to moderators" mechanism,
-- reused by five later parts (Contribute menu, TL;DR, Explainer ×2, FAQ)
-- instead of building it five times. Dedicated table rather than
-- repurposing `messages` — that table's shape assumes a specific human
-- recipient (recipient_id not null), which doesn't fit "feedback to
-- moderators in general"; forcing a fake recipient would muddy its
-- existing contact-request semantics.
--
-- `section` is a loose, free-form key (e.g. 'tldr', 'faq:<question
-- text>', 'explainer:<section id>', or null for brief-level feedback with
-- no specific section) — same fragile-but-accepted text-matching
-- convention already used by brief_faq_answers (021). Each of the five
-- call sites decides its own key shape; this table doesn't enforce one.
--
-- user_id is required: submitting feedback requires being logged in
-- (confirmed with the user — unlike content_usage's logged-out-allowed
-- copy events, this channel is attributable). No role gate beyond that —
-- any signed-in member can submit, not just experts/organisations.
--
-- status is new/reviewed only (no approve/dismiss/publish) — nothing here
-- is ever published to the public page, it's purely an admin queue.
-- =============================================================

create table brief_feedback (
  id         uuid primary key default gen_random_uuid(),
  brief_id   uuid not null references briefs(id) on delete cascade,
  section    text,
  user_id    uuid not null references users(id) on delete cascade,
  body       text not null,
  status     text not null default 'new' check (status in ('new', 'reviewed')),
  created_at timestamptz not null default now()
);

create index brief_feedback_brief_id_idx on brief_feedback (brief_id);
create index brief_feedback_status_idx on brief_feedback (status);

alter table brief_feedback enable row level security;

-- Authenticated only — with check prevents a caller from submitting
-- feedback under someone else's user_id.
create policy "Members can submit brief feedback"
  on brief_feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- No select policy: this is an admin-only moderation queue, read via the
-- service role client (lib/supabase/admin.ts), which bypasses RLS. RLS is
-- still enabled so a future read policy has to be added deliberately
-- rather than the table defaulting to open.

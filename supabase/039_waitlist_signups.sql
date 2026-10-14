-- =============================================================
-- Tell The World — Waitlist signups
-- Applied via the Supabase Management API (see
-- memory:supabase_management_api_sql), not pasted into the SQL Editor.
--
-- docs/design/landing-page/plans/temp-landing-page-plan.md §2, Part 1: the
-- silent-launch landing page's "Join Waitlist" form lands here. Separate
-- table from `applications` — the waitlist's fields and review need are
-- lighter (a list to glance at, not the existing multi-stage
-- approve/reject pipeline). `role` reuses the existing `user_role` enum
-- rather than a separate set of values so a signed-up row can later
-- convert directly into a real `users` row without a manual mapping
-- step (the UI labels `expert` as "AI safety expert interested in
-- comms" — only the label differs, not the stored value).
--
-- Unique index on lower(email): the submit action (Part 2) turns a
-- constraint violation into a friendly "you're already on the list"
-- message rather than a raw DB error.
--
-- No select policy: this is an admin-only list, read via the
-- service-role client (lib/supabase/admin.ts), same convention as
-- brief_feedback (034). RLS is enabled anyway so a future read policy
-- has to be added deliberately.
-- =============================================================

create table waitlist_signups (
  id                       uuid primary key default gen_random_uuid(),
  role                     user_role not null,
  email                    text not null,
  full_name                text not null,
  affiliation              text,
  linkedin_or_website_url  text,
  additional_info          text,
  created_at               timestamptz not null default now()
);

create unique index waitlist_signups_email_idx on waitlist_signups (lower(email));

alter table waitlist_signups enable row level security;

-- Anyone (including logged-out visitors on the silent-launch page) can
-- join the waitlist. Mirrors 003_applications_rls.sql's shape — no
-- with check needed here since there's no status field to protect.
create policy "Anyone can join the waitlist"
  on waitlist_signups
  for insert
  to anon, authenticated
  with check (true);

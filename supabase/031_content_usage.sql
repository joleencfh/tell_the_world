-- =============================================================
-- Tell The World — content_usage
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 0a step 2): records when a quote/take's text is copied (Part
-- 4's copy button, both the card-level one and the detail-view one).
-- Logged-out copies still count (user_id nullable) — this is just the
-- copy-event log; no "where did you publish it" field yet (that needs a
-- reporting UI, out of scope for this part per the plan doc).
--
-- No read policy: nothing reads this table in this part. RLS is still
-- enabled so a future read policy has to be added deliberately rather
-- than the table defaulting to open.
-- =============================================================

create table content_usage (
  id              uuid primary key default gen_random_uuid(),
  content_post_id uuid not null references content_posts(id) on delete cascade,
  user_id         uuid references users(id) on delete set null,
  used_at         timestamptz not null default now()
);

create index content_usage_content_post_id_idx on content_usage (content_post_id);

alter table content_usage enable row level security;

-- Open to anyone, including logged-out visitors — same to anon,
-- authenticated shape as applications (003). with check prevents an
-- authenticated caller from logging a copy event under someone else's
-- user_id; anon requests have auth.uid() = null, so they must (and can
-- only) log with user_id = null.
create policy "Anyone can log a content usage event"
  on content_usage
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

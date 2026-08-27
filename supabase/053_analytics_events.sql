-- Basic activity/analytics event log: who logs in and when, plus a first
-- cut of the main interaction events (questions, comments, likes, brief
-- views). Insert-only, admin-only reads — no RLS policies are added, so
-- the default-deny leaves this table reachable only through the
-- service-role client (lib/supabase/admin.ts), same as every other
-- admin-only table in this project.
--
-- dedupe_key is only set for brief_viewed events (one row per user per
-- brief per day); every other event_type leaves it null.

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('login', 'question_submitted', 'comment_submitted', 'like_added', 'brief_viewed')),
  user_id uuid references users(id) on delete set null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create index analytics_events_created_at_idx on analytics_events (created_at desc);
create index analytics_events_event_type_idx on analytics_events (event_type, created_at desc);
create index analytics_events_user_id_idx on analytics_events (user_id, created_at desc);

alter table analytics_events enable row level security;

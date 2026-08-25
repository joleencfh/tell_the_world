-- =============================================================
-- Tell The World — Brief timeline events
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 5 step 2): a custom event timeline graphic for the Explainer
-- section, confirmed net-new. Dedicated table rather than a new
-- brief_sections type — this is structured data (a name + a date per
-- row), not prose, so it doesn't fit the existing line-prefix authoring
-- conventions (FAQ/Sources) the other section types use.
--
-- display_order is the sole ordering field (not event_date) — same
-- author-controls-the-order convention as brief_sections/explainer
-- subsections (move up/down in the admin editor), rather than
-- auto-sorting by date. event_date is data shown alongside the event
-- name, not used for sorting.
--
-- Public/members read split, same shape as brief_sections (013 + 008):
-- anon can read events on public briefs, any authenticated member can
-- read all of them. No insert/update/delete policy for regular users —
-- admin manages these via the service role client (lib/supabase/admin.ts),
-- same as brief_sections itself.
-- =============================================================

create table brief_timeline_events (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid not null references briefs(id) on delete cascade,
  event_name    text not null,
  event_date    date not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create index brief_timeline_events_brief_id_idx on brief_timeline_events (brief_id);

alter table brief_timeline_events enable row level security;

create policy "Anyone can read timeline events on public briefs"
  on brief_timeline_events
  for select
  to anon
  using (
    exists (
      select 1 from briefs
      where briefs.id = brief_timeline_events.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read all timeline events"
  on brief_timeline_events
  for select
  to authenticated
  using (true);

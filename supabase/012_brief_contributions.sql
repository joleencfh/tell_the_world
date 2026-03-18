-- =============================================================
-- Tell The World — Brief contributions
-- Run this in the Supabase SQL Editor.
--
-- Experts and organisations can propose corrections/additions
-- to a brief. Contributions are reviewed by the admin before
-- being published on the contributor's profile.
-- =============================================================

create table brief_contributions (
  id                uuid primary key default gen_random_uuid(),
  brief_id          uuid not null references briefs(id) on delete cascade,
  user_id           uuid not null references users(id) on delete cascade,
  contribution_text text not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'dismissed')),
  created_at        timestamptz not null default now()
);

alter table brief_contributions enable row level security;

-- All authenticated members can see approved contributions (for profile pages)
create policy "Members can read approved contributions"
  on brief_contributions
  for select
  to authenticated
  using (status = 'approved');

-- Contributors can also see their own pending/dismissed contributions
-- (so they show up on their own profile with a status badge)
create policy "Contributors can read own contributions"
  on brief_contributions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Only experts and organisations can submit
create policy "Experts and orgs can insert contributions"
  on brief_contributions
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

-- Admins update via service role (bypasses RLS) — no policy needed

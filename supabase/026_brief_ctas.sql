-- =============================================================
-- Tell The World — Calls to Action
-- Run this in the Supabase SQL Editor.
--
-- Two-Ink Bold plan Part 6 (docs/design/brief-feature/two-ink-bold-plan.md
-- §3, Part 6): a new brief section where experts/organisations can suggest
-- a call to action (a link with a title/description/button label),
-- moderated by the admin before it appears on the brief. Tell The World can
-- also author a CTA editorially — author_user_id is nullable for that case,
-- inserted directly as 'published' via the service role, bypassing the
-- pending queue entirely (no UI for it, same as contested_points).
--
-- Same shape as brief_faq_answers (021): pending/published only status,
-- public/members read split gated on published + public brief, author can
-- always read their own row, expert/org insert their own pending row.
-- =============================================================

create table brief_ctas (
  id             uuid primary key default gen_random_uuid(),
  brief_id       uuid not null references briefs(id) on delete cascade,
  author_user_id uuid references users(id) on delete cascade,
  title          text not null,
  description    text,
  link_url       text not null,
  link_label     text not null default 'Read',
  status         text not null default 'pending' check (status in ('pending', 'published')),
  created_at     timestamptz not null default now()
);

create index brief_ctas_brief_id_idx on brief_ctas (brief_id);
create index brief_ctas_status_idx on brief_ctas (status);

alter table brief_ctas enable row level security;

-- Public/members read split, gated on status = 'published' — same shape as
-- brief_faq_answers (021) / brief_contributions (017).
create policy "Anyone can read published ctas on public briefs"
  on brief_ctas
  for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1 from briefs
      where briefs.id = brief_ctas.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read published ctas"
  on brief_ctas
  for select
  to authenticated
  using (status = 'published');

-- An author can always see their own submission regardless of status, so
-- their pending CTA doesn't just silently vanish from their own view.
-- Never matches editorial rows (author_user_id null), which is correct —
-- those are only ever inserted as 'published' anyway.
create policy "Authors can read their own ctas"
  on brief_ctas
  for select
  to authenticated
  using (auth.uid() = author_user_id);

-- Only experts and organisations can submit CTAs, and only as pending —
-- admin publishes via the service role, which bypasses RLS, so no update
-- policy is needed here.
create policy "Experts and orgs can insert their own ctas"
  on brief_ctas
  for insert
  to authenticated
  with check (
    auth.uid() = author_user_id
    and status = 'pending'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role in ('expert', 'organisation')
    )
  );

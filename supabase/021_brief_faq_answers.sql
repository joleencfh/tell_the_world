-- =============================================================
-- Tell The World — FAQ: multiple expert answers
-- Run this in the Supabase SQL Editor.
--
-- Two-Ink Bold plan Part 4b (docs/design/brief-feature/two-ink-bold-plan.md,
-- the section between Part 4 and Part 5): lets experts/organisations submit
-- additional answers to an existing FAQ item, moderated by the admin before
-- they're shown under a "More answers (N)" toggle.
--
-- FAQ items aren't rows — they're Q:/A: pairs parsed out of one
-- brief_sections.content text blob (parseFAQ in section-content.tsx), so
-- there's no stable id to hang a foreign key off. This table keys off
-- (brief_id, question) instead, matching the question's exact parsed text.
-- Deliberately fragile: if an admin edits a question's wording, previously
-- submitted answers under the old wording become orphaned — an accepted
-- tradeoff (see the plan doc), not a bug to fix here.
-- =============================================================

create table brief_faq_answers (
  id             uuid primary key default gen_random_uuid(),
  brief_id       uuid not null references briefs(id) on delete cascade,
  question       text not null,
  author_user_id uuid not null references users(id) on delete cascade,
  body           text not null,
  status         text not null default 'pending' check (status in ('pending', 'published')),
  created_at     timestamptz not null default now()
);

create index brief_faq_answers_brief_question_idx on brief_faq_answers (brief_id, question);
create index brief_faq_answers_status_idx on brief_faq_answers (status);

alter table brief_faq_answers enable row level security;

-- Public/members read split, gated on status = 'published' — same shape as
-- brief_contributions in migration 017.
create policy "Anyone can read published faq answers on public briefs"
  on brief_faq_answers
  for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1 from briefs
      where briefs.id = brief_faq_answers.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read published faq answers"
  on brief_faq_answers
  for select
  to authenticated
  using (status = 'published');

-- An author can always see their own submission regardless of status, so
-- their pending answer doesn't just silently vanish from their own view.
create policy "Authors can read their own faq answers"
  on brief_faq_answers
  for select
  to authenticated
  using (auth.uid() = author_user_id);

-- Only experts and organisations can submit answers, and only as pending —
-- admin publishes via the service role, which bypasses RLS, so no update
-- policy is needed here.
create policy "Experts and orgs can insert their own faq answers"
  on brief_faq_answers
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

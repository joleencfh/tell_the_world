-- =============================================================
-- Tell The World — FAQ per-question metadata: collaborators, feedback
-- givers, rich-text answer override
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 6): the primary FAQ answer (parsed from brief_sections'
-- Q:/A: content) renders with zero byline and no way to record who
-- collaborated on it or gave feedback on it. Like brief_faq_answers
-- (migration 021), FAQ items aren't rows with a stable id — they're
-- Q:/A: pairs parsed out of one content blob — so this keys off
-- (brief_id, question) too. Same accepted fragility: renaming a question
-- in the admin editor detaches this row from it.
--
-- Purely admin-authored (unlike brief_faq_answers, which is a user-
-- submission moderation queue) — no insert/update policy for any other
-- role, admin writes via the service-role client only (lib/admin/
-- brief-actions.ts's saveBrief).
-- =============================================================

create table brief_faq_meta (
  id                       uuid primary key default gen_random_uuid(),
  brief_id                 uuid not null references briefs(id) on delete cascade,
  question                 text not null,
  collaborator_user_ids    uuid[] not null default '{}',
  feedback_giver_user_ids  uuid[] not null default '{}',
  answer_rich_content      jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index brief_faq_meta_brief_question_idx on brief_faq_meta (brief_id, question);

alter table brief_faq_meta enable row level security;

create trigger brief_faq_meta_updated_at
  before update on brief_faq_meta
  for each row execute function update_updated_at();

-- Public/members read split, same shape as brief_sections (013 + 008) —
-- this is informational content on the brief page (the triple-dot "info"
-- panel and the rich-text answer override), available to the same
-- audience as the section it annotates.
create policy "Anyone can read faq meta on public briefs"
  on brief_faq_meta
  for select
  to anon
  using (
    exists (
      select 1 from briefs
      where briefs.id = brief_faq_meta.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read all faq meta"
  on brief_faq_meta
  for select
  to authenticated
  using (true);

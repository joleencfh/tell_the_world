-- =============================================================
-- Tell The World — Brief feature v2 schema
-- Run this in the Supabase SQL Editor.
--
-- Companion to docs/design/brief-feature/brief-feature-design.md.
-- This migration only lays the schema (build order §10 step 1):
--   1. Renames the existing free-text "propose a correction" table
--      out of the way (brief_contributions → brief_correction_proposals)
--      so the design doc's polymorphic contribution table can use the
--      name the doc specifies.
--   2. Amends briefs (subtitle, last_reviewed_at, topic_tag,
--      pinned_media_post_id) and drops tldr after backfilling it into
--      a brief_sections row (see step 4).
--   3. Swaps brief_section_type to the new 7-value enum (a true type
--      swap, not an additive ALTER TYPE ADD VALUE, since Postgres
--      cannot drop enum values) and adds content_version.
--   4. Backfills a `tldr` section per brief from the old briefs.tldr
--      column, then drops that column.
--   5. Creates contested_points (design doc §3.2).
--   6. Creates the new brief_contributions (design doc §3.3), with
--      the partial unique indexes from §3.3 rule 1 and RLS split
--      across public/member read, contributor insert, and two
--      separate update paths — admin moderation of comment/take
--      status (via service role, no policy needed, same convention
--      as the rest of this schema) and contributor self-service
--      updates to their own review/endorsement rows (reconfirm,
--      upgrade to endorsement, self-withdraw per §3.3 rule 3 / §7.1).
--
-- Not covered here: the ~7 TS files that reference the old
-- brief_contributions table name, or lib/database.types.ts
-- regeneration — both follow as a separate pass.
-- =============================================================

-- ─── 1. Rename the existing free-text contribution table ──────────────────

alter table brief_contributions rename to brief_correction_proposals;

alter table brief_correction_proposals
  rename constraint brief_contributions_pkey to brief_correction_proposals_pkey;
alter table brief_correction_proposals
  rename constraint brief_contributions_brief_id_fkey to brief_correction_proposals_brief_id_fkey;
alter table brief_correction_proposals
  rename constraint brief_contributions_user_id_fkey to brief_correction_proposals_user_id_fkey;
alter table brief_correction_proposals
  rename constraint brief_contributions_status_check to brief_correction_proposals_status_check;

alter index brief_contributions_status_idx rename to brief_correction_proposals_status_idx;

-- ─── 2. briefs amendments ───────────────────────────────────────────────

alter table briefs add column subtitle text;
alter table briefs add column last_reviewed_at timestamptz;

-- Needed for the auto quotes/media sections (design doc §2 rows 7–8) —
-- content_posts.topic_tags already exists and is already GIN-indexed
-- (016), but briefs had nothing to match it against. Not listed in the
-- design doc's §3.1, added here to close that gap.
alter table briefs add column topic_tag text;

-- Needed for the "one author-pinned pick" in the Media section (design
-- doc §2 row 8). Also not listed in §3.1.
alter table briefs add column pinned_media_post_id uuid references content_posts(id) on delete set null;

-- ─── 3. brief_section_type: full enum type swap ────────────────────────
-- Postgres enums cannot drop values, so "replaces the previous four-value
-- enum" (design doc §3.1) is done as a real type swap rather than
-- additive ALTER TYPE ADD VALUE, to avoid leaving three retired values
-- permanently in the type.

create type brief_section_type_new as enum (
  'tldr',
  'use_this',
  'featured_news',
  'explainer',
  'where_experts_stand',
  'going_deeper',
  'faq'
);

alter table brief_sections add column section_type_new brief_section_type_new;

-- Data remapping: recent_developments → featured_news (content is dated
-- events narrative, not evergreen explainer prose — confirmed against
-- live brief_sections content before writing this migration).
-- sources_basic / sources_advanced → going_deeper per design doc §3.1.
update brief_sections
set section_type_new = case section_type
  when 'recent_developments' then 'featured_news'::brief_section_type_new
  when 'sources_basic'       then 'going_deeper'::brief_section_type_new
  when 'sources_advanced'    then 'going_deeper'::brief_section_type_new
  when 'faq'                 then 'faq'::brief_section_type_new
end;

alter table brief_sections alter column section_type_new set not null;
alter table brief_sections drop column section_type;
alter table brief_sections rename column section_type_new to section_type;

drop type brief_section_type;
alter type brief_section_type_new rename to brief_section_type;

-- content_version is an author-controlled integer, bumped only by a
-- "substantive change" toggle in app code (design doc §3.1, §4) — no
-- trigger here, existing rows default to 1.
alter table brief_sections add column content_version integer not null default 1;

-- ─── 4. Backfill tldr sections, then retire briefs.tldr ────────────────
-- The design doc introduces `tldr` as a brief_sections type (a 3–5
-- sentence quotable block) distinct from the new `subtitle` column
-- (one sentence). briefs.tldr is retired in favor of the new section,
-- seeded from today's value so no content is lost.

insert into brief_sections (brief_id, section_type, content, display_order)
select id, 'tldr', tldr, 0
from briefs;

alter table briefs drop column tldr;

-- ─── 5. contested_points (design doc §3.2) ──────────────────────────────

create table contested_points (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid not null references briefs(id) on delete cascade,
  question      text not null,
  display_order integer not null,
  created_at    timestamptz not null default now()
);

create index contested_points_brief_id_idx on contested_points (brief_id, display_order);

alter table contested_points enable row level security;

-- Same public/members split as brief_sections (013 / 008): logged-out
-- visitors see contested points only on public briefs, members see all.
create policy "Anyone can read contested points of public briefs"
  on contested_points
  for select
  to anon
  using (
    exists (
      select 1 from briefs
      where briefs.id = contested_points.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read all contested points"
  on contested_points
  for select
  to authenticated
  using (true);

-- Points are author-created only (design doc §3.2) — admin inserts via
-- service role, which bypasses RLS. No insert/update/delete policy needed.

-- ─── 6. brief_contributions (design doc §3.3) ───────────────────────────

create type brief_contribution_type as enum ('review', 'endorsement', 'take', 'comment');
create type brief_contribution_status as enum ('pending', 'published', 'archived');

create table brief_contributions (
  id                 uuid primary key default gen_random_uuid(),
  brief_id           uuid not null references briefs(id) on delete cascade,
  section_id         uuid references brief_sections(id) on delete cascade,
  contested_point_id uuid references contested_points(id) on delete cascade,
  user_id            uuid not null references users(id) on delete cascade,
  type               brief_contribution_type not null,
  body               text,
  section_version    integer,
  status             brief_contribution_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Shape rules per type (review/endorsement/take/comment — which FKs and
-- fields apply to which) are enforced in app code, not the DB, per
-- design doc §3.3 ("enforced in app code; the DB stays simple").

create trigger brief_contributions_updated_at
  before update on brief_contributions
  for each row execute function update_updated_at();

-- One review/endorsement row per (user, target) — design doc §3.3 rule 1.
-- Endorsement is an upgrade of an existing review row (type changes in
-- place), never a second insert, so these indexes also guard against
-- double-counting in the endorsement bar query (§8).
create unique index brief_contributions_user_section_unique
  on brief_contributions (user_id, section_id)
  where type in ('review', 'endorsement') and section_id is not null;

create unique index brief_contributions_user_brief_unique
  on brief_contributions (user_id, brief_id)
  where type in ('review', 'endorsement') and section_id is null;

create index brief_contributions_brief_id_idx           on brief_contributions (brief_id);
create index brief_contributions_section_id_idx         on brief_contributions (section_id);
create index brief_contributions_contested_point_id_idx on brief_contributions (contested_point_id);
create index brief_contributions_user_id_idx            on brief_contributions (user_id);
create index brief_contributions_status_idx             on brief_contributions (status);

alter table brief_contributions enable row level security;

-- Public/members read split, same shape as contested_points above, but
-- also gated on status = 'published' — stale or pending rows never leak
-- (design doc §5.4, §6.2: only current, published contributions count
-- or display). Not explicit in the design doc whether contribution
-- visibility should mirror brief visibility for logged-out readers;
-- following the established pattern from 013 for consistency.
create policy "Anyone can read published contributions on public briefs"
  on brief_contributions
  for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1 from briefs
      where briefs.id = brief_contributions.brief_id
        and briefs.visibility = 'public'
    )
  );

create policy "Members can read published contributions"
  on brief_contributions
  for select
  to authenticated
  using (status = 'published');

-- A contributor can always see their own rows regardless of status —
-- mirrors the existing "see your own pending work" pattern from the
-- brief_correction_proposals table this replaces.
create policy "Contributors can read own contributions"
  on brief_contributions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Only experts and organisations can contribute (design doc §1, §11).
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

-- Two distinct update paths:
--   - Admin moderates comment/take status (pending → published) and
--     archives addressed comments (§3.3 rule 4, §5.4) via the service
--     role, which bypasses RLS — no policy needed, same convention as
--     the rest of this schema.
--   - A contributor updates their OWN review/endorsement row to
--     reconfirm (re-pin section_version, §3.3 rule 3), upgrade review
--     to endorsement (§5.1), or self-withdraw (status = 'archived',
--     §7.1). This path is scoped to review/endorsement only — comments
--     and takes are never self-editable after submission, matching the
--     "moderation, not authorship" framing in §5.4.
create policy "Contributors can update their own review or endorsement"
  on brief_contributions
  for update
  to authenticated
  using (auth.uid() = user_id and type in ('review', 'endorsement'))
  with check (auth.uid() = user_id and type in ('review', 'endorsement'));

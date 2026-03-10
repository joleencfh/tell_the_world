-- =============================================================
-- Tell The World — Initial Schema
-- Run this in Supabase SQL Editor
-- =============================================================

-- ─── Enums ────────────────────────────────────────────────────

create type user_role as enum ('creator', 'expert', 'organisation', 'journalist', 'admin');
create type availability_status as enum ('open', 'limited', 'unavailable');
create type primary_platform as enum ('youtube', 'podcast', 'instagram', 'tiktok', 'other');
create type org_size as enum ('small', 'medium', 'large');
create type brief_visibility as enum ('public', 'members_only');
create type brief_section_type as enum ('recent_developments', 'sources_basic', 'sources_advanced', 'faq');
create type application_status as enum ('pending', 'approved', 'rejected');
create type application_role as enum ('creator', 'expert', 'organisation', 'journalist');
create type post_type as enum ('video', 'article', 'paper', 'quote', 'resource');
create type message_status as enum ('pending', 'accepted', 'declined');

-- ─── Users ────────────────────────────────────────────────────

create table users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text unique not null,
  full_name           text not null,
  display_name        text not null,
  bio                 text,
  avatar_url          text,
  role                user_role not null,
  availability        availability_status not null default 'open',
  website_url         text,
  preferred_language  text not null default 'en',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- creator / journalist fields
  primary_platform    primary_platform,
  platform_url        text,
  audience_size       integer,
  content_language    text,
  publication_name    text,
  publication_url     text,
  reporting_beat      text,

  -- expert fields
  affiliation         text,
  job_title           text,
  credibility_url     text,
  areas_of_focus      text[],

  -- organisation fields
  org_name            text,
  org_size            org_size,
  org_mission         text
);

-- ─── User Affiliations ────────────────────────────────────────

create table user_affiliations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  organisation_id     uuid not null references users(id) on delete cascade,
  job_title_override  text,
  is_primary          boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Briefs ───────────────────────────────────────────────────

create table briefs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  tldr        text not null,
  visibility  brief_visibility not null default 'members_only',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table brief_sections (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid not null references briefs(id) on delete cascade,
  section_type  brief_section_type not null,
  content       text not null,
  display_order integer not null,
  updated_at    timestamptz not null default now()
);

-- ─── Applications ─────────────────────────────────────────────

create table applications (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  email             text not null,
  desired_role      application_role not null,
  bio               text not null,
  website_url       text,
  status            application_status not null default 'pending',
  admin_notes       text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),

  -- role-specific fields
  primary_platform  text,
  platform_url      text,
  audience_size     integer,
  content_language  text,
  publication_name  text,
  publication_url   text,
  reporting_beat    text,
  affiliation       text,
  credibility_url   text,
  org_name          text,
  org_mission       text
);

-- ─── Content Posts ────────────────────────────────────────────

create table content_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  body        text,
  url         text,
  post_type   post_type not null,
  topic_tags  text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Messages ─────────────────────────────────────────────────

create table messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references users(id) on delete cascade,
  recipient_id  uuid not null references users(id) on delete cascade,
  subject       text not null,
  body          text not null,
  status        message_status not null default 'pending',
  sender_role   text not null,
  created_at    timestamptz not null default now(),
  replied_at    timestamptz
);

-- ─── Translations ─────────────────────────────────────────────
-- Included in schema for v2 multilingual support. Not populated in v1.

create table translations (
  id                   uuid primary key default gen_random_uuid(),
  entity_type          text not null,
  entity_id            uuid not null,
  field_name           text not null,
  language             text not null,
  translated_text      text not null,
  is_machine_translated boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (entity_type, entity_id, field_name, language)
);

-- ─── updated_at trigger ───────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger user_affiliations_updated_at
  before update on user_affiliations
  for each row execute function update_updated_at();

create trigger briefs_updated_at
  before update on briefs
  for each row execute function update_updated_at();

create trigger brief_sections_updated_at
  before update on brief_sections
  for each row execute function update_updated_at();

create trigger content_posts_updated_at
  before update on content_posts
  for each row execute function update_updated_at();

create trigger translations_updated_at
  before update on translations
  for each row execute function update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
-- Enable RLS on all tables. Policies will be added when building features.

alter table users enable row level security;
alter table user_affiliations enable row level security;
alter table briefs enable row level security;
alter table brief_sections enable row level security;
alter table applications enable row level security;
alter table content_posts enable row level security;
alter table messages enable row level security;
alter table translations enable row level security;

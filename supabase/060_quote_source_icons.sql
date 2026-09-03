-- =============================================================
-- Tell The World — Specific icons for non-member quote sources
-- Applied via the Supabase Management API (see memory
-- supabase_management_api_sql.md), not pasted into the SQL Editor by hand.
--
-- Two additions on top of 052_content_posts_external_quote_attribution.sql's
-- generic person/document/ai icons:
--
-- 1. source_platform — an optional platform tag for 'person'-sourced quotes
--    (a quote pulled from a social media post is still attributed to a
--    person via the existing flow; this just says which platform it came
--    from so the card can show that platform's icon instead of the generic
--    person glyph). Loosely scoped to 'person' by convention only — not
--    worth a cross-column check for a purely cosmetic field.
--
-- 2. source_organizations — reusable company logos for document/ai-sourced
--    quotes (e.g. every quote attributed to "OpenAI" reuses the same
--    uploaded logo instead of re-uploading it each time). name_key is the
--    case-insensitive matching key; logo_url points at the source-logos
--    storage bucket. Writes are admin-only via the service-role client
--    (mirrors brief/coverage moderation tables elsewhere), so no insert/
--    update RLS policy is needed — only public read.
-- =============================================================

alter table content_posts
  add column source_platform text
    check (source_platform is null or source_platform in ('x', 'linkedin'));

create table source_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text generated always as (lower(trim(name))) stored unique,
  logo_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger source_organizations_updated_at
  before update on source_organizations
  for each row execute function update_updated_at();

alter table source_organizations enable row level security;

create policy "Organization logos are publicly readable"
  on source_organizations for select
  using (true);

alter table content_posts
  add column source_org_id uuid references source_organizations(id) on delete set null;

insert into storage.buckets (id, name, public)
values ('source-logos', 'source-logos', true)
on conflict (id) do nothing;

create policy "Source logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'source-logos');

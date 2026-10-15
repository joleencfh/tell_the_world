-- Add missing journalist fields to applications table
alter table applications
  add column if not exists publication_url  text,
  add column if not exists reporting_beat   text;

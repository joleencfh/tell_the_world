-- Add missing journalist fields to applications table
alter table applications
  add column publication_url  text,
  add column reporting_beat   text;

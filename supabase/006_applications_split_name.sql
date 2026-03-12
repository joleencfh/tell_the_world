-- Split the single full_name column into first_name + last_name so that
-- emails can greet applicants by first name. full_name is kept and will be
-- populated by the form as "first last" for admin convenience.

alter table applications
  add column first_name text,
  add column last_name  text;

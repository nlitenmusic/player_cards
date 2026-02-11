-- Add name and affiliation fields to coach_requests
BEGIN;

ALTER TABLE IF EXISTS public.coach_requests
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS affiliation text;

COMMIT;

-- Note: run this migration in Supabase SQL editor as a project admin.

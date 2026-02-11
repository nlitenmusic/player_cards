-- Drop the legacy `message` column from coach_requests
BEGIN;

ALTER TABLE IF EXISTS public.coach_requests
  DROP COLUMN IF EXISTS message;

COMMIT;

-- Run this migration in the Supabase SQL editor as a project admin.

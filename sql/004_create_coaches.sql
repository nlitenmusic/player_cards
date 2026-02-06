-- Create coaches table to store coach profiles linked to auth users
BEGIN;

CREATE TABLE IF NOT EXISTS public.coaches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  bio text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches (user_id);

COMMIT;

-- Note: run this in Supabase SQL editor as a project admin. Ensure pgcrypto or uuid-ossp is enabled for gen_random_uuid() or change to uuid_generate_v4().

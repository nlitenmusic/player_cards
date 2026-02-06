-- Create coach_requests table to capture coach access requests from users
BEGIN;

CREATE TABLE IF NOT EXISTS public.coach_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  requester_email text,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_requests_requester_id ON public.coach_requests (requester_id);

COMMIT;

-- Note: run this in Supabase SQL editor as a project admin. Ensure pgcrypto extension is enabled for gen_random_uuid().

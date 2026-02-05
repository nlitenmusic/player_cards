-- Create claim_requests table for manual claim workflow
BEGIN;

CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id bigint NOT NULL,
  requester_id uuid,
  requester_email text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_requests_player_id ON public.claim_requests (player_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_requester_id ON public.claim_requests (requester_id);

COMMIT;

-- Note: run this in Supabase SQL editor as a project admin. Ensure the extension pgcrypto is enabled for gen_random_uuid() or change to uuid_generate_v4().

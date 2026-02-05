-- Create player_access table to allow multiple users to be granted access to a player
BEGIN;

CREATE TABLE IF NOT EXISTS public.player_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id bigint NOT NULL,
  user_id uuid NOT NULL,
  granted_by uuid,
  granted_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_access_player_user ON public.player_access (player_id, user_id);

COMMIT;

-- Note: run this in Supabase SQL editor as a project admin. Ensure the extension pgcrypto is enabled for gen_random_uuid() or change to uuid_generate_v4().

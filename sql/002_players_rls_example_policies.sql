-- Example RLS policies for the `players` table.
-- IMPORTANT: adapt the predicates to your schema (ownership column names, team tables, admin roles, etc.).
-- Run this in the Supabase SQL editor as a privileged user.

BEGIN;

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.players
  ENABLE ROW LEVEL SECURITY;

-- Example 1: allow the player owner to UPDATE only their own row
-- Replace `user_id` with the column that stores the owner's auth.uid()
CREATE POLICY IF NOT EXISTS "Players: owner can update"
  ON public.players
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Example 2: allow users in a coach/team relationship to update player rows
-- Adapt the EXISTS() predicate to your team membership schema.
-- CREATE POLICY IF NOT EXISTS "Players: team coaches can update"
--   ON public.players
--   FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.team_members tm
--       WHERE tm.team_id = players.team_id
--         AND tm.user_id = auth.uid()
--         AND tm.role = 'coach'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.team_members tm
--       WHERE tm.team_id = players.team_id
--         AND tm.user_id = auth.uid()
--         AND tm.role = 'coach'
--     )
--   );

-- Example 3: allow admins (if you maintain an 'is_admin' boolean on auth.users via custom claims)
-- CREATE POLICY IF NOT EXISTS "Players: admins can update"
--   ON public.players
--   FOR UPDATE
--   TO authenticated
--   USING (current_setting('jwt.claims.is_admin', true) = 'true')
--   WITH CHECK (current_setting('jwt.claims.is_admin', true) = 'true');

COMMIT;

-- Notes:
-- - Replace `user_id`, `team_members`, `team_id`, and other identifiers to match your schema.
-- - Test each policy in the Supabase SQL editor by attempting updates with different users.

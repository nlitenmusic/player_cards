-- Allow any authenticated user to INSERT (upload) objects into the 'avatars' bucket.
-- Run this in the Supabase SQL editor (or psql against your DB) as a privileged user.

-- Ensure the storage schema is present
-- (Supabase's storage.objects table is part of the extension; these statements target that table.)

/*
  This policy allows any authenticated user to INSERT rows into storage.objects
  only for the 'avatars' bucket. It does not remove DB-level validation in your
  application — you should still validate ownership/permissions in the players table.
*/

BEGIN;

-- Remove any conflicting INSERT policy first (optional)
-- DROP POLICY IF EXISTS allow_authenticated_uploads ON storage.objects;

CREATE POLICY IF NOT EXISTS allow_authenticated_uploads
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
  );

-- Optionally allow authenticated reads (SELECT) from the bucket
CREATE POLICY IF NOT EXISTS allow_authenticated_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
  );

COMMIT;

-- Notes:
-- 1) If you want avatar URLs to be public via `getPublicUrl()` you still need
--    to set the bucket to public in the Supabase UI, or use signed URLs.
-- 2) If you prefer to restrict who can read files, remove the SELECT policy
--    and generate signed URLs server-side instead.

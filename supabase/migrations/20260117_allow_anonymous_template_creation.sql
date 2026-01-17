-- Allow anonymous template creation for Canva app
-- This updates the RLS policy to allow both authenticated and anonymous users to create templates

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own templates" ON app_template_pages;

-- Create a new policy that allows both authenticated users and anonymous users
CREATE POLICY "Users can insert templates"
  ON app_template_pages
  FOR INSERT
  WITH CHECK (
    -- Allow authenticated users to insert with their own user_id
    (auth.uid() = user_id)
    OR
    -- Allow anonymous users to insert with NULL user_id
    (user_id IS NULL)
  );

-- Update the update and delete policies to handle NULL user_id
DROP POLICY IF EXISTS "Users can update their own templates" ON app_template_pages;
DROP POLICY IF EXISTS "Users can delete their own templates" ON app_template_pages;

-- Allow users to update their own templates (authenticated users only)
-- Anonymous templates (user_id IS NULL) can be updated by anyone
CREATE POLICY "Users can update templates"
  ON app_template_pages
  FOR UPDATE
  USING (
    (auth.uid() = user_id)
    OR
    (user_id IS NULL)
  );

-- Allow users to delete their own templates (authenticated users only)
-- Anonymous templates (user_id IS NULL) can be deleted by anyone
CREATE POLICY "Users can delete templates"
  ON app_template_pages
  FOR DELETE
  USING (
    (auth.uid() = user_id)
    OR
    (user_id IS NULL)
  );

-- Create template pages table for Canva app
-- This table stores page templates that can be reused to generate new pages

CREATE TABLE IF NOT EXISTS app_template_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  page_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_template_pages_user_id
  ON app_template_pages(user_id);

CREATE INDEX IF NOT EXISTS idx_app_template_pages_created_at
  ON app_template_pages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE app_template_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to read all templates (for template marketplace/sharing)
CREATE POLICY "Templates are viewable by everyone"
  ON app_template_pages
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own templates
CREATE POLICY "Users can insert their own templates"
  ON app_template_pages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own templates
CREATE POLICY "Users can update their own templates"
  ON app_template_pages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own templates
CREATE POLICY "Users can delete their own templates"
  ON app_template_pages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE app_template_pages IS 'Stores Canva page templates with static/dynamic element configuration';

-- Add comments to important columns
COMMENT ON COLUMN app_template_pages.page_config IS 'JSONB structure containing dimensions, background, elements array, tokenDefinitions, and missingTokenBehavior';
COMMENT ON COLUMN app_template_pages.preview_image_url IS 'Optional preview image URL for template thumbnail';

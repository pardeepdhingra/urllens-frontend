-- ============================================================================
-- URL Lens - Social Preview Table Migration
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- Create the social preview table
CREATE TABLE IF NOT EXISTS url_social_preview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  metadata JSONB NOT NULL,
  platform_preview JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_social_preview_user_id ON url_social_preview(user_id);
CREATE INDEX IF NOT EXISTS idx_social_preview_created_at ON url_social_preview(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_preview_url ON url_social_preview(url);

-- Enable Row Level Security
ALTER TABLE url_social_preview ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own social preview data
CREATE POLICY "Users can view own social previews"
  ON url_social_preview
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own social preview data
CREATE POLICY "Users can insert own social previews"
  ON url_social_preview
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own social preview data
CREATE POLICY "Users can delete own social previews"
  ON url_social_preview
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE url_social_preview IS 'Stores social media preview analysis results for URLs';

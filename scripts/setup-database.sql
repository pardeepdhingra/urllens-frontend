-- =============================================================================
-- URL Lens - Database Setup Script for Supabase
-- =============================================================================
-- Run this in your Supabase SQL Editor to set up the database schema
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- -----------------------------------------------------------------------------
-- Create url_analyses table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS url_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for guest analyses
  url TEXT NOT NULL,
  final_url TEXT,
  status_code INTEGER,
  redirect_count INTEGER DEFAULT 0,
  redirects JSONB DEFAULT '[]'::jsonb,
  response_time_ms INTEGER,
  content_type TEXT,
  js_required BOOLEAN DEFAULT false,
  bot_protections JSONB DEFAULT '[]'::jsonb,
  headers JSONB DEFAULT '{}'::jsonb,
  robots_txt JSONB,
  rate_limit_info JSONB,
  utm_analysis JSONB,
  visual_analysis JSONB,
  share_id TEXT UNIQUE,
  score INTEGER DEFAULT 0,
  recommendation TEXT,
  is_guest BOOLEAN DEFAULT false, -- Flag for guest analyses
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Create indexes for better query performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_url_analyses_user_id ON url_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_url_analyses_created_at ON url_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_analyses_share_id ON url_analyses(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_url_analyses_url ON url_analyses(url);

-- -----------------------------------------------------------------------------
-- Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE url_analyses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies
-- -----------------------------------------------------------------------------

-- Policy: Users can view their own analyses
CREATE POLICY "Users can view own analyses"
  ON url_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON url_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON url_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON url_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Anyone can view shared analyses (by share_id)
CREATE POLICY "Anyone can view shared analyses"
  ON url_analyses
  FOR SELECT
  USING (share_id IS NOT NULL);

-- -----------------------------------------------------------------------------
-- Add columns if they don't exist (for existing installations)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- Add headers column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'headers') THEN
    ALTER TABLE url_analyses ADD COLUMN headers JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add robots_txt column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'robots_txt') THEN
    ALTER TABLE url_analyses ADD COLUMN robots_txt JSONB;
  END IF;

  -- Add rate_limit_info column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'rate_limit_info') THEN
    ALTER TABLE url_analyses ADD COLUMN rate_limit_info JSONB;
  END IF;

  -- Add visual_analysis column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'visual_analysis') THEN
    ALTER TABLE url_analyses ADD COLUMN visual_analysis JSONB;
  END IF;

  -- Add utm_analysis column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'utm_analysis') THEN
    ALTER TABLE url_analyses ADD COLUMN utm_analysis JSONB;
  END IF;

  -- Add share_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'share_id') THEN
    ALTER TABLE url_analyses ADD COLUMN share_id TEXT UNIQUE;
  END IF;

  -- Add is_guest column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'is_guest') THEN
    ALTER TABLE url_analyses ADD COLUMN is_guest BOOLEAN DEFAULT false;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Make user_id nullable for guest analyses (migration for existing tables)
-- -----------------------------------------------------------------------------
ALTER TABLE url_analyses ALTER COLUMN user_id DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- Done!
-- -----------------------------------------------------------------------------
-- Your database is now ready for URL Lens.
--
-- Next steps:
-- 1. Enable Email Auth in Authentication → Providers
-- 2. Configure Site URL in Authentication → URL Configuration
-- 3. Add your app URLs to Redirect URLs

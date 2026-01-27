-- =============================================================================
-- URL Lens - Migration: Add Guest Analysis Support
-- =============================================================================
-- Run this in your Supabase SQL Editor to enable guest URL analysis
-- This is required for the MCP server to work without authentication

-- 1. Make user_id nullable to allow guest analyses
ALTER TABLE url_analyses ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add is_guest flag to identify guest analyses
ALTER TABLE url_analyses ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- 3. Create index for guest analyses (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_url_analyses_is_guest ON url_analyses(is_guest) WHERE is_guest = true;

-- 4. Verify the changes
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'url_analyses'
  AND column_name IN ('user_id', 'is_guest');

-- Done! The MCP server can now create guest analyses.

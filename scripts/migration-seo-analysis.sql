-- =============================================================================
-- URL Lens - SEO Analysis Migration
-- =============================================================================
-- Run this in your Supabase SQL Editor to add the seo_analysis column
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Add seo_analysis column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_analyses' AND column_name = 'seo_analysis') THEN
    ALTER TABLE url_analyses ADD COLUMN seo_analysis JSONB;
    RAISE NOTICE 'Added seo_analysis column';
  ELSE
    RAISE NOTICE 'seo_analysis column already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'url_analyses' AND column_name = 'seo_analysis';

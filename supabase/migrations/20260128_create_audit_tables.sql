-- ============================================================================
-- URL Lens - Audit Tables Migration
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Audit Sessions Table
-- Tracks individual audit runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS url_audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('batch', 'domain')),
  domain TEXT,
  total_urls INTEGER NOT NULL DEFAULT 0,
  completed_urls INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discovering', 'testing', 'scoring', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_sessions_user_id ON url_audit_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_created_at ON url_audit_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_status ON url_audit_sessions(status);

-- Enable Row Level Security
ALTER TABLE url_audit_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own audit sessions
CREATE POLICY "Users can view own audit sessions"
  ON url_audit_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own audit sessions
CREATE POLICY "Users can insert own audit sessions"
  ON url_audit_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own audit sessions
CREATE POLICY "Users can update own audit sessions"
  ON url_audit_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own audit sessions
CREATE POLICY "Users can delete own audit sessions"
  ON url_audit_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE url_audit_sessions IS 'Stores URL audit session metadata';

-- ============================================================================
-- Audit Results Table
-- Stores individual URL audit results
-- ============================================================================

CREATE TABLE IF NOT EXISTS url_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES url_audit_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  final_url TEXT,
  scrape_score INTEGER,
  requires_js BOOLEAN NOT NULL DEFAULT false,
  bot_protections JSONB NOT NULL DEFAULT '[]'::jsonb,
  redirects JSONB NOT NULL DEFAULT '[]'::jsonb,
  accessible BOOLEAN,
  recommendation TEXT CHECK (recommendation IN ('best_entry_point', 'good', 'moderate', 'challenging', 'blocked')),
  blocked_reason TEXT,
  content_type TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_results_session_id ON url_audit_results(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_user_id ON url_audit_results(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_url ON url_audit_results(url);
CREATE INDEX IF NOT EXISTS idx_audit_results_scrape_score ON url_audit_results(scrape_score DESC);

-- Enable Row Level Security
ALTER TABLE url_audit_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own audit results
CREATE POLICY "Users can view own audit results"
  ON url_audit_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own audit results
CREATE POLICY "Users can insert own audit results"
  ON url_audit_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own audit results
CREATE POLICY "Users can delete own audit results"
  ON url_audit_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE url_audit_results IS 'Stores individual URL audit results linked to sessions';

-- ============================================================================
-- Optional: Create a view for easy querying of audit summaries
-- ============================================================================

CREATE OR REPLACE VIEW audit_session_summaries AS
SELECT
  s.id,
  s.user_id,
  s.mode,
  s.domain,
  s.total_urls,
  s.completed_urls,
  s.status,
  s.created_at,
  s.completed_at,
  COUNT(r.id) AS result_count,
  AVG(r.scrape_score)::INTEGER AS avg_score,
  COUNT(CASE WHEN r.accessible = true THEN 1 END) AS accessible_count,
  COUNT(CASE WHEN r.accessible = false OR r.accessible IS NULL THEN 1 END) AS blocked_count,
  COUNT(CASE WHEN r.recommendation = 'best_entry_point' THEN 1 END) AS best_entry_points
FROM url_audit_sessions s
LEFT JOIN url_audit_results r ON r.session_id = s.id
GROUP BY s.id;

-- Add comment for documentation
COMMENT ON VIEW audit_session_summaries IS 'Aggregated view of audit sessions with result statistics';


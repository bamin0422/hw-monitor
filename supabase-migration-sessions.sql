-- Communication Sessions table
-- Run this in your Supabase SQL Editor to create the sessions table

CREATE TABLE IF NOT EXISTS communication_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_name TEXT NOT NULL,
  connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent_logs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON communication_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON communication_sessions(user_id, updated_at DESC);

-- Row Level Security
ALTER TABLE communication_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own sessions
CREATE POLICY "Users manage own sessions"
  ON communication_sessions
  FOR ALL
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

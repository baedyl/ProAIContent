-- Migration: Add personas table
-- Date: 2025-01-16
-- Description: Creates personas table for managing writing personas/styles

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT 'avatar-1',
  style TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_user_deleted ON personas(user_id, deleted_at);

-- Add RLS policies
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own personas
CREATE POLICY personas_select_own ON personas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own personas
CREATE POLICY personas_insert_own ON personas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own personas
CREATE POLICY personas_update_own ON personas
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own personas
CREATE POLICY personas_delete_own ON personas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_personas_updated_at();

-- Add comment
COMMENT ON TABLE personas IS 'User-defined writing personas/styles for content generation';


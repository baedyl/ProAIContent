-- Migration: Add project_id to generated_content table
-- Date: 2025-01-16
-- Description: Adds project_id column to generated_content table to allow assigning content to projects

-- Add project_id column (nullable, as existing content won't have a project)
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster project-based queries
CREATE INDEX IF NOT EXISTS idx_generated_content_project_id ON generated_content(project_id);

-- Create index for user + project queries
CREATE INDEX IF NOT EXISTS idx_generated_content_user_project ON generated_content(user_id, project_id);

-- Add comment for documentation
COMMENT ON COLUMN generated_content.project_id IS 'Optional reference to project this content belongs to';


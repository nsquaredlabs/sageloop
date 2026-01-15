-- Migration: Add onboarding flags to projects table
-- This supports the onboarding wizard feature described in docs/product/onboarding-flow-prd.md

-- Add onboarding flags to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS is_onboarding_project BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_via_onboarding BOOLEAN DEFAULT FALSE;

-- Add partial index for filtering onboarding projects (only indexes rows where is_onboarding_project = TRUE)
CREATE INDEX IF NOT EXISTS idx_projects_onboarding ON projects(is_onboarding_project)
WHERE is_onboarding_project = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN projects.is_onboarding_project IS
'True if this is the example project created during onboarding';

COMMENT ON COLUMN projects.created_via_onboarding IS
'True if this project was created via the onboarding wizard (custom or example)';

-- Add prompt versioning for iterative testing
-- Allows tracking prompt changes and their impact on success rates

-- Add version tracking to projects
ALTER TABLE projects ADD COLUMN prompt_version INTEGER DEFAULT 1;

-- Add extraction version to ratings to track which iteration they belong to
ALTER TABLE ratings ADD COLUMN extraction_version INTEGER;

-- Create prompt iterations table
CREATE TABLE prompt_iterations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_version INTEGER, -- which version this improved upon
  improvement_note TEXT, -- what changed (e.g., "Fixed year defaulting issue")
  success_rate_before NUMERIC, -- success rate of parent version
  success_rate_after NUMERIC -- success rate after applying this version
);

-- Add index for quick lookups
CREATE INDEX prompt_iterations_project_id_idx ON prompt_iterations(project_id);
CREATE INDEX prompt_iterations_version_idx ON prompt_iterations(project_id, version DESC);

-- Add unique constraint to prevent duplicate versions
CREATE UNIQUE INDEX prompt_iterations_project_version_idx ON prompt_iterations(project_id, version);

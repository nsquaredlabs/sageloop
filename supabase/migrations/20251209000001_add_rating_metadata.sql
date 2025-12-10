-- Add metadata column to ratings table for tracking carried-forward ratings
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add index for querying carried-forward ratings
CREATE INDEX IF NOT EXISTS ratings_metadata_idx ON ratings USING gin (metadata);

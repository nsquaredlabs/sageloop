-- Migration: Add structured dimensions column to extractions table
-- Phase 1: Multi-Dimensional Pattern Analysis (P0 Feature)
-- Created: 2025-12-23

-- Add structured dimensions column to extractions table
ALTER TABLE extractions
ADD COLUMN dimensions JSONB;

-- Add GIN index for efficient querying of JSONB dimensions
CREATE INDEX idx_extractions_dimensions ON extractions USING GIN (dimensions);

-- Add comment for documentation
COMMENT ON COLUMN extractions.dimensions IS
'Structured multi-dimensional analysis across 5 dimensions: length, tone, structure, content, errors. See types/api.ts for DimensionalAnalysis interface.';

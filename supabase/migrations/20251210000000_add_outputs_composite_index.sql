-- Add composite index for outputs ordered by generated_at
-- This optimizes queries that fetch outputs for a scenario ordered by time
-- Common pattern: getting the latest output for each scenario

CREATE INDEX IF NOT EXISTS idx_outputs_scenario_generated
  ON outputs(scenario_id, generated_at DESC);

-- Add comment for documentation
COMMENT ON INDEX idx_outputs_scenario_generated IS
  'Composite index for fetching outputs ordered by generation time. Optimizes queries like "get latest output for scenario".';

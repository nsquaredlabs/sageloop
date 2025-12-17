-- Test script to manually set quota usage for testing warning states
-- Run this in Supabase Studio SQL Editor

-- Set usage to 85 (85% of 100 limit) to test warning state
UPDATE subscriptions
SET
  standard_outputs_used = 85,
  updated_at = NOW()
WHERE plan_id = 'free'
  AND workbench_id IN (
    SELECT id FROM workbenches WHERE name = 'Test Workbench' OR created_by = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  );

-- Verify the update
SELECT
  id,
  plan_id,
  standard_outputs_used,
  standard_outputs_limit,
  ROUND((standard_outputs_used::numeric / standard_outputs_limit::numeric * 100), 0) as percentage
FROM subscriptions
WHERE plan_id = 'free';

-- Test script to set quota to 100% (exceeded state)
-- Run this in Supabase Studio SQL Editor

-- Set usage to 100 (100% of limit) to test exceeded state
UPDATE subscriptions
SET
  standard_outputs_used = 100,
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

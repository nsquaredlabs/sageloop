-- Reset quota back to 0 for normal testing
-- Run this in Supabase Studio SQL Editor

UPDATE subscriptions
SET
  standard_outputs_used = 0,
  updated_at = NOW()
WHERE plan_id = 'free'
  AND workbench_id IN (
    SELECT id FROM workbenches WHERE name = 'Test Workbench' OR created_by = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  );

-- Verify the reset
SELECT
  id,
  plan_id,
  standard_outputs_used,
  standard_outputs_limit,
  current_period_end
FROM subscriptions
WHERE plan_id = 'free';

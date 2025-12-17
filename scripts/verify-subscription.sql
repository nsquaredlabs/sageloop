-- Verify subscription was created for test workbench
-- Run this in Supabase Studio SQL Editor (http://127.0.0.1:54323)

SELECT
  s.id,
  s.workbench_id,
  s.plan_id,
  s.status,
  s.standard_outputs_used,
  sp.standard_outputs_limit,
  s.current_period_start,
  s.current_period_end
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.workbench_id = '00000000-0000-0000-0000-000000000001'::uuid;

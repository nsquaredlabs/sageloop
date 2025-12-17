-- Migration script to add free tier subscriptions for existing users
-- This should be run ONCE on the production database after deploying Phase 1

-- =====================================================
-- PREREQUISITE: Ensure subscription plans exist
-- =====================================================

-- Check if subscription_plans table exists and has the 'free' plan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM subscription_plans WHERE id = 'free'
  ) THEN
    RAISE EXCEPTION 'subscription_plans table is missing or does not have ''free'' plan. Run schema migration first: npx supabase db push';
  END IF;
END $$;

-- =====================================================
-- CREATE SUBSCRIPTIONS FOR EXISTING WORKBENCHES
-- =====================================================

-- Insert free tier subscriptions for all workbenches that don't have one yet
INSERT INTO subscriptions (
  workbench_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  standard_outputs_used,
  premium_outputs_used,
  created_at,
  updated_at
)
SELECT
  w.id as workbench_id,
  'free' as plan_id,
  'active' as status,
  date_trunc('month', now()) as current_period_start,
  (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date as current_period_end,
  0 as standard_outputs_used,
  0 as premium_outputs_used,
  now() as created_at,
  now() as updated_at
FROM workbenches w
WHERE NOT EXISTS (
  SELECT 1
  FROM subscriptions s
  WHERE s.workbench_id = w.id
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count of workbenches that now have subscriptions
SELECT
  'Total workbenches' as description,
  COUNT(*) as count
FROM workbenches
UNION ALL
SELECT
  'Workbenches with subscriptions' as description,
  COUNT(DISTINCT workbench_id) as count
FROM subscriptions
UNION ALL
SELECT
  'Workbenches WITHOUT subscriptions (should be 0)' as description,
  COUNT(*) as count
FROM workbenches w
WHERE NOT EXISTS (
  SELECT 1
  FROM subscriptions s
  WHERE s.workbench_id = w.id
);

-- Show all subscriptions created
SELECT
  s.id,
  s.workbench_id,
  w.name as workbench_name,
  s.plan_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.standard_outputs_used,
  s.standard_outputs_limit,
  s.created_at
FROM subscriptions s
JOIN workbenches w ON w.id = s.workbench_id
ORDER BY s.created_at DESC;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- Uncomment the following to rollback this migration
-- DELETE FROM subscriptions
-- WHERE plan_id = 'free'
-- AND created_at > '2025-12-16'::timestamp; -- Adjust date as needed

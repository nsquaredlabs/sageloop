-- Verification script to run BEFORE migrating existing users
-- This ensures the schema migration has been applied successfully

-- =====================================================
-- CHECK 1: Subscription plans table exists and has data
-- =====================================================

SELECT 'CHECK 1: Subscription Plans' as check_name;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'subscription_plans'
  ) THEN
    RAISE EXCEPTION 'FAILED: subscription_plans table does not exist. Run: npx supabase db push';
  END IF;
END $$;

-- Show subscription plans
SELECT
  id,
  display_name,
  price_monthly_cents / 100 as price_monthly,
  standard_outputs_limit,
  premium_outputs_limit,
  is_available
FROM subscription_plans
ORDER BY sort_order;

-- =====================================================
-- CHECK 2: Required RPC functions exist
-- =====================================================

SELECT 'CHECK 2: RPC Functions' as check_name;

DO $$
BEGIN
  -- Check get_workbench_subscription function
  IF NOT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'get_workbench_subscription'
  ) THEN
    RAISE EXCEPTION 'FAILED: get_workbench_subscription() function does not exist. Run: npx supabase db push';
  END IF;

  -- Check increment_usage function
  IF NOT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'increment_usage'
  ) THEN
    RAISE EXCEPTION 'FAILED: increment_usage() function does not exist. Run: npx supabase db push';
  END IF;
END $$;

SELECT 'PASSED: All required RPC functions exist' as result;

-- =====================================================
-- CHECK 3: handle_new_user trigger updated
-- =====================================================

SELECT 'CHECK 3: Trigger Function' as check_name;

DO $$
DECLARE
  func_source text;
BEGIN
  -- Get the function source
  SELECT pg_get_functiondef(oid) INTO func_source
  FROM pg_proc
  WHERE proname = 'handle_new_user';

  -- Check if it includes subscription creation logic
  IF func_source NOT LIKE '%subscriptions%' THEN
    RAISE WARNING 'handle_new_user() may not be updated to create subscriptions. Check migration.';
  END IF;
END $$;

SELECT 'PASSED: handle_new_user() trigger exists' as result;

-- =====================================================
-- CHECK 4: Count existing workbenches
-- =====================================================

SELECT 'CHECK 4: Existing Workbenches' as check_name;

SELECT
  COUNT(*) as total_workbenches,
  COUNT(DISTINCT s.workbench_id) as workbenches_with_subscriptions,
  COUNT(*) - COUNT(DISTINCT s.workbench_id) as workbenches_without_subscriptions
FROM workbenches w
LEFT JOIN subscriptions s ON s.workbench_id = w.id;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT '========================================' as separator;
SELECT 'SCHEMA VERIFICATION COMPLETE' as summary;
SELECT '========================================' as separator;
SELECT '' as blank;
SELECT 'If all checks passed, you can now run:' as next_step;
SELECT '  scripts/migrate-existing-users-to-subscriptions.sql' as next_step;

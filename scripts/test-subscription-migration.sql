-- Test script to verify subscription migration works correctly
-- Run this on LOCAL database first before production!

-- =====================================================
-- SETUP: Create test workbenches WITHOUT subscriptions
-- =====================================================

-- Create a test user (if not exists)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'migration-test@example.com',
  crypt('testpass123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create test workbench without subscription
INSERT INTO workbenches (id, name, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Migration Test Workbench',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Link user to workbench
INSERT INTO user_workbenches (user_id, workbench_id, role, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'owner',
  now()
)
ON CONFLICT (user_id, workbench_id) DO NOTHING;

-- =====================================================
-- VERIFY: Check workbench has NO subscription
-- =====================================================

SELECT
  'Before Migration' as stage,
  w.id as workbench_id,
  w.name as workbench_name,
  s.id as subscription_id,
  CASE WHEN s.id IS NULL THEN 'NO SUBSCRIPTION' ELSE 'HAS SUBSCRIPTION' END as status
FROM workbenches w
LEFT JOIN subscriptions s ON s.workbench_id = w.id
WHERE w.id = '11111111-1111-1111-1111-111111111111'::uuid;

-- =====================================================
-- RUN MIGRATION: Create subscriptions for workbenches
-- =====================================================

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
-- VERIFY: Check workbench now HAS subscription
-- =====================================================

SELECT
  'After Migration' as stage,
  w.id as workbench_id,
  w.name as workbench_name,
  s.id as subscription_id,
  s.plan_id,
  s.status,
  s.standard_outputs_limit,
  s.current_period_end,
  CASE WHEN s.id IS NULL THEN 'FAILED - NO SUBSCRIPTION' ELSE 'SUCCESS - HAS SUBSCRIPTION' END as status
FROM workbenches w
LEFT JOIN subscriptions s ON s.workbench_id = w.id
WHERE w.id = '11111111-1111-1111-1111-111111111111'::uuid;

-- =====================================================
-- TEST: Verify RPC function works
-- =====================================================

SELECT
  'RPC Function Test' as stage,
  *
FROM get_workbench_subscription('11111111-1111-1111-1111-111111111111'::uuid);

-- =====================================================
-- CLEANUP: Remove test data
-- =====================================================

-- Uncomment to clean up test data
-- DELETE FROM subscriptions WHERE workbench_id = '11111111-1111-1111-1111-111111111111'::uuid;
-- DELETE FROM user_workbenches WHERE workbench_id = '11111111-1111-1111-1111-111111111111'::uuid;
-- DELETE FROM workbenches WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
-- DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

SELECT
  'Migration Summary' as report,
  (SELECT COUNT(*) FROM workbenches) as total_workbenches,
  (SELECT COUNT(DISTINCT workbench_id) FROM subscriptions) as workbenches_with_subscriptions,
  (SELECT COUNT(*) FROM workbenches w WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.workbench_id = w.id
  )) as workbenches_without_subscriptions;

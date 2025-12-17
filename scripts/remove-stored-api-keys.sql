-- Migration script to remove stored user API keys (BYOK)
-- This should be run ONCE after deploying Phase 1 subscription system
--
-- WHY THIS IS NEEDED:
-- - Phase 1 free tier doesn't use user API keys (system keys only)
-- - Storing unused API keys is a security risk
-- - Users won't be able to use BYOK until paid plans launch (Phase 2)
-- - Best practice: don't store sensitive data we're not actively using
--
-- WHEN TO RUN:
-- - After deploying Phase 1 code changes
-- - After migrating projects to gpt-5-nano
-- - Before announcing the free tier to users

-- =====================================================
-- BACKUP: Export API key metadata (for audit trail)
-- =====================================================

-- Create a backup table with metadata (NOT the actual keys)
CREATE TABLE IF NOT EXISTS workbenches_encrypted_keys_backup AS
SELECT
  id,
  name,
  CASE
    WHEN encrypted_api_keys IS NOT NULL THEN true
    ELSE false
  END as had_encrypted_keys,
  created_at,
  updated_at,
  now() as backed_up_at
FROM workbenches;

-- Verify backup (shows how many workbenches had keys, without exposing keys)
SELECT
  COUNT(*) as total_workbenches,
  COUNT(*) FILTER (WHERE had_encrypted_keys) as workbenches_with_keys,
  COUNT(*) FILTER (WHERE NOT had_encrypted_keys) as workbenches_without_keys
FROM workbenches_encrypted_keys_backup;

-- =====================================================
-- MIGRATION: Remove all stored encrypted API keys
-- =====================================================

-- Set encrypted_api_keys column to NULL for all workbenches
UPDATE workbenches
SET
  encrypted_api_keys = NULL,
  updated_at = now()
WHERE encrypted_api_keys IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Verify all keys are removed
SELECT
  CASE
    WHEN COUNT(*) FILTER (WHERE encrypted_api_keys IS NOT NULL) = 0
    THEN '✅ SUCCESS: All encrypted API keys removed'
    ELSE '❌ WARNING: Some encrypted API keys still exist'
  END as removal_status,
  COUNT(*) as total_workbenches,
  COUNT(*) FILTER (WHERE encrypted_api_keys IS NOT NULL) as workbenches_with_keys,
  COUNT(*) FILTER (WHERE encrypted_api_keys IS NULL) as workbenches_without_keys
FROM workbenches;

-- 2. Compare before/after (using backup)
SELECT
  '========================' as separator;

SELECT 'API KEY REMOVAL SUMMARY' as title;

SELECT
  '========================' as separator;

SELECT
  (SELECT COUNT(*) FROM workbenches_encrypted_keys_backup WHERE had_encrypted_keys) as keys_removed,
  (SELECT COUNT(*) FROM workbenches_encrypted_keys_backup) as total_workbenches,
  (SELECT COUNT(*) FROM workbenches WHERE encrypted_api_keys IS NOT NULL) as remaining_keys;

-- 3. Show workbenches that had keys (for audit trail - no actual keys shown)
SELECT
  b.id,
  b.name,
  b.had_encrypted_keys,
  b.backed_up_at,
  w.encrypted_api_keys IS NULL as keys_now_removed
FROM workbenches_encrypted_keys_backup b
JOIN workbenches w ON w.id = b.id
WHERE b.had_encrypted_keys = true
ORDER BY b.name
LIMIT 20;

-- =====================================================
-- SECURITY VERIFICATION
-- =====================================================

-- Double-check no workbenches have encrypted keys
SELECT
  id,
  name,
  'WARNING: Still has encrypted keys!' as issue
FROM workbenches
WHERE encrypted_api_keys IS NOT NULL;

-- Should return 0 rows

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- After verifying removal succeeded, you can optionally drop the backup table
-- Keep this for audit purposes for at least 30 days
-- UNCOMMENT ONLY AFTER CONFIRMING REMOVAL SUCCESS

-- DROP TABLE IF EXISTS workbenches_encrypted_keys_backup;

-- =====================================================
-- NOTES FOR PHASE 2 (When BYOK returns)
-- =====================================================

-- When paid plans launch and BYOK is re-enabled:
-- 1. The encrypted_api_keys column will be NULL for all workbenches (expected)
-- 2. Paid users will need to re-enter their API keys
-- 3. Consider adding a notice: "You previously had API keys configured. Please re-add them."
-- 4. The backup table shows which workbenches had keys (for context)
-- 5. Use the existing set_workbench_api_keys() function to re-encrypt new keys

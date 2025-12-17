-- Migration script to update all projects to use gpt-5-nano (free tier model)
-- This should be run ONCE after deploying Phase 1 subscription system
--
-- WHY THIS IS NEEDED:
-- - Phase 1 only supports free tier with gpt-5-nano
-- - Users who previously configured BYOK may have projects using paid models
-- - Those projects will fail quota checks without this migration
-- - System API keys are now used instead of user's BYOK
--
-- WHEN TO RUN:
-- - After deploying Phase 1 code changes
-- - After running migrate-existing-users-to-subscriptions.sql
-- - Before announcing the free tier to users

-- =====================================================
-- BACKUP: Export current project configurations
-- =====================================================

-- Create a backup table with original model configurations
CREATE TABLE IF NOT EXISTS project_model_backup AS
SELECT
  id,
  name,
  model_config,
  created_at,
  now() as backed_up_at
FROM projects;

-- Verify backup
SELECT
  COUNT(*) as total_projects_backed_up,
  COUNT(DISTINCT model_config->>'model') as unique_models
FROM project_model_backup;

-- Show breakdown of models before migration
SELECT
  model_config->>'model' as model,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM projects
GROUP BY model_config->>'model'
ORDER BY count DESC;

-- =====================================================
-- MIGRATION: Update all projects to gpt-5-nano
-- =====================================================

-- Update model in model_config JSONB
UPDATE projects
SET
  model_config = jsonb_set(
    model_config,
    '{model}',
    '"gpt-5-nano"'
  ),
  updated_at = now()
WHERE model_config->>'model' != 'gpt-5-nano'
   OR model_config->>'model' IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Count projects after migration
SELECT
  'After Migration' as stage,
  model_config->>'model' as model,
  COUNT(*) as count
FROM projects
GROUP BY model_config->>'model'
ORDER BY count DESC;

-- 2. Verify all projects use gpt-5-nano
SELECT
  CASE
    WHEN COUNT(*) FILTER (WHERE model_config->>'model' != 'gpt-5-nano') = 0
    THEN '✅ SUCCESS: All projects use gpt-5-nano'
    ELSE '❌ FAILED: Some projects still use other models'
  END as migration_status,
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE model_config->>'model' = 'gpt-5-nano') as gpt5nano_projects,
  COUNT(*) FILTER (WHERE model_config->>'model' != 'gpt-5-nano') as other_model_projects
FROM projects;

-- 3. Show projects that were migrated (for audit trail)
SELECT
  p.id,
  p.name,
  b.model_config->>'model' as old_model,
  p.model_config->>'model' as new_model,
  p.updated_at as migrated_at
FROM projects p
JOIN project_model_backup b ON b.id = p.id
WHERE b.model_config->>'model' != 'gpt-5-nano'
ORDER BY p.updated_at DESC
LIMIT 20;

-- 4. Summary statistics
SELECT
  '========================' as separator;

SELECT 'MIGRATION SUMMARY' as title;

SELECT
  '========================' as separator;

SELECT
  (SELECT COUNT(*) FROM project_model_backup) as projects_before_migration,
  (SELECT COUNT(*) FROM projects) as projects_after_migration,
  (SELECT COUNT(*) FROM projects WHERE model_config->>'model' = 'gpt-5-nano') as projects_using_gpt5nano,
  (SELECT COUNT(DISTINCT model_config->>'model') FROM project_model_backup) as unique_models_before,
  (SELECT COUNT(DISTINCT model_config->>'model') FROM projects) as unique_models_after;

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- After verifying migration succeeded, you can optionally drop the backup table
-- UNCOMMENT ONLY AFTER CONFIRMING MIGRATION SUCCESS

-- DROP TABLE IF EXISTS project_model_backup;

-- =====================================================
-- ROLLBACK (If needed)
-- =====================================================

-- If migration fails or you need to rollback, restore from backup:

-- UNCOMMENT TO ROLLBACK:
-- UPDATE projects p
-- SET
--   model_config = b.model_config,
--   updated_at = now()
-- FROM project_model_backup b
-- WHERE p.id = b.id;

-- Verify rollback:
-- SELECT
--   model_config->>'model' as model,
--   COUNT(*) as count
-- FROM projects
-- GROUP BY model_config->>'model';

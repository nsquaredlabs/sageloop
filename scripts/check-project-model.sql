-- Check what model the project is currently using
SELECT
  id,
  name,
  model_config->>'model' as current_model,
  model_config
FROM projects
WHERE id = 1;

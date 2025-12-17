-- Update project to use gpt-5-nano (free tier model)
UPDATE projects
SET model_config = jsonb_set(
  model_config,
  '{model}',
  '"gpt-5-nano"'
)
WHERE id = 1;

-- Verify the change
SELECT
  id,
  name,
  model_config->>'model' as updated_model,
  model_config
FROM projects
WHERE id = 1;

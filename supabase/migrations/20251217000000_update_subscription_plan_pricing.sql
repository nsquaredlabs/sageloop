-- =====================================================
-- Migration: Update subscription plan pricing
-- Reduce pricing to make Pro more accessible at $20/month
-- =====================================================

-- Update subscription plans with new pricing and quotas
UPDATE subscription_plans
SET
  price_monthly_cents = 2000, -- $20/month (was $49)
  standard_outputs_limit = 1000, -- 1,000 outputs (was 2,000)
  premium_outputs_limit = 200, -- 200 outputs (was 500)
  description = 'For individuals building production AI features',
  features = '["1,000 standard outputs", "200 premium outputs (GPT-5.1, Claude)", "Priority support", "Export test suites"]'::jsonb
WHERE id = 'pro';

UPDATE subscription_plans
SET
  price_monthly_cents = 4900, -- $49/month (was $99)
  standard_outputs_limit = 3000, -- 3,000 outputs (was 5,000)
  premium_outputs_limit = 750, -- 750 outputs (was 1,500)
  description = 'For teams collaborating on AI product quality',
  features = '["3,000 standard outputs", "750 premium outputs", "Team collaboration", "Advanced analytics", "Priority support"]'::jsonb
WHERE id = 'team';

UPDATE subscription_plans
SET
  price_monthly_cents = 19900, -- $199/month (was $499)
  standard_outputs_limit = 10000, -- 10,000 outputs (was 20,000)
  premium_outputs_limit = 2500, -- 2,500 outputs (was 5,000)
  description = 'Custom limits and dedicated support for large organizations',
  features = '["10,000+ outputs", "All premium models", "Dedicated support", "Custom integrations", "SLA guarantees"]'::jsonb
WHERE id = 'enterprise';

-- Verification query
SELECT
  id,
  display_name,
  price_monthly_cents,
  standard_outputs_limit,
  premium_outputs_limit,
  is_available
FROM subscription_plans
ORDER BY sort_order;

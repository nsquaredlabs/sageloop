-- =====================================================
-- Seed Data: Subscription Plans
-- Phase 1: Free tier available, others "coming soon"
-- =====================================================

-- Insert subscription plans matching marketing PRD
insert into subscription_plans (
  id,
  name,
  display_name,
  description,
  price_monthly_cents,
  standard_outputs_limit,
  premium_outputs_limit,
  allow_premium_models,
  is_available,
  features,
  sort_order
) values
  (
    'free',
    'free',
    'Free',
    'Perfect for trying out Sageloop',
    0, -- $0/month
    100, -- 100 outputs/month (standard tier models)
    0, -- No premium outputs
    false, -- GPT-5-nano only
    true, -- Available now
    jsonb_build_array(
      '1 project',
      '100 outputs/month',
      'GPT-5-nano model',
      'Scenario management',
      'Rating & feedback',
      'Usage dashboard',
      'Export test suites',
      'Community support'
    ),
    0 -- Display first
  ),
  (
    'pro',
    'pro',
    'Pro',
    'For individual developers and small teams',
    4900, -- $49/month
    2000, -- 2,000 standard outputs/month (GPT-5-mini)
    500, -- 500 premium outputs/month (GPT-5.1 or Claude Sonnet 4.5)
    true, -- Access to premium models
    false, -- Coming soon (Phase 2)
    jsonb_build_array(
      'Unlimited projects',
      '2,000 standard outputs/month (GPT-5-mini)',
      '500 premium outputs/month (GPT-5.1 or Claude Sonnet 4.5)',
      'Multi-provider support',
      'Smart rating carry-forward',
      'Keyboard shortcuts',
      'Priority email support'
    ),
    1 -- Display second
  ),
  (
    'team',
    'team',
    'Team',
    'For teams collaborating on AI products',
    9900, -- $99/month
    5000, -- 5,000 standard outputs/month
    1500, -- 1,500 premium outputs/month
    true, -- Access to premium models
    false, -- Coming soon (Phase 2)
    jsonb_build_array(
      'Everything in Pro',
      '5,000 standard outputs/month',
      '1,500 premium outputs/month',
      'Team collaboration (coming soon)',
      'Prompt version history',
      'Failure clustering',
      'Selective retest',
      'Priority support + Slack channel'
    ),
    2 -- Display third
  ),
  (
    'enterprise',
    'enterprise',
    'Enterprise',
    'For large organizations with custom needs',
    49900, -- $499/month (starting price)
    20000, -- 20,000 standard outputs/month
    5000, -- 5,000 premium outputs/month
    true, -- Access to all models
    false, -- Coming soon (Phase 2)
    jsonb_build_array(
      'Everything in Team',
      '20,000+ standard outputs/month',
      '5,000+ premium outputs/month',
      'Access to all models (GPT-5.2, Claude Opus 4.5, o3)',
      'Bring Your Own Keys (unlimited with your API keys)',
      'SSO / SAML authentication',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantees (99.9% uptime)'
    ),
    3 -- Display fourth
  )
on conflict (id) do update set
  name = excluded.name,
  display_name = excluded.display_name,
  description = excluded.description,
  price_monthly_cents = excluded.price_monthly_cents,
  standard_outputs_limit = excluded.standard_outputs_limit,
  premium_outputs_limit = excluded.premium_outputs_limit,
  allow_premium_models = excluded.allow_premium_models,
  is_available = excluded.is_available,
  features = excluded.features,
  sort_order = excluded.sort_order;

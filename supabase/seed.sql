-- Seed data for Tellah
-- Complete test environment with user, project, rated outputs ready for testing iterative workflow

-- =====================================================
-- SUBSCRIPTION PLANS (must come first!)
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

-- =====================================================
-- TEST USER AND WORKBENCH
-- =====================================================

-- Create test user in auth.users (Supabase Auth)
-- Password: testpass123
insert into auth.users (
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
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token
)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  crypt('testpass123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

-- Create test workbench
insert into workbenches (id, name, created_at)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Workbench',
  now()
)
on conflict (id) do nothing;

-- Link test user to workbench
insert into user_workbenches (user_id, workbench_id, role, created_at)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'owner',
  now()
)
on conflict (user_id, workbench_id) do nothing;

-- =====================================================
-- SUBSCRIPTION FOR TEST WORKBENCH
-- =====================================================
-- Create free tier subscription for test workbench
insert into subscriptions (
  id,
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
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'free',
  'active',
  date_trunc('month', now()),
  (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date,
  0, -- No outputs used yet
  0, -- No premium outputs used
  now(),
  now()
)
on conflict (id) do nothing;

-- Create sample project with prompt_version
insert into projects (
  id,
  name,
  description,
  model_config,
  workbench_id,
  created_by,
  prompt_version,
  created_at
)
overriding system value
values (
  1,
  'Date Parser Evaluation',
  'Testing date extraction accuracy with various input formats',
  '{"model": "gpt-5-nano", "temperature": 0.7, "system_prompt": "Extract event details from the text. Return JSON with event name, date, time, location."}'::jsonb,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  1,
  now() - interval '5 days'
)
on conflict (id) do nothing;

-- Insert 10 test scenarios (from testing guide)
insert into scenarios (project_id, input_text, "order", created_at)
values
  (1, 'Hey team, let''s meet tomorrow at 2pm in the blue room', 1, now() - interval '5 days'),
  (1, 'Annual company retreat is scheduled for October 5th, 2025', 2, now() - interval '5 days'),
  (1, 'Can we schedule a quick standup this Friday morning?', 3, now() - interval '5 days'),
  (1, 'Board meeting agenda for November 3, 2025 at 1pm', 4, now() - interval '5 days'),
  (1, 'Emergency all-hands meeting today at 4:30pm', 5, now() - interval '5 days'),
  (1, 'Parent-teacher conference scheduled for April 18, 2025 at 3:15pm', 6, now() - interval '5 days'),
  (1, 'Workshop series every Monday in January 2025 starting at 3pm', 7, now() - interval '5 days'),
  (1, 'Your flight departs LAX on December 15th at 6:45am', 8, now() - interval '5 days'),
  (1, 'Wedding invitation: Sarah & Mike are getting married on June 14, 2025', 9, now() - interval '5 days'),
  (1, 'Dr. Smith''s office called - your appointment is next Tuesday at 10:30am', 10, now() - interval '5 days')
on conflict do nothing;

-- Insert outputs for all scenarios (version 1)
-- Some will have date defaulting issues (2022 instead of current year)
insert into outputs (scenario_id, output_text, model_snapshot)
values
  -- Scenario 1: defaults to 2022 (FAILURE)
  (1, '{"event":"Team Meeting","date":"2022-12-10","time":"14:00","location":"blue room"}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 2: correct (SUCCESS)
  (2, '{"event":"Annual Company Retreat","date":"2025-10-05","time":null,"location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 3: defaults to 2022 (FAILURE)
  (3, '{"event":"Quick Standup","date":"2022-12-16","time":"09:00","location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 4: correct (SUCCESS)
  (4, '{"event":"Board Meeting","date":"2025-11-03","time":"13:00","location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 5: defaults to 2022 (FAILURE)
  (5, '{"event":"Emergency All-Hands Meeting","date":"2022-12-09","time":"16:30","location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 6: correct (SUCCESS)
  (6, '{"event":"Parent-Teacher Conference","date":"2025-04-18","time":"15:15","location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 7: correct (SUCCESS)
  (7, '{"event":"Workshop Series","date":"2025-01-06","time":"15:00","location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 8: correct (SUCCESS)
  (8, '{"event":"Flight Departure","date":"2025-12-15","time":"06:45","location":"LAX"}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 9: correct (SUCCESS)
  (9, '{"event":"Sarah & Mike''s Wedding","date":"2025-06-14","time":null,"location":null}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb),
  -- Scenario 10: defaults to 2022 (FAILURE)
  (10, '{"event":"Doctor Appointment","date":"2022-12-13","time":"10:30","location":"Dr. Smith''s office"}', '{"model":"gpt-5-nano","temperature":0.7,"system_prompt":"Extract event details from the text. Return JSON with event name, date, time, location.","version":1}'::jsonb)
on conflict do nothing;

-- Insert ratings (4 failures with feedback, 6 successes)
insert into ratings (output_id, stars, feedback_text, tags, created_at)
values
  -- Failures
  (1, 2, 'Wrong year - defaulted to 2022 instead of using current date context', '["wrong_date", "missing_context"]'::jsonb, now() - interval '3 days'),
  (3, 1, 'Date is completely wrong - shows 2022 when it should be current year', '["wrong_date", "critical_error"]'::jsonb, now() - interval '3 days'),
  (5, 2, 'Incorrect year again - needs current date awareness', '["wrong_date", "missing_context"]'::jsonb, now() - interval '3 days'),
  (10, 1, 'Failed to infer next Tuesday correctly - defaulted to 2022', '["wrong_date", "critical_error"]'::jsonb, now() - interval '3 days'),
  -- Successes
  (2, 5, 'Perfect - extracted all details correctly', '["accurate", "complete"]'::jsonb, now() - interval '3 days'),
  (4, 5, 'Great job on date and time extraction', '["accurate"]'::jsonb, now() - interval '3 days'),
  (6, 4, 'Good extraction, minor formatting preference', '["accurate", "good"]'::jsonb, now() - interval '3 days'),
  (7, 5, 'Excellent handling of recurring event', '["accurate", "complete"]'::jsonb, now() - interval '3 days'),
  (8, 5, 'Perfect - got date, time, and location', '["accurate", "complete"]'::jsonb, now() - interval '3 days'),
  (9, 4, 'Good extraction, could include more details', '["accurate", "good"]'::jsonb, now() - interval '3 days')
on conflict do nothing;

-- Insert extraction with failure analysis
insert into extractions (
  project_id,
  criteria,
  confidence_score,
  rated_output_count,
  system_prompt_snapshot,
  created_at
)
values (
  1,
  '{
    "summary": "Date extraction is failing for relative dates (\"tomorrow\", \"today\", \"next Tuesday\") due to missing current date context in the system prompt.",
    "failure_analysis": {
      "total_failures": 4,
      "total_successes": 6,
      "clusters": [
        {
          "name": "date_defaulting",
          "count": 4,
          "pattern": "Relative dates (tomorrow, today, next week) are defaulting to year 2022 instead of current year",
          "root_cause": "No current date context provided to the model",
          "suggested_fix": "Add current date context to system prompt: \"Current date: {{current_date}}. When extracting dates, use this as reference for relative terms like tomorrow, today, next week.\"",
          "example_inputs": [
            "Hey team, let''s meet tomorrow at 2pm in the blue room",
            "Can we schedule a quick standup this Friday morning?",
            "Emergency all-hands meeting today at 4:30pm",
            "Dr. Smith''s office called - your appointment is next Tuesday at 10:30am"
          ],
          "scenario_ids": [1, 3, 5, 10],
          "severity": "high"
        }
      ]
    },
    "success_patterns": [
      "Extracts explicit dates correctly (October 5th, 2025)",
      "Handles time parsing well across different formats",
      "Successfully identifies event names and locations"
    ]
  }'::jsonb,
  0.60,
  10,
  'Extract event details from the text. Return JSON with event name, date, time, location.',
  now() - interval '2 days'
)
on conflict do nothing;

-- Insert metric snapshot
insert into metrics (
  project_id,
  extraction_id,
  success_rate,
  criteria_breakdown,
  snapshot_time
)
values (
  1,
  1,
  0.60,
  '{"accuracy": "medium", "completeness": "high"}'::jsonb,
  now() - interval '2 days'
)
on conflict do nothing;

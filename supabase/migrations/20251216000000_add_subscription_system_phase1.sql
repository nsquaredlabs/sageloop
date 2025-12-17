-- =====================================================
-- Migration: Add subscription system (Phase 1 - Free Tier)
-- Phase 1: Free tier only, no Stripe fields, no waitlist table
-- Phase 2 will add Stripe fields via separate migration
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Subscription Plans Table
-- Stores available subscription tiers with quotas and pricing
create table subscription_plans (
  id text primary key, -- 'free', 'pro', 'team', 'enterprise'
  name text not null,
  display_name text not null,
  description text,
  price_monthly_cents int not null default 0, -- 0 for free, 4900 for pro, etc.

  -- Output quotas (per billing cycle)
  standard_outputs_limit int not null default 0,
  premium_outputs_limit int not null default 0,

  -- Feature flags
  allow_premium_models boolean not null default false,
  allow_team_collaboration boolean not null default false,
  is_available boolean not null default true, -- false = "coming soon" for Phase 1

  -- Metadata
  features jsonb, -- Array of feature strings for display
  sort_order int not null default 0, -- Display order (0 = free, 1 = pro, etc.)
  created_at timestamp with time zone default now()
);

-- 2. Subscriptions Table
-- Stores active subscriptions for each workbench
-- Phase 1: Simplified without Stripe fields
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches(id) on delete cascade not null,
  plan_id text references subscription_plans(id) not null,

  -- Status (Phase 1: only 'active' used, others for Phase 2)
  status text not null default 'active', -- active, past_due, canceled, trialing

  -- Billing period (Phase 1: calendar month, Phase 2: Stripe billing cycle)
  current_period_start timestamp with time zone not null default now(),
  current_period_end timestamp with time zone not null,

  -- Usage tracking (resets each billing cycle)
  standard_outputs_used int not null default 0,
  premium_outputs_used int not null default 0,
  last_usage_reset timestamp with time zone default now(),

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Constraints
  unique(workbench_id), -- One subscription per workbench
  check (status in ('active', 'past_due', 'canceled', 'trialing'))
);

-- 3. Usage Events Table
-- Audit log for all output generation (analytics and debugging)
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches(id) on delete cascade not null,
  subscription_id uuid references subscriptions(id) on delete set null,

  -- Event details
  model_tier text not null, -- 'free', 'standard', 'premium', 'enterprise'
  model_name text not null, -- 'gpt-5-nano', 'gpt-5-mini', etc.
  output_count int not null default 1,

  -- Token usage (from model_snapshot)
  input_tokens int,
  output_tokens int,
  total_tokens int,

  -- Metadata
  project_id bigint references projects(id) on delete set null,
  created_at timestamp with time zone default now(),

  check (model_tier in ('free', 'standard', 'premium', 'enterprise'))
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Subscriptions indexes
create index subscriptions_workbench_id_idx on subscriptions(workbench_id);
create index subscriptions_plan_id_idx on subscriptions(plan_id);
create index subscriptions_status_idx on subscriptions(status);
create index subscriptions_current_period_end_idx on subscriptions(current_period_end);

-- Usage events indexes
create index usage_events_workbench_id_idx on usage_events(workbench_id);
create index usage_events_subscription_id_idx on usage_events(subscription_id);
create index usage_events_created_at_idx on usage_events(created_at desc);
create index usage_events_project_id_idx on usage_events(project_id);
create index usage_events_model_tier_idx on usage_events(model_tier);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table usage_events enable row level security;

-- Subscription Plans Policies
-- All authenticated users can view plans
create policy "Anyone can view subscription plans"
  on subscription_plans for select
  using (true);

-- Only system can modify plans (no policy = only service role)
-- No insert/update/delete policies = only admins via service role

-- Subscriptions Policies
-- Users can view subscriptions for their workbenches
create policy "Users can view their workbench subscriptions"
  on subscriptions for select
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = subscriptions.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- System creates subscriptions (via RPC functions and triggers)
-- No direct insert/update/delete policies for users

-- Usage Events Policies
-- Users can view usage events for their workbenches
create policy "Users can view their workbench usage events"
  on usage_events for select
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = usage_events.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- System creates usage events (via RPC functions)
-- No direct insert policy for users

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get workbench subscription with limits
-- Returns subscription details including plan limits
create or replace function get_workbench_subscription(workbench_uuid uuid)
returns table (
  id uuid,
  plan_id text,
  plan_name text,
  status text,
  standard_outputs_used int,
  standard_outputs_limit int,
  premium_outputs_used int,
  premium_outputs_limit int,
  current_period_end timestamp with time zone,
  allow_premium_models boolean
) as $$
begin
  return query
  select
    s.id,
    s.plan_id,
    p.name as plan_name,
    s.status,
    s.standard_outputs_used,
    p.standard_outputs_limit,
    s.premium_outputs_used,
    p.premium_outputs_limit,
    s.current_period_end,
    p.allow_premium_models
  from subscriptions s
  join subscription_plans p on s.plan_id = p.id
  where s.workbench_id = workbench_uuid
  and s.status = 'active';
end;
$$ language plpgsql security definer;

-- Function: Check if quota is available
-- Returns true if workbench has quota remaining for the model tier
create or replace function check_quota_available(
  workbench_uuid uuid,
  model_tier text,
  count int default 1
)
returns boolean as $$
declare
  sub record;
begin
  -- Get subscription with limits
  select * from get_workbench_subscription(workbench_uuid)
  into sub;

  -- No active subscription = no quota
  if sub is null then
    return false;
  end if;

  -- Check quota based on model tier
  if model_tier = 'free' or model_tier = 'standard' then
    return (sub.standard_outputs_used + count) <= sub.standard_outputs_limit;
  elsif model_tier = 'premium' then
    return (sub.premium_outputs_used + count) <= sub.premium_outputs_limit;
  else
    -- Enterprise tier has no limits (BYOK)
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Function: Increment usage counter
-- Increments usage and logs to usage_events table
create or replace function increment_usage(
  workbench_uuid uuid,
  model_tier text,
  model_name text,
  count int default 1,
  input_tokens int default null,
  output_tokens int default null,
  project_id bigint default null
)
returns void as $$
declare
  sub_id uuid;
begin
  -- Get subscription ID
  select id into sub_id
  from subscriptions
  where workbench_id = workbench_uuid
  and status = 'active';

  if sub_id is null then
    raise exception 'No active subscription found for workbench %', workbench_uuid;
  end if;

  -- Update usage counter based on model tier
  if model_tier = 'free' or model_tier = 'standard' then
    update subscriptions
    set
      standard_outputs_used = standard_outputs_used + count,
      updated_at = now()
    where id = sub_id;
  elsif model_tier = 'premium' then
    update subscriptions
    set
      premium_outputs_used = premium_outputs_used + count,
      updated_at = now()
    where id = sub_id;
  end if;
  -- Enterprise tier doesn't track usage (BYOK)

  -- Log usage event for analytics
  insert into usage_events (
    workbench_id,
    subscription_id,
    model_tier,
    model_name,
    output_count,
    input_tokens,
    output_tokens,
    total_tokens,
    project_id
  ) values (
    workbench_uuid,
    sub_id,
    model_tier,
    model_name,
    count,
    input_tokens,
    output_tokens,
    coalesce(input_tokens, 0) + coalesce(output_tokens, 0),
    project_id
  );
end;
$$ language plpgsql security definer;

-- Function: Reset monthly usage
-- Resets usage counters to 0 (called by cron job on 1st of month)
create or replace function reset_monthly_usage(workbench_uuid uuid)
returns void as $$
begin
  update subscriptions
  set
    standard_outputs_used = 0,
    premium_outputs_used = 0,
    last_usage_reset = now(),
    updated_at = now()
  where workbench_id = workbench_uuid
  and status = 'active';
end;
$$ language plpgsql security definer;

-- Function: Calculate next period end
-- Helper to calculate next billing cycle end date
create or replace function calculate_next_period_end()
returns timestamp with time zone as $$
begin
  -- Phase 1: Calendar month (1st of next month at midnight UTC)
  return date_trunc('month', now() + interval '1 month');
end;
$$ language plpgsql;

-- =====================================================
-- UPDATE NEW USER TRIGGER
-- =====================================================

-- Update handle_new_user() to create free tier subscription
-- This replaces the existing function from 20250107000000_add_auth_and_workbenches.sql
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  new_workbench_id uuid;
  workbench_name text;
begin
  -- Extract name from email prefix (before @)
  workbench_name := split_part(new.email, '@', 1) || '''s Workbench';

  -- Create personal workbench (bypasses RLS due to security definer)
  insert into public.workbenches (name)
  values (workbench_name)
  returning id into new_workbench_id;

  -- Add user as owner (bypasses RLS due to security definer)
  insert into public.user_workbenches (user_id, workbench_id, role)
  values (new.id, new_workbench_id, 'owner');

  -- Create free tier subscription (bypasses RLS due to security definer)
  insert into public.subscriptions (
    workbench_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    standard_outputs_used,
    premium_outputs_used
  ) values (
    new_workbench_id,
    'free',
    'active',
    now(),
    public.calculate_next_period_end(),
    0,
    0
  );

  return new;
end;
$$;

-- Trigger already exists from previous migration, function is updated

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp on subscriptions
create trigger update_subscriptions_updated_at
  before update on subscriptions
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users for RPC functions
grant execute on function get_workbench_subscription(uuid) to authenticated;
grant execute on function check_quota_available(uuid, text, int) to authenticated;
grant execute on function increment_usage(uuid, text, text, int, int, int, bigint) to authenticated;

-- Grant execute on helper function
grant execute on function calculate_next_period_end() to authenticated;

-- Only service role can reset usage (via cron job)
grant execute on function reset_monthly_usage(uuid) to service_role;

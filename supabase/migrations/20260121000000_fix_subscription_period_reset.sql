-- =====================================================
-- Migration: Fix subscription period reset
-- Bug: current_period_end never updates after initial creation
-- Solution: Update reset function + add auto-reset in getter + pg_cron job
-- =====================================================

-- =====================================================
-- UPDATED FUNCTIONS
-- =====================================================

-- Function: Reset monthly usage with period date updates
-- Now also updates current_period_start and current_period_end
-- Only resets if the current period has actually ended
create or replace function reset_monthly_usage(workbench_uuid uuid)
returns void as $$
begin
  update subscriptions
  set
    standard_outputs_used = 0,
    premium_outputs_used = 0,
    last_usage_reset = now(),
    -- Move current period end to start
    current_period_start = current_period_end,
    -- Calculate new period end (first of next month at midnight UTC)
    current_period_end = date_trunc('month', current_period_end + interval '1 month'),
    updated_at = now()
  where workbench_id = workbench_uuid
  and status = 'active'
  and current_period_end <= now();  -- Only reset if period has ended
end;
$$ language plpgsql security definer;

-- Function: Get workbench subscription with auto-reset
-- Now checks if period has ended and auto-resets before returning data
-- This handles cases where the cron job may have missed a reset
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
  -- Auto-reset if period has ended (handles missed cron runs)
  -- This ensures users always see correct data even if cron failed
  if exists (
    select 1 from subscriptions
    where workbench_id = workbench_uuid
    and subscriptions.status = 'active'
    and subscriptions.current_period_end <= now()
  ) then
    perform reset_monthly_usage(workbench_uuid);
  end if;

  -- Return updated subscription data
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

-- =====================================================
-- PG_CRON JOB CONFIGURATION
-- =====================================================

-- Note: pg_cron extension must be enabled in Supabase dashboard first
-- Go to Database > Extensions > pg_cron > Enable

-- Function to reset all active subscriptions (called by cron)
create or replace function reset_all_monthly_usage()
returns void as $$
declare
  sub record;
  reset_count int := 0;
begin
  -- Loop through all active subscriptions that need reset
  for sub in
    select workbench_id
    from subscriptions
    where status = 'active'
    and current_period_end <= now()
  loop
    perform reset_monthly_usage(sub.workbench_id);
    reset_count := reset_count + 1;
  end loop;

  -- Log the reset operation (useful for debugging)
  raise notice 'Monthly usage reset completed. % subscriptions reset.', reset_count;
end;
$$ language plpgsql security definer;

-- Grant execute permission to service_role for cron job
grant execute on function reset_all_monthly_usage() to service_role;

-- =====================================================
-- SCHEDULE CRON JOB
-- =====================================================
-- Schedule the monthly reset for 1st of each month at 00:01 UTC
-- Note: This requires pg_cron extension to be enabled in Supabase
-- If pg_cron is not available, the auto-reset in get_workbench_subscription
-- will handle resets on-demand when users access their subscription data

-- Uncomment the following when pg_cron is enabled:
-- select cron.schedule(
--   'reset-monthly-usage',
--   '1 0 1 * *',  -- At 00:01 on day-of-month 1
--   $$select reset_all_monthly_usage()$$
-- );

-- To verify the job is scheduled (run in SQL editor):
-- select * from cron.job;

-- To unschedule if needed:
-- select cron.unschedule('reset-monthly-usage');

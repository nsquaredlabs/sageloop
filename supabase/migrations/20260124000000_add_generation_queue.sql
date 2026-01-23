-- =====================================================
-- Migration: Add async generation queue system
-- Uses Supabase Queues (pgmq) for reliable async processing
-- =====================================================

-- 1. Enable pgmq extension for message queuing
create extension if not exists pgmq;

-- 2. Create the generation_jobs queue using pgmq
select pgmq.create('generation_jobs');

-- 3. Create generation_jobs status table for tracking job progress
-- This table stores job metadata and progress separate from the queue messages
create table generation_job_status (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references projects(id) on delete cascade,
  workbench_id uuid not null references workbenches(id) on delete cascade,

  -- Job status tracking
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'partial')),

  -- Progress tracking
  total_scenarios int not null default 0,
  completed_scenarios int not null default 0,
  failed_scenarios int not null default 0,

  -- Results
  output_ids bigint[] default array[]::bigint[],
  errors jsonb default '[]'::jsonb,

  -- Model configuration snapshot at time of job creation
  -- This ensures we use the exact config even if project config changes
  model_config jsonb not null,

  -- API keys snapshot (encrypted reference, not actual keys)
  -- For Enterprise BYOK, this stores a reference; for standard tiers, null
  api_keys_snapshot jsonb,

  -- Timing
  created_at timestamp with time zone default now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- 4. Create indexes for efficient queries
create index generation_job_status_project_id_idx on generation_job_status(project_id);
create index generation_job_status_workbench_id_idx on generation_job_status(workbench_id);
create index generation_job_status_status_idx on generation_job_status(status);
create index generation_job_status_created_at_idx on generation_job_status(created_at desc);

-- 5. Add updated_at trigger
create trigger update_generation_job_status_updated_at
  before update on generation_job_status
  for each row
  execute function update_updated_at_column();

-- 6. Enable RLS on generation_job_status
alter table generation_job_status enable row level security;

-- 7. RLS policies for generation_job_status
-- Users can only view jobs for projects in their workbenches
create policy "Users can view their generation jobs"
  on generation_job_status for select
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = generation_job_status.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Users can create jobs for projects in their workbenches
create policy "Users can create generation jobs"
  on generation_job_status for insert
  with check (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = generation_job_status.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Service role can update jobs (for Edge Function processing)
-- Note: Edge Functions use service_role key which bypasses RLS
-- This policy allows authenticated users to update their own jobs
create policy "Users can update their generation jobs"
  on generation_job_status for update
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = generation_job_status.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- 8. Create RPC function to enqueue a generation job
-- This atomically creates the job status record and enqueues the message
create or replace function enqueue_generation_job(
  p_project_id bigint,
  p_workbench_id uuid,
  p_model_config jsonb,
  p_scenario_count int,
  p_api_keys_snapshot jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
  v_msg_id bigint;
begin
  -- Verify user has access to the workbench
  if not exists (
    select 1 from user_workbenches
    where workbench_id = p_workbench_id
    and user_id = auth.uid()
  ) then
    raise exception 'Access denied to workbench';
  end if;

  -- Create the job status record
  insert into generation_job_status (
    project_id,
    workbench_id,
    status,
    total_scenarios,
    model_config,
    api_keys_snapshot
  )
  values (
    p_project_id,
    p_workbench_id,
    'pending',
    p_scenario_count,
    p_model_config,
    p_api_keys_snapshot
  )
  returning id into v_job_id;

  -- Enqueue the message to pgmq
  -- Message contains job_id which the processor uses to fetch full details
  select pgmq.send(
    'generation_jobs',
    jsonb_build_object(
      'job_id', v_job_id,
      'project_id', p_project_id,
      'workbench_id', p_workbench_id
    )
  ) into v_msg_id;

  return v_job_id;
end;
$$;

-- 9. Create helper function to update job progress (for Edge Function)
-- Uses service role, so no RLS check needed
create or replace function update_generation_job_progress(
  p_job_id uuid,
  p_status text,
  p_completed_scenarios int default null,
  p_failed_scenarios int default null,
  p_output_ids bigint[] default null,
  p_errors jsonb default null,
  p_started_at timestamp with time zone default null,
  p_completed_at timestamp with time zone default null
)
returns void
language plpgsql
security definer
as $$
begin
  update generation_job_status
  set
    status = coalesce(p_status, status),
    completed_scenarios = coalesce(p_completed_scenarios, completed_scenarios),
    failed_scenarios = coalesce(p_failed_scenarios, failed_scenarios),
    output_ids = coalesce(p_output_ids, output_ids),
    errors = coalesce(p_errors, errors),
    started_at = coalesce(p_started_at, started_at),
    completed_at = coalesce(p_completed_at, completed_at),
    updated_at = now()
  where id = p_job_id;
end;
$$;

-- 10. Grant execute permissions
grant execute on function enqueue_generation_job to authenticated;
grant execute on function update_generation_job_progress to service_role;

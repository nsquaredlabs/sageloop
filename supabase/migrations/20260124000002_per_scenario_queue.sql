-- =====================================================
-- Migration: Refactor to per-scenario queue messages
-- Each scenario gets its own queue message for true async processing
-- =====================================================

-- 1. Update enqueue_generation_job to create one message per scenario
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
  v_scenario record;
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

  -- Enqueue one message per scenario
  for v_scenario in
    select id, input_text, "order"
    from scenarios
    where project_id = p_project_id
    order by "order" asc
  loop
    perform pgmq.send(
      'generation_jobs',
      jsonb_build_object(
        'job_id', v_job_id,
        'scenario_id', v_scenario.id,
        'project_id', p_project_id,
        'workbench_id', p_workbench_id
      )
    );
  end loop;

  return v_job_id;
end;
$$;

-- 2. Create atomic function to record a completed scenario
-- This handles the increment and status update atomically
create or replace function record_scenario_completion(
  p_job_id uuid,
  p_output_id bigint,
  p_is_first boolean default false
)
returns void
language plpgsql
security definer
as $$
declare
  v_total int;
  v_completed int;
  v_failed int;
begin
  -- Atomically update the job
  update generation_job_status
  set
    completed_scenarios = completed_scenarios + 1,
    output_ids = array_append(output_ids, p_output_id),
    started_at = case when p_is_first then now() else started_at end,
    status = 'processing',
    updated_at = now()
  where id = p_job_id
  returning total_scenarios, completed_scenarios, failed_scenarios
  into v_total, v_completed, v_failed;

  -- Check if job is complete
  if v_completed + v_failed >= v_total then
    update generation_job_status
    set
      status = case
        when v_failed = 0 then 'completed'
        when v_completed = 0 then 'failed'
        else 'partial'
      end,
      completed_at = now(),
      updated_at = now()
    where id = p_job_id;
  end if;
end;
$$;

-- 3. Create atomic function to record a failed scenario
create or replace function record_scenario_failure(
  p_job_id uuid,
  p_scenario_id bigint,
  p_error text,
  p_is_first boolean default false
)
returns void
language plpgsql
security definer
as $$
declare
  v_total int;
  v_completed int;
  v_failed int;
begin
  -- Atomically update the job
  update generation_job_status
  set
    failed_scenarios = failed_scenarios + 1,
    errors = errors || jsonb_build_array(jsonb_build_object('scenario_id', p_scenario_id, 'error', p_error)),
    started_at = case when p_is_first then now() else started_at end,
    status = 'processing',
    updated_at = now()
  where id = p_job_id
  returning total_scenarios, completed_scenarios, failed_scenarios
  into v_total, v_completed, v_failed;

  -- Check if job is complete
  if v_completed + v_failed >= v_total then
    update generation_job_status
    set
      status = case
        when v_failed = 0 then 'completed'
        when v_completed = 0 then 'failed'
        else 'partial'
      end,
      completed_at = now(),
      updated_at = now()
    where id = p_job_id;
  end if;
end;
$$;

-- 4. Grant execute permissions
grant execute on function record_scenario_completion to service_role;
grant execute on function record_scenario_failure to service_role;

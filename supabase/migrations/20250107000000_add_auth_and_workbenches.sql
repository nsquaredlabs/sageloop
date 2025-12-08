-- =====================================================
-- Migration: Add authentication and workbench support
-- =====================================================

-- 1. Create workbenches table
create table workbenches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create user_workbenches junction table (many-to-many)
create table user_workbenches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  workbench_id uuid references workbenches(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default now(),
  unique(user_id, workbench_id)
);

-- 3. Add workbench_id and created_by to projects
alter table projects
  add column workbench_id uuid references workbenches(id) on delete cascade,
  add column created_by uuid references auth.users(id);

-- 4. Create indexes
create index user_workbenches_user_id_idx on user_workbenches(user_id);
create index user_workbenches_workbench_id_idx on user_workbenches(workbench_id);
create index projects_workbench_id_idx on projects(workbench_id);
create index projects_created_by_idx on projects(created_by);

-- 5. Add updated_at trigger for workbenches
create trigger update_workbenches_updated_at
  before update on workbenches
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
alter table workbenches enable row level security;
alter table user_workbenches enable row level security;
alter table projects enable row level security;
alter table scenarios enable row level security;
alter table outputs enable row level security;
alter table ratings enable row level security;
alter table extractions enable row level security;
alter table metrics enable row level security;

-- Workbenches policies
create policy "Users can view their workbenches"
  on workbenches for select
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = workbenches.id
      and user_workbenches.user_id = auth.uid()
    )
  );

create policy "Users can create workbenches"
  on workbenches for insert
  with check (true); -- Any authenticated user can create a workbench

create policy "Users can update their workbenches"
  on workbenches for update
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = workbenches.id
      and user_workbenches.user_id = auth.uid()
    )
  );

create policy "Users can delete their workbenches"
  on workbenches for delete
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = workbenches.id
      and user_workbenches.user_id = auth.uid()
      and user_workbenches.role = 'owner'
    )
  );

-- User_workbenches policies
create policy "Users can view workbench memberships"
  on user_workbenches for select
  using (
    workbench_id in (
      select workbench_id from user_workbenches
      where user_id = auth.uid()
    )
  );

create policy "Users can join workbenches they create"
  on user_workbenches for insert
  with check (user_id = auth.uid());

-- Projects policies
create policy "Users can view projects in their workbenches"
  on projects for select
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = projects.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

create policy "Users can create projects in their workbenches"
  on projects for insert
  with check (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = projects.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

create policy "Users can update projects in their workbenches"
  on projects for update
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = projects.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

create policy "Users can delete projects in their workbenches"
  on projects for delete
  using (
    exists (
      select 1 from user_workbenches
      where user_workbenches.workbench_id = projects.workbench_id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Scenarios policies (inherit from projects)
create policy "Users can view scenarios in their workbench projects"
  on scenarios for select
  using (
    exists (
      select 1 from projects
      join user_workbenches on projects.workbench_id = user_workbenches.workbench_id
      where scenarios.project_id = projects.id
      and user_workbenches.user_id = auth.uid()
    )
  );

create policy "Users can manage scenarios in their workbench projects"
  on scenarios for all
  using (
    exists (
      select 1 from projects
      join user_workbenches on projects.workbench_id = user_workbenches.workbench_id
      where scenarios.project_id = projects.id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Outputs policies (inherit from scenarios → projects)
create policy "Users can manage outputs in their workbench projects"
  on outputs for all
  using (
    exists (
      select 1 from scenarios
      join projects on scenarios.project_id = projects.id
      join user_workbenches on projects.workbench_id = user_workbenches.workbench_id
      where outputs.scenario_id = scenarios.id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Ratings policies (inherit from outputs → scenarios → projects)
create policy "Users can manage ratings in their workbench projects"
  on ratings for all
  using (
    exists (
      select 1 from outputs
      join scenarios on outputs.scenario_id = scenarios.id
      join projects on scenarios.project_id = projects.id
      join user_workbenches on projects.workbench_id = user_workbenches.workbench_id
      where ratings.output_id = outputs.id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Extractions policies
create policy "Users can manage extractions in their workbench projects"
  on extractions for all
  using (
    exists (
      select 1 from projects
      join user_workbenches on projects.workbench_id = user_workbenches.workbench_id
      where extractions.project_id = projects.id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- Metrics policies
create policy "Users can manage metrics in their workbench projects"
  on metrics for all
  using (
    exists (
      select 1 from projects
      join user_workbenches on projects.workbench_id = user_workbenches.workbench_id
      where metrics.project_id = projects.id
      and user_workbenches.user_id = auth.uid()
    )
  );

-- =====================================================
-- Auto-create personal workbench on signup
-- =====================================================

create or replace function handle_new_user()
returns trigger as $$
declare
  new_workbench_id uuid;
  workbench_name text;
begin
  -- Extract name from email prefix (before @)
  workbench_name := split_part(new.email, '@', 1) || '''s Workbench';

  -- Create personal workbench
  insert into workbenches (name)
  values (workbench_name)
  returning id into new_workbench_id;

  -- Add user as owner
  insert into user_workbenches (user_id, workbench_id, role)
  values (new.id, new_workbench_id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

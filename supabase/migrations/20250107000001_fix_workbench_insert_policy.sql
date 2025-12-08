-- Fix: Update handle_new_user() trigger to properly handle RLS
-- The trigger needs to bypass RLS when creating workbenches and user_workbench records
-- during signup, as auth.uid() may not be properly set during the trigger execution

-- Drop the existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Recreate the function with proper RLS handling
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

  return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Fix: Simplify user_workbenches SELECT policy
-- The previous policy had a circular dependency that prevented users from seeing their own memberships

drop policy if exists "Users can view workbench memberships" on user_workbenches;

create policy "Users can view their own workbench memberships"
  on user_workbenches for select
  using (user_id = auth.uid());

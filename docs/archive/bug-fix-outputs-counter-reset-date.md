# Bug Fix: Outputs Counter Reset Date Not Updating

**Created**: 2026-01-16
**Status**: Implementation Required
**Priority**: High
**Type**: Bug Fix

## Current Buggy Behavior

Users are seeing stale reset dates on the subscription page. For example, the outputs counter displays "Resets on Dec 30, 2025" even though the current date is mid-January 2026.

The usage meter shows incorrect information:

- Reset date is stuck at the original `current_period_end` value
- Users cannot tell when their quotas will actually reset
- This creates confusion about billing cycles

## Root Cause Analysis

### The Problem

The subscription system stores `current_period_end` in the database but **never updates it after the initial creation**. Here's the flow:

1. **User signs up** - `handle_new_user()` trigger creates subscription with:

   ```sql
   current_period_end = calculate_next_period_end()
   -- Returns: date_trunc('month', now() + interval '1 month')
   -- e.g., if user signed up Dec 15, 2025 -> Jan 1, 2026
   ```

2. **Time passes** - January 1, 2026 arrives and passes

3. **No update occurs** - There is no mechanism to:
   - Reset usage counters to 0
   - Update `current_period_end` to the next billing cycle (Feb 1, 2026)

4. **UI shows stale date** - The `UsageMeter` component displays the original `current_period_end`:
   ```tsx
   // app/settings/subscription/page.tsx
   <UsageMeter
     resetDate={sub.current_period_end}  // Still shows old date
     ...
   />
   ```

### Affected Code Locations

1. **Database Function** - `calculate_next_period_end()`:
   - File: `supabase/migrations/20251216000000_add_subscription_system_phase1.sql`
   - Lines 367-373
   - Only used at signup, not for period transitions

2. **Reset Function** - `reset_monthly_usage()`:
   - File: Same migration file
   - Lines 351-363
   - Only resets counters, does NOT update `current_period_end`
   - Never called (no cron job configured)

3. **UI Component** - `UsageMeter`:
   - File: `components/subscription/usage-meter.tsx`
   - Line 74: Displays `resetDate` prop directly
   - No client-side fallback calculation

## Proposed Fix Approach

### Option A: Fix Database Function + Add Cron Job (Recommended)

**Step 1**: Update `reset_monthly_usage()` to also update period dates:

```sql
create or replace function reset_monthly_usage(workbench_uuid uuid)
returns void as $$
begin
  update subscriptions
  set
    standard_outputs_used = 0,
    premium_outputs_used = 0,
    last_usage_reset = now(),
    current_period_start = current_period_end,  -- Move end to start
    current_period_end = date_trunc('month', current_period_end + interval '1 month'),  -- Calculate new end
    updated_at = now()
  where workbench_id = workbench_uuid
  and status = 'active'
  and current_period_end <= now();  -- Only if period has ended
end;
$$ language plpgsql security definer;
```

**Step 2**: Create a cron job (Supabase pg_cron) to run monthly:

```sql
-- Enable pg_cron extension if not enabled
create extension if not exists pg_cron;

-- Schedule reset for 1st of each month at 00:01 UTC
select cron.schedule(
  'reset-monthly-usage',
  '1 0 1 * *',  -- At 00:01 on day-of-month 1
  $$
  do $$
  declare
    sub record;
  begin
    for sub in select workbench_id from subscriptions where status = 'active'
    loop
      perform reset_monthly_usage(sub.workbench_id);
    end loop;
  end;
  $$
$$
);
```

**Step 3**: Add on-demand reset check in `get_workbench_subscription`:

For users who access the app before the cron runs, check and auto-reset:

```sql
create or replace function get_workbench_subscription(workbench_uuid uuid)
returns table (...) as $$
begin
  -- Auto-reset if period has ended (handles missed cron runs)
  if exists (
    select 1 from subscriptions
    where workbench_id = workbench_uuid
    and status = 'active'
    and current_period_end <= now()
  ) then
    perform reset_monthly_usage(workbench_uuid);
  end if;

  -- Return updated subscription data
  return query
  select ...
  from subscriptions s
  join subscription_plans p on s.plan_id = p.id
  where s.workbench_id = workbench_uuid
  and s.status = 'active';
end;
$$ language plpgsql security definer;
```

### Option B: Client-Side Calculation (Fallback Only)

If database changes are delayed, add client-side logic to calculate the "real" reset date:

```tsx
// components/subscription/usage-meter.tsx
function calculateNextResetDate(originalResetDate: string): string {
  const resetDate = new Date(originalResetDate);
  const now = new Date();

  // If the reset date is in the past, calculate the next one
  while (resetDate <= now) {
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1); // First of the month
  }

  return resetDate.toISOString();
}

// Use in component:
const effectiveResetDate = calculateNextResetDate(resetDate);
```

**Note**: This only fixes the display; usage counters would still be wrong until the database is fixed.

## Files That Need to Be Changed

### Database Changes (Required)

1. **New Migration File**: `supabase/migrations/[timestamp]_fix_subscription_period_reset.sql`
   - Update `reset_monthly_usage()` function
   - Update `get_workbench_subscription()` to auto-reset
   - Add pg_cron job configuration

### Optional UI Fallback

2. **UI Component**: `components/subscription/usage-meter.tsx`
   - Add `calculateNextResetDate()` helper
   - Apply to displayed reset date

## Testing Considerations

### Unit Tests

1. **Test period transition logic**:

   ```typescript
   describe("reset_monthly_usage", () => {
     it("should update current_period_end to next month", async () => {
       // Create subscription with period_end in the past
       // Call reset_monthly_usage
       // Verify period_end is now in the future
     });

     it("should reset usage counters to zero", async () => {
       // Create subscription with usage > 0
       // Call reset_monthly_usage
       // Verify counters are 0
     });

     it("should not reset if period has not ended", async () => {
       // Create subscription with period_end in the future
       // Call reset_monthly_usage
       // Verify no changes
     });
   });
   ```

2. **Test auto-reset in get_workbench_subscription**:
   ```typescript
   describe("get_workbench_subscription", () => {
     it("should auto-reset if period has ended", async () => {
       // Create subscription with period_end in the past
       // Call get_workbench_subscription
       // Verify returned period_end is in the future
     });
   });
   ```

### Integration Tests

1. **Test full billing cycle**:
   - Create user on Dec 15
   - Verify `current_period_end` is Jan 1
   - Simulate time passing to Jan 2
   - Call subscription API
   - Verify `current_period_end` is Feb 1

### Manual Testing

1. **Create a test subscription with past period_end**:

   ```sql
   update subscriptions
   set current_period_end = now() - interval '1 day'
   where workbench_id = '[test-workbench-id]';
   ```

2. **Access the subscription page**
3. **Verify the reset date shows a future date**

### Edge Cases to Test

1. User signs up on Jan 31 - what is their next period end? (Feb 28/29)
2. User accesses app exactly at midnight UTC on reset day
3. Cron job fails - does on-demand reset work?
4. Multiple workbenches - do they all reset independently?

## Implementation Checklist

- [ ] Create new migration file with updated functions
- [ ] Configure pg_cron extension and job in Supabase
- [ ] Add unit tests for period transition logic
- [ ] Add integration test for full billing cycle
- [ ] Test in staging environment with past dates
- [ ] Deploy migration to production
- [ ] Verify existing users with stale dates are auto-corrected
- [ ] Monitor cron job execution on next month boundary

## Dependencies

- Supabase pg_cron extension must be enabled
- Service role permissions for cron job execution
- No frontend deployment required (data-driven fix)

## Estimated Effort

- Database migration: 1-2 hours
- Testing: 2-3 hours
- Deployment and verification: 1 hour

**Total**: ~4-6 hours

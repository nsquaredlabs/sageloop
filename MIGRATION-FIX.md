# Migration Fix Summary

## Problem

When attempting to run the production migration, the following error occurred:

```
ERROR: 23503: insert or update on table 'subscriptions' violates foreign key constraint 'subscriptions_plan_id_fkey'
DETAIL: Key (plan_id)=(free) is not present in table 'subscription_plans'.
```

## Root Cause

The schema migration file (`20251216000000_add_subscription_system_phase1.sql`) was creating the `subscription_plans` **table structure** but **NOT inserting the plan data** (free, pro, team, enterprise rows).

The INSERT statements only existed in `seed.sql`, which:
- ✅ Runs during local development (`npx supabase db reset`)
- ❌ Does NOT run during production migration (`npx supabase db push`)

This meant:
1. Local testing worked fine (seed.sql populated the data)
2. Production migration failed (no seed data, empty table)

## The Fix

Updated `supabase/migrations/20251216000000_add_subscription_system_phase1.sql` to include the INSERT statements:

```sql
create table subscription_plans (...);

-- NEW: Insert subscription plans (Phase 1: Only free is available)
insert into subscription_plans (...) values
  ('free', 'Free', ..., 100, 0, true, ...),  -- Available
  ('pro', 'Pro', ..., 2000, 500, false, ...), -- Coming soon
  ('team', 'Team', ..., 5000, 1500, false, ...), -- Coming soon
  ('enterprise', 'Enterprise', ..., 20000, 5000, false, ...); -- Coming soon
```

## What Changed

### Before (Broken)
- **Migration file**: Creates empty `subscription_plans` table
- **Seed file**: Inserts 4 plan rows
- **Result**: Works locally, fails in production

### After (Fixed)
- **Migration file**: Creates `subscription_plans` table + inserts 4 plan rows
- **Seed file**: Still has INSERT (idempotent, uses ON CONFLICT DO NOTHING)
- **Result**: Works locally AND in production

## Verification

To verify the fix works, run locally:

```bash
# Reset local database (applies all migrations)
npx supabase db reset

# Verify subscription_plans has data
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT id, display_name, is_available FROM subscription_plans ORDER BY sort_order;"

# Expected output:
#  id         | display_name | is_available
# ------------|--------------|-------------
#  free       | Free         | true
#  pro        | Pro          | false
#  team       | Team         | false
#  enterprise | Enterprise   | false
```

## Next Steps

1. **Test locally**: Follow [MIGRATION-STEPS.md](MIGRATION-STEPS.md)
2. **Deploy to production**: Follow [docs/phase1-deployment-guide.md](docs/phase1-deployment-guide.md)

The migration should now work correctly in production!

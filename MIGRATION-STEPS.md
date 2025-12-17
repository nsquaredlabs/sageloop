# Step-by-Step Migration Guide (Local Testing)

Follow these steps **IN ORDER** to test the migration locally before running in production.

## Step 1: Reset Local Database

Start with a clean slate:

```bash
npx supabase db reset
```

**What this does:**
- Applies all migrations including `20251216000000_add_subscription_system_phase1.sql`
- Migration creates subscription_plans table AND inserts 4 plan rows (free/pro/team/enterprise)
- Seeds test data (including test user with subscription)
- Trigger auto-creates subscription for test user

**Verify it worked:**
```bash
# Dev server should still be running
# Visit http://localhost:3000
# Login with test@example.com / testpass123
# Go to Settings → Subscription (should show Free tier, 0/100 outputs)
```

## Step 2: Verify Schema Migration

Before migrating users, verify the schema is correct:

```bash
# Option A: Via Supabase Studio
# 1. Open http://127.0.0.1:54323
# 2. Go to SQL Editor
# 3. Copy/paste contents of scripts/verify-schema-before-migration.sql
# 4. Run it

# Option B: Via command line (if you have psql installed)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f scripts/verify-schema-before-migration.sql
```

**Expected output:**
```
CHECK 1: Subscription Plans
  free    | Free         | $0    | 100   | 0     | t
  pro     | Pro          | $49   | 2000  | 500   | f
  team    | Team         | $99   | 5000  | 1500  | f
  enterprise | Enterprise | $499 | 20000 | 5000  | f

CHECK 2: RPC Functions
  PASSED: All required RPC functions exist

CHECK 3: Trigger Function
  PASSED: handle_new_user() trigger exists

CHECK 4: Existing Workbenches
  total_workbenches: 1
  workbenches_with_subscriptions: 1
  workbenches_without_subscriptions: 0
```

## Step 3: Create Test Workbench WITHOUT Subscription

Now we'll simulate existing users by creating a workbench without a subscription:

```bash
# Open Supabase Studio SQL Editor: http://127.0.0.1:54323
# Copy/paste and run:
```

```sql
-- Create test user without subscription
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'existing-user@example.com',
  crypt('testpass123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false, 'authenticated', 'authenticated'
) ON CONFLICT DO NOTHING;

-- Create workbench WITHOUT subscription (simulating pre-migration state)
INSERT INTO workbenches (id, name, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Existing User Workbench',
  now()
) ON CONFLICT DO NOTHING;

-- Link user to workbench
INSERT INTO user_workbenches (user_id, workbench_id, role, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'owner',
  now()
) ON CONFLICT DO NOTHING;

-- Verify workbench has NO subscription
SELECT
  w.id, w.name,
  CASE WHEN s.id IS NULL THEN 'NO SUBSCRIPTION ❌' ELSE 'HAS SUBSCRIPTION ✅' END as status
FROM workbenches w
LEFT JOIN subscriptions s ON s.workbench_id = w.id
WHERE w.id = '22222222-2222-2222-2222-222222222222'::uuid;
```

**Expected output:**
```
NO SUBSCRIPTION ❌
```

## Step 4: Test Login (Should Fail)

Try to log in as the existing user:

```bash
# 1. Go to http://localhost:3000/login
# 2. Login with: existing-user@example.com / testpass123
# 3. Try to navigate to Settings → Subscription
```

**Expected result:**
```
Error: "No active subscription found for workbench"
```

This is the problem we're fixing with the migration!

## Step 5: Run User Migration Script

Now run the migration to add subscriptions for existing users:

```bash
# Via Supabase Studio SQL Editor: http://127.0.0.1:54323
# Copy/paste contents of scripts/migrate-existing-users-to-subscriptions.sql
# Run it
```

**Expected output:**
```
-- Total workbenches: 2
-- Workbenches with subscriptions: 2
-- Workbenches WITHOUT subscriptions: 0 ✅

-- Should show subscription created for both workbenches
```

## Step 6: Verify Migration Worked

Check that the existing user now has a subscription:

```sql
SELECT
  w.id, w.name,
  s.plan_id,
  s.status,
  s.standard_outputs_limit,
  CASE WHEN s.id IS NULL THEN 'NO SUBSCRIPTION ❌' ELSE 'HAS SUBSCRIPTION ✅' END as status
FROM workbenches w
LEFT JOIN subscriptions s ON s.workbench_id = w.id
WHERE w.id = '22222222-2222-2222-2222-222222222222'::uuid;
```

**Expected output:**
```
HAS SUBSCRIPTION ✅
plan_id: free
status: active
standard_outputs_limit: 100
```

## Step 7: Test Login (Should Work Now)

Try logging in again:

```bash
# 1. Go to http://localhost:3000/login
# 2. Login with: existing-user@example.com / testpass123
# 3. Navigate to Settings → Subscription
```

**Expected result:**
```
✅ Free tier page loads
✅ Usage meter shows "0 / 100 outputs"
✅ No errors
```

## Step 8: Test New User Creation

Create a brand new user to verify auto-subscription works:

```bash
# 1. Go to http://localhost:3000/signup
# 2. Sign up with: newuser@example.com / testpass123
# 3. Should redirect to /projects
# 4. Go to Settings → Subscription
```

**Expected result:**
```
✅ Signup succeeds
✅ Subscription page loads
✅ Shows Free tier with 0/100 outputs
✅ No errors in console
```

## Success Criteria

All of these should be true:

- [ ] Existing users (created before migration) have subscriptions
- [ ] New users (created after migration) get subscriptions automatically
- [ ] Settings → Subscription page loads for all users
- [ ] Usage meters show correct limits (100 for free tier)
- [ ] Can generate outputs without "No subscription" errors

## Next Steps

Once local testing passes:

1. **Backup production database**
   ```bash
   # Export production data first!
   npx supabase db dump --linked > backup-$(date +%Y%m%d).sql
   ```

2. **Run migration on production**
   - Follow [`docs/phase1-deployment-guide.md`](docs/phase1-deployment-guide.md)
   - Run schema migration first: `npx supabase db push --linked`
   - Then run user migration: `scripts/migrate-existing-users-to-subscriptions.sql`

3. **Monitor for issues**
   - Check Supabase logs
   - Watch for "No subscription" errors
   - Verify new signups work

## Troubleshooting

### "subscription_plans table does not exist"
**Fix:** Run `npx supabase db reset` first

### "violates foreign key constraint"
**Fix:** Run schema migration before user migration

### "No active subscription found"
**Fix:** Run the user migration script

### Migration runs but no subscriptions created
**Check:** Verify workbenches exist first:
```sql
SELECT COUNT(*) FROM workbenches;
```

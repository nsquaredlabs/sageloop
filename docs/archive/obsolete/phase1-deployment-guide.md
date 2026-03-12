# Phase 1 Deployment Guide: Free Tier + Quota System

This guide covers deploying the subscription and quota system to production.

## Overview

Phase 1 introduces:

- ✅ Free tier subscription for all users (100 outputs/month, gpt-5-nano only)
- ✅ Quota enforcement at API level (pre-generation checks)
- ✅ Usage tracking and dashboard
- ✅ User creation flow with auto-subscription
- ✅ Unified settings UX (Subscription + API Keys tabs)

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Database migrations reviewed
- [ ] Production database backup created
- [ ] Supabase project selected for production

## Step 1: Database Migration

### 1.1 Test Migration Locally FIRST

**CRITICAL**: Before running on production, test the migration locally!

```bash
# Follow the step-by-step guide
cat MIGRATION-STEPS.md

# Or run the quick test
npx supabase db reset  # Applies all migrations including Phase 1
```

**Expected output:**

- `subscription_plans` table created with 4 rows (free, pro, team, enterprise)
- Test user gets auto-created subscription
- Settings page loads without errors

### 1.2 Apply Schema Migration to Production

**CRITICAL**: You MUST run the schema migration before the data migration!

```bash
# Push migrations to production database
npx supabase db push --linked

# This will apply:
# - 20251216000000_add_subscription_system_phase1.sql
```

**What this creates:**

- `subscription_plans` table with 4 plan rows:
  - **free**: $0, 100 outputs, gpt-5-nano only ✅ Available
  - **pro**: $49, 2000 standard + 500 premium outputs (Coming soon)
  - **team**: $99, 5000 standard + 1500 premium (Coming soon)
  - **enterprise**: $499, 20k standard + 5k premium (Coming soon)
- `subscriptions` table (workbench-level subscriptions)
- `usage_events` table (audit trail)
- RPC functions: `get_workbench_subscription()`, `check_quota_available()`, `increment_usage()`
- Updated `handle_new_user()` trigger to auto-create subscriptions

**Verify schema migration succeeded:**

```sql
-- Check that subscription plans exist (CRITICAL)
SELECT id, display_name, is_available FROM subscription_plans ORDER BY sort_order;
-- Should show 4 rows: free (available), pro/team/enterprise (not available)

-- Should return:
--  id         | display_name | is_available
-- ------------|--------------|-------------
--  free       | Free         | true
--  pro        | Pro          | false
--  team       | Team         | false
--  enterprise | Enterprise   | false
```

### 1.3 Migrate Existing Users (AFTER schema migration)

**IMPORTANT**: Only run this after Step 1.2 succeeds!

Existing users don't have subscriptions yet. Run the migration script:

```bash
# Connect to production database
npx supabase db remote

# Run migration script
psql -h db.<project-ref>.supabase.co \
     -U postgres \
     -d postgres \
     -f scripts/migrate-existing-users-to-subscriptions.sql
```

**OR** via Supabase Studio:

1. Go to SQL Editor in Supabase Studio
2. Copy contents of `scripts/migrate-existing-users-to-subscriptions.sql`
3. Run the script
4. Verify all workbenches have subscriptions (check verification queries at end)

**Expected results:**

```sql
-- Total workbenches: 50
-- Workbenches with subscriptions: 50
-- Workbenches WITHOUT subscriptions: 0
```

### 1.3 Verify Migration

Run verification queries:

```sql
-- Check all users have free tier subscriptions
SELECT
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT uw.workbench_id) as total_workbenches,
  COUNT(DISTINCT s.workbench_id) as workbenches_with_subscriptions
FROM auth.users u
LEFT JOIN user_workbenches uw ON uw.user_id = u.id
LEFT JOIN subscriptions s ON s.workbench_id = uw.workbench_id;

-- Should show: total_users = total_workbenches = workbenches_with_subscriptions
```

## Step 2: Environment Variables

Ensure these are set in production (Vercel/deployment platform):

```env
# Existing vars (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# System API keys (for free tier users)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Tally form ID for waitlist
NEXT_PUBLIC_WAITLIST_FORM_ID=<your-tally-form-id>
```

## Step 3: Code Deployment

### 3.1 Deploy to Production

```bash
# Build and deploy
npm run build
git push origin main  # Triggers Vercel deployment
```

### 3.2 Verify Deployment

1. **Check Settings Page**
   - Navigate to Settings (user menu → Settings)
   - Should land on Subscription tab
   - Verify usage meter shows "0 / 100 outputs"
   - Check API Keys tab exists

2. **Test User Creation Flow**
   - Create a new test user via signup
   - Verify user can log in
   - Check Settings → Subscription shows free tier
   - Verify user has 100 output quota

3. **Test Quota Enforcement**
   - Create a project with gpt-5-nano model
   - Generate outputs (should work)
   - Try changing model to gpt-4 (should fail with quota error)

4. **Test Usage Tracking**
   - Generate 5 outputs
   - Check Settings → Subscription
   - Usage meter should show "5 / 100 outputs"

## Step 4: Monitor for Issues

### 4.1 Check Supabase Logs

Monitor for errors in Supabase:

- Database logs: Look for trigger failures
- Edge Function logs: Check API routes

### 4.2 Sentry/Error Tracking

Watch for:

- "No active subscription found" errors
- Quota enforcement failures
- RPC function errors

### 4.3 Key Metrics to Track

```sql
-- Users created in last 24 hours
SELECT COUNT(*) FROM auth.users
WHERE created_at > now() - interval '24 hours';

-- Subscriptions created today
SELECT COUNT(*) FROM subscriptions
WHERE created_at::date = CURRENT_DATE;

-- Average outputs used per user
SELECT
  AVG(standard_outputs_used) as avg_outputs_used,
  MAX(standard_outputs_used) as max_outputs_used
FROM subscriptions
WHERE plan_id = 'free';

-- Users approaching quota (>80%)
SELECT
  w.name,
  s.standard_outputs_used,
  s.standard_outputs_limit,
  ROUND((s.standard_outputs_used::float / s.standard_outputs_limit * 100), 2) as usage_pct
FROM subscriptions s
JOIN workbenches w ON w.id = s.workbench_id
WHERE s.plan_id = 'free'
  AND s.standard_outputs_used::float / s.standard_outputs_limit > 0.8
ORDER BY usage_pct DESC;
```

## Step 5: Communication

### 5.1 Announce to Existing Users

Email template:

```
Subject: Sageloop Now Has Usage Limits

Hi [name],

We've updated Sageloop with a free tier that includes:
- 100 AI outputs per month
- Access to GPT-5-nano model
- All core features (scenarios, ratings, insights)

You can track your usage in Settings → Subscription.

Paid plans (with higher limits and premium models) are coming soon!
Join the waitlist: [Tally link]

- The Sageloop Team
```

### 5.2 Update Documentation

- [ ] Update landing page with pricing info
- [ ] Add "Free Tier" badge to signup page
- [ ] Update README with new features
- [ ] Create FAQ about quota limits

## Rollback Plan

If something goes wrong:

### Rollback Database Migration

```sql
-- WARNING: This will delete all subscriptions and usage data!

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS usage_events CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Drop RPC functions
DROP FUNCTION IF EXISTS get_workbench_subscription(uuid);
DROP FUNCTION IF EXISTS check_quota_available(uuid, text, int);
DROP FUNCTION IF EXISTS increment_usage(uuid, text, text, int, int, int, bigint);
DROP FUNCTION IF EXISTS reset_monthly_usage(uuid);
DROP FUNCTION IF EXISTS calculate_next_period_end();

-- Revert handle_new_user() trigger to previous version
-- (Copy from previous migration file)
```

### Rollback Code Deployment

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

## Post-Deployment Tasks

- [ ] Monitor error rates for 24 hours
- [ ] Check quota enforcement working correctly
- [ ] Verify new user signups work
- [ ] Confirm usage tracking accurate
- [ ] Test settings UX on mobile
- [ ] Update internal docs with new architecture

## Troubleshooting

### Issue: "No active subscription found"

**Cause**: User's workbench doesn't have a subscription
**Fix**:

```sql
-- Find users without subscriptions
SELECT u.email, uw.workbench_id
FROM auth.users u
JOIN user_workbenches uw ON uw.user_id = u.id
LEFT JOIN subscriptions s ON s.workbench_id = uw.workbench_id
WHERE s.id IS NULL;

-- Create subscription manually
INSERT INTO subscriptions (workbench_id, plan_id, status, ...)
VALUES ('<workbench-id>', 'free', 'active', ...);
```

### Issue: Quota exceeded immediately

**Cause**: Usage counter not reset from testing
**Fix**:

```sql
-- Reset usage for specific workbench
UPDATE subscriptions
SET standard_outputs_used = 0,
    premium_outputs_used = 0
WHERE workbench_id = '<workbench-id>';
```

### Issue: User creation fails

**Cause**: `handle_new_user()` trigger failing
**Fix**:

1. Check Supabase logs for error
2. Verify subscription_plans table has 'free' plan
3. Check RLS policies allow trigger to insert

## Success Criteria

- ✅ All existing users have free tier subscriptions
- ✅ New user signups automatically get subscriptions
- ✅ Quota enforcement working (rejects when limit exceeded)
- ✅ Usage tracking accurate (counts match actual outputs)
- ✅ Settings UX accessible and functional
- ✅ No increase in error rates

## Next Steps (Phase 2)

After Phase 1 is stable:

- [ ] Stripe integration for paid plans
- [ ] BYOK (Bring Your Own Keys) for paid users
- [ ] Team collaboration features
- [ ] Advanced usage analytics

## Support

If issues arise during deployment:

- Check Supabase dashboard for errors
- Review application logs
- Contact team lead for assistance

# Phase 1 Cleanup Tasks

## Overview

After deploying the subscription system, we need to handle the transition for existing users who may have configured their own API keys (BYOK). Since Phase 1 only supports the free tier with system keys, we need to:

1. Hide BYOK settings for free tier users
2. Migrate existing projects to use `gpt-5-nano` (the only free tier model)

## Task 1: Hide BYOK Settings for Free Tier Users

### Goal

Only show the "API Keys" tab in Settings for users on paid plans (pro/team/enterprise). Free tier users should only see the "Subscription" tab.

### Implementation

**File: `app/settings/layout.tsx`**

```tsx
// Fetch subscription to determine which tabs to show
const { data: subscription } = await supabase.rpc(
  "get_workbench_subscription",
  { workbench_uuid: userWorkbenches.workbench_id as string },
);

const canUseBYOK = subscription?.plan_id !== "free";
```

**File: `components/settings/settings-tabs.tsx`**

```tsx
// Add prop to conditionally hide API Keys tab
interface SettingsTabsProps {
  canUseBYOK: boolean;
}

export function SettingsTabs({ canUseBYOK }: SettingsTabsProps) {
  const tabs = [
    { name: 'Subscription', href: '/settings/subscription' },
    // Only show API Keys for paid plans
    ...(canUseBYOK ? [{ name: 'API Keys', href: '/settings/api-keys' }] : []),
  ];

  return (/* tab rendering */);
}
```

**File: `app/settings/api-keys/page.tsx`**

Add access control at the page level:

```tsx
export default async function ApiKeysPage() {
  const supabase = await createServerClient();

  // Get subscription
  const { data: subscription } = await supabase.rpc(
    "get_workbench_subscription",
    { workbench_uuid: workbenchId },
  );

  // Redirect free tier users
  if (subscription?.plan_id === "free") {
    redirect("/settings/subscription?error=upgrade_required");
  }

  // Rest of page...
}
```

**Expected Behavior:**

- Free tier users: Only see "Subscription" tab
- Paid tier users: See both "Subscription" and "API Keys" tabs
- Direct navigation to `/settings/api-keys` on free tier → redirects to subscription page with upgrade message

### Testing

1. Log in as free tier user → should only see Subscription tab
2. Try navigating to `/settings/api-keys` → should redirect with error
3. (Future) Upgrade to Pro → should see API Keys tab appear

---

## Task 2: Remove Stored API Keys (Security)

### Goal

Delete all stored user API keys from the database since they're not being used in Phase 1.

### Why This Is Needed

**Security best practice:** Don't store sensitive data (API keys) that we're not actively using.

- Phase 1 free tier uses system API keys only
- User API keys (BYOK) won't be used until Phase 2 paid plans
- Reduces attack surface if database is compromised
- Users will need to re-enter keys when BYOK is re-enabled (Phase 2)

### Migration Script

**File: `scripts/remove-stored-api-keys.sql`**

See the generated SQL script below.

### What Gets Removed

- `workbenches.encrypted_api_keys` - Encrypted user API keys (OpenAI, Anthropic)

### What Gets Preserved

- Metadata backup showing which workbenches _had_ keys (for audit trail)
- No actual keys are stored in the backup (just boolean flags)

### Verification Queries

```sql
-- Verify all keys are removed
SELECT
  COUNT(*) as total_workbenches,
  COUNT(*) FILTER (WHERE encrypted_api_keys IS NOT NULL) as remaining_keys
FROM workbenches;

-- Expected: remaining_keys should be 0
```

### User Communication

Users who previously added API keys should be notified:

**In-app notice (for Phase 1 deployment):**

```
ℹ️ API Key Update
For security, we've removed stored API keys during the free tier launch.
When paid plans launch, you'll be able to re-add your keys to access premium models.
```

---

## Task 3: Migrate Existing Projects to gpt-5-nano

### Goal

Update all existing projects to use `gpt-5-nano` to ensure they work with the free tier quota system.

### Why This Is Needed

**Breaking change:** Users who previously configured their own API keys may have projects using models like:

- `gpt-4` (requires paid plan)
- `claude-sonnet-4-5` (requires paid plan)
- Other non-free-tier models

These projects will now fail quota checks because:

1. Free tier only allows `gpt-5-nano`
2. System API keys are used (not user's BYOK)
3. Quota middleware enforces model tier restrictions

### Migration Script

**File: `scripts/migrate-projects-to-free-tier-model.sql`**

See the generated SQL script below.

### Verification Queries

```sql
-- Before migration: Count projects by model
SELECT
  model_config->>'model' as model,
  COUNT(*) as count
FROM projects
GROUP BY model_config->>'model'
ORDER BY count DESC;

-- After migration: All should be gpt-5-nano
SELECT
  model_config->>'model' as model,
  COUNT(*) as count
FROM projects
GROUP BY model_config->>'model';

-- Check projects that might have other model references
SELECT id, name, model_config
FROM projects
WHERE model_config->>'model' != 'gpt-5-nano';
```

### Expected Results

**Before:**

```
model                     | count
--------------------------|------
gpt-4                     | 15
claude-sonnet-4-5         | 8
gpt-3.5-turbo             | 12
gpt-5-nano                | 3
```

**After:**

```
model      | count
-----------|------
gpt-5-nano | 38
```

---

## Deployment Steps

### 1. Hide BYOK Settings (Code Changes)

```bash
# 1. Update settings layout and tabs
# 2. Add access control to API Keys page
# 3. Test locally with free tier user
# 4. Deploy to production (no database changes)

npm test
npm run build
git add .
git commit -m "feat: hide BYOK settings for free tier users"
git push origin main
```

### 2. Remove Stored API Keys (Database Change - Security)

```bash
# CRITICAL: Run this FIRST before announcing Phase 1 to users

# Connect to production
npx supabase db remote --linked

# Run removal script
# Copy/paste contents of scripts/remove-stored-api-keys.sql
```

**OR** via Supabase Studio:

1. Go to SQL Editor
2. Copy contents of `scripts/remove-stored-api-keys.sql`
3. Run the script
4. Verify all keys are removed (verification queries in script)

**Why first?** Removes unused sensitive data before users notice the change.

### 3. Migrate Projects to gpt-5-nano (Database Change)

```bash
# Run this AFTER removing API keys

# Connect to production (if not already connected)
npx supabase db remote --linked

# Run migration script
# Copy/paste contents of scripts/migrate-projects-to-free-tier-model.sql
```

**OR** via Supabase Studio:

1. Go to SQL Editor
2. Copy contents of `scripts/migrate-projects-to-free-tier-model.sql`
3. Run the script
4. Verify using verification queries

**Order matters:**

1. Remove API keys (security)
2. Migrate projects (functionality)
3. Deploy code (UX)

---

## Rollback Plan

### Rollback Code Changes

```bash
git revert HEAD
git push origin main
```

### Rollback Database Migration

**WARNING:** Only rollback if you have a backup of original model configurations!

```sql
-- This cannot be fully automated - you need the backup data
-- If you backed up before migration:

-- Restore from backup file
\i /path/to/backup-projects-model-config.sql

-- Or restore specific projects manually if needed
UPDATE projects
SET model_config = jsonb_set(model_config, '{model}', '"gpt-4"')
WHERE id = <project-id>;
```

---

## Communication Plan

### Email to Existing Users

**Subject:** Important Update: Sageloop Free Tier Launch

```
Hi [name],

We've launched a free tier for Sageloop! Here's what changed:

**What's New:**
- Free tier: 100 outputs/month with GPT-5-nano
- Usage tracking in Settings → Subscription
- Paid plans coming soon with more models and features

**What We Changed:**
1. **Your projects:** Automatically migrated to use GPT-5-nano (the free tier model)
2. **API Keys:** For security, we've removed stored API keys since they're not used in the free tier

**When Paid Plans Launch:**
- You'll be able to re-add your API keys
- Access premium models (GPT-4, Claude, etc.)
- Higher usage limits (2,000-20,000 outputs/month)

**Your Projects Still Work:**
All your existing projects, scenarios, and ratings are preserved. They'll now generate outputs using GPT-5-nano through our system.

**Questions?**
Reply to this email or check out our updated docs.

- The Sageloop Team
```

---

## Testing Checklist

### Before Deployment

- [ ] Test BYOK hiding with local free tier user
- [ ] Verify redirect works from `/settings/api-keys`
- [ ] Test API key removal script on local database
- [ ] Verify all keys removed (verification queries)
- [ ] Test project migration script on local database
- [ ] Verify all projects show `gpt-5-nano` after migration
- [ ] Run full test suite (`npm test`)
- [ ] Build succeeds (`npm run build`)

### After Deployment

- [ ] Verify API keys removed from production (security check)
- [ ] Verify free tier users can't access API Keys page
- [ ] Verify existing projects generate outputs successfully
- [ ] Check Supabase logs for any migration errors
- [ ] Test new project creation (should default to gpt-5-nano)
- [ ] Monitor error rates for 24 hours
- [ ] Send communication email to affected users

---

## Success Criteria

- ✅ All stored API keys removed from database (security)
- ✅ Free tier users see only "Subscription" tab
- ✅ Paid tier users see both "Subscription" and "API Keys" tabs (for Phase 2)
- ✅ All projects use `gpt-5-nano` model
- ✅ Existing users can generate outputs without errors
- ✅ No increase in error rates after deployment
- ✅ Users notified of changes via email

---

## Future Considerations (Phase 2)

When paid plans launch:

1. Re-enable BYOK for paid users (already implemented, just gated)
2. Allow paid users to select premium models
3. Migrate any paid users back to their preferred models
4. Update model selection UI to show tier restrictions

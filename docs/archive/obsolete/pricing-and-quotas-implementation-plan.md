# Pricing Tiers & Quotas System Implementation Plan

**Date**: December 16, 2024
**Status**: Planning - Phase 1 (Free Tier Launch)
**Total Estimated Effort**:

- **Phase 1 (Free Tier MVP)**: 20-24 hours across 3 sprints (~1.5-2 weeks)
- **Phase 2 (Paid Tiers + Stripe)**: 28-34 hours across 3 sprints (~2-2.5 weeks)
- **Total**: 48-58 hours (~3-4 weeks)

## Executive Summary

**LAUNCH STRATEGY**: Based on product requirements, we're implementing a **phased launch**:

### 🎯 Phase 1: Free Tier MVP (Launch Immediately) - **20 hours**

**Timeline**: 1.5-2 weeks | **Priority**: CRITICAL (Cost Control)

**What We're Building**:

- ✅ Free tier with **100 GPT-5-nano outputs/month** quota enforcement
- ✅ Real-time usage tracking and dashboard
- ✅ Waitlist signup for Pro/Team/Enterprise tiers (validate demand)
- ✅ Migration of all existing users to free tier
- ✅ Quota warnings at 80% and hard block at 100%

**Why Phase 1 First**:

- **CRITICAL**: Stop hemorrhaging money on unlimited free usage
- Validate demand for paid tiers before building payment infrastructure
- Ship cost controls in 1.5-2 weeks instead of 4 weeks
- Simpler scope = faster, more reliable delivery

### 💳 Phase 2: Paid Tiers (Deferred) - **28 hours**

**Timeline**: 2-2.5 weeks | **Trigger**: 50+ waitlist signups

**What We're Building** (Later):

- Stripe integration for payment processing
- Pro ($49/mo), Team ($99/mo), Enterprise ($499/mo) plans
- Advanced features (email notifications, admin dashboard)
- Upgrade flow from waitlist to paid subscription

---

### 📊 Quick Stats

| Metric       | Phase 1     | Phase 2     | Total       |
| ------------ | ----------- | ----------- | ----------- |
| **Sprints**  | 3 sprints   | 4-5 sprints | 8 sprints   |
| **Effort**   | 20 hours    | 28-34 hours | 48-58 hours |
| **Timeline** | 1.5-2 weeks | 2-2.5 weeks | 3-4 weeks   |
| **Files**    | ~20 files   | ~26 files   | ~46 files   |

---

This plan implements a subscription-based system with usage quotas for AI model outputs. **Phase 1 focuses on immediate cost control** through free tier limits while building waitlist demand for paid tiers.

### Key Deliverables (Phase 1 - Free Tier MVP)

- ❌ Database schema for subscriptions and usage tracking
- ❌ Quota enforcement system (Free tier: 100 outputs/month)
- ❌ Usage dashboard showing consumption and limits
- ❌ Waitlist signup for paid tiers
- ❌ Migration path for existing users to free tier

### Key Deliverables (Phase 2 - Paid Tiers)

- ❌ Stripe integration for payment processing
- ❌ Subscription management UI (upgrade from waitlist)
- ❌ Email notifications for quota warnings and billing events
- ❌ Admin interface for subscription management

---

## Background

### Current State

**What Works**:

- Multi-tenant workbench system with RLS policies
- User authentication via Supabase Auth
- AI output generation with OpenAI and Anthropic
- Encrypted API key storage per workbench
- Token usage tracking in `model_snapshot` JSONB column

**What Doesn't Work**:

- No usage limits or quotas
- No subscription plans or billing
- No consumption tracking at workbench level
- No upgrade/downgrade flows
- All users have unlimited access

### Problem Statement

As Sageloop prepares for public launch, we need to:

1. **Control costs IMMEDIATELY** by limiting AI API usage for free users (Phase 1)
2. **Build waitlist demand** for paid tiers while validating pricing
3. **Track usage** to provide transparency and prevent surprise overages
4. **Enable monetization** when ready to accept payments (Phase 2)

**Key Pain Points**:

- Current system would hemorrhage money at scale (unlimited free usage) - **CRITICAL**
- No way to gate premium AI models (GPT-5.1, Claude Sonnet 4.5)
- No visibility into per-user costs
- Need to validate demand for paid tiers before building full payment system

### Goals

**Phase 1 Goals (Free Tier Launch)**:

1. ✅ Enforce 100 output/month limit for free tier (GPT-5-nano only)
2. ✅ Track real-time usage and display to users
3. ✅ Gracefully handle quota exhaustion (soft limits with warnings)
4. ✅ Create waitlist for Pro/Team/Enterprise tiers
5. ✅ Migrate existing users to free tier subscriptions

**Phase 2 Goals (Paid Tiers - Future)**:

1. Implement 4-tier pricing (Free, Pro, Team, Enterprise) per marketing PRD
2. Integrate Stripe for subscription payments
3. Support upgrade/downgrade with proration
4. Email notifications for quota warnings (80%, 100%)
5. Admin dashboard for subscription analytics

### Non-Goals

**Phase 1 (Free Tier Launch)**:

- ❌ Stripe integration - deferred to Phase 2
- ❌ Paid subscription management - deferred to Phase 2
- ❌ Email notifications - deferred to Phase 2
- ❌ Admin dashboard - deferred to Phase 2
- ❌ Trial periods - Free tier is sufficient for evaluation

**Phase 2 & Beyond**:

- ❌ Enterprise custom contracts (manual for MVP)
- ❌ Usage-based pricing (per-output billing) - fixed tiers only
- ❌ Team seat management (workbench members) - single user for MVP
- ❌ Multi-currency support (USD only for MVP)
- ❌ Annual billing discounts (monthly only for MVP)
- ❌ Referral programs or affiliate tracking
- ❌ BYOK quota tracking (Enterprise BYOK is unlimited)

---

## Technical Approach

### Architecture Decisions

**1. Subscription Model: Workbench-Level**

- **Decision**: Subscriptions belong to workbenches, not individual users
- **Rationale**: Aligns with existing multi-tenant architecture; enables future team collaboration
- **Trade-off**: More complex than user-level, but essential for Team/Enterprise tiers

**2. Usage Tracking: Dual Counter System**

- **Decision**: Track standard and premium outputs separately
- **Rationale**: Marketing PRD defines separate quotas (2000 standard + 500 premium)
- **Implementation**: Two columns in `subscriptions` table: `standard_outputs_used`, `premium_outputs_used`
- **Trade-off**: Slightly more complex than single counter, but provides flexibility

**3. Model Tier Classification**

- **Decision**: Categorize models as "standard", "premium", or "enterprise" in code
- **Rationale**: PRD defines model tiers (GPT-5-nano/mini = standard, GPT-5.1/Sonnet = premium)
- **Implementation**: Map in `lib/ai/model-tiers.ts` with lookups during generation
- **Trade-off**: Requires updating code when adding models (vs DB config)

**4. Quota Enforcement: Pre-Generation Check**

- **Decision**: Check quota BEFORE generating output, fail fast if exceeded
- **Rationale**: Prevents wasted API calls and user frustration
- **Implementation**: Middleware function in generation route
- **Trade-off**: Slight performance overhead (extra DB query), but worth it

**5. Soft Limits with Grace Period**

- **Decision**: Warn at 80% usage, allow generation until 100%, then block
- **Rationale**: Better UX than hard cutoff; gives users time to upgrade
- **Implementation**: Return warnings in API response headers
- **Trade-off**: Slightly more complex logic, but user-friendly

**6. Stripe Integration Strategy**

- **Decision**: Use Stripe Checkout for new subscriptions, Customer Portal for management
- **Rationale**: Fastest path to payment processing; Stripe handles PCI compliance
- **Implementation**: Webhook endpoint for subscription events (created, updated, canceled)
- **Trade-off**: Vendor lock-in to Stripe (acceptable for MVP)

### Technology Choices

**Payment Processing**:

- **Stripe** - Industry standard, excellent docs, Next.js integration
- **stripe** npm package for server-side API calls
- Stripe Checkout (hosted payment page) for simplicity
- Stripe Customer Portal for self-service management

**Database**:

- **Supabase PostgreSQL** - Existing infrastructure, native JSONB support
- Row Level Security (RLS) for subscription data protection
- Existing triggers for `updated_at` timestamps

**Background Jobs**:

- **Vercel Cron Jobs** - For daily usage reset, quota enforcement checks
- Alternative: Supabase Edge Functions (if Vercel cron insufficient)

**Email Notifications**:

- **Resend** - Modern email API, great developer UX
- Pre-built templates for quota warnings, billing updates

**UI Components**:

- Existing shadcn/ui components (Card, Badge, Progress, etc.)
- New: PricingCard, UsageMeter, SubscriptionStatus components

### Design Trade-offs

**Trade-off 1: Real-time vs Batch Usage Updates**

| Approach                               | Pros              | Cons                                     | Decision      |
| -------------------------------------- | ----------------- | ---------------------------------------- | ------------- |
| Real-time (update on every generation) | Accurate, instant | High DB write load, potential contention | ✅ **CHOSEN** |
| Batch (update every 10 mins)           | Lower DB load     | Lag allows quota overage                 | ❌ Rejected   |

**Rationale**: Accuracy is critical for billing; write load acceptable at current scale.

**Trade-off 2: Quota Reset Strategy**

| Approach                      | Pros                     | Cons                                  | Decision      |
| ----------------------------- | ------------------------ | ------------------------------------- | ------------- |
| Calendar month (1st of month) | Simple, predictable      | Unfair for mid-month signups          | ❌ Rejected   |
| Rolling 30-day window         | Fair, pro-rated          | Complex to calculate, confusing UX    | ❌ Rejected   |
| Billing cycle anniversary     | Fair, aligns with Stripe | Requires tracking billing anchor date | ✅ **CHOSEN** |

**Rationale**: Best UX and aligns with Stripe's billing cycle model.

**Trade-off 3: Free Tier Model Selection**

| Approach           | Pros                         | Cons                                   | Decision      |
| ------------------ | ---------------------------- | -------------------------------------- | ------------- |
| GPT-3.5-turbo only | Cheapest ($0.0005/output)    | Outdated model, bad UX                 | ❌ Rejected   |
| GPT-4o-mini        | Good quality, affordable     | Not highlighted in PRD                 | ❌ Rejected   |
| GPT-5-nano only    | Latest architecture, per PRD | Slightly higher cost ($0.00014/output) | ✅ **CHOSEN** |

**Rationale**: Marketing PRD explicitly positions GPT-5-nano for free tier; worth the cost for better UX.

**Trade-off 4: Overage Handling**

| Approach                       | Pros                              | Cons                            | Decision               |
| ------------------------------ | --------------------------------- | ------------------------------- | ---------------------- |
| Hard block at 100%             | Clear limit, no surprise costs    | Poor UX, frustrating            | ❌ Rejected            |
| Charge per additional output   | Revenue opportunity               | Complex billing, user confusion | ❌ Rejected (non-goal) |
| Soft block with upgrade prompt | Clear upgrade path, user-friendly | Requires modal/banner UX        | ✅ **CHOSEN**          |

**Rationale**: Best balance of user experience and cost control.

### Dependencies

**External**:

- Stripe account with test and production API keys
- Resend account for email notifications
- Vercel Cron Jobs enabled (or Supabase Edge Functions)

**Internal**:

- Existing authentication system (✅ complete)
- Workbench infrastructure (✅ complete)
- AI generation endpoints (✅ complete)
- Token usage tracking in `model_snapshot` (✅ complete)

**Sequential Dependencies**:

1. Database schema must exist before API routes
2. Stripe webhooks must be set up before subscription creation
3. Usage tracking must work before quota enforcement
4. Subscription management must work before UI components

---

## Sprint Plan

### **PHASE 1: FREE TIER LAUNCH (20-24 hours, ~1.5-2 weeks)**

These sprints implement the minimum viable system to launch with free tier quota enforcement and waitlist.

---

### Sprint 0: Database Schema & Foundation - Phase 1 (6 hours)

**Goal**: Create database tables for subscriptions and usage tracking. Support Free tier only initially, with data structure ready for paid tiers.

**Why First?** Foundation for all other work; must exist before building features.

**Phase 1 Scope**: Simplified schema without Stripe fields (add in Phase 2).

**Tasks**:

1. ✅ **Design database schema (Phase 1)** - 2h
   - Create `subscription_plans` table (Free plan only initially, Pro/Team/Enterprise as placeholders)
   - Create `subscriptions` table (workbench_id, plan, usage counters)
     - Omit Stripe fields for Phase 1 (add in Phase 2 migration)
   - Create `usage_events` table (audit log for consumption tracking)
   - Create `waitlist` table (email, plan_interest, created_at)
   - Add indexes for performance
   - Files: `supabase/migrations/20241216000000_add_subscription_system_phase1.sql`

2. ✅ **Define RLS policies** - 1.5h
   - Users can view subscriptions for their workbenches
   - Users can update usage (via API, not direct)
   - Only system can create/modify subscription_plans
   - Users can add themselves to waitlist
   - Files: Same migration file

3. ✅ **Create helper functions** - 1.5h
   - `get_workbench_subscription(workbench_uuid)` - Get active subscription
   - `check_quota_available(workbench_uuid, model_tier)` - Check if outputs remaining
   - `increment_usage(workbench_uuid, model_tier, count)` - Increment usage counter
   - `reset_monthly_usage(workbench_uuid)` - Reset counters on billing cycle (calendar month for Phase 1)
   - Files: Same migration file

4. ✅ **Create model tier classification** - 0.5h
   - Map model names to tiers (free, standard, premium, enterprise)
   - Free tier = GPT-5-nano only
   - Create utility functions for tier lookups
   - Files: `lib/ai/model-tiers.ts`, update `lib/ai/types.ts`

5. ✅ **Seed initial subscription plans** - 0.5h
   - Insert Free plan with quotas (100 outputs/month, GPT-5-nano only)
   - Insert placeholder Pro/Team/Enterprise plans (marked as "coming soon")
   - Files: `supabase/seed/subscription_plans.sql`

**Total**: 6 hours

**Deliverables**:

- ✅ Complete database schema with tables, indexes, RLS policies
- ✅ Helper functions for quota checking and usage tracking
- ✅ Model tier classification system
- ✅ Seeded subscription plans matching marketing PRD

**Success Metrics**:

- [ ] Migration runs successfully on local Supabase
- [ ] All RLS policies tested (users can view, cannot directly modify)
- [ ] Helper functions tested with sample data
- [ ] `npm run db:types` generates new TypeScript types

**Files Affected**:

- New: `supabase/migrations/20241216000000_add_subscription_system.sql`
- New: `supabase/seed/subscription_plans.sql`
- New: `lib/ai/model-tiers.ts`
- Modified: `lib/ai/types.ts`
- Modified: `types/database.ts` (add Subscription, SubscriptionPlan, UsageEvent types)

---

### Sprint 1: Quota Enforcement in Generation API - Phase 1 (6 hours)

**Goal**: Integrate quota checks into AI output generation endpoints to enforce free tier limits (100 outputs/month, GPT-5-nano only).

**Why Second?** Core cost control; blocks unlimited free usage immediately.

**Phase 1 Scope**: Focus on free tier enforcement only. Simplified error messages without upgrade CTAs (waitlist instead).

**Tasks**:

1. ✅ **Create quota middleware** - 2.5h
   - Function to check quota before generation
   - Return 429 Too Many Requests if quota exceeded
   - Include usage stats in response headers (X-Quota-Used, X-Quota-Limit, X-Quota-Reset-Date)
   - Handle free tier model restrictions (GPT-5-nano only)
   - Error message directs to waitlist signup for more quota
   - Files: `lib/api/quota-middleware.ts`

2. ✅ **Integrate into generation endpoint** - 1.5h
   - Add quota check in `/api/projects/[id]/generate/route.ts`
   - Validate model tier against subscription plan (free tier = GPT-5-nano only)
   - Increment usage counter on successful generation
   - Handle errors gracefully (rollback on failure)
   - Files: `app/api/projects/[id]/generate/route.ts`

3. ✅ **Integrate into retest endpoint** - 1h
   - Add quota check in `/api/projects/[id]/retest/route.ts`
   - Same validation and increment logic
   - Files: `app/api/projects/[id]/retest/route.ts`

4. ✅ **Write unit tests** - 1h
   - Test quota middleware with free tier scenarios
   - Mock Supabase RPC calls
   - Test free tier model restrictions (GPT-5-nano only, others blocked)
   - Test usage increment logic
   - Files: `tests/unit/api/quota-middleware.test.ts`

**Total**: 6 hours

**Deliverables**:

- ✅ Quota enforcement middleware
- ✅ Integration in generation and retest endpoints
- ✅ Comprehensive unit tests
- ✅ Error responses with upgrade prompts

**Success Metrics**:

- [ ] Free tier blocked from generating premium model outputs
- [ ] Usage counter increments correctly on each generation
- [ ] 429 response returned when quota exhausted
- [ ] All tests passing

**Files Affected**:

- New: `lib/api/quota-middleware.ts`
- New: `tests/unit/api/quota-middleware.test.ts`
- Modified: `app/api/projects/[id]/generate/route.ts`
- Modified: `app/api/projects/[id]/retest/route.ts`
- Modified: `lib/api/errors.ts` (add QuotaExceededError)

---

### Sprint 2: Usage Dashboard & Waitlist - Phase 1 (8 hours)

**Goal**: Build user-facing UI for viewing usage and joining waitlist for paid plans.

**Why Third?** Users need visibility into their quota and ability to express interest in paid tiers.

**Phase 1 Scope**: Simplified UI without upgrade buttons (waitlist CTAs instead). No Stripe integration.

**Tasks**:

1. ✅ **Create usage meter component** - 2h
   - Progress bar for outputs used this month
   - Show "X / 100 outputs used this month"
   - Color coding: green (<80), yellow (80-99), red (100)
   - Show next reset date (1st of next month for Phase 1)
   - Files: `components/subscription/usage-meter.tsx`

2. ✅ **Create subscription status component** - 1h
   - Display "Free Plan - 100 outputs/month"
   - Show available model: GPT-5-nano
   - Badge showing "Active" status
   - Files: `components/subscription/subscription-status.tsx`

3. ✅ **Create waitlist signup component** - 2h
   - Form: Email (pre-filled from auth), Plan interest (Pro/Team/Enterprise dropdown), Use case (textarea)
   - Submit to `/api/waitlist/join` endpoint
   - Success message: "Thanks! We'll notify you when [Plan] is available"
   - Files: `components/subscription/waitlist-signup.tsx`

4. ✅ **Create waitlist API endpoint** - 1h
   - POST `/api/waitlist/join`
   - Validate and insert into waitlist table
   - Return success response
   - Files: `app/api/waitlist/join/route.ts`

5. ✅ **Create subscription page** - 1.5h
   - Route: `/settings/subscription`
   - Display SubscriptionStatus and UsageMeter
   - Show waitlist signup form with pricing preview (Pro: $49/mo, Team: $99/mo, Enterprise: $499/mo)
   - Files: `app/(dashboard)/settings/subscription/page.tsx`

6. ✅ **Add quota warning banner** - 0.5h
   - Show banner at top of dashboard when usage >80%
   - "You've used X% of your outputs. Join the waitlist for higher limits."
   - Dismissible but persists until quota drops
   - Files: `components/subscription/quota-warning-banner.tsx`

**Total**: 8 hours

**Deliverables**:

- ✅ Usage dashboard showing consumption
- ✅ Waitlist signup for paid plans
- ✅ In-app warning banners for quota limits
- ✅ Integrated into settings section

**Success Metrics**:

- [ ] Users can view their usage (X/100 outputs)
- [ ] Users can join waitlist for Pro/Team/Enterprise
- [ ] Banner appears when usage >80%
- [ ] Quota exhaustion shows clear message with waitlist CTA

**Files Affected**:

- New: `components/subscription/usage-meter.tsx`
- New: `components/subscription/subscription-status.tsx`
- New: `components/subscription/waitlist-signup.tsx`
- New: `components/subscription/quota-warning-banner.tsx`
- New: `app/api/waitlist/join/route.ts`
- New: `app/(dashboard)/settings/subscription/page.tsx`
- Modified: `components/layout/sidebar.tsx` (add subscription nav link)

---

### Sprint 3: Migration & Phase 1 Polish (6 hours)

**Goal**: Migrate existing users to free tier, polish UX, and prepare for Phase 1 launch.

**Why Last in Phase 1?** Final preparation before free tier launch.

**Tasks**:

1. ✅ **Create migration script for existing users** - 1.5h
   - Identify all existing workbenches without subscriptions
   - Create free tier subscription records
   - Set initial usage to 0, reset date to 1st of next month
   - Log migration results
   - Files: `scripts/migrate-existing-users-phase1.ts`

2. ✅ **Update new user signup trigger** - 1h
   - Update `handle_new_user()` trigger to create free subscription
   - Set quota reset date to 1st of next month
   - Files: Update migration from Sprint 0

3. ✅ **Polish error messages and UX** - 2h
   - Better error messages for quota exceeded (include waitlist CTA)
   - Loading states for usage meter
   - Success toasts for waitlist signup
   - Empty state for 0% usage ("0/100 outputs used - Get started!")
   - Files: Various component files

4. ✅ **Write end-to-end test (Phase 1)** - 1h
   - Test user journey: Signup → Generate → Hit quota → See error with waitlist CTA
   - Test waitlist signup flow
   - Files: `tests/e2e/free-tier-quota.spec.ts`

5. ✅ **Update documentation** - 0.5h
   - Update CLAUDE.md with subscription patterns
   - Document quota enforcement in comments
   - Add waitlist API documentation
   - Files: `CLAUDE.md`, code comments

**Total**: 6 hours

**Deliverables**:

- ✅ All existing users migrated to free tier
- ✅ New user onboarding creates free subscription automatically
- ✅ Polished error messages and UX flows
- ✅ E2E tests for free tier quota enforcement
- ✅ Updated documentation

**Success Metrics**:

- [ ] Migration script runs successfully on all existing users
- [ ] New signups automatically get free tier subscription
- [ ] E2E test passes for quota enforcement
- [ ] No console errors in production build
- [ ] Quota exceeded error shows waitlist CTA

**Files Affected**:

- New: `scripts/migrate-existing-users-phase1.ts`
- New: `tests/e2e/free-tier-quota.spec.ts`
- Modified: `supabase/migrations/20241216000000_add_subscription_system_phase1.sql` (update trigger)
- Modified: `CLAUDE.md`
- Modified: Various component files (error messages, loading states)

---

### **END OF PHASE 1 (20 hours)**

**Phase 1 Deliverables Complete**:

- ✅ Free tier with 100 outputs/month enforced
- ✅ Usage dashboard visible to all users
- ✅ Waitlist for Pro/Team/Enterprise plans
- ✅ All existing users migrated
- ✅ Ready for public launch

**Next**: Phase 2 (Paid Tiers) can begin once waitlist validates demand.

---

### **PHASE 2: PAID TIERS (28-34 hours, ~2-2.5 weeks)**

**Phase 2 Goals**: Enable paid subscriptions via Stripe, convert waitlist to paying customers.

**Prerequisites**:

- Phase 1 complete and stable
- Waitlist has sufficient signups (validate demand)
- Stripe account approved and configured
- Payment processing legal/compliance requirements met

---

### Sprint 4: Stripe Integration (10 hours)

**Goal**: Integrate Stripe for payment processing, subscription creation, and webhook handling.

**Why Third?** Enables actual monetization; users can purchase subscriptions.

**Tasks**:

1. ✅ **Set up Stripe products and prices** - 1h
   - Create products in Stripe dashboard (Pro, Team, Enterprise)
   - Create monthly price objects ($49, $99, $499)
   - Note price IDs for configuration
   - Set up test mode initially

2. ✅ **Create Stripe checkout endpoint** - 3h
   - API endpoint: `/api/subscriptions/checkout`
   - Create Stripe Checkout Session with price ID
   - Attach workbench_id as metadata
   - Return checkout URL for redirect
   - Files: `app/api/subscriptions/checkout/route.ts`

3. ✅ **Create Stripe webhook handler** - 4h
   - API endpoint: `/api/webhooks/stripe`
   - Verify webhook signature
   - Handle events:
     - `checkout.session.completed` - Create subscription record
     - `customer.subscription.updated` - Update subscription plan/status
     - `customer.subscription.deleted` - Cancel subscription (downgrade to free)
     - `invoice.payment_succeeded` - Reset monthly usage quota
     - `invoice.payment_failed` - Suspend subscription
   - Files: `app/api/webhooks/stripe/route.ts`

4. ✅ **Create subscription status sync** - 1h
   - Utility function to fetch subscription from Stripe
   - Update local database with latest status
   - Handle edge cases (subscription not found, etc.)
   - Files: `lib/stripe/sync.ts`

5. ✅ **Write integration tests** - 1h
   - Mock Stripe API calls
   - Test checkout session creation
   - Test webhook event handling
   - Files: `tests/integration/stripe.test.ts`

**Total**: 10 hours

**Deliverables**:

- ✅ Stripe products and prices configured
- ✅ Checkout endpoint for subscription purchase
- ✅ Webhook handler for subscription lifecycle events
- ✅ Sync utility for updating local subscription state
- ✅ Integration tests

**Success Metrics**:

- [ ] Test checkout completes and creates subscription record
- [ ] Webhook creates/updates subscription correctly
- [ ] Failed payment suspends subscription
- [ ] Cancellation downgrades to free tier

**Files Affected**:

- New: `app/api/subscriptions/checkout/route.ts`
- New: `app/api/webhooks/stripe/route.ts`
- New: `lib/stripe/client.ts` (Stripe SDK initialization)
- New: `lib/stripe/sync.ts`
- New: `tests/integration/stripe.test.ts`
- Modified: `lib/env.ts` (add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)

---

### Sprint 3: Subscription Management UI (10 hours)

**Goal**: Build user-facing UI for viewing subscription status, usage, and upgrading/downgrading plans.

**Why Fourth?** Users need visibility and control over their subscriptions.

**Tasks**:

1. ✅ **Create subscription status component** - 2h
   - Display current plan (Free, Pro, Team, Enterprise)
   - Show renewal date or "Free Forever"
   - Badge for active/canceled/past_due status
   - Files: `components/subscription/subscription-status.tsx`

2. ✅ **Create usage meter component** - 3h
   - Progress bars for standard and premium outputs
   - Show "X / Y outputs used this month"
   - Color coding: green (<80%), yellow (80-99%), red (100%)
   - Breakdown by model (optional detail view)
   - Files: `components/subscription/usage-meter.tsx`

3. ✅ **Create pricing table component** - 2h
   - Display 4 tiers with features and pricing
   - Highlight current plan
   - CTA buttons: "Upgrade", "Current Plan", "Downgrade"
   - Files: `components/subscription/pricing-table.tsx`

4. ✅ **Create subscription page** - 2h
   - Route: `/settings/subscription`
   - Fetch subscription and usage data
   - Display SubscriptionStatus, UsageMeter, PricingTable
   - Handle upgrade/downgrade actions (redirect to Stripe)
   - Files: `app/(dashboard)/settings/subscription/page.tsx`

5. ✅ **Add navigation link** - 0.5h
   - Add "Subscription" to settings sidebar
   - Show badge if quota >80% (visual warning)
   - Files: `components/layout/sidebar.tsx` or similar

6. ✅ **Write component tests** - 0.5h
   - Test SubscriptionStatus rendering
   - Test UsageMeter color logic
   - Test PricingTable CTAs
   - Files: `tests/components/subscription/*.test.tsx`

**Total**: 10 hours

**Deliverables**:

- ✅ Subscription status and usage dashboard
- ✅ Pricing table with upgrade/downgrade CTAs
- ✅ Integrated into settings section
- ✅ Component tests

**Success Metrics**:

- [ ] Users can view their current plan and usage
- [ ] Usage meters update in real-time after generation
- [ ] Upgrade button redirects to Stripe Checkout
- [ ] Downgrade shows confirmation modal

**Files Affected**:

- New: `components/subscription/subscription-status.tsx`
- New: `components/subscription/usage-meter.tsx`
- New: `components/subscription/pricing-table.tsx`
- New: `app/(dashboard)/settings/subscription/page.tsx`
- New: `tests/components/subscription/*.test.tsx`
- Modified: `components/layout/sidebar.tsx` (add nav link)

---

### Sprint 4: Quota Warnings & Notifications (8 hours)

**Goal**: Implement user notifications for quota warnings (80%, 100%) and billing events.

**Why Fifth?** Proactive communication improves UX and drives upgrades.

**Tasks**:

1. ✅ **Set up Resend integration** - 1h
   - Create Resend account and get API key
   - Install `resend` npm package
   - Create email client utility
   - Files: `lib/email/client.ts`, update `lib/env.ts`

2. ✅ **Create email templates** - 2h
   - Quota warning (80%) email - "You're running low on outputs"
   - Quota exceeded (100%) email - "You've reached your limit"
   - Subscription created email - "Welcome to [Plan]"
   - Subscription canceled email - "Your subscription has been canceled"
   - Payment failed email - "Payment issue with your subscription"
   - Files: `lib/email/templates/*.tsx` (React Email components)

3. ✅ **Create notification trigger logic** - 3h
   - Database trigger: On usage update, check thresholds (80%, 100%)
   - If threshold crossed, insert into `notification_queue` table
   - Background job to process queue and send emails
   - Avoid duplicate notifications (track last sent)
   - Files:
     - `supabase/migrations/20241217000000_add_notification_system.sql`
     - `lib/email/send-notifications.ts`

4. ✅ **Create in-app banner component** - 1.5h
   - Show banner at top of dashboard when quota >80%
   - "You've used 90% of your outputs. Upgrade to continue."
   - Dismissible but persists until quota drops or user upgrades
   - Files: `components/subscription/quota-warning-banner.tsx`

5. ✅ **Write notification tests** - 0.5h
   - Test email template rendering
   - Test notification trigger logic
   - Mock Resend API calls
   - Files: `tests/unit/email/notifications.test.ts`

**Total**: 8 hours

**Deliverables**:

- ✅ Email notification system with templates
- ✅ Database triggers for quota thresholds
- ✅ In-app warning banners
- ✅ Notification tests

**Success Metrics**:

- [ ] Email sent when user reaches 80% quota
- [ ] Email sent when user reaches 100% quota
- [ ] Banner appears in dashboard for users >80%
- [ ] No duplicate emails sent

**Files Affected**:

- New: `lib/email/client.ts`
- New: `lib/email/templates/*.tsx`
- New: `lib/email/send-notifications.ts`
- New: `supabase/migrations/20241217000000_add_notification_system.sql`
- New: `components/subscription/quota-warning-banner.tsx`
- New: `tests/unit/email/notifications.test.ts`
- Modified: `lib/env.ts` (add RESEND_API_KEY)

---

### Sprint 5: Admin Dashboard & Analytics (6 hours)

**Goal**: Build internal admin interface for subscription management and usage analytics.

**Why Sixth?** Needed for customer support, debugging, and business insights.

**Tasks**:

1. ✅ **Create admin authentication** - 1h
   - Add `is_admin` boolean to `auth.users` metadata
   - RLS policy for admin-only access to subscription data
   - Middleware to check admin role
   - Files: `lib/auth/admin.ts`, update RLS policies

2. ✅ **Create subscription list view** - 2h
   - Route: `/admin/subscriptions`
   - Table showing all subscriptions with filters (plan, status)
   - Columns: Workbench, User, Plan, Status, Usage, MRR
   - Pagination and search
   - Files: `app/(admin)/admin/subscriptions/page.tsx`

3. ✅ **Create subscription detail view** - 1.5h
   - Route: `/admin/subscriptions/[workbenchId]`
   - Show full subscription details
   - Usage history chart (last 6 months)
   - Stripe customer link
   - Admin actions: Cancel, Refund, Reset quota (dangerous, confirm first)
   - Files: `app/(admin)/admin/subscriptions/[workbenchId]/page.tsx`

4. ✅ **Create analytics dashboard** - 1.5h
   - Route: `/admin/analytics`
   - Key metrics: Total MRR, Active subscriptions, Churn rate, Average usage
   - Charts: MRR growth, Plan distribution, Usage by tier
   - Export to CSV
   - Files: `app/(admin)/admin/analytics/page.tsx`

**Total**: 6 hours

**Deliverables**:

- ✅ Admin-only section with authentication
- ✅ Subscription management interface
- ✅ Usage analytics dashboard
- ✅ Admin action controls

**Success Metrics**:

- [ ] Only admin users can access `/admin/*` routes
- [ ] Subscription list loads and filters correctly
- [ ] Analytics charts render with real data
- [ ] Admin can cancel subscription and it reflects in Stripe

**Files Affected**:

- New: `lib/auth/admin.ts`
- New: `app/(admin)/admin/subscriptions/page.tsx`
- New: `app/(admin)/admin/subscriptions/[workbenchId]/page.tsx`
- New: `app/(admin)/admin/analytics/page.tsx`
- New: `components/admin/subscription-table.tsx`
- New: `components/admin/analytics-charts.tsx`
- Modified: RLS policies in subscription migration

---

### Sprint 6: Migration & Polish (8-10 hours)

**Goal**: Migrate existing users to free tier, polish UX, fix bugs, and prepare for launch.

**Why Last?** Final preparation before production deployment.

**Tasks**:

1. ✅ **Create migration script for existing users** - 2h
   - Identify all existing workbenches without subscriptions
   - Create free tier subscription records
   - Set initial usage to 0
   - Log migration results
   - Files: `scripts/migrate-existing-users.ts`

2. ✅ **Add onboarding for new signups** - 2h
   - Update `handle_new_user()` trigger to create free subscription
   - Show "Getting Started" modal on first login
   - Highlight usage meter and plan upgrade option
   - Files: Update migration, add `components/onboarding/welcome-modal.tsx`

3. ✅ **Polish error messages and UX** - 2h
   - Better error messages for quota exceeded (include CTA to upgrade)
   - Loading states for subscription actions
   - Confirmation modals for downgrades
   - Success toasts for subscription changes
   - Files: Various component files

4. ✅ **Add usage export feature** - 1h
   - API endpoint to export usage history as CSV
   - Route: `/api/subscriptions/usage/export`
   - Include date range filter
   - Files: `app/api/subscriptions/usage/export/route.ts`

5. ✅ **Write end-to-end tests** - 2h
   - Test full user journey: Signup → Generate → Hit quota → Upgrade → Generate more
   - Test downgrade flow
   - Test cancellation and reactivation
   - Files: `tests/e2e/subscription-flow.spec.ts`

6. ✅ **Update documentation** - 1h
   - Update CLAUDE.md with subscription patterns
   - Document quota enforcement in API docs
   - Add Stripe webhook setup instructions
   - Files: `CLAUDE.md`, `docs/api/subscriptions.md`

**Total**: 8-10 hours

**Deliverables**:

- ✅ All existing users migrated to free tier
- ✅ New user onboarding with subscription setup
- ✅ Polished error messages and UX flows
- ✅ Usage export feature
- ✅ End-to-end tests for subscription flows
- ✅ Updated documentation

**Success Metrics**:

- [ ] Migration script runs successfully on production data
- [ ] New signups automatically get free tier subscription
- [ ] E2E tests pass for complete subscription lifecycle
- [ ] No console errors or warnings in production build

**Files Affected**:

- New: `scripts/migrate-existing-users.ts`
- New: `components/onboarding/welcome-modal.tsx`
- New: `app/api/subscriptions/usage/export/route.ts`
- New: `tests/e2e/subscription-flow.spec.ts`
- Modified: `supabase/migrations/20241216000000_add_subscription_system.sql` (update trigger)
- Modified: `CLAUDE.md`
- Modified: Various component files (polish)

---

## Testing Strategy

### Test Coverage Goals

| Layer                   | Coverage Target | Priority    |
| ----------------------- | --------------- | ----------- |
| Quota Enforcement       | 100%            | 🔴 Required |
| Stripe Integration      | 90%             | 🔴 Required |
| Subscription API Routes | 90%             | 🔴 Required |
| UI Components           | 80%             | 🟡 High     |
| Email Templates         | 70%             | 🟢 Medium   |
| Admin Dashboard         | 60%             | 🟢 Medium   |

### Tests to Write

**Sprint 0: Database Schema**

- [ ] Migration runs without errors
- [ ] RLS policies prevent unauthorized access
- [ ] Helper functions return correct results

**Sprint 1: Quota Enforcement**

- [ ] Quota middleware blocks exceeded limits
- [ ] Free tier cannot access premium models
- [ ] Usage increments correctly
- [ ] Error responses have correct structure

**Sprint 2: Stripe Integration**

- [ ] Checkout session creates successfully
- [ ] Webhook signature verification works
- [ ] Subscription lifecycle events handled correctly
- [ ] Sync utility updates local state

**Sprint 3: Subscription UI**

- [ ] SubscriptionStatus renders all plan types
- [ ] UsageMeter shows correct percentages
- [ ] PricingTable highlights current plan
- [ ] Upgrade button redirects to checkout

**Sprint 4: Notifications**

- [ ] Email triggers at 80% threshold
- [ ] Email triggers at 100% threshold
- [ ] No duplicate emails sent
- [ ] Banner appears in dashboard

**Sprint 5: Admin Dashboard**

- [ ] Non-admins cannot access admin routes
- [ ] Subscription list filters work
- [ ] Analytics charts render
- [ ] Admin actions execute correctly

**Sprint 6: Migration & E2E**

- [ ] Migration script handles all edge cases
- [ ] New user trigger creates subscription
- [ ] E2E tests cover full user journey
- [ ] Downgrade/upgrade flows work

### Testing Workflow

**For each sprint**:

1. Write failing tests first (TDD approach)
2. Run tests - should FAIL
3. Implement feature
4. Run tests - should PASS
5. Refactor with confidence
6. Commit tests + feature together

**Integration Testing**:

- Use Supabase test database (separate from dev)
- Mock Stripe API calls (use `stripe-mock` or fixtures)
- Mock Resend email sends (capture but don't send)

**E2E Testing**:

- Use Playwright with test user accounts
- Test critical paths: signup, generation, quota hit, upgrade
- Run in CI/CD before deployment

---

## Database Schema Details

### New Tables

#### `subscription_plans`

Stores the 4 plan tiers with quotas and pricing.

```sql
create table subscription_plans (
  id text primary key, -- 'free', 'pro', 'team', 'enterprise'
  name text not null,
  display_name text not null,
  description text,
  price_monthly_cents int not null, -- 0, 4900, 9900, 49900
  stripe_price_id text, -- Stripe Price ID for paid plans

  -- Output quotas
  standard_outputs_limit int not null, -- 100, 2000, 5000, 20000
  premium_outputs_limit int not null,  -- 0, 500, 1500, 5000

  -- Feature flags
  allow_premium_models boolean default false,
  allow_team_collaboration boolean default false,
  allow_byok boolean default false, -- Bring Your Own Keys (Enterprise)

  -- Metadata
  features jsonb, -- Array of feature strings for marketing
  created_at timestamp with time zone default now()
);
```

#### `subscriptions`

Stores active subscriptions for each workbench.

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches(id) on delete cascade,
  plan_id text references subscription_plans(id) not null,

  -- Stripe metadata
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_payment_method_id text,

  -- Status
  status text not null default 'active', -- active, past_due, canceled, trialing
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean default false,

  -- Usage tracking (resets each billing cycle)
  standard_outputs_used int not null default 0,
  premium_outputs_used int not null default 0,
  last_usage_reset timestamp with time zone default now(),

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Constraints
  unique(workbench_id), -- One subscription per workbench
  check (status in ('active', 'past_due', 'canceled', 'trialing'))
);
```

#### `usage_events`

Audit log for all output generation (for analytics and debugging).

```sql
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,

  -- Event details
  model_tier text not null, -- 'standard', 'premium', 'enterprise'
  model_name text not null, -- 'gpt-4o', 'claude-3-5-sonnet', etc.
  output_count int not null default 1,

  -- Token usage
  input_tokens int,
  output_tokens int,
  total_tokens int,

  -- Cost tracking
  estimated_cost_cents int, -- Calculated from token usage

  -- Metadata
  project_id bigint references projects(id) on delete set null,
  created_at timestamp with time zone default now(),

  check (model_tier in ('standard', 'premium', 'enterprise'))
);
```

#### `notification_queue`

Queue for sending email notifications (processed by background job).

```sql
create table notification_queue (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,

  -- Notification details
  type text not null, -- 'quota_warning_80', 'quota_exceeded', 'subscription_created', etc.
  data jsonb, -- Template variables

  -- Status
  status text not null default 'pending', -- pending, sent, failed
  sent_at timestamp with time zone,
  error_message text,

  -- Timestamps
  created_at timestamp with time zone default now(),

  check (type in ('quota_warning_80', 'quota_exceeded', 'subscription_created', 'subscription_canceled', 'payment_failed'))
);
```

### Indexes

```sql
-- Subscriptions
create index subscriptions_workbench_id_idx on subscriptions(workbench_id);
create index subscriptions_stripe_customer_id_idx on subscriptions(stripe_customer_id);
create index subscriptions_status_idx on subscriptions(status);

-- Usage events
create index usage_events_workbench_id_idx on usage_events(workbench_id);
create index usage_events_created_at_idx on usage_events(created_at desc);
create index usage_events_subscription_id_idx on usage_events(subscription_id);

-- Notification queue
create index notification_queue_status_idx on notification_queue(status);
create index notification_queue_created_at_idx on notification_queue(created_at);
```

### Helper Functions

**`get_workbench_subscription(workbench_uuid)`**
Returns the active subscription for a workbench.

```sql
create or replace function get_workbench_subscription(workbench_uuid uuid)
returns table (
  id uuid,
  plan_id text,
  status text,
  standard_outputs_used int,
  standard_outputs_limit int,
  premium_outputs_used int,
  premium_outputs_limit int,
  current_period_end timestamp with time zone
) as $$
begin
  return query
  select
    s.id,
    s.plan_id,
    s.status,
    s.standard_outputs_used,
    p.standard_outputs_limit,
    s.premium_outputs_used,
    p.premium_outputs_limit,
    s.current_period_end
  from subscriptions s
  join subscription_plans p on s.plan_id = p.id
  where s.workbench_id = workbench_uuid
  and s.status in ('active', 'trialing');
end;
$$ language plpgsql security definer;
```

**`check_quota_available(workbench_uuid, model_tier)`**
Returns true if workbench has quota remaining for the model tier.

```sql
create or replace function check_quota_available(
  workbench_uuid uuid,
  model_tier text,
  count int default 1
)
returns boolean as $$
declare
  sub record;
begin
  select * from get_workbench_subscription(workbench_uuid)
  into sub;

  if sub is null then
    return false; -- No active subscription
  end if;

  if model_tier = 'standard' then
    return (sub.standard_outputs_used + count) <= sub.standard_outputs_limit;
  elsif model_tier = 'premium' then
    return (sub.premium_outputs_used + count) <= sub.premium_outputs_limit;
  else
    return true; -- Enterprise tier has no limits
  end if;
end;
$$ language plpgsql security definer;
```

**`increment_usage(workbench_uuid, model_tier, count)`**
Increments usage counter and logs to usage_events.

```sql
create or replace function increment_usage(
  workbench_uuid uuid,
  model_tier text,
  model_name text,
  count int default 1,
  input_tokens int default null,
  output_tokens int default null,
  project_id bigint default null
)
returns void as $$
declare
  sub_id uuid;
  estimated_cost int;
begin
  -- Get subscription ID
  select id into sub_id
  from subscriptions
  where workbench_id = workbench_uuid
  and status in ('active', 'trialing');

  if sub_id is null then
    raise exception 'No active subscription found for workbench %', workbench_uuid;
  end if;

  -- Update usage counter
  if model_tier = 'standard' then
    update subscriptions
    set standard_outputs_used = standard_outputs_used + count,
        updated_at = now()
    where id = sub_id;
  elsif model_tier = 'premium' then
    update subscriptions
    set premium_outputs_used = premium_outputs_used + count,
        updated_at = now()
    where id = sub_id;
  end if;

  -- Calculate estimated cost (simplified, can be enhanced)
  if input_tokens is not null and output_tokens is not null then
    -- Rough calculation: $0.001 per output average
    estimated_cost := 100; -- 100 cents = $1 (placeholder)
  end if;

  -- Log usage event
  insert into usage_events (
    workbench_id,
    subscription_id,
    model_tier,
    model_name,
    output_count,
    input_tokens,
    output_tokens,
    total_tokens,
    estimated_cost_cents,
    project_id
  ) values (
    workbench_uuid,
    sub_id,
    model_tier,
    model_name,
    count,
    input_tokens,
    output_tokens,
    coalesce(input_tokens, 0) + coalesce(output_tokens, 0),
    estimated_cost,
    project_id
  );
end;
$$ language plpgsql security definer;
```

---

## Model Tier Classification

Create `lib/ai/model-tiers.ts`:

```typescript
/**
 * Model tier classification for quota enforcement
 * Based on marketing PRD pricing tiers
 */

export type ModelTier = "standard" | "premium" | "enterprise";

/**
 * Model tier mappings
 * Standard: GPT-5-nano, GPT-5-mini
 * Premium: GPT-5.1, Claude Sonnet 4.5
 * Enterprise: GPT-5.2, Claude Opus 4.5, o3, etc.
 */
export const MODEL_TIER_MAP: Record<string, ModelTier> = {
  // Standard tier (included in all plans)
  "gpt-5-nano": "standard",
  "gpt-5-mini": "standard",
  "gpt-4o-mini": "standard", // Legacy fallback
  "gpt-3.5-turbo": "standard", // Legacy fallback

  // Premium tier (Pro and Team plans)
  "gpt-5.1": "premium",
  "claude-3-5-sonnet": "premium",
  "claude-3-5-sonnet-20241022": "premium",
  "claude-3-5-sonnet-20240620": "premium",

  // Enterprise tier (Enterprise plan only, BYOK)
  "gpt-5.2": "enterprise",
  "claude-opus-4-5": "enterprise",
  "claude-3-opus": "enterprise",
  o3: "enterprise",
  o1: "enterprise",
};

/**
 * Get model tier for a given model name
 */
export function getModelTier(modelName: string): ModelTier {
  const tier = MODEL_TIER_MAP[modelName];
  if (!tier) {
    console.warn(`Unknown model: ${modelName}, defaulting to premium tier`);
    return "premium"; // Default to premium for safety
  }
  return tier;
}

/**
 * Check if a model is allowed for a given plan
 */
export function isModelAllowedForPlan(
  modelName: string,
  planId: "free" | "pro" | "team" | "enterprise",
): boolean {
  const tier = getModelTier(modelName);

  if (tier === "standard") {
    return true; // Standard models allowed on all plans
  }

  if (tier === "premium") {
    return planId !== "free"; // Premium models on Pro, Team, Enterprise
  }

  if (tier === "enterprise") {
    return planId === "enterprise"; // Enterprise models only on Enterprise
  }

  return false;
}

/**
 * Get display name for model tier
 */
export function getModelTierDisplayName(tier: ModelTier): string {
  switch (tier) {
    case "standard":
      return "Standard";
    case "premium":
      return "Premium";
    case "enterprise":
      return "Enterprise";
  }
}
```

---

## API Route Patterns

### Quota Middleware (`lib/api/quota-middleware.ts`)

```typescript
import { createServerClient } from "@/lib/supabase";
import { getModelTier } from "@/lib/ai/model-tiers";
import { QuotaExceededError } from "@/lib/api/errors";

export interface QuotaCheckResult {
  allowed: boolean;
  usedStandard: number;
  limitStandard: number;
  usedPremium: number;
  limitPremium: number;
  planId: string;
}

/**
 * Check if workbench has quota available for generating outputs
 * Throws QuotaExceededError if quota exceeded
 */
export async function checkQuota(
  workbenchId: string,
  modelName: string,
  outputCount: number = 1,
): Promise<QuotaCheckResult> {
  const supabase = await createServerClient();

  // Get subscription with limits
  const { data: subscription, error } = await supabase.rpc(
    "get_workbench_subscription",
    { workbench_uuid: workbenchId },
  );

  if (error || !subscription || subscription.length === 0) {
    throw new Error("No active subscription found");
  }

  const sub = subscription[0];
  const modelTier = getModelTier(modelName);

  // Check if model is allowed for plan
  const { isModelAllowedForPlan } = await import("@/lib/ai/model-tiers");
  if (!isModelAllowedForPlan(modelName, sub.plan_id)) {
    throw new QuotaExceededError(
      `Model ${modelName} not available on ${sub.plan_id} plan`,
      {
        usedStandard: sub.standard_outputs_used,
        limitStandard: sub.standard_outputs_limit,
        usedPremium: sub.premium_outputs_used,
        limitPremium: sub.premium_outputs_limit,
        planId: sub.plan_id,
      },
    );
  }

  // Check quota
  let hasQuota = false;
  if (modelTier === "standard") {
    hasQuota =
      sub.standard_outputs_used + outputCount <= sub.standard_outputs_limit;
  } else if (modelTier === "premium") {
    hasQuota =
      sub.premium_outputs_used + outputCount <= sub.premium_outputs_limit;
  } else {
    // Enterprise tier has no limits (BYOK)
    hasQuota = true;
  }

  if (!hasQuota) {
    throw new QuotaExceededError(`Quota exceeded for ${modelTier} outputs`, {
      usedStandard: sub.standard_outputs_used,
      limitStandard: sub.standard_outputs_limit,
      usedPremium: sub.premium_outputs_used,
      limitPremium: sub.premium_outputs_limit,
      planId: sub.plan_id,
    });
  }

  return {
    allowed: true,
    usedStandard: sub.standard_outputs_used,
    limitStandard: sub.standard_outputs_limit,
    usedPremium: sub.premium_outputs_used,
    limitPremium: sub.premium_outputs_limit,
    planId: sub.plan_id,
  };
}

/**
 * Increment usage after successful generation
 */
export async function incrementUsage(
  workbenchId: string,
  modelName: string,
  outputCount: number = 1,
  inputTokens?: number,
  outputTokens?: number,
  projectId?: number,
): Promise<void> {
  const supabase = await createServerClient();
  const modelTier = getModelTier(modelName);

  const { error } = await supabase.rpc("increment_usage", {
    workbench_uuid: workbenchId,
    model_tier: modelTier,
    model_name: modelName,
    count: outputCount,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    project_id: projectId,
  });

  if (error) {
    console.error("Failed to increment usage:", error);
    throw error;
  }
}
```

### Checkout Endpoint (`app/api/subscriptions/checkout/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import Stripe from "stripe";
import { env } from "@/lib/env";

const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, workbenchId } = await request.json();

    // Validate plan
    if (!["pro", "team", "enterprise"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get Stripe price ID from database
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("stripe_price_id")
      .eq("id", planId)
      .single();

    if (!plan?.stripe_price_id) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        workbench_id: workbenchId,
        user_id: user.id,
        plan_id: planId,
      },
      success_url: `${env.app.url}/settings/subscription?success=true`,
      cancel_url: `${env.app.url}/settings/subscription?canceled=true`,
      customer_email: user.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
```

---

## Files Modified Summary

### New Files (38 files)

**Database Migrations**:

- `supabase/migrations/20241216000000_add_subscription_system.sql`
- `supabase/migrations/20241217000000_add_notification_system.sql`
- `supabase/seed/subscription_plans.sql`

**Library Files**:

- `lib/ai/model-tiers.ts`
- `lib/api/quota-middleware.ts`
- `lib/stripe/client.ts`
- `lib/stripe/sync.ts`
- `lib/email/client.ts`
- `lib/email/send-notifications.ts`
- `lib/email/templates/quota-warning-80.tsx`
- `lib/email/templates/quota-exceeded.tsx`
- `lib/email/templates/subscription-created.tsx`
- `lib/email/templates/subscription-canceled.tsx`
- `lib/email/templates/payment-failed.tsx`
- `lib/auth/admin.ts`

**API Routes**:

- `app/api/subscriptions/checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/subscriptions/usage/export/route.ts`

**UI Components**:

- `components/subscription/subscription-status.tsx`
- `components/subscription/usage-meter.tsx`
- `components/subscription/pricing-table.tsx`
- `components/subscription/quota-warning-banner.tsx`
- `components/onboarding/welcome-modal.tsx`
- `components/admin/subscription-table.tsx`
- `components/admin/analytics-charts.tsx`

**Pages**:

- `app/(dashboard)/settings/subscription/page.tsx`
- `app/(admin)/admin/subscriptions/page.tsx`
- `app/(admin)/admin/subscriptions/[workbenchId]/page.tsx`
- `app/(admin)/admin/analytics/page.tsx`

**Tests**:

- `tests/unit/api/quota-middleware.test.ts`
- `tests/unit/email/notifications.test.ts`
- `tests/integration/stripe.test.ts`
- `tests/components/subscription/*.test.tsx` (multiple files)
- `tests/e2e/subscription-flow.spec.ts`

**Scripts**:

- `scripts/migrate-existing-users.ts`

**Documentation**:

- `docs/api/subscriptions.md`

### Modified Files (8 files)

- `types/database.ts` - Add Subscription, SubscriptionPlan, UsageEvent types
- `lib/ai/types.ts` - Add ModelTier type
- `lib/api/errors.ts` - Add QuotaExceededError class
- `lib/env.ts` - Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY
- `app/api/projects/[id]/generate/route.ts` - Integrate quota middleware
- `app/api/projects/[id]/retest/route.ts` - Integrate quota middleware
- `components/layout/sidebar.tsx` - Add subscription nav link
- `CLAUDE.md` - Document subscription patterns and quota enforcement

**Total**: 38 new + 8 modified = **46 files**

---

## Risks & Mitigation

| Risk                                | Impact                                        | Probability | Mitigation                                                                |
| ----------------------------------- | --------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| **Stripe webhook failures**         | High - subscriptions not created/updated      | Medium      | Implement retry logic, monitor webhook logs, manual reconciliation script |
| **Quota race conditions**           | Medium - users exceed limits slightly         | Low         | Use database transactions, atomic updates, acceptable variance            |
| **Migration breaks existing users** | High - users locked out                       | Low         | Thorough testing on staging, rollback plan, migrate in batches            |
| **Email delivery failures**         | Low - users miss notifications                | Medium      | Queue system with retries, fallback to in-app notifications               |
| **Stripe API rate limits**          | Medium - checkout failures                    | Low         | Implement exponential backoff, cache customer/subscription data           |
| **Complex pricing changes**         | Medium - confusion during upgrades            | Medium      | Clear UI messaging, confirmation modals, prorated charges shown upfront   |
| **BYOK quota tracking**             | Low - can't track enterprise usage accurately | High        | Acceptable - Enterprise BYOK is unlimited by design                       |
| **Token usage accuracy**            | Medium - incorrect cost estimates             | Medium      | Use actual token counts from API responses, audit regularly               |

---

## Success Metrics

### Definition of Done

**Overall Project**:

- [ ] All 6 sprints completed
- [ ] Test coverage meets targets (>90% for critical paths)
- [ ] All E2E tests passing
- [ ] No console errors in production build
- [ ] Documentation updated in CLAUDE.md and API docs

**Core Functionality**:

- [ ] Free tier users limited to 100 standard outputs/month
- [ ] Pro tier users can generate 2000 standard + 500 premium outputs
- [ ] Quota enforcement blocks generation when limit reached
- [ ] Stripe checkout creates subscription and grants access
- [ ] Usage meter shows real-time consumption
- [ ] Emails sent at 80% and 100% quota thresholds

**User Experience**:

- [ ] Users can upgrade/downgrade plans seamlessly
- [ ] Clear error messages when quota exceeded with CTA to upgrade
- [ ] Subscription status visible in dashboard
- [ ] Usage export works correctly

**Admin/Support**:

- [ ] Admin dashboard shows all subscriptions and usage
- [ ] Admin can cancel/modify subscriptions
- [ ] Analytics charts render with real data
- [ ] Stripe webhook logs accessible for debugging

### Verification Steps

**Manual Testing**:

1. Create new account → Should get free tier subscription
2. Generate 100 outputs → Should hit quota
3. Try to generate 101st → Should get 429 error with upgrade prompt
4. Upgrade to Pro → Should redirect to Stripe, complete payment
5. After upgrade → Generate premium model outputs (should work)
6. Check usage meter → Should show accurate counts
7. Downgrade to Free → Should confirm and downgrade at period end

**Automated Testing**:

```bash
# Run all tests
npm test

# Run only subscription tests
npm test -- tests/unit/api/quota-middleware.test.ts
npm test -- tests/integration/stripe.test.ts
npm test -- tests/e2e/subscription-flow.spec.ts

# Check test coverage
npm test -- --coverage
```

**Database Verification**:

```sql
-- Check all subscriptions
SELECT w.name, s.plan_id, s.status, s.standard_outputs_used, p.standard_outputs_limit
FROM subscriptions s
JOIN workbenches w ON s.workbench_id = w.id
JOIN subscription_plans p ON s.plan_id = p.id;

-- Check usage events
SELECT model_tier, COUNT(*), SUM(output_count)
FROM usage_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY model_tier;

-- Check notification queue
SELECT type, status, COUNT(*)
FROM notification_queue
GROUP BY type, status;
```

**Stripe Dashboard Verification**:

- [ ] Test mode subscriptions created correctly
- [ ] Webhooks receiving events (200 status codes)
- [ ] Customer metadata includes workbench_id
- [ ] Subscription metadata includes plan_id

---

## Timeline & Next Steps

### Timeline

**Phase 1: Free Tier Launch (IMMEDIATE PRIORITY)**

| Sprint                                | Estimated Time | Cumulative       | Target Completion |
| ------------------------------------- | -------------- | ---------------- | ----------------- |
| Sprint 0: Database Schema (Phase 1)   | 6h             | 6h               | Week 1 - Day 1    |
| Sprint 1: Quota Enforcement (Phase 1) | 6h             | 12h              | Week 1 - Day 2    |
| Sprint 2: Usage Dashboard & Waitlist  | 8h             | 20h              | Week 1 - Day 3-4  |
| Sprint 3: Migration & Polish          | 6h             | 26h (buffer: 4h) | Week 2 - Day 1    |
| **Phase 1 Total**                     | **20-24h**     |                  | **~1.5-2 weeks**  |

**Phase 2: Paid Tiers (DEFERRED - after waitlist validation)**

| Sprint                                 | Estimated Time | Cumulative       | Target Completion |
| -------------------------------------- | -------------- | ---------------- | ----------------- |
| Sprint 4: Stripe Integration           | 10h            | 10h              | TBD (Week N)      |
| Sprint 5: Subscription Management UI   | 10h            | 20h              | TBD (Week N+1)    |
| Sprint 6: Notifications                | 8h             | 28h              | TBD (Week N+1)    |
| Sprint 7: Admin Dashboard              | 6h             | 34h              | TBD (Week N+2)    |
| Sprint 8: Migration & Polish (Phase 2) | 8h             | 42h (buffer: 6h) | TBD (Week N+2)    |
| **Phase 2 Total**                      | **28-34h**     |                  | **~2-2.5 weeks**  |

**Combined Total**: 48-58 hours across 8 sprints (~3-4 weeks)

**Assumptions**:

- 2-4 hours of focused work per day for Phase 1
- Phase 1 can be completed in 1.5-2 weeks with focused effort
- Phase 2 timing depends on waitlist validation
- Buffer time for debugging and iteration (20% added to estimates)

### Next Steps

**Phase 1: Immediate Actions (This Week)**

**Before Starting Sprint 0**:

1. ✅ Review and approve this plan
2. ✅ Back up production database
3. ✅ Create feature branch: `feature/free-tier-quota-phase1`
4. ✅ Set up staging environment for testing

**During Phase 1 Implementation**:

1. Document decisions in sprint summary: `docs/sprint-free-tier-phase1-summary.md`
2. Update CLAUDE.md with subscription patterns
3. Create PR after Sprint 2 for review (database + quota enforcement ready)
4. Deploy Sprint 0-1 to staging immediately for testing
5. Deploy Sprint 2-3 to staging, then production

**After Phase 1 Completion**:

1. Deploy to production: Free tier enforcement active
2. Monitor quota enforcement logs and usage patterns
3. Track waitlist signups (validate demand for paid tiers)
4. Collect user feedback on quota limits
5. Decide when to begin Phase 2 (target: 50+ waitlist signups)

**Phase 2: Future Actions (After Waitlist Validation)**

**Before Starting Sprint 4**:

1. Confirm waitlist has sufficient demand (50+ signups recommended)
2. Set up Stripe account (test and production mode)
3. Set up Resend account for email notifications
4. Review legal/compliance requirements for payment processing
5. Create feature branch: `feature/paid-tiers-phase2`

**During Phase 2 Implementation**:

1. Add Stripe fields to database (migration)
2. Test Stripe webhooks thoroughly in test mode
3. Invite waitlist users to beta test paid tiers
4. Monitor payment processing and subscription lifecycle
5. Document Phase 2 in sprint summary

**After Phase 2 Completion**:

1. Email waitlist: "Paid plans now available!"
2. Monitor Stripe webhooks and payment success rates
3. Set up admin dashboard monitoring
4. Iterate based on user feedback

**Future Enhancements (Post-Phase 2)**:

- Annual billing with discounts
- Team seat management (multiple users per workbench)
- Usage-based pricing (per-output add-ons)
- Enterprise SSO integration
- Advanced analytics (cohort analysis, churn prediction)
- Referral program and credits system

---

## Appendix: Subscription Plan Details (from Marketing PRD)

### Free Tier

- **Price**: $0/month forever
- **Outputs**: 100 standard/month (GPT-5-nano only)
- **Projects**: 1 project
- **Support**: Community (Discord/docs)
- **Our Cost**: ~$0.01/month if fully used
- **Margin**: Negligible, pure acquisition

### Pro Tier (Most Popular)

- **Price**: $49/month
- **Outputs**: 2,000 standard + 500 premium/month
- **Models**: GPT-5-mini (standard), GPT-5.1 or Claude Sonnet 4.5 (premium)
- **Projects**: Unlimited
- **Features**: Multi-provider, rating carry-forward, keyboard shortcuts, export
- **Support**: Priority email
- **Our Cost**: ~$4.46/month
- **Margin**: 90.9%

### Team Tier

- **Price**: $99/month
- **Outputs**: 5,000 standard + 1,500 premium/month
- **Models**: Same as Pro
- **Projects**: Unlimited
- **Features**: Everything in Pro + team collaboration, version history, failure clustering, selective retest
- **Support**: Priority + Slack channel
- **Our Cost**: ~$12.63/month
- **Margin**: 87.2%

### Enterprise Tier

- **Price**: Starting at $499/month (custom)
- **Outputs**: 20k+ standard, 5k+ premium (negotiable)
- **Models**: All models including GPT-5.2, Claude Opus 4.5, o3
- **BYOK**: Bring Your Own Keys for unlimited usage
- **Features**: Everything in Team + SSO, dedicated support, custom integrations, SLA
- **Support**: Dedicated account manager
- **Our Cost**: Minimal (most use BYOK)
- **Margin**: ~95%+

---

## Questions for Review

Before starting implementation, please confirm:

1. **Pricing Alignment**: Do these 4 tiers match the final marketing site pricing? Any changes needed?

Answer: Yes

2. **Model Availability**: Are the model tier classifications correct? (Standard = GPT-5-nano/mini, Premium = GPT-5.1/Sonnet, Enterprise = GPT-5.2/Opus/o3)

Answer:
Free: GPT-5-nano
Standard: GPT-5-mini
Premium: GPT-5.1/Sonnet 4.5
Enterprise: GPT-5.2/Opus 4.5/o3

3. **Free Tier Strategy**: Confirm 100 outputs/month for free tier is acceptable (cost ~$0.01/month per user if fully utilized)

Answer: Yes

4. **Quota Reset**: Billing cycle anniversary (aligns with Stripe) is preferred over calendar month, correct?

Answer: Yes

5. **Enterprise BYOK**: Confirm Enterprise customers can bring their own API keys for unlimited usage (no quota tracking needed)

Answer: Yes

6. **Team Features**: Team collaboration features (shared workbenches, multiple users) are deferred to post-MVP, correct?

Answer: Yes

7. **Trial Period**: Should Pro/Team tiers offer a 14-day free trial? (Marketing PRD mentions "14-day free trial")

Answer: No. The Free tier is sufficent for a user to try the product out.

8. **Downgrade Handling**: When users downgrade, should access be immediate or at end of billing period? (Recommend end of period)

Answer: End of period

9. **Admin Access**: Who should have admin privileges? (Founders only, or broader team?)

Answer: TBD.

10. **Launch Timeline**: Target launch date for paid subscriptions? (Affects urgency and sprint pacing)

Answer: Want to launch with free tier only. We'll set up a wait list for Pro.

---

## Summary: Plan Updates Based on Answers

### ✅ **Launch Strategy: Free Tier First**

Based on your answers, the plan has been restructured into **2 phases**:

**Phase 1 (IMMEDIATE)**: Free Tier Launch

- 20-24 hours across 3 sprints (~1.5-2 weeks)
- Enforce 100 outputs/month limit (GPT-5-nano only)
- Build waitlist for paid tiers
- Migrate existing users
- **GOAL**: Control costs immediately, validate demand for paid plans

**Phase 2 (DEFERRED)**: Paid Tiers

- 28-34 hours across 4-5 sprints (~2-2.5 weeks)
- Add Stripe integration
- Enable Pro/Team/Enterprise subscriptions
- Email notifications and admin dashboard
- **TRIGGER**: Begin when waitlist has 50+ signups

### 🎯 **Key Changes from Original Plan**

1. **No trial period** - Free tier is sufficient for evaluation
2. **No immediate Stripe work** - Deferred to Phase 2
3. **Waitlist instead of upgrade buttons** - Build demand first
4. **Simplified database schema for Phase 1** - Add Stripe fields in Phase 2
5. **Calendar month quota reset for Phase 1** - Billing cycle in Phase 2
6. **Downgrade at end of period** - Confirmed (Phase 2)
7. **Model tiers updated**:
   - Free: GPT-5-nano only
   - Standard: GPT-5-mini
   - Premium: GPT-5.1, Claude Sonnet 4.5
   - Enterprise: GPT-5.2, Claude Opus 4.5, o3

### 📊 **Success Metrics for Phase 1**

**Cost Control** (Primary Goal):

- [ ] Free tier users limited to 100 outputs/month
- [ ] No unlimited usage bleeding money
- [ ] Quota enforcement blocks generation at 100%
- [ ] All existing users migrated to free tier

**Demand Validation** (Secondary Goal):

- [ ] Waitlist signup form live and functional
- [ ] Track signups by plan interest (Pro/Team/Enterprise)
- [ ] Target: 50+ waitlist signups before Phase 2

**User Experience**:

- [ ] Usage meter shows clear consumption (X/100)
- [ ] Quota warnings at 80% usage
- [ ] Clear messaging when quota exhausted
- [ ] No console errors or broken features

### 🚀 **Ready to Begin Phase 1**

All questions answered. Sprint 0 can begin immediately:

1. Create feature branch: `feature/free-tier-quota-phase1`
2. Start Sprint 0: Database schema (6 hours)
3. Target: Phase 1 complete in 1.5-2 weeks

**Next Review Point**: After Phase 1 launch, evaluate waitlist signups to determine Phase 2 timing.

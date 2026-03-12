# Marketing Site - Signup Integration Spec

**Date**: December 16, 2024
**For**: sageloop-marketing project
**Context**: Phase 1 Free Tier Launch

## Overview

This spec defines how the marketing site should handle pricing display and signup flow to integrate with the product's Phase 1 free tier launch.

## Phase 1 Strategy (Current)

**Product Reality**:

- Only free tier is available (100 GPT-5-nano outputs/month)
- Paid plans (Pro/Team/Enterprise) are coming soon
- Waitlist for paid plans (external form - Tally/Typeform)

**Marketing Site Goal**:

- Show pricing to set expectations
- Drive signups to free tier
- Capture waitlist interest for paid plans

---

## Pricing Page Requirements

### Page Structure

**Route**: `/pricing`

**Layout**: 4-column pricing table (as defined in marketing-site-prd.md)

### Pricing Tiers to Display

| Plan           | Price      | What to Show                         |
| -------------- | ---------- | ------------------------------------ |
| **Free**       | $0/month   | ✅ Full details, "Start Free" CTA    |
| **Pro**        | $20/month  | ✅ Full details, "Join Waitlist" CTA |
| **Team**       | $49/month  | ✅ Full details, "Join Waitlist" CTA |
| **Enterprise** | $199/month | ✅ Full details, "Contact Sales" CTA |

### Free Tier Details (Primary CTA)

```
Free Plan
$0/month forever

✓ 1 project
✓ 100 outputs/month
✓ GPT-5-nano model
✓ Scenario management
✓ Rating & feedback
✓ Usage dashboard
✓ Export test suites
✓ Community support

[Start Free] ← Primary button (indigo, prominent)
```

**Button Behavior**:

- Links to: `https://app.sageloop.com/auth/signup` (product auth page)
- Opens in same tab (redirect to product)
- No plan parameter needed (everyone starts free)

### Pro/Team Tiers Details (Waitlist CTA)

```
Pro Plan (Most Popular)
$20/month

✓ Unlimited projects
✓ 1,000 standard outputs/month (GPT-5-mini)
✓ 200 premium outputs/month (GPT-5.1 or Claude Sonnet 4.5)
✓ Multi-provider support
✓ Smart rating carry-forward
✓ Keyboard shortcuts
✓ Priority email support

[Join Waitlist] ← Secondary button (outlined)

---

Team Plan
$49/month

✓ Everything in Pro
✓ 3,000 standard + 750 premium outputs/month
✓ Team collaboration (coming soon)
✓ Prompt version history
✓ Failure clustering
✓ Selective retest
✓ Priority support + Slack channel

[Join Waitlist] ← Secondary button (outlined)
```

**Button Behavior**:

- Links to: External waitlist form (Tally/Typeform)
- Opens in new tab
- Pre-fills email if available via URL parameter
- Form captures: Email, Plan interest (Pro/Team), Use case

### Enterprise Tier Details (Contact Sales)

```
Enterprise
Starting at $199/month

✓ Everything in Team
✓ 10,000+ standard + 2,500+ premium outputs/month
✓ Access to all models (GPT-5.2, Claude Opus 4.5, o3)
✓ Bring Your Own Keys (unlimited with your API keys)
✓ SSO / SAML authentication
✓ Dedicated account manager
✓ Custom integrations
✓ SLA guarantees (99.9% uptime)

[Contact Sales] ← Secondary button
```

**Button Behavior**:

- Links to: `/contact` or `mailto:sales@sageloop.com`
- Opens in same tab

---

## Messaging Guidelines

### Key Messaging to Communicate

1. **Free Tier is Real**: Not a trial - it's forever
   - "Free forever • No credit card • 5-minute setup"

2. **Paid Plans Coming Soon**: Set expectations
   - Badge on Pro/Team: "Coming Soon"
   - Text: "Join the waitlist to be notified when Pro launches"

3. **Product-Led Growth**: Try before deciding
   - Don't pressure users to commit to paid plans during signup
   - Free tier is sufficient to evaluate the product

### Copy Examples

**Hero Section (Homepage)**:

```
Headline: "See All Your AI Outputs at Once"
Subheadline: "Rate 30 outputs in 5 minutes. See patterns instantly.
              Fix prompts with confidence."

CTA: [Start Free] ← Always free tier
Trust: "Free forever • No credit card • 100 outputs/month"
```

**Pricing Page Hero**:

```
Headline: "Choose Your Plan"
Subheadline: "Start with our free tier and upgrade when you're ready.
              Paid plans launching Q1 2025."
```

**Free Tier Badge**:

```
"Most Popular" ← For now, since it's the only available option
```

**Pro/Team Badges**:

```
"Coming Soon" ← Clear indicator
```

---

## Signup Flow

### Step 1: User Clicks "Start Free" (Marketing Site)

**Action**: Redirect to product auth page

**URL**: `https://app.sageloop.com/auth/signup`

**No parameters needed** - product will auto-create free tier subscription

### Step 2: User Signs Up (Product App)

**Product handles**:

1. User creates account (Supabase Auth)
2. System auto-creates workbench
3. System auto-creates free tier subscription (100 outputs/month)
4. User redirected to dashboard

### Step 3: User Hits Quota (Product App)

**Product shows**:

- Banner: "You've used 100/100 outputs. Join the waitlist for Pro."
- Error on generation: "Monthly quota exceeded. Join waitlist for higher limits."
- Link to external waitlist form

---

## Waitlist Form Setup

### Recommended Tool: Tally (Free, No-Code)

**Why Tally**:

- ✅ Free forever (unlimited responses)
- ✅ Clean UI (looks native)
- ✅ Can embed or link
- ✅ Export to CSV
- ✅ Email pre-fill support
- ✅ No branding on free plan

**Alternative**: Typeform (free for 10 responses/month, then paid)

### Form Fields

**Required**:

1. Email (text input, validated)
   - Pre-filled from URL param: `?email=user@example.com`
2. Plan Interest (dropdown)
   - Options: "Pro ($20/mo)", "Team ($49/mo)", "Enterprise ($199/mo)"
3. Use Case (textarea)
   - Prompt: "What would you use Sageloop for?"

**Optional**: 4. Company (text input) 5. Current tool (text input)

### Form Submit

**Success Message**:

```
Thanks for your interest!

We'll notify you as soon as [Pro/Team/Enterprise] is available.

In the meantime, enjoy our free tier with 100 outputs/month.

[Back to Sageloop] ← Link to app.sageloop.com
```

### Tally Form URL Structure

**Create form at**: tally.so

**Embed/Link**:

- Option 1: Direct link: `https://tally.so/r/YOUR-FORM-ID?email={email}`
- Option 2: Embed iframe in modal on marketing site
- **Recommendation**: Direct link (simpler for Phase 1)

---

## Technical Implementation

### Marketing Site Changes Needed

**Files to Create/Modify**:

1. **Pricing Page** (`/pricing` route)
   - 4-column pricing table
   - CTAs with correct links
   - "Coming Soon" badges on Pro/Team

2. **Homepage Hero**
   - "Start Free" CTA → `https://app.sageloop.com/auth/signup`
   - Trust signals: "Free forever • No credit card"

3. **Navigation**
   - Add "Pricing" link to header
   - Ensure all CTAs point to free signup (not plan selection)

### No Backend Changes Needed

- ❌ No plan selection logic
- ❌ No price ID passing
- ❌ No checkout integration
- ✅ Simple redirects to product or external form

---

## FAQ to Address on Pricing Page

### Q: Is the free tier really free?

**A**: Yes, forever. 100 outputs per month with GPT-5-nano, no credit card required.

### Q: When will paid plans be available?

**A**: Pro and Team plans are launching Q1 2025. Join the waitlist to be notified.

### Q: Can I upgrade later?

**A**: Yes. Start free and upgrade anytime when paid plans launch.

### Q: What happens if I exceed 100 outputs?

**A**: Generation will be blocked until next month (1st). Join the waitlist for higher limits.

### Q: Do I need a credit card for the free tier?

**A**: No. Free tier requires no payment method.

### Q: Can I bring my own API keys?

**A**: Yes, on Enterprise tier (BYOK). Currently in waitlist phase.

---

## Success Metrics (Marketing Site)

**Track These**:

- [ ] Pricing page views
- [ ] "Start Free" CTA clicks (conversion %)
- [ ] "Join Waitlist" CTA clicks (per plan)
- [ ] Waitlist form submissions (by plan interest)
- [ ] Drop-off rate at signup redirect

**Target Metrics (3 months)**:

- 10%+ of pricing page visitors click "Start Free"
- 5%+ of pricing page visitors join waitlist
- 50+ waitlist signups before Phase 2

---

## Phase 2 Changes (Future)

**When paid plans launch**, marketing site will need minimal changes:

**Changes Needed**:

1. Remove "Coming Soon" badges from Pro/Team
2. Change "Join Waitlist" to "Start Free Trial" → product checkout
3. Add checkout flow documentation

**No Changes Needed**:

- Pricing table structure (same)
- Free tier messaging (same)
- Copy (mostly same)

---

## Design Assets Needed

**From Design Team**:

1. **Badges**:
   - "Most Popular" (for Free tier in Phase 1)
   - "Coming Soon" (for Pro/Team tiers)

2. **Pricing Cards**:
   - 4 card components (Free, Pro, Team, Enterprise)
   - Consistent with design system (indigo accent, high contrast)

3. **CTAs**:
   - Primary button: "Start Free" (indigo fill)
   - Secondary button: "Join Waitlist" (indigo outline)
   - Tertiary button: "Contact Sales" (ghost)

4. **Icons**:
   - Checkmarks for feature lists
   - Model icons (if applicable)

---

## Testing Checklist

**Before Launch**:

- [ ] "Start Free" redirects to `https://app.sageloop.com/auth/signup`
- [ ] "Join Waitlist" opens Tally form in new tab
- [ ] Email pre-fill works in waitlist form URL
- [ ] "Contact Sales" links to correct email/form
- [ ] Pricing table displays correctly on mobile
- [ ] All copy reviewed for consistency
- [ ] "Coming Soon" badges visible on Pro/Team
- [ ] FAQ section answers key questions

---

## Quick Reference

### URLs to Use

| Link Purpose               | URL                                    | Opens In     |
| -------------------------- | -------------------------------------- | ------------ |
| Start Free (Free tier)     | `https://app.sageloop.com/auth/signup` | Same tab     |
| Join Waitlist (Pro/Team)   | `https://tally.so/r/YOUR-FORM-ID`      | New tab      |
| Contact Sales (Enterprise) | `mailto:sales@sageloop.com`            | Email client |

### Waitlist Form Pre-fill

**URL Pattern**: `https://tally.so/r/YOUR-FORM-ID?email={email}`

**Example**: `https://tally.so/r/abc123?email=user@example.com`

---

## Questions?

**Product Team Contact**: [Your contact info]

**Clarifications Needed**:

1. Exact Tally form URL (create form and share)
2. Sales email address for Enterprise inquiries
3. Any custom tracking parameters for analytics

---

## Summary

**Phase 1 (Now)**:

- Show all 4 pricing tiers on marketing site
- Free tier: "Start Free" → Product signup (always free)
- Pro/Team: "Join Waitlist" → External Tally form
- Enterprise: "Contact Sales" → Email or contact form

**Phase 2 (Future)**:

- Same pricing page structure
- Change Pro/Team CTAs from "Join Waitlist" to "Start Free Trial" → Stripe checkout
- All other copy remains mostly the same

**Key Principle**: Marketing site focuses on awareness and expectation-setting. Product handles all subscription logic and upgrades.

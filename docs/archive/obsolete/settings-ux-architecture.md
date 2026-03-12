# Settings UX Architecture

This document explains how Sageloop manages different layers of settings with an intuitive information architecture.

## Problem

Sageloop has three distinct layers of settings:

1. **Project Settings** - Model, temperature, system prompt (per-project)
2. **Workbench Settings** - BYOK API keys (workspace-level)
3. **Subscription Settings** - Plan, usage, quota (billing-level)

The challenge: How to present these layers without confusing users or creating a labyrinth of settings pages?

## Solution: Hierarchy-Based Architecture

We use a **clear hierarchy** to separate concerns:

```
User Menu (Top Navigation)
└── Settings → Unified Settings Hub
    ├── Subscription (default tab)
    ├── API Keys
    └── Team (Phase 2)

Project Page (Inline)
└── Project-specific settings (model, temperature, prompt)
```

### Key Principles

1. **Scope Separation**
   - **Workspace-level** → `/settings/*` (affects all projects in workspace)
   - **Project-level** → Inline on project page (affects only that project)

2. **Access Frequency**
   - **Rarely changed** → Dedicated settings hub (subscription, API keys)
   - **Frequently changed** → Inline controls (model selection, temperature)

3. **Navigation Clarity**
   - Single "Settings" entry in user menu
   - Lands on most important tab (Subscription)
   - Tabs make secondary settings discoverable

4. **Visual Hierarchy**
   - Settings header shows workspace name
   - Tabs use indigo accent for active state
   - Consistent spacing and layout across tabs

## Implementation

### Routes

| Route                    | Purpose                                            | Scope     |
| ------------------------ | -------------------------------------------------- | --------- |
| `/settings`              | Redirects to `/settings/subscription`              | N/A       |
| `/settings/subscription` | View plan, usage, upgrade options                  | Workbench |
| `/settings/api-keys`     | Configure BYOK API keys                            | Workbench |
| `/projects/[id]`         | Project settings inline (model badge, edit dialog) | Project   |

### Components

**Unified Settings Layout** - `/app/settings/layout.tsx`

- Renders header with workspace name
- Embeds `<SettingsTabs />` for navigation
- Provides consistent container for all settings pages

**Settings Tabs** - `/components/settings/settings-tabs.tsx`

- Client component that tracks active tab via `usePathname()`
- Highlights active tab with indigo border
- Shows tab descriptions on desktop

**Individual Setting Pages**

- `/app/settings/subscription/page.tsx` - Plan status, usage meters, upgrade CTA
- `/app/settings/api-keys/page.tsx` - API key configuration

### Navigation Flow

```
User clicks "Settings" in user menu
  ↓
Lands on /settings/subscription (default tab)
  ↓
Can switch tabs: Subscription ← → API Keys
  ↓
All changes scoped to workbench level
```

## Phase 1 vs Phase 2

### Phase 1 (Current)

- Free tier only
- System API keys with quota enforcement
- 2 tabs: Subscription, API Keys
- API Keys tab shows "Phase 1 notice" (BYOK coming in Phase 2)

### Phase 2 (Future)

- Paid plans available
- BYOK functional for paid users
- Additional tab: Team (members, roles, permissions)
- Stripe integration for billing

## Benefits

1. **Mental Model Clarity** - Users understand: Settings = Workspace, Project Page = Project
2. **Scalability** - Easy to add new workspace-level settings as tabs
3. **Progressive Disclosure** - Most important settings (subscription) shown first
4. **Consistency** - All settings follow same layout pattern
5. **Discoverability** - Tabs make related settings easy to find

## Migration Notes

- Removed `/workbench/[id]/settings` route (old BYOK-only page)
- Consolidated to `/settings/*` hierarchy
- User menu now points to `/settings/subscription` instead of workbench settings
- No breaking changes for users (redirect in place)

## Future Considerations

### Team Settings (Phase 2)

When team collaboration is added:

```typescript
// /app/settings/team/page.tsx
- List team members
- Manage roles (owner, member, viewer)
- Send invitations
- Transfer ownership
```

### Personal Settings (Future)

If we add user-level preferences:

```
/settings/profile - User profile, email preferences
/settings/notifications - Notification preferences
```

For now, we keep it simple: workspace settings only.

## Design System Integration

The settings pages follow the Sageloop design system:

- **Tabs**: Indigo accent (`border-primary`) for active state
- **Spacing**: Consistent `space-y-6` between sections
- **Cards**: White background with gray border for setting groups
- **Typography**: `text-3xl font-bold` for page header, `text-xl font-semibold` for sections
- **Alerts**: Info alert for Phase 1 notice on API Keys tab

## Code References

- Settings layout: [app/settings/layout.tsx](app/settings/layout.tsx)
- Settings tabs component: [components/settings/settings-tabs.tsx](components/settings/settings-tabs.tsx)
- Subscription page: [app/settings/subscription/page.tsx](app/settings/subscription/page.tsx)
- API keys page: [app/settings/api-keys/page.tsx](app/settings/api-keys/page.tsx)
- User menu: [components/auth/user-menu.tsx](components/auth/user-menu.tsx:36-38)

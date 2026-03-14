# Authentication and Workbench Implementation

**Status:** Planning Complete - Ready for Implementation
**Date:** December 2025
**Goal:** Add user authentication and team workspaces (workbenches) to enable multi-user access and prepare for test users

---

## Overview

This initiative adds two critical features to Tellah:

1. **Authentication** - User signup/login using Supabase Auth (email/password)
2. **Workbenches** - Team workspace concept where users collaborate on projects

### Why "Workbench"?

We chose "Workbench" over "Workspace" or "Team" to tip our hat to builders. It evokes a place where you craft and iterate, which aligns with Tellah's mission of helping PMs and engineers build better AI products together.

---

## Product Requirements

### Phase 1 (MVP) - This Implementation

**Authentication:**

- Email/password authentication (no OAuth yet)
- No email verification required for MVP
- Session management with HTTP-only cookies
- Protected routes via middleware

**Workbenches:**

- Auto-create personal workbench on user signup
- Users can belong to multiple workbenches (no limit)
- All workbench members have equal access (no role enforcement yet)
- Projects belong to a workbench
- Users see only projects in their workbenches

**Out of Scope for MVP:**

- Email verification
- OAuth providers (Google, GitHub - future)
- Workbench invitation UI
- Workbench management UI (create/rename/delete)
- Workbench switcher dropdown
- Role-based permissions enforcement

### Phase 2 (Post-MVP)

- Workbench invitation flow (send links, accept invites)
- Workbench management UI
- Workbench switcher for users in multiple workbenches
- Role-based access control (owner, admin, member)
- OAuth providers (Google, GitHub)
- Team settings and billing

---

## Technical Architecture

### Database Schema Changes

**New Tables:**

```sql
-- Workbenches: Team workspace for collaboration
create table workbenches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- User-Workbench Junction: Many-to-many relationship
create table user_workbenches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  workbench_id uuid references workbenches(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default now(),
  unique(user_id, workbench_id)
);
```

**Modified Tables:**

```sql
-- Projects now belong to a workbench
alter table projects
  add column workbench_id uuid references workbenches(id) on delete cascade,
  add column created_by uuid references auth.users(id);
```

**Data Relationships:**

```
auth.users (Supabase managed)
    ↓ (many-to-many via user_workbenches)
workbenches
    ↓ (one-to-many)
projects
    ↓ (one-to-many)
scenarios
    ↓ (one-to-many)
outputs
    ↓ (one-to-many)
ratings

projects also have:
    ↓ (one-to-many)
extractions
    ↓ (one-to-many)
metrics
```

### Row Level Security (RLS)

All tables have RLS enabled with policies that enforce:

1. Users can only view/edit data in workbenches they belong to
2. Access cascades down through relationships (project → scenarios → outputs → ratings)
3. No service role usage in user-facing queries (all access through RLS)

**Key Policies:**

- **Workbenches:** Users see only workbenches they're members of
- **Projects:** Users see only projects in their workbenches
- **Scenarios/Outputs/Ratings:** Inherit access from parent project
- **Extractions/Metrics:** Tied to projects, inherit workbench access

### Authentication Flow

**Signup:**

1. User submits email/password
2. Supabase creates auth.users record
3. Database trigger auto-creates personal workbench
4. User added as 'owner' of workbench
5. Redirect to /projects

**Login:**

1. User submits credentials
2. Supabase validates and creates session
3. Session stored in HTTP-only cookies
4. Redirect to /projects

**Session Management:**

- Middleware checks auth on every request
- Unauthenticated users redirected to /auth/login
- Authenticated users redirected away from /auth pages
- Sessions refreshed automatically

---

## Implementation Plan

### Files to Create (19 files)

**Database:**

1. `supabase/migrations/20250105000001_add_auth_and_workbenches.sql` - Main migration with RLS

**Middleware:** 2. `middleware.ts` - Route protection and session refresh

**Auth Pages:** 3. `app/(auth)/layout.tsx` - Auth layout (centered, no nav) 4. `app/(auth)/login/page.tsx` - Login page 5. `app/(auth)/signup/page.tsx` - Signup page

**Auth Components:** 6. `components/auth/login-form.tsx` - Login form with error handling 7. `components/auth/signup-form.tsx` - Signup form with validation 8. `components/auth/user-menu.tsx` - User dropdown with logout

**Workbench Management:** 9. `lib/hooks/use-workbench.ts` - React context for current workbench

**Seed Data:** 10. `supabase/seed.sql` - Updated with workbench support

**Documentation:** 11. `docs/auth-and-workbench-implementation.md` - This file

### Files to Modify (12+ files)

**Core Infrastructure:**

1. `lib/supabase.ts` - Add authenticated client factories
2. `app/layout.tsx` - Add user menu to nav

**Project Pages:** 3. `app/projects/page.tsx` - Use authenticated client 4. `app/projects/new/page.tsx` - Add workbench_id and created_by 5. `app/projects/[id]/page.tsx` - Use authenticated client 6. `app/projects/[id]/outputs/page.tsx` - Use authenticated client 7. `app/projects/[id]/insights/page.tsx` - Use authenticated client 8. `app/projects/[id]/insights/history/page.tsx` - Use authenticated client

**API Routes (8-10 files):** 9. `app/api/projects/route.ts` 10. `app/api/projects/[id]/route.ts` 11. `app/api/projects/[id]/scenarios/route.ts` 12. `app/api/scenarios/[id]/generate/route.ts` 13. `app/api/outputs/[id]/rate/route.ts` 14. `app/api/projects/[id]/extract/route.ts` 15. `app/api/projects/[id]/extractions/route.ts` 16. `app/api/projects/[id]/metrics/route.ts` 17. Plus any other API routes

**Types & Config:** 18. `types/supabase.ts` - Regenerated with new schema 19. `CLAUDE.md` - Add auth patterns documentation

### New Dependencies

```bash
npm install @supabase/ssr
npx shadcn@latest add dropdown-menu
```

---

## Implementation Checklist

### Phase 1: Database & Auth Foundation

- [ ] Create migration `20250105000001_add_auth_and_workbenches.sql`
- [ ] Run migration locally: `supabase db reset`
- [ ] Verify RLS policies work (test with Supabase Studio)
- [ ] Verify auto-workbench creation trigger works
- [ ] Test user signup creates workbench automatically

### Phase 2: Supabase Client Updates

- [ ] Install `@supabase/ssr` package
- [ ] Update `lib/supabase.ts` with authenticated client factories
- [ ] Remove `supabaseAdmin` usage from user-facing queries
- [ ] Regenerate types: `npm run supabase:gen-types`

### Phase 3: Authentication UI

- [ ] Create `middleware.ts` for route protection
- [ ] Create auth layout and pages (login/signup)
- [ ] Create auth form components (login-form, signup-form)
- [ ] Create user-menu component with logout
- [ ] Install dropdown-menu component: `npx shadcn@latest add dropdown-menu`
- [ ] Test signup flow end-to-end
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test route protection (unauthenticated users redirected)

### Phase 4: Data Access Updates

- [ ] Update `app/projects/page.tsx` - use authenticated client
- [ ] Update `app/projects/new/page.tsx` - add workbench_id, created_by
- [ ] Update `app/projects/[id]/page.tsx`
- [ ] Update `app/projects/[id]/outputs/page.tsx`
- [ ] Update `app/projects/[id]/insights/page.tsx`
- [ ] Update `app/projects/[id]/insights/history/page.tsx`
- [ ] Update all API routes to use authenticated client
- [ ] Update `app/layout.tsx` - add user menu

### Phase 5: Workbench Management

- [ ] Create `lib/hooks/use-workbench.ts` context
- [ ] Add workbench provider to layout
- [ ] Test multi-workbench scenarios (user belongs to 2+ workbenches)

### Phase 6: Testing & Polish

- [ ] Update seed data for auth testing
- [ ] Test E2E: signup → create project → add scenarios → rate
- [ ] Test RLS: create 2 users, verify they can't see each other's data
- [ ] Test error states (wrong password, network errors, no workbench)
- [ ] Update `CLAUDE.md` with auth patterns
- [ ] Update this documentation with learnings

---

## Key Patterns and Best Practices

### Supabase Client Usage

**❌ DON'T: Use service role for user queries**

```typescript
// This bypasses RLS - security risk!
const { data } = await supabaseAdmin.from("projects").select("*");
```

**✅ DO: Use authenticated client**

```typescript
const supabase = await createServerClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  redirect("/auth/login");
}

const { data } = await supabase.from("projects").select("*"); // RLS automatically filters to user's workbenches
```

### Workbench Filtering

**Pattern: Auto-filter by workbench**

```typescript
// RLS handles this automatically! No need to manually filter
const { data: projects } = await supabase
  .from("projects")
  .select("*, workbenches(name)")
  .order("created_at", { ascending: false });
// Only returns projects in user's workbenches
```

### Creating Resources

**Pattern: Always set workbench_id and created_by**

```typescript
const { data: project, error } = await supabase
  .from("projects")
  .insert({
    workbench_id: currentWorkbench.id,
    created_by: user.id,
    name: "My Project",
    model_config: {
      /* ... */
    },
  })
  .select()
  .single();
```

---

## Testing Strategy

### 1. RLS Policy Testing

Create two test users and verify data isolation:

```sql
-- As User A
SELECT * FROM projects; -- Should see only User A's projects

-- As User B
SELECT * FROM projects; -- Should see only User B's projects

-- User B tries to access User A's project
SELECT * FROM projects WHERE id = '<user-a-project-id>';
-- Should return empty
```

### 2. Auto-Workbench Creation

```typescript
// Sign up new user
// Check: workbenches table has new record
// Check: user_workbenches has link with role='owner'
```

### 3. Multi-Workbench Scenarios

```typescript
// Create User A with Workbench 1
// Create User B with Workbench 2
// Add User A to Workbench 2 (manual DB insert for now)
// User A should see projects from both workbenches
```

### 4. Cascade Deletion

```sql
-- Delete a workbench
DELETE FROM workbenches WHERE id = '<workbench-id>';
-- Check: All projects in that workbench deleted (cascade)
-- Check: All scenarios, outputs, ratings also deleted
```

---

## Migration Strategy

### For Existing Development Data

Since we're currently using seed data for testing:

1. **Option A (Clean Slate):**
   - Run `supabase db reset` to wipe and recreate
   - Use updated seed.sql with workbench support
   - Manually create test users via Supabase Studio

2. **Option B (Preserve Data):**
   - Create migration with workbench tables
   - Run backfill script to assign existing projects to default workbench
   - Manually link test user to default workbench

**Recommendation:** Use Option A for development since we're pre-launch.

### For Future Production Launch

When we have real user data:

1. Create default workbench for each unique email domain
2. Assign all existing projects to appropriate workbench
3. Create auth.users records for existing users (send password reset emails)
4. Run migration in maintenance window with rollback plan

---

## Security Considerations

### Critical Points

1. **RLS is the primary security boundary**
   - All user-facing queries MUST use authenticated client
   - Service role (`supabaseAdmin`) only for system operations
   - Test RLS policies thoroughly before production

2. **Cookie Security**
   - Supabase SSR handles HTTP-only cookies
   - Sessions auto-refresh via middleware
   - CSRF protection built into Supabase Auth

3. **Input Validation**
   - Email format validation on signup
   - Password minimum length (6 chars)
   - Sanitize user inputs before DB insertion

4. **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose (respects RLS)
   - `SUPABASE_SERVICE_ROLE_KEY` - Keep secret, server-side only

### Attack Vectors to Test

- [ ] User A can't access User B's projects (RLS enforcement)
- [ ] Unauthenticated users redirected to login
- [ ] Service role key not exposed in client-side code
- [ ] SQL injection via project names/descriptions
- [ ] XSS via user-generated content

---

## Future Enhancements (Phase 2+)

### Workbench Management UI

**Create Workbench:**

```
[+ New Workbench]
→ Modal with name input
→ Creates workbench, adds user as owner
→ Switches to new workbench
```

**Invite to Workbench:**

```
Settings → Members → [+ Invite]
→ Generate invite link or send email
→ Invited user clicks link → added to workbench
```

**Workbench Switcher:**

```
Dropdown in nav:
  Personal Workbench
  Team Acme Inc.
  [+ New Workbench]
```

### Role-Based Access Control

```typescript
// Enforce roles at API level
if (userWorkbench.role !== 'owner' && userWorkbench.role !== 'admin') {
  return new Response('Forbidden', { status: 403 });
}

// UI changes based on role
{user.role === 'owner' && <DeleteProjectButton />}
```

### OAuth Providers

```typescript
// Add Google and GitHub
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

---

## Success Metrics

This implementation is successful if:

1. ✅ Two users can sign up and only see their own projects
2. ✅ User can create projects and they're auto-assigned to workbench
3. ✅ RLS policies prevent unauthorized access (tested via Supabase Studio)
4. ✅ Session persists across page refreshes
5. ✅ Logout works and clears session
6. ✅ All existing functionality still works (scenarios, ratings, extractions)

---

## Open Questions & Decisions

### Resolved

- ✅ **Naming:** "Workbench" (over Workspace/Team)
- ✅ **Email Verification:** Not required for MVP
- ✅ **OAuth:** Email/password only for MVP
- ✅ **Roles:** Equal access for MVP, role column exists for future
- ✅ **Workbench Limit:** No limit, users can belong to multiple

### Still Open

- ⏳ **Default Workbench Name:** Should it be "[email]'s Workbench" or extract name from email prefix?
- ⏳ **Workbench Deletion:** Should we soft-delete or hard-delete? (Affects user_workbenches and projects)
- ⏳ **Error Handling:** How verbose should auth errors be? (Security vs UX trade-off)

---

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [@supabase/ssr Package](https://github.com/supabase/auth-helpers/tree/main/packages/ssr)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## Change Log

- **2025-12-05:** Initial planning document created

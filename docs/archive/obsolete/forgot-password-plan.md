# Forgot Password Flow Implementation Plan

**Date**: 2025-12-16
**Status**: Planning
**Total Estimated Effort**: 6 hours across 2 sprints

## Overview

Implement a secure password reset flow using Supabase Auth's built-in password recovery functionality. Users will be able to request a password reset email, click a link, and set a new password. This follows industry-standard patterns while maintaining Sageloop's clean design aesthetic.

## Key Deliverables

- ❌ Forgot password request page with email input
- ❌ Password reset page for setting new password
- ❌ Integration with Supabase Auth password recovery
- ❌ Updated login page with "Forgot password?" link
- ❌ Success/error messaging throughout flow

## Background

### Current State

- Sageloop has login and signup flows using Supabase Auth
- Authentication uses client-side components with `createClient()` from `@/lib/supabase/client`
- Auth pages follow consistent layout pattern in `app/(auth)/` directory
- Design system uses semantic color tokens (primary, muted, destructive)
- Forms use shadcn components (Card, Input, Button, Label)

### Problem Statement

Users who forget their passwords have no way to regain access to their accounts. This is a critical missing feature for any authentication system.

### Goals

- Implement secure password reset using Supabase's built-in functionality
- Follow existing auth page patterns and design system
- Provide clear user feedback at each step
- Handle edge cases (invalid tokens, expired links, errors)

### Non-Goals

- Custom email templates (will use Supabase default)
- Password strength validation beyond Supabase defaults (6+ characters)
- Rate limiting (handled by Supabase)
- Magic link authentication (different feature)

## Technical Approach

### Architecture Decisions

**Use Supabase Auth Built-in Password Recovery**

- Supabase provides `resetPasswordForEmail()` and `updateUser()` methods
- Email sending handled by Supabase infrastructure
- Token validation handled securely by Supabase
- No need for custom API routes or token management

**Two-Page Flow**

1. `/forgot-password` - Request reset email
2. `/reset-password` - Set new password (accessed via email link)

**Client-Side Components**

- Follow existing pattern of client components with forms
- Use `createClient()` for browser-based Supabase client
- Handle loading states and errors inline

### Technology Choices

- **Supabase Auth**: Built-in password recovery methods
- **Next.js App Router**: Consistent with existing auth pages
- **shadcn/ui Components**: Card, Input, Button, Label
- **Design System**: Semantic tokens from `globals.css`

### Design Trade-offs

**Option 1: Supabase Built-in (CHOSEN)**

- ✅ Secure token generation and validation
- ✅ Email infrastructure included
- ✅ Less code to maintain
- ✅ Industry-standard security practices
- ❌ Less control over email templates
- ❌ Dependent on Supabase email service

**Option 2: Custom Implementation**

- ✅ Full control over email templates
- ✅ Custom token expiration logic
- ❌ More code to write and maintain
- ❌ Security vulnerabilities if implemented incorrectly
- ❌ Need email service provider integration

### Dependencies

- Supabase email sending must be configured (should already be working for signup emails)
- Email redirect URL must point to `/reset-password` page
- No database schema changes needed

## Sprint Plan

### Sprint 0: Core Password Reset Flow (4 hours)

**Goal**: Implement functional password reset from request to completion

**Why First?** This delivers the complete user flow and can be tested end-to-end immediately.

**Tasks**:

1. ✅ **Create forgot password request page** - 1h
   - Create `/app/(auth)/forgot-password/page.tsx`
   - Create `/components/auth/forgot-password-form.tsx`
   - Form with email input
   - Call `supabase.auth.resetPasswordForEmail()`
   - Success state: "Check your email for reset link"
   - Error handling for invalid emails
   - Files: `app/(auth)/forgot-password/page.tsx`, `components/auth/forgot-password-form.tsx`

2. ✅ **Create password reset page** - 1.5h
   - Create `/app/(auth)/reset-password/page.tsx`
   - Create `/components/auth/reset-password-form.tsx`
   - Form with password and confirm password inputs
   - Call `supabase.auth.updateUser({ password: newPassword })`
   - Validation: passwords match, minimum length
   - Success: Redirect to `/projects` with auto-login
   - Error handling for invalid/expired tokens
   - Files: `app/(auth)/reset-password/page.tsx`, `components/auth/reset-password-form.tsx`

3. ✅ **Add forgot password link to login page** - 0.5h
   - Update `components/auth/login-form.tsx`
   - Add "Forgot password?" link below password field
   - Link to `/forgot-password`
   - Style consistently with existing "Sign up" link
   - Files: `components/auth/login-form.tsx`

4. ✅ **Configure Supabase email redirect** - 1h
   - Ensure email redirect URL points to correct domain + `/reset-password`
   - Test with actual email delivery
   - Verify token validation works
   - Handle edge cases (expired token, already used)

**Total**: 4 hours

**Deliverables**:

- Working forgot password request page at `/forgot-password`
- Working password reset page at `/reset-password`
- Email sent with reset link
- User can set new password and auto-login
- Login page has "Forgot password?" link

**Success Metrics**:

- [ ] User can request password reset email
- [ ] Email arrives with correct reset link
- [ ] Reset link navigates to password reset page
- [ ] User can set new password successfully
- [ ] After reset, user is logged in and redirected to `/projects`
- [ ] Expired/invalid tokens show appropriate error messages
- [ ] All pages follow design system (semantic tokens)

---

### Sprint 1: Polish & Edge Cases (2 hours)

**Goal**: Handle edge cases, improve UX, add comprehensive error handling

**Why Second?** Core flow must work first; polish ensures production-ready quality.

**Tasks**:

1. ✅ **Enhanced error handling** - 0.5h
   - Handle "Email not found" gracefully (don't reveal if email exists for security)
   - Handle network errors
   - Handle Supabase service errors
   - Clear, user-friendly error messages
   - Files: `components/auth/forgot-password-form.tsx`, `components/auth/reset-password-form.tsx`

2. ✅ **Password validation feedback** - 0.5h
   - Real-time password strength indicator
   - Visual feedback when passwords match/don't match
   - Clear requirements (6+ characters minimum)
   - Files: `components/auth/reset-password-form.tsx`

3. ✅ **Loading and success states** - 0.5h
   - Loading spinners during API calls
   - Success messages with appropriate timing
   - Disable form fields during submission
   - Smooth transitions between states
   - Files: `components/auth/forgot-password-form.tsx`, `components/auth/reset-password-form.tsx`

4. ✅ **Testing and verification** - 0.5h
   - Manual testing of complete flow
   - Test error scenarios (wrong email, expired token, network failure)
   - Test on different screen sizes (responsive)
   - Verify design system compliance
   - Document any Supabase configuration needed

**Total**: 2 hours

**Deliverables**:

- Comprehensive error handling for all edge cases
- Password validation with visual feedback
- Polished loading/success states
- Fully tested password reset flow
- Documentation for setup

**Success Metrics**:

- [ ] All edge cases handled gracefully
- [ ] Error messages are clear and helpful
- [ ] Password validation prevents weak passwords
- [ ] Loading states prevent double-submission
- [ ] Flow works on mobile and desktop
- [ ] No console errors or warnings

## Testing Strategy

### Test Coverage Goals

| Layer               | Coverage Target | Priority    |
| ------------------- | --------------- | ----------- |
| Password Reset Flow | 100%            | 🔴 Required |
| Error Handling      | 100%            | 🔴 Required |
| UI Components       | 70%             | 🟢 Medium   |

### Manual Testing Checklist

**Sprint 0**:

- [ ] Request password reset with valid email
- [ ] Request password reset with invalid email format
- [ ] Receive email and click reset link
- [ ] Set new password successfully
- [ ] Login with new password
- [ ] Try accessing reset page without token

**Sprint 1**:

- [ ] Request reset with non-existent email
- [ ] Use expired reset token
- [ ] Use reset token twice
- [ ] Submit mismatched passwords
- [ ] Submit password under 6 characters
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Test with slow network connection

### Testing Workflow

Since this involves Supabase Auth and email delivery:

1. Test in development with real email address
2. Verify email arrives (check spam folder)
3. Click link and verify redirect to reset page
4. Complete password reset flow
5. Verify can login with new password
6. Test error scenarios manually

## Files Modified Summary

### New Files (4 files)

- `app/(auth)/forgot-password/page.tsx` - Forgot password request page
- `components/auth/forgot-password-form.tsx` - Email input form component
- `app/(auth)/reset-password/page.tsx` - Password reset page
- `components/auth/reset-password-form.tsx` - New password form component

### Modified Files (1 file)

- `components/auth/login-form.tsx` - Add "Forgot password?" link

### Total: 4 new + 1 modified = 5 files

## Risks & Mitigation

| Risk                            | Impact | Probability | Mitigation                                                   |
| ------------------------------- | ------ | ----------- | ------------------------------------------------------------ |
| Supabase email not configured   | High   | Low         | Test email delivery early; check Supabase dashboard settings |
| Email goes to spam              | Medium | Medium      | Use clear from address; test with multiple email providers   |
| Reset token expires too quickly | Medium | Low         | Document token expiration time; add helpful error message    |
| User confusion about flow       | Low    | Low         | Clear messaging at each step; follow industry patterns       |

## Success Metrics

### Definition of Done

- [ ] All sprint deliverables completed
- [ ] Manual testing checklist passed
- [ ] No console errors or warnings
- [ ] Design system compliance verified
- [ ] Documentation complete

### Verification

**How to verify the project succeeded:**

1. **Functional Test**:

   ```bash
   # Start dev server
   npm run dev

   # Navigate to http://localhost:3000/login
   # Click "Forgot password?"
   # Enter email and submit
   # Check email inbox
   # Click reset link in email
   # Enter new password
   # Verify redirect to /projects and logged in
   ```

2. **Design System Compliance**:
   - [ ] Uses `bg-background`, `text-foreground`, `text-primary`
   - [ ] Uses shadcn Card, Input, Button components
   - [ ] Uses Logo component
   - [ ] Matches login/signup page styling
   - [ ] Responsive on mobile

3. **Error Handling**:
   - [ ] Invalid email shows error
   - [ ] Expired token shows error
   - [ ] Network errors handled
   - [ ] All errors are user-friendly

## Timeline

| Sprint              | Estimated Time | Status      |
| ------------------- | -------------- | ----------- |
| Sprint 0: Core Flow | 4h             | Not Started |
| Sprint 1: Polish    | 2h             | Not Started |
| **Total**           | **6h**         | **~1 day**  |

## Next Steps

1. Review this plan
2. Begin Sprint 0 - Create core password reset flow
3. Test email delivery in development
4. Complete Sprint 1 - Polish and edge cases
5. Final testing and verification

## Implementation Notes

### Supabase Auth Methods

**Request Password Reset**:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Update Password**:

```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

**Check Auth State**:

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
// Session available means user clicked valid reset link
```

### Email Redirect Configuration

Supabase sends email with link like:

```
https://yourapp.com/reset-password#access_token=...&refresh_token=...&type=recovery
```

The reset password page automatically has access to these tokens via Supabase Auth state.

### Security Considerations

- Never reveal if email exists in system (same response for valid/invalid emails)
- Tokens are single-use and expire (handled by Supabase)
- Password must meet minimum requirements (6+ characters)
- Use HTTPS in production (handled by Vercel)
- Rate limiting handled by Supabase

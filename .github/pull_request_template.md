## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Security fix

## Related Issues

<!-- Link to related issues (e.g., Fixes #123, Relates to #456) -->

## Changes Made

<!-- List the main changes made in this PR -->

-
-
-

## Testing

<!-- Describe the tests you ran to verify your changes -->

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing (`npm test`)

### Manual Testing

<!-- Describe manual testing performed -->

-
-

## Security Checklist

⚠️ **Required for all PRs** - Review the [Security Checklist](./docs/security/SECURITY_CHECKLIST.md)

### General Security

- [ ] No obvious security vulnerabilities (SQL injection, XSS, etc.)
- [ ] Error messages are generic and don't expose sensitive information
- [ ] Security headers properly configured (if applicable)

### Authentication & Authorization

- [ ] Authentication required for protected routes
- [ ] User identity verified before sensitive operations
- [ ] RLS policies enforced (`createServerClient()` used, not `supabaseAdmin`)
- [ ] Authentication tests pass

### Input Validation & Sanitization

- [ ] All user inputs validated using Zod schemas
- [ ] String lengths limited to prevent resource exhaustion
- [ ] Array sizes limited to prevent memory issues
- [ ] User-generated HTML sanitized before rendering
- [ ] Filenames sanitized to prevent path traversal
- [ ] Input validation tests pass

### API Security

- [ ] API routes protected with authentication
- [ ] Rate limiting applied to prevent abuse (using `withRateLimit`)
- [ ] Appropriate rate limit configuration used
- [ ] API responses sanitized (no sensitive data exposure)
- [ ] Rate limit tests pass

### Secrets Management

- [ ] API keys/secrets accessed via `env` module (not `process.env`)
- [ ] No secrets hardcoded in source code
- [ ] Secrets never logged or exposed in error messages
- [ ] API keys masked when displayed to users
- [ ] `.env.example` updated with new environment variables (if applicable)
- [ ] Secrets scanning passes (`npm run security:secrets`)

### Database Security

- [ ] User-facing queries use RLS-protected client
- [ ] `supabaseAdmin` only used for system operations (if at all)
- [ ] Sensitive fields encrypted at rest (if applicable)
- [ ] RLS tests pass

### Frontend Security

- [ ] User-generated content sanitized before rendering
- [ ] External links use `rel="noopener noreferrer"`
- [ ] Client components use `createClient()` (not admin client)
- [ ] Sensitive data never stored in localStorage
- [ ] Sanitization tests pass

### Dependencies

- [ ] Dependencies up to date (or explained if not)
- [ ] No known vulnerabilities (`npm run security:deps`)
- [ ] Dependencies from trusted sources

### Testing

- [ ] Security tests added for new features
- [ ] All security tests pass (`npm test tests/security/`)
- [ ] Edge cases tested
- [ ] Negative test cases included

## Security Tools Status

Run these commands and paste results (or confirm all pass):

```bash
# All security checks
npm run security:all

# Individual checks
npm run security:scan    # ESLint security rules
npm run security:deps    # Dependency vulnerabilities
npm run security:secrets # Secrets detection

# All tests including security
npm test tests/security/
```

**Results**:

```
<!-- Paste output or confirm all pass -->
```

## Screenshots

<!-- If applicable, add screenshots to help explain your changes -->

## Performance Impact

<!-- Describe any performance implications of this change -->

- [ ] No significant performance impact
- [ ] Performance impact documented and acceptable
- [ ] Performance improvements included

## Breaking Changes

<!-- If this introduces breaking changes, describe them and the migration path -->

## Deployment Notes

<!-- Any special deployment considerations? -->

- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires cache clearing
- [ ] No special deployment requirements

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes

<!-- Any additional information that reviewers should know -->

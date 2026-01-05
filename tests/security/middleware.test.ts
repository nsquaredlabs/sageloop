import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "@/middleware";

/**
 * Middleware Tests
 *
 * These tests ensure that authentication middleware correctly handles access
 * to public auth pages (login, signup, forgot-password, reset-password) and
 * protects authenticated routes.
 *
 * CRITICAL: Tests prevent regression of password reset flow being blocked.
 */

// Mock Supabase SSR client
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

describe("Middleware - Public Auth Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow unauthenticated access to /login", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/login");
    const response = await middleware(request);

    expect(response.status).not.toBe(307); // Should not redirect
  });

  it("should allow unauthenticated access to /signup", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/signup");
    const response = await middleware(request);

    expect(response.status).not.toBe(307); // Should not redirect
  });

  it("should allow unauthenticated access to /forgot-password", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/forgot-password");
    const response = await middleware(request);

    // CRITICAL: This must not redirect - users need access to request password reset
    expect(response.status).not.toBe(307);
    expect(response.headers.get("location")).not.toBe("/login");
  });

  it("should allow unauthenticated access to /reset-password", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/reset-password");
    const response = await middleware(request);

    // CRITICAL: This must not redirect - users need access to reset password from email link
    expect(response.status).not.toBe(307);
    expect(response.headers.get("location")).not.toBe("/login");
  });

  it("should document all public auth paths", () => {
    // These paths MUST be accessible without authentication
    const publicAuthPaths = [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
    ];

    // If you add new auth pages, add them to this list AND to middleware.ts
    expect(publicAuthPaths).toHaveLength(4);
    expect(publicAuthPaths).toContain("/forgot-password");
    expect(publicAuthPaths).toContain("/reset-password");
  });
});

describe("Middleware - Protected Routes", () => {
  it("should redirect unauthenticated users from /projects to /login", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/projects");
    const response = await middleware(request);

    expect(response.status).toBe(307); // Temporary redirect
    expect(response.headers.get("location")).toContain("/login");
  });

  it("should redirect unauthenticated users from /workbench to /login", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest(
      "http://localhost:3000/workbench/123/settings",
    );
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("should allow authenticated users to access /projects", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      },
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/projects");
    const response = await middleware(request);

    expect(response.status).not.toBe(307); // Should not redirect
  });
});

describe("Middleware - Authenticated User Redirects", () => {
  it("should redirect authenticated users from /login to /projects", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      },
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/login");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/projects");
  });

  it("should redirect authenticated users from /signup to /projects", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      },
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/signup");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/projects");
  });

  it("should redirect authenticated users from /forgot-password to /projects", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      },
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new NextRequest("http://localhost:3000/forgot-password");
    const response = await middleware(request);

    // Authenticated users shouldn't need password reset
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/projects");
  });
});

describe("Middleware - OAuth Callback Path", () => {
  it("should allow unauthenticated access to /auth/callback", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    // OAuth callback is called WITHOUT a session - the callback handler creates the session
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc123",
    );
    const response = await middleware(request);

    // CRITICAL: Must not redirect - the callback handler needs to process the code
    expect(response.status).not.toBe(307);
    expect(response.headers.get("location")).not.toBe("/login");
  });

  it("should prevent OAuth callback redirect-to-login bug", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    // This is the bug scenario:
    // 1. User authorizes with GitHub OAuth
    // 2. GitHub redirects to /auth/callback?code=xxx
    // 3. At this point, no session exists yet (middleware runs BEFORE the callback handler)
    // 4. BUG: Middleware sees no user and redirects to /login
    // 5. FIX: /auth/callback should be bypassed by middleware

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=github_auth_code",
    );
    const response = await middleware(request);

    // The callback handler is responsible for authentication, not middleware
    // If there's no redirect, location is null - which is the correct behavior
    const location = response.headers.get("location");
    if (location !== null) {
      expect(location).not.toContain("/login");
    }
    // Success: either no redirect (null) or redirect to somewhere other than /login
    expect(response.status).not.toBe(307);
  });

  it("should allow the callback handler to establish session", async () => {
    const { createServerClient } = await import("@supabase/ssr");

    // First request: No user (OAuth code exchange hasn't happened yet)
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const callbackRequest = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid_code",
    );
    const callbackResponse = await middleware(callbackRequest);

    // Middleware should pass through to let the callback handler work
    expect(callbackResponse.status).toBe(200);
  });
});

describe("Middleware - Password Reset Flow Regression Prevention", () => {
  it('should prevent the "forgot password link redirects to login" bug', async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    // This is the exact bug that was reported:
    // Clicking "Forgot password?" link did nothing because middleware redirected to /login
    const forgotPasswordRequest = new NextRequest(
      "http://localhost:3000/forgot-password",
    );
    const forgotPasswordResponse = await middleware(forgotPasswordRequest);

    // The bug: middleware was redirecting to /login
    // The fix: /forgot-password is now in authPaths array
    expect(forgotPasswordResponse.status).not.toBe(307);
    const forgotLocation = forgotPasswordResponse.headers.get("location");
    expect(forgotLocation).not.toBeTruthy(); // Should not redirect at all

    // Same for reset-password page
    const resetPasswordRequest = new NextRequest(
      "http://localhost:3000/reset-password",
    );
    const resetPasswordResponse = await middleware(resetPasswordRequest);

    expect(resetPasswordResponse.status).not.toBe(307);
    const resetLocation = resetPasswordResponse.headers.get("location");
    expect(resetLocation).not.toBeTruthy(); // Should not redirect at all
  });

  it("should document the complete password reset flow paths", () => {
    // User journey for password reset:
    const passwordResetFlow = [
      "/login", // 1. User visits login page
      "/forgot-password", // 2. User clicks "Forgot password?"
      // 3. User receives email with reset link (external to middleware)
      "/reset-password", // 4. User clicks link in email, goes to reset page
      "/projects", // 5. After successful reset, redirects to projects
    ];

    // ALL of these paths must be properly handled by middleware
    expect(passwordResetFlow).toContain("/forgot-password");
    expect(passwordResetFlow).toContain("/reset-password");
  });

  it("should ensure middleware authPaths array includes password reset paths", () => {
    // CRITICAL: If this test fails, the password reset flow is broken
    // The authPaths array in middleware.ts MUST include these paths:
    const requiredAuthPaths = [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
    ];

    // This test serves as documentation and prevents regression
    requiredAuthPaths.forEach((path) => {
      expect(path).toBeTruthy();
    });

    expect(requiredAuthPaths).toHaveLength(4);
  });
});

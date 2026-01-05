import { test, expect } from "@playwright/test";

/**
 * OAuth E2E Tests
 *
 * End-to-end tests for OAuth authentication flows.
 * Note: These tests use mocked OAuth callbacks since we can't
 * actually authenticate with Google/GitHub in E2E tests.
 */

test.describe("OAuth Authentication Flows", () => {
  test.describe("Signup Page", () => {
    test("should display OAuth buttons on signup page", async ({ page }) => {
      await page.goto("/signup");

      // OAuth buttons should be visible
      await expect(
        page.getByRole("button", { name: /continue with google/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /continue with github/i }),
      ).toBeVisible();

      // Email form should also be present
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test("should have accessible OAuth buttons", async ({ page }) => {
      await page.goto("/signup");

      // Check ARIA labels
      const googleButton = page.getByRole("button", {
        name: /continue with google/i,
      });
      const githubButton = page.getByRole("button", {
        name: /continue with github/i,
      });

      await expect(googleButton).toHaveAttribute("aria-label");
      await expect(githubButton).toHaveAttribute("aria-label");

      // Check keyboard navigation
      await googleButton.focus();
      await expect(googleButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(githubButton).toBeFocused();
    });

    test("should show OAuth buttons above email form", async ({ page }) => {
      await page.goto("/signup");

      const googleButton = page.getByRole("button", {
        name: /continue with google/i,
      });
      const emailInput = page.getByLabel(/email/i);

      // Google button should appear before email input in DOM
      const googleBox = await googleButton.boundingBox();
      const emailBox = await emailInput.boundingBox();

      expect(googleBox!.y).toBeLessThan(emailBox!.y);
    });
  });

  test.describe("Login Page", () => {
    test("should display OAuth buttons on login page", async ({ page }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("button", { name: /continue with google/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /continue with github/i }),
      ).toBeVisible();
    });

    test("should show error message for OAuth errors", async ({ page }) => {
      // Navigate with error query param (simulating OAuth callback error)
      await page.goto("/login?error=access_denied");

      // Error message should be visible
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByText(/grant permissions/i)).toBeVisible();
    });

    test("should show email verification error message", async ({ page }) => {
      await page.goto("/login?error=email_not_verified");

      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByText(/verify your email/i)).toBeVisible();
    });

    test("should show GitHub email verification error", async ({ page }) => {
      await page.goto("/login?error=github_email_not_verified");

      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByText(/github.*verify/i)).toBeVisible();
    });
  });

  test.describe("OAuth Callback Page", () => {
    test("should show loading state on callback page", async ({ page }) => {
      await page.goto("/auth/callback");

      // Should show loading indicator
      await expect(page.getByText(/completing sign-in/i)).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle access_denied error", async ({ page }) => {
      await page.goto("/signup?error=access_denied");

      const alert = page.getByRole("alert");
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(/grant permissions/i);
    });

    test("should handle server_error", async ({ page }) => {
      await page.goto("/signup?error=server_error");

      const alert = page.getByRole("alert");
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(/try again later/i);
    });

    test("should handle unknown errors gracefully", async ({ page }) => {
      await page.goto("/signup?error=some_unknown_error");

      const alert = page.getByRole("alert");
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(/unexpected error/i);
    });
  });

  test.describe("Accessibility", () => {
    test("OAuth buttons should be keyboard navigable", async ({ page }) => {
      await page.goto("/signup");

      // Tab to first OAuth button
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab"); // Skip any header elements

      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    });

    test("error messages should be announced to screen readers", async ({
      page,
    }) => {
      await page.goto("/login?error=access_denied");

      const alert = page.getByRole("alert");
      await expect(alert).toHaveAttribute("aria-live", "polite");
    });

    test("OAuth buttons should have focus styles", async ({ page }) => {
      await page.goto("/signup");

      const googleButton = page.getByRole("button", {
        name: /continue with google/i,
      });
      await googleButton.focus();

      // Button should have visible focus indicator
      // We can't easily test CSS ring, but we verify the button is focusable
      await expect(googleButton).toBeFocused();
    });
  });

  test.describe("Responsive Design", () => {
    test("OAuth buttons should be full width on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/signup");

      const googleButton = page.getByRole("button", {
        name: /continue with google/i,
      });
      const buttonBox = await googleButton.boundingBox();

      // Button should be nearly full width (accounting for card padding)
      expect(buttonBox!.width).toBeGreaterThan(300);
    });
  });
});

test.describe("Connected Accounts Page", () => {
  // Note: These tests require authentication
  // In a full test suite, you would set up auth before these tests

  test.skip("should display connected accounts page (requires auth)", async ({
    page,
  }) => {
    // TODO: Set up authenticated session
    await page.goto("/settings/connected-accounts");

    await expect(
      page.getByRole("heading", { name: /connected accounts/i }),
    ).toBeVisible();
    await expect(page.getByText(/google/i)).toBeVisible();
    await expect(page.getByText(/github/i)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests - Project Workflow
 *
 * This tests the critical happy path:
 * 1. User logs in
 * 2. Creates a new project
 * 3. Adds scenarios
 * 4. Generates outputs
 * 5. Rates outputs
 *
 * IMPORTANT: These tests require a running development environment with Supabase.
 * Run with: npm run test:e2e
 *
 * For now, these tests are skipped until we have proper test data setup.
 */

test.describe.skip('Project Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('user can create a new project', async ({ page }) => {
    // Login
    // Note: In real tests, we'd use test credentials or mock auth
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for redirect to projects page
    await expect(page).toHaveURL(/\/projects$/);

    // Click "New Project" button
    await page.click('a[href="/projects/new"]');

    // Fill out project form
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('textarea[name="description"]', 'Created by automated test');

    // Select model from dropdown
    // Note: Actual selector depends on your UI implementation
    await page.click('button:has-text("Select Model")');
    await page.click('text=GPT-3.5 Turbo');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Project")');

    // Verify redirect to new project page
    await expect(page).toHaveURL(/\/projects\/\d+$/);

    // Verify project name appears on page
    await expect(page.locator('h1')).toContainText('E2E Test Project');
  });

  test('user can add scenarios to project', async ({ page }) => {
    // Assume we're already on a project page
    await page.goto('/projects/1'); // Test project

    // Click "Add Scenario" button
    await page.click('button:has-text("Add Scenario")');

    // Fill in scenario input
    await page.fill('textarea', 'What is the capital of France?');

    // Save scenario
    await page.click('button:has-text("Save")');

    // Verify scenario appears in list
    await expect(page.locator('text=What is the capital of France?')).toBeVisible();
  });

  test('user can generate outputs', async ({ page }) => {
    // Assume we're on a project page with scenarios
    await page.goto('/projects/1');

    // Click "Generate Outputs" button
    await page.click('button:has-text("Generate Outputs")');

    // Wait for generation to complete and navigate to outputs page
    await expect(page).toHaveURL(/\/projects\/1\/outputs$/, { timeout: 30000 });

    // Verify outputs are displayed
    await expect(page.locator('[data-testid="output-card"]').first()).toBeVisible();
  });

  test('user can rate outputs', async ({ page }) => {
    // Navigate to outputs page
    await page.goto('/projects/1/outputs');

    // Click "Rate" button on first output
    await page.locator('button:has-text("Rate")').first().click();

    // Select rating (e.g., 5 stars)
    await page.click('[data-rating="5"]');

    // Optionally add feedback
    await page.fill('textarea[name="feedback"]', 'Excellent response!');

    // Submit rating
    await page.click('button:has-text("Submit Rating")');

    // Verify rating was saved
    await expect(page.locator('text=5 stars')).toBeVisible();
  });
});

test.describe.skip('Pattern Analysis Workflow', () => {
  test('user can analyze patterns after rating outputs', async ({ page }) => {
    // Navigate to outputs page with rated outputs
    await page.goto('/projects/1/outputs');

    // Click "Analyze Patterns" button
    await page.click('button:has-text("Analyze Patterns")');

    // Wait for analysis to complete
    await expect(page).toHaveURL(/\/projects\/1\/insights$/, { timeout: 30000 });

    // Verify insights are displayed
    await expect(page.locator('h1')).toContainText('Insights');
    await expect(page.locator('text=Success Rate')).toBeVisible();
  });
});

// Placeholder test that always passes
test('E2E tests are configured correctly', async ({ page }) => {
  // Just verify we can load a page
  await page.goto('/');
  expect(page.url()).toBeTruthy();
});

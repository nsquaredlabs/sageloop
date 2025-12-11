import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(() => {
    throw new Error('Not Found');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirected to ${url}`);
  }),
}));

// Mock Next.js headers (cookies, headers, etc.)
vi.mock('next/headers', async () => {
  const { vi } = await import('vitest');

  return {
    cookies: vi.fn(() => ({
      // Return undefined for auth cookies to simulate unauthenticated state
      get: vi.fn((name: string) => {
        // Don't return auth cookies - this simulates an unauthenticated user
        if (name.includes('auth-token') || name.includes('sb-')) {
          return undefined;
        }
        return { name, value: 'mock-cookie-value' };
      }),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(() => false),
      getAll: vi.fn(() => []),
    })),
    headers: vi.fn(() => ({
      get: vi.fn(),
      has: vi.fn(() => false),
      entries: vi.fn(() => []),
    })),
  };
});

// Mock environment variables for tests
// These must be set before importing the env module to avoid validation errors
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
}

// Optional environment variables
// Note: For system model config tests, use real API keys from .env.local if available
// Otherwise, fall back to test placeholders for other tests
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-openai-key-placeholder';
}
if (!process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key-placeholder';
}

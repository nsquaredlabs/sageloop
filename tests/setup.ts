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
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

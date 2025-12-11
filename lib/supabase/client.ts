import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

// Browser client for client components
export function createClient() {
  return createBrowserClient<Database>(
    env.supabase.url,
    env.supabase.anonKey
  );
}

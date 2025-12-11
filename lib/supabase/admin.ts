import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

// Admin client - ONLY use for system operations, not user queries
export const supabaseAdmin = createSupabaseClient<Database>(
  env.supabase.url,
  env.supabase.serviceRoleKey
);

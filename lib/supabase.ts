// Re-export Supabase clients from their respective modules
// This allows for tree-shaking and prevents server-only code from being bundled in client components

export { createClient } from './supabase/client';
export { createServerClient } from './supabase/server';
export { supabaseAdmin } from './supabase/admin';

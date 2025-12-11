/**
 * Environment variable validation and type-safe access
 *
 * This module validates required environment variables on module load
 * and provides type-safe access throughout the application.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
] as const;

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  // Check required environment variables
  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nCheck your .env.local file.`
    );
  }

  // Warn about missing optional environment variables
  const missingOptional = optionalEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Optional environment variables not set:\n${missingOptional.join('\n')}\nSome features may use system fallback keys.`
    );
  }
}

/**
 * Type-safe environment variable access
 */
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * OAuth Audit Logging
 *
 * Logs all OAuth authentication events for security monitoring.
 * Tracks successful and failed OAuth attempts, account linking,
 * and provider disconnections.
 *
 * Events are logged to the security_audit_logs table for:
 * - Security investigations
 * - Anomaly detection
 * - GDPR compliance
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OAuthProvider } from "@/lib/auth/oauth";

/**
 * OAuth event types for audit logging
 */
export type OAuthEventType =
  | "oauth_initiated"
  | "oauth_success"
  | "oauth_failed"
  | "account_linked"
  | "account_unlinked";

/**
 * OAuth audit log entry
 */
export interface OAuthAuditLog {
  user_id?: string;
  event_type: OAuthEventType;
  provider: OAuthProvider;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an OAuth event to the security audit log
 *
 * @param supabase - Supabase client (admin or server client)
 * @param log - OAuth audit log entry
 */
export async function logOAuthEvent(
  supabase: SupabaseClient,
  log: OAuthAuditLog,
): Promise<void> {
  try {
    const { error } = await supabase.from("security_audit_logs").insert({
      user_id: log.user_id || null,
      event_type: log.event_type,
      provider: log.provider,
      metadata: {
        email: log.email,
        error: log.error_message,
        ...log.metadata,
      },
      ip_address: log.ip_address,
      user_agent: log.user_agent,
    });

    if (error) {
      console.error("[OAUTH_AUDIT] Failed to log OAuth event:", error);
    }
  } catch (error) {
    // Don't throw - audit logging should not break the auth flow
    console.error("[OAUTH_AUDIT] Exception logging OAuth event:", error);
  }

  // Also log to application logs for immediate visibility
  const logLevel = log.event_type === "oauth_failed" ? "warn" : "info";
  console[logLevel](`[OAUTH_AUDIT] ${log.event_type}`, {
    provider: log.provider,
    user_id: log.user_id,
    email: log.email,
    error: log.error_message,
  });
}

/**
 * Logs a successful OAuth authentication
 */
export async function logOAuthSuccess(
  supabase: SupabaseClient,
  params: {
    userId: string;
    provider: OAuthProvider;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    isNewUser?: boolean;
    linkedToExisting?: boolean;
  },
): Promise<void> {
  await logOAuthEvent(supabase, {
    user_id: params.userId,
    event_type: "oauth_success",
    provider: params.provider,
    email: params.email,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    metadata: {
      is_new_user: params.isNewUser,
      linked_to_existing_account: params.linkedToExisting,
    },
  });

  // If this was an account link, also log that specifically
  if (params.linkedToExisting) {
    await logOAuthEvent(supabase, {
      user_id: params.userId,
      event_type: "account_linked",
      provider: params.provider,
      email: params.email,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });
  }
}

/**
 * Logs a failed OAuth authentication
 */
export async function logOAuthFailure(
  supabase: SupabaseClient,
  params: {
    provider: OAuthProvider;
    errorCode: string;
    errorDescription?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
  },
): Promise<void> {
  await logOAuthEvent(supabase, {
    user_id: params.userId,
    event_type: "oauth_failed",
    provider: params.provider,
    email: params.email,
    error_message: `${params.errorCode}: ${params.errorDescription || "Unknown error"}`,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    metadata: {
      error_code: params.errorCode,
      error_description: params.errorDescription,
    },
  });
}

/**
 * Logs an OAuth provider disconnect
 */
export async function logOAuthDisconnect(
  supabase: SupabaseClient,
  params: {
    userId: string;
    provider: OAuthProvider;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  await logOAuthEvent(supabase, {
    user_id: params.userId,
    event_type: "account_unlinked",
    provider: params.provider,
    email: params.email,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });
}

/**
 * Gets recent OAuth events for a user (for security dashboard)
 *
 * @param supabase - Supabase client
 * @param userId - User ID to query
 * @param limit - Maximum number of events to return
 * @returns Array of OAuth events
 */
export async function getRecentOAuthEvents(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10,
): Promise<
  Array<{
    event_type: OAuthEventType;
    provider: OAuthProvider;
    created_at: string;
    metadata: Record<string, unknown>;
  }>
> {
  const { data, error } = await supabase
    .from("security_audit_logs")
    .select("event_type, provider, created_at, metadata")
    .eq("user_id", userId)
    .in("event_type", [
      "oauth_initiated",
      "oauth_success",
      "oauth_failed",
      "account_linked",
      "account_unlinked",
    ])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[OAUTH_AUDIT] Failed to fetch recent events:", error);
    return [];
  }

  return (data || []) as Array<{
    event_type: OAuthEventType;
    provider: OAuthProvider;
    created_at: string;
    metadata: Record<string, unknown>;
  }>;
}

/**
 * Checks for suspicious OAuth activity patterns
 *
 * Flags:
 * - Multiple failed attempts in short time
 * - OAuth attempts from multiple IPs
 * - Rapid provider switching
 *
 * @param supabase - Supabase client
 * @param ipAddress - IP address to check
 * @returns Whether suspicious activity is detected
 */
export async function detectSuspiciousOAuthActivity(
  supabase: SupabaseClient,
  ipAddress: string,
): Promise<{ isSuspicious: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  try {
    // Check for many failed attempts from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentFailures, error } = await supabase
      .from("security_audit_logs")
      .select("*")
      .eq("ip_address", ipAddress)
      .eq("event_type", "oauth_failed")
      .gte("created_at", oneHourAgo);

    if (error) {
      console.error("[OAUTH_AUDIT] Error checking suspicious activity:", error);
      return { isSuspicious: false, reasons: [] };
    }

    // Flag if more than 5 failed attempts in an hour
    if (recentFailures && recentFailures.length >= 5) {
      reasons.push(
        `${recentFailures.length} failed OAuth attempts in the last hour`,
      );
    }

    // Check for rapid-fire attempts (potential bot)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: veryRecent } = await supabase
      .from("security_audit_logs")
      .select("*")
      .eq("ip_address", ipAddress)
      .in("event_type", ["oauth_initiated", "oauth_success", "oauth_failed"])
      .gte("created_at", fiveMinutesAgo);

    // More than 10 OAuth events in 5 minutes is suspicious
    if (veryRecent && veryRecent.length >= 10) {
      reasons.push(
        `${veryRecent.length} OAuth attempts in 5 minutes (possible bot)`,
      );
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  } catch (error) {
    console.error(
      "[OAUTH_AUDIT] Exception in suspicious activity check:",
      error,
    );
    return { isSuspicious: false, reasons: [] };
  }
}

/**
 * Security Audit Logging
 *
 * Logs security-relevant events for monitoring and anomaly detection.
 * Tracks prompt injection attempts, validation failures, and suspicious patterns.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PromptValidationResult } from "./prompt-validation";
import { hashPrompt } from "./prompt-validation";

export interface AuditLogEntry {
  user_id: string;
  event_type: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface PromptAuditContext {
  user_id: string;
  project_id?: number;
  operation:
    | "create_project"
    | "update_project"
    | "generate_outputs"
    | "extract_patterns"
    | "integrate_fixes";
  prompt: string;
  validation_result: PromptValidationResult;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Logs a security audit event to the database
 *
 * @param supabase - Supabase client (should have service role for audit logging)
 * @param entry - Audit log entry to record
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  entry: AuditLogEntry,
): Promise<void> {
  try {
    const { error } = await supabase.from("security_audit_logs").insert({
      user_id: entry.user_id,
      event_type: entry.event_type,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
    });

    if (error) {
      console.error("[AUDIT] Failed to log security event:", error);
    }
  } catch (error) {
    console.error("[AUDIT] Exception logging security event:", error);
  }
}

/**
 * Logs a prompt operation with validation results
 *
 * @param supabase - Supabase client
 * @param context - Prompt audit context including validation results
 */
export async function auditPromptOperation(
  supabase: SupabaseClient,
  context: PromptAuditContext,
): Promise<void> {
  const promptHash = hashPrompt(context.prompt);

  await logSecurityEvent(supabase, {
    user_id: context.user_id,
    event_type: `prompt_${context.operation}`,
    metadata: {
      project_id: context.project_id,
      prompt_hash: promptHash,
      prompt_length: context.prompt.length,
      validation_flags: context.validation_result.flags,
      risk_level: context.validation_result.risk,
      is_valid: context.validation_result.isValid,
    },
    ip_address: context.ip_address,
    user_agent: context.user_agent,
  });

  // Also log high-risk attempts separately for immediate alerting
  if (context.validation_result.risk === "high") {
    console.error("[SECURITY ALERT] High-risk prompt detected:", {
      user_id: context.user_id,
      project_id: context.project_id,
      operation: context.operation,
      flags: context.validation_result.flags,
      prompt_hash: promptHash,
    });

    await logSecurityEvent(supabase, {
      user_id: context.user_id,
      event_type: "high_risk_prompt_detected",
      metadata: {
        project_id: context.project_id,
        operation: context.operation,
        prompt_hash: promptHash,
        flags: context.validation_result.flags,
      },
      ip_address: context.ip_address,
      user_agent: context.user_agent,
    });
  }
}

/**
 * Detects suspicious patterns in user's prompt history
 *
 * Analyzes recent audit logs to identify:
 * - Multiple high-risk attempts
 * - Rapid-fire requests (bot behavior)
 * - Repetitive identical prompts (testing attack patterns)
 *
 * @param supabase - Supabase client
 * @param userId - User ID to analyze
 * @returns Detection result with reasons
 */
export async function detectAnomalousPromptBehavior(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ isSuspicious: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  try {
    // Get user's recent prompt operations (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentLogs, error } = await supabase
      .from("security_audit_logs")
      .select("*")
      .eq("user_id", userId)
      .like("event_type", "prompt_%")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AUDIT] Error fetching audit logs:", error);
      return { isSuspicious: false, reasons: [] };
    }

    if (!recentLogs || recentLogs.length === 0) {
      return { isSuspicious: false, reasons: [] };
    }

    // Check for multiple high-risk attempts
    const highRiskCount = recentLogs.filter(
      (log) => log.metadata?.risk_level === "high",
    ).length;

    if (highRiskCount >= 3) {
      reasons.push(`${highRiskCount} high-risk prompts in 24 hours`);
    }

    // Check for rapid-fire attempts (bot behavior)
    const timestamps = recentLogs.map((log) =>
      new Date(log.created_at).getTime(),
    );
    let rapidFireCount = 0;

    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i - 1] - timestamps[i] < 1000) {
        // Less than 1 second apart
        rapidFireCount++;
      }
    }

    if (rapidFireCount >= 5) {
      reasons.push(`${rapidFireCount} rapid-fire requests (possible bot)`);
    }

    // Check for repetitive identical prompts (testing attack patterns)
    const hashes = recentLogs
      .map((log) => log.metadata?.prompt_hash)
      .filter(Boolean);

    const uniqueHashes = new Set(hashes);

    if (hashes.length >= 10 && uniqueHashes.size <= 3) {
      reasons.push(
        `Repetitive identical prompts (${hashes.length} attempts, ${uniqueHashes.size} unique)`,
      );
    }

    // Check for validation failures
    const failedValidations = recentLogs.filter(
      (log) => log.metadata?.is_valid === false,
    ).length;

    if (failedValidations >= 5) {
      reasons.push(`${failedValidations} validation failures in 24 hours`);
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  } catch (error) {
    console.error("[AUDIT] Exception detecting anomalous behavior:", error);
    return { isSuspicious: false, reasons: [] };
  }
}

/**
 * Gets client IP address from request headers
 *
 * Checks common proxy headers (Vercel, Cloudflare, etc.)
 *
 * @param request - Next.js request object
 * @returns IP address or undefined
 */
export function getClientIp(request: Request): string | undefined {
  // Check Vercel/Cloudflare headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Gets client user agent from request headers
 *
 * @param request - Next.js request object
 * @returns User agent or undefined
 */
export function getClientUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}

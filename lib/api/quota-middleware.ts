/**
 * Quota Enforcement Middleware
 *
 * Provides functions to check and enforce quota limits for AI output generation.
 * Used before generating outputs to ensure users haven't exceeded their plan limits.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { QuotaExceededError } from './errors';
import { getModelTier, isModelAllowedForPlan } from '@/lib/ai/model-tiers';
import type { WorkbenchSubscription } from '@/types/database';
import type { ModelTier } from '@/lib/ai/model-tiers';

/**
 * Check if workbench has quota available for the given model
 * Throws QuotaExceededError if quota is exhausted or model not allowed
 *
 * @param supabase - Authenticated Supabase client
 * @param workbenchId - UUID of the workbench
 * @param modelName - Name of the model to use (e.g., 'gpt-5-nano')
 * @param count - Number of outputs to generate (default: 1)
 * @returns Subscription details if quota is available
 * @throws QuotaExceededError if quota exceeded or model not allowed
 *
 * @example
 * try {
 *   const subscription = await checkQuotaAvailable(supabase, workbenchId, 'gpt-5-nano', 5);
 *   // Proceed with generation
 * } catch (error) {
 *   if (error instanceof QuotaExceededError) {
 *     // Handle quota exceeded
 *   }
 * }
 */
export async function checkQuotaAvailable(
  supabase: SupabaseClient,
  workbenchId: string,
  modelName: string,
  count: number = 1
): Promise<WorkbenchSubscription> {
  // Get workbench subscription with limits
  const { data: subscription, error } = await supabase.rpc('get_workbench_subscription', {
    workbench_uuid: workbenchId,
  });

  if (error) {
    console.error('Error fetching workbench subscription:', error);
    throw new Error('Failed to check quota');
  }

  if (!subscription || subscription.length === 0) {
    throw new Error('No active subscription found for workbench');
  }

  const sub = subscription[0] as WorkbenchSubscription;

  // Check if model is allowed for this plan
  const planId = sub.plan_id as 'free' | 'pro' | 'team' | 'enterprise';
  if (!isModelAllowedForPlan(modelName, planId)) {
    const modelTier = getModelTier(modelName);
    throw new QuotaExceededError(
      `Model ${modelName} is not available on ${sub.plan_id} plan. Upgrade to use ${modelTier} tier models.`,
      {
        used: 0,
        limit: 0,
        resetDate: sub.current_period_end,
      }
    );
  }

  // Check quota based on model tier
  const modelTier = getModelTier(modelName);

  if (modelTier === 'free' || modelTier === 'standard') {
    // Check standard quota
    const remaining = sub.standard_outputs_limit - sub.standard_outputs_used;
    if (remaining < count) {
      throw new QuotaExceededError(
        `You've used ${sub.standard_outputs_used} of ${sub.standard_outputs_limit} outputs this month. Upgrade for higher limits.`,
        {
          used: sub.standard_outputs_used,
          limit: sub.standard_outputs_limit,
          resetDate: sub.current_period_end,
        }
      );
    }
  } else if (modelTier === 'premium') {
    // Check premium quota
    const remaining = sub.premium_outputs_limit - sub.premium_outputs_used;
    if (remaining < count) {
      throw new QuotaExceededError(
        `You've used ${sub.premium_outputs_used} of ${sub.premium_outputs_limit} premium outputs this month. Upgrade for higher limits.`,
        {
          used: sub.premium_outputs_used,
          limit: sub.premium_outputs_limit,
          resetDate: sub.current_period_end,
        }
      );
    }
  }
  // Enterprise tier has no limits (BYOK)

  return sub;
}

/**
 * Increment usage counter after successful generation
 * Logs usage event for analytics
 *
 * @param supabase - Authenticated Supabase client
 * @param workbenchId - UUID of the workbench
 * @param modelName - Name of the model used
 * @param count - Number of outputs generated (default: 1)
 * @param inputTokens - Optional input token count
 * @param outputTokens - Optional output token count
 * @param projectId - Optional project ID for tracking
 *
 * @example
 * await incrementUsage(
 *   supabase,
 *   workbenchId,
 *   'gpt-5-nano',
 *   5,
 *   1234,
 *   5678,
 *   projectId
 * );
 */
export async function incrementUsage(
  supabase: SupabaseClient,
  workbenchId: string,
  modelName: string,
  count: number = 1,
  inputTokens?: number,
  outputTokens?: number,
  projectId?: number
): Promise<void> {
  const modelTier = getModelTier(modelName);

  const { error } = await supabase.rpc('increment_usage', {
    workbench_uuid: workbenchId,
    model_tier: modelTier,
    model_name: modelName,
    count,
    input_tokens: inputTokens ?? null,
    output_tokens: outputTokens ?? null,
    project_id: projectId ?? null,
  });

  if (error) {
    console.error('Error incrementing usage:', error);
    // Don't throw - we don't want to fail generation if usage tracking fails
    // But log it for monitoring
  }
}

/**
 * Get usage headers to include in API responses
 * Provides client with quota information
 *
 * @param subscription - Subscription details
 * @param modelTier - Model tier being used
 * @returns Headers object with quota information
 *
 * @example
 * const headers = getUsageHeaders(subscription, 'free');
 * return NextResponse.json({ data }, { headers });
 */
export function getUsageHeaders(
  subscription: WorkbenchSubscription,
  modelTier: ModelTier
): Record<string, string> {
  if (modelTier === 'free' || modelTier === 'standard') {
    return {
      'X-Quota-Used': subscription.standard_outputs_used.toString(),
      'X-Quota-Limit': subscription.standard_outputs_limit.toString(),
      'X-Quota-Remaining': (
        subscription.standard_outputs_limit - subscription.standard_outputs_used
      ).toString(),
      'X-Quota-Reset-Date': subscription.current_period_end,
    };
  } else if (modelTier === 'premium') {
    return {
      'X-Quota-Used': subscription.premium_outputs_used.toString(),
      'X-Quota-Limit': subscription.premium_outputs_limit.toString(),
      'X-Quota-Remaining': (
        subscription.premium_outputs_limit - subscription.premium_outputs_used
      ).toString(),
      'X-Quota-Reset-Date': subscription.current_period_end,
    };
  }

  // Enterprise has no limits
  return {
    'X-Quota-Limit': 'unlimited',
    'X-Quota-Reset-Date': subscription.current_period_end,
  };
}

/**
 * Unit tests for quota middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkQuotaAvailable, incrementUsage, getUsageHeaders } from '@/lib/api/quota-middleware';
import { QuotaExceededError } from '@/lib/api/errors';
import type { WorkbenchSubscription } from '@/types/database';

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    rpc: vi.fn(),
  } as any;
};

describe('checkQuotaAvailable', () => {
  let supabase: any;

  beforeEach(() => {
    supabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should allow generation when free tier has quota remaining', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'free',
      plan_name: 'free',
      status: 'active',
      standard_outputs_used: 50,
      standard_outputs_limit: 100,
      premium_outputs_used: 0,
      premium_outputs_limit: 0,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: false,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    const result = await checkQuotaAvailable(
      supabase,
      'workbench-123',
      'gpt-5-nano',
      10
    );

    expect(result).toEqual(mockSubscription);
    expect(supabase.rpc).toHaveBeenCalledWith('get_workbench_subscription', {
      workbench_uuid: 'workbench-123',
    });
  });

  it('should throw QuotaExceededError when free tier quota exhausted', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'free',
      plan_name: 'free',
      status: 'active',
      standard_outputs_used: 100,
      standard_outputs_limit: 100,
      premium_outputs_used: 0,
      premium_outputs_limit: 0,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: false,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    await expect(
      checkQuotaAvailable(supabase, 'workbench-123', 'gpt-5-nano', 1)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('should throw QuotaExceededError when trying to use premium model on free tier', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'free',
      plan_name: 'free',
      status: 'active',
      standard_outputs_used: 0,
      standard_outputs_limit: 100,
      premium_outputs_used: 0,
      premium_outputs_limit: 0,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: false,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    await expect(
      checkQuotaAvailable(supabase, 'workbench-123', 'gpt-5.1', 1)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('should allow generation when pro tier has standard quota remaining', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'pro',
      plan_name: 'pro',
      status: 'active',
      standard_outputs_used: 500,
      standard_outputs_limit: 2000,
      premium_outputs_used: 100,
      premium_outputs_limit: 500,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: true,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    const result = await checkQuotaAvailable(
      supabase,
      'workbench-123',
      'gpt-5-mini',
      100
    );

    expect(result).toEqual(mockSubscription);
  });

  it('should allow generation when pro tier has premium quota remaining', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'pro',
      plan_name: 'pro',
      status: 'active',
      standard_outputs_used: 1000,
      standard_outputs_limit: 2000,
      premium_outputs_used: 100,
      premium_outputs_limit: 500,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: true,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    const result = await checkQuotaAvailable(
      supabase,
      'workbench-123',
      'gpt-5.1',
      50
    );

    expect(result).toEqual(mockSubscription);
  });

  it('should throw QuotaExceededError when pro tier premium quota exhausted', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'pro',
      plan_name: 'pro',
      status: 'active',
      standard_outputs_used: 1000,
      standard_outputs_limit: 2000,
      premium_outputs_used: 500,
      premium_outputs_limit: 500,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: true,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    await expect(
      checkQuotaAvailable(supabase, 'workbench-123', 'gpt-5.1', 1)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('should always allow enterprise tier (unlimited)', async () => {
    const mockSubscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'enterprise',
      plan_name: 'enterprise',
      status: 'active',
      standard_outputs_used: 15000,
      standard_outputs_limit: 20000,
      premium_outputs_used: 4000,
      premium_outputs_limit: 5000,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: true,
    };

    supabase.rpc.mockResolvedValueOnce({
      data: [mockSubscription],
      error: null,
    });

    const result = await checkQuotaAvailable(
      supabase,
      'workbench-123',
      'claude-opus-4-5',
      1000
    );

    expect(result).toEqual(mockSubscription);
  });

  it('should throw error when no subscription found', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await expect(
      checkQuotaAvailable(supabase, 'workbench-123', 'gpt-5-nano', 1)
    ).rejects.toThrow('No active subscription found');
  });

  it('should throw error when RPC fails', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    await expect(
      checkQuotaAvailable(supabase, 'workbench-123', 'gpt-5-nano', 1)
    ).rejects.toThrow('Failed to check quota');
  });
});

describe('incrementUsage', () => {
  let supabase: any;

  beforeEach(() => {
    supabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should increment usage for free tier model', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await incrementUsage(
      supabase,
      'workbench-123',
      'gpt-5-nano',
      5,
      1234,
      5678,
      1
    );

    expect(supabase.rpc).toHaveBeenCalledWith('increment_usage', {
      workbench_uuid: 'workbench-123',
      model_tier: 'free',
      model_name: 'gpt-5-nano',
      count: 5,
      input_tokens: 1234,
      output_tokens: 5678,
      project_id: 1,
    });
  });

  it('should increment usage for premium tier model', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await incrementUsage(
      supabase,
      'workbench-123',
      'gpt-5.1',
      10,
      2000,
      8000,
      2
    );

    expect(supabase.rpc).toHaveBeenCalledWith('increment_usage', {
      workbench_uuid: 'workbench-123',
      model_tier: 'premium',
      model_name: 'gpt-5.1',
      count: 10,
      input_tokens: 2000,
      output_tokens: 8000,
      project_id: 2,
    });
  });

  it('should not throw error when RPC fails (graceful degradation)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    // Should not throw
    await incrementUsage(
      supabase,
      'workbench-123',
      'gpt-5-nano',
      1
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle optional parameters', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await incrementUsage(
      supabase,
      'workbench-123',
      'gpt-5-nano',
      1
    );

    expect(supabase.rpc).toHaveBeenCalledWith('increment_usage', {
      workbench_uuid: 'workbench-123',
      model_tier: 'free',
      model_name: 'gpt-5-nano',
      count: 1,
      input_tokens: null,
      output_tokens: null,
      project_id: null,
    });
  });
});

describe('getUsageHeaders', () => {
  it('should return correct headers for free tier', () => {
    const subscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'free',
      plan_name: 'free',
      status: 'active',
      standard_outputs_used: 50,
      standard_outputs_limit: 100,
      premium_outputs_used: 0,
      premium_outputs_limit: 0,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: false,
    };

    const headers = getUsageHeaders(subscription, 'free');

    expect(headers).toEqual({
      'X-Quota-Used': '50',
      'X-Quota-Limit': '100',
      'X-Quota-Remaining': '50',
      'X-Quota-Reset-Date': '2025-01-01T00:00:00Z',
    });
  });

  it('should return correct headers for premium tier', () => {
    const subscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'pro',
      plan_name: 'pro',
      status: 'active',
      standard_outputs_used: 1000,
      standard_outputs_limit: 2000,
      premium_outputs_used: 200,
      premium_outputs_limit: 500,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: true,
    };

    const headers = getUsageHeaders(subscription, 'premium');

    expect(headers).toEqual({
      'X-Quota-Used': '200',
      'X-Quota-Limit': '500',
      'X-Quota-Remaining': '300',
      'X-Quota-Reset-Date': '2025-01-01T00:00:00Z',
    });
  });

  it('should return unlimited headers for enterprise tier', () => {
    const subscription: WorkbenchSubscription = {
      id: 'sub-123',
      plan_id: 'enterprise',
      plan_name: 'enterprise',
      status: 'active',
      standard_outputs_used: 15000,
      standard_outputs_limit: 20000,
      premium_outputs_used: 4000,
      premium_outputs_limit: 5000,
      current_period_end: '2025-01-01T00:00:00Z',
      allow_premium_models: true,
    };

    const headers = getUsageHeaders(subscription, 'enterprise');

    expect(headers).toEqual({
      'X-Quota-Limit': 'unlimited',
      'X-Quota-Reset-Date': '2025-01-01T00:00:00Z',
    });
  });
});

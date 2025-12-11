/**
 * Type-safe API client for making requests to the backend
 */

import type {
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectsResponse,
  CreateScenarioRequest,
  CreateScenarioResponse,
  GetScenariosResponse,
  GenerateOutputsResponse,
  RetestRequest,
  RetestResponse,
  ExtractResponse,
} from '@/types/api';

/**
 * Generic API client for making HTTP requests
 */
class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

const api = new ApiClient();

/**
 * Type-safe API methods for projects
 */
export const projectApi = {
  /**
   * Get all projects for the authenticated user
   */
  getAll: () => api.get<GetProjectsResponse>('/api/projects'),

  /**
   * Create a new project
   */
  create: (data: CreateProjectRequest) =>
    api.post<CreateProjectResponse>('/api/projects', data),

  /**
   * Generate outputs for all scenarios in a project
   */
  generateOutputs: (projectId: string) =>
    api.post<GenerateOutputsResponse>(`/api/projects/${projectId}/generate`),

  /**
   * Retest scenarios with a new system prompt
   */
  retest: (projectId: string, data: RetestRequest) =>
    api.post<RetestResponse>(`/api/projects/${projectId}/retest`, data),

  /**
   * Extract patterns from rated outputs
   */
  extractPatterns: (projectId: string) =>
    api.post<ExtractResponse>(`/api/projects/${projectId}/extract`),
};

/**
 * Type-safe API methods for scenarios
 */
export const scenarioApi = {
  /**
   * Get all scenarios for a project
   */
  getAll: (projectId: string) =>
    api.get<GetScenariosResponse>(`/api/projects/${projectId}/scenarios`),

  /**
   * Create a new scenario
   */
  create: (projectId: string, data: CreateScenarioRequest) =>
    api.post<CreateScenarioResponse>(`/api/projects/${projectId}/scenarios`, data),

  /**
   * Delete a scenario
   */
  delete: (projectId: string, scenarioId: string) =>
    api.delete(`/api/projects/${projectId}/scenarios/${scenarioId}`),
};

/**
 * Re-export the generic API client for custom requests
 */
export { api };

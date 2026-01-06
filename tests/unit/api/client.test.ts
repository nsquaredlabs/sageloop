import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { projectApi, scenarioApi } from "@/lib/api/client";
import type { CreateProjectRequest, RetestRequest } from "@/types/api";

describe("API Client", () => {
  // Mock fetch globally
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("projectApi", () => {
    describe("getAll", () => {
      it("should fetch all projects", async () => {
        const mockProjects = {
          data: [
            { id: 1, name: "Project 1", model_config: { model: "gpt-4" } },
            {
              id: 2,
              name: "Project 2",
              model_config: { model: "claude-opus-4" },
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockProjects,
        });

        const result = await projectApi.getAll();

        expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        expect(result).toEqual(mockProjects);
      });
    });

    describe("create", () => {
      it("should create a new project", async () => {
        const createRequest: CreateProjectRequest = {
          name: "New Project",
          description: "Test project",
          model_config: {
            model: "gpt-4",
          },
        };

        const mockResponse = {
          data: {
            id: 1,
            ...createRequest,
            workbench_id: "wb-123",
            created_by: "user-123",
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
            prompt_version: 1,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await projectApi.create(createRequest);

        expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(createRequest),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("generateOutputs", () => {
      it("should trigger output generation", async () => {
        const mockResponse = {
          success: true,
          generated: 5,
          total: 5,
          outputs: [],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await projectApi.generateOutputs("123");

        expect(mockFetch).toHaveBeenCalledWith("/api/projects/123/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("retest", () => {
      it("should retest scenarios with new prompt", async () => {
        const retestRequest: RetestRequest = {
          scenarioIds: [1, 2, 3],
          newSystemPrompt: "Updated prompt",
          improvementNote: "Fixed issue with dates",
        };

        const mockResponse = {
          success: true,
          version: 2,
          outputs: [],
          scenarios_retested: 3,
          prompt_diff: {
            old: "Old prompt",
            new: "Updated prompt",
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await projectApi.retest("123", retestRequest);

        expect(mockFetch).toHaveBeenCalledWith("/api/projects/123/retest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(retestRequest),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("extractPatterns", () => {
      it("should extract patterns from ratings", async () => {
        const mockResponse = {
          success: true,
          extraction: {
            id: 1,
            project_id: 123,
            criteria: {
              summary: "Test criteria",
            },
            confidence_score: 0.95,
            created_at: "2025-01-01T00:00:00Z",
          },
          metric: {
            id: 1,
            success_rate: 0.8,
            criteria_breakdown: {},
          },
          analyzed_outputs: 10,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await projectApi.extractPatterns("123");

        expect(mockFetch).toHaveBeenCalledWith("/api/projects/123/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("scenarioApi", () => {
    describe("getAll", () => {
      it("should fetch all scenarios for a project", async () => {
        const mockScenarios = {
          data: [
            { id: 1, project_id: 123, input_text: "Test input 1", order: 0 },
            { id: 2, project_id: 123, input_text: "Test input 2", order: 1 },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockScenarios,
        });

        const result = await scenarioApi.getAll("123");

        expect(mockFetch).toHaveBeenCalledWith("/api/projects/123/scenarios", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        expect(result).toEqual(mockScenarios);
      });
    });

    describe("create", () => {
      it("should create a new scenario", async () => {
        const createRequest = {
          input_text: "New test scenario",
        };

        const mockResponse = {
          data: {
            id: 1,
            project_id: 123,
            input_text: "New test scenario",
            order: 0,
            created_at: "2025-01-01T00:00:00Z",
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await scenarioApi.create("123", createRequest);

        expect(mockFetch).toHaveBeenCalledWith("/api/projects/123/scenarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(createRequest),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("delete", () => {
      it("should delete a scenario", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await scenarioApi.delete("123", "456");

        expect(mockFetch).toHaveBeenCalledWith(
          "/api/projects/123/scenarios/456",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error on HTTP 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Project not found" }),
      });

      await expect(projectApi.getAll()).rejects.toThrow("Project not found");
    });

    it("should throw error on HTTP 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      await expect(projectApi.getAll()).rejects.toThrow("Unauthorized");
    });

    it("should throw error with status code when no error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(projectApi.getAll()).rejects.toThrow("HTTP 500");
    });

    it("should handle JSON parse errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(projectApi.getAll()).rejects.toThrow("Request failed");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(projectApi.getAll()).rejects.toThrow("Network error");
    });
  });

  describe("Request Configuration", () => {
    it("should always include credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await projectApi.getAll();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should always set Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await projectApi.getAll();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });
  });
});

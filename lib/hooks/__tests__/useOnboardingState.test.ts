import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardingState } from "../useOnboardingState";
import { DEFAULT_MODEL_FOR_ONBOARDING } from "@/lib/ai/default-models";

// Mock sessionStorage
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear mock storage
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

  // Mock sessionStorage
  vi.stubGlobal("sessionStorage", {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    }),
  });
});

describe("useOnboardingState", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useOnboardingState());

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.projectId).toBeNull();
    expect(result.current.state.scenarios).toEqual([]);
    expect(result.current.state.isGenerating).toBe(false);
  });

  it("sets project data correctly", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setProjectData({
        name: "Test Project",
        description: "A test",
      });
    });

    expect(result.current.state.projectData.name).toBe("Test Project");
    expect(result.current.state.projectData.description).toBe("A test");
    // Other fields should remain default
    expect(result.current.state.projectData.model).toBe(
      DEFAULT_MODEL_FOR_ONBOARDING,
    );
  });

  it("moves to next step", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(2);

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(3);

    // Should not go beyond 3
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(3);
  });

  it("moves to previous step", () => {
    const { result } = renderHook(() => useOnboardingState());

    // First go to step 3
    act(() => {
      result.current.nextStep();
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(3);

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.currentStep).toBe(2);

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.currentStep).toBe(1);

    // Should not go below 1
    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.currentStep).toBe(1);
  });

  it("goes to specific step", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.goToStep(3);
    });

    expect(result.current.state.currentStep).toBe(3);

    act(() => {
      result.current.goToStep(1);
    });

    expect(result.current.state.currentStep).toBe(1);
  });

  it("sets project ID", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setProjectId("project-123");
    });

    expect(result.current.state.projectId).toBe("project-123");
  });

  it("sets scenarios", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setScenarios(["Scenario 1", "Scenario 2"]);
    });

    expect(result.current.state.scenarios).toEqual([
      "Scenario 1",
      "Scenario 2",
    ]);
  });

  it("sets generating state", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setGenerating(true);
    });

    expect(result.current.state.isGenerating).toBe(true);

    act(() => {
      result.current.setGenerating(false);
    });

    expect(result.current.state.isGenerating).toBe(false);
  });

  it("sets generation progress", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setGenerationProgress({ completed: 5, total: 10 });
    });

    expect(result.current.state.generationProgress).toEqual({
      completed: 5,
      total: 10,
    });
  });

  it("clears state completely", () => {
    const { result } = renderHook(() => useOnboardingState());

    // Set some state
    act(() => {
      result.current.setProjectData({ name: "Test" });
      result.current.setProjectId("123");
      result.current.setScenarios(["Scenario 1"]);
      result.current.nextStep();
    });

    // Clear state
    act(() => {
      result.current.clearState();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.projectId).toBeNull();
    expect(result.current.state.scenarios).toEqual([]);
    expect(result.current.state.projectData.name).toBe("");
  });

  it("resets project data without affecting step", () => {
    const { result } = renderHook(() => useOnboardingState());

    // Set some state
    act(() => {
      result.current.setProjectData({ name: "Test" });
      result.current.setProjectId("123");
      result.current.setScenarios(["Scenario 1"]);
      result.current.nextStep(); // Step 2
    });

    // Reset project data
    act(() => {
      result.current.resetProjectData();
    });

    // Step should remain
    expect(result.current.state.currentStep).toBe(2);
    // But project data should be cleared
    expect(result.current.state.projectId).toBeNull();
    expect(result.current.state.scenarios).toEqual([]);
    expect(result.current.state.projectData.name).toBe("");
  });

  it("persists state to sessionStorage", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setProjectData({ name: "Test Project" });
    });

    // Check that sessionStorage.setItem was called
    expect(sessionStorage.setItem).toHaveBeenCalled();

    // Check the stored value
    const storedValue = mockStorage["sageloop_onboarding_state"];
    expect(storedValue).toBeTruthy();

    const parsed = JSON.parse(storedValue);
    expect(parsed.projectData.name).toBe("Test Project");
  });

  it("restores state from sessionStorage", () => {
    // Pre-populate storage
    mockStorage["sageloop_onboarding_state"] = JSON.stringify({
      currentStep: 2,
      projectData: {
        name: "Stored Project",
        description: "",
        model: "gpt-3.5-turbo",
        systemPrompt: "",
        isExample: false,
      },
      scenarios: ["Stored Scenario"],
      projectId: "stored-id",
      isGenerating: false,
      generationProgress: { completed: 0, total: 0 },
    });

    const { result } = renderHook(() => useOnboardingState());

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.projectData.name).toBe("Stored Project");
    expect(result.current.state.scenarios).toEqual(["Stored Scenario"]);
    expect(result.current.state.projectId).toBe("stored-id");
  });

  it("removes state from sessionStorage on clear", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setProjectData({ name: "Test" });
    });

    act(() => {
      result.current.clearState();
    });

    expect(sessionStorage.removeItem).toHaveBeenCalledWith(
      "sageloop_onboarding_state",
    );
  });
});

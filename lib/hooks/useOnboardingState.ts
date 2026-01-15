"use client";

/**
 * Onboarding Wizard State Management Hook
 *
 * Manages wizard state with sessionStorage persistence.
 * State persists across page refreshes but clears on tab close.
 */

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_MODEL_FOR_ONBOARDING } from "@/lib/ai/default-models";

export type WizardStep = 1 | 2 | 3;

export interface ProjectData {
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  isExample: boolean;
}

export interface OnboardingWizardState {
  currentStep: WizardStep;
  projectData: ProjectData;
  scenarios: string[];
  projectId: string | null;
  isGenerating: boolean;
  generationProgress: {
    completed: number;
    total: number;
  };
}

const STORAGE_KEY = "sageloop_onboarding_state";

const defaultProjectData: ProjectData = {
  name: "",
  description: "",
  model: DEFAULT_MODEL_FOR_ONBOARDING,
  systemPrompt: "",
  isExample: true,
};

const defaultState: OnboardingWizardState = {
  currentStep: 1,
  projectData: defaultProjectData,
  scenarios: [],
  projectId: null,
  isGenerating: false,
  generationProgress: { completed: 0, total: 0 },
};

/**
 * Hook to manage onboarding wizard state with sessionStorage persistence
 */
export function useOnboardingState() {
  const [state, setState] = useState<OnboardingWizardState>(() => {
    // Initialize from sessionStorage if available (client-side only)
    if (typeof window === "undefined") {
      return defaultState;
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure currentStep is valid
        if (![1, 2, 3].includes(parsed.currentStep)) {
          parsed.currentStep = 1;
        }
        return { ...defaultState, ...parsed };
      }
    } catch {
      // Ignore parse errors, use default state
    }

    return defaultState;
  });

  // Persist to sessionStorage on state change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to persist onboarding state:", error);
    }
  }, [state]);

  // Update project data
  const setProjectData = useCallback((data: Partial<ProjectData>) => {
    setState((prev) => ({
      ...prev,
      projectData: { ...prev.projectData, ...data },
    }));
  }, []);

  // Update scenarios
  const setScenarios = useCallback((scenarios: string[]) => {
    setState((prev) => ({ ...prev, scenarios }));
  }, []);

  // Set project ID after creation
  const setProjectId = useCallback((projectId: string) => {
    setState((prev) => ({ ...prev, projectId }));
  }, []);

  // Move to next step
  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 3) as WizardStep,
    }));
  }, []);

  // Move to previous step
  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as WizardStep,
    }));
  }, []);

  // Go to specific step
  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Set generation state
  const setGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  // Update generation progress
  const setGenerationProgress = useCallback(
    (progress: { completed: number; total: number }) => {
      setState((prev) => ({ ...prev, generationProgress: progress }));
    },
    [],
  );

  // Clear state (called on completion or skip)
  const clearState = useCallback(() => {
    setState(defaultState);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear onboarding state:", error);
    }
  }, []);

  // Reset to defaults but keep on current step
  const resetProjectData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      projectData: defaultProjectData,
      scenarios: [],
      projectId: null,
    }));
  }, []);

  return {
    state,
    setState,
    setProjectData,
    setScenarios,
    setProjectId,
    nextStep,
    prevStep,
    goToStep,
    setGenerating,
    setGenerationProgress,
    clearState,
    resetProjectData,
  };
}

export type UseOnboardingState = ReturnType<typeof useOnboardingState>;

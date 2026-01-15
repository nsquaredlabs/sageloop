"use client";

import { useRouter } from "next/navigation";
import { useOnboardingState } from "@/lib/hooks/useOnboardingState";
import { getExampleProject } from "@/lib/onboarding/templates";
import { StepIndicator } from "./StepIndicator";
import { Step1ProjectSetup } from "./Step1ProjectSetup";
import { Step2AddScenarios } from "./Step2AddScenarios";
import { Step3Generate } from "./Step3Generate";
import type { SubscriptionPlan } from "@/lib/ai/default-models";

interface OnboardingWizardProps {
  userPlan: SubscriptionPlan;
}

export function OnboardingWizard({ userPlan }: OnboardingWizardProps) {
  const router = useRouter();
  const {
    state,
    setProjectData,
    setScenarios,
    setProjectId,
    nextStep,
    prevStep,
    setGenerating,
    setGenerationProgress,
    clearState,
  } = useOnboardingState();

  const exampleProject = getExampleProject();

  // Handle skip at any step
  const handleSkip = async () => {
    try {
      await fetch("/api/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: state.currentStep }),
      });
    } catch (error) {
      console.error("Error recording skip:", error);
    }

    clearState();
    router.push("/projects");
  };

  // Step 1 completion handler
  const handleStep1Continue = (projectId: string, scenarios: string[]) => {
    setProjectId(projectId);
    setScenarios(scenarios);
    nextStep();
  };

  // Step 2 completion handler
  const handleStep2Continue = () => {
    nextStep();
  };

  // Get display name for project
  const getProjectName = () => {
    if (state.projectData.isExample) {
      return exampleProject.name;
    }
    return state.projectData.name || "Your Project";
  };

  // Get model name for display
  const getModelName = () => {
    if (state.projectData.isExample) {
      return exampleProject.model_config.model;
    }
    return state.projectData.model;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome to Sageloop</h1>
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={state.isGenerating}
          >
            Skip onboarding
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={state.currentStep} />
        </div>

        {/* Step Content */}
        <div className="bg-card border rounded-lg p-6 sm:p-8">
          {state.currentStep === 1 && (
            <Step1ProjectSetup
              projectData={state.projectData}
              existingProjectId={state.projectId}
              existingScenarios={state.scenarios}
              onContinue={handleStep1Continue}
              onSkip={handleSkip}
              setProjectData={setProjectData}
              userPlan={userPlan}
            />
          )}

          {state.currentStep === 2 && state.projectId && (
            <Step2AddScenarios
              projectId={state.projectId}
              scenarios={state.scenarios}
              isExampleProject={state.projectData.isExample}
              onContinue={handleStep2Continue}
              onSkip={handleSkip}
              onBack={prevStep}
              setScenarios={setScenarios}
            />
          )}

          {state.currentStep === 3 && state.projectId && (
            <Step3Generate
              projectId={state.projectId}
              scenarioCount={state.scenarios.length}
              model={getModelName()}
              projectName={getProjectName()}
              onSkip={handleSkip}
              onBack={prevStep}
              setGenerating={setGenerating}
              setGenerationProgress={setGenerationProgress}
              isGenerating={state.isGenerating}
              generationProgress={state.generationProgress}
            />
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:support@sageloop.ai"
            className="text-primary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

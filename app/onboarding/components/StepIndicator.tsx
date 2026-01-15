"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { WizardStep } from "@/lib/hooks/useOnboardingState";

interface StepIndicatorProps {
  currentStep: WizardStep;
}

const STEP_LABELS = {
  1: "Create Your First Project",
  2: "Add Test Scenarios",
  3: "Generate Outputs",
} as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const progressValue = (currentStep / 3) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep} of 3
        </span>
        <span className="text-sm text-muted-foreground">
          {STEP_LABELS[currentStep]}
        </span>
      </div>
      <Progress value={progressValue} className="h-2" />

      {/* Step indicators */}
      <div className="flex justify-between mt-4">
        {([1, 2, 3] as const).map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step < currentStep && "bg-primary text-primary-foreground",
                step === currentStep &&
                  "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary",
                step > currentStep && "bg-muted text-muted-foreground",
              )}
            >
              {step < currentStep ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-1 hidden sm:block",
                step <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step === 1 && "Project"}
              {step === 2 && "Scenarios"}
              {step === 3 && "Generate"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

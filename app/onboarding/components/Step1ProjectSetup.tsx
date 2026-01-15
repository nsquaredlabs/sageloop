"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { validateSystemPrompt } from "@/lib/security/prompt-validation";
import { sanitize } from "@/lib/security/sanitize";
import {
  getExampleProject,
  SUPPORTED_MODELS,
} from "@/lib/onboarding/templates";
import { projectSetupSchema } from "@/lib/onboarding/validation";
import { ExampleProjectCard } from "./ExampleProjectCard";
import type {
  ProjectData,
  UseOnboardingState,
} from "@/lib/hooks/useOnboardingState";

interface Step1ProjectSetupProps {
  projectData: ProjectData;
  existingProjectId: string | null;
  existingScenarios: string[];
  onContinue: (projectId: string, scenarios: string[]) => void;
  onSkip: () => void;
  setProjectData: UseOnboardingState["setProjectData"];
}

export function Step1ProjectSetup({
  projectData,
  existingProjectId,
  existingScenarios,
  onContinue,
  onSkip,
  setProjectData,
}: Step1ProjectSetupProps) {
  const router = useRouter();
  const [useExample, setUseExample] = useState(projectData.isExample);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promptWarning, setPromptWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to prevent double submissions (survives re-renders and React StrictMode)
  const isSubmittingRef = useRef(false);

  const exampleProject = getExampleProject();

  const validateForm = (): boolean => {
    if (useExample) return true;

    // Clear previous errors
    setErrors({});
    setPromptWarning(null);

    // Validate with Zod schema
    const validation = projectSetupSchema.safeParse({
      name: projectData.name,
      description: projectData.description,
      model: projectData.model,
      systemPrompt: projectData.systemPrompt,
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    // Validate system prompt for security
    const promptValidation = validateSystemPrompt(projectData.systemPrompt);
    if (!promptValidation.isValid) {
      setErrors({
        systemPrompt: "System prompt contains potentially unsafe content",
      });
      return false;
    }

    if (promptValidation.risk === "medium") {
      setPromptWarning(
        "Warning: Your prompt contains some patterns that may be flagged. Consider reviewing it.",
      );
    }

    return true;
  };

  const handleContinue = async () => {
    // Prevent double submissions using ref (works even during React re-renders)
    if (isSubmittingRef.current) {
      return;
    }

    if (!validateForm()) return;

    // IDEMPOTENCY CHECK: If project already exists from previous attempt,
    // skip creation and just continue (handles back/forward navigation)
    if (existingProjectId) {
      // Use existing project - no need to create a new one
      onContinue(existingProjectId, existingScenarios);
      return;
    }

    // Set both ref and state - ref for immediate blocking, state for UI
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const projectPayload = useExample
        ? {
            name: exampleProject.name,
            description: exampleProject.description,
            model_config: exampleProject.model_config,
            is_onboarding_project: true,
            created_via_onboarding: true,
          }
        : {
            name: sanitize.plainText(projectData.name),
            description: projectData.description
              ? sanitize.plainText(projectData.description)
              : null,
            model_config: {
              model: projectData.model,
              system_prompt: projectData.systemPrompt,
            },
            is_onboarding_project: false,
            created_via_onboarding: true,
          };

      // Create project
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ form: errorData.error || "Failed to create project" });
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      const { data: project } = await response.json();

      // If using example project, also create scenarios
      if (useExample) {
        const scenariosPayload = {
          scenarios: exampleProject.example_scenarios.map((text) => ({
            input_text: text,
          })),
        };

        await fetch(`/api/projects/${project.id}/scenarios/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scenariosPayload),
        });

        // Update state and continue to step 2 with scenarios pre-loaded
        setProjectData({ isExample: true });
        onContinue(project.id, exampleProject.example_scenarios);
      } else {
        // Custom project - continue without scenarios
        setProjectData({ isExample: false });
        onContinue(project.id, []);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Template Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Choose how to start</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setUseExample(true);
              setProjectData({ isExample: true });
              setErrors({});
            }}
            className={cn(
              "p-6 border-2 rounded-lg text-left transition-colors",
              useExample
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div className="font-semibold mb-2">Start from Example</div>
            <div className="text-sm text-muted-foreground">
              Recommended for first-time users
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setUseExample(false);
              setProjectData({ isExample: false });
            }}
            className={cn(
              "p-6 border-2 rounded-lg text-left transition-colors",
              !useExample
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div className="font-semibold mb-2">Create from Scratch</div>
            <div className="text-sm text-muted-foreground">
              Best if you know what to test
            </div>
          </button>
        </div>
      </div>

      {/* Example Project Preview */}
      {useExample && <ExampleProjectCard template={exampleProject} />}

      {/* Custom Project Form */}
      {!useExample && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={projectData.name}
              onChange={(e) => setProjectData({ name: e.target.value })}
              placeholder="Customer Support Bot"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={projectData.description}
              onChange={(e) => setProjectData({ description: e.target.value })}
              placeholder="What are you testing?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">
              AI Model <span className="text-destructive">*</span>
            </Label>
            <Select
              value={projectData.model}
              onValueChange={(value) => setProjectData({ model: value })}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.model && (
              <p className="text-sm text-destructive">{errors.model}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">
              System Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="systemPrompt"
              value={projectData.systemPrompt}
              onChange={(e) => setProjectData({ systemPrompt: e.target.value })}
              placeholder="You are a helpful assistant..."
              rows={8}
              className="font-mono text-sm"
              aria-invalid={!!errors.systemPrompt}
              aria-describedby={
                errors.systemPrompt
                  ? "prompt-error"
                  : promptWarning
                    ? "prompt-warning"
                    : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              Paste your existing prompt or write a new one
            </p>
            {errors.systemPrompt && (
              <p id="prompt-error" className="text-sm text-destructive">
                {errors.systemPrompt}
              </p>
            )}
            {promptWarning && !errors.systemPrompt && (
              <p id="prompt-warning" className="text-sm text-yellow-600">
                {promptWarning}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form-level error */}
      {errors.form && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {errors.form}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/login")}
        >
          Back to Login
        </Button>
        <Button type="button" onClick={handleContinue} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Continue to Step 2"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sanitize } from "@/lib/security/sanitize";
import {
  parseBulkScenarios,
  validateBulkScenarios,
} from "@/lib/onboarding/validation";
import type { UseOnboardingState } from "@/lib/hooks/useOnboardingState";

interface Step2AddScenariosProps {
  projectId: string;
  scenarios: string[];
  isExampleProject: boolean;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  setScenarios: UseOnboardingState["setScenarios"];
}

type InputMode = "bulk" | "individual";

export function Step2AddScenarios({
  projectId,
  scenarios,
  isExampleProject,
  onContinue,
  onSkip,
  onBack,
  setScenarios,
}: Step2AddScenariosProps) {
  const [mode, setMode] = useState<InputMode>("bulk");
  const [bulkText, setBulkText] = useState("");
  const [individualScenarios, setIndividualScenarios] = useState<string[]>([
    "",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedBulkScenarios = parseBulkScenarios(bulkText);

  const handleContinue = async () => {
    setError(null);

    // Get scenarios based on mode
    const newScenarios =
      mode === "bulk"
        ? parsedBulkScenarios
        : individualScenarios.filter((s) => s.trim().length > 0);

    // For example project, we already have scenarios, so allow proceeding without new ones
    if (!isExampleProject && newScenarios.length === 0) {
      setError('Add at least 1 scenario to continue, or click "Skip for now"');
      return;
    }

    // Validate
    if (mode === "bulk" && newScenarios.length > 0) {
      const validation = validateBulkScenarios(bulkText);
      if (!validation.valid) {
        setError(validation.errors.join(". "));
        return;
      }
    }

    // If we have new scenarios to add, submit them
    if (newScenarios.length > 0) {
      setIsSubmitting(true);

      try {
        const sanitizedScenarios = newScenarios.map((text) => ({
          input_text: sanitize.plainText(text),
        }));

        const response = await fetch(
          `/api/projects/${projectId}/scenarios/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenarios: sanitizedScenarios }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Failed to add scenarios");
          setIsSubmitting(false);
          return;
        }

        // Update state with all scenarios
        setScenarios([...scenarios, ...newScenarios]);
      } catch (err) {
        console.error("Error adding scenarios:", err);
        setError("An unexpected error occurred. Please try again.");
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    onContinue();
  };

  const addIndividualScenario = () => {
    setIndividualScenarios([...individualScenarios, ""]);
  };

  const updateIndividualScenario = (index: number, value: string) => {
    const updated = [...individualScenarios];
    updated[index] = value;
    setIndividualScenarios(updated);
  };

  const removeIndividualScenario = (index: number) => {
    setIndividualScenarios(individualScenarios.filter((_, i) => i !== index));
  };

  const totalScenarios =
    scenarios.length +
    (mode === "bulk"
      ? parsedBulkScenarios.length
      : individualScenarios.filter((s) => s.trim().length > 0).length);

  return (
    <div className="space-y-8">
      {/* Success message for example project */}
      {isExampleProject && scenarios.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <svg
              className="w-5 h-5"
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
            <span className="font-medium">
              {scenarios.length} scenarios already added!
            </span>
          </div>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            Want to add more? Use the options below.
          </p>
        </div>
      )}

      <p className="text-muted-foreground">
        Add scenarios (things your AI should respond to):
      </p>

      {/* Mode Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "bulk" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("bulk")}
        >
          Bulk Import
        </Button>
        <Button
          type="button"
          variant={mode === "individual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("individual")}
        >
          One at a Time
        </Button>
      </div>

      {/* Bulk Import */}
      {mode === "bulk" && (
        <div className="space-y-2">
          <Label htmlFor="bulkScenarios">Paste scenarios (one per line):</Label>
          <Textarea
            id="bulkScenarios"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Where is my order?&#10;How do I return an item?&#10;Can I change my shipping address?"
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            {parsedBulkScenarios.length} scenario
            {parsedBulkScenarios.length !== 1 ? "s" : ""} detected | Max 1000
          </p>
        </div>
      )}

      {/* Individual Input */}
      {mode === "individual" && (
        <div className="space-y-4">
          {individualScenarios.map((scenario, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={scenario}
                onChange={(e) =>
                  updateIndividualScenario(index, e.target.value)
                }
                placeholder={`Scenario ${index + 1}`}
                aria-label={`Scenario ${index + 1}`}
              />
              {individualScenarios.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIndividualScenario(index)}
                  aria-label={`Remove scenario ${index + 1}`}
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIndividualScenario}
          >
            + Add another scenario
          </Button>
        </div>
      )}

      {/* Total count */}
      {totalScenarios > 0 && (
        <p className="text-sm font-medium">Total scenarios: {totalScenarios}</p>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Step 1
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Continue to Step 3"}
          </Button>
        </div>
      </div>
    </div>
  );
}

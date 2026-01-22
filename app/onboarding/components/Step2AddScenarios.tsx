"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitize } from "@/lib/security/sanitize";
import type { UseOnboardingState } from "@/lib/hooks/useOnboardingState";
import { FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function parseCSV(text: string): string[] {
  const scenarios: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (current.trim()) {
        scenarios.push(current.trim());
      }
      current = "";
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current.trim()) {
    scenarios.push(current.trim());
  }

  return scenarios;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>("bulk");
  const [csvScenarios, setCsvScenarios] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [individualScenarios, setIndividualScenarios] = useState<string[]>([
    "",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No scenarios found in file. Check the CSV format below.");
        setCsvScenarios([]);
      } else {
        setCsvScenarios(parsed);
        setError(null);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setFileName(null);
      setCsvScenarios([]);
    };

    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setFileName(null);
    setCsvScenarios([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinue = async () => {
    setError(null);

    // Get scenarios based on mode
    const newScenarios =
      mode === "bulk"
        ? csvScenarios
        : individualScenarios.filter((s) => s.trim().length > 0);

    // For example project, we already have scenarios, so allow proceeding without new ones
    if (!isExampleProject && newScenarios.length === 0) {
      setError('Add at least 1 scenario to continue, or click "Skip for now"');
      return;
    }

    // Validate scenario count
    if (newScenarios.length > 1000) {
      setError("Maximum 1000 scenarios allowed");
      return;
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
      ? csvScenarios.length
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload CSV File</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Choose CSV File
              </Button>
              {fileName && (
                <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                  <span className="text-sm truncate flex-1">{fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {csvScenarios.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {csvScenarios.length} scenario
                {csvScenarios.length !== 1 ? "s" : ""} found
              </Badge>
            )}
          </div>

          {/* CSV Format Instructions */}
          <div className="rounded-md border bg-muted/50 p-4 space-y-3">
            <h4 className="text-sm font-medium">CSV Format</h4>
            <p className="text-xs text-muted-foreground">
              One scenario per row. Use quotes for scenarios with commas or
              multiple lines.
            </p>
            <div className="font-mono text-xs bg-background rounded p-3 space-y-1">
              <p className="text-muted-foreground"># Simple scenarios:</p>
              <p>How do I reset my password?</p>
              <p>Where is my order?</p>
              <p className="text-muted-foreground mt-2"># With comma:</p>
              <p>&quot;Hi, I need help&quot;</p>
              <p className="text-muted-foreground mt-2"># Multi-line:</p>
              <p>&quot;My order is late.</p>
              <p>It&apos;s been 2 weeks.&quot;</p>
            </div>
          </div>
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

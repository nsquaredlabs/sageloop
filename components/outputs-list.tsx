"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Copy,
  Keyboard,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

interface Rating {
  id: number;
  stars: number;
  feedback_text: string | null;
  created_at: string;
  metadata?: {
    carried_forward?: boolean;
    similarity_score?: number;
    needs_review?: boolean;
  };
}

interface Output {
  id: number;
  output_text: string;
  generated_at: string;
  ratings: Rating[];
}

export interface ScenarioWithOutput {
  id: number;
  input_text: string;
  order: number;
  latestOutput: Output | null;
}

interface OutputsListProps {
  projectId: number;
  scenarios: ScenarioWithOutput[];
}

export function OutputsList({ projectId, scenarios }: OutputsListProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isQuickRateMode, setIsQuickRateMode] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [feedbackStates, setFeedbackStates] = useState<
    Record<number, { text: string; isSaving: boolean; lastSaved?: Date }>
  >({});
  const [expandedFeedback, setExpandedFeedback] = useState<
    Record<number, boolean>
  >({});

  // Initialize feedback states from existing ratings
  useEffect(() => {
    const initialStates: Record<number, { text: string; isSaving: boolean }> =
      {};
    scenarios.forEach((scenario) => {
      const output = scenario.latestOutput;
      const rating = output?.ratings?.[0];
      if (output && rating) {
        initialStates[output.id] = {
          text: rating.feedback_text || "",
          isSaving: false,
        };
      }
    });
    setFeedbackStates(initialStates);
  }, [scenarios]);

  // Debounced save function for feedback
  const saveFeedback = useMemo(
    () =>
      debounce(async (outputId: number, ratingId: number, text: string) => {
        try {
          setFeedbackStates((prev) => ({
            ...prev,
            [outputId]: { ...prev[outputId], isSaving: true },
          }));

          const response = await fetch(`/api/ratings/${ratingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedback_text: text }),
          });

          if (!response.ok) throw new Error("Failed to save feedback");

          setFeedbackStates((prev) => ({
            ...prev,
            [outputId]: { text, isSaving: false, lastSaved: new Date() },
          }));
        } catch (error) {
          console.error("Error saving feedback:", error);
          toast.error("Failed to save feedback");
          setFeedbackStates((prev) => ({
            ...prev,
            [outputId]: { ...prev[outputId], isSaving: false },
          }));
        }
      }, 500),
    [],
  );

  const handleFeedbackChange = (
    outputId: number,
    ratingId: number,
    text: string,
  ) => {
    setFeedbackStates((prev) => ({
      ...prev,
      [outputId]: { ...prev[outputId], text, isSaving: false },
    }));
    saveFeedback(outputId, ratingId, text);
  };

  // Find all outputs with generated content (for quick rating)
  const ratableOutputs = scenarios
    .map((scenario, index) => ({
      scenario,
      index,
      output: scenario.latestOutput,
    }))
    .filter((item) => item.output !== null);

  // Separate truly unrated outputs for messaging
  const unratedCount = ratableOutputs.filter((item) => {
    const rating = item.output?.ratings?.[0];
    return !rating;
  }).length;

  const handleQuickRate = useCallback(
    async (outputId: number, stars: number, scenarioIndex: number) => {
      try {
        const scenario = scenarios[scenarioIndex];
        const output = scenario?.latestOutput;
        const existingRating = output?.ratings?.[0];

        if (existingRating) {
          // Update existing rating (for carried-forward ratings)
          const response = await fetch(`/api/ratings/${existingRating.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stars, metadata: null }),
          });
          if (!response.ok) throw new Error("Failed to update rating");
          toast.success(`Updated to ${stars} stars`);
        } else {
          // Create new rating
          const response = await fetch(`/api/outputs/${outputId}/ratings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stars, feedback_text: null }),
          });
          if (!response.ok) throw new Error("Failed to create rating");
          toast.success(`Rated ${stars} stars`);
        }

        // Refresh the page to show updated data
        router.refresh();

        // Auto-advance to next output in quick rate mode
        if (isQuickRateMode) {
          const currentIndex = ratableOutputs.findIndex(
            (item) => item.index === scenarioIndex,
          );
          if (currentIndex < ratableOutputs.length - 1) {
            const nextOutput = ratableOutputs[currentIndex + 1];
            setSelectedIndex(nextOutput.index);
            // Scroll to next card
            setTimeout(() => {
              const element = document.getElementById(
                `output-${nextOutput.index}`,
              );
              element?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
          } else {
            // End of list, exit quick rate mode
            setIsQuickRateMode(false);
            setSelectedIndex(null);
            toast.success("Finished reviewing outputs!");
          }
        }
      } catch (error) {
        console.error("Error rating output:", error);
        toast.error("Failed to rate output");
      }
    },
    [router, isQuickRateMode, ratableOutputs, scenarios],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-5 for rating
      if (e.key >= "1" && e.key <= "5" && selectedIndex !== null) {
        const scenario = scenarios[selectedIndex];
        const output = scenario?.latestOutput;
        if (output) {
          // Allow rating/updating any output
          handleQuickRate(output.id, parseInt(e.key), selectedIndex);
        }
        return;
      }

      // Arrow keys for navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedIndex === null) {
          setSelectedIndex(0);
        } else {
          if (e.key === "ArrowDown") {
            setSelectedIndex(Math.min(scenarios.length - 1, selectedIndex + 1));
          } else {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
          }
        }
        // Scroll to selected card
        setTimeout(() => {
          const newIndex =
            selectedIndex === null
              ? 0
              : e.key === "ArrowDown"
                ? Math.min(scenarios.length - 1, selectedIndex + 1)
                : Math.max(0, selectedIndex - 1);
          const element = document.getElementById(`output-${newIndex}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
        return;
      }

      // Escape to deselect
      if (e.key === "Escape") {
        setSelectedIndex(null);
        setIsQuickRateMode(false);
      }

      // Question mark to toggle keyboard help
      if (e.key === "?") {
        setShowKeyboardHint((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedIndex, scenarios, handleQuickRate]);

  const startQuickRate = () => {
    setIsQuickRateMode(true);
    if (ratableOutputs.length > 0) {
      setSelectedIndex(ratableOutputs[0].index);
      // Scroll to first output
      setTimeout(() => {
        const element = document.getElementById(
          `output-${ratableOutputs[0].index}`,
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  return (
    <div>
      {/* Keyboard shortcuts hint */}
      {showKeyboardHint && scenarios.length > 0 && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border flex items-start gap-3">
          <Keyboard className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Keyboard Shortcuts</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  ↑↓
                </kbd>{" "}
                Navigate outputs
              </p>
              <p>
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  1-5
                </kbd>{" "}
                Quick rate selected output
              </p>
              <p>
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  Esc
                </kbd>{" "}
                Deselect •{" "}
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  ?
                </kbd>{" "}
                Toggle this hint
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowKeyboardHint(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Rate Mode controls */}
      {ratableOutputs.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          {!isQuickRateMode ? (
            <Button onClick={startQuickRate} size="lg" variant="default">
              <Star className="mr-2 h-4 w-4" />
              Quick Rate (
              {unratedCount > 0 ? `${unratedCount} unrated` : "All outputs"})
            </Button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg flex-1">
              <div className="flex-1">
                <p className="text-sm font-medium">Quick Rate Mode Active</p>
                <p className="text-xs text-muted-foreground">
                  Press 1-5 to rate/update • Arrow keys to navigate
                </p>
              </div>
              <Badge variant="secondary">
                {selectedIndex !== null
                  ? `${selectedIndex + 1} / ${scenarios.length}`
                  : `${scenarios.length} total`}
              </Badge>
              <Button
                onClick={() => {
                  setIsQuickRateMode(false);
                  setSelectedIndex(null);
                }}
                size="sm"
                variant="outline"
              >
                Exit
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Outputs List */}
      <div className="space-y-6">
        {scenarios.map((scenario, index) => {
          const output = scenario.latestOutput;
          const rating = output?.ratings?.[0];
          const metadata = rating?.metadata;
          const isCarriedForward = metadata?.carried_forward === true;
          const similarityScore = metadata?.similarity_score ?? 1.0;
          const needsReview = metadata?.needs_review === true;
          const isSelected = selectedIndex === index;

          return (
            <Card
              key={scenario.id}
              id={`output-${index}`}
              className={`overflow-hidden transition-all ${
                isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{index + 1}
                      </Badge>
                      {rating && (
                        <>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < rating.stars
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          {isCarriedForward && (
                            <>
                              <Badge
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                <Copy className="h-3 w-3" />
                                Previous rating
                              </Badge>
                              {needsReview ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs flex items-center gap-1 border-amber-600 text-amber-700 dark:text-amber-400"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Output changed - review needed
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs flex items-center gap-1 border-green-600 text-green-700 dark:text-green-400"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Output unchanged (
                                  {Math.round(similarityScore * 100)}% similar)
                                </Badge>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selected - Press 1-5 to {rating ? "update" : "rate"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-medium">
                      Input
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {scenario.input_text}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {output ? (
                  <>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">AI Output</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {output.output_text}
                      </p>
                    </div>

                    {rating && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">
                            {isCarriedForward
                              ? "Previous Feedback"
                              : "Your Feedback"}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {feedbackStates[output.id]?.isSaving && (
                              <span className="flex items-center gap-1">
                                <span className="animate-pulse">Saving...</span>
                              </span>
                            )}
                            {feedbackStates[output.id]?.lastSaved &&
                              !feedbackStates[output.id]?.isSaving && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3" />
                                  Saved
                                </span>
                              )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedFeedback((prev) => ({
                                  ...prev,
                                  [output.id]: !prev[output.id],
                                }));
                              }}
                            >
                              {expandedFeedback[output.id]
                                ? "Collapse"
                                : "Add note"}
                            </Button>
                          </div>
                        </div>

                        {expandedFeedback[output.id] ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add feedback or notes... Use #tags for quick categorization (e.g., #date-bug, #format-issue)"
                              value={feedbackStates[output.id]?.text ?? ""}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleFeedbackChange(
                                  output.id,
                                  rating.id,
                                  e.target.value,
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="min-h-[80px] text-sm"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                              Auto-saves as you type. Use #hashtags to
                              categorize issues.
                            </p>
                          </div>
                        ) : (
                          rating.feedback_text && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {rating.feedback_text}
                            </p>
                          )
                        )}

                        {isCarriedForward && needsReview && (
                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                            <p className="text-xs text-amber-900 dark:text-amber-100">
                              <strong>Review recommended:</strong> The output
                              has changed since this rating. Please review to
                              confirm the rating is still accurate.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {isSelected && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-3 text-center">
                          {rating ? "Update rating" : "Rate this output"}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((stars) => (
                            <Button
                              key={stars}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRate(output.id, stars, index);
                              }}
                              variant={
                                rating?.stars === stars ? "default" : "outline"
                              }
                              size="lg"
                              className="h-16 w-16 flex flex-col hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <Star className="h-6 w-6 mb-1" />
                              <span className="text-sm font-semibold">
                                {stars}
                              </span>
                            </Button>
                          ))}
                        </div>
                        <div className="mt-3 text-center">
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/projects/${projectId}/outputs/${output.id}/rate`}
                            >
                              Add detailed feedback
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}

                    {!rating && !isSelected && (
                      <div className="pt-4 border-t">
                        <Button asChild variant="outline" className="w-full">
                          <Link
                            href={`/projects/${projectId}/outputs/${output.id}/rate`}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Rate this output
                          </Link>
                        </Button>
                      </div>
                    )}

                    {rating && isCarriedForward && (
                      <div className="pt-4 border-t">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Link
                            href={`/projects/${projectId}/outputs/${output.id}/rate`}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {needsReview
                              ? "Review & update rating"
                              : "Update rating"}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No output generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

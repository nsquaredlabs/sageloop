# Tellah UX Audit & Improvement Recommendations

**Date:** December 11, 2025
**Status:** Updated with core insight validation

---

## Executive Summary

Tellah is a behavioral design tool for AI products that enables Product Managers to define "good" AI behavior through examples and ratings. The application follows a clear, linear user workflow: **Create Project → Add Scenarios → Generate Outputs → Rate Outputs → Analyze Patterns → Apply Fixes & Retest**.

### **The Core Insight**

Through real-world usage, we discovered the actual value proposition:

**The value isn't the fancy AI clustering or suggested fixes. It's the simple UX of seeing 10-30 outputs at once instead of one at a time.**

When you can see:

```
Scenario 1: ✅ Works
Scenario 2: ❌ Wrong year (2022)
Scenario 3: ✅ Works
Scenario 4: ❌ Wrong year (2022)
Scenario 5: ✅ Works
Scenario 6: ❌ Wrong year (2022)
Scenario 7: ✅ Works
Scenario 8: ❌ Wrong year (2022)
```

**The pattern jumps out at you.** You don't need AI to tell you "4 failures, same issue" - you SEE it.

Compare to old workflow:

- Run prompt → "hmm, got 2022, that's wrong"
- Adjust prompt, run again → "still getting 2022"
- Adjust more, run again → "okay, that one worked"
- Run on different input → "wait, 2022 again?"

You're playing whack-a-mole because you can't see the full pattern.

### **What This Means**

**Tellah is an eval tool for PMs doing human evaluation at scale, not for ML engineers running automated tests.**

The competitive moat:

- Every AI eval tool is built for engineers running automated tests
- Tellah is built for **PMs doing rapid manual evaluation**
- Engineers want automation. PMs want **rapid visual pattern recognition**.

**This document prioritizes improvements that enhance batch evaluation UX over AI analysis features.**

---

## Table of Contents

1. [Core Value Proposition](#core-value-proposition)
2. [Main User Flows](#main-user-flows)
3. [Current UX Strengths](#current-ux-strengths)
4. [Key User Journeys](#key-user-journeys)
5. [Improvement Recommendations](#improvement-recommendations)
6. [Priority Matrix](#priority-matrix)
7. [Implementation Guide](#implementation-guide)
8. [What to Keep vs. What to Cut](#what-to-keep-vs-what-to-cut)

---

## Core Value Proposition

### The Real Competitive Advantage

**Batch evaluation UX beats AI analysis every time.**

The tool's value comes from:

1. **Visual Pattern Recognition**: See 20-30 outputs at once, patterns become obvious
2. **Rapid Iteration**: Test → Rate → Adjust → Retest in minutes, not hours
3. **PM-Friendly**: No code required, human judgment over automated metrics
4. **Failure Clustering**: Groups YOUR feedback across scenarios (not generic AI insights)

### The Four Critical Questions

For Tellah to succeed, answer "yes" to all four:

1. **Can I rate 50 outputs in 5 minutes?** → Keyboard shortcuts, batch actions, streamlined UX
2. **Can I see patterns at a glance?** → Visual design, color coding, filtering, grouping
3. **Can I iterate in 30 seconds?** → Inline prompt editing, instant retest, version comparison
4. **Can I export in 10 seconds?** → One-click download, clean format, test-ready output

If yes to all four: **Tool is 10x faster than "run prompt in ChatGPT, copy output to doc, repeat."**

### What Failure Clustering Should Do

**Good clustering** (Keep this):

```
Cluster: "Date handling" (8 failures)
- Pattern: All using 2022 as default year
- Your feedback mentions: "wrong year", "needs current date", "2022 bug"
- Scenarios: #1, #4, #7, #8, #12, #15, #19, #22
```

This is useful because it:

- Groups scattered failures across 30 scenarios
- Pulls out the actual issues from YOUR words
- Shows you where to focus (8 failures > 2 failures)

**Bad clustering** (Don't build this):

```
Cluster: "Quality issues" (13 failures)
- Pattern: Outputs don't meet quality standards
- Generic advice: Improve prompt clarity
```

This is useless because it just restates "things failed" without specificity.

---

## Main User Flows

### Authentication Flow

- **Landing Page** (`/`) - Marketing page with "Get Started" CTA
- **Login** (`/auth/login`) - Email/password authentication
- **Sign Up** (`/auth/signup`) - Account creation with 6+ character password requirement

### Core Application Flow

```
Projects List → New Project → Project Overview → Rate Outputs → Insights → History
```

### Primary Routes

| Page                 | Route                                    | Purpose                                                               |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| **Projects**         | `/projects`                              | Dashboard listing all user projects with cards showing model, date    |
| **New Project**      | `/projects/new`                          | Create new evaluation project with model selection & config           |
| **Project Overview** | `/projects/[id]`                         | Project hub - manage scenarios, view system prompt, generate outputs  |
| **Outputs**          | `/projects/[id]/outputs`                 | List all generated outputs with ratings, progress tracking            |
| **Rate Output**      | `/projects/[id]/outputs/[outputId]/rate` | Full-screen rating interface for single output                        |
| **Insights**         | `/projects/[id]/insights`                | Display extracted quality criteria, failure analysis, recommendations |
| **History**          | `/projects/[id]/insights/history`        | Timeline view of all pattern extraction runs                          |
| **Settings**         | `/workbench/[id]/settings`               | Workbench configuration (API keys)                                    |

---

## Current UX Strengths

### 1. Clear Linear Workflow

The application guides users through a logical progression without confusion about next steps.

### 2. Intelligent Retest System

- **Similarity Scoring**: Shows % similarity between old/new outputs (Levenshtein distance algorithm)
- **Carried-Forward Ratings**: Previous ratings automatically applied if output unchanged
- **Review Prompting**: Flags outputs that changed significantly (< 90% similar)
- **Batch Processing**: Regenerate all scenarios at once with new prompt

### 3. Real-Time Progress Tracking

Users can see at a glance:

- Generated: 8/10 outputs
- Rated: 7/8 outputs
- Extraction status and confidence scores

### 4. Comprehensive Feedback System

Rating interface includes:

- 5-star rating (required)
- Text feedback (optional)
- 10 common tags + custom tags
- Real-time validation

### 5. Pattern Analysis Insights

- **Failure Clustering**: Groups similar failures by root cause
- **AI-Integrated Fixes**: Uses Claude to merge suggested fixes into prompt
- **Quality Dimensions**: Breaks down behavior into measurable criteria
- **Historical Snapshots**: Captures system prompt at extraction time

### 6. Context Preservation

Sidebar navigation shows current project throughout the workflow, preventing users from getting lost.

### 7. Bulk Operations

- Upload scenarios in batches (file or paste)
- Retest all scenarios at once
- Generate outputs for all scenarios simultaneously

### 8. Export Capabilities

- JSON export of quality criteria
- Markdown export for documentation
- Historical tracking of all extractions

---

## Key User Journeys

### Journey 1: Complete New Evaluation Project

```
1. Sign Up/Login
   └─ Landing Page → Login/Signup Form

2. Create Project
   └─ Projects Page → "New Project" button
       └─ New Project Form
           ├─ Name project
           ├─ Select model (OpenAI/Anthropic)
           ├─ Configure temperature (0.0-1.0)
           ├─ Write system prompt
           └─ Submit

3. Add Scenarios
   └─ Project Overview
       ├─ Add single scenario via dialog
       └─ OR bulk upload via file/paste

4. Generate Outputs
   └─ Project Overview
       └─ Click "Generate Outputs" button
           └─ Redirects to Outputs page

5. Rate Outputs
   └─ Outputs Page
       └─ Click "Rate this output" for each
           └─ Rate Output Page
               ├─ Select stars (1-5)
               ├─ Write feedback
               ├─ Add tags
               └─ Submit → Auto-redirect to next

6. Analyze Patterns
   └─ Outputs Page (when all rated)
       └─ Click "Analyze Patterns" button
           └─ AI extracts quality criteria
               └─ Redirects to Insights page

7. Review & Apply Fixes
   └─ Insights Page
       └─ Review failure analysis
           └─ Click "Apply Fix & Retest"
               ├─ AI integrates fixes into prompt
               ├─ Review & edit merged prompt
               ├─ Add improvement note
               └─ Retest all scenarios
                   └─ Returns to Outputs with success message
```

### Journey 2: Quick Rating Session

```
Outputs Page
    ├─ See unrated outputs with progress (Rated: 3/10)
    ├─ Click "Rate this output"
    ├─ Rate Output Page
    │   ├─ Quickly rate with stars
    │   ├─ Optionally add feedback/tags
    │   └─ Submit
    ├─ Auto-redirect back to Outputs Page
    └─ Repeat until all rated
         └─ "Analyze Patterns" button appears
```

### Journey 3: Monitoring Improvements Over Time

```
Insights Page (latest extraction)
    ├─ View current success rate & confidence
    ├─ Review quality criteria
    ├─ Click "View History" link
    └─ History Page
        ├─ See timeline of all extractions
        ├─ Click on past extraction
        └─ View historical metrics & criteria
            └─ Compare with current version
```

---

## Improvement Recommendations

### 1. Output Comparison View (P0 - High Impact, Medium Effort)

**Problem:** Users can't easily see what changed between prompt versions when ratings are carried forward.

**Solution:** Add a side-by-side comparison dialog showing old vs. new output with diff highlighting.

**Implementation:**

Create new component `components/output-comparison-dialog.tsx`:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OutputComparisonDialogProps {
  oldOutput: string;
  newOutput: string;
  similarityScore: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutputComparisonDialog({
  oldOutput,
  newOutput,
  similarityScore,
  open,
  onOpenChange,
}: OutputComparisonDialogProps) {
  // Calculate character-level differences
  const renderDiff = () => {
    const lines1 = oldOutput.split("\n");
    const lines2 = newOutput.split("\n");
    const maxLines = Math.max(lines1.length, lines2.length);

    return Array.from({ length: maxLines }).map((_, i) => ({
      old: lines1[i] || "",
      new: lines2[i] || "",
      changed: lines1[i] !== lines2[i],
    }));
  };

  const diffs = renderDiff();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Output Comparison
            <Badge variant="secondary">
              {Math.round(similarityScore * 100)}% similar
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Previous Version */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Previous Output
              <Badge variant="outline" className="text-xs">
                Previous Version
              </Badge>
            </h4>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              {diffs.map((diff, i) => (
                <div
                  key={`old-${i}`}
                  className={`text-sm font-mono ${
                    diff.changed ? "bg-red-100 dark:bg-red-950/30" : ""
                  }`}
                >
                  {diff.old || "\u00A0"}
                </div>
              ))}
            </div>
          </div>

          {/* Current Version */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Current Output
              <Badge variant="outline" className="text-xs">
                Current Version
              </Badge>
            </h4>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              {diffs.map((diff, i) => (
                <div
                  key={`new-${i}`}
                  className={`text-sm font-mono ${
                    diff.changed ? "bg-green-100 dark:bg-green-950/30" : ""
                  }`}
                >
                  {diff.new || "\u00A0"}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground">
            <strong>Legend:</strong>
            <span className="ml-2 inline-block bg-red-100 dark:bg-red-950/30 px-2 py-0.5 rounded">
              Removed/Changed
            </span>
            <span className="ml-2 inline-block bg-green-100 dark:bg-green-950/30 px-2 py-0.5 rounded">
              Added/New
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Integration in Outputs Page:**

Update `app/projects/[id]/outputs/page.tsx` to add comparison button for carried-forward ratings:

```tsx
{
  isCarriedForward && (
    <div className="mt-2">
      <Button variant="ghost" size="sm" onClick={() => setShowComparison(true)}>
        <GitCompare className="mr-2 h-4 w-4" />
        Compare versions
      </Button>

      <OutputComparisonDialog
        oldOutput={previousOutputText}
        newOutput={output.output_text}
        similarityScore={similarityScore}
        open={showComparison}
        onOpenChange={setShowComparison}
      />
    </div>
  );
}
```

**User Benefit:** Users can quickly understand what changed and make informed decisions about whether to update the rating.

---

### 2. Batch Rating Interface (P0 - High Impact, High Effort)

**Problem:** Rating 50+ outputs one-by-one is tedious and time-consuming.

**Solution:** Add a streamlined batch rating mode with keyboard shortcuts and progress tracking.

**Implementation:**

Create new page `app/projects/[id]/outputs/batch-rate/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface BatchRatePageProps {
  params: Promise<{ id: string }>;
}

export default function BatchRatePage({ params }: BatchRatePageProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch unrated outputs
    async function fetchOutputs() {
      // Implementation here
    }
    fetchOutputs();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= 5) {
        handleQuickRate(key);
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [currentIndex]);

  const handleQuickRate = async (stars: number) => {
    const supabase = createClient();

    await supabase.from("ratings").insert({
      output_id: outputs[currentIndex].id,
      stars,
      feedback_text: null,
      tags: null,
    });

    if (currentIndex < outputs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push(`/projects/${projectId}/outputs`);
    }
  };

  const currentOutput = outputs[currentIndex];
  const progress = ((currentIndex + 1) / outputs.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="bg-muted px-4 py-3 border-b sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Rating {currentIndex + 1} of {outputs.length}
            </span>
            <Badge>{Math.round(progress)}% complete</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Quick Rating Interface */}
      <div className="flex-1 container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono">
                #{currentIndex + 1}
              </Badge>
            </div>
            <CardTitle className="text-base">Input</CardTitle>
            <CardDescription className="mt-2">
              {currentOutput?.scenario?.input_text}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="mb-8">
              <h4 className="text-sm font-medium mb-3">AI Output</h4>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {currentOutput?.output_text}
                </p>
              </div>
            </div>

            {/* Quick Star Rating - Large Buttons */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-center">
                Rate this output
              </h4>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <Button
                    key={stars}
                    size="lg"
                    variant="outline"
                    onClick={() => handleQuickRate(stars)}
                    className="h-24 w-24 flex flex-col hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Star className="h-8 w-8 mb-2" />
                    <span className="text-lg font-semibold">{stars}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Optional: Add detailed feedback */}
            <div className="mt-6 pt-6 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(
                    `/projects/${projectId}/outputs/${currentOutput.id}/rate`,
                  )
                }
              >
                Add detailed feedback instead
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentIndex(Math.min(outputs.length - 1, currentIndex + 1))
            }
            disabled={currentIndex === outputs.length - 1}
          >
            Skip
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <strong>Keyboard shortcuts:</strong> Press 1-5 to rate quickly
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Entry Point:**

Add button to outputs page:

```tsx
{
  totalOutputs > ratedOutputs && (
    <Button asChild variant="default" size="lg">
      <Link href={`/projects/${id}/outputs/batch-rate`}>
        <Zap className="mr-2 h-4 w-4" />
        Quick Rate ({totalOutputs - ratedOutputs} remaining)
      </Link>
    </Button>
  );
}
```

**User Benefit:** Users can rate outputs 3-5x faster using keyboard shortcuts and streamlined interface.

---

### 3. Tag Auto-Complete (P1 - Medium Impact, Low Effort)

**Problem:** Users re-type similar tags ("accurate" vs "Accurate"), creating inconsistency.

**Solution:** Show previously used tags as suggestions while typing.

**Implementation:**

Update `components/rating-form.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase";

export function RatingForm({ projectId, outputId }: RatingFormProps) {
  const [allProjectTags, setAllProjectTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Fetch all unique tags used in this project
    async function fetchTags() {
      const supabase = createClient();

      // Get all outputs for this project
      const { data: scenarios } = await supabase
        .from("scenarios")
        .select("id")
        .eq("project_id", projectId);

      const scenarioIds = scenarios?.map((s) => s.id) || [];

      // Get all ratings for these scenarios
      const { data: outputs } = await supabase
        .from("outputs")
        .select("id, ratings(tags)")
        .in("scenario_id", scenarioIds);

      // Extract unique tags
      const allTags: string[] = [];
      outputs?.forEach((output) => {
        output.ratings?.forEach((rating: any) => {
          if (rating.tags && Array.isArray(rating.tags)) {
            allTags.push(...rating.tags);
          }
        });
      });

      const uniqueTags = [...new Set(allTags)].sort();
      setAllProjectTags(uniqueTags);
    }

    fetchTags();
  }, [projectId]);

  const handleTagInput = (value: string) => {
    setCustomTag(value);

    if (value.length > 0) {
      const suggestions = allProjectTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !selectedTags.includes(tag),
      );
      setTagSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Custom Tags</Label>
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <Input
            placeholder="Add custom tag..."
            value={customTag}
            onChange={(e) => handleTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customTag) {
                handleAddTag(customTag);
                setCustomTag("");
                setShowSuggestions(false);
              }
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-2 py-1">
              Previously used tags:
            </p>
            {tagSuggestions.map((tag) => (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => {
                  handleAddTag(tag);
                  setCustomTag("");
                  setShowSuggestions(false);
                }}
              >
                {tag}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

**User Benefit:** Consistent tagging across project, faster tag entry, ability to reuse existing tags.

---

### 4. Delete Scenario Confirmation (P1 - High Impact, Low Effort)

**Problem:** Trash icon exists on scenarios but clicking it does nothing. No way to delete scenarios.

**Solution:** Add confirmation dialog with warning about cascading deletes.

**Implementation:**

Create `components/delete-scenario-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface DeleteScenarioButtonProps {
  scenarioId: number;
  scenarioText: string;
  outputCount?: number;
}

export function DeleteScenarioButton({
  scenarioId,
  scenarioText,
  outputCount = 0,
}: DeleteScenarioButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const supabase = createClient();

    // Delete scenario (cascade will delete outputs and ratings)
    const { error } = await supabase
      .from("scenarios")
      .delete()
      .eq("id", scenarioId);

    if (error) {
      console.error("Failed to delete scenario:", error);
      alert("Failed to delete scenario. Please try again.");
    } else {
      router.refresh();
    }

    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Scenario?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You are about to delete this scenario:</p>
            <div className="bg-muted p-3 rounded-lg text-sm">
              "{scenarioText}"
            </div>
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <p className="text-destructive text-sm font-medium">
                This will permanently delete:
              </p>
              <ul className="text-destructive text-sm mt-2 space-y-1">
                <li>• This scenario</li>
                {outputCount > 0 && (
                  <li>
                    • {outputCount} output{outputCount !== 1 ? "s" : ""}
                  </li>
                )}
                <li>• All associated ratings</li>
              </ul>
              <p className="text-destructive text-sm mt-2 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Scenario"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Integration:**

Update scenario list in project overview to use the delete button:

```tsx
<DeleteScenarioButton
  scenarioId={scenario.id}
  scenarioText={scenario.input_text}
  outputCount={scenario.outputs?.length || 0}
/>
```

**User Benefit:** Users can clean up test scenarios, with clear warning about what will be deleted.

---

### 5. Prompt Version History (P1 - Medium Impact, Medium Effort)

**Problem:** No way to see previous prompt versions or track what changed over time.

**Solution:** Add version history dialog showing all prompt iterations with timestamps and improvement notes.

**Implementation:**

Create `components/prompt-history-dialog.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

interface PromptVersion {
  version: number;
  system_prompt: string;
  updated_at: string;
  success_rate?: number;
}

export function PromptHistoryDialog({
  projectId,
  currentVersion,
}: {
  projectId: string;
  currentVersion: number;
}) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedVersion, setCopiedVersion] = useState<number | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    const supabase = createClient();

    // Get all outputs grouped by prompt version
    const { data: outputs } = await supabase
      .from("outputs")
      .select(
        `
        model_snapshot,
        generated_at,
        scenario:scenarios!inner(project_id)
      `,
      )
      .eq("scenario.project_id", projectId)
      .order("generated_at", { ascending: false });

    // Extract unique versions
    const versionMap = new Map<number, PromptVersion>();

    outputs?.forEach((output) => {
      const snapshot = output.model_snapshot as any;
      const version = snapshot?.version || 1;
      const systemPrompt = snapshot?.system_prompt || "";

      if (!versionMap.has(version)) {
        versionMap.set(version, {
          version,
          system_prompt: systemPrompt,
          updated_at: output.generated_at,
        });
      }
    });

    const sortedVersions = Array.from(versionMap.values()).sort(
      (a, b) => b.version - a.version,
    );

    setVersions(sortedVersions);
    setLoading(false);
  };

  const handleCopy = (version: number, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedVersion(version);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Prompt History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading version history...
            </p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No version history available
            </p>
          ) : (
            versions.map((version) => (
              <Card key={version.version}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          version.version === currentVersion
                            ? "default"
                            : "outline"
                        }
                      >
                        Version {version.version}
                      </Badge>
                      {version.version === currentVersion && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(version.version, version.system_prompt)
                        }
                      >
                        {copiedVersion === version.version ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs">
                    <pre className="whitespace-pre-wrap">
                      {version.system_prompt}
                    </pre>
                  </div>
                  {version.success_rate !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Success Rate:
                      </span>
                      <Badge variant="outline">
                        {Math.round(version.success_rate * 100)}%
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Integration:**

Add to project overview page near the system prompt card:

```tsx
<PromptHistoryDialog
  projectId={projectId}
  currentVersion={project.prompt_version}
/>
```

**User Benefit:** Users can track prompt evolution, compare versions, and restore previous prompts if needed.

---

### 6. Mobile Navigation (P2 - Medium Impact, Low Effort)

**Problem:** Fixed sidebar may be awkward on mobile devices.

**Solution:** Use responsive drawer pattern for mobile, keep sidebar for desktop.

**Implementation:**

Update `components/project-nav.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LayoutDashboard,
  FileOutput,
  Lightbulb,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/outputs", label: "Outputs", icon: FileOutput },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/insights/history", label: "History", icon: History },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const NavContent = () => (
    <nav className="space-y-1 p-4">
      {navItems.map((item) => {
        const href = `/projects/${projectId}${item.href}`;
        const isActive = pathname === href;
        const Icon = item.icon;

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile: Drawer */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block w-64 border-r min-h-screen">
        <NavContent />
      </div>
    </>
  );
}
```

**User Benefit:** Better mobile experience with accessible navigation drawer.

---

### 7. Onboarding Tour (P2 - Medium Impact, Medium Effort)

**Problem:** New users may not understand the full workflow or miss key features.

**Solution:** Add optional interactive tour on first project creation.

**Implementation:**

Create `components/onboarding-tour.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Add Test Scenarios",
    description:
      "Start by adding example inputs you want to test your AI with. You can add them one-by-one or upload in bulk.",
  },
  {
    title: "Generate Outputs",
    description:
      'Click "Generate Outputs" to see how your AI responds to each scenario using your system prompt.',
  },
  {
    title: "Rate Responses",
    description:
      "Rate each output with stars and feedback. This teaches Tellah what good behavior looks like for your use case.",
  },
  {
    title: "Get Insights",
    description:
      'Once all outputs are rated, click "Analyze Patterns" to extract quality criteria and failure patterns.',
  },
  {
    title: "Apply Fixes",
    description:
      'Review suggested fixes and click "Apply Fix & Retest" to update your prompt and regenerate outputs automatically.',
  },
];

export function OnboardingTour({ projectId }: { projectId: string }) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (hasSeenTour) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("hasSeenOnboardingTour", "true");
    setDismissed(true);
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  if (dismissed) return null;

  const currentStep = TOUR_STEPS[step];

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-xl z-50 border-2">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Step {step + 1} of {TOUR_STEPS.length}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <h4 className="font-semibold text-base mb-2">{currentStep.title}</h4>
          <p className="text-sm text-muted-foreground">
            {currentStep.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Skip tour
          </Button>
          <Button size="sm" onClick={handleNext}>
            {step === TOUR_STEPS.length - 1 ? "Got it!" : "Next"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

**Integration:**

Add to project overview page for new projects:

```tsx
{
  project.prompt_version === 1 && <OnboardingTour projectId={projectId} />;
}
```

**User Benefit:** New users understand the workflow faster, reducing confusion and improving adoption.

---

### 8. Success Rate Trend Chart (P3 - Low Impact, Medium Effort)

**Problem:** History page shows list of extractions but no visual trend of improvements.

**Solution:** Add line chart showing success rate over prompt versions.

**Implementation:**

Update `app/projects/[id]/insights/history/page.tsx`:

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HistoryPage(
  {
    /* ... */
  },
) {
  // Prepare chart data from extractions
  const chartData = extractions.map((ext) => ({
    version: `v${ext.prompt_version}`,
    successRate: Math.round((ext.success_rate || 0) * 100),
    confidence: Math.round((ext.confidence_score || 0) * 100),
  }));

  return (
    <div>
      {/* Success Rate Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quality Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="version" className="text-xs" />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                label={{
                  value: "Percentage",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Success Rate"
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Existing extraction cards... */}
    </div>
  );
}
```

**Dependencies:**

```bash
npm install recharts
```

**User Benefit:** Visual understanding of prompt improvement trajectory over time.

---

### 9. Loading Skeleton States (P3 - Low Impact, Low Effort)

**Problem:** Pages show blank content while fetching data, appearing broken.

**Solution:** Add skeleton loaders for better perceived performance.

**Implementation:**

Create `components/skeletons.tsx`:

```tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OutputSkeleton() {
  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export function ProjectSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Integration:**

```tsx
import { Suspense } from "react";
import { OutputSkeleton } from "@/components/skeletons";

<Suspense
  fallback={
    <div className="space-y-6">
      <OutputSkeleton />
      <OutputSkeleton />
      <OutputSkeleton />
    </div>
  }
>
  <OutputsList projectId={id} />
</Suspense>;
```

**User Benefit:** Better perceived performance, clear indication that content is loading.

---

### 10. Empty State Enhancements (P3 - Low Impact, Low Effort)

**Problem:** Empty states are minimal with just text.

**Solution:** Add illustrations and actionable guidance.

**Implementation:**

Update empty states throughout the app:

```tsx
import { FileOutput, Plus } from 'lucide-react';

// Example: Outputs page empty state
<div className="text-center py-16">
  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
    <FileOutput className="h-10 w-10 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No outputs yet</h3>
  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
    Generate AI outputs from your scenarios to start rating and analyzing behavior.
  </p>
  <Button asChild size="lg">
    <Link href={`/projects/${id}`}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Go to Overview
    </Link>
  </Button>
</div>

// Example: Scenarios empty state
<div className="text-center py-16">
  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
    <Plus className="h-10 w-10 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No scenarios yet</h3>
  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
    Add test scenarios to evaluate your AI's behavior. You can add them individually or upload in bulk.
  </p>
  <div className="flex gap-3 justify-center">
    <Button onClick={() => setShowAddDialog(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Add Scenario
    </Button>
    <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
      <Upload className="mr-2 h-4 w-4" />
      Upload Scenarios
    </Button>
  </div>
</div>
```

**User Benefit:** Clear guidance on next steps, reduced confusion for new users.

---

## Priority Matrix

**Reprioritized based on batch evaluation UX insight:**

| Improvement                      | Impact   | Effort | Priority | Rationale                                                     |
| -------------------------------- | -------- | ------ | -------- | ------------------------------------------------------------- |
| **Batch Rating Interface**       | Critical | High   | **P0**   | Core value: Rate 50 outputs in 5 min instead of 30 min        |
| **Visual Scanning & Filters**    | Critical | Medium | **P0**   | Core value: See patterns at a glance (color coding, grouping) |
| **Output Comparison View**       | High     | Medium | **P0**   | Core value: Understand what changed between versions          |
| **Keyboard-Driven Rating**       | High     | Low    | **P0**   | Core value: Press 1-5 to rate, 3-5x faster                    |
| **Delete Scenario Confirmation** | High     | Low    | **P1**   | Cleanup without fear                                          |
| **Inline Feedback Notes**        | High     | Low    | **P1**   | Feeds clustering, quick to add                                |
| **Tag Auto-Complete**            | Medium   | Low    | **P1**   | Consistency & speed                                           |
| **Version Tracking**             | Medium   | Medium | **P1**   | Compare iterations side-by-side                               |
| **Prompt Version History**       | Medium   | Medium | **P2**   | Track evolution, restore previous                             |
| **Smart Retest**                 | Medium   | Medium | **P2**   | Retest just failures, save API costs                          |
| **Mobile Navigation**            | Low      | Low    | **P2**   | Nice to have, not core workflow                               |
| **Onboarding Tour**              | Low      | Medium | **P3**   | Defer until core UX is solid                                  |
| **Success Rate Chart**           | Low      | Medium | **P3**   | Polish, not essential                                         |
| **Loading Skeletons**            | Low      | Low    | **P3**   | Polish                                                        |
| **Empty State Enhancements**     | Low      | Low    | **P3**   | Polish                                                        |

### Recommended Implementation Order

**Tier 1: Must Have - Batch Eval UX (Build These First)**

1. **Keyboard-Driven Rating** (~2 hours)
   - Press 1-5 keys to rate
   - Tab/Arrow to navigate
   - Rate 30 outputs in <2 minutes

2. **Inline Feedback Notes** (~3 hours)
   - Click output → text box appears → auto-saves
   - These feed the clustering algorithm
   - Quick tags: #date-bug, #format, #tone

3. **Visual Scanning & Filters** (~4 hours)
   - Color-coded grid view (green/yellow/red)
   - Failed outputs (1-2 ⭐) visually distinct
   - Filter: "Show failures only"
   - Group by cluster (after clustering runs)

4. **Batch Rating Interface** (~8 hours)
   - Streamlined flow for rapid rating
   - Progress tracking
   - Keyboard shortcuts front and center

**Tier 2: Nice to Have - After Core Works**

5. **Output Comparison View** (~4 hours)
   - Side-by-side: v1 output vs v2 output
   - Highlight what changed
   - See if your fix worked

6. **Delete Scenario Confirmation** (~2 hours)
7. **Tag Auto-Complete** (~2 hours)
8. **Version Tracking** (~6 hours)
   - Save prompt versions (v1, v2, v3)
   - Rerun same scenarios on new prompt
   - Side-by-side comparison

**Tier 3: Maybe Later**

9. Smart Retest (retest just failures)
10. Prompt Version History
11. Mobile Navigation
12. Bulk scenario generation with AI
13. Export templates (Jest, Pytest)
14. All the polish items

### Sprint Breakdown

---

## Sprint 1: Fast Rating UX (2-3 days)

**Goal:** Make it possible to rate 30 outputs in <2 minutes

### Tasks

**1.1 Keyboard Shortcuts for Rating** (~2 hours)

- [ ] Add global keyboard listener on outputs page
- [ ] Press 1-5 keys to instantly rate current output
- [ ] Arrow keys / Tab to navigate between outputs
- [ ] Escape to deselect current output
- [ ] Visual indicator showing keyboard shortcuts

**Implementation:**

```tsx
// app/projects/[id]/outputs/page.tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key >= "1" && e.key <= "5") {
      handleQuickRate(selectedOutputId, parseInt(e.key));
    }
  };
  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, [selectedOutputId]);
```

**1.2 Inline Feedback Notes** (~3 hours)

- [ ] Click output card to expand feedback textarea
- [ ] Auto-save feedback on blur (500ms debounce)
- [ ] Show saved indicator
- [ ] Support hashtags for quick tags (#date-bug, #format)

**Implementation:**

```tsx
// components/output-card.tsx
const [feedback, setFeedback] = useState(output.rating?.feedback_text || "");
const [isSaving, setIsSaving] = useState(false);

const debouncedSave = useMemo(
  () =>
    debounce(async (text: string) => {
      setIsSaving(true);
      await supabase
        .from("ratings")
        .update({ feedback_text: text })
        .eq("output_id", output.id);
      setIsSaving(false);
    }, 500),
  [output.id],
);
```

**1.3 Quick Rate Mode** (~2 hours)

- [ ] Add "Quick Rate" button that focuses first unrated output
- [ ] Auto-advance to next unrated after rating
- [ ] Progress indicator: "Rated 12/30"
- [ ] Exit quick rate mode button

**Validation Criteria:**
✅ Can rate 30 outputs in under 2 minutes using only keyboard
✅ Feedback saves automatically without clicking buttons
✅ Progress is always visible
✅ No accidental ratings (requires intentional key press)

**Before moving to Sprint 2:** Test with real project, rate 20-30 outputs. Should feel fast and effortless.

---

## Sprint 2: Visual Scanning & Filters (2-3 days)

**Goal:** See patterns at a glance through color coding and filtering

### Tasks

**2.1 Color-Coded Output Cards** (~2 hours)

- [ ] Green border/background: 5 stars
- [ ] Light green: 4 stars
- [ ] Yellow: 3 stars
- [ ] Orange: 2 stars
- [ ] Red: 1 star
- [ ] Gray: Unrated
- [ ] Use subtle colors that work in light/dark mode

**Implementation:**

```tsx
// components/output-card.tsx
const ratingColor = {
  5: "border-green-500 bg-green-50 dark:bg-green-950/20",
  4: "border-green-400 bg-green-50 dark:bg-green-950/10",
  3: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/10",
  2: "border-orange-400 bg-orange-50 dark:bg-orange-950/10",
  1: "border-red-500 bg-red-50 dark:bg-red-950/20",
  null: "border-gray-300 bg-gray-50 dark:bg-gray-900",
}[rating?.stars || null];
```

**2.2 Filter Controls** (~2 hours)

- [ ] Filter dropdown: All / Rated / Unrated / Failures (1-2★) / Success (4-5★)
- [ ] Tag filter: Click tag to filter by that tag
- [ ] Clear filters button
- [ ] Show count: "Showing 8 of 30 outputs"

**2.3 Grid/List View Toggle** (~2 hours)

- [ ] Compact grid view (2-3 columns)
- [ ] Detailed list view (current)
- [ ] Remember preference in localStorage
- [ ] Grid shows: scenario input (truncated), output (truncated), rating, tags

**2.4 Sort Controls** (~1 hour)

- [ ] Sort by: Rating (low to high), Rating (high to low), Date, Scenario order
- [ ] Default: Scenario order (preserves batch consistency)

**Validation Criteria:**
✅ Failures visually jump out (red cards obvious)
✅ Can filter to "show only failures" in 1 click
✅ Grid view shows 20-30 outputs without scrolling
✅ Color coding works in both light/dark mode

**Before moving to Sprint 3:** Review 30 outputs. Pattern should be immediately obvious without reading details.

---

## Sprint 3: Version Tracking & Comparison (3-4 days)

**Goal:** Track prompt iterations and compare what changed

### Tasks

**3.1 Prompt Version Tracking** (~3 hours)

- [ ] Increment `prompt_version` on each retest
- [ ] Store version in `model_snapshot` when generating outputs
- [ ] Show current version in project header: "Version 3"
- [ ] Version badge on each output card

**Database:**

```sql
-- Already exists in model_snapshot JSONB:
{
  "version": 3,
  "system_prompt": "...",
  "model": "gpt-4",
  "temperature": 0.7
}
```

**3.2 Version Selector** (~2 hours)

- [ ] Dropdown to view outputs from specific version
- [ ] "Compare versions" button (shows v1 vs v2 side-by-side)
- [ ] Show version metadata: date, prompt diff, success rate

**3.3 Side-by-Side Comparison Dialog** (~4 hours)

- [ ] Select two versions to compare
- [ ] Show outputs for same scenario side-by-side
- [ ] Highlight text differences (diff algorithm)
- [ ] Show rating changes: "v1: 2★ → v2: 5★"
- [ ] Navigate through scenarios

**Implementation:**

```tsx
// components/version-comparison-dialog.tsx
<Dialog>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Badge>Version {v1.version}</Badge>
      <p className="text-sm">{v1.output_text}</p>
      <div className="flex gap-1">
        {[...Array(v1.rating?.stars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400" />
        ))}
      </div>
    </div>
    <div>
      <Badge>Version {v2.version}</Badge>
      <p className="text-sm">{v2.output_text}</p>
      <div className="flex gap-1">
        {[...Array(v2.rating?.stars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400" />
        ))}
      </div>
    </div>
  </div>
</Dialog>
```

**3.4 Retest Workflow Enhancement** (~2 hours)

- [ ] Before retest, show: "This will create version 4"
- [ ] Option to add version note: "Fixed date handling"
- [ ] After retest, auto-open comparison: "v3 vs v4"
- [ ] Highlight scenarios where rating improved/degraded

**Validation Criteria:**
✅ Can see exactly what changed between prompt versions
✅ Can quickly identify if fix worked (rating improvements)
✅ Version history is clear and navigable
✅ Comparison view makes diffs obvious

**Before moving to Sprint 4:** Test full iteration loop: Rate v1 → Adjust prompt → Retest (v2) → Compare → See improvements.

---

## Sprint 4: Batch Rating Interface (2-3 days)

**Goal:** Streamlined full-screen rating flow for rapid evaluation

### Tasks

**4.1 Batch Rate Page** (~4 hours)

- [ ] New route: `/projects/[id]/outputs/batch-rate`
- [ ] Full-screen interface, one output at a time
- [ ] Large star rating buttons (keyboard 1-5 also works)
- [ ] Progress bar at top: "12 / 30 (40%)"
- [ ] Auto-advance to next unrated output

**4.2 Batch Rate Controls** (~2 hours)

- [ ] Skip button (marks as "reviewed" but not rated)
- [ ] Previous button (go back if you mis-rated)
- [ ] "Add detailed feedback" link (goes to full rating page)
- [ ] Exit batch mode (returns to outputs list)

**4.3 Entry Point** (~1 hour)

- [ ] Button on outputs page: "Quick Rate (18 unrated)"
- [ ] Only shows when there are unrated outputs
- [ ] Prominent, primary button styling

**4.4 Batch Complete Flow** (~1 hour)

- [ ] When all rated, show success modal
- [ ] "All outputs rated! 🎉"
- [ ] Button: "Analyze Patterns" (goes to extraction)
- [ ] Button: "Review Ratings" (back to outputs list)

**Validation Criteria:**
✅ Can rate 50 outputs in under 5 minutes
✅ Flow feels natural, no friction
✅ Keyboard shortcuts work perfectly
✅ Progress always visible
✅ Easy to fix mistakes (go back)

**Before moving to Sprint 5:** Rate 30-50 real outputs. Should be almost meditative - fast, focused, effortless.

---

## Sprint 5: Polish & Refinement (1-2 days)

**Goal:** Fix rough edges, add missing feedback

### Tasks

**5.1 Visual Polish** (~2 hours)

- [ ] Hover states on all interactive elements
- [ ] Loading states for async operations
- [ ] Success/error toasts for key actions
- [ ] Smooth transitions between views

**5.2 Empty States** (~1 hour)

- [ ] No unrated outputs: Show success message
- [ ] No rated outputs: Show "Start rating" CTA
- [ ] No scenarios: Show "Add scenarios first"

**5.3 Keyboard Shortcut Help** (~1 hour)

- [ ] Press "?" to show keyboard shortcuts modal
- [ ] List all available shortcuts
- [ ] Context-sensitive (different shortcuts per page)

**5.4 Delete Scenario Confirmation** (~2 hours)

- [ ] Use AlertDialog component (already designed in recommendations)
- [ ] Show what will be deleted (outputs, ratings)
- [ ] Warning: "This cannot be undone"

**5.5 Performance Optimization** (~2 hours)

- [ ] Lazy load output cards (virtualization if >100 outputs)
- [ ] Debounce filter/sort controls
- [ ] Optimize re-renders with React.memo
- [ ] Add loading skeletons for data fetching

**Validation Criteria:**
✅ No janky animations or slow interactions
✅ Clear feedback for all user actions
✅ Works smoothly with 50+ outputs
✅ Keyboard shortcuts are discoverable

---

## Validation Checkpoint: Real-World Test

**After Sprint 5, STOP building and USE the tool:**

### Test Scenario

Pick a real AI prompt you need to work on (ChatGPT flow, customer support, content generation, etc.)

### Steps

1. Create project with 20-30 diverse test scenarios
2. Generate outputs (v1)
3. Rate all outputs using new batch rating interface
4. Review patterns using color-coded view and filters
5. Adjust prompt based on failures you see
6. Retest (v2)
7. Compare v1 vs v2 using version comparison
8. Repeat until satisfied

### Success Criteria

✅ Complete full iteration cycle in under 10 minutes
✅ Patterns are obvious without needing AI clustering
✅ Rating 30 outputs takes <3 minutes
✅ You naturally reach for this tool instead of testing prompts in ChatGPT
✅ You can articulate 3-5 improvements needed based on actual usage

### What to Watch For

- ❌ Any friction in the rating process
- ❌ Missing controls you keep wanting
- ❌ Times you give up and go back to ChatGPT
- ❌ Confusion about what to do next
- ✅ "Flow state" during rating
- ✅ "Aha!" moment when pattern becomes obvious
- ✅ Confidence in iteration speed

**Document findings before building any new features.**

---

## Sprint 6+: Based on Real Usage (TBD)

**Only start this after completing validation checkpoint above.**

Likely priorities based on real usage:

- Export improvements (actual format you need)
- Scenario management (bulk operations, templates)
- Smart retest (just the failures)
- Tag auto-complete
- Additional filters/grouping options
- Performance optimizations

**Do NOT build these speculatively. Build only what validates as necessary through real usage.**

---

## Implementation Guide

### Setup Instructions

1. **Install Dependencies:**

```bash
# For charts (if implementing Success Rate Trend)
npm install recharts

# For date formatting (if implementing Prompt History)
npm install date-fns
```

2. **Database Considerations:**

No database migrations needed for most improvements. They work with existing schema.

3. **Testing Checklist:**

For each improvement:

- [ ] Desktop browser (Chrome, Firefox, Safari)
- [ ] Mobile browser (iOS Safari, Android Chrome)
- [ ] Dark mode compatibility
- [ ] Keyboard navigation (where applicable)
- [ ] Screen reader compatibility (ARIA labels)

### Code Quality Standards

- Use TypeScript for all new components
- Follow existing shadcn/ui patterns
- Add JSDoc comments for complex functions
- Handle loading and error states
- Use proper semantic HTML
- Follow existing file naming conventions

### Performance Considerations

- Use React Suspense for data fetching
- Implement pagination for large lists (> 100 items)
- Lazy load heavy components (charts, dialogs)
- Optimize images and icons
- Use React.memo for expensive renders

---

## Accessibility Notes

All improvements should meet WCAG 2.1 Level AA standards:

- **Keyboard Navigation**: All interactive elements accessible via Tab/Enter/Space
- **Focus Indicators**: Visible focus states for keyboard users
- **ARIA Labels**: Proper labels for screen readers
- **Color Contrast**: Maintain 4.5:1 contrast ratio
- **Error Messages**: Clear, programmatically associated with inputs

---

## User Feedback Integration

Consider adding feedback collection:

```tsx
// components/feedback-widget.tsx
export function FeedbackWidget() {
  return (
    <button className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow">
      💬 Feedback
    </button>
  );
}
```

---

## Conclusion

These improvements maintain Tellah's core strengths while addressing key UX gaps identified in the audit. The priority matrix ensures high-impact changes are implemented first, with quick wins providing immediate user value.

Focus on Phase 1 quick wins to build momentum, then tackle the high-impact features in Phase 2. Save polish items for Phase 3 once core improvements are validated by users.

**Next Steps:**

1. Review and approve priority order
2. Begin Phase 1 implementation
3. Collect user feedback on each improvement
4. Iterate based on usage data

---

## What to Keep vs. What to Cut

### ✅ Enhance (Core Value)

**1. Batch Evaluation Interface**

- Add 20-30 scenarios easily (bulk paste, CSV import)
- Rate outputs with keyboard shortcuts (1-5 keys)
- Visual scanning (color-coded: green=5★, yellow=3-4★, red=1-2★)
- Instant iteration (edit prompt in sidebar, hit "Retest", see results)

**Why:** This is the actual competitive advantage. 10x faster than testing one prompt at a time in ChatGPT.

**2. Failure Clustering (from YOUR feedback)**

- Groups similar failures by root cause
- Uses YOUR feedback text, not inventing insights
- Shows: "8 failures, same issue" with your actual words

**Why:** You're running 20-30 scenarios. Clustering finds patterns across YOUR feedback that you wouldn't easily spot yourself.

**3. Golden Examples Export**

- One-click export to JSON
- Passes + Failures with your ratings
- Clean format ready for test suites

**Why:** Gets you from evaluation to implementation instantly.

**4. Version Comparison**

- See v1 output vs v2 output side-by-side
- Highlight what changed
- Verify your fix worked

**Why:** Core to the iteration loop. Must see if changes worked.

### ❌ Cut or Deprioritize (Not Core Value)

**1. Fancy AI-Generated "Insights"**

- Generic quality specs you don't read
- Long-form recommendations that are fluff
- "Implementation suggestions" (too vague)

**Why:** You see the patterns yourself when looking at 30 outputs at once. AI summaries add cognitive load without insight.

**2. Complex Analytics**

- Trend charts (before you have enough data)
- Success rate dashboards (interesting but not actionable)
- Historical comparisons (nice-to-have, not need-to-have)

**Why:** When you're iterating rapidly, you don't stop to analyze trends. You fix and retest.

**3. Onboarding Flows**

- Interactive tours
- Tooltip overlays
- Help documentation

**Why:** Defer until core UX is solid. If the tool requires extensive onboarding, the UX isn't simple enough yet.

**4. Collaboration Features (for now)**

- Team sharing
- Comments/discussions
- Approval workflows

**Why:** Validate single-user workflow first. Add multiplayer later if there's demand.

### The Real Differentiator

**Every AI eval tool is built for engineers running automated tests.**

**Tellah is built for PMs doing rapid manual evaluation.**

The difference:

- **Engineer tools**: Write test, assert output, pass/fail → automation-first
- **Tellah**: Generate many outputs, see them all, spot patterns, iterate → human-first

Engineers want automation. PMs want **rapid visual pattern recognition.**

### Positioning

**"Eval tool for PMs who need to rapidly test AI prompts"**

The pitch:

- Not for ML engineers (they have Braintrust)
- Not for automated testing (they have CI/CD)
- For PMs doing human evaluation at scale

**Old way:** Test prompt once, adjust, test again = 10+ minutes per iteration

**New way:** Test 30 scenarios at once, spot patterns, iterate = 3 minutes per iteration

**That's 3x iteration speed.** Which means shipping AI features faster.

---

**Document Version:** 2.0
**Last Updated:** December 11, 2025
**Author:** UX Audit Team (Updated with PM co-pilot validation session insights)

"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Ruler,
  MessageSquare,
  Layout,
  FileText,
  AlertTriangle,
} from "lucide-react";
import type { ExtractionCriteria } from "@/types/database";

interface DimensionalAnalysisAccordionProps {
  dimensions: NonNullable<ExtractionCriteria["dimensions"]>;
}

function getConfidenceBadgeVariant(
  confidence: number,
): "default" | "secondary" | "outline" {
  if (confidence > 0.8) return "default";
  if (confidence > 0.6) return "secondary";
  return "outline";
}

export function DimensionalAnalysisAccordion({
  dimensions,
}: DimensionalAnalysisAccordionProps) {
  return (
    <div className="mb-4" id="dimensions">
      <h2 className="text-2xl font-bold mb-4">Dimensional Analysis</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Quality patterns analyzed across 5 dimensions comparing high-rated vs
        low-rated outputs
      </p>

      <Accordion
        type="multiple"
        defaultValue={["length"]}
        className="space-y-2"
      >
        {/* Length Dimension */}
        <AccordionItem value="length" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                <span className="font-semibold">Length</span>
              </div>
              <Badge
                variant={getConfidenceBadgeVariant(
                  dimensions.length.confidence,
                )}
              >
                {(dimensions.length.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {dimensions.length.insight}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>High-Rated (4-5 stars)</span>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
                    <p className="font-medium">
                      {dimensions.length.high_rated_range.min}-
                      {dimensions.length.high_rated_range.max}{" "}
                      {dimensions.length.metric}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Median: {dimensions.length.high_rated_range.median}{" "}
                      {dimensions.length.metric}
                    </p>
                  </div>
                </div>

                {/* Low-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Low-Rated (1-2 stars)</span>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
                    <p className="font-medium">
                      {dimensions.length.low_rated_range.min}-
                      {dimensions.length.low_rated_range.max}{" "}
                      {dimensions.length.metric}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Median: {dimensions.length.low_rated_range.median}{" "}
                      {dimensions.length.metric}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample size metrics */}
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">High-rated samples:</span>
                  <span className="text-foreground">
                    {dimensions.length.sample_size.high}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Low-rated samples:</span>
                  <span className="text-foreground">
                    {dimensions.length.sample_size.low}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tone Dimension */}
        <AccordionItem value="tone" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-semibold">Tone</span>
              </div>
              <Badge
                variant={getConfidenceBadgeVariant(dimensions.tone.confidence)}
              >
                {(dimensions.tone.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Formality: {dimensions.tone.formality.replace("_", " ")},
                Technicality: {dimensions.tone.technicality.replace("_", " ")},
                Sentiment: {dimensions.tone.sentiment}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>High-Rated (4-5 stars)</span>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
                    <p className="text-sm">
                      {dimensions.tone.high_rated_pattern}
                    </p>
                  </div>
                </div>

                {/* Low-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Low-Rated (1-2 stars)</span>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
                    <p className="text-sm">
                      {dimensions.tone.low_rated_pattern}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Formality:</span>
                  <span className="text-foreground">
                    {dimensions.tone.formality.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Technicality:</span>
                  <span className="text-foreground">
                    {dimensions.tone.technicality.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Sentiment:</span>
                  <span className="text-foreground">
                    {dimensions.tone.sentiment}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Structure Dimension */}
        <AccordionItem value="structure" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                <span className="font-semibold">Structure</span>
              </div>
              <Badge
                variant={getConfidenceBadgeVariant(
                  dimensions.structure.confidence,
                )}
              >
                {(dimensions.structure.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {dimensions.structure.insight}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>High-Rated (4-5 stars)</span>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
                    {dimensions.structure.high_rated_includes.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {dimensions.structure.high_rated_includes.map(
                          (elem: string, i: number) => (
                            <li key={i}>&#8226; {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                  </div>
                </div>

                {/* Low-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Low-Rated (1-2 stars)</span>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
                    {dimensions.structure.low_rated_includes.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {dimensions.structure.low_rated_includes.map(
                          (elem: string, i: number) => (
                            <li key={i}>&#8226; {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Content Dimension */}
        <AccordionItem value="content" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold">Content</span>
              </div>
              <Badge
                variant={getConfidenceBadgeVariant(
                  dimensions.content.confidence,
                )}
              >
                {(dimensions.content.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {dimensions.content.insight}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>High-Rated (4-5 stars)</span>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
                    {dimensions.content.high_rated_elements.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {dimensions.content.high_rated_elements.map(
                          (elem: string, i: number) => (
                            <li key={i}>&#8226; {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                      {dimensions.content.citations_present && (
                        <span>&#10003; Citations</span>
                      )}
                      {dimensions.content.examples_present && (
                        <span>&#10003; Examples</span>
                      )}
                      {dimensions.content.disclaimers_present && (
                        <span>&#10003; Disclaimers</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Low-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Low-Rated (1-2 stars)</span>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
                    {dimensions.content.low_rated_elements.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {dimensions.content.low_rated_elements.map(
                          (elem: string, i: number) => (
                            <li key={i}>&#8226; {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Specificity:</span>
                  <span className="text-foreground">
                    {dimensions.content.specificity}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Errors Dimension */}
        <AccordionItem value="errors" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="font-semibold">Errors</span>
              </div>
              <Badge
                variant={getConfidenceBadgeVariant(
                  dimensions.errors.confidence,
                )}
              >
                {(dimensions.errors.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {dimensions.errors.insight}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>High-Rated (4-5 stars)</span>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Minimal errors
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clean, accurate outputs
                    </p>
                  </div>
                </div>

                {/* Low-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Low-Rated (1-2 stars)</span>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
                    <div className="space-y-2 text-sm">
                      {dimensions.errors.hallucinations.count > 0 && (
                        <div>
                          <p className="font-medium">
                            Hallucinations:{" "}
                            {dimensions.errors.hallucinations.count}
                          </p>
                          {dimensions.errors.hallucinations.examples
                            .slice(0, 2)
                            .map((ex: string, i: number) => (
                              <p
                                key={i}
                                className="text-xs text-muted-foreground truncate"
                              >
                                &#8226; {ex}
                              </p>
                            ))}
                        </div>
                      )}
                      {dimensions.errors.refusals.count > 0 && (
                        <div>
                          <p className="font-medium">
                            Refusals: {dimensions.errors.refusals.count}
                          </p>
                        </div>
                      )}
                      {dimensions.errors.formatting_issues.count > 0 && (
                        <div>
                          <p className="font-medium">
                            Formatting:{" "}
                            {dimensions.errors.formatting_issues.count}
                          </p>
                        </div>
                      )}
                      {dimensions.errors.factual_errors.count > 0 && (
                        <div>
                          <p className="font-medium">
                            Factual errors:{" "}
                            {dimensions.errors.factual_errors.count}
                          </p>
                        </div>
                      )}
                      {dimensions.errors.hallucinations.count === 0 &&
                        dimensions.errors.refusals.count === 0 &&
                        dimensions.errors.formatting_issues.count === 0 &&
                        dimensions.errors.factual_errors.count === 0 && (
                          <p className="text-muted-foreground">
                            No errors detected
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

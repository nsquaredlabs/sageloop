import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase";
import { GoldenExamplesTable } from "@/components/golden-examples-table";
import { GoldenExamplesFilters } from "@/components/golden-examples-filters";
import { Button } from "@/components/ui/button";
import { notFound, redirect } from "next/navigation";
import { Star, FileJson, FileText } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { parseId } from "@/lib/utils";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

interface GoldenExamplesPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    tag?: string;
    rating?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function GoldenExamplesPage({
  params,
  searchParams,
}: GoldenExamplesPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // SECURITY: Check authentication in Server Component
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // SECURITY: Verify user has access to this project (RLS enforces this)
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  // SECURITY: Validate and sanitize filter inputs
  const filterSchema = z.object({
    tag: z.string().max(50).optional(),
    rating: z.enum(["4", "5"]).optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  });

  const queryParams = searchParams ? await searchParams : {};
  const validatedFilters = filterSchema.safeParse(queryParams);

  if (!validatedFilters.success) {
    // Invalid filters - log warning
    console.warn("Invalid filter params:", validatedFilters.error);
  }

  // Apply filters from search params (only if validation passed)
  const filters = validatedFilters.success ? validatedFilters.data : {};

  // Fetch golden examples (4-5 star ratings)
  // NOTE: Supabase cannot filter on nested relations, so we need to:
  // 1. Get all scenario IDs for this project
  // 2. Get all output IDs for those scenarios
  // 3. Filter ratings by those output IDs

  // Step 1: Get scenario IDs for this project
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id")
    .eq("project_id", id);

  const scenarioIds = scenarios?.map((s) => s.id) || [];

  if (scenarioIds.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            Golden Examples
          </h1>
          <p className="text-muted-foreground mt-2">
            No scenarios found for this project.
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Get output IDs for those scenarios
  const { data: outputs } = await supabase
    .from("outputs")
    .select("id, scenario_id, output_text")
    .in("scenario_id", scenarioIds);

  const outputIds = outputs?.map((o) => o.id) || [];

  if (outputIds.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            Golden Examples
          </h1>
          <p className="text-muted-foreground mt-2">
            No outputs generated yet for this project.
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Fetch ratings for those outputs (4-5 stars only)
  let ratingsQuery = supabase
    .from("ratings")
    .select("id, stars, feedback_text, tags, created_at, output_id")
    .in("output_id", outputIds)
    .gte("stars", 4)
    .order("stars", { ascending: false })
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.rating) {
    ratingsQuery = ratingsQuery.eq("stars", parseInt(filters.rating));
  }
  if (filters.dateFrom) {
    ratingsQuery = ratingsQuery.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    ratingsQuery = ratingsQuery.lte("created_at", filters.dateTo);
  }
  if (filters.tag) {
    ratingsQuery = ratingsQuery.contains("tags", [filters.tag]);
  }

  const { data: ratings, error } = await ratingsQuery;

  if (error) {
    console.error("Error loading golden examples:", error);
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Golden Examples</h1>
          <p className="text-destructive mt-2">Error loading golden examples</p>
        </div>
      </div>
    );
  }

  // Combine ratings with output and scenario data
  const goldenExamples = (ratings || [])
    .map((rating) => {
      const output = outputs?.find((o) => o.id === rating.output_id);
      if (!output) return null;

      const scenario = scenarios?.find((s) => s.id === output.scenario_id);
      if (!scenario) return null;

      // Get full scenario data with input_text
      return {
        ...rating,
        output: {
          id: output.id,
          output_text: output.output_text,
          scenario: {
            id: scenario.id,
            input_text: "", // Will be filled in next step
          },
        },
      };
    })
    .filter((ex) => ex !== null);

  // Fetch full scenario data including input_text
  const { data: fullScenarios } = await supabase
    .from("scenarios")
    .select("id, input_text")
    .in(
      "id",
      scenarioIds.filter((id) =>
        goldenExamples.some((ex) => ex?.output.scenario.id === id),
      ),
    );

  // Update examples with full scenario data
  const completeExamples = goldenExamples
    .map((example) => {
      if (!example) return null;
      const scenario = fullScenarios?.find(
        (s) => s.id === example.output.scenario.id,
      );
      return {
        ...example,
        output: {
          ...example.output,
          scenario: {
            ...example.output.scenario,
            input_text: scenario?.input_text || "",
          },
        },
      };
    })
    .filter((ex) => ex !== null);

  // Get unique tags for filter
  const allTags = completeExamples
    .flatMap((ex) => ex?.tags || [])
    .filter((tag): tag is string => typeof tag === "string");
  const availableTags = Array.from(new Set(allTags)).sort();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
              <Star className="h-8 w-8 text-primary" />
              Golden Examples
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse and export your highest-rated outputs for{" "}
              <span className="font-medium">{project.name}</span> (
              {completeExamples.length} example
              {completeExamples.length !== 1 ? "s" : ""})
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/api/projects/${id}/export?format=json`}>
                <FileJson className="mr-2 h-4 w-4" />
                Export JSON
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/api/projects/${id}/export?format=markdown`}>
                <FileText className="mr-2 h-4 w-4" />
                Export Spec
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <GoldenExamplesFilters
          currentFilters={queryParams}
          availableTags={availableTags}
        />

        <Suspense fallback={<div>Loading...</div>}>
          <GoldenExamplesTable examples={completeExamples as any} />
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { getDb, schema } from "@/lib/db";
import { eq, gte, desc, inArray } from "drizzle-orm";
import { GoldenExamplesTable } from "@/components/golden-examples-table";
import { GoldenExamplesFilters } from "@/components/golden-examples-filters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { notFound } from "next/navigation";
import { Star, FileJson, FileText, Download } from "lucide-react";
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

  const db = getDb();

  const project = db
    .select({ id: schema.projects.id, name: schema.projects.name })
    .from(schema.projects)
    .where(eq(schema.projects.id, id))
    .get();

  if (!project) {
    notFound();
  }

  // Validate and sanitize filter inputs
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
    console.warn("Invalid filter params:", validatedFilters.error);
  }

  const filters = validatedFilters.success ? validatedFilters.data : {};

  // Get scenario IDs for this project
  const scenarios = db
    .select({
      id: schema.scenarios.id,
      input_text: schema.scenarios.input_text,
    })
    .from(schema.scenarios)
    .where(eq(schema.scenarios.project_id, id))
    .all();

  const scenarioIds = scenarios.map((s) => s.id);

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

  // Get outputs for those scenarios
  const outputs = db
    .select({
      id: schema.outputs.id,
      scenario_id: schema.outputs.scenario_id,
      output_text: schema.outputs.output_text,
    })
    .from(schema.outputs)
    .where(inArray(schema.outputs.scenario_id, scenarioIds))
    .all();

  const outputIds = outputs.map((o) => o.id);

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

  // Fetch ratings for those outputs (4-5 stars only)
  let ratingsResult = db
    .select()
    .from(schema.ratings)
    .where(inArray(schema.ratings.output_id, outputIds))
    .all()
    .filter((r) => (r.stars ?? 0) >= 4);

  // Apply filters in JS (SQLite doesn't support complex filter chaining like Supabase)
  if (filters.rating) {
    const ratingNum = parseInt(filters.rating);
    ratingsResult = ratingsResult.filter((r) => r.stars === ratingNum);
  }
  if (filters.dateFrom) {
    ratingsResult = ratingsResult.filter(
      (r) => r.created_at && r.created_at >= filters.dateFrom!,
    );
  }
  if (filters.dateTo) {
    ratingsResult = ratingsResult.filter(
      (r) => r.created_at && r.created_at <= filters.dateTo!,
    );
  }

  // Sort by stars desc, then created_at desc
  ratingsResult.sort((a, b) => {
    if ((b.stars ?? 0) !== (a.stars ?? 0))
      return (b.stars ?? 0) - (a.stars ?? 0);
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  // Combine ratings with output and scenario data
  const completeExamples = ratingsResult
    .map((rating) => {
      const output = outputs.find((o) => o.id === rating.output_id);
      if (!output) return null;

      const scenario = scenarios.find((s) => s.id === output.scenario_id);
      if (!scenario) return null;

      const tags = rating.tags ? (JSON.parse(rating.tags) as string[]) : [];

      // Apply tag filter
      if (filters.tag && !tags.includes(filters.tag)) return null;

      return {
        id: rating.id,
        stars: rating.stars,
        feedback_text: rating.feedback_text,
        tags,
        created_at: rating.created_at,
        output_id: rating.output_id,
        output: {
          id: output.id,
          output_text: output.output_text,
          scenario: {
            id: scenario.id,
            input_text: scenario.input_text,
          },
        },
      };
    })
    .filter((ex): ex is NonNullable<typeof ex> => ex !== null);

  // Get unique tags for filter
  const allTags = completeExamples.flatMap((ex) => ex.tags);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={`/api/projects/${id}/export?format=json`}>
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON Format
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/api/projects/${id}/export?format=markdown`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Markdown Spec
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={`/api/projects/${id}/export?format=pytest`}>
                  <FileText className="mr-2 h-4 w-4" />
                  pytest (Python)
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/api/projects/${id}/export?format=jest`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Jest (TypeScript)
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        <GoldenExamplesFilters
          currentFilters={queryParams}
          availableTags={availableTags}
        />

        <Suspense fallback={<div>Loading...</div>}>
          <GoldenExamplesTable
            examples={
              completeExamples as Parameters<
                typeof GoldenExamplesTable
              >[0]["examples"]
            }
          />
        </Suspense>
      </div>
    </div>
  );
}

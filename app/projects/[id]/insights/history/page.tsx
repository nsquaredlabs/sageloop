import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { interpretSuccessRate, interpretConfidence } from "@/lib/metrics";
import { parseId } from "@/lib/utils";

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExtractionHistoryPage({
  params,
}: HistoryPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  const db = getDb();

  const project = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, id))
    .get();

  if (!project) {
    notFound();
  }

  const extractions = db
    .select()
    .from(schema.extractions)
    .where(eq(schema.extractions.project_id, id))
    .orderBy(desc(schema.extractions.created_at))
    .all();

  const extractionIds = extractions.map((e) => e.id);
  const allMetrics =
    extractionIds.length > 0
      ? db
          .select()
          .from(schema.metrics)
          .where(
            extractionIds.length === 1
              ? eq(schema.metrics.extraction_id, extractionIds[0])
              : // For multiple, we fetch all and filter in JS
                eq(schema.metrics.project_id, id),
          )
          .all()
      : [];

  return (
    <div>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Extraction History
          </h1>
          <p className="text-muted-foreground mt-2">
            View how quality criteria evolved over time
          </p>
        </div>

        {extractions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No extraction history
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Run pattern extraction to create your first analysis snapshot.
              </p>
              <Button asChild>
                <Link href={`/projects/${id}/outputs`}>Go to Outputs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {extractions.map((extraction) => {
              const metric = allMetrics.find(
                (m) => m.extraction_id === extraction.id,
              );
              const successRate = metric?.success_rate || 0;
              const confidenceScore = extraction.confidence_score || 0;
              const ratedCount = extraction.rated_output_count || 0;
              const successInterpretation = interpretSuccessRate(successRate);
              const confidenceInterpretation = interpretConfidence(
                confidenceScore,
                ratedCount,
              );

              return (
                <Link
                  key={extraction.id}
                  href={`/projects/${id}/insights?extractionId=${extraction.id}`}
                  className="block mb-4"
                >
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {extraction.created_at
                            ? new Date(
                                extraction.created_at,
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Unknown date"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">
                            Rated Outputs:
                          </span>
                          <span className="text-foreground font-semibold">
                            {ratedCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">
                            Success Rate:
                          </span>
                          <span className="text-foreground font-semibold">
                            {(successRate * 100).toFixed(0)}%
                          </span>
                          <Badge variant={successInterpretation.variant}>
                            {successInterpretation.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">
                            Confidence:
                          </span>
                          <span className="text-foreground font-semibold">
                            {(confidenceScore * 100).toFixed(0)}%
                          </span>
                          <Badge variant={confidenceInterpretation.variant}>
                            {confidenceInterpretation.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

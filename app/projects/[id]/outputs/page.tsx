import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { AnalyzePatternsButton } from '@/components/analyze-patterns-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OutputsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ retest?: string; version?: string; count?: string }>;
}

export default async function OutputsPage({ params, searchParams }: OutputsPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Get search params for retest success message
  const queryParams = searchParams ? await searchParams : {};
  const retestSuccess = queryParams.retest === 'success';
  const retestVersion = queryParams.version;
  const retestCount = queryParams.count;

  // Use authenticated server client - enforces RLS
  const supabase = await createServerClient();

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch scenarios with their outputs and ratings
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select(`
      *,
      outputs (
        id,
        output_text,
        generated_at,
        ratings (
          id,
          stars,
          feedback_text,
          created_at,
          metadata
        )
      )
    `)
    .eq('project_id', id)
    .order('order', { ascending: true });

  const modelConfig = project.model_config as {
    model?: string;
    temperature?: number;
    system_prompt?: string;
  };

  // Get the most recent output for each scenario
  const scenariosWithLatestOutput = scenarios?.map((scenario: any) => ({
    ...scenario,
    latestOutput: scenario.outputs?.[scenario.outputs.length - 1] || null,
  }));

  const totalOutputs = scenariosWithLatestOutput?.filter(s => s.latestOutput).length || 0;
  const ratedOutputs = scenariosWithLatestOutput?.filter(
    s => s.latestOutput?.ratings && s.latestOutput.ratings.length > 0
  ).length || 0;

  // Count carried-forward ratings that need review
  const needsReviewCount = scenariosWithLatestOutput?.filter(s => {
    const rating = s.latestOutput?.ratings?.[0];
    const metadata = rating?.metadata as { carried_forward?: boolean; needs_review?: boolean } | null;
    return metadata?.carried_forward === true && metadata?.needs_review === true;
  }).length || 0;

  return (
    <div>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">Outputs</h1>
                <Badge variant="secondary">{modelConfig.model || 'gpt-4'}</Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                Review and rate AI outputs
              </p>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Generated:</span> {totalOutputs}/{scenarios?.length || 0} outputs
                </div>
                <div>
                  <span className="font-medium">Rated:</span> {ratedOutputs}/{totalOutputs} outputs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Needed Alert - Always show when there are carried-forward ratings needing review */}
        {needsReviewCount > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              {needsReviewCount} output{needsReviewCount !== 1 ? 's' : ''} need{needsReviewCount === 1 ? 's' : ''} review
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {retestSuccess && `Regenerated ${retestCount} outputs with updated prompt (version ${retestVersion}). `}
              These outputs have changed significantly since their last rating. Please review them to ensure the ratings are still accurate.
            </AlertDescription>
          </Alert>
        )}

        {/* Success message for unchanged outputs */}
        {retestSuccess && needsReviewCount === 0 && ratedOutputs > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">Fixes Applied Successfully</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              {retestCount} scenario{retestCount !== '1' ? 's' : ''} regenerated with updated prompt (version {retestVersion}).{' '}
              All outputs remain similar to previous versions - no review needed.
            </AlertDescription>
          </Alert>
        )}

        {/* Outputs List */}
        {scenariosWithLatestOutput && scenariosWithLatestOutput.length > 0 ? (
          <div className="space-y-6">
            {scenariosWithLatestOutput.map((scenario: any, index: number) => {
              const output = scenario.latestOutput;
              const rating = output?.ratings?.[0];
              const metadata = rating?.metadata as {
                carried_forward?: boolean;
                similarity_score?: number;
                needs_review?: boolean;
              } | null;
              const isCarriedForward = metadata?.carried_forward === true;
              const similarityScore = metadata?.similarity_score ?? 1.0;
              const needsReview = metadata?.needs_review === true;

              return (
                <Card key={scenario.id} className="overflow-hidden">
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
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground/30'
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
                                      Output unchanged ({Math.round(similarityScore * 100)}% similar)
                                    </Badge>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <CardTitle className="text-base font-medium">Input</CardTitle>
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

                        {rating?.feedback_text && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">
                              {isCarriedForward ? 'Previous Feedback' : 'Your Feedback'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {rating.feedback_text}
                            </p>
                            {isCarriedForward && needsReview && (
                              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                                <p className="text-xs text-amber-900 dark:text-amber-100">
                                  <strong>Review recommended:</strong> The output has changed since this rating. Please review to confirm the rating is still accurate.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {!rating && (
                          <div className="pt-4 border-t">
                            <Button asChild variant="outline" className="w-full">
                              <Link href={`/projects/${id}/outputs/${output.id}/rate`}>
                                <Star className="mr-2 h-4 w-4" />
                                Rate this output
                              </Link>
                            </Button>
                          </div>
                        )}

                        {rating && isCarriedForward && (
                          <div className="pt-4 border-t">
                            <Button asChild variant="outline" className="w-full" size="sm">
                              <Link href={`/projects/${id}/outputs/${output.id}/rate`}>
                                <Star className="mr-2 h-4 w-4" />
                                {needsReview ? 'Review & update rating' : 'Update rating'}
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
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-lg font-semibold mb-2">No outputs yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Generate outputs from the Overview tab to see them here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {totalOutputs > 0 && ratedOutputs === totalOutputs && (
          <div className="mt-8">
            <AnalyzePatternsButton projectId={String(id)} ratedCount={ratedOutputs} />
          </div>
        )}
      </div>
    </div>
  );
}

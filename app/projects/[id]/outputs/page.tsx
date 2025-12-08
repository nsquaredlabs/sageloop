import { supabaseAdmin } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { AnalyzePatternsButton } from '@/components/analyze-patterns-button';

interface OutputsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OutputsPage({ params }: OutputsPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Fetch project details
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch scenarios with their outputs and ratings
  const { data: scenarios } = await supabaseAdmin
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
          created_at
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

        {/* Outputs List */}
        {scenariosWithLatestOutput && scenariosWithLatestOutput.length > 0 ? (
          <div className="space-y-6">
            {scenariosWithLatestOutput.map((scenario: any, index: number) => {
              const output = scenario.latestOutput;
              const rating = output?.ratings?.[0];

              return (
                <Card key={scenario.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            #{index + 1}
                          </Badge>
                          {rating && (
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
                            <h4 className="text-sm font-medium mb-2">Your Feedback</h4>
                            <p className="text-sm text-muted-foreground">
                              {rating.feedback_text}
                            </p>
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

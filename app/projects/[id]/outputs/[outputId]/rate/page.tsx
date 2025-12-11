import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { RatingForm } from '@/components/rating-form';

interface RateOutputPageProps {
  params: Promise<{ id: string; outputId: string }>;
}

export default async function RateOutputPage({ params }: RateOutputPageProps) {
  const { id: projectIdString, outputId: outputIdString } = await params;
  const projectId = parseId(projectIdString);
  const outputId = parseId(outputIdString);

  // Use authenticated server client - enforces RLS
  const supabase = await createServerClient();

  // Fetch output with scenario and project info
  const { data: output, error: outputError } = await supabase
    .from('outputs')
    .select(`
      *,
      scenario:scenarios (
        id,
        input_text,
        order,
        project:projects (
          id,
          name
        )
      )
    `)
    .eq('id', outputId)
    .single();

  if (outputError || !output || output.scenario?.project?.id !== projectId) {
    notFound();
  }

  // TypeScript doesn't know that notFound() ensures these are non-null
  const scenario = output.scenario!;
  const project = scenario.project!;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/projects/${projectId}/outputs`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Outputs
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">Rate Output</h1>
              <Badge variant="outline" className="font-mono text-xs">
                #{scenario.order}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Evaluating output for <span className="font-medium">{project.name}</span>
            </p>
          </div>
        </div>

        {/* Input/Output Display */}
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scenario Input</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{scenario.input_text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Output</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {output.output_text}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Evaluation</CardTitle>
            <CardDescription>
              Rate this output and provide feedback to help improve the AI's behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RatingForm
              projectId={String(projectId)}
              outputId={String(outputId)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

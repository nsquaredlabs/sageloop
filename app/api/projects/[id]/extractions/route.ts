import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    // Fetch all extractions with their metrics (RLS ensures user has access)
    const { data: extractions, error } = await supabase
      .from('extractions')
      .select(`
        id,
        created_at,
        confidence_score,
        rated_output_count,
        metrics (
          success_rate,
          snapshot_time
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch extractions' },
        { status: 500 }
      );
    }

    // Get scenario count for the project (constant across extractions)
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('id')
      .eq('project_id', projectId);

    const scenarioCount = scenarios?.length || 0;

    // Format response
    const formattedExtractions = extractions?.map(extraction => ({
      id: extraction.id,
      created_at: extraction.created_at,
      confidence_score: extraction.confidence_score,
      success_rate: extraction.metrics?.[0]?.success_rate || 0,
      scenario_count: scenarioCount,
    })) || [];

    return NextResponse.json({ data: formattedExtractions });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

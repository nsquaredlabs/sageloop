import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import type { ModelConfig } from '@/types/database';
import type { GetVersionsResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
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

    // Fetch project details (RLS ensures user has access)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch all prompt iterations for this project
    const { data: iterations, error: iterationsError } = await supabase
      .from('prompt_iterations')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false });

    if (iterationsError) {
      console.error('Failed to fetch iterations:', iterationsError);
      return NextResponse.json(
        { error: 'Failed to fetch version history' },
        { status: 500 }
      );
    }

    // Add current version if not in iterations
    const modelConfig = project.model_config as unknown as ModelConfig;
    const currentVersion = project.prompt_version || 1;
    const currentSystemPrompt = modelConfig.system_prompt || '';

    // Check if current version is already in iterations
    const hasCurrentVersion = iterations?.some(
      (i) => i.version === currentVersion
    );

    const versions = [
      ...(hasCurrentVersion ? [] : [{
        id: -1,
        project_id: projectId,
        version: currentVersion,
        system_prompt: currentSystemPrompt,
        created_at: project.updated_at,
        parent_version: currentVersion > 1 ? currentVersion - 1 : null,
        improvement_note: 'Current version',
        success_rate_before: null,
        success_rate_after: null,
      }]),
      ...(iterations || []),
    ];

    const response: GetVersionsResponse = {
      data: versions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

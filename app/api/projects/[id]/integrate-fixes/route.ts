import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { generateCompletion } from '@/lib/ai/generation';

// Configuration for fix integration model
// Uses system API key to ensure consistent, high-quality prompt improvements
const FIX_INTEGRATION_MODEL_CONFIG = {
  model: 'gpt-4-turbo' as const,
  temperature: 0.3,
  // Future: could make this configurable to support other providers
  provider: 'openai' as const,
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface FixCluster {
  name: string;
  root_cause: string;
  suggested_fix: string;
}

export async function POST(request: Request, { params }: RouteParams) {
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
    const body = await request.json();
    const { currentPrompt, clusters } = body as { currentPrompt: string; clusters: FixCluster[] };

    if (!currentPrompt || !clusters || !Array.isArray(clusters)) {
      return NextResponse.json(
        { error: 'currentPrompt and clusters are required' },
        { status: 400 }
      );
    }

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Use GPT-4 to intelligently integrate all fixes into the prompt
    // Note: Fix integration uses system API key (not user's) to ensure consistent quality
    const result = await generateCompletion({
      provider: FIX_INTEGRATION_MODEL_CONFIG.provider,
      model: FIX_INTEGRATION_MODEL_CONFIG.model,
      temperature: FIX_INTEGRATION_MODEL_CONFIG.temperature,
      systemPrompt: `You are an expert at improving system prompts for LLMs. Your task is to integrate multiple suggested fixes into an existing system prompt in a coherent, natural way.

IMPORTANT GUIDELINES:
1. **Integrate, don't append**: The fixes should be woven into the existing prompt structure, not just added at the end
2. **Maintain prompt style**: Keep the tone, format, and organization of the original prompt
3. **Be specific**: Use the exact language from the suggested fixes when possible
4. **Avoid duplication**: If the prompt already addresses a fix partially, enhance it rather than repeat
5. **Preserve structure**: If the prompt has rules/examples/format sections, add fixes to the appropriate section
6. **Make it natural**: The updated prompt should read as if written by one person, not cobbled together

Return ONLY the updated system prompt, with no explanation or commentary.`,
      userMessage: `Current System Prompt:
"""
${currentPrompt}
"""

Fixes to Integrate (${clusters.length}):
${clusters.map((c, i) => `
${i + 1}. ${c.name}
   Root Cause: ${c.root_cause}
   Fix: ${c.suggested_fix}
`).join('\n')}

Integrate all ${clusters.length} fixes into the system prompt in a natural, coherent way. Return ONLY the updated prompt.`,
      apiKey: undefined, // Use system key from env
    });

    const updatedPrompt = result.text || currentPrompt;

    return NextResponse.json({
      updatedPrompt,
      fixesApplied: clusters.length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

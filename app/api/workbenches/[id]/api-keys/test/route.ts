import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Test API key validity
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

    const { id: workbenchId } = await params;
    const body = await request.json();
    const { provider } = body;

    if (!provider || !['openai', 'anthropic'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "openai" or "anthropic"' },
        { status: 400 }
      );
    }

    // Verify user has access to this workbench
    const { data: workbench, error: workbenchError } = await supabase
      .from('workbenches')
      .select('id')
      .eq('id', workbenchId)
      .single();

    if (workbenchError || !workbench) {
      return NextResponse.json(
        { error: 'Workbench not found or access denied' },
        { status: 404 }
      );
    }

    // Get API keys
    const { data: apiKeys, error: keysError } = await supabase
      .rpc('get_workbench_api_keys', { workbench_uuid: workbenchId });

    if (keysError || !apiKeys) {
      return NextResponse.json(
        { error: 'Failed to retrieve API keys' },
        { status: 500 }
      );
    }

    const apiKey = (apiKeys as Record<string, string>)[provider];

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: `No ${provider} API key configured` },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request
    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });

        // Make a minimal request to validate the key
        await openai.models.list();

        return NextResponse.json({ valid: true });
      } else if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey });

        // Make a minimal completion request
        await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });

        return NextResponse.json({ valid: true });
      }
    } catch (error: any) {
      console.error(`${provider} API key test failed:`, error);

      // Parse error message for user-friendly response
      let errorMessage = 'Invalid API key';

      if (error.status === 401) {
        errorMessage = 'Invalid API key - authentication failed';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded - key is valid but quota exceeded';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json({
        valid: false,
        error: errorMessage,
      });
    }

    return NextResponse.json(
      { error: 'Unknown provider' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface BulkScenarioInput {
  input_text: string;
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
    const { scenarios } = body;

    // Validate required fields
    if (!scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json(
        { error: 'scenarios array is required' },
        { status: 400 }
      );
    }

    if (scenarios.length === 0) {
      return NextResponse.json(
        { error: 'At least one scenario is required' },
        { status: 400 }
      );
    }

    // Validate each scenario
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      if (!scenario.input_text || typeof scenario.input_text !== 'string') {
        return NextResponse.json(
          { error: `Scenario at index ${i} is missing or has invalid input_text` },
          { status: 400 }
        );
      }
      if (scenario.input_text.trim().length === 0) {
        return NextResponse.json(
          { error: `Scenario at index ${i} has empty input_text` },
          { status: 400 }
        );
      }
    }

    // Get the current max order for this project
    const { data: maxOrderData } = await supabase
      .from('scenarios')
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = maxOrderData ? maxOrderData.order + 1 : 1;

    // Prepare bulk insert data
    const scenariosToInsert = scenarios.map((scenario: BulkScenarioInput) => ({
      project_id: projectId,
      input_text: scenario.input_text.trim(),
      order: nextOrder++
    }));

    // Insert all scenarios at once
    const { data, error } = await supabase
      .from('scenarios')
      .insert(scenariosToInsert)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create scenarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      count: data.length
    }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

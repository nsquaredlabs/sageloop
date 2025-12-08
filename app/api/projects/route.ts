import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, model_config } = body;

    // Validate required fields
    if (!name || !model_config) {
      return NextResponse.json(
        { error: 'Name and model_config are required' },
        { status: 400 }
      );
    }

    // Validate model_config structure
    if (!model_config.model) {
      return NextResponse.json(
        { error: 'model_config.model is required' },
        { status: 400 }
      );
    }

    // Get user's first workbench
    const { data: userWorkbenches } = await supabase
      .from('user_workbenches')
      .select('workbench_id')
      .limit(1)
      .single();

    if (!userWorkbenches) {
      return NextResponse.json(
        { error: 'No workbench found for user' },
        { status: 400 }
      );
    }

    // Insert project into database
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description: description || null,
        model_config,
        workbench_id: userWorkbenches.workbench_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // RLS automatically filters by user's workbenches
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

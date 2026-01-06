import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Check which API keys are configured (without returning actual keys)
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workbenchId } = await params;

    // Verify user has access to this workbench (RLS will handle this)
    const { data: workbench, error: workbenchError } = await supabase
      .from("workbenches")
      .select("id")
      .eq("id", workbenchId)
      .single();

    if (workbenchError || !workbench) {
      return NextResponse.json(
        { error: "Workbench not found or access denied" },
        { status: 404 },
      );
    }

    // Use helper function to check configured providers
    const { data: configured, error: checkError } = await supabase.rpc(
      "check_workbench_api_keys",
      { workbench_uuid: workbenchId },
    );

    if (checkError) {
      console.error("Error checking API keys:", checkError);
      return NextResponse.json(
        { error: "Failed to check API keys" },
        { status: 500 },
      );
    }

    return NextResponse.json({ configured: configured || {} });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Save/update API keys
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workbenchId } = await params;
    const body = await request.json();
    const { openai, anthropic } = body;

    // Validate at least one key is provided
    if (!openai && !anthropic) {
      return NextResponse.json(
        { error: "At least one API key is required" },
        { status: 400 },
      );
    }

    // Verify user has access to this workbench
    const { data: workbench, error: workbenchError } = await supabase
      .from("workbenches")
      .select("id")
      .eq("id", workbenchId)
      .single();

    if (workbenchError || !workbench) {
      return NextResponse.json(
        { error: "Workbench not found or access denied" },
        { status: 404 },
      );
    }

    // Get existing keys to merge with new ones
    const { data: existingKeys } = await supabase.rpc(
      "get_workbench_api_keys",
      { workbench_uuid: workbenchId },
    );

    // Merge new keys with existing ones
    const existingKeysObj =
      (existingKeys as Record<string, string> | null) || {};
    const updatedKeys: Record<string, string> = {
      ...existingKeysObj,
      ...(openai !== undefined && { openai }),
      ...(anthropic !== undefined && { anthropic }),
    };

    // Save encrypted keys using helper function
    const { error: saveError } = await supabase.rpc("set_workbench_api_keys", {
      workbench_uuid: workbenchId,
      api_keys_json: updatedKeys,
    });

    if (saveError) {
      console.error("Error saving API keys:", saveError);
      return NextResponse.json(
        { error: "Failed to save API keys" },
        { status: 500 },
      );
    }

    // Return which providers are now configured
    const { data: configured } = await supabase.rpc(
      "check_workbench_api_keys",
      { workbench_uuid: workbenchId },
    );

    return NextResponse.json({
      success: true,
      configured: configured || {},
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a specific API key
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workbenchId } = await params;
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider || !["openai", "anthropic"].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "openai" or "anthropic"' },
        { status: 400 },
      );
    }

    // Verify user has access to this workbench
    const { data: workbench, error: workbenchError } = await supabase
      .from("workbenches")
      .select("id")
      .eq("id", workbenchId)
      .single();

    if (workbenchError || !workbench) {
      return NextResponse.json(
        { error: "Workbench not found or access denied" },
        { status: 404 },
      );
    }

    // Get existing keys
    const { data: existingKeys } = await supabase.rpc(
      "get_workbench_api_keys",
      { workbench_uuid: workbenchId },
    );

    const existingKeysObj =
      (existingKeys as Record<string, string> | null) || {};

    if (!existingKeys || !existingKeysObj[provider]) {
      return NextResponse.json(
        { error: `No ${provider} API key found` },
        { status: 404 },
      );
    }

    // Remove the specified provider key
    const updatedKeys: Record<string, string> = { ...existingKeysObj };
    delete updatedKeys[provider];

    // If no keys remain, set to null to clear the encrypted field
    if (Object.keys(updatedKeys).length === 0) {
      const { error: clearError } = await supabase
        .from("workbenches")
        .update({ encrypted_api_keys: null })
        .eq("id", workbenchId);

      if (clearError) {
        console.error("Error clearing API keys:", clearError);
        return NextResponse.json(
          { error: "Failed to clear API keys" },
          { status: 500 },
        );
      }
    } else {
      // Save updated keys without the removed provider
      const { error: saveError } = await supabase.rpc(
        "set_workbench_api_keys",
        {
          workbench_uuid: workbenchId,
          api_keys_json: updatedKeys,
        },
      );

      if (saveError) {
        console.error("Error updating API keys:", saveError);
        return NextResponse.json(
          { error: "Failed to update API keys" },
          { status: 500 },
        );
      }
    }

    // Return updated configuration
    const { data: configured } = await supabase.rpc(
      "check_workbench_api_keys",
      { workbench_uuid: workbenchId },
    );

    return NextResponse.json({
      success: true,
      configured: configured || {},
      message: `${provider === "openai" ? "OpenAI" : "Anthropic"} API key removed. Projects will now use the free tier model (GPT-5 Nano).`,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

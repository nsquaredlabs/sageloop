/**
 * POST /api/onboarding/complete
 *
 * Marks onboarding as completed in user metadata.
 * Called when user finishes Step 3 of the onboarding wizard.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleApiError, UnauthorizedError } from "@/lib/api/errors";

export async function POST() {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Update user metadata using admin client
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
      });

    if (updateError) {
      console.error("Failed to mark onboarding complete:", updateError);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 },
      );
    }

    // Log analytics event
    console.log("[Onboarding] Completed", {
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

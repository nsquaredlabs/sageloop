/**
 * POST /api/onboarding/reset
 *
 * Resets onboarding state for testing or re-learning.
 * Called from settings page when user wants to see the wizard again.
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

    // Reset user metadata using admin client
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          onboarding_completed: false,
          onboarding_completed_at: null,
          onboarding_skipped: false,
          onboarding_skipped_at: null,
          onboarding_skipped_step: null,
        },
      });

    if (updateError) {
      console.error("Failed to reset onboarding:", updateError);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 },
      );
    }

    // Log analytics event
    console.log("[Onboarding] Reset", {
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

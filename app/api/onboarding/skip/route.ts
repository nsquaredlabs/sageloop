/**
 * POST /api/onboarding/skip
 *
 * Tracks when a user skips onboarding and from which step.
 * Called when user clicks "Skip onboarding" at any step.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  handleApiError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/api/errors";

const skipSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export async function POST(request: Request) {
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

    // Validate request body
    const body = await request.json();
    const validation = skipSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError("Invalid step number", validation.error.issues);
    }

    const { step } = validation.data;

    // Update user metadata using admin client
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          onboarding_skipped: true,
          onboarding_skipped_at: new Date().toISOString(),
          onboarding_skipped_step: step,
        },
      });

    if (updateError) {
      console.error("Failed to mark onboarding skipped:", updateError);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 },
      );
    }

    // Log analytics event
    console.log("[Onboarding] Skipped", {
      user_id: user.id,
      step,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

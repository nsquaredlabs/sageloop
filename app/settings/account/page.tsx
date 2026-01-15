"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      const response = await fetch("/api/onboarding/reset", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset onboarding");
      }

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (error) {
      console.error("Reset onboarding failed:", error);
      setResetError(
        error instanceof Error
          ? error.message
          : "Failed to reset onboarding. Please try again.",
      );
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Account Preferences</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reset Onboarding Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-medium">Reset Onboarding</p>
              <p className="text-sm text-muted-foreground">
                Go through the onboarding wizard again. Useful for testing or
                re-learning.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isResetting}>
                  {isResetting ? "Resetting..." : "Reset Onboarding"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Onboarding?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your onboarding status and take you to the
                    onboarding wizard. Your existing projects and data will not
                    be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetOnboarding}>
                    Reset & Start Onboarding
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {resetError && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {resetError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

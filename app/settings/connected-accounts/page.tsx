"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  signInWithGoogle,
  signInWithGithub,
  disconnectOAuthProvider,
  type OAuthProvider,
} from "@/lib/auth/oauth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GoogleIcon,
  GitHubIcon,
  EmailIcon,
  SpinnerIcon,
} from "@/components/icons/providers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConnectedAccount {
  provider: OAuthProvider | "email";
  email?: string;
  connected: boolean;
}

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [disconnectConfirm, setDisconnectConfirm] =
    useState<OAuthProvider | null>(null);

  // Fetch connected accounts on mount
  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPageLoading(false);
        return;
      }

      const identities = user.identities || [];

      setAccounts([
        {
          provider: "google",
          email: identities.find((i) => i.provider === "google")?.identity_data
            ?.email as string | undefined,
          connected: identities.some((i) => i.provider === "google"),
        },
        {
          provider: "github",
          email: identities.find((i) => i.provider === "github")?.identity_data
            ?.email as string | undefined,
          connected: identities.some((i) => i.provider === "github"),
        },
        {
          provider: "email",
          email: user.email,
          connected: identities.some((i) => i.provider === "email"),
        },
      ]);
      setPageLoading(false);
    }

    fetchAccounts();
  }, []);

  const connectedCount = accounts.filter((a) => a.connected).length;

  const handleConnect = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      // User will be redirected to OAuth provider
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to connect ${provider}`,
      );
      setLoading(null);
    }
  };

  const handleDisconnect = async (provider: OAuthProvider) => {
    // Check if this is the last auth method
    if (connectedCount <= 1) {
      setError(
        "You must have at least one sign-in method. Please set a password or connect another account first.",
      );
      setDisconnectConfirm(null);
      return;
    }

    setLoading(provider);
    setError(null);
    setDisconnectConfirm(null);

    try {
      await disconnectOAuthProvider(provider);
      // Update local state
      setAccounts((prev) =>
        prev.map((a) =>
          a.provider === provider
            ? { ...a, connected: false, email: undefined }
            : a,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to disconnect ${provider}`,
      );
    } finally {
      setLoading(null);
    }
  };

  const getProviderIcon = (provider: OAuthProvider | "email") => {
    switch (provider) {
      case "google":
        return <GoogleIcon className="w-6 h-6" />;
      case "github":
        return <GitHubIcon className="w-6 h-6" />;
      case "email":
        return <EmailIcon className="w-6 h-6" />;
    }
  };

  const getProviderName = (provider: OAuthProvider | "email") => {
    switch (provider) {
      case "google":
        return "Google";
      case "github":
        return "GitHub";
      case "email":
        return "Email & Password";
    }
  };

  if (pageLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex items-center justify-center h-64">
          <SpinnerIcon className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Connected Accounts</h1>
        <p className="text-muted-foreground">
          Manage how you sign in to Sageloop
        </p>
      </div>

      {error && (
        <div
          className="mb-6 bg-destructive/10 text-destructive text-sm p-3 rounded-md"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.provider} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getProviderIcon(account.provider)}
                <div>
                  <p className="font-medium">
                    {getProviderName(account.provider)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.connected
                      ? account.email || "Connected"
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <div>
                {account.provider === "email" ? (
                  account.connected ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings/password">Change password</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings/password">Set password</Link>
                    </Button>
                  )
                ) : account.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDisconnectConfirm(account.provider as OAuthProvider)
                    }
                    disabled={loading !== null}
                  >
                    {loading === account.provider ? (
                      <>
                        <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleConnect(account.provider as OAuthProvider)
                    }
                    disabled={loading !== null}
                  >
                    {loading === account.provider ? (
                      <>
                        <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Warning about minimum auth methods */}
      <div className="mt-6 p-4 bg-muted rounded-md flex items-start gap-3">
        <div className="text-lg" aria-hidden="true">
          !
        </div>
        <p className="text-sm text-muted-foreground">
          You must have at least one sign-in method enabled. If you want to
          disconnect an account, make sure you have another way to sign in
          first.
        </p>
      </div>

      {/* Disconnect confirmation dialog */}
      <AlertDialog
        open={disconnectConfirm !== null}
        onOpenChange={(open) => !open && setDisconnectConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {disconnectConfirm} account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sign in with your{" "}
              {disconnectConfirm} account. Make sure you have another sign-in
              method configured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                disconnectConfirm && handleDisconnect(disconnectConfirm)
              }
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

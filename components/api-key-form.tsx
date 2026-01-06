"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, Eye, EyeOff, Trash2 } from "lucide-react";
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

interface ApiKeyFormProps {
  workbenchId: string;
  initialConfigured: {
    openai?: boolean;
    anthropic?: boolean;
  };
}

export function ApiKeyForm({
  workbenchId,
  initialConfigured,
}: ApiKeyFormProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(initialConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<"openai" | "anthropic" | null>(
    null,
  );
  const [testResults, setTestResults] = useState<{
    openai?: { valid: boolean; error?: string };
    anthropic?: { valid: boolean; error?: string };
  }>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<
    "openai" | "anthropic" | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (provider: "openai" | "anthropic") => {
    setIsDeleting(true);
    setSaveMessage(null);

    try {
      const response = await fetch(
        `/api/workbenches/${workbenchId}/api-keys?provider=${provider}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete API key");
      }

      const result = await response.json();
      setIsConfigured(result.configured);
      setSaveMessage(result.message || "API key deleted successfully");

      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to delete API key",
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialog(null);
    }
  };

  const handleSave = async () => {
    if (!openaiKey && !anthropicKey) {
      setSaveMessage("Please enter at least one API key");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/workbenches/${workbenchId}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...(openaiKey && { openai: openaiKey }),
          ...(anthropicKey && { anthropic: anthropicKey }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save API keys");
      }

      const result = await response.json();
      setIsConfigured(result.configured);
      setSaveMessage("API keys saved successfully");

      // Clear input fields after successful save
      setOpenaiKey("");
      setAnthropicKey("");
      setShowOpenaiKey(false);
      setShowAnthropicKey(false);

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to save API keys",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (provider: "openai" | "anthropic") => {
    setIsTesting(provider);
    setTestResults({ ...testResults, [provider]: undefined });

    try {
      const response = await fetch(
        `/api/workbenches/${workbenchId}/api-keys/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ provider }),
        },
      );

      const result = await response.json();
      setTestResults({ ...testResults, [provider]: result });
    } catch (err) {
      setTestResults({
        ...testResults,
        [provider]: {
          valid: false,
          error: err instanceof Error ? err.message : "Test failed",
        },
      });
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* OpenAI API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          {isConfigured.openai && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Configured
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="openai-key"
              type={showOpenaiKey ? "text" : "password"}
              placeholder={isConfigured.openai ? "sk-...****" : "sk-..."}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showOpenaiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleTest("openai")}
            disabled={!isConfigured.openai || isTesting === "openai"}
          >
            {isTesting === "openai" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test"
            )}
          </Button>
          {isConfigured.openai && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialog("openai")}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {testResults.openai && (
          <div
            className={`text-sm flex items-center gap-1 ${
              testResults.openai.valid ? "text-green-600" : "text-red-600"
            }`}
          >
            {testResults.openai.valid ? (
              <>
                <Check className="h-4 w-4" />
                API key is valid
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                {testResults.openai.error || "API key is invalid"}
              </>
            )}
          </div>
        )}
      </div>

      {/* Anthropic API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="anthropic-key">Claude API Key (Anthropic)</Label>
          {isConfigured.anthropic && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Configured
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="anthropic-key"
              type={showAnthropicKey ? "text" : "password"}
              placeholder={
                isConfigured.anthropic ? "sk-ant-...****" : "sk-ant-..."
              }
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowAnthropicKey(!showAnthropicKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showAnthropicKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleTest("anthropic")}
            disabled={!isConfigured.anthropic || isTesting === "anthropic"}
          >
            {isTesting === "anthropic" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test"
            )}
          </Button>
          {isConfigured.anthropic && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialog("anthropic")}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {testResults.anthropic && (
          <div
            className={`text-sm flex items-center gap-1 ${
              testResults.anthropic.valid ? "text-green-600" : "text-red-600"
            }`}
          >
            {testResults.anthropic.valid ? (
              <>
                <Check className="h-4 w-4" />
                API key is valid
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                {testResults.anthropic.error || "API key is invalid"}
              </>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || (!openaiKey && !anthropicKey)}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save API Keys"
          )}
        </Button>
        {saveMessage && (
          <span
            className={`text-sm ${
              saveMessage.includes("success") ||
              saveMessage.includes("deleted") ||
              saveMessage.includes("removed")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {saveMessage}
          </span>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog !== null}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your{" "}
              {deleteDialog === "openai" ? "OpenAI" : "Anthropic"} API key?
              <br />
              <br />
              <strong>
                Any projects configured to use{" "}
                {deleteDialog === "openai"
                  ? "OpenAI models (GPT-4, GPT-5, etc.)"
                  : "Claude models"}{" "}
                will automatically fall back to the free tier model (GPT-5 Nano)
              </strong>{" "}
              when generating outputs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Key"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

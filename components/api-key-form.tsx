"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";

interface ApiKeyFormProps {
  initialConfigured: {
    openai?: boolean;
    anthropic?: boolean;
  };
}

export function ApiKeyForm({ initialConfigured }: ApiKeyFormProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(initialConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!openaiKey && !anthropicKey) {
      setSaveMessage("Please enter at least one API key");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/settings/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(openaiKey && { openai_api_key: openaiKey }),
          ...(anthropicKey && { anthropic_api_key: anthropicKey }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save API keys");
      }

      setIsConfigured({
        openai: openaiKey ? true : isConfigured.openai,
        anthropic: anthropicKey ? true : isConfigured.anthropic,
      });
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
        <div className="relative">
          <Input
            id="openai-key"
            type={showOpenaiKey ? "text" : "password"}
            placeholder={
              isConfigured.openai ? "Enter new key to replace..." : "sk-..."
            }
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
        <div className="relative">
          <Input
            id="anthropic-key"
            type={showAnthropicKey ? "text" : "password"}
            placeholder={
              isConfigured.anthropic
                ? "Enter new key to replace..."
                : "sk-ant-..."
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
              saveMessage.includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ConfigState {
  openai_api_key: string;
  anthropic_api_key: string;
  default_model: string;
  has_openai: boolean;
  has_anthropic: boolean;
}

export default function ApiKeysPage() {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => toast.error("Failed to load config"));
  }, []);

  const handleSave = async () => {
    if (!openaiKey && !anthropicKey) {
      toast.error("Please enter at least one API key");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(openaiKey && { openai_api_key: openaiKey }),
          ...(anthropicKey && { anthropic_api_key: anthropicKey }),
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      toast.success("API keys saved successfully");
      setOpenaiKey("");
      setAnthropicKey("");
      // Refresh config display
      const updated = await fetch("/api/settings/config").then((r) => r.json());
      setConfig(updated);
    } catch {
      toast.error("Failed to save API keys");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Configure your AI provider API keys for local use.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your API keys are stored locally in <code>sageloop.config.yaml</code>{" "}
          and never leave your machine.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure your OpenAI and Anthropic API keys for AI generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              {config?.has_openai && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Configured ({config.openai_api_key})
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="openai-key"
                type={showOpenai ? "text" : "password"}
                placeholder={
                  config?.has_openai ? "Enter new key to replace..." : "sk-..."
                }
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenai ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="anthropic-key">Claude API Key (Anthropic)</Label>
              {config?.has_anthropic && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Configured ({config.anthropic_api_key})
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="anthropic-key"
                type={showAnthropic ? "text" : "password"}
                placeholder={
                  config?.has_anthropic
                    ? "Enter new key to replace..."
                    : "sk-ant-..."
                }
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAnthropic ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where to find API keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">OpenAI</h4>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              platform.openai.com/api-keys →
            </a>
          </div>
          <div>
            <h4 className="font-medium mb-1">Claude (Anthropic)</h4>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              console.anthropic.com/settings/keys →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

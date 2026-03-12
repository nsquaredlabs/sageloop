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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_MODELS } from "@/lib/ai/default-models";

interface ConfigState {
  openai_api_key: string;
  anthropic_api_key: string;
  output_model: string;
  system_model: string;
  has_openai: boolean;
  has_anthropic: boolean;
}

export default function ApiKeysPage() {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [outputModel, setOutputModel] = useState("");
  const [systemModel, setSystemModel] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [isSavingModels, setIsSavingModels] = useState(false);

  useEffect(() => {
    fetch("/api/settings/config")
      .then((r) => r.json())
      .then((data: ConfigState) => {
        setConfig(data);
        // Only restore saved model if its provider is still configured
        const isProviderConfigured = (modelId: string) => {
          const openaiModel = SUPPORTED_MODELS.find(
            (m) => m.id === modelId && m.provider === "openai",
          );
          const anthropicModel = SUPPORTED_MODELS.find(
            (m) => m.id === modelId && m.provider === "anthropic",
          );
          if (openaiModel) return data.has_openai;
          if (anthropicModel) return data.has_anthropic;
          return false;
        };
        setOutputModel(
          isProviderConfigured(data.output_model) ? data.output_model : "",
        );
        setSystemModel(
          isProviderConfigured(data.system_model) ? data.system_model : "",
        );
      })
      .catch(() => toast.error("Failed to load config"));
  }, []);

  const handleSaveKeys = async () => {
    if (!openaiKey && !anthropicKey) {
      toast.error("Please enter at least one API key");
      return;
    }
    setIsSavingKeys(true);
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
      const updated: ConfigState = await fetch("/api/settings/config").then(
        (r) => r.json(),
      );
      setConfig(updated);
      const isProviderConfiguredUpdated = (modelId: string) => {
        const openaiModel = SUPPORTED_MODELS.find(
          (m) => m.id === modelId && m.provider === "openai",
        );
        const anthropicModel = SUPPORTED_MODELS.find(
          (m) => m.id === modelId && m.provider === "anthropic",
        );
        if (openaiModel) return updated.has_openai;
        if (anthropicModel) return updated.has_anthropic;
        return false;
      };
      setOutputModel(
        isProviderConfiguredUpdated(updated.output_model)
          ? updated.output_model
          : "",
      );
      setSystemModel(
        isProviderConfiguredUpdated(updated.system_model)
          ? updated.system_model
          : "",
      );
    } catch {
      toast.error("Failed to save API keys");
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleSaveModels = async () => {
    setIsSavingModels(true);
    try {
      const response = await fetch("/api/settings/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          output_model: outputModel,
          system_model: systemModel,
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      toast.success("Model settings saved");
      const updated: ConfigState = await fetch("/api/settings/config").then(
        (r) => r.json(),
      );
      setConfig(updated);
    } catch {
      toast.error("Failed to save model settings");
    } finally {
      setIsSavingModels(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure API keys and models for local use.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your configuration is stored locally in{" "}
          <code>sageloop.config.yaml</code> and never leaves your machine.
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
            onClick={handleSaveKeys}
            disabled={isSavingKeys || (!openaiKey && !anthropicKey)}
          >
            {isSavingKeys ? (
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
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>
            Choose which models to use for output generation and system
            operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Output model */}
          <div className="space-y-2">
            <Label htmlFor="output-model">Output Model</Label>
            <p className="text-xs text-muted-foreground">
              The model you are testing your prompts with.
            </p>
            <Select value={outputModel} onValueChange={setOutputModel}>
              <SelectTrigger id="output-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.filter((m) => {
                  if (m.provider === "openai") return config?.has_openai;
                  if (m.provider === "anthropic") return config?.has_anthropic;
                  return false;
                }).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System model */}
          <div className="space-y-2">
            <Label htmlFor="system-model">System Model</Label>
            <p className="text-xs text-muted-foreground">
              Used for internal operations: pattern extraction and prompt fix
              integration.
            </p>
            <Select value={systemModel} onValueChange={setSystemModel}>
              <SelectTrigger id="system-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.filter((m) => {
                  if (m.provider === "openai") return config?.has_openai;
                  if (m.provider === "anthropic") return config?.has_anthropic;
                  return false;
                }).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSaveModels} disabled={isSavingModels}>
            {isSavingModels ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Model Settings"
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

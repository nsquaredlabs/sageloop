"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
}

interface NewProjectFormProps {
  configured: {
    openai: boolean;
    anthropic: boolean;
  };
  workbenchId?: string;
}

export function NewProjectForm({}: NewProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // Users can always create projects (free tier available if no keys)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    model: "",
    systemPrompt: "",
  });

  // Fetch available models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();

        if (data.models) {
          setModels(data.models);
          // Set default model to first available
          if (data.models.length > 0 && !formData.model) {
            setFormData((prev) => ({ ...prev, model: data.models[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch models:", err);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          model_config: {
            model: formData.model,
            system_prompt: formData.systemPrompt,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const { data } = await response.json();
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground mt-2">
            Create a new AI evaluation project
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Configure your evaluation project and AI model settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Assistant"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What are you evaluating in this project?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Combobox
                  options={models.map((model) => ({
                    value: model.id,
                    label: `${model.name} (${model.provider})`,
                  }))}
                  value={formData.model}
                  onValueChange={(value) =>
                    setFormData({ ...formData, model: value })
                  }
                  placeholder={
                    loadingModels ? "Loading models..." : "Select a model"
                  }
                  searchPlaceholder="Search models..."
                  emptyText="No models found."
                  disabled={loadingModels || models.length === 0}
                />
                <p className="text-xs text-muted-foreground">
                  {loadingModels
                    ? "Loading available models from your configured providers..."
                    : models.length > 0
                      ? `${models.length} model${models.length === 1 ? "" : "s"} available`
                      : "No models found"}
                </p>
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="You are a helpful assistant..."
                  value={formData.systemPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, systemPrompt: e.target.value })
                  }
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Instructions that define the AI's behavior and personality
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/projects")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

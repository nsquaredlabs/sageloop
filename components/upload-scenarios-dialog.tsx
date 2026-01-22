"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UploadScenariosDialogProps {
  projectId: string;
}

function parseCSV(text: string): string[] {
  const scenarios: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // Escaped quote ("") inside quoted field
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      // End of row
      if (current.trim()) {
        scenarios.push(current.trim());
      }
      current = "";
      // Handle \r\n
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Don't forget the last row
  if (current.trim()) {
    scenarios.push(current.trim());
  }

  return scenarios;
}

export function UploadScenariosDialog({
  projectId,
}: UploadScenariosDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No scenarios found in file. Check the format below.");
        setScenarios([]);
      } else {
        setScenarios(parsed);
        setError(null);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setFileName(null);
      setScenarios([]);
    };

    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setFileName(null);
    setScenarios([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (scenarios.length === 0) {
        throw new Error("No scenarios found. Please upload a CSV file.");
      }

      const response = await fetch(
        `/api/projects/${projectId}/scenarios/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            scenarios: scenarios.map((input_text) => ({ input_text })),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload scenarios");
      }

      // Reset form and close dialog
      setScenarios([]);
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload scenarios",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Scenarios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Test Scenarios</DialogTitle>
            <DialogDescription>
              Upload scenarios from a CSV file. One scenario per row.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* File upload section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">CSV File</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Choose CSV File
                  </Button>
                  {fileName && (
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                      <span className="text-sm truncate flex-1">
                        {fileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleClearFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {scenarios.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {scenarios.length} scenario
                    {scenarios.length !== 1 ? "s" : ""} found
                  </Badge>
                )}
              </div>

              {/* CSV Format Instructions */}
              <div className="rounded-md border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-medium">CSV Format</h4>
                <p className="text-xs text-muted-foreground">
                  One scenario per row. Use quotes for scenarios with commas or
                  multiple lines.
                </p>
                <div className="font-mono text-xs bg-background rounded p-3 space-y-1">
                  <p className="text-muted-foreground">
                    # Simple scenarios (one per line):
                  </p>
                  <p>How do I reset my password?</p>
                  <p>My order hasn&apos;t arrived yet.</p>
                  <p className="text-muted-foreground mt-2">
                    # Scenario with comma:
                  </p>
                  <p>&quot;Hi, I need help with my account&quot;</p>
                  <p className="text-muted-foreground mt-2">
                    # Multi-line scenario:
                  </p>
                  <p>&quot;My order hasn&apos;t arrived.</p>
                  <p>It&apos;s been 2 weeks.&quot;</p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || scenarios.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload{" "}
              {scenarios.length > 0 &&
                `${scenarios.length} Scenario${scenarios.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

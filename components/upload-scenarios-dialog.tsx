'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadScenariosDialogProps {
  projectId: string;
}

export function UploadScenariosDialog({ projectId }: UploadScenariosDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);

  const parseScenarios = (text: string): string[] => {
    // Split by newlines and filter out empty lines
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      setScenarios(text);
      setError(null);
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setFileName(null);
    };

    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setFileName(null);
    setScenarios('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const scenarioList = parseScenarios(scenarios);

      if (scenarioList.length === 0) {
        throw new Error('No valid scenarios found. Please enter at least one scenario.');
      }

      const response = await fetch(`/api/projects/${projectId}/scenarios/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          scenarios: scenarioList.map(input_text => ({ input_text })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload scenarios');
      }

      const result = await response.json();

      // Reset form and close dialog
      setScenarios('');
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const scenarioCount = parseScenarios(scenarios).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Scenarios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Test Scenarios</DialogTitle>
            <DialogDescription>
              Upload scenarios from a text file or paste them directly. Each line will be treated as a separate scenario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* File upload section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload from File</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".txt,.csv"
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
                    Choose File
                  </Button>
                  {fileName && (
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                      <span className="text-sm truncate flex-1">{fileName}</span>
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
                <p className="text-xs text-muted-foreground">
                  Accepts .txt or .csv files. Each line should contain one scenario.
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or paste directly</span>
                </div>
              </div>

              {/* Text area section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="scenarios">Scenarios (one per line)</Label>
                  {scenarioCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {scenarioCount} scenario{scenarioCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <Textarea
                  id="scenarios"
                  placeholder="My order hasn't arrived yet and it's been 2 weeks. What should I do?
How do I reset my password?
I need to update my billing information"
                  value={scenarios}
                  onChange={(e) => setScenarios(e.target.value)}
                  rows={10}
                  required
                  className="resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter one scenario per line. Empty lines will be ignored.
                </p>
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
            <Button type="submit" disabled={isLoading || scenarioCount === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {scenarioCount > 0 && `${scenarioCount} Scenario${scenarioCount !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

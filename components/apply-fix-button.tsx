'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, GitCompare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FailureCluster {
  name: string;
  count: number;
  pattern: string;
  root_cause: string;
  suggested_fix: string;
  example_inputs?: string[];
  scenario_ids?: number[];
  severity: string;
}

interface ApplyFixButtonProps {
  projectId: string;
  currentPrompt: string;
  clusters: FailureCluster[];
  totalScenarios: number; // Total number of scenarios in the project
  onSuccess?: () => void;
}

export function ApplyFixButton({
  projectId,
  currentPrompt,
  clusters,
  totalScenarios,
  onSuccess,
}: ApplyFixButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  const [improvementNote, setImprovementNote] = useState('');

  // Get all unique scenario IDs from all clusters
  const allFailedScenarioIds = Array.from(
    new Set(clusters.flatMap(c => c.scenario_ids || []))
  );

  const handleOpen = async () => {
    setIsOpen(true);
    setIsIntegrating(true);
    setError(null);

    const clusterNames = clusters.map(c => c.name).join(', ');
    setImprovementNote(`Fixed ${clusters.length} issue${clusters.length !== 1 ? 's' : ''}: ${clusterNames}`);

    // Call API to intelligently integrate all fixes
    try {
      const response = await fetch(`/api/projects/${projectId}/integrate-fixes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPrompt,
          clusters: clusters.map(c => ({
            name: c.name,
            root_cause: c.root_cause,
            suggested_fix: c.suggested_fix,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to integrate fixes');
      }

      const result = await response.json();
      setNewPrompt(result.updatedPrompt);
    } catch (err) {
      console.error('Integration failed:', err);
      setError('Could not auto-integrate fixes. Please review and edit manually.');
      // Fallback: show current prompt for manual editing
      setNewPrompt(currentPrompt);
    } finally {
      setIsIntegrating(false);
    }
  };

  const handleRetest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/retest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioIds: allFailedScenarioIds,
          newSystemPrompt: newPrompt,
          improvementNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retest');
      }

      const result = await response.json();

      // Close dialog and redirect to outputs page
      setIsOpen(false);

      // Navigate to outputs page with success message
      window.location.href = `/projects/${projectId}/outputs?retest=success&version=${result.version}&count=${result.scenarios_retested}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="default"
        size="sm"
      >
        <GitCompare className="mr-2 h-4 w-4" />
        Apply Fix & Retest
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Apply All Fixes & Regenerate Outputs</DialogTitle>
            <DialogDescription>
              Applying {clusters.length} fix{clusters.length !== 1 ? 'es' : ''} and regenerating all {totalScenarios} scenario{totalScenarios !== 1 ? 's' : ''}. Previous ratings will be carried forward for review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-1">
            {/* Fixes Being Applied */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fixes Being Applied ({clusters.length})</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {clusters.map((cluster, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs border rounded p-2 bg-muted/30">
                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{cluster.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Improvement Note</Label>
              <Input
                id="note"
                placeholder="What are you fixing?"
                value={improvementNote}
                onChange={(e) => setImprovementNote(e.target.value)}
              />
            </div>

            {/* Scenarios Count */}
            <div>
              <Badge variant="secondary" className="text-xs">
                {totalScenarios} scenario{totalScenarios !== 1 ? 's' : ''} will be regenerated
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Ratings from the previous version will be automatically carried forward where outputs are similar.
              </p>
            </div>

            {/* Updated Prompt Editor */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm">
                Updated System Prompt
                {isIntegrating && <span className="ml-2 text-xs text-muted-foreground">(Integrating...)</span>}
              </Label>
              <Textarea
                id="prompt"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                rows={8}
                className="font-mono text-xs resize-none"
                placeholder={isIntegrating ? "Integrating fixes into prompt..." : "Edit the system prompt..."}
                disabled={isIntegrating}
              />
              <p className="text-xs text-muted-foreground">
                {isIntegrating
                  ? "Using AI to integrate fixes..."
                  : "You can edit the prompt before applying."
                }
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded p-2 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-100">
                <p className="font-medium">This will update your project's prompt and regenerate all {totalScenarios} output{totalScenarios !== 1 ? 's' : ''}.</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading || isIntegrating}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRetest}
              disabled={isLoading || isIntegrating || !newPrompt.trim()}
              size="sm"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isIntegrating ? 'Integrating...' : `Apply & Retest`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

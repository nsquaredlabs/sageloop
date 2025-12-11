'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Plus, Trash2 } from 'lucide-react';

interface EditProjectDialogProps {
  projectId: string;
  currentName: string;
  currentDescription: string | null;
  currentSystemPrompt: string;
  currentModel: string;
  currentTemperature: number;
  currentVariables?: Record<string, string>;
}

export function EditProjectDialog({
  projectId,
  currentName,
  currentDescription,
  currentSystemPrompt,
  currentModel,
  currentTemperature,
  currentVariables = {},
}: EditProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [systemPrompt, setSystemPrompt] = useState(currentSystemPrompt);
  const [variables, setVariables] = useState<Record<string, string>>(currentVariables);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAddVariable = () => {
    if (newVarKey && !variables[newVarKey]) {
      setVariables({ ...variables, [newVarKey]: newVarValue });
      setNewVarKey('');
      setNewVarValue('');
    }
  };

  const handleRemoveVariable = (key: string) => {
    const newVariables = { ...variables };
    delete newVariables[key];
    setVariables(newVariables);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description: description || null,
          model_config: {
            model: currentModel,
            temperature: currentTemperature,
            system_prompt: systemPrompt,
            variables: Object.keys(variables).length > 0 ? variables : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project settings and configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Evaluation Project"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what you're evaluating"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                className="min-h-[200px] font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the instruction given to the AI model for all scenarios.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Variables</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add variables to use in your system prompt with {'{{variable_name}}'} syntax.
              </p>

              {/* Existing variables */}
              {Object.entries(variables).length > 0 && (
                <div className="space-y-2 mb-2">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center p-2 border rounded-md bg-muted/50">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="font-mono text-sm">{'{{'}{key}{'}}'}</div>
                        <div className="text-sm text-muted-foreground">{value}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVariable(key)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new variable */}
              <div className="flex gap-2">
                <Input
                  placeholder="Variable name (e.g., current_date)"
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
                <Input
                  placeholder="Value (e.g., 2025-12-11)"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddVariable}
                  disabled={!newVarKey}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { Sparkles } from 'lucide-react';
import { AsyncActionButton } from '@/components/async-action-button';

interface GenerateOutputsButtonProps {
  projectId: string;
  scenarioCount: number;
}

export function GenerateOutputsButton({ projectId, scenarioCount }: GenerateOutputsButtonProps) {
  return (
    <AsyncActionButton
      label="Generate Outputs"
      loadingLabel="Generating outputs..."
      icon={Sparkles}
      apiEndpoint={`/api/projects/${projectId}/generate`}
      navigateTo={`/projects/${projectId}/outputs`}
      metadata={`${scenarioCount} scenario${scenarioCount !== 1 ? 's' : ''}`}
      refreshBeforeNavigate={true}
    />
  );
}

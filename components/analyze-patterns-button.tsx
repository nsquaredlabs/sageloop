'use client';

import { Sparkles } from 'lucide-react';
import { AsyncActionButton } from '@/components/async-action-button';

interface AnalyzePatternsButtonProps {
  projectId: string;
  ratedCount: number;
}

export function AnalyzePatternsButton({ projectId, ratedCount }: AnalyzePatternsButtonProps) {
  return (
    <AsyncActionButton
      label="Analyze Patterns"
      loadingLabel="Analyzing patterns..."
      icon={Sparkles}
      apiEndpoint={`/api/projects/${projectId}/extract`}
      navigateTo={`/projects/${projectId}/insights`}
      metadata={`${ratedCount} rating${ratedCount !== 1 ? 's' : ''}`}
    />
  );
}

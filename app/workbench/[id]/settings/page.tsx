import { createServerClient } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeyForm } from '@/components/api-key-form';

interface WorkbenchSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkbenchSettingsPage({ params }: WorkbenchSettingsPageProps) {
  const { id: workbenchId } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch workbench details (RLS ensures user has access)
  const { data: workbench, error: workbenchError } = await supabase
    .from('workbenches')
    .select('*')
    .eq('id', workbenchId)
    .single();

  if (workbenchError || !workbench) {
    notFound();
  }

  // Check which API keys are configured
  const { data: configured } = await supabase
    .rpc('check_workbench_api_keys', { workbench_uuid: workbenchId }) as {
      data: { openai?: boolean; anthropic?: boolean } | null;
    };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Workbench Settings</h1>
        <p className="text-muted-foreground">{workbench.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure API keys for AI generation and pattern extraction. Your keys are encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeyForm
            workbenchId={workbenchId}
            initialConfigured={configured || {}}
          />
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Where to find API keys:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>OpenAI:</strong>{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              platform.openai.com/api-keys
            </a>
          </li>
          <li>
            <strong>Claude (Anthropic):</strong>{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              console.anthropic.com/settings/keys
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

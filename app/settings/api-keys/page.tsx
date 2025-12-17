import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeyForm } from '@/components/api-key-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const metadata = {
  title: 'API Keys | Settings | Sageloop',
  description: 'Manage your API keys',
};

export default async function ApiKeysPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's workbench
  const { data: userWorkbenches } = await supabase
    .from('user_workbenches')
    .select('workbench_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!userWorkbenches) {
    return (
      <div>
        <p>No workbench found.</p>
      </div>
    );
  }

  const workbenchId = userWorkbenches.workbench_id as string;

  // Check subscription plan - BYOK only available for paid plans
  const { data: subscriptionData } = await supabase.rpc(
    'get_workbench_subscription',
    { workbench_uuid: workbenchId }
  );

  const subscription = subscriptionData?.[0];

  // Redirect free tier users to subscription page
  if (subscription?.plan_id === 'free') {
    redirect('/settings/subscription?upgrade_required=true');
  }

  // Check which API keys are configured
  const { data: configured } = await supabase
    .rpc('check_workbench_api_keys', { workbench_uuid: workbenchId }) as {
      data: { openai?: boolean; anthropic?: boolean } | null;
    };

  return (
    <div className="space-y-6">
      {/* Phase 1 Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 1 - Free Tier:</strong> All users currently use system API keys with quota limits.
          BYOK (Bring Your Own Keys) will be available with paid plans in Phase 2.
        </AlertDescription>
      </Alert>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure your own API keys for AI generation and pattern extraction. Your keys are encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeyForm
            workbenchId={workbenchId}
            initialConfigured={configured || {}}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
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

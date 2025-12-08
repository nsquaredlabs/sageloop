import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { NewProjectForm } from '@/components/new-project-form';

export default async function NewProjectPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's workbench
  const { data: userWorkbenches } = await supabase
    .from('user_workbenches')
    .select('workbench_id')
    .limit(1)
    .single();

  const workbenchId = userWorkbenches?.workbench_id;

  // Check which API keys are configured
  let configured = { openai: false, anthropic: false };
  if (workbenchId) {
    const { data } = await supabase
      .rpc('check_workbench_api_keys', { workbench_uuid: workbenchId }) as {
        data: { openai?: boolean; anthropic?: boolean } | null;
      };

    configured = {
      openai: data?.openai ?? false,
      anthropic: data?.anthropic ?? false,
    };
  }

  return <NewProjectForm configured={configured} workbenchId={workbenchId ?? undefined} />;
}

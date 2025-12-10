import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { ProjectNav } from '@/components/project-nav';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Use authenticated server client - enforces RLS
  const supabase = await createServerClient();

  // Fetch project name for navigation
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <div className="flex min-h-screen">
      <ProjectNav projectId={String(id)} projectName={project.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

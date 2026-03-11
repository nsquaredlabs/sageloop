import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ProjectNav } from "@/components/project-nav";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  const db = getDb();
  const project = db
    .select({ id: schema.projects.id, name: schema.projects.name })
    .from(schema.projects)
    .where(eq(schema.projects.id, id))
    .get();

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-h-screen">
      <ProjectNav projectId={String(id)} projectName={project.name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, BarChart3, History, LayoutGrid, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectNavProps {
  projectId: string;
  projectName: string;
}

export function ProjectNav({ projectId, projectName }: ProjectNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: `/projects/${projectId}`,
      icon: LayoutGrid,
      isActive: pathname === `/projects/${projectId}`,
    },
    {
      name: 'Outputs',
      href: `/projects/${projectId}/outputs`,
      icon: FileText,
      isActive: pathname.startsWith(`/projects/${projectId}/outputs`),
    },
    {
      name: 'Insights',
      href: `/projects/${projectId}/insights`,
      icon: BarChart3,
      isActive: pathname === `/projects/${projectId}/insights`,
    },
    {
      name: 'History',
      href: `/projects/${projectId}/insights/history`,
      icon: History,
      isActive: pathname === `/projects/${projectId}/insights/history`,
    },
  ];

  return (
    <aside className="w-64 border-r bg-muted/10 min-h-screen flex flex-col">
      {/* Back to Projects */}
      <div className="p-4 border-b">
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/projects">
            <ChevronLeft className="mr-2 h-4 w-4" />
            All Projects
          </Link>
        </Button>
      </div>

      {/* Project Name */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground mb-1">PROJECT</h2>
        <p className="font-medium text-sm line-clamp-2">{projectName}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                    item.isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

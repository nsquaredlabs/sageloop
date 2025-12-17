'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  {
    name: 'Subscription',
    href: '/settings/subscription',
    description: 'Plan, usage, and billing',
  },
  {
    name: 'API Keys',
    href: '/settings/api-keys',
    description: 'Bring your own keys',
  },
  // Phase 2: Team management
  // {
  //   name: 'Team',
  //   href: '/settings/team',
  //   description: 'Members and permissions',
  // },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8" aria-label="Settings tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <div className="flex flex-col items-start">
                <span>{tab.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {tab.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

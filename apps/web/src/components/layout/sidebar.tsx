'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { WorkspaceId } from '@/lib/workspace';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const WORKSPACE_NAV: Record<WorkspaceId | 'default', NavItem[]> = {
  cockpit: [
    { name: 'Cockpit', href: '/app/cockpit', icon: 'H' },
    { name: 'Customers', href: '/customers', icon: 'C' },
    { name: 'Vehicles', href: '/vehicles', icon: 'V' },
    { name: 'Estimates', href: '/estimates', icon: 'E' },
    { name: 'Service Orders', href: '/service-orders', icon: 'S' },
    { name: 'Financial', href: '/financial', icon: 'F' },
    { name: 'Reports', href: '/accounting/reports', icon: 'R' },
  ],
  'estimates-inbox': [
    { name: 'Estimates Inbox', href: '/app/estimates/inbox', icon: 'E' },
    { name: 'All Estimates', href: '/estimates', icon: 'L' },
    { name: 'Customers', href: '/customers', icon: 'C' },
    { name: 'Vehicles', href: '/vehicles', icon: 'V' },
    { name: 'Insurance', href: '/insurance', icon: 'I' },
  ],
  'my-work': [
    { name: 'My Work', href: '/app/my-work', icon: 'W' },
    { name: 'Service Orders', href: '/service-orders', icon: 'S' },
    { name: 'Vehicles', href: '/vehicles', icon: 'V' },
  ],
  books: [
    { name: 'Books', href: '/app/books', icon: 'B' },
    { name: 'Financial', href: '/financial', icon: 'F' },
    { name: 'Reports', href: '/accounting/reports', icon: 'R' },
    { name: 'Fixed Assets', href: '/accounting/fixed-assets', icon: 'A' },
    { name: 'Journal Entries', href: '/accounting/journal-entries', icon: 'J' },
  ],
  default: [
    { name: 'Dashboard', href: '/dashboard', icon: 'H' },
    { name: 'Customers', href: '/customers', icon: 'C' },
    { name: 'Vehicles', href: '/vehicles', icon: 'V' },
    { name: 'Estimates', href: '/estimates', icon: 'E' },
    { name: 'Service Orders', href: '/service-orders', icon: 'S' },
    { name: 'Financial', href: '/financial', icon: 'F' },
    { name: 'Reports', href: '/accounting/reports', icon: 'R' },
  ],
};

const SETTINGS_ITEM: NavItem = { name: 'Settings', href: '/settings', icon: 'G' };

interface SidebarProps {
  workspace?: WorkspaceId;
}

export function Sidebar({ workspace }: SidebarProps) {
  const pathname = usePathname();
  const items = WORKSPACE_NAV[workspace ?? 'default'];

  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-primary">SSE</span>
      </div>
      <nav className="flex h-[calc(100%-4rem)] flex-col justify-between p-4">
        <div className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                item.href !== '/app/cockpit' &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
        <Link
          href={SETTINGS_ITEM.href}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith(SETTINGS_ITEM.href)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs">
            {SETTINGS_ITEM.icon}
          </span>
          {SETTINGS_ITEM.name}
        </Link>
      </nav>
    </aside>
  );
}

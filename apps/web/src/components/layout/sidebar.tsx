'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'H' },
  { name: 'Customers', href: '/customers', icon: 'C' },
  { name: 'Vehicles', href: '/vehicles', icon: 'V' },
  { name: 'Estimates', href: '/estimates', icon: 'E' },
  { name: 'Service Orders', href: '/service-orders', icon: 'S' },
  { name: 'Financial', href: '/financial', icon: 'F' },
  { name: 'Settings', href: '/settings', icon: 'G' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-primary">SSE</span>
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
      </nav>
    </aside>
  );
}

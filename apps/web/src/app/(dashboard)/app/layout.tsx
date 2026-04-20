'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import type { WorkspaceId } from '@/lib/workspace';

function detectWorkspace(pathname: string): WorkspaceId | undefined {
  if (pathname.startsWith('/app/cockpit')) return 'cockpit';
  if (pathname.startsWith('/app/estimates/inbox')) return 'estimates-inbox';
  if (pathname.startsWith('/app/my-work')) return 'my-work';
  if (pathname.startsWith('/app/books')) return 'books';
  return undefined;
}

export default function AppWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspace = detectWorkspace(pathname);

  return (
    <div className="flex h-screen">
      <Sidebar workspace={workspace} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

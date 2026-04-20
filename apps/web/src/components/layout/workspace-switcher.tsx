'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import type { WorkspaceInfo } from '@/lib/workspace';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useWorkspaceInfo();

  const available = data?.availableWorkspaces ?? [];

  if (available.length <= 1) return null;

  const current = available.find((w) => pathname.startsWith(w.path)) ?? available[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const ws = available.find((w) => w.id === e.target.value);
    if (ws) router.push(ws.path);
  }

  return (
    <select
      value={current?.id}
      onChange={handleChange}
      className="rounded-md border bg-background px-3 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Switch workspace"
    >
      {available.map((ws: WorkspaceInfo) => (
        <option key={ws.id} value={ws.id}>
          {ws.label}
        </option>
      ))}
    </select>
  );
}

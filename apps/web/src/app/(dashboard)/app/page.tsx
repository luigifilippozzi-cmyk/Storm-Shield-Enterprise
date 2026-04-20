'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceInfo } from '@/hooks/use-workspace';

export default function AppPage() {
  const router = useRouter();
  const { data, isLoading } = useWorkspaceInfo();

  useEffect(() => {
    if (!isLoading) {
      const dest = data?.primaryWorkspace?.path ?? '/dashboard';
      router.replace(dest);
    }
  }, [data, isLoading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading workspace…</p>
    </div>
  );
}

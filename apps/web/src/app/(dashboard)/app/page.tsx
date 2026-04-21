'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import { useWizardStatus } from '@/hooks/use-wizard';

export default function AppPage() {
  const router = useRouter();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspaceInfo();
  const { data: wizard, isLoading: wizardLoading } = useWizardStatus();

  useEffect(() => {
    if (workspaceLoading || wizardLoading) return;

    const isOwner = workspace?.roles?.includes('owner') ?? false;

    if (isOwner && wizard?.wizard_status === 'pending') {
      router.replace('/onboarding/wizard');
      return;
    }

    const dest = workspace?.primaryWorkspace?.path ?? '/dashboard';
    router.replace(dest);
  }, [workspace, wizard, workspaceLoading, wizardLoading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading workspace…</p>
    </div>
  );
}

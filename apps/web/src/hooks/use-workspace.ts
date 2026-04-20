'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { getPrimaryWorkspace, getAvailableWorkspaces } from '@/lib/workspace';
import type { WorkspaceInfo } from '@/lib/workspace';

interface WorkspaceResponse {
  roles: string[];
  primaryWorkspace: WorkspaceInfo | null;
  availableWorkspaces: WorkspaceInfo[];
}

export function useWorkspaceInfo() {
  const { getToken, orgId } = useAuth();

  return useQuery<WorkspaceResponse>({
    queryKey: ['workspace-info', orgId],
    queryFn: async () => {
      const token = (await getToken()) || undefined;
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Clerk-Org-Id'] = orgId;
      return api<WorkspaceResponse>('/auth/workspace-info', { token, headers });
    },
    staleTime: 5 * 60 * 1000, // 5 min — roles don't change often
    enabled: true,
  });
}

// Lightweight client-side fallback: derive workspace from Clerk org role
// Used in Server Components where we can't call the hook
export { getPrimaryWorkspace, getAvailableWorkspaces };

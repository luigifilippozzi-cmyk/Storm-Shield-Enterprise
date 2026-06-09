'use client';

import { useAuth, useUser } from '@clerk/nextjs';

/**
 * Central hook for building API request headers.
 *
 * Tenant resolution priority:
 * 1. X-Clerk-Org-Id — when user is part of a Clerk Organization (orgId present)
 * 2. X-Tenant-Id    — fallback using tenantId from Clerk publicMetadata
 *
 * This ensures demo/seed users (not in a Clerk Org) can still authenticate.
 */
export function useApiHeaders() {
  const { getToken, orgId } = useAuth();
  const { user } = useUser();

  return async () => {
    const token = (await getToken()) || undefined;
    const headers: Record<string, string> = {};

    if (orgId) {
      headers['X-Clerk-Org-Id'] = orgId;
    } else {
      // Fallback: use tenantId stored in Clerk publicMetadata during provisioning
      const tenantId = (user?.publicMetadata as { tenantId?: string })?.tenantId;
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }
    }

    return { token, headers };
  };
}

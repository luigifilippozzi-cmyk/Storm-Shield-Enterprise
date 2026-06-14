'use client';

import { useAuth } from '@clerk/nextjs';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Central hook for building API request headers.
 *
 * Tenant resolution priority:
 * 1. X-Clerk-Org-Id — when user is part of a Clerk Organization (orgId from useAuth)
 * 2. X-Tenant-Id    — from Clerk session claims publicMetadata.tenantId (if JWT template configured)
 * 3. X-Tenant-Id    — from Zustand store populated by useTenantBootstrap (GET /auth/tenant-context)
 */
export function useApiHeaders() {
  const { getToken, orgId, sessionClaims } = useAuth();
  const storedTenantId = useAuthStore((s) => s.tenantId);

  return async () => {
    const token = (await getToken()) || undefined;
    const headers: Record<string, string> = {};

    if (orgId) {
      headers['X-Clerk-Org-Id'] = orgId;
    } else {
      // Clerk puts publicMetadata under sessionClaims.publicMetadata or sessionClaims.metadata.public
      const claims = sessionClaims as Record<string, unknown> | null;
      const claimsTenantId =
        (claims?.['publicMetadata'] as { tenantId?: string } | undefined)?.tenantId ||
        (claims?.['metadata'] as { public?: { tenantId?: string } } | undefined)?.public?.tenantId;

      const tenantId = claimsTenantId || storedTenantId || undefined;
      if (tenantId) {
        headers['X-Tenant-Id'] = String(tenantId);
      }
    }

    return { token, headers };
  };
}

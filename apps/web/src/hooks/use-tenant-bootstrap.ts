'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Bootstraps tenant context on first login.
 *
 * When neither orgId nor publicMetadata.tenantId is available in the JWT
 * (e.g., Clerk development mode without a custom JWT template), this hook
 * calls GET /auth/tenant-context to resolve which tenant the user belongs to
 * and stores the result in Zustand so all subsequent API calls can send X-Tenant-Id.
 */
export function useTenantBootstrap() {
  const { getToken, isSignedIn, orgId, sessionClaims } = useAuth();
  const { tenantId, setTenantId } = useAuthStore();
  const didFetch = useRef(false);

  useEffect(() => {
    if (!isSignedIn) return;

    // Already have tenant context from orgId or stored value — no fetch needed
    if (orgId || tenantId) return;

    // Check if publicMetadata.tenantId is available in session claims
    const claims = sessionClaims as Record<string, unknown> | null;
    const claimsTenantId =
      (claims?.['publicMetadata'] as { tenantId?: string } | undefined)?.tenantId ||
      (claims?.['metadata'] as { public?: { tenantId?: string } } | undefined)?.public?.tenantId;
    if (claimsTenantId) return;

    // Only fetch once per hook mount
    if (didFetch.current) return;
    didFetch.current = true;

    const fetchTenantContext = async () => {
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/auth/tenant-context`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.tenantId) {
          setTenantId(data.tenantId);
        }
      }
    };

    fetchTenantContext().catch(() => {});
  }, [isSignedIn, orgId, tenantId, sessionClaims, getToken, setTenantId]);
}

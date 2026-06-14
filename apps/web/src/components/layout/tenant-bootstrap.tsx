'use client';

import { useTenantBootstrap } from '@/hooks/use-tenant-bootstrap';

/**
 * Null-render client component that bootstraps tenant context on mount.
 * Placed in the dashboard layout so it runs on every authenticated page.
 */
export function TenantBootstrap() {
  useTenantBootstrap();
  return null;
}

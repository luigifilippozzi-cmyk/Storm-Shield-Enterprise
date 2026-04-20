export type WorkspaceId = 'cockpit' | 'estimates-inbox' | 'my-work' | 'books';

export interface WorkspaceInfo {
  id: WorkspaceId;
  label: string;
  path: string;
  roles: string[];
}

export const WORKSPACES: WorkspaceInfo[] = [
  { id: 'cockpit', label: 'Cockpit', path: '/app/cockpit', roles: ['owner', 'admin', 'manager'] },
  { id: 'estimates-inbox', label: 'Estimates', path: '/app/estimates/inbox', roles: ['estimator'] },
  { id: 'my-work', label: 'My Work', path: '/app/my-work', roles: ['technician'] },
  { id: 'books', label: 'Books', path: '/app/books', roles: ['accountant'] },
];

// Role hierarchy: lower index = higher priority
const ROLE_HIERARCHY = ['owner', 'admin', 'manager', 'estimator', 'technician', 'accountant', 'viewer'];

export function getPrimaryWorkspace(roles: string[]): WorkspaceInfo | null {
  if (!roles.length) return null;
  const sorted = [...roles].sort(
    (a, b) => ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b),
  );
  const primary = sorted[0];
  return WORKSPACES.find((w) => w.roles.includes(primary)) ?? WORKSPACES[0];
}

export function getAvailableWorkspaces(roles: string[]): WorkspaceInfo[] {
  return WORKSPACES.filter((w) => w.roles.some((r) => roles.includes(r)));
}

export function isWorkspaceAccessible(workspaceId: WorkspaceId, roles: string[]): boolean {
  const ws = WORKSPACES.find((w) => w.id === workspaceId);
  return !!ws && ws.roles.some((r) => roles.includes(r));
}

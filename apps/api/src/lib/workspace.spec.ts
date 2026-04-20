import { getPrimaryWorkspace, getAvailableWorkspaces, isWorkspaceAccessible } from './workspace';

describe('getPrimaryWorkspace', () => {
  it('returns null for empty roles', () => {
    expect(getPrimaryWorkspace([])).toBeNull();
  });

  it('owner → cockpit', () => {
    expect(getPrimaryWorkspace(['owner'])?.id).toBe('cockpit');
  });

  it('technician → my-work', () => {
    expect(getPrimaryWorkspace(['technician'])?.id).toBe('my-work');
  });

  it('estimator → estimates-inbox', () => {
    expect(getPrimaryWorkspace(['estimator'])?.id).toBe('estimates-inbox');
  });

  it('accountant → books', () => {
    expect(getPrimaryWorkspace(['accountant'])?.id).toBe('books');
  });

  it('owner + accountant → cockpit (hierarchy: owner > accountant)', () => {
    expect(getPrimaryWorkspace(['owner', 'accountant'])?.id).toBe('cockpit');
  });

  it('admin → cockpit', () => {
    expect(getPrimaryWorkspace(['admin'])?.id).toBe('cockpit');
  });

  it('manager → cockpit', () => {
    expect(getPrimaryWorkspace(['manager'])?.id).toBe('cockpit');
  });

  it('estimator + technician → estimates-inbox (estimator wins)', () => {
    expect(getPrimaryWorkspace(['estimator', 'technician'])?.id).toBe('estimates-inbox');
  });

  it('viewer only → fallback to cockpit (first workspace)', () => {
    expect(getPrimaryWorkspace(['viewer'])?.id).toBe('cockpit');
  });
});

describe('getAvailableWorkspaces', () => {
  it('owner sees only cockpit', () => {
    const ids = getAvailableWorkspaces(['owner']).map((w) => w.id);
    expect(ids).toEqual(['cockpit']);
  });

  it('owner + accountant sees cockpit + books', () => {
    const ids = getAvailableWorkspaces(['owner', 'accountant']).map((w) => w.id);
    expect(ids).toContain('cockpit');
    expect(ids).toContain('books');
    expect(ids).toHaveLength(2);
  });

  it('empty roles → no workspaces', () => {
    expect(getAvailableWorkspaces([])).toHaveLength(0);
  });

  it('technician + accountant sees my-work + books', () => {
    const ids = getAvailableWorkspaces(['technician', 'accountant']).map((w) => w.id);
    expect(ids).toContain('my-work');
    expect(ids).toContain('books');
  });
});

describe('isWorkspaceAccessible', () => {
  it('owner can access cockpit', () => {
    expect(isWorkspaceAccessible('cockpit', ['owner'])).toBe(true);
  });

  it('technician cannot access cockpit', () => {
    expect(isWorkspaceAccessible('cockpit', ['technician'])).toBe(false);
  });

  it('estimator can access estimates-inbox', () => {
    expect(isWorkspaceAccessible('estimates-inbox', ['estimator'])).toBe(true);
  });

  it('owner cannot access estimates-inbox', () => {
    expect(isWorkspaceAccessible('estimates-inbox', ['owner'])).toBe(false);
  });

  it('accountant can access books', () => {
    expect(isWorkspaceAccessible('books', ['accountant'])).toBe(true);
  });

  it('technician cannot access books', () => {
    expect(isWorkspaceAccessible('books', ['technician'])).toBe(false);
  });

  it('admin can access cockpit', () => {
    expect(isWorkspaceAccessible('cockpit', ['admin'])).toBe(true);
  });
});

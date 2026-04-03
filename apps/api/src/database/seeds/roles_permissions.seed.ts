import { Knex } from 'knex';
import { v7 as uuidv7 } from 'uuid';

const ROLES = [
  { name: 'owner', description: 'Full access including billing and tenant settings' },
  { name: 'admin', description: 'Full access except billing and tenant config' },
  { name: 'manager', description: 'Operations, reports, and approvals' },
  { name: 'estimator', description: 'CRM, estimates, and vehicles' },
  { name: 'technician', description: 'Service orders, time entries, and photos' },
  { name: 'accountant', description: 'Financial, accounting, reports, and tax' },
  { name: 'viewer', description: 'Read-only access to all modules' },
];

const MODULES = [
  'tenants', 'users', 'customers', 'insurance', 'vehicles',
  'estimates', 'service-orders', 'financial', 'accounting',
  'contractors', 'reports', 'settings',
];

const ACTIONS = ['read', 'write', 'delete', 'approve'];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: MODULES.flatMap(m => ACTIONS.map(a => `${m}:${a}:*`)),
  admin: MODULES
    .filter(m => !['tenants'].includes(m))
    .flatMap(m => ACTIONS.map(a => `${m}:${a}:*`))
    .concat(['tenants:read:*']),
  manager: [
    ...['customers', 'insurance', 'vehicles', 'estimates', 'service-orders', 'contractors']
      .flatMap(m => ACTIONS.map(a => `${m}:${a}:*`)),
    'financial:read:*', 'financial:write:*',
    'reports:read:*',
    'users:read:*',
    'settings:read:*',
  ],
  estimator: [
    ...['customers', 'insurance', 'vehicles', 'estimates']
      .flatMap(m => ['read', 'write'].map(a => `${m}:${a}:*`)),
    'service-orders:read:*',
  ],
  technician: [
    'service-orders:read:*', 'service-orders:write:*',
    'customers:read:*',
    'vehicles:read:*',
    'estimates:read:*',
  ],
  accountant: [
    ...['financial', 'accounting', 'reports', 'contractors']
      .flatMap(m => ACTIONS.map(a => `${m}:${a}:*`)),
    'customers:read:*',
    'estimates:read:*',
    'service-orders:read:*',
    'settings:read:*',
  ],
  viewer: MODULES.map(m => `${m}:read:*`),
};

export async function seedRolesAndPermissions(knex: Knex, tenantId: string) {
  for (const role of ROLES) {
    const roleId = uuidv7();
    await knex('roles').insert({
      id: roleId,
      tenant_id: tenantId,
      name: role.name,
      description: role.description,
      is_system: true,
    });

    const permissions = ROLE_PERMISSIONS[role.name] || [];
    const permRows = permissions.map(perm => {
      const [module, action, resource] = perm.split(':');
      return {
        id: uuidv7(),
        role_id: roleId,
        module,
        action,
        resource,
      };
    });

    if (permRows.length > 0) {
      await knex('role_permissions').insert(permRows);
    }
  }
}

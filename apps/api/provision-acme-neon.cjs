'use strict';
// provision-acme-neon.cjs
// Provisions the 'acme' tenant in Neon staging using DATABASE_URL_UNPOOLED
// Requires: node apps/api/provision-acme-neon.cjs (from repo root, after loading .env)

const knex = require('knex');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  console.error('ERROR: DATABASE_URL_UNPOOLED not set');
  process.exit(1);
}

const isNeon = url.includes('neon.tech');
const connection = { connectionString: url, ssl: { rejectUnauthorized: false } };
if (isNeon) connection.family = 4;

const db = knex({ client: 'pg', connection, pool: { min: 1, max: 3 } });

// --- Inline uuid v7 (simplified — time-based ordering only) ---
function uuidv7() {
  const now = Date.now();
  const hi = Math.floor(now / 0x100000000);
  const lo = now >>> 0;
  const rand = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  const hiHex = hi.toString(16).padStart(8, '0');
  const loHex = lo.toString(16).padStart(8, '0');
  const ms48 = (hiHex + loHex).slice(0, 12);
  return ms48.slice(0,8) + '-' + ms48.slice(8,12) + '-7' + rand().slice(1) + '-' + (0x8000 | Math.floor(Math.random()*0x3fff)).toString(16) + '-' + rand() + rand() + rand();
}

const ROLES = [
  { name: 'owner',       description: 'Full access including billing and tenant settings' },
  { name: 'admin',       description: 'Full access except billing and tenant config' },
  { name: 'manager',     description: 'Operations, reports, and approvals' },
  { name: 'estimator',   description: 'CRM, estimates, and vehicles' },
  { name: 'technician',  description: 'Service orders, time entries, and photos' },
  { name: 'accountant',  description: 'Financial, accounting, reports, and tax' },
  { name: 'viewer',      description: 'Read-only access to all modules' },
];

const MODULES = ['tenants','users','customers','insurance','vehicles','estimates','service-orders','financial','accounting','contractors','reports','settings'];
const ACTIONS = ['read','write','delete','approve'];

const ROLE_PERMISSIONS = {
  owner:      MODULES.flatMap(m => ACTIONS.map(a => m+':'+a+':*')),
  admin:      MODULES.filter(m => m !== 'tenants').flatMap(m => ACTIONS.map(a => m+':'+a+':*')).concat(['tenants:read:*']),
  manager:    ['customers','insurance','vehicles','estimates','service-orders','contractors'].flatMap(m => ACTIONS.map(a => m+':'+a+':*')),
  estimator:  ['customers','vehicles','estimates'].flatMap(m => ACTIONS.map(a => m+':'+a+':*')),
  technician: ['service-orders','vehicles'].flatMap(m => ACTIONS.map(a => m+':'+a+':*')),
  accountant: ['financial','accounting','reports'].flatMap(m => ACTIONS.map(a => m+':'+a+':*')).concat(['customers:read:*','estimates:read:*']),
  viewer:     MODULES.map(m => m+':read:*'),
};

const TENANT_MIGRATIONS = [
  '001_platform_iam.sql',
  '002_crm_insurance_vehicles.sql',
  '003_estimates_service_orders.sql',
  '004_financial.sql',
  '005_row_level_security.sql',
  '006_customer_consent.sql',
  '007_accounting_gl.sql',
  '008_journal_entries_fiscal_periods.sql',
  '009_fam_tables.sql',
  '010_fam_not_null_and_idempotency.sql',
  '011_tenant_wizard_status.sql',
  '012_sample_data_flag.sql',
  '013_activation_events.sql',
  '014_estimate_status_enum_expand.sql',
  '015_estimate_status_changes.sql',
  '016_estimate_dispute.sql',
  '017_cases.sql',
  '018_super_user_audit_flag.sql',
];

async function provision() {
  console.log('');
  console.log('=== Provisioning tenant: acme ===');
  console.log('Target: Neon staging (DATABASE_URL_UNPOOLED)');
  console.log('');

  // 1. Check if already exists
  await db.raw('SET search_path TO public');
  const existing = await db('tenants').where({ slug: 'acme' }).first();
  if (existing) {
    if (existing.status === 'cancelled') {
      console.error('ERROR: tenant acme exists but is cancelled');
      process.exit(1);
    }
    console.log('[1/5] Tenant acme already exists (id: ' + existing.id + ') -- skipping insert');
    console.log('      Status: ' + existing.status + ' | Schema: ' + existing.schema_name);
    return existing.id;
  }

  const tenantId = uuidv7();
  const schemaName = 'tenant_' + tenantId.replace(/-/g, '_');
  console.log('[1/5] Creating tenant record...');
  console.log('      id:     ' + tenantId);
  console.log('      schema: ' + schemaName);

  await db('tenants').insert({
    id: tenantId,
    name: 'Acme Body Shop',
    slug: 'acme',
    schema_name: schemaName,
    status: 'active',
    subscription_plan: 'pro',
    owner_email: 'owner@acme-bodyshop.com',
    settings: JSON.stringify({
      timezone: 'America/Chicago',
      currency: 'USD',
      date_format: 'MM/DD/YYYY',
      fiscal_year_start_month: 1,
      tax_rate: '0.0000',
    }),
  });
  console.log('[1/5] Tenant record created');

  // 2. Create schema
  console.log('[2/5] Creating schema ' + schemaName + '...');
  await db.raw('CREATE SCHEMA IF NOT EXISTS "' + schemaName + '"');
  console.log('[2/5] Schema created');

  // 3. Run migrations
  console.log('[3/5] Running ' + TENANT_MIGRATIONS.length + ' migrations...');
  const migrationsDir = path.resolve(__dirname, 'src/database/migrations');
  await db.raw('SET search_path TO "' + schemaName + '", public');

  for (const file of TENANT_MIGRATIONS) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log('      SKIP (not found): ' + file);
      continue;
    }
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await db.raw(sql);
      console.log('      OK: ' + file);
    } catch (err) {
      console.log('      WARN (non-fatal): ' + file + ' -- ' + err.message.split('\n')[0]);
    }
  }
  console.log('[3/5] Migrations done');

  // 4. Seed roles
  console.log('[4/5] Seeding roles and permissions...');
  await db.raw('SET search_path TO "' + schemaName + '", public');

  for (const roleDef of ROLES) {
    const roleId = uuidv7();
    await db('roles').insert({
      id: roleId,
      tenant_id: tenantId,
      name: roleDef.name,
      description: roleDef.description,
    }).onConflict(['tenant_id','name']).ignore();

    const insertedRole = await db('roles').where({ tenant_id: tenantId, name: roleDef.name }).first();
    if (!insertedRole) continue;

    const perms = ROLE_PERMISSIONS[roleDef.name] || [];
    for (const perm of perms) {
      const [module, action, resource] = perm.split(':');
      await db('role_permissions').insert({
        id: uuidv7(),
        role_id: insertedRole.id,
        module,
        action,
        resource: resource || '*',
      }).onConflict().ignore();
    }
  }
  console.log('[4/5] Roles seeded');

  // 5. Create owner user
  console.log('[5/5] Creating owner user...');
  const ownerId = uuidv7();
  await db('users').insert({
    id: ownerId,
    tenant_id: tenantId,
    email: 'owner@acme-bodyshop.com',
    first_name: 'Acme',
    last_name: 'Owner',
    status: 'active',
  }).onConflict().ignore();

  const ownerRole = await db('roles').where({ tenant_id: tenantId, name: 'owner' }).first();
  if (ownerRole) {
    await db('user_role_assignments').insert({
      id: uuidv7(),
      user_id: ownerId,
      role_id: ownerRole.id,
      assigned_by: ownerId,
    }).onConflict().ignore();
  }
  console.log('[5/5] Owner user created: owner@acme-bodyshop.com');

  console.log('');
  console.log('=== acme tenant provisioned successfully ===');
  console.log('tenant_id:  ' + tenantId);
  console.log('schema:     ' + schemaName);
  console.log('');
  console.log('Next step: run .\run-seeds.ps1 to seed personas + demo data');
  return tenantId;
}

provision()
  .then(() => db.destroy())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('PROVISION FAILED:', err.message || err);
    db.destroy().then(() => process.exit(1));
  });

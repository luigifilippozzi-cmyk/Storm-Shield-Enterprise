'use strict';
// reset-acme-demo.cjs
// Deletes partial/full demo data from the acme tenant schema so run-seeds.ps1 can re-run cleanly.
// Does NOT delete: users, roles, role_permissions, user_role_assignments (personas stay).
// Requires: DATABASE_URL_UNPOOLED in env

const knex = require('knex');

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) { console.error('ERROR: DATABASE_URL_UNPOOLED not set'); process.exit(1); }

const TENANT_SLUG = 'acme';

const isNeon = url.includes('neon.tech');
const connection = { connectionString: url, ssl: { rejectUnauthorized: false } };
if (isNeon) connection.family = 4;

const db = knex({ client: 'pg', connection, pool: { min: 1, max: 3 } });

async function reset() {
  await db.raw('SET search_path TO public');
  const tenant = await db('tenants').where({ slug: TENANT_SLUG }).first();
  if (!tenant) { console.error('ERROR: tenant acme not found'); process.exit(1); }

  const schema = tenant.schema_name;
  console.log('Resetting demo data for tenant: ' + TENANT_SLUG);
  console.log('Schema: ' + schema);
  console.log('');

  await db.raw('SET search_path TO "' + schema + '", public');

  // Delete in reverse FK dependency order
  const tables = [
    'depreciation_schedules',
    'depreciation_entries',
    'asset_disposals',
    'fixed_assets',
    'asset_categories',
    'journal_entry_lines',
    'journal_entries',
    'financial_transactions',
    'so_time_entries',
    'so_parts_used',
    'so_photos',
    'so_tasks',
    'so_external_services',
    'so_status_history',
    'service_orders',
    'estimate_lines',
    'estimate_supplements',
    'estimate_documents',
    'estimates',
    'vehicle_photos',
    'vehicles',
    'insurance_contacts',
    'insurance_companies',
    'customers',
    'fiscal_periods',
    'chart_of_accounts',
  ];

  for (const tbl of tables) {
    try {
      const n = await db(tbl).delete();
      if (n > 0) console.log('  deleted ' + n + ' rows from ' + tbl);
      else        console.log('  ' + tbl + ': empty (skipped)');
    } catch (e) {
      console.log('  SKIP ' + tbl + ': ' + e.message.split('\n')[0]);
    }
  }

  console.log('');
  console.log('Reset complete. Run .\\run-seeds.ps1 to re-seed.');
}

reset()
  .then(() => db.destroy())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('RESET FAILED:', err.message || err);
    db.destroy().then(() => process.exit(1));
  });

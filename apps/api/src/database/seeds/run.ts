import knex from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { seedRolesAndPermissions } from './roles_permissions.seed';
import { seedAcmePersonas } from './acme-personas.seed';
import { seedAcmeDemoData } from './acme-demo-data.seed';

const envPath = path.resolve(__dirname, '../../../../../.env');
dotenv.config({ path: envPath });

function parseArgs(): { tenantSlug?: string; tenantId?: string; type: string } {
  const args = process.argv.slice(2);
  const result: { tenantSlug?: string; tenantId?: string; type: string } = { type: 'roles' };

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) result.tenantSlug = arg.split('=')[1];
    else if (arg.startsWith('--type=')) result.type = arg.split('=')[1];
    else if (!arg.startsWith('--')) result.tenantId = arg; // legacy positional
  }

  return result;
}

function buildKnex() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (connectionString) {
    return knex({ client: 'pg', connection: { connectionString, ssl: { rejectUnauthorized: false } } });
  }
  return knex({
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'sse_dev',
      user: process.env.POSTGRES_USER || 'sse_user',
      password: process.env.POSTGRES_PASSWORD || 'sse_password_dev',
    },
  });
}

async function run() {
  const { tenantSlug, tenantId: legacyTenantId, type } = parseArgs();

  const db = buildKnex();

  try {
    let tenantId: string;
    let schemaName: string;

    if (tenantSlug) {
      const tenant = await db('tenants').where({ slug: tenantSlug }).whereNot({ status: 'cancelled' }).first();
      if (!tenant) {
        console.error(`Tenant with slug '${tenantSlug}' not found or cancelled`);
        process.exit(1);
      }
      tenantId = tenant.id;
      schemaName = tenant.schema_name;
      console.log(`Tenant: ${tenant.name} (${tenantId}) — schema: ${schemaName}`);
    } else if (legacyTenantId) {
      tenantId = legacyTenantId;
      // Legacy: lookup schema_name from tenants table
      const tenant = await db('tenants').where({ id: tenantId }).first();
      schemaName = tenant?.schema_name ?? `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log(`Seeding data for tenant: ${tenantId}`);
    } else {
      console.error('Usage: ts-node run.ts --tenant=<slug> --type=<type>');
      console.error('       ts-node run.ts <tenant-id>  (legacy — roles only)');
      console.error('Types: roles | personas | demo-data');
      process.exit(1);
    }

    if (type === 'roles') {
      await seedRolesAndPermissions(db, tenantId);
      console.log('Roles and permissions seeded.');
    } else if (type === 'personas') {
      await seedAcmePersonas(db, tenantId, schemaName);
    } else if (type === 'demo-data') {
      await seedAcmeDemoData(db, tenantId, schemaName);
    } else {
      console.error(`Unknown seed type: ${type}. Valid: roles | personas | demo-data`);
      process.exit(1);
    }

    console.log('\nSeed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();

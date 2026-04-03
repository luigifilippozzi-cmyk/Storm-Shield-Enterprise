import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { v7 as uuidv7 } from 'uuid';
import { seedRolesAndPermissions } from './seeds/roles_permissions.seed';

dotenv.config({ path: '../../../.env' });

async function provisionTenant(name: string, slug: string, ownerEmail: string) {
  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'sse_dev',
      user: process.env.POSTGRES_USER || 'sse_user',
      password: process.env.POSTGRES_PASSWORD || 'sse_password_dev',
    },
  });

  const tenantId = uuidv7();
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

  console.log(`Provisioning tenant: ${name}`);
  console.log(`  ID: ${tenantId}`);
  console.log(`  Schema: ${schemaName}`);

  try {
    // 1. Create tenant record in public schema
    await db('tenants').insert({
      id: tenantId,
      name,
      slug,
      schema_name: schemaName,
      status: 'active',
      subscription_plan: 'free',
      owner_email: ownerEmail,
      settings: JSON.stringify({
        timezone: 'America/Chicago',
        currency: 'USD',
        date_format: 'MM/DD/YYYY',
        fiscal_year_start_month: 1,
        tax_rate: '0.0000',
      }),
    });

    // 2. Create schema
    await db.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 3. Set search_path and run migrations for tenant schema
    await db.raw(`SET search_path TO "${schemaName}", public`);

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = ['001_platform_iam.sql', '002_crm_insurance_vehicles.sql', '003_estimates_service_orders.sql', '004_financial.sql'];

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await db.raw(sql);
      console.log(`  Migration applied: ${file}`);
    }

    // 4. Seed roles and permissions
    await seedRolesAndPermissions(db, tenantId);
    console.log('  Roles and permissions seeded');

    // 5. Create owner user
    const ownerId = uuidv7();
    await db('users').insert({
      id: ownerId,
      tenant_id: tenantId,
      email: ownerEmail,
      first_name: 'Owner',
      last_name: name,
      status: 'active',
    });

    // Assign owner role
    const ownerRole = await db('roles')
      .where({ tenant_id: tenantId, name: 'owner' })
      .first();

    if (ownerRole) {
      await db('user_role_assignments').insert({
        id: uuidv7(),
        user_id: ownerId,
        role_id: ownerRole.id,
        assigned_by: ownerId,
      });
    }

    console.log(`  Owner user created: ${ownerEmail}`);
    console.log(`\nTenant provisioned successfully!`);
    console.log(`  Tenant ID: ${tenantId}`);

    return tenantId;
  } catch (error) {
    console.error('Provisioning failed:', error);
    // Cleanup on failure
    await db.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await db('tenants').where({ id: tenantId }).delete();
    throw error;
  } finally {
    await db.destroy();
  }
}

// CLI usage
const [name, slug, email] = process.argv.slice(2);
if (!name || !slug || !email) {
  console.error('Usage: ts-node tenant-provisioning.ts <name> <slug> <owner-email>');
  console.error('Example: ts-node tenant-provisioning.ts "Acme Body Shop" acme-body-shop owner@acme.com');
  process.exit(1);
}

provisionTenant(name, slug, email);

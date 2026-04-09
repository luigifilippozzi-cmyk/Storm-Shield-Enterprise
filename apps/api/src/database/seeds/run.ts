import knex from 'knex';
import * as dotenv from 'dotenv';
import { seedRolesAndPermissions } from './roles_permissions.seed';

dotenv.config({ path: '../../../../.env' });

async function run() {
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

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Usage: ts-node run.ts <tenant-id>');
    process.exit(1);
  }

  console.log(`Seeding data for tenant: ${tenantId}`);

  try {
    await seedRolesAndPermissions(db, tenantId);
    console.log('Roles and permissions seeded.');

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();

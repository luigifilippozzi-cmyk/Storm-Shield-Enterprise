import { Knex } from 'knex';
import { v7 as uuidv7 } from 'uuid';
import { createClerkClient } from '@clerk/backend';

// Allow override via env so staging ops don't have the password in code history
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? 'DemoPass!2026';

// tenant schema names are always tenant_<uuid_with_underscores>
const SCHEMA_NAME_RE = /^tenant_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/;

const PERSONAS = [
  { email: 'owner@acme.sse-demo.test', firstName: 'John', lastName: "O'Connor", role: 'owner' },
  { email: 'admin@acme.sse-demo.test', firstName: 'Maria', lastName: 'Santos', role: 'admin' },
  { email: 'manager@acme.sse-demo.test', firstName: 'David', lastName: 'Kim', role: 'manager' },
  { email: 'estimator@acme.sse-demo.test', firstName: 'Sarah', lastName: 'Johnson', role: 'estimator' },
  { email: 'tech@acme.sse-demo.test', firstName: 'Carlos', lastName: 'Mendez', role: 'technician' },
  { email: 'accountant@acme.sse-demo.test', firstName: 'Linda', lastName: 'Foster', role: 'accountant' },
  { email: 'viewer@acme.sse-demo.test', firstName: 'Robert', lastName: 'Taylor', role: 'viewer' },
];

export async function seedAcmePersonas(
  knex: Knex,
  tenantId: string,
  schemaName: string,
): Promise<void> {
  if (!SCHEMA_NAME_RE.test(schemaName)) {
    throw new Error(`Invalid schema name '${schemaName}' — must match tenant_<uuid>`);
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is required');

  const clerk = createClerkClient({ secretKey });
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`\nSeeding ${PERSONAS.length} personas for tenant ${tenantId} (schema: ${schemaName})`);

  for (const persona of PERSONAS) {
    process.stdout.write(`  ${persona.email} (${persona.role})... `);

    // 1. Get or create Clerk user
    const existing = await clerk.users.getUserList({ emailAddress: [persona.email] });
    let clerkUserId: string;

    if (existing.totalCount > 0) {
      clerkUserId = existing.data[0].id;
      // role in privateMetadata (server-side only), tenantId in publicMetadata (needed for tenant routing in frontend JWT)
      await clerk.users.updateUserMetadata(clerkUserId, {
        publicMetadata: { tenantId },
        privateMetadata: { role: persona.role },
      });
      process.stdout.write('Clerk:exists ');
    } else {
      const created = await clerk.users.createUser({
        emailAddress: [persona.email],
        password: DEMO_PASSWORD,
        firstName: persona.firstName,
        lastName: persona.lastName,
        publicMetadata: { tenantId },
        privateMetadata: { role: persona.role },
        // Only skip password strength checks on non-production environments
        ...(isProduction ? {} : { skipPasswordChecks: true }),
      });
      clerkUserId = created.id;
      process.stdout.write('Clerk:created ');
    }

    // 2. Get or upsert DB user in tenant schema
    const existingUser = await knex
      .withSchema(schemaName)
      .table('users')
      .where({ tenant_id: tenantId, email: persona.email })
      .whereNull('deleted_at')
      .first();

    let userId: string;

    if (!existingUser) {
      userId = uuidv7();
      await knex.withSchema(schemaName).table('users').insert({
        id: userId,
        tenant_id: tenantId,
        external_auth_id: clerkUserId,
        email: persona.email,
        first_name: persona.firstName,
        last_name: persona.lastName,
        status: 'active',
      });
      process.stdout.write('DB:created ');
    } else {
      userId = existingUser.id;
      if (!existingUser.external_auth_id || existingUser.external_auth_id !== clerkUserId) {
        await knex
          .withSchema(schemaName)
          .table('users')
          .where({ id: userId })
          .update({ external_auth_id: clerkUserId, status: 'active' });
        process.stdout.write('DB:updated ');
      } else {
        process.stdout.write('DB:exists ');
      }
    }

    // 3. Assign role — ON CONFLICT DO NOTHING prevents race conditions on re-run
    const role = await knex
      .withSchema(schemaName)
      .table('roles')
      .where({ tenant_id: tenantId, name: persona.role })
      .first();

    if (!role) {
      console.log(`\n  WARNING: role '${persona.role}' not found — run roles seed first`);
      continue;
    }

    await knex
      .withSchema(schemaName)
      .table('user_role_assignments')
      .insert({
        id: uuidv7(),
        user_id: userId,
        role_id: role.id,
        assigned_by: userId,
      })
      .onConflict(['user_id', 'role_id'])
      .ignore();

    process.stdout.write('role:ok');
    console.log(' ✓');
  }

  console.log('\nPersonas seed complete.');
  console.log(`\nCredentials:`);
  PERSONAS.forEach(p => console.log(`  ${p.email.padEnd(38)} password: ${DEMO_PASSWORD}`));
}

import { Knex } from 'knex';

// Implemented in T-20260501-2 (BUG-01b — feat/SSE-069-acme-demo-data-seed)
export async function seedAcmeDemoData(
  _knex: Knex,
  _tenantId: string,
  _schemaName: string,
): Promise<void> {
  throw new Error(
    'Demo data seed not yet implemented. Run after BUG-01b (feat/SSE-069) is merged.',
  );
}

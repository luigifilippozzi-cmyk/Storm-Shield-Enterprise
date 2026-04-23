import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Knex } from 'knex';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.tokens';
import { generateId } from '@sse/shared-utils';

// SLA thresholds per RF-005c spec (RN8)
const SLA_RULES = [
  { status: 'awaiting_approval', daysLimit: 14 },
  { status: 'supplement_pending', daysLimit: 7 },
] as const;

const IDEMPOTENCY_WINDOW_HOURS = 24;

@Injectable()
export class SlaNotificationService {
  private readonly logger = new Logger(SlaNotificationService.name);

  constructor(
    @Inject(KNEX_ADMIN_CONNECTION) private readonly adminKnex: Knex,
  ) {}

  // Daily at 08:00 UTC — use @nestjs/schedule instead of BullMQ (DM decision:
  // @Cron is idiomatic for single-trigger daily jobs; BullMQ adds queue infra
  // overhead only justified when per-job retries / fan-out concurrency are needed.
  // See PR description for trade-off rationale.)
  @Cron('0 8 * * *')
  async runSlaCheck(): Promise<void> {
    this.logger.log('SLA notification job started');

    const tenants = await this.adminKnex('tenants')
      .where({ deleted_at: null })
      .whereIn('status', ['active', 'trial'])
      .select('id', 'schema_name');

    let total = 0;
    for (const tenant of tenants) {
      const count = await this.processTenant(tenant.id, tenant.schema_name);
      total += count;
    }

    this.logger.log(`SLA check complete — ${total} notifications created across ${tenants.length} tenants`);
  }

  async processTenant(tenantId: string, schemaName: string): Promise<number> {
    const knex = this.adminKnex;
    const now = new Date();
    const idempotencyWindow = new Date(now.getTime() - IDEMPOTENCY_WINDOW_HOURS * 60 * 60 * 1000);
    let count = 0;

    await knex.transaction(async (trx) => {
      // SET LOCAL scopes the search_path to this transaction only — safe in a pool.
      await trx.raw(`SET LOCAL search_path TO "${schemaName}", public`);

      // Collect Owner role users to notify
      const ownerUsers = await trx('user_role_assignments')
        .join('roles', 'user_role_assignments.role_id', 'roles.id')
        .where({ 'user_role_assignments.tenant_id': tenantId, 'roles.name': 'owner' })
        .select('user_role_assignments.user_id as userId');

      if (!ownerUsers.length) return;

      for (const rule of SLA_RULES) {
        const threshold = new Date(now.getTime() - rule.daysLimit * 24 * 60 * 60 * 1000);

        const breaching = await trx('estimates')
          .where({ tenant_id: tenantId, status: rule.status, deleted_at: null })
          .where('updated_at', '<', threshold)
          .select('id', 'estimate_number', 'status');

        for (const estimate of breaching) {
          for (const { userId } of ownerUsers) {
            // Idempotency: skip if already notified for this estimate in the last 24h
            const duplicate = await trx('notifications')
              .where({ tenant_id: tenantId, user_id: userId })
              .where('created_at', '>', idempotencyWindow)
              .whereRaw(`data->>'estimate_id' = ?`, [estimate.id])
              .whereRaw(`data->>'type' = ?`, ['sla_breach'])
              .first();

            if (duplicate) continue;

            await trx('notifications').insert({
              id: generateId(),
              tenant_id: tenantId,
              user_id: userId,
              type: 'warning',
              channel: 'in_app',
              title: `SLA Alert: Estimate #${estimate.estimate_number}`,
              message: `Estimate #${estimate.estimate_number} has been in "${estimate.status.replace(/_/g, ' ')}" for more than ${rule.daysLimit} days.`,
              data: JSON.stringify({
                type: 'sla_breach',
                estimate_id: estimate.id,
                estimate_number: estimate.estimate_number,
                status: estimate.status,
                days_limit: rule.daysLimit,
              }),
              read_at: null,
              created_at: now,
            });
            count++;
          }
        }
      }
    });

    return count;
  }
}

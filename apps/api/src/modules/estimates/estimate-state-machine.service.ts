import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';

// Canonical 10-state machine — RF-005a (ADR-012, Split A ratificado 2026-04-22)
// All valid from→to pairs. Any pair not listed is forbidden.
export const ALLOWED_TRANSITIONS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['draft',                    new Set(['submitted_to_adjuster'])],
  ['submitted_to_adjuster',    new Set(['awaiting_approval', 'rejected'])],
  ['awaiting_approval',        new Set(['approved', 'supplement_pending', 'rejected', 'disputed'])],
  ['approved',                 new Set(['approved_with_supplement', 'paid', 'disputed', 'closed'])],
  ['supplement_pending',       new Set(['awaiting_approval'])],
  ['approved_with_supplement', new Set(['paid', 'disputed', 'closed'])],
  ['rejected',                 new Set(['draft'])],
  ['disputed',                 new Set(['awaiting_approval', 'paid', 'closed'])],
  ['paid',                     new Set(['closed'])],
  ['closed',                   new Set()],
]);

@Injectable()
export class EstimateStateMachineService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  /**
   * Validate and execute a status transition for an estimate.
   * Persists an entry to estimate_status_changes and updates estimates.status
   * atomically within a single transaction.
   *
   * Callers must supply the authenticated userId for the audit trail.
   * Does NOT expose an HTTP endpoint — UI transitions come in RF-005b/c.
   */
  async transition(
    tenantId: string,
    estimateId: string,
    toStatus: string,
    userId: string,
    notes?: string,
  ): Promise<{ estimate: any; statusChange: any }> {
    const knex = await this.tenantDb.getConnection();

    const estimate = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId, deleted_at: null })
      .first();

    if (!estimate) {
      throw new NotFoundException(`Estimate ${estimateId} not found`);
    }

    const fromStatus = estimate.status as string;
    const allowed = ALLOWED_TRANSITIONS.get(fromStatus);

    if (!allowed || !allowed.has(toStatus)) {
      const allowedList = allowed ? [...allowed].join(', ') || 'none' : 'unknown status';
      throw new BadRequestException(
        `Transition '${fromStatus}' → '${toStatus}' is not allowed. Allowed targets: [${allowedList}]`,
      );
    }

    return knex.transaction(async (trx) => {
      const now = new Date();

      const [updatedEstimate] = await trx('estimates')
        .where({ id: estimateId, tenant_id: tenantId })
        .update({ status: toStatus, updated_at: now })
        .returning('*');

      const [statusChange] = await trx('estimate_status_changes')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          estimate_id: estimateId,
          from_status: fromStatus,
          to_status: toStatus,
          changed_by_user_id: userId,
          changed_at: now,
          notes: notes ?? null,
        })
        .returning('*');

      return { estimate: updatedEstimate, statusChange };
    });
  }

  /**
   * Return the full status change history for an estimate, oldest-first.
   */
  async getHistory(tenantId: string, estimateId: string): Promise<any[]> {
    const knex = await this.tenantDb.getConnection();

    const estimate = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId, deleted_at: null })
      .first();

    if (!estimate) {
      throw new NotFoundException(`Estimate ${estimateId} not found`);
    }

    return knex('estimate_status_changes')
      .where({ estimate_id: estimateId, tenant_id: tenantId })
      .orderBy('changed_at', 'asc');
  }
}

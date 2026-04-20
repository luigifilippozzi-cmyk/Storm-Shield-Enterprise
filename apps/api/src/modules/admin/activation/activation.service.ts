import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_ADMIN_CONNECTION } from '../../../config/database.module';
import { generateId } from '@sse/shared-utils';

export type ActivationEventType =
  | 'tenant_created'
  | 'first_user_login'
  | 'wizard_started'
  | 'wizard_step_1_completed'
  | 'wizard_step_2_completed'
  | 'wizard_step_3_completed'
  | 'wizard_step_4_completed'
  | 'wizard_step_5_completed'
  | 'wizard_completed'
  | 'wizard_skipped'
  | 'first_customer_created'
  | 'first_vehicle_created'
  | 'first_estimate_created'
  | 'first_service_order_created'
  | 'first_financial_transaction_created'
  | 'tenant_activated'
  | 'subscription_started'
  | 'subscription_upgraded'
  | 'subscription_canceled';

export const HAPPY_PATH_EVENTS: ActivationEventType[] = [
  'first_customer_created',
  'first_vehicle_created',
  'first_estimate_created',
  'first_service_order_created',
  'first_financial_transaction_created',
];

export interface ActivationRate {
  activated: number;
  total: number;
  rate: number;
}

export interface FunnelStep {
  event_type: ActivationEventType;
  count: number;
  rate: number;
}

@Injectable()
export class ActivationEventsService {
  constructor(
    @Inject(KNEX_ADMIN_CONNECTION) private readonly knex: Knex,
  ) {}

  async record(
    tenantId: string,
    eventType: ActivationEventType,
    eventData?: Record<string, unknown>,
    userId?: string,
  ): Promise<void> {
    try {
      await this.knex('activation_events').insert({
        id: generateId(),
        tenant_id: tenantId,
        user_id: userId ?? null,
        event_type: eventType,
        event_data: eventData ? JSON.stringify(eventData) : null,
        occurred_at: new Date(),
      });

      // Check if tenant just reached full activation
      await this.checkAndEmitActivated(tenantId);
    } catch {
      // Never fail the caller — activation tracking is non-critical
    }
  }

  private async checkAndEmitActivated(tenantId: string): Promise<void> {
    const alreadyActivated = await this.knex('activation_events')
      .where({ tenant_id: tenantId, event_type: 'tenant_activated' })
      .first();

    if (alreadyActivated) return;

    const tenantCreated = await this.knex('activation_events')
      .where({ tenant_id: tenantId, event_type: 'tenant_created' })
      .orderBy('occurred_at', 'asc')
      .first();

    if (!tenantCreated) return;

    const sevenDaysAgo = new Date(tenantCreated.occurred_at);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() + 7);

    const completedHappyPath = await this.knex('activation_events')
      .where('tenant_id', tenantId)
      .whereIn('event_type', HAPPY_PATH_EVENTS)
      .where('occurred_at', '<=', sevenDaysAgo)
      .countDistinct('event_type as count')
      .first();

    if (Number(completedHappyPath?.count) >= HAPPY_PATH_EVENTS.length) {
      await this.knex('activation_events').insert({
        id: generateId(),
        tenant_id: tenantId,
        user_id: null,
        event_type: 'tenant_activated',
        event_data: null,
        occurred_at: new Date(),
      });
    }
  }

  async getRate(periodDays: number = 30): Promise<ActivationRate> {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const result = await this.knex.raw<{ rows: Array<{ activated: string; total: string }> }>(`
      SELECT
        COUNT(DISTINCT a.tenant_id) AS activated,
        COUNT(DISTINCT t.tenant_id) AS total
      FROM activation_events t
      LEFT JOIN activation_events a
        ON a.tenant_id = t.tenant_id
        AND a.event_type = 'tenant_activated'
        AND a.occurred_at <= t.occurred_at + INTERVAL '7 days'
      WHERE t.event_type = 'tenant_created'
        AND t.occurred_at >= ?
    `, [since]);

    const { activated, total } = result.rows[0];
    const activatedN = Number(activated);
    const totalN = Number(total);

    return {
      activated: activatedN,
      total: totalN,
      rate: totalN > 0 ? Math.round((activatedN / totalN) * 100) / 100 : 0,
    };
  }

  async getFunnel(periodDays: number = 30): Promise<FunnelStep[]> {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const funnelEvents: ActivationEventType[] = [
      'tenant_created',
      'first_user_login',
      'first_customer_created',
      'first_vehicle_created',
      'first_estimate_created',
      'first_service_order_created',
      'first_financial_transaction_created',
      'tenant_activated',
    ];

    const counts = await this.knex('activation_events')
      .select('event_type')
      .count('* as count')
      .whereIn('event_type', funnelEvents)
      .where('occurred_at', '>=', since)
      .groupBy('event_type');

    const countMap = new Map(counts.map((r: any) => [r.event_type, Number(r.count)]));
    const totalCreated = countMap.get('tenant_created') || 1;

    return funnelEvents.map((event_type) => {
      const count = countMap.get(event_type) || 0;
      return {
        event_type,
        count,
        rate: Math.round((count / totalCreated) * 100) / 100,
      };
    });
  }

  async getRecent(limit: number = 50): Promise<any[]> {
    return this.knex('activation_events')
      .select('id', 'tenant_id', 'user_id', 'event_type', 'event_data', 'occurred_at')
      .orderBy('occurred_at', 'desc')
      .limit(limit);
  }
}

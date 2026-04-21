import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.module';
import { generateId } from '@sse/shared-utils';
import { ActivationEventsService } from '../admin/activation/activation.service';

export type WizardStatus = 'pending' | 'completed' | 'skipped';

export interface WizardStatusResult {
  wizard_status: WizardStatus;
  wizard_completed_at: string | null;
}

@Injectable()
export class TenantsService {
  constructor(
    @Inject(KNEX_ADMIN_CONNECTION) private readonly knex: Knex,
    private readonly activationEvents: ActivationEventsService,
  ) {}

  async create(data: any) {
    const id = generateId();
    const schemaName = `tenant_${id.replace(/-/g, '_')}`;

    const [tenant] = await this.knex('tenants')
      .insert({
        id,
        name: data.name,
        slug: data.slug,
        schema_name: schemaName,
        status: 'active',
        subscription_plan: 'free',
        owner_email: data.owner_email,
        settings: JSON.stringify(data.settings || {}),
      })
      .returning('*');

    // Create tenant schema
    await this.knex.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    await this.activationEvents.record(id, 'tenant_created');

    return tenant;
  }

  async findOne(id: string) {
    return this.knex('tenants').where({ id, deleted_at: null }).first();
  }

  async findBySlug(slug: string) {
    return this.knex('tenants').where({ slug, deleted_at: null }).first();
  }

  async getWizardStatus(tenantId: string): Promise<WizardStatusResult> {
    const tenant = await this.knex('tenants')
      .select('wizard_status', 'wizard_completed_at')
      .where({ id: tenantId, deleted_at: null })
      .first();

    return {
      wizard_status: tenant?.wizard_status ?? 'pending',
      wizard_completed_at: tenant?.wizard_completed_at ?? null,
    };
  }

  async startWizard(tenantId: string, userId?: string): Promise<void> {
    await this.activationEvents.record(tenantId, 'wizard_started', undefined, userId);
  }

  async recordWizardStep(tenantId: string, step: number, userId?: string): Promise<void> {
    const validSteps: Record<number, 'wizard_step_1_completed' | 'wizard_step_2_completed' | 'wizard_step_3_completed' | 'wizard_step_4_completed' | 'wizard_step_5_completed'> = {
      1: 'wizard_step_1_completed',
      2: 'wizard_step_2_completed',
      3: 'wizard_step_3_completed',
      4: 'wizard_step_4_completed',
      5: 'wizard_step_5_completed',
    };

    const eventType = validSteps[step];
    if (eventType) {
      await this.activationEvents.record(tenantId, eventType, undefined, userId);
    }
  }

  async completeWizard(tenantId: string, userId?: string): Promise<WizardStatusResult> {
    const current = await this.getWizardStatus(tenantId);
    if (current.wizard_status !== 'pending') {
      return current;
    }

    const now = new Date();
    await this.knex('tenants')
      .where({ id: tenantId, wizard_status: 'pending' })
      .update({ wizard_status: 'completed', wizard_completed_at: now });

    await this.activationEvents.record(tenantId, 'wizard_completed', undefined, userId);

    return { wizard_status: 'completed', wizard_completed_at: now.toISOString() };
  }

  async skipWizard(tenantId: string, userId?: string): Promise<WizardStatusResult> {
    await this.knex('tenants')
      .where({ id: tenantId })
      .update({ wizard_status: 'skipped' });

    await this.activationEvents.record(tenantId, 'wizard_skipped', undefined, userId);

    return { wizard_status: 'skipped', wizard_completed_at: null };
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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

  async findOneSafe(id: string) {
    return this.knex('tenants')
      .select(
        'id', 'name', 'slug', 'status', 'subscription_plan',
        'owner_email', 'wizard_status', 'wizard_completed_at', 'created_at',
      )
      .where({ id, deleted_at: null })
      .first();
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

  async listAllForSuperUser(): Promise<any[]> {
    return this.knex('tenants')
      .select(
        'id', 'name', 'slug', 'status', 'subscription_plan',
        'owner_email', 'wizard_status', 'wizard_completed_at', 'created_at',
      )
      .where({ deleted_at: null })
      .orderBy('created_at', 'desc');
  }

  async provisionTenantAdmin(
    tenantId: string,
    data: { email: string; firstName: string; lastName: string; role: 'owner' | 'admin'; externalAuthId?: string },
    superUserEmail: string,
  ): Promise<{ userId: string; tenantId: string; role: string }> {
    const tenant = await this.knex('tenants')
      .where({ id: tenantId, deleted_at: null })
      .select('id', 'schema_name')
      .first();

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const schemaName: string = tenant.schema_name;
    if (!/^tenant_[0-9a-f_]{32,}$/.test(schemaName)) {
      throw new Error(`Unexpected schema name format: ${schemaName}`);
    }

    const userId = generateId();
    const now = new Date();

    const resolvedUserId = await this.knex.transaction(async (trx) => {
      // SET LOCAL keeps search_path scoped to this transaction only, preventing pool leak
      await trx.raw(`SET LOCAL search_path TO "${schemaName}", public`);

      await trx.raw(`
        INSERT INTO "${schemaName}".users
          (id, tenant_id, email, first_name, last_name, status, external_auth_id, created_at, updated_at)
        VALUES
          (?, ?, ?, ?, ?, 'active', ?, ?, ?)
        ON CONFLICT (email, tenant_id) DO NOTHING
      `, [userId, tenantId, data.email.toLowerCase(), data.firstName, data.lastName,
          data.externalAuthId ?? null, now, now]);

      // Look up the actual user id (may differ if conflict resolved via ON CONFLICT)
      const existingUser = await trx.raw(
        `SELECT id FROM "${schemaName}".users WHERE email = ? AND tenant_id = ?`,
        [data.email.toLowerCase(), tenantId],
      );
      const inner: string = existingUser.rows?.[0]?.id ?? userId;

      // Assign role
      const roleRow = await trx.raw(
        `SELECT id FROM "${schemaName}".roles WHERE name = ? AND tenant_id = ? LIMIT 1`,
        [data.role, tenantId],
      );
      if (roleRow.rows?.length) {
        const roleId = roleRow.rows[0].id;
        await trx.raw(`
          INSERT INTO "${schemaName}".user_role_assignments (id, user_id, role_id, tenant_id, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT DO NOTHING
        `, [generateId(), inner, roleId, tenantId, now]);
      }

      // Audit log — new_values captures the performing super user for compliance trail
      await trx.raw(`
        INSERT INTO "${schemaName}".audit_logs
          (id, tenant_id, user_id, action, resource_type, resource_id,
           is_super_user_action, target_tenant_id, new_values, created_at)
        VALUES (?, ?, NULL, 'PROVISION_ADMIN', 'users', ?, TRUE, ?, ?::jsonb, ?)
      `, [generateId(), tenantId, inner, tenantId,
          JSON.stringify({ performed_by_super_user: superUserEmail }), now]);

      return inner;
    });

    return { userId: resolvedUserId, tenantId, role: data.role };
  }
}

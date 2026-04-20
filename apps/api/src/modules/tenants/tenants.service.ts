import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.module';
import { generateId } from '@sse/shared-utils';
import { ActivationEventsService } from '../admin/activation/activation.service';

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
}

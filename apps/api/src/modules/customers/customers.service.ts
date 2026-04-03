import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../config/database.module';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class CustomersService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findAll(tenantId: string, _query: any) {
    return this.knex('customers').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const [record] = await this.knex('customers')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.knex('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async update(tenantId: string, id: string, data: any) {
    const [record] = await this.knex('customers')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    await this.knex('customers')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

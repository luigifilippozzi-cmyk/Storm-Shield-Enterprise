import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class CustomersService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, _query: any) {
    const knex = await this.tenantDb.getConnection();
    return knex('customers').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('customers')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async update(tenantId: string, id: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('customers')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    await knex('customers')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class ServiceOrdersService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, _query: any) {
    const knex = await this.tenantDb.getConnection();
    return knex('service_orders').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('service_orders')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('service_orders')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Service order not found');
    return record;
  }

  async update(tenantId: string, id: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('service_orders')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Service order not found');
    return record;
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('service_orders')
      .where({ id, tenant_id: tenantId })
      .update({ status, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Service order not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    await knex('service_orders')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

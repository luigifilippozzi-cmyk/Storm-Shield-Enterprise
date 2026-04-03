import { Injectable } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class UsersService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, _query: any) {
    const knex = await this.tenantDb.getConnection();
    return knex('users').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [user] = await knex('users')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return user;
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('users').where({ id, tenant_id: tenantId, deleted_at: null }).first();
  }

  async update(tenantId: string, id: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [user] = await knex('users')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return user;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    await knex('users')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

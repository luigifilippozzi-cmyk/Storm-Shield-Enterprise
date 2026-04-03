import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../config/database.module';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class UsersService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findAll(tenantId: string, _query: any) {
    return this.knex('users').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const [user] = await this.knex('users')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return user;
  }

  async findOne(tenantId: string, id: string) {
    return this.knex('users').where({ id, tenant_id: tenantId, deleted_at: null }).first();
  }

  async update(tenantId: string, id: string, data: any) {
    const [user] = await this.knex('users')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return user;
  }

  async remove(tenantId: string, id: string) {
    await this.knex('users')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class FinancialService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, _query: any) {
    const knex = await this.tenantDb.getConnection();
    return knex('financial_transactions').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('financial_transactions')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('financial_transactions')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Financial transaction not found');
    return record;
  }

  async update(tenantId: string, id: string, data: any) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('financial_transactions')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Financial transaction not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    await knex('financial_transactions')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }

  async getSummary(tenantId: string, _query: any) {
    const knex = await this.tenantDb.getConnection();
    const result = await knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null })
      .select(
        knex.raw('COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) as total_income', ['income']),
        knex.raw('COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) as total_expense', ['expense']),
        knex.raw('COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE -amount END), 0) as balance', ['income']),
        knex.raw('COUNT(*) as total_transactions'),
      )
      .first();
    return result;
  }
}

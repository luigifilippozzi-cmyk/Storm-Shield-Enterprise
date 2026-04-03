import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../config/database.module';
import { generateId } from '@sse/shared-utils';

@Injectable()
export class FinancialService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findAll(tenantId: string, _query: any) {
    return this.knex('financial_transactions').where({ tenant_id: tenantId, deleted_at: null });
  }

  async create(tenantId: string, data: any) {
    const [record] = await this.knex('financial_transactions')
      .insert({ id: generateId(), tenant_id: tenantId, ...data })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.knex('financial_transactions')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Financial transaction not found');
    return record;
  }

  async update(tenantId: string, id: string, data: any) {
    const [record] = await this.knex('financial_transactions')
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Financial transaction not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    await this.knex('financial_transactions')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }

  async getSummary(tenantId: string, _query: any) {
    const result = await this.knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null })
      .select(
        this.knex.raw('COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) as total_income', ['income']),
        this.knex.raw('COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) as total_expense', ['expense']),
        this.knex.raw('COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE -amount END), 0) as balance', ['income']),
        this.knex.raw('COUNT(*) as total_transactions'),
      )
      .first();
    return result;
  }
}

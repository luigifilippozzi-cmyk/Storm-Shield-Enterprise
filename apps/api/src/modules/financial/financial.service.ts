import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { ActivationEventsService } from '../admin/activation/activation.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class FinancialService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly activationEvents: ActivationEventsService,
  ) {}

  async findAll(tenantId: string, query: QueryTransactionDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, transaction_type, category, customer_id, date_from, date_to, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('description', `%${search}%`)
          .orWhereILike('reference_number', `%${search}%`);
      });
    }

    if (transaction_type) {
      baseQuery.where('transaction_type', transaction_type);
    }

    if (category) {
      baseQuery.where('category', category);
    }

    if (customer_id) {
      baseQuery.where('customer_id', customer_id);
    }

    if (date_from) {
      baseQuery.where('transaction_date', '>=', date_from);
    }

    if (date_to) {
      baseQuery.where('transaction_date', '<=', date_to);
    }

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const allowedSorts = ['transaction_type', 'category', 'amount', 'transaction_date', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .select('*')
      .orderBy(sortColumn, sort_order)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(tenantId: string, dto: CreateTransactionDto) {
    const knex = await this.tenantDb.getConnection();
    const isFirst = !(await knex('financial_transactions').where({ tenant_id: tenantId, deleted_at: null }).first());
    const [record] = await knex('financial_transactions')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
      })
      .returning('*');
    if (isFirst) await this.activationEvents.record(tenantId, 'first_financial_transaction_created');
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

  async update(tenantId: string, id: string, dto: UpdateTransactionDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('financial_transactions')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Financial transaction not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('financial_transactions')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Financial transaction not found');

    await knex('financial_transactions')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }

  async getSummary(tenantId: string) {
    const knex = await this.tenantDb.getConnection();
    const result = await knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null })
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income"),
        knex.raw("COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses"),
        knex.raw("COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0) as net_balance"),
        knex.raw('COUNT(*) as total_transactions'),
      )
      .first();
    return result;
  }

  async getDashboard(tenantId: string) {
    const knex = await this.tenantDb.getConnection();

    const summary = await this.getSummary(tenantId);

    const incomeByCategory = await knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null, transaction_type: 'income' })
      .select('category')
      .sum('amount as total')
      .groupBy('category')
      .orderBy('total', 'desc');

    const expenseByCategory = await knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null, transaction_type: 'expense' })
      .select('category')
      .sum('amount as total')
      .groupBy('category')
      .orderBy('total', 'desc');

    const monthlyTrend = await knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null })
      .where('transaction_date', '>=', knex.raw("CURRENT_DATE - INTERVAL '12 months'"))
      .select(
        knex.raw("TO_CHAR(transaction_date, 'YYYY-MM') as month"),
        knex.raw("COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as income"),
        knex.raw("COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as expenses"),
      )
      .groupByRaw("TO_CHAR(transaction_date, 'YYYY-MM')")
      .orderBy('month', 'asc');

    const recentTransactions = await knex('financial_transactions')
      .where({ tenant_id: tenantId, deleted_at: null })
      .orderBy('created_at', 'desc')
      .limit(10);

    return {
      summary,
      income_by_category: incomeByCategory,
      expense_by_category: expenseByCategory,
      monthly_trend: monthlyTrend,
      recent_transactions: recentTransactions,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
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
export class CustomersService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly activationEvents: ActivationEventsService,
  ) {}

  async findAll(tenantId: string, query: QueryCustomerDto): Promise<PaginatedResult<any>> {
    const { search, type, source, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = this.tenantDb.table('customers').where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('phone', `%${search}%`)
          .orWhereILike('company_name', `%${search}%`);
      });
    }

    if (type) {
      baseQuery.where('type', type);
    }

    if (source) {
      baseQuery.where('source', source);
    }

    // Count total
    const [{ count }] = await baseQuery.clone().count<{ count: string | number }[]>('id as count');
    const total = Number(count);

    // Validate sort column
    const allowedSorts = ['first_name', 'last_name', 'email', 'phone', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    // Fetch paginated data
    const offset = (page - 1) * limit;
    const data = await baseQuery
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

  async create(tenantId: string, dto: CreateCustomerDto) {
    const isFirst = !(await this.tenantDb.table('customers').where({ tenant_id: tenantId, deleted_at: null }).first());
    const [record] = await this.tenantDb.table('customers')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
      })
      .returning('*');
    if (isFirst) await this.activationEvents.record(tenantId, 'first_customer_created');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.tenantDb.table('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    const [record] = await this.tenantDb.table('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const updated = await this.tenantDb.table('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });
    if (!updated) throw new NotFoundException('Customer not found');
    return { deleted: true };
  }

  async getSummary(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const [openEstimates, openSOs, balance, ytdRevenue, lastEstimate, lastSO] = await Promise.all([
      this.tenantDb.table('estimates')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .whereNotIn('status', ['converted', 'rejected'])
        .count<{ count: string | number }[]>('id as count')
        .first(),
      this.tenantDb.table('service_orders')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .whereNotIn('status', ['completed', 'delivered', 'cancelled'])
        .count<{ count: string | number }[]>('id as count')
        .first(),
      this.tenantDb.table('financial_transactions')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .where('transaction_type', 'income')
        .sum<{ total: string | number | null }[]>('amount as total')
        .first(),
      this.tenantDb.table('financial_transactions')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .where('transaction_type', 'income')
        .whereRaw('EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM NOW())')
        .sum<{ total: string | number | null }[]>('amount as total')
        .first(),
      this.tenantDb.table('estimates')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .max('updated_at as ts')
        .first(),
      this.tenantDb.table('service_orders')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .max('updated_at as ts')
        .first(),
    ]);

    const estimateTs = (lastEstimate as any)?.ts;
    const soTs = (lastSO as any)?.ts;
    let last_activity_at: Date | null = null;
    if (estimateTs && soTs) {
      last_activity_at = new Date(Math.max(new Date(estimateTs).getTime(), new Date(soTs).getTime()));
    } else if (estimateTs) {
      last_activity_at = new Date(estimateTs);
    } else if (soTs) {
      last_activity_at = new Date(soTs);
    }

    return {
      open_estimates_count: Number((openEstimates as any)?.count ?? 0),
      open_so_count: Number((openSOs as any)?.count ?? 0),
      balance: Number((balance as any)?.total ?? 0),
      ytd_revenue: Number((ytdRevenue as any)?.total ?? 0),
      last_activity_at,
    };
  }

  async getActivityTimeline(tenantId: string, id: string, limit = 50) {
    const safeLimit = Number.isNaN(limit) ? 50 : Math.max(1, Math.min(limit, 200));
    await this.findOne(tenantId, id);
    const schema = this.tenantDb.tenantSchema;
    const t = (name: string) => (schema ? `${schema}.${name}` : name);
    const knex = this.tenantDb.getPublicConnection();

    const [interactions, soStatusChanges, finTx, estimates] = await Promise.all([
      this.tenantDb.table('customer_interactions')
        .where({ customer_id: id, tenant_id: tenantId })
        .select('id', 'type as event_subtype', 'subject as description', 'notes', 'interaction_date as occurred_at')
        .orderBy('interaction_date', 'desc')
        .limit(safeLimit),
      knex({ ssh: t('so_status_history') })
        .join({ so: t('service_orders') }, 'so.id', 'ssh.service_order_id')
        .where({ 'so.customer_id': id, 'so.tenant_id': tenantId, 'ssh.tenant_id': tenantId })
        .select(
          'ssh.id',
          'ssh.from_status',
          'ssh.to_status',
          'ssh.notes',
          'ssh.created_at as occurred_at',
          'so.order_number as description',
        )
        .orderBy('ssh.created_at', 'desc')
        .limit(safeLimit),
      this.tenantDb.table('financial_transactions')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .select('id', 'transaction_type as event_subtype', 'amount', 'description', 'created_at as occurred_at')
        .orderBy('created_at', 'desc')
        .limit(safeLimit),
      this.tenantDb.table('estimates')
        .where({ customer_id: id, tenant_id: tenantId, deleted_at: null })
        .select('id', 'status as event_subtype', 'estimate_number as description', 'created_at as occurred_at')
        .orderBy('created_at', 'desc')
        .limit(safeLimit),
    ]);

    const events = [
      ...(interactions as any[]).map(r => ({ ...r, event_type: 'interaction' })),
      ...(soStatusChanges as any[]).map(r => ({ ...r, event_type: 'so_status_change' })),
      ...(finTx as any[]).map(r => ({ ...r, event_type: 'payment' })),
      ...(estimates as any[]).map(r => ({ ...r, event_type: 'estimate_created' })),
    ];

    return events
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, safeLimit);
  }
}

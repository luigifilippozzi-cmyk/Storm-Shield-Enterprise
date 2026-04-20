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
    const knex = await this.tenantDb.getConnection();
    const { search, type, source, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('customers').where({ tenant_id: tenantId, deleted_at: null });

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
    const [{ count }] = await baseQuery.clone().count('id as count');
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
    const knex = await this.tenantDb.getConnection();
    const isFirst = !(await knex('customers').where({ tenant_id: tenantId, deleted_at: null }).first());
    const [record] = await knex('customers')
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
    const knex = await this.tenantDb.getConnection();
    const record = await knex('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Customer not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const updated = await knex('customers')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });
    if (!updated) throw new NotFoundException('Customer not found');
    return { deleted: true };
  }
}

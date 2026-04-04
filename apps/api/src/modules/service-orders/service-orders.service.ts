import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { QueryServiceOrderDto } from './dto/query-service-order.dto';
import { UpdateServiceOrderStatusDto } from './dto/update-status.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['waiting_parts', 'waiting_approval', 'completed', 'cancelled'],
  waiting_parts: ['in_progress', 'cancelled'],
  waiting_approval: ['in_progress', 'completed', 'cancelled'],
  completed: ['delivered'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class ServiceOrdersService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryServiceOrderDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, status, customer_id, vehicle_id, assigned_to, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('service_orders')
      .where({ 'service_orders.tenant_id': tenantId, 'service_orders.deleted_at': null });

    if (search) {
      baseQuery
        .leftJoin('customers as c_search', 'service_orders.customer_id', 'c_search.id')
        .where(function () {
          this.whereILike('service_orders.order_number', `%${search}%`)
            .orWhereILike('c_search.first_name', `%${search}%`)
            .orWhereILike('c_search.last_name', `%${search}%`);
        });
    }

    if (status) {
      baseQuery.where('service_orders.status', status);
    }

    if (customer_id) {
      baseQuery.where('service_orders.customer_id', customer_id);
    }

    if (vehicle_id) {
      baseQuery.where('service_orders.vehicle_id', vehicle_id);
    }

    if (assigned_to) {
      baseQuery.where('service_orders.assigned_to', assigned_to);
    }

    const [{ count }] = await baseQuery.clone().count('service_orders.id as count');
    const total = Number(count);

    const allowedSorts = ['order_number', 'status', 'total_amount', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .select(
        'service_orders.*',
        knex.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
        knex.raw("vehicles.year || ' ' || vehicles.make || ' ' || vehicles.model as vehicle_description"),
      )
      .leftJoin('customers', 'service_orders.customer_id', 'customers.id')
      .leftJoin('vehicles', 'service_orders.vehicle_id', 'vehicles.id')
      .orderBy(`service_orders.${sortColumn}`, sort_order)
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

  async create(tenantId: string, dto: CreateServiceOrderDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('service_orders')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
        status: 'pending',
      })
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

  async update(tenantId: string, id: string, dto: UpdateServiceOrderDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('service_orders')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Service order not found');
    return record;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateServiceOrderStatusDto) {
    const knex = await this.tenantDb.getConnection();
    const order = await knex('service_orders')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!order) throw new NotFoundException('Service order not found');

    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${order.status}' to '${dto.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateFields: any = { status: dto.status, updated_at: new Date() };
    if (dto.status === 'in_progress' && !order.started_at) {
      updateFields.started_at = new Date();
    }
    if (dto.status === 'completed') {
      updateFields.completed_at = new Date();
    }
    if (dto.status === 'delivered') {
      updateFields.delivered_at = new Date();
    }

    const [record] = await knex('service_orders')
      .where({ id, tenant_id: tenantId })
      .update(updateFields)
      .returning('*');

    // Record status history
    await knex('so_status_history').insert({
      id: generateId(),
      tenant_id: tenantId,
      service_order_id: id,
      from_status: order.status,
      to_status: dto.status,
      changed_by: order.assigned_to || order.customer_id, // Ideally from auth context
      notes: dto.notes,
    });

    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const order = await knex('service_orders')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!order) throw new NotFoundException('Service order not found');

    if (!['pending', 'cancelled'].includes(order.status)) {
      throw new BadRequestException('Only pending or cancelled service orders can be deleted');
    }

    await knex('service_orders')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

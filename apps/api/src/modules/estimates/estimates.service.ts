import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { QueryEstimateDto } from './dto/query-estimate.dto';
import { UpdateEstimateStatusDto } from './dto/update-status.dto';

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
  draft: ['sent'],
  sent: ['approved', 'rejected'],
  approved: ['supplement_requested', 'converted'],
  rejected: ['draft'],
  supplement_requested: ['sent'],
  converted: [],
};

@Injectable()
export class EstimatesService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryEstimateDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, status, customer_id, vehicle_id, date_from, date_to, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('estimates')
      .where({ 'estimates.tenant_id': tenantId, 'estimates.deleted_at': null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('estimates.estimate_number', `%${search}%`)
          .orWhereILike('estimates.claim_number', `%${search}%`)
          .orWhereILike('customers.first_name', `%${search}%`)
          .orWhereILike('customers.last_name', `%${search}%`);
      });
    }

    if (status) {
      baseQuery.where('estimates.status', status);
    }

    if (customer_id) {
      baseQuery.where('estimates.customer_id', customer_id);
    }

    if (vehicle_id) {
      baseQuery.where('estimates.vehicle_id', vehicle_id);
    }

    if (date_from) {
      baseQuery.where('estimates.created_at', '>=', date_from);
    }

    if (date_to) {
      baseQuery.where('estimates.created_at', '<=', date_to);
    }

    // Join customers for search
    baseQuery.leftJoin('customers', 'estimates.customer_id', 'customers.id');

    const [{ count }] = await baseQuery.clone().count('estimates.id as count');
    const total = Number(count);

    const allowedSorts = ['estimate_number', 'total', 'status', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .select(
        'estimates.*',
        knex.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
      )
      .leftJoin('vehicles', 'estimates.vehicle_id', 'vehicles.id')
      .select(
        knex.raw("vehicles.year || ' ' || vehicles.make || ' ' || vehicles.model as vehicle_description"),
      )
      .orderBy(`estimates.${sortColumn}`, sort_order)
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

  async create(tenantId: string, dto: CreateEstimateDto) {
    const knex = await this.tenantDb.getConnection();
    const { lines, ...estimateData } = dto;

    return knex.transaction(async (trx) => {
      // Calculate totals from lines
      let subtotal = 0;
      if (lines && lines.length > 0) {
        subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
      }
      const taxAmount = 0; // Tax calculation can be configured per tenant later
      const total = subtotal + taxAmount;

      const [estimate] = await trx('estimates')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          ...estimateData,
          status: 'draft',
          subtotal,
          tax_amount: taxAmount,
          total,
        })
        .returning('*');

      // Insert lines
      if (lines && lines.length > 0) {
        const lineRecords = lines.map((line) => ({
          id: generateId(),
          tenant_id: tenantId,
          estimate_id: estimate.id,
          ...line,
          total: line.quantity * line.unit_price,
        }));
        await trx('estimate_lines').insert(lineRecords);
      }

      return estimate;
    });
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const estimate = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    const lines = await knex('estimate_lines')
      .where({ estimate_id: id, tenant_id: tenantId })
      .orderBy('sort_order', 'asc');

    const supplements = await knex('estimate_supplements')
      .where({ estimate_id: id, tenant_id: tenantId })
      .orderBy('supplement_number', 'asc');

    return { ...estimate, lines, supplements };
  }

  async update(tenantId: string, id: string, dto: UpdateEstimateDto) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!existing) throw new NotFoundException('Estimate not found');

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft estimates can be edited');
    }

    const { lines, ...estimateData } = dto;

    return knex.transaction(async (trx) => {
      let updateFields: any = { ...estimateData, updated_at: new Date() };

      if (lines && lines.length > 0) {
        // Recalculate totals
        const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
        updateFields.subtotal = subtotal;
        updateFields.tax_amount = 0;
        updateFields.total = subtotal;

        // Replace existing lines
        await trx('estimate_lines').where({ estimate_id: id, tenant_id: tenantId }).del();
        const lineRecords = lines.map((line) => ({
          id: generateId(),
          tenant_id: tenantId,
          estimate_id: id,
          ...line,
          total: line.quantity * line.unit_price,
        }));
        await trx('estimate_lines').insert(lineRecords);
      }

      const [record] = await trx('estimates')
        .where({ id, tenant_id: tenantId })
        .update(updateFields)
        .returning('*');

      return record;
    });
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateEstimateStatusDto) {
    const knex = await this.tenantDb.getConnection();
    const estimate = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    const allowed = ALLOWED_STATUS_TRANSITIONS[estimate.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${estimate.status}' to '${dto.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateFields: any = { status: dto.status, updated_at: new Date() };
    if (dto.status === 'approved') {
      updateFields.approved_at = new Date();
    }

    const [record] = await knex('estimates')
      .where({ id, tenant_id: tenantId })
      .update(updateFields)
      .returning('*');

    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const estimate = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    if (estimate.status !== 'draft') {
      throw new BadRequestException('Only draft estimates can be deleted');
    }

    await knex('estimates')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }
}

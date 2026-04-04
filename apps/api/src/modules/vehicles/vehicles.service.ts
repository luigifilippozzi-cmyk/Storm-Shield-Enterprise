import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';

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
export class VehiclesService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryVehicleDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, customer_id, make, year, condition, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('vehicles').where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('vin', `%${search}%`)
          .orWhereILike('make', `%${search}%`)
          .orWhereILike('model', `%${search}%`)
          .orWhereILike('license_plate', `%${search}%`);
      });
    }

    if (customer_id) {
      baseQuery.where('customer_id', customer_id);
    }

    if (make) {
      baseQuery.whereILike('make', `%${make}%`);
    }

    if (year) {
      baseQuery.where('year', year);
    }

    if (condition) {
      baseQuery.where('condition', condition);
    }

    // Count total
    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    // Validate sort column
    const allowedSorts = ['year', 'make', 'model', 'created_at', 'updated_at', 'mileage'];
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

  async create(tenantId: string, dto: CreateVehicleDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('vehicles')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
      })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('vehicles')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Vehicle not found');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateVehicleDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('vehicles')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Vehicle not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const updated = await knex('vehicles')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });
    if (!updated) throw new NotFoundException('Vehicle not found');
    return { deleted: true };
  }
}

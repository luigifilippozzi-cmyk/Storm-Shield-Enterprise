import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { QueryFixedAssetDto } from './dto/query-fixed-asset.dto';

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
export class FixedAssetsService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryFixedAssetDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const {
      search, status, category_id, depreciation_method,
      page = 1, limit = 50,
      sort_by = 'asset_tag', sort_order = 'asc',
    } = query;

    const baseQuery = knex('fixed_assets').where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('asset_tag', `%${search}%`)
          .orWhereILike('asset_name', `%${search}%`)
          .orWhereILike('serial_number', `%${search}%`);
      });
    }

    if (status) baseQuery.where('status', status);
    if (category_id) baseQuery.where('category_id', category_id);
    if (depreciation_method) baseQuery.where('depreciation_method', depreciation_method);

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const allowedSorts = ['asset_tag', 'asset_name', 'acquisition_date', 'acquisition_cost', 'net_book_value', 'status', 'created_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'asset_tag';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .orderBy(sortColumn, sort_order)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('fixed_assets')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Fixed asset not found');
    return record;
  }

  async create(tenantId: string, dto: CreateFixedAssetDto) {
    const knex = await this.tenantDb.getConnection();

    // Validate category exists
    const category = await knex('asset_categories')
      .where({ id: dto.category_id, tenant_id: tenantId })
      .first();
    if (!category) throw new BadRequestException('Asset category not found');

    // Validate unique asset_tag
    const existing = await knex('fixed_assets')
      .where({ tenant_id: tenantId, asset_tag: dto.asset_tag, deleted_at: null })
      .first();
    if (existing) throw new BadRequestException(`Asset tag "${dto.asset_tag}" already exists`);

    // Validate salvage <= cost
    const salvageValue = dto.salvage_value ?? 0;
    if (salvageValue > dto.acquisition_cost) {
      throw new BadRequestException('Salvage value cannot exceed acquisition cost');
    }

    const netBookValue = dto.acquisition_cost;

    const [record] = await knex('fixed_assets')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
        salvage_value: salvageValue,
        net_book_value: netBookValue,
        accumulated_depreciation: 0,
        status: 'active',
      })
      .returning('*');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateFixedAssetDto) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('fixed_assets')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!existing) throw new NotFoundException('Fixed asset not found');

    if (existing.status === 'disposed') {
      throw new BadRequestException('Cannot update a disposed asset');
    }

    const [record] = await knex('fixed_assets')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('fixed_assets')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!existing) throw new NotFoundException('Fixed asset not found');

    if (existing.status === 'active' && Number(existing.accumulated_depreciation) > 0) {
      throw new BadRequestException('Cannot delete an asset with depreciation entries. Dispose it instead.');
    }

    await knex('fixed_assets')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });

    return { deleted: true };
  }

  async getDepreciationHistory(tenantId: string, assetId: string) {
    const knex = await this.tenantDb.getConnection();

    // Verify asset exists
    const asset = await knex('fixed_assets')
      .where({ id: assetId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!asset) throw new NotFoundException('Fixed asset not found');

    return knex('depreciation_entries')
      .where({ tenant_id: tenantId, fixed_asset_id: assetId })
      .orderBy('entry_date', 'asc');
  }

  async getSchedule(tenantId: string, assetId: string) {
    const knex = await this.tenantDb.getConnection();

    const asset = await knex('fixed_assets')
      .where({ id: assetId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!asset) throw new NotFoundException('Fixed asset not found');

    return knex('depreciation_schedules')
      .where({ tenant_id: tenantId, fixed_asset_id: assetId })
      .orderBy('period_number', 'asc');
  }
}

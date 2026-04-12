import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';

@Injectable()
export class AssetCategoriesService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('asset_categories')
      .where({ tenant_id: tenantId })
      .orderBy('category_name', 'asc');
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('asset_categories')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!record) throw new NotFoundException('Asset category not found');
    return record;
  }

  async create(tenantId: string, dto: CreateAssetCategoryDto) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('asset_categories')
      .where({ tenant_id: tenantId, category_name: dto.category_name })
      .first();
    if (existing) {
      throw new ConflictException(`Category "${dto.category_name}" already exists`);
    }

    const [record] = await knex('asset_categories')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
      })
      .returning('*');
    return record;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateAssetCategoryDto>) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('asset_categories')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!existing) throw new NotFoundException('Asset category not found');

    if (dto.category_name && dto.category_name !== existing.category_name) {
      const duplicate = await knex('asset_categories')
        .where({ tenant_id: tenantId, category_name: dto.category_name })
        .whereNot({ id })
        .first();
      if (duplicate) {
        throw new ConflictException(`Category "${dto.category_name}" already exists`);
      }
    }

    const [record] = await knex('asset_categories')
      .where({ id, tenant_id: tenantId })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    return record;
  }
}

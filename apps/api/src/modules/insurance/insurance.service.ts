import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateInsuranceCompanyDto, UpdateInsuranceCompanyDto, QueryInsuranceCompanyDto } from './dto';

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
export class InsuranceService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryInsuranceCompanyDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, is_drp, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('insurance_companies').where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('code', `%${search}%`)
          .orWhereILike('email', `%${search}%`);
      });
    }

    if (is_drp !== undefined) {
      baseQuery.where('is_drp', is_drp);
    }

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const allowedSorts = ['name', 'code', 'payment_terms_days', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

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

  async create(tenantId: string, dto: CreateInsuranceCompanyDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('insurance_companies')
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
    const record = await knex('insurance_companies')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Insurance company not found');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateInsuranceCompanyDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('insurance_companies')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Insurance company not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const updated = await knex('insurance_companies')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });
    if (!updated) throw new NotFoundException('Insurance company not found');
    return { deleted: true };
  }

  getSeedList() {
    return [
      { name: 'State Farm', code: 'STATE_FARM', phone: '800-732-5246', is_drp: false },
      { name: 'Geico', code: 'GEICO', phone: '800-841-3000', is_drp: false },
      { name: 'Progressive', code: 'PROGRESSIVE', phone: '800-776-4737', is_drp: false },
      { name: 'Allstate', code: 'ALLSTATE', phone: '800-255-7828', is_drp: false },
      { name: 'USAA', code: 'USAA', phone: '800-531-8722', is_drp: false },
    ];
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateFiscalPeriodDto } from './dto/create-fiscal-period.dto';
import { QueryFiscalPeriodDto } from './dto/query-fiscal-period.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class FiscalPeriodsService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryFiscalPeriodDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { status, page = 1, limit = 50, sort_by = 'start_date', sort_order = 'desc' } = query;

    const baseQuery = knex('fiscal_periods').where({ tenant_id: tenantId });

    if (status) {
      baseQuery.where('status', status);
    }

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const allowedSorts = ['name', 'start_date', 'end_date', 'status', 'created_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'start_date';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .orderBy(sortColumn, sort_order)
      .limit(limit)
      .offset(offset);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('fiscal_periods')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!record) throw new NotFoundException('Fiscal period not found');
    return record;
  }

  async create(tenantId: string, dto: CreateFiscalPeriodDto) {
    const knex = await this.tenantDb.getConnection();

    if (dto.start_date >= dto.end_date) {
      throw new BadRequestException('start_date must be before end_date');
    }

    // Check for overlapping periods
    const overlap = await knex('fiscal_periods')
      .where({ tenant_id: tenantId })
      .where('start_date', '<', dto.end_date)
      .where('end_date', '>', dto.start_date)
      .first();
    if (overlap) {
      throw new BadRequestException(`Overlaps with existing period "${overlap.name}"`);
    }

    const [record] = await knex('fiscal_periods')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
        status: 'open',
      })
      .returning('*');
    return record;
  }

  async close(tenantId: string, id: string, userId: string) {
    const knex = await this.tenantDb.getConnection();
    const period = await knex('fiscal_periods')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!period) throw new NotFoundException('Fiscal period not found');

    if (period.status !== 'open') {
      throw new BadRequestException(`Cannot close a period with status "${period.status}"`);
    }

    // Check for draft entries in this period
    const draftEntries = await knex('journal_entries')
      .where({ fiscal_period_id: id, tenant_id: tenantId, status: 'draft' })
      .first();
    if (draftEntries) {
      throw new BadRequestException('Cannot close period with draft journal entries. Post or delete them first.');
    }

    const [record] = await knex('fiscal_periods')
      .where({ id, tenant_id: tenantId })
      .update({ status: 'closed', closed_at: new Date(), closed_by: userId })
      .returning('*');
    return record;
  }

  async reopen(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const period = await knex('fiscal_periods')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!period) throw new NotFoundException('Fiscal period not found');

    if (period.status === 'locked') {
      throw new BadRequestException('Locked periods cannot be reopened');
    }
    if (period.status === 'open') {
      throw new BadRequestException('Period is already open');
    }

    const [record] = await knex('fiscal_periods')
      .where({ id, tenant_id: tenantId })
      .update({ status: 'open', closed_at: null, closed_by: null })
      .returning('*');
    return record;
  }

  /** Find the open fiscal period that covers a given date */
  async findOpenPeriodForDate(tenantId: string, date: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('fiscal_periods')
      .where({ tenant_id: tenantId, status: 'open' })
      .where('start_date', '<=', date)
      .where('end_date', '>=', date)
      .first();
  }
}

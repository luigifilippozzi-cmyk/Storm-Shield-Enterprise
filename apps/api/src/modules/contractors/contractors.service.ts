import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { QueryContractorDto } from './dto/query-contractor.dto';
import { CreateContractorPaymentDto } from './dto/create-payment.dto';

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
export class ContractorsService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryContractorDto): Promise<PaginatedResult<any>> {
    const { search, status, specialty, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = this.tenantDb.table('contractors')
      .where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('company_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('phone', `%${search}%`);
      });
    }

    if (status) {
      baseQuery.where('status', status);
    }

    if (specialty) {
      baseQuery.whereILike('specialty', `%${specialty}%`);
    }

    const [{ count }] = await baseQuery.clone().count<{ count: string | number }[]>('id as count');
    const total = Number(count);

    const allowedSorts = ['first_name', 'last_name', 'company_name', 'specialty', 'hourly_rate', 'created_at', 'updated_at'];
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

  async create(tenantId: string, dto: CreateContractorDto) {
    const [record] = await this.tenantDb.table('contractors')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
      })
      .returning('*');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.tenantDb.table('contractors')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Contractor not found');

    const payments = await this.tenantDb.table('contractor_payments')
      .where({ contractor_id: id, tenant_id: tenantId })
      .orderBy('payment_date', 'desc');

    const [{ total_paid }] = await this.tenantDb.table('contractor_payments')
      .where({ contractor_id: id, tenant_id: tenantId })
      .sum<{ total_paid: string | number | null }[]>('amount as total_paid');

    return { ...record, payments, total_paid: Number(total_paid) || 0 };
  }

  async update(tenantId: string, id: string, dto: UpdateContractorDto) {
    const [record] = await this.tenantDb.table('contractors')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Contractor not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const updated = await this.tenantDb.table('contractors')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });
    if (!updated) throw new NotFoundException('Contractor not found');
    return { deleted: true };
  }

  // ── Payments ──

  async getPayments(tenantId: string, contractorId: string) {
    const contractor = await this.tenantDb.table('contractors')
      .where({ id: contractorId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!contractor) throw new NotFoundException('Contractor not found');

    return this.tenantDb.table('contractor_payments')
      .where({ contractor_id: contractorId, tenant_id: tenantId })
      .orderBy('payment_date', 'desc');
  }

  async createPayment(tenantId: string, userId: string, dto: CreateContractorPaymentDto) {
    const contractor = await this.tenantDb.table('contractors')
      .where({ id: dto.contractor_id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!contractor) throw new NotFoundException('Contractor not found');

    const [record] = await this.tenantDb.table('contractor_payments')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
        created_by: userId,
      })
      .returning('*');
    return record;
  }

  async getYtdPayments(tenantId: string, contractorId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    const contractor = await this.tenantDb.table('contractors')
      .where({ id: contractorId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!contractor) throw new NotFoundException('Contractor not found');

    const [{ total }] = await this.tenantDb.table('contractor_payments')
      .where({ contractor_id: contractorId, tenant_id: tenantId })
      .whereRaw('EXTRACT(YEAR FROM payment_date) = ?', [targetYear])
      .sum<{ total: string | number | null }[]>('amount as total');

    return {
      contractor_id: contractorId,
      year: targetYear,
      ytd_total: Number(total) || 0,
      requires_1099: (Number(total) || 0) >= 600,
    };
  }
}

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountQueryDto } from './dto/account-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AccountTreeNode {
  id: string;
  account_number: string;
  name: string;
  account_type: string;
  normal_balance: string;
  is_active: boolean;
  is_system: boolean;
  children: AccountTreeNode[];
}

@Injectable()
export class AccountingService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: AccountQueryDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const {
      search, account_type, is_active,
      page = 1, limit = 50,
      sort_by = 'account_number', sort_order = 'asc',
    } = query;

    const baseQuery = knex('chart_of_accounts').where({ tenant_id: tenantId, deleted_at: null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('account_number', `%${search}%`);
      });
    }

    if (account_type) {
      baseQuery.where('account_type', account_type);
    }

    if (is_active !== undefined) {
      baseQuery.where('is_active', is_active);
    }

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const allowedSorts = ['account_number', 'name', 'account_type', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'account_number';

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
    const record = await knex('chart_of_accounts')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Account not found');
    return record;
  }

  async create(tenantId: string, dto: CreateAccountDto) {
    const knex = await this.tenantDb.getConnection();

    // Check for duplicate account number
    const existing = await knex('chart_of_accounts')
      .where({ tenant_id: tenantId, account_number: dto.account_number, deleted_at: null })
      .first();
    if (existing) {
      throw new ConflictException(`Account number ${dto.account_number} already exists`);
    }

    // Validate parent exists if provided
    if (dto.parent_id) {
      const parent = await knex('chart_of_accounts')
        .where({ id: dto.parent_id, tenant_id: tenantId, deleted_at: null })
        .first();
      if (!parent) {
        throw new BadRequestException('Parent account not found');
      }
    }

    const [record] = await knex('chart_of_accounts')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
        is_system: false,
      })
      .returning('*');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateAccountDto) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('chart_of_accounts')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!existing) throw new NotFoundException('Account not found');

    if (existing.is_system) {
      throw new BadRequestException('System accounts cannot be modified');
    }

    // Validate parent if changing
    if (dto.parent_id) {
      if (dto.parent_id === id) {
        throw new BadRequestException('Account cannot be its own parent');
      }
      const parent = await knex('chart_of_accounts')
        .where({ id: dto.parent_id, tenant_id: tenantId, deleted_at: null })
        .first();
      if (!parent) {
        throw new BadRequestException('Parent account not found');
      }
    }

    const [record] = await knex('chart_of_accounts')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('chart_of_accounts')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!existing) throw new NotFoundException('Account not found');

    if (existing.is_system) {
      throw new BadRequestException('System accounts cannot be deleted');
    }

    // Check for child accounts
    const children = await knex('chart_of_accounts')
      .where({ parent_id: id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (children) {
      throw new BadRequestException('Cannot delete account with child accounts');
    }

    await knex('chart_of_accounts')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });

    return { deleted: true };
  }

  async getTree(tenantId: string): Promise<AccountTreeNode[]> {
    const knex = await this.tenantDb.getConnection();

    const accounts = await knex('chart_of_accounts')
      .where({ tenant_id: tenantId, deleted_at: null })
      .orderBy('account_number', 'asc');

    // Build tree from flat list
    const map = new Map<string, AccountTreeNode>();
    const roots: AccountTreeNode[] = [];

    for (const acc of accounts) {
      map.set(acc.id, {
        id: acc.id,
        account_number: acc.account_number,
        name: acc.name,
        account_type: acc.account_type,
        normal_balance: acc.normal_balance,
        is_active: acc.is_active,
        is_system: acc.is_system,
        children: [],
      });
    }

    for (const acc of accounts) {
      const node = map.get(acc.id)!;
      if (acc.parent_id && map.has(acc.parent_id)) {
        map.get(acc.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}

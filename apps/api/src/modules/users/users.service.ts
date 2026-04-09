import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

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
export class UsersService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryUserDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, status, role, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('users')
      .where({ 'users.tenant_id': tenantId, 'users.deleted_at': null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('users.first_name', `%${search}%`)
          .orWhereILike('users.last_name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`)
          .orWhereILike('users.phone', `%${search}%`);
      });
    }

    if (status) {
      baseQuery.where('users.status', status);
    }

    if (role) {
      baseQuery
        .leftJoin('user_role_assignments as ura_filter', 'users.id', 'ura_filter.user_id')
        .leftJoin('roles as r_filter', 'ura_filter.role_id', 'r_filter.id')
        .where('r_filter.name', role);
    }

    const [{ count }] = await baseQuery.clone().count('users.id as count');
    const total = Number(count);

    const allowedSorts = ['first_name', 'last_name', 'email', 'status', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .select('users.*')
      .orderBy(`users.${sortColumn}`, sort_order)
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

  async create(tenantId: string, dto: CreateUserDto) {
    const knex = await this.tenantDb.getConnection();
    const { role_id, ...userData } = dto;

    return knex.transaction(async (trx) => {
      const [user] = await trx('users')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          ...userData,
          status: dto.status || 'active',
        })
        .returning('*');

      if (role_id) {
        await trx('user_role_assignments').insert({
          id: generateId(),
          tenant_id: tenantId,
          user_id: user.id,
          role_id,
        });
      }

      return user;
    });
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const user = await knex('users')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!user) throw new NotFoundException('User not found');

    const roles = await knex('user_role_assignments')
      .leftJoin('roles', 'user_role_assignments.role_id', 'roles.id')
      .where({ 'user_role_assignments.user_id': id, 'user_role_assignments.tenant_id': tenantId })
      .select('roles.id', 'roles.name', 'roles.description');

    return { ...user, roles };
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const knex = await this.tenantDb.getConnection();
    const [user] = await knex('users')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const user = await knex('users')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!user) throw new NotFoundException('User not found');

    await knex('users')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }

  async assignRole(tenantId: string, userId: string, roleId: string) {
    const knex = await this.tenantDb.getConnection();
    const user = await knex('users').where({ id: userId, tenant_id: tenantId, deleted_at: null }).first();
    if (!user) throw new NotFoundException('User not found');

    await knex('user_role_assignments')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        user_id: userId,
        role_id: roleId,
      })
      .onConflict(['tenant_id', 'user_id', 'role_id'])
      .ignore();

    return { assigned: true };
  }

  async removeRole(tenantId: string, userId: string, roleId: string) {
    const knex = await this.tenantDb.getConnection();
    await knex('user_role_assignments')
      .where({ tenant_id: tenantId, user_id: userId, role_id: roleId })
      .del();
    return { removed: true };
  }
}

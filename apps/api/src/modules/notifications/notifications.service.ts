import { Injectable, ForbiddenException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateNotificationDto, NotificationType, NotificationChannel } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, userId: string, query: QueryNotificationDto) {
    const knex = await this.tenantDb.getConnection();
    const { type, channel, unread, page = 1, limit = 20 } = query;

    const base = knex('notifications').where({ tenant_id: tenantId, user_id: userId });
    if (type) base.where('type', type);
    if (channel) base.where('channel', channel);
    if (unread === true) base.whereNull('read_at');
    if (unread === false) base.whereNotNull('read_at');

    const [{ count }] = await base.clone().count('id as count');
    const total = Number(count);
    const offset = (page - 1) * limit;

    const data = await base.select('*').orderBy('created_at', 'desc').limit(limit).offset(offset);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async countUnread(tenantId: string, userId: string) {
    const knex = await this.tenantDb.getConnection();
    const [{ count }] = await knex('notifications')
      .where({ tenant_id: tenantId, user_id: userId })
      .whereNull('read_at')
      .count('id as count');
    return { unread: Number(count) };
  }

  async create(tenantId: string, dto: CreateNotificationDto) {
    const knex = await this.tenantDb.getConnection();

    const user = await knex('users').where({ id: dto.user_id, tenant_id: tenantId }).first();
    if (!user) throw new ForbiddenException('User does not belong to this tenant');

    const id = generateId();

    const [record] = await knex('notifications')
      .insert({
        id,
        tenant_id: tenantId,
        user_id: dto.user_id,
        type: dto.type ?? NotificationType.INFO,
        channel: dto.channel ?? NotificationChannel.IN_APP,
        title: dto.title,
        message: dto.message,
        data: dto.data ? JSON.stringify(dto.data) : null,
      })
      .returning('*');

    return record;
  }

  async markRead(tenantId: string, userId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('notifications').where({ id, tenant_id: tenantId }).first();
    if (!record || record.user_id !== userId) throw new ForbiddenException('Access denied');

    const [updated] = await knex('notifications')
      .where({ id, tenant_id: tenantId })
      .update({ read_at: knex.fn.now() })
      .returning('*');

    return updated;
  }

  async markAllRead(tenantId: string, userId: string) {
    const knex = await this.tenantDb.getConnection();
    const updated = await knex('notifications')
      .where({ tenant_id: tenantId, user_id: userId })
      .whereNull('read_at')
      .update({ read_at: knex.fn.now() });

    return { updated };
  }

  async remove(tenantId: string, userId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('notifications').where({ id, tenant_id: tenantId }).first();
    if (!record || record.user_id !== userId) throw new ForbiddenException('Access denied');

    await knex('notifications').where({ id, tenant_id: tenantId }).del();
    return { deleted: id };
  }
}

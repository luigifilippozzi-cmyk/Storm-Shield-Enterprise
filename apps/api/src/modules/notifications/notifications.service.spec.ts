import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { NotificationType, NotificationChannel } from './dto/create-notification.dto';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereNull', 'whereNotNull', 'fn',
  ];
  methods.forEach((m) => { chain[m] = jest.fn().mockReturnValue(chain); });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn._chain = chain;
  knexFn.fn = { now: jest.fn().mockReturnValue('NOW()') };
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const USER_ID   = '00000000-0000-0000-0000-000000000005';
  const OTHER_ID  = '00000000-0000-0000-0000-000000000006';
  const NOTIF_ID  = '00000000-0000-0000-0000-000000000020';

  const mockNotif = {
    id: NOTIF_ID,
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    type: NotificationType.INFO,
    channel: NotificationChannel.IN_APP,
    title: 'Test',
    message: 'Hello',
    data: null,
    read_at: null,
    created_at: new Date(),
  };

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: TenantDatabaseService,
          useValue: { getConnection: jest.fn().mockResolvedValue(knex) },
        },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  // ── findAll ──

  describe('findAll', () => {
    it('returns paginated notifications', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '3' }]);
      knex._chain.offset.mockReturnValueOnce([mockNotif]);

      const result = await service.findAll(TENANT_ID, USER_ID, { page: 1, limit: 20 });
      expect(result.data).toEqual([mockNotif]);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(1);
    });

    it('filters by type', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      const result = await service.findAll(TENANT_ID, USER_ID, { type: NotificationType.WARNING });
      expect(result.data).toEqual([]);
    });

    it('filters by channel', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce([mockNotif]);

      const result = await service.findAll(TENANT_ID, USER_ID, { channel: NotificationChannel.IN_APP });
      expect(result.data).toEqual([mockNotif]);
    });

    it('filters unread=true', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce([mockNotif]);

      const result = await service.findAll(TENANT_ID, USER_ID, { unread: true });
      expect(knex._chain.whereNull).toHaveBeenCalledWith('read_at');
      expect(result.meta.total).toBe(1);
    });

    it('filters unread=false', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '2' }]);
      knex._chain.offset.mockReturnValueOnce([{ ...mockNotif, read_at: new Date() }]);

      const result = await service.findAll(TENANT_ID, USER_ID, { unread: false });
      expect(knex._chain.whereNotNull).toHaveBeenCalledWith('read_at');
      expect(result.meta.total).toBe(2);
    });

    it('calculates totalPages correctly', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '45' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      const result = await service.findAll(TENANT_ID, USER_ID, { page: 2, limit: 20 });
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(2);
    });
  });

  // ── countUnread ──

  describe('countUnread', () => {
    it('returns unread count', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '7' }]);
      const result = await service.countUnread(TENANT_ID, USER_ID);
      expect(result.unread).toBe(7);
    });

    it('returns 0 when no unread', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      const result = await service.countUnread(TENANT_ID, USER_ID);
      expect(result.unread).toBe(0);
    });
  });

  // ── create ──

  describe('create', () => {
    it('creates a notification with defaults', async () => {
      knex._chain.first.mockReturnValueOnce({ id: USER_ID, tenant_id: TENANT_ID });
      knex._chain.returning.mockReturnValueOnce([mockNotif]);

      const result = await service.create(TENANT_ID, {
        user_id: USER_ID,
        title: 'Test',
        message: 'Hello',
      });

      expect(knex._chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        id: '00000000-0000-0000-0000-000000000099',
        tenant_id: TENANT_ID,
        user_id: USER_ID,
        type: NotificationType.INFO,
        channel: NotificationChannel.IN_APP,
        title: 'Test',
        message: 'Hello',
        data: null,
      }));
      expect(result).toEqual(mockNotif);
    });

    it('creates notification with explicit type and channel', async () => {
      knex._chain.first.mockReturnValueOnce({ id: USER_ID, tenant_id: TENANT_ID });
      const custom = { ...mockNotif, type: NotificationType.WARNING, channel: NotificationChannel.EMAIL };
      knex._chain.returning.mockReturnValueOnce([custom]);

      const result = await service.create(TENANT_ID, {
        user_id: USER_ID,
        title: 'Warn',
        message: 'Watch out',
        type: NotificationType.WARNING,
        channel: NotificationChannel.EMAIL,
      });

      expect(result.type).toBe(NotificationType.WARNING);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });

    it('serializes data field as JSON string', async () => {
      knex._chain.first.mockReturnValueOnce({ id: USER_ID, tenant_id: TENANT_ID });
      knex._chain.returning.mockReturnValueOnce([{ ...mockNotif, data: { key: 'val' } }]);
      const payload = { user_id: USER_ID, title: 'T', message: 'M', data: { key: 'val' } };
      await service.create(TENANT_ID, payload);

      expect(knex._chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        data: JSON.stringify({ key: 'val' }),
      }));
    });

    it('throws ForbiddenException when user_id does not belong to tenant', async () => {
      knex._chain.first.mockReturnValueOnce(null);
      await expect(
        service.create(TENANT_ID, { user_id: OTHER_ID, title: 'T', message: 'M' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── markRead ──

  describe('markRead', () => {
    it('marks notification as read', async () => {
      knex._chain.first.mockReturnValueOnce(mockNotif);
      const updated = { ...mockNotif, read_at: new Date() };
      knex._chain.returning.mockReturnValueOnce([updated]);

      const result = await service.markRead(TENANT_ID, USER_ID, NOTIF_ID);
      expect(result.read_at).toBeTruthy();
    });

    it('throws ForbiddenException when notification not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);
      await expect(service.markRead(TENANT_ID, USER_ID, NOTIF_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when notification belongs to another user', async () => {
      knex._chain.first.mockReturnValueOnce({ ...mockNotif, user_id: OTHER_ID });
      await expect(service.markRead(TENANT_ID, USER_ID, NOTIF_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── markAllRead ──

  describe('markAllRead', () => {
    it('returns count of updated rows', async () => {
      knex._chain.whereNull.mockReturnValueOnce({
        ...knex._chain,
        update: jest.fn().mockReturnValueOnce(5),
      });

      const result = await service.markAllRead(TENANT_ID, USER_ID);
      expect(result).toHaveProperty('updated');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('deletes a notification', async () => {
      knex._chain.first.mockReturnValueOnce(mockNotif);

      const result = await service.remove(TENANT_ID, USER_ID, NOTIF_ID);
      expect(result).toEqual({ deleted: NOTIF_ID });
    });

    it('throws ForbiddenException when notification not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);
      await expect(service.remove(TENANT_ID, USER_ID, NOTIF_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when notification belongs to another user', async () => {
      knex._chain.first.mockReturnValueOnce({ ...mockNotif, user_id: OTHER_ID });
      await expect(service.remove(TENANT_ID, USER_ID, NOTIF_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});

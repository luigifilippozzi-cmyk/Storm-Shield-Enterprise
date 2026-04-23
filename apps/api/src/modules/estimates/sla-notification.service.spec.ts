import { Test, TestingModule } from '@nestjs/testing';
import { SlaNotificationService } from './sla-notification.service';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.tokens';

// Build a mock Knex transaction that routes table calls to configurable result arrays.
function buildMockTrx(opts: {
  ownerUsers: unknown[];
  awaitingEstimates: unknown[];
  supplementEstimates: unknown[];
  duplicateNotification: unknown;
  insertSpy: jest.Mock;
}) {
  const callCounts: Record<string, number> = {};

  const trx: any = jest.fn().mockImplementation((table: string) => {
    callCounts[table] = (callCounts[table] ?? 0) + 1;

    // Build a chainable builder per table call
    const builder: any = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
    };

    if (table === 'user_role_assignments') {
      builder.select = jest.fn().mockResolvedValue(opts.ownerUsers);
    } else if (table === 'estimates') {
      // First call = awaiting_approval rule, second = supplement_pending rule
      const call = callCounts[table];
      builder.select = jest.fn().mockResolvedValue(
        call === 1 ? opts.awaitingEstimates : opts.supplementEstimates,
      );
    } else if (table === 'notifications') {
      builder.first = jest.fn().mockResolvedValue(opts.duplicateNotification);
      builder.insert = opts.insertSpy;
    }

    return builder;
  });

  trx.raw = jest.fn().mockResolvedValue(undefined);
  return trx;
}

describe('SlaNotificationService', () => {
  let service: SlaNotificationService;

  async function createService(mockKnex: any) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaNotificationService,
        { provide: KNEX_ADMIN_CONNECTION, useValue: mockKnex },
      ],
    }).compile();
    return module.get<SlaNotificationService>(SlaNotificationService);
  }

  const tenantId = 'tenant-123';
  const schemaName = 'tenant_abc123';

  function buildKnex(trx: any) {
    const knex: any = jest.fn();
    knex.transaction = jest.fn().mockImplementation(async (cb: Function) => cb(trx));
    knex.raw = jest.fn().mockReturnThis();
    // For runSlaCheck queries on the root knex
    knex.where = jest.fn().mockReturnThis();
    knex.whereIn = jest.fn().mockReturnThis();
    knex.select = jest.fn().mockResolvedValue([]);
    return knex;
  }

  it('should be defined', async () => {
    const trx = buildMockTrx({ ownerUsers: [], awaitingEstimates: [], supplementEstimates: [], duplicateNotification: null, insertSpy: jest.fn() });
    service = await createService(buildKnex(trx));
    expect(service).toBeDefined();
  });

  describe('processTenant', () => {
    it('returns 0 when no owner users exist', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({ ownerUsers: [], awaitingEstimates: [], supplementEstimates: [], duplicateNotification: null, insertSpy });
      service = await createService(buildKnex(trx));

      const count = await service.processTenant(tenantId, schemaName);

      expect(count).toBe(0);
      expect(insertSpy).not.toHaveBeenCalled();
    });

    it('creates notification for awaiting_approval > 14 days', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({
        ownerUsers: [{ userId: 'owner-1' }],
        awaitingEstimates: [{ id: 'est-1', estimate_number: 'EST-001', status: 'awaiting_approval' }],
        supplementEstimates: [],
        duplicateNotification: null,
        insertSpy,
      });
      service = await createService(buildKnex(trx));

      const count = await service.processTenant(tenantId, schemaName);

      expect(count).toBe(1);
      expect(insertSpy).toHaveBeenCalledTimes(1);
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning', channel: 'in_app', user_id: 'owner-1', tenant_id: tenantId }),
      );
    });

    it('creates notification for supplement_pending > 7 days', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({
        ownerUsers: [{ userId: 'owner-1' }],
        awaitingEstimates: [],
        supplementEstimates: [{ id: 'est-2', estimate_number: 'EST-002', status: 'supplement_pending' }],
        duplicateNotification: null,
        insertSpy,
      });
      service = await createService(buildKnex(trx));

      const count = await service.processTenant(tenantId, schemaName);

      expect(count).toBe(1);
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning', channel: 'in_app', user_id: 'owner-1' }),
      );
    });

    it('skips notification when duplicate exists in last 24h (idempotency)', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({
        ownerUsers: [{ userId: 'owner-1' }],
        awaitingEstimates: [{ id: 'est-1', estimate_number: 'EST-001', status: 'awaiting_approval' }],
        supplementEstimates: [],
        duplicateNotification: { id: 'existing-notif' }, // duplicate found
        insertSpy,
      });
      service = await createService(buildKnex(trx));

      const count = await service.processTenant(tenantId, schemaName);

      expect(count).toBe(0);
      expect(insertSpy).not.toHaveBeenCalled();
    });

    it('creates notifications for each owner user per estimate', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({
        ownerUsers: [{ userId: 'owner-1' }, { userId: 'owner-2' }],
        awaitingEstimates: [{ id: 'est-1', estimate_number: 'EST-001', status: 'awaiting_approval' }],
        supplementEstimates: [],
        duplicateNotification: null,
        insertSpy,
      });
      service = await createService(buildKnex(trx));

      const count = await service.processTenant(tenantId, schemaName);

      expect(count).toBe(2);
      expect(insertSpy).toHaveBeenCalledTimes(2);
    });

    it('returns 0 when no estimates breach SLA thresholds', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({
        ownerUsers: [{ userId: 'owner-1' }],
        awaitingEstimates: [],
        supplementEstimates: [],
        duplicateNotification: null,
        insertSpy,
      });
      service = await createService(buildKnex(trx));

      const count = await service.processTenant(tenantId, schemaName);

      expect(count).toBe(0);
      expect(insertSpy).not.toHaveBeenCalled();
    });

    it('uses SET LOCAL search_path scoped to transaction', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({ ownerUsers: [], awaitingEstimates: [], supplementEstimates: [], duplicateNotification: null, insertSpy });
      service = await createService(buildKnex(trx));

      await service.processTenant(tenantId, schemaName);

      expect(trx.raw).toHaveBeenCalledWith(`SET LOCAL search_path TO "${schemaName}", public`);
    });

    it('embeds sla_breach metadata in notification data', async () => {
      const insertSpy = jest.fn().mockResolvedValue([]);
      const trx = buildMockTrx({
        ownerUsers: [{ userId: 'owner-1' }],
        awaitingEstimates: [{ id: 'est-1', estimate_number: 'EST-001', status: 'awaiting_approval' }],
        supplementEstimates: [],
        duplicateNotification: null,
        insertSpy,
      });
      service = await createService(buildKnex(trx));

      await service.processTenant(tenantId, schemaName);

      const inserted = insertSpy.mock.calls[0][0];
      const data = JSON.parse(inserted.data);
      expect(data).toMatchObject({ type: 'sla_breach', estimate_id: 'est-1', days_limit: 14 });
    });
  });

  describe('runSlaCheck', () => {
    it('filters tenants by active and trial status', async () => {
      const whereInSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockResolvedValue([]);
      const knex: any = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        whereIn: whereInSpy,
        select: selectSpy,
      });
      knex.transaction = jest.fn().mockResolvedValue(0);
      knex.raw = jest.fn().mockReturnThis();

      service = await createService(knex);
      await service.runSlaCheck();

      expect(whereInSpy).toHaveBeenCalledWith('status', ['active', 'trial']);
    });
  });
});

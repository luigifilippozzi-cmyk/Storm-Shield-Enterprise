import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { ActivationEventsService } from '../admin/activation/activation.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike', 'whereNotIn', 'sum', 'max', 'min',
    'join', 'whereRaw', 'andWhere',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn._chain = chain;
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('CustomersService', () => {
  let service: CustomersService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000010';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
        { provide: ActivationEventsService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();
    service = module.get<CustomersService>(CustomersService);
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [{ id: CUSTOMER_ID, first_name: 'John', last_name: 'Doe' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockCustomers);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'john', page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by type', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { type: 'individual', page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('type', 'individual');
    });

    it('should filter by source', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { source: 'insurance', page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('source', 'insurance');
    });

    it('should use default sort when invalid sort_by provided', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'invalid_column', page: 1, limit: 20 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });

    it('should accept valid sort_by column', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'email', sort_order: 'asc', page: 1, limit: 20 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('email', 'asc');
    });
  });

  describe('create', () => {
    it('should create and return customer', async () => {
      const mockCustomer = { id: CUSTOMER_ID, first_name: 'Jane', last_name: 'Doe' };
      // isFirst check: existing customers present → first() returns a record
      knex._chain.first.mockReturnValueOnce({ id: 'existing' });
      knex._chain.returning.mockReturnValueOnce([mockCustomer]);

      const result = await service.create(TENANT_ID, {
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-1234',
      } as any);

      expect(result).toEqual(mockCustomer);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, first_name: 'Jane' }),
      );
    });

    it('should fire activation event when creating the first customer', async () => {
      const mockCustomer = { id: CUSTOMER_ID, first_name: 'First' };
      // isFirst check: no existing customers → first() returns null
      knex._chain.first.mockReturnValueOnce(null);
      knex._chain.returning.mockReturnValueOnce([mockCustomer]);

      const activationSpy = jest.spyOn((service as any).activationEvents, 'record');

      await service.create(TENANT_ID, { first_name: 'First', last_name: 'Customer' } as any);

      expect(activationSpy).toHaveBeenCalledWith(TENANT_ID, 'first_customer_created');
    });
  });

  describe('findOne', () => {
    it('should return customer when found', async () => {
      const mockCustomer = { id: CUSTOMER_ID, first_name: 'John' };
      knex._chain.first.mockReturnValueOnce(mockCustomer);

      const result = await service.findOne(TENANT_ID, CUSTOMER_ID);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, CUSTOMER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return customer', async () => {
      const mockCustomer = { id: CUSTOMER_ID, first_name: 'Updated' };
      knex._chain.returning.mockReturnValueOnce([mockCustomer]);

      const result = await service.update(TENANT_ID, CUSTOMER_ID, { first_name: 'Updated' } as any);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, CUSTOMER_ID, { first_name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete customer', async () => {
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, CUSTOMER_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.update.mockReturnValueOnce(0);

      await expect(service.remove(TENANT_ID, CUSTOMER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return aggregated summary metrics', async () => {
      const mockCustomer = { id: CUSTOMER_ID, first_name: 'John' };
      knex._chain.first
        .mockReturnValueOnce(mockCustomer)       // findOne
        .mockReturnValueOnce({ count: '3' })     // open estimates
        .mockReturnValueOnce({ count: '2' })     // open SOs
        .mockReturnValueOnce({ total: '5000.00' }) // balance
        .mockReturnValueOnce({ total: '3000.00' }) // ytd_revenue
        .mockReturnValueOnce({ ts: '2026-04-01T00:00:00Z' }) // lastEstimate
        .mockReturnValueOnce({ ts: '2026-04-15T00:00:00Z' }); // lastSO

      const result = await service.getSummary(TENANT_ID, CUSTOMER_ID);

      expect(result.open_estimates_count).toBe(3);
      expect(result.open_so_count).toBe(2);
      expect(result.balance).toBe(5000);
      expect(result.ytd_revenue).toBe(3000);
      expect(result.last_activity_at).toBeInstanceOf(Date);
    });

    it('should handle null activity timestamps', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first
        .mockReturnValueOnce(mockCustomer)
        .mockReturnValueOnce({ count: '0' })
        .mockReturnValueOnce({ count: '0' })
        .mockReturnValueOnce({ total: null })
        .mockReturnValueOnce({ total: null })
        .mockReturnValueOnce({ ts: null })
        .mockReturnValueOnce({ ts: null });

      const result = await service.getSummary(TENANT_ID, CUSTOMER_ID);

      expect(result.last_activity_at).toBeNull();
      expect(result.balance).toBe(0);
    });

    it('should use estimateTs when only estimateTs is present', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first
        .mockReturnValueOnce(mockCustomer)
        .mockReturnValueOnce({ count: '1' })
        .mockReturnValueOnce({ count: '0' })
        .mockReturnValueOnce({ total: '100.00' })
        .mockReturnValueOnce({ total: '100.00' })
        .mockReturnValueOnce({ ts: '2026-04-10T00:00:00Z' }) // estimateTs present
        .mockReturnValueOnce({ ts: null });                   // soTs null

      const result = await service.getSummary(TENANT_ID, CUSTOMER_ID);

      expect(result.last_activity_at).toBeInstanceOf(Date);
      expect(result.last_activity_at?.toISOString()).toBe('2026-04-10T00:00:00.000Z');
    });

    it('should use soTs when only soTs is present', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first
        .mockReturnValueOnce(mockCustomer)
        .mockReturnValueOnce({ count: '0' })
        .mockReturnValueOnce({ count: '1' })
        .mockReturnValueOnce({ total: null })
        .mockReturnValueOnce({ total: null })
        .mockReturnValueOnce({ ts: null })                    // estimateTs null
        .mockReturnValueOnce({ ts: '2026-04-20T00:00:00Z' }); // soTs present

      const result = await service.getSummary(TENANT_ID, CUSTOMER_ID);

      expect(result.last_activity_at).toBeInstanceOf(Date);
      expect(result.last_activity_at?.toISOString()).toBe('2026-04-20T00:00:00.000Z');
    });

    it('should pick the more recent of estimateTs and soTs when both present', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first
        .mockReturnValueOnce(mockCustomer)
        .mockReturnValueOnce({ count: '1' })
        .mockReturnValueOnce({ count: '1' })
        .mockReturnValueOnce({ total: '500.00' })
        .mockReturnValueOnce({ total: '500.00' })
        .mockReturnValueOnce({ ts: '2026-04-10T00:00:00Z' }) // estimateTs
        .mockReturnValueOnce({ ts: '2026-04-22T00:00:00Z' }); // soTs (more recent)

      const result = await service.getSummary(TENANT_ID, CUSTOMER_ID);

      expect(result.last_activity_at?.toISOString()).toBe('2026-04-22T00:00:00.000Z');
    });

    it('should throw NotFoundException when customer not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.getSummary(TENANT_ID, CUSTOMER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActivityTimeline', () => {
    it('should return merged events sorted by occurred_at desc', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      const interaction = { id: '1', event_subtype: 'phone', description: 'Call', notes: null, occurred_at: '2026-04-10T10:00:00Z' };
      const soChange = { id: '2', from_status: 'pending', to_status: 'in_progress', notes: null, occurred_at: '2026-04-12T09:00:00Z', description: 'SO-001' };
      const finTx = { id: '3', event_subtype: 'income', amount: 500, description: 'Payment', occurred_at: '2026-04-08T12:00:00Z' };
      const estimate = { id: '4', event_subtype: 'draft', description: 'EST-001', occurred_at: '2026-04-05T08:00:00Z' };

      knex._chain.first.mockReturnValueOnce(mockCustomer);
      knex._chain.limit
        .mockReturnValueOnce([interaction])
        .mockReturnValueOnce([soChange])
        .mockReturnValueOnce([finTx])
        .mockReturnValueOnce([estimate]);

      const result = await service.getActivityTimeline(TENANT_ID, CUSTOMER_ID, 50);

      expect(result).toHaveLength(4);
      expect(result[0].occurred_at).toBe('2026-04-12T09:00:00Z'); // most recent first
      expect(result[0].event_type).toBe('so_status_change');
      expect(result[1].event_type).toBe('interaction');
    });

    it('should clamp limit to 200 when limit > 200', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockCustomer);
      knex._chain.limit
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      await service.getActivityTimeline(TENANT_ID, CUSTOMER_ID, 999);

      // getActivityTimeline was called without throwing — safeLimit clamped to 200
      expect(knex._chain.limit).toHaveBeenCalled();
    });

    it('should default to 50 when NaN limit is provided', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockCustomer);
      knex._chain.limit
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      // Pass NaN explicitly to trigger the Number.isNaN branch
      await service.getActivityTimeline(TENANT_ID, CUSTOMER_ID, NaN);

      expect(knex._chain.limit).toHaveBeenCalled();
    });

    it('should clamp limit to 1 when limit < 1', async () => {
      const mockCustomer = { id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockCustomer);
      knex._chain.limit
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      await service.getActivityTimeline(TENANT_ID, CUSTOMER_ID, 0);

      expect(knex._chain.limit).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.getActivityTimeline(TENANT_ID, CUSTOMER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

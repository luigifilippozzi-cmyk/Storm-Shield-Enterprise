import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike', 'leftJoin', 'raw',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn._chain = chain;
  knexFn.raw = jest.fn().mockReturnValue('raw_expression');
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const SO_ID = '00000000-0000-0000-0000-000000000010';
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000020';
  const VEHICLE_ID = '00000000-0000-0000-0000-000000000030';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceOrdersService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<ServiceOrdersService>(ServiceOrdersService);
  });

  describe('findAll', () => {
    it('should return paginated service orders', async () => {
      const mockOrders = [{ id: SO_ID, order_number: 'SO-001', status: 'pending' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockOrders);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockOrders);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'SO-001', page: 1, limit: 20 });

      expect(knex._chain.leftJoin).toHaveBeenCalled();
      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'pending' as any, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('service_orders.status', 'pending');
    });

    it('should filter by customer_id', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { customer_id: CUSTOMER_ID, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('service_orders.customer_id', CUSTOMER_ID);
    });

    it('should filter by vehicle_id', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { vehicle_id: VEHICLE_ID, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('service_orders.vehicle_id', VEHICLE_ID);
    });

    it('should filter by assigned_to', async () => {
      const assigneeId = '00000000-0000-0000-0000-000000000040';
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { assigned_to: assigneeId, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('service_orders.assigned_to', assigneeId);
    });

    it('should default invalid sort_by to created_at', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'invalid_column', page: 1, limit: 20 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('service_orders.created_at', 'desc');
    });
  });

  describe('create', () => {
    it('should create and return a service order with pending status', async () => {
      const mockOrder = { id: SO_ID, order_number: 'SO-001', status: 'pending' };
      knex._chain.returning.mockReturnValueOnce([mockOrder]);

      const result = await service.create(TENANT_ID, {
        order_number: 'SO-001',
        estimate_id: '00000000-0000-0000-0000-000000000050',
        customer_id: CUSTOMER_ID,
        vehicle_id: VEHICLE_ID,
      } as any);

      expect(result).toEqual(mockOrder);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: TENANT_ID,
          status: 'pending',
          order_number: 'SO-001',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return service order when found', async () => {
      const mockOrder = { id: SO_ID, order_number: 'SO-001' };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      const result = await service.findOne(TENANT_ID, SO_ID);

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, SO_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return service order', async () => {
      const mockOrder = { id: SO_ID, notes: 'Updated notes' };
      knex._chain.returning.mockReturnValueOnce([mockOrder]);

      const result = await service.update(TENANT_ID, SO_ID, { notes: 'Updated notes' } as any);

      expect(result).toEqual(mockOrder);
      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Updated notes' }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, SO_ID, { notes: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should transition from pending to in_progress and set started_at', async () => {
      const mockOrder = { id: SO_ID, status: 'pending', started_at: null, assigned_to: 'user1', customer_id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      const updatedOrder = { ...mockOrder, status: 'in_progress' };
      knex._chain.returning.mockReturnValueOnce([updatedOrder]);
      // insert for status history
      knex._chain.insert.mockReturnValueOnce(undefined);

      const result = await service.updateStatus(TENANT_ID, SO_ID, { status: 'in_progress' as any });

      expect(result).toEqual(updatedOrder);
      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'in_progress', started_at: expect.any(Date) }),
      );
    });

    it('should transition from in_progress to completed and set completed_at', async () => {
      const mockOrder = { id: SO_ID, status: 'in_progress', started_at: new Date(), assigned_to: 'user1', customer_id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      const updatedOrder = { ...mockOrder, status: 'completed' };
      knex._chain.returning.mockReturnValueOnce([updatedOrder]);
      knex._chain.insert.mockReturnValueOnce(undefined);

      const result = await service.updateStatus(TENANT_ID, SO_ID, { status: 'completed' as any });

      expect(result).toEqual(updatedOrder);
      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', completed_at: expect.any(Date) }),
      );
    });

    it('should transition from completed to delivered and set delivered_at', async () => {
      const mockOrder = { id: SO_ID, status: 'completed', assigned_to: 'user1', customer_id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      const updatedOrder = { ...mockOrder, status: 'delivered' };
      knex._chain.returning.mockReturnValueOnce([updatedOrder]);
      knex._chain.insert.mockReturnValueOnce(undefined);

      const result = await service.updateStatus(TENANT_ID, SO_ID, { status: 'delivered' as any });

      expect(result).toEqual(updatedOrder);
      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'delivered', delivered_at: expect.any(Date) }),
      );
    });

    it('should insert status history record', async () => {
      const mockOrder = { id: SO_ID, status: 'pending', assigned_to: 'user1', customer_id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockOrder);
      knex._chain.returning.mockReturnValueOnce([{ ...mockOrder, status: 'in_progress' }]);
      knex._chain.insert.mockReturnValueOnce(undefined);

      await service.updateStatus(TENANT_ID, SO_ID, { status: 'in_progress' as any, notes: 'Starting work' });

      // The second call to knex() should be for 'so_status_history'
      expect(knex).toHaveBeenCalledWith('so_status_history');
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const mockOrder = { id: SO_ID, status: 'delivered' };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      await expect(
        service.updateStatus(TENANT_ID, SO_ID, { status: 'pending' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when transitioning cancelled order', async () => {
      const mockOrder = { id: SO_ID, status: 'cancelled' };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      await expect(
        service.updateStatus(TENANT_ID, SO_ID, { status: 'in_progress' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when order not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.updateStatus(TENANT_ID, SO_ID, { status: 'in_progress' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not overwrite started_at if already set', async () => {
      const existingDate = new Date('2026-01-01');
      const mockOrder = { id: SO_ID, status: 'waiting_parts', started_at: existingDate, assigned_to: 'user1', customer_id: CUSTOMER_ID };
      knex._chain.first.mockReturnValueOnce(mockOrder);
      knex._chain.returning.mockReturnValueOnce([{ ...mockOrder, status: 'in_progress' }]);
      knex._chain.insert.mockReturnValueOnce(undefined);

      await service.updateStatus(TENANT_ID, SO_ID, { status: 'in_progress' as any });

      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ started_at: expect.any(Date) }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete pending service order', async () => {
      const mockOrder = { id: SO_ID, status: 'pending' };
      knex._chain.first.mockReturnValueOnce(mockOrder);
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, SO_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should soft delete cancelled service order', async () => {
      const mockOrder = { id: SO_ID, status: 'cancelled' };
      knex._chain.first.mockReturnValueOnce(mockOrder);
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, SO_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw BadRequestException when deleting in_progress order', async () => {
      const mockOrder = { id: SO_ID, status: 'in_progress' };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      await expect(service.remove(TENANT_ID, SO_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when deleting completed order', async () => {
      const mockOrder = { id: SO_ID, status: 'completed' };
      knex._chain.first.mockReturnValueOnce(mockOrder);

      await expect(service.remove(TENANT_ID, SO_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, SO_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

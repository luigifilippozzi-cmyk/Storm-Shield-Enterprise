import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike',
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

describe('VehiclesService', () => {
  let service: VehiclesService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const VEHICLE_ID = '00000000-0000-0000-0000-000000000010';
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000020';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAll', () => {
    it('should return paginated vehicles', async () => {
      const mockVehicles = [{ id: VEHICLE_ID, year: 2023, make: 'Honda', model: 'Civic' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockVehicles);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockVehicles);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by customer_id', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { customer_id: CUSTOMER_ID, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('customer_id', CUSTOMER_ID);
    });

    it('should filter by make', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { make: 'Honda', page: 1, limit: 20 });

      expect(knex._chain.whereILike).toHaveBeenCalledWith('make', '%Honda%');
    });

    it('should filter by year', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { year: 2023, page: 1, limit: 20 } as any);

      expect(knex._chain.where).toHaveBeenCalledWith('year', 2023);
    });
  });

  describe('create', () => {
    it('should create and return vehicle', async () => {
      const mockVehicle = { id: VEHICLE_ID, year: 2023, make: 'Honda', model: 'Civic' };
      knex._chain.returning.mockReturnValueOnce([mockVehicle]);

      const result = await service.create(TENANT_ID, {
        customer_id: CUSTOMER_ID,
        year: 2023,
        make: 'Honda',
        model: 'Civic',
      } as any);

      expect(result).toEqual(mockVehicle);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, make: 'Honda' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return vehicle when found', async () => {
      const mockVehicle = { id: VEHICLE_ID, make: 'Honda' };
      knex._chain.first.mockReturnValueOnce(mockVehicle);

      const result = await service.findOne(TENANT_ID, VEHICLE_ID);

      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, VEHICLE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return vehicle', async () => {
      const mockVehicle = { id: VEHICLE_ID, make: 'Toyota' };
      knex._chain.returning.mockReturnValueOnce([mockVehicle]);

      const result = await service.update(TENANT_ID, VEHICLE_ID, { make: 'Toyota' } as any);

      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, VEHICLE_ID, { make: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete vehicle', async () => {
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, VEHICLE_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.update.mockReturnValueOnce(0);

      await expect(service.remove(TENANT_ID, VEHICLE_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

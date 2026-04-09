import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
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
  });

  describe('create', () => {
    it('should create and return customer', async () => {
      const mockCustomer = { id: CUSTOMER_ID, first_name: 'Jane', last_name: 'Doe' };
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
});

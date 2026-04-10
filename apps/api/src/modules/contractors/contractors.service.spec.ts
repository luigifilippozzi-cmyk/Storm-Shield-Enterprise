import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike', 'sum', 'whereRaw',
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

describe('ContractorsService', () => {
  let service: ContractorsService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const CONTRACTOR_ID = '00000000-0000-0000-0000-000000000020';
  const USER_ID = '00000000-0000-0000-0000-000000000005';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorsService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<ContractorsService>(ContractorsService);
  });

  describe('findAll', () => {
    it('should return paginated contractors', async () => {
      const mockContractors = [{ id: CONTRACTOR_ID, first_name: 'Mike', last_name: 'Johnson' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockContractors);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockContractors);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'mike', page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'active' as any, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('status', 'active');
    });

    it('should filter by specialty', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { specialty: 'PDR', page: 1, limit: 20 });

      expect(knex._chain.whereILike).toHaveBeenCalledWith('specialty', '%PDR%');
    });

    it('should use default sort when invalid sort_by provided', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'invalid_column', page: 1, limit: 20 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });
  });

  describe('create', () => {
    it('should create and return contractor', async () => {
      const mockContractor = { id: CONTRACTOR_ID, first_name: 'Mike', last_name: 'Johnson' };
      knex._chain.returning.mockReturnValueOnce([mockContractor]);

      const result = await service.create(TENANT_ID, {
        first_name: 'Mike',
        last_name: 'Johnson',
        phone: '555-1234',
      } as any);

      expect(result).toEqual(mockContractor);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, first_name: 'Mike' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return contractor with payments and total when found', async () => {
      const mockContractor = { id: CONTRACTOR_ID, first_name: 'Mike' };
      const mockPayments = [{ id: 'pay-1', amount: 500 }];
      knex._chain.first.mockReturnValueOnce(mockContractor);
      knex._chain.orderBy.mockReturnValueOnce(mockPayments);
      knex._chain.sum.mockReturnValueOnce([{ total_paid: '1500.00' }]);

      const result = await service.findOne(TENANT_ID, CONTRACTOR_ID);

      expect(result.first_name).toBe('Mike');
      expect(result.payments).toEqual(mockPayments);
      expect(result.total_paid).toBe(1500);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, CONTRACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return contractor', async () => {
      const mockContractor = { id: CONTRACTOR_ID, first_name: 'Updated' };
      knex._chain.returning.mockReturnValueOnce([mockContractor]);

      const result = await service.update(TENANT_ID, CONTRACTOR_ID, { first_name: 'Updated' } as any);

      expect(result).toEqual(mockContractor);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, CONTRACTOR_ID, { first_name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete contractor', async () => {
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, CONTRACTOR_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.update.mockReturnValueOnce(0);

      await expect(service.remove(TENANT_ID, CONTRACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPayments', () => {
    it('should return payments for contractor', async () => {
      const mockContractor = { id: CONTRACTOR_ID };
      const mockPayments = [{ id: 'pay-1', amount: 500 }];
      knex._chain.first.mockReturnValueOnce(mockContractor);
      knex._chain.orderBy.mockReturnValueOnce(mockPayments);

      const result = await service.getPayments(TENANT_ID, CONTRACTOR_ID);

      expect(result).toEqual(mockPayments);
    });

    it('should throw NotFoundException if contractor not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.getPayments(TENANT_ID, CONTRACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPayment', () => {
    it('should create payment for existing contractor', async () => {
      const mockContractor = { id: CONTRACTOR_ID };
      const mockPayment = { id: 'pay-1', amount: 500 };
      knex._chain.first.mockReturnValueOnce(mockContractor);
      knex._chain.returning.mockReturnValueOnce([mockPayment]);

      const result = await service.createPayment(TENANT_ID, USER_ID, {
        contractor_id: CONTRACTOR_ID,
        amount: 500,
        payment_method: 'check' as any,
        payment_date: '2026-04-10',
      });

      expect(result).toEqual(mockPayment);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: USER_ID }),
      );
    });

    it('should throw NotFoundException if contractor not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.createPayment(TENANT_ID, USER_ID, {
          contractor_id: CONTRACTOR_ID,
          amount: 500,
          payment_method: 'check' as any,
          payment_date: '2026-04-10',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getYtdPayments', () => {
    it('should return YTD total and 1099 flag', async () => {
      const mockContractor = { id: CONTRACTOR_ID };
      knex._chain.first.mockReturnValueOnce(mockContractor);
      knex._chain.sum.mockReturnValueOnce([{ total: '750.00' }]);

      const result = await service.getYtdPayments(TENANT_ID, CONTRACTOR_ID, 2026);

      expect(result.ytd_total).toBe(750);
      expect(result.requires_1099).toBe(true);
    });

    it('should return requires_1099 false when under $600', async () => {
      const mockContractor = { id: CONTRACTOR_ID };
      knex._chain.first.mockReturnValueOnce(mockContractor);
      knex._chain.sum.mockReturnValueOnce([{ total: '400.00' }]);

      const result = await service.getYtdPayments(TENANT_ID, CONTRACTOR_ID, 2026);

      expect(result.ytd_total).toBe(400);
      expect(result.requires_1099).toBe(false);
    });

    it('should throw NotFoundException if contractor not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.getYtdPayments(TENANT_ID, CONTRACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

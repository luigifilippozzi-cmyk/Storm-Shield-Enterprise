import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
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

describe('InsuranceService', () => {
  let service: InsuranceService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const INSURANCE_ID = '00000000-0000-0000-0000-000000000010';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsuranceService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<InsuranceService>(InsuranceService);
  });

  describe('findAll', () => {
    it('should return paginated insurance companies', async () => {
      const mockCompanies = [{ id: INSURANCE_ID, name: 'State Farm', is_drp: true }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockCompanies);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockCompanies);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'state', page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by is_drp', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { is_drp: true, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('is_drp', true);
    });

    it('should not filter by is_drp when undefined', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      // where is called once for the base query, not for is_drp
      expect(knex._chain.where).not.toHaveBeenCalledWith('is_drp', undefined);
    });

    it('should default invalid sort_by to created_at', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'invalid_column', page: 1, limit: 20 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });

    it('should accept valid sort columns', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'name', sort_order: 'asc', page: 1, limit: 20 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('name', 'asc');
    });

    it('should calculate correct offset', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '50' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { page: 3, limit: 10 });

      expect(knex._chain.offset).toHaveBeenCalledWith(20);
      expect(knex._chain.limit).toHaveBeenCalledWith(10);
    });

    it('should calculate totalPages correctly', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '25' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('create', () => {
    it('should create and return insurance company', async () => {
      const mockCompany = { id: INSURANCE_ID, name: 'Allstate', is_drp: false };
      knex._chain.returning.mockReturnValueOnce([mockCompany]);

      const result = await service.create(TENANT_ID, { name: 'Allstate' } as any);

      expect(result).toEqual(mockCompany);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, name: 'Allstate' }),
      );
    });

    it('should generate id for new record', async () => {
      const mockCompany = { id: '00000000-0000-0000-0000-000000000099' };
      knex._chain.returning.mockReturnValueOnce([mockCompany]);

      await service.create(TENANT_ID, { name: 'Test' } as any);

      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ id: '00000000-0000-0000-0000-000000000099' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return insurance company when found', async () => {
      const mockCompany = { id: INSURANCE_ID, name: 'State Farm' };
      knex._chain.first.mockReturnValueOnce(mockCompany);

      const result = await service.findOne(TENANT_ID, INSURANCE_ID);

      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, INSURANCE_ID)).rejects.toThrow(NotFoundException);
    });

    it('should filter by tenant_id and non-deleted', async () => {
      knex._chain.first.mockReturnValueOnce({ id: INSURANCE_ID });

      await service.findOne(TENANT_ID, INSURANCE_ID);

      expect(knex._chain.where).toHaveBeenCalledWith({
        id: INSURANCE_ID,
        tenant_id: TENANT_ID,
        deleted_at: null,
      });
    });
  });

  describe('update', () => {
    it('should update and return insurance company', async () => {
      const mockCompany = { id: INSURANCE_ID, name: 'Updated Name' };
      knex._chain.returning.mockReturnValueOnce([mockCompany]);

      const result = await service.update(TENANT_ID, INSURANCE_ID, { name: 'Updated Name' } as any);

      expect(result).toEqual(mockCompany);
    });

    it('should set updated_at timestamp', async () => {
      knex._chain.returning.mockReturnValueOnce([{ id: INSURANCE_ID }]);

      await service.update(TENANT_ID, INSURANCE_ID, { name: 'Test' } as any);

      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ updated_at: expect.any(Date) }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, INSURANCE_ID, { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete insurance company', async () => {
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, INSURANCE_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should set deleted_at timestamp', async () => {
      knex._chain.update.mockReturnValueOnce(1);

      await service.remove(TENANT_ID, INSURANCE_ID);

      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date) }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.update.mockReturnValueOnce(0);

      await expect(service.remove(TENANT_ID, INSURANCE_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

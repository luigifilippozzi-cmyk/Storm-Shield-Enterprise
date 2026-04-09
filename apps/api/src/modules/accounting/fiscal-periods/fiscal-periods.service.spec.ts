import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { TenantDatabaseService } from '../../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereIn',
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

describe('FiscalPeriodsService', () => {
  let service: FiscalPeriodsService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const PERIOD_ID = '00000000-0000-0000-0000-000000000020';
  const USER_ID = '00000000-0000-0000-0000-000000000005';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalPeriodsService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<FiscalPeriodsService>(FiscalPeriodsService);
  });

  describe('findAll', () => {
    it('should return paginated fiscal periods', async () => {
      const mockPeriods = [{ id: PERIOD_ID, name: 'January 2026' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockPeriods);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 50 });

      expect(result.data).toEqual(mockPeriods);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'open' as any, page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalledWith('status', 'open');
    });
  });

  describe('findOne', () => {
    it('should return period when found', async () => {
      const mockPeriod = { id: PERIOD_ID, name: 'January 2026' };
      knex._chain.first.mockReturnValueOnce(mockPeriod);

      const result = await service.findOne(TENANT_ID, PERIOD_ID);
      expect(result).toEqual(mockPeriod);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);
      await expect(service.findOne(TENANT_ID, PERIOD_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a fiscal period', async () => {
      const mockPeriod = { id: PERIOD_ID, name: 'January 2026', status: 'open' };
      knex._chain.first.mockReturnValueOnce(null); // no overlap
      knex._chain.returning.mockReturnValueOnce([mockPeriod]);

      const result = await service.create(TENANT_ID, {
        name: 'January 2026',
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      expect(result).toEqual(mockPeriod);
    });

    it('should throw when start_date >= end_date', async () => {
      await expect(
        service.create(TENANT_ID, {
          name: 'Bad Period',
          start_date: '2026-01-31',
          end_date: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when period overlaps', async () => {
      knex._chain.first.mockReturnValueOnce({ id: 'existing', name: 'Existing Period' });

      await expect(
        service.create(TENANT_ID, {
          name: 'Overlap',
          start_date: '2026-01-15',
          end_date: '2026-02-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('close', () => {
    it('should close an open period', async () => {
      const mockPeriod = { id: PERIOD_ID, status: 'open' };
      knex._chain.first
        .mockReturnValueOnce(mockPeriod) // findOne
        .mockReturnValueOnce(null); // no draft entries
      knex._chain.returning.mockReturnValueOnce([{ ...mockPeriod, status: 'closed' }]);

      const result = await service.close(TENANT_ID, PERIOD_ID, USER_ID);
      expect(result.status).toBe('closed');
    });

    it('should throw when period is not open', async () => {
      knex._chain.first.mockReturnValueOnce({ id: PERIOD_ID, status: 'closed' });

      await expect(service.close(TENANT_ID, PERIOD_ID, USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when period not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.close(TENANT_ID, PERIOD_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw when period has draft entries', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: PERIOD_ID, status: 'open' })
        .mockReturnValueOnce({ id: 'draft-entry' }); // draft entry exists

      await expect(service.close(TENANT_ID, PERIOD_ID, USER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reopen', () => {
    it('should reopen a closed period', async () => {
      knex._chain.first.mockReturnValueOnce({ id: PERIOD_ID, status: 'closed' });
      knex._chain.returning.mockReturnValueOnce([{ id: PERIOD_ID, status: 'open' }]);

      const result = await service.reopen(TENANT_ID, PERIOD_ID);
      expect(result.status).toBe('open');
    });

    it('should throw when period is locked', async () => {
      knex._chain.first.mockReturnValueOnce({ id: PERIOD_ID, status: 'locked' });

      await expect(service.reopen(TENANT_ID, PERIOD_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when period is already open', async () => {
      knex._chain.first.mockReturnValueOnce({ id: PERIOD_ID, status: 'open' });

      await expect(service.reopen(TENANT_ID, PERIOD_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.reopen(TENANT_ID, PERIOD_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

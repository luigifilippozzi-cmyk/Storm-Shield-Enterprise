import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike', 'sum', 'groupBy', 'groupByRaw',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn.raw = jest.fn().mockReturnValue('raw_expr');
  knexFn._chain = chain;
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('FinancialService', () => {
  let service: FinancialService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const TX_ID = '00000000-0000-0000-0000-000000000010';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<FinancialService>(FinancialService);
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const mockTx = [{ id: TX_ID, description: 'Payment', amount: 100 }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockTx);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockTx);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by transaction_type', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { transaction_type: 'income', page: 1, limit: 20 } as any);

      expect(knex._chain.where).toHaveBeenCalledWith('transaction_type', 'income');
    });

    it('should filter by category', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { category: 'pdr_service', page: 1, limit: 20 } as any);

      expect(knex._chain.where).toHaveBeenCalledWith('category', 'pdr_service');
    });

    it('should filter by date range', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, {
        date_from: '2026-01-01',
        date_to: '2026-12-31',
        page: 1,
        limit: 20,
      } as any);

      expect(knex._chain.where).toHaveBeenCalledWith('transaction_date', '>=', '2026-01-01');
      expect(knex._chain.where).toHaveBeenCalledWith('transaction_date', '<=', '2026-12-31');
    });
  });

  describe('create', () => {
    it('should create and return transaction', async () => {
      const mockTx = { id: TX_ID, description: 'New payment', amount: 250 };
      knex._chain.returning.mockReturnValueOnce([mockTx]);

      const result = await service.create(TENANT_ID, {
        description: 'New payment',
        amount: 250,
        transaction_type: 'income',
        category: 'pdr_service',
        transaction_date: '2026-04-06',
      } as any);

      expect(result).toEqual(mockTx);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, description: 'New payment' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return transaction when found', async () => {
      const mockTx = { id: TX_ID, description: 'Payment' };
      knex._chain.first.mockReturnValueOnce(mockTx);

      const result = await service.findOne(TENANT_ID, TX_ID);

      expect(result).toEqual(mockTx);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, TX_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return transaction', async () => {
      const mockTx = { id: TX_ID, description: 'Updated' };
      knex._chain.returning.mockReturnValueOnce([mockTx]);

      const result = await service.update(TENANT_ID, TX_ID, { description: 'Updated' } as any);

      expect(result).toEqual(mockTx);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, TX_ID, { description: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete transaction', async () => {
      knex._chain.first.mockReturnValueOnce({ id: TX_ID });

      const result = await service.remove(TENANT_ID, TX_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, TX_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return financial summary', async () => {
      const mockSummary = {
        total_income: '1000.00',
        total_expenses: '500.00',
        net_balance: '500.00',
        total_transactions: '10',
      };
      knex._chain.first.mockReturnValueOnce(mockSummary);

      const result = await service.getSummary(TENANT_ID);

      expect(result).toEqual(mockSummary);
    });
  });

  describe('getDashboard', () => {
    it('should return full dashboard data', async () => {
      const mockSummary = { total_income: '1000.00', total_expenses: '500.00' };
      const mockIncomeByCategory = [{ category: 'pdr_service', total: '800.00' }];
      const mockExpenseByCategory = [{ category: 'parts', total: '300.00' }];
      const mockTrend = [{ month: '2026-03', income: '500.00', expenses: '200.00' }];
      const mockRecent = [{ id: TX_ID, description: 'Recent payment' }];

      // getSummary calls
      knex._chain.first.mockReturnValueOnce(mockSummary);
      // incomeByCategory
      knex._chain.orderBy.mockReturnValueOnce(mockIncomeByCategory);
      // expenseByCategory
      knex._chain.orderBy.mockReturnValueOnce(mockExpenseByCategory);
      // monthlyTrend
      knex._chain.orderBy.mockReturnValueOnce(mockTrend);
      // recentTransactions
      knex._chain.limit.mockReturnValueOnce(mockRecent);

      const result = await service.getDashboard(TENANT_ID);

      expect(result.summary).toEqual(mockSummary);
      expect(result.income_by_category).toEqual(mockIncomeByCategory);
      expect(result.expense_by_category).toEqual(mockExpenseByCategory);
      expect(result.monthly_trend).toEqual(mockTrend);
      expect(result.recent_transactions).toEqual(mockRecent);
    });
  });
});

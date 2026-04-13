import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { TenantDatabaseService } from '../../../config/tenant-database.service';

const TENANT = 'tenant-123';

const mockRows = [
  {
    account_id: 'acc-1',
    account_number: '4010',
    account_name: 'PDR Revenue',
    account_type: 'revenue',
    normal_balance: 'credit',
    total_debits: '0',
    total_credits: '5000.00',
  },
  {
    account_id: 'acc-2',
    account_number: '5010',
    account_name: 'Parts Expense',
    account_type: 'expense',
    normal_balance: 'debit',
    total_debits: '2000.00',
    total_credits: '0',
  },
  {
    account_id: 'acc-3',
    account_number: '1010',
    account_name: 'Cash',
    account_type: 'asset',
    normal_balance: 'debit',
    total_debits: '3000.00',
    total_credits: '0',
  },
  {
    account_id: 'acc-4',
    account_number: '3010',
    account_name: "Owner's Equity",
    account_type: 'equity',
    normal_balance: 'credit',
    total_debits: '0',
    total_credits: '6000.00',
  },
];

function makeKnexMock(rows: any[]) {
  // A thenable query builder: all chain methods return `this`,
  // and the builder itself resolves with `rows` when awaited.
  const builder: any = {
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    // Make the builder awaitable (Promise-like)
    then: (resolve: (v: any) => any, reject: (e: any) => any) =>
      Promise.resolve(rows).then(resolve, reject),
    catch: (reject: (e: any) => any) => Promise.resolve(rows).catch(reject),
    finally: (cb: () => any) => Promise.resolve(rows).finally(cb),
  };
  const knex: any = jest.fn().mockReturnValue(builder);
  knex.raw = jest.fn((sql: string) => sql);
  return knex;
}

describe('ReportsService', () => {
  let service: ReportsService;
  let tenantDb: jest.Mocked<TenantDatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: TenantDatabaseService,
          useValue: { getConnection: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    tenantDb = module.get(TenantDatabaseService);
  });

  function setupKnex(rows = mockRows) {
    tenantDb.getConnection.mockResolvedValue(makeKnexMock(rows) as any);
  }

  // ── Trial Balance ──────────────────────────────────────────────────────

  describe('getTrialBalance', () => {
    it('returns all account rows', async () => {
      setupKnex();
      const result = await service.getTrialBalance(TENANT, {});
      expect(result.rows).toHaveLength(4);
    });

    it('defaults as_of_date to today', async () => {
      setupKnex();
      const today = new Date().toISOString().slice(0, 10);
      const result = await service.getTrialBalance(TENANT, {});
      expect(result.as_of_date).toBe(today);
    });

    it('uses provided as_of_date', async () => {
      setupKnex();
      const result = await service.getTrialBalance(TENANT, { as_of_date: '2026-03-31' });
      expect(result.as_of_date).toBe('2026-03-31');
    });

    it('computes balance as debits-credits for debit-normal account', async () => {
      setupKnex();
      const result = await service.getTrialBalance(TENANT, {});
      const cash = result.rows.find((r) => r.account_number === '1010')!;
      expect(cash.balance).toBe(3000); // 3000 - 0
    });

    it('computes balance as credits-debits for credit-normal account', async () => {
      setupKnex();
      const result = await service.getTrialBalance(TENANT, {});
      const revenue = result.rows.find((r) => r.account_number === '4010')!;
      expect(revenue.balance).toBe(5000); // 5000 - 0
    });

    it('sums total_debits and total_credits correctly', async () => {
      setupKnex();
      const result = await service.getTrialBalance(TENANT, {});
      expect(result.total_debits).toBe(5000); // 0+2000+3000+0
      expect(result.total_credits).toBe(11000); // 5000+0+0+6000
    });
  });

  // ── Profit & Loss ──────────────────────────────────────────────────────

  describe('getProfitLoss', () => {
    it('includes only revenue accounts (4000-4999) in revenue section', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {});
      expect(result.revenue.rows.map((r) => r.account_number)).toEqual(['4010']);
    });

    it('includes only expense accounts (5000-9999) in expenses section', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {});
      expect(result.expenses.rows.map((r) => r.account_number)).toEqual(['5010']);
    });

    it('calculates revenue amount as credits - debits', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {});
      expect(result.revenue.rows[0].amount).toBe(5000);
    });

    it('calculates expense amount as debits - credits', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {});
      expect(result.expenses.rows[0].amount).toBe(2000);
    });

    it('calculates net income as revenue - expenses', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {});
      expect(result.net_income).toBe(3000); // 5000 - 2000
    });

    it('uses provided date range', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {
        date_from: '2026-01-01',
        date_to: '2026-03-31',
      });
      expect(result.date_from).toBe('2026-01-01');
      expect(result.date_to).toBe('2026-03-31');
    });

    it('defaults date_from to start of current year', async () => {
      setupKnex();
      const result = await service.getProfitLoss(TENANT, {});
      expect(result.date_from).toMatch(/^\d{4}-01-01$/);
    });
  });

  // ── Balance Sheet ──────────────────────────────────────────────────────

  describe('getBalanceSheet', () => {
    it('puts account 1010 in assets', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.assets.rows.map((r) => r.account_number)).toContain('1010');
    });

    it('puts account 3010 in equity', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.equity.rows.map((r) => r.account_number)).toContain('3010');
    });

    it('has no liabilities when none in mock data', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.liabilities.rows).toHaveLength(0);
      expect(result.liabilities.total).toBe(0);
    });

    it('calculates asset balance as debits - credits', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.assets.total).toBe(3000);
    });

    it('calculates equity balance as credits - debits', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.equity.total).toBe(6000);
    });

    it('sets total_liabilities_and_equity as liabilities + equity', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.total_liabilities_and_equity).toBe(
        result.liabilities.total + result.equity.total,
      );
    });

    it('uses provided as_of_date', async () => {
      setupKnex();
      const result = await service.getBalanceSheet(TENANT, { as_of_date: '2026-12-31' });
      expect(result.as_of_date).toBe('2026-12-31');
    });

    it('defaults as_of_date to today', async () => {
      setupKnex();
      const today = new Date().toISOString().slice(0, 10);
      const result = await service.getBalanceSheet(TENANT, {});
      expect(result.as_of_date).toBe(today);
    });
  });
});

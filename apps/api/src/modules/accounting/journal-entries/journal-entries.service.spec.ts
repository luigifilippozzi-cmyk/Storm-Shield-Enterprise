import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JournalEntriesService } from './journal-entries.service';
import { FiscalPeriodsService } from '../fiscal-periods/fiscal-periods.service';
import { TenantDatabaseService } from '../../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike', 'whereIn', 'leftJoin', 'whereRaw',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  // Transaction mock: execute callback with knexFn itself (callable)
  knexFn.transaction = jest.fn().mockImplementation(async (cb: any) => cb(knexFn));
  knexFn._chain = chain;
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('JournalEntriesService', () => {
  let service: JournalEntriesService;
  let knex: any;
  let fiscalPeriodsService: FiscalPeriodsService;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const ENTRY_ID = '00000000-0000-0000-0000-000000000030';
  const USER_ID = '00000000-0000-0000-0000-000000000005';
  const PERIOD_ID = '00000000-0000-0000-0000-000000000020';
  const ACCOUNT_A = '00000000-0000-0000-0000-0000000000a1';
  const ACCOUNT_B = '00000000-0000-0000-0000-0000000000a2';

  const MOCK_PERIOD = { id: PERIOD_ID, name: 'January 2026', status: 'open' };

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntriesService,
        {
          provide: FiscalPeriodsService,
          useValue: {
            findOpenPeriodForDate: jest.fn().mockResolvedValue(MOCK_PERIOD),
          },
        },
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<JournalEntriesService>(JournalEntriesService);
    fiscalPeriodsService = module.get<FiscalPeriodsService>(FiscalPeriodsService);
  });

  const validLines = [
    { account_id: ACCOUNT_A, debit: 100, credit: 0 },
    { account_id: ACCOUNT_B, debit: 0, credit: 100 },
  ];

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated journal entries', async () => {
      const mockEntries = [{ id: ENTRY_ID, entry_number: 'JE-2026-0001' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockEntries);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockEntries);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'posted' as any });

      expect(knex._chain.where).toHaveBeenCalledWith('status', 'posted');
    });
  });

  // ── findOne ──────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return entry with lines', async () => {
      const mockEntry = { id: ENTRY_ID, entry_number: 'JE-2026-0001' };
      knex._chain.first.mockReturnValueOnce(mockEntry);
      knex._chain.orderBy.mockReturnValueOnce([{ id: 'line-1' }]);

      const result = await service.findOne(TENANT_ID, ENTRY_ID);

      expect(result.id).toBe(ENTRY_ID);
      expect(result.lines).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, ENTRY_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('should create entry with balanced lines', async () => {
      // accounts exist
      knex._chain.where.mockReturnValue(knex._chain);
      knex._chain.whereIn.mockReturnValueOnce([{ id: ACCOUNT_A }, { id: ACCOUNT_B }]);
      // entry number count
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      // transaction: insert entry + lines
      const mockEntry = { id: ENTRY_ID, entry_number: 'JE-2026-0001', status: 'draft' };
      knex._chain.returning.mockReturnValueOnce([mockEntry]);
      knex._chain.insert.mockReturnValue(knex._chain);

      const result = await service.create(TENANT_ID, USER_ID, {
        entry_date: '2026-01-15',
        description: 'Test entry',
        lines: validLines,
      });

      expect(result.id).toBe(ENTRY_ID);
    });

    it('should throw when fewer than 2 lines', async () => {
      await expect(
        service.create(TENANT_ID, USER_ID, {
          entry_date: '2026-01-15',
          description: 'Test',
          lines: [{ account_id: ACCOUNT_A, debit: 100, credit: 0 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when a line has both debit and credit', async () => {
      await expect(
        service.create(TENANT_ID, USER_ID, {
          entry_date: '2026-01-15',
          description: 'Test',
          lines: [
            { account_id: ACCOUNT_A, debit: 100, credit: 50 },
            { account_id: ACCOUNT_B, debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when a line has zero debit and credit', async () => {
      await expect(
        service.create(TENANT_ID, USER_ID, {
          entry_date: '2026-01-15',
          description: 'Test',
          lines: [
            { account_id: ACCOUNT_A, debit: 0, credit: 0 },
            { account_id: ACCOUNT_B, debit: 0, credit: 100 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when entry does not balance', async () => {
      await expect(
        service.create(TENANT_ID, USER_ID, {
          entry_date: '2026-01-15',
          description: 'Test',
          lines: [
            { account_id: ACCOUNT_A, debit: 100, credit: 0 },
            { account_id: ACCOUNT_B, debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when no open fiscal period', async () => {
      jest.spyOn(fiscalPeriodsService, 'findOpenPeriodForDate').mockResolvedValueOnce(null);

      await expect(
        service.create(TENANT_ID, USER_ID, {
          entry_date: '2026-01-15',
          description: 'Test',
          lines: validLines,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when account IDs are invalid', async () => {
      knex._chain.whereIn.mockReturnValueOnce([]); // no accounts found
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);

      await expect(
        service.create(TENANT_ID, USER_ID, {
          entry_date: '2026-01-15',
          description: 'Test',
          lines: validLines,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── post ─────────────────────────────────────────────────────

  describe('post', () => {
    it('should post a draft entry', async () => {
      const mockEntry = { id: ENTRY_ID, status: 'draft', fiscal_period_id: PERIOD_ID, total_debit: '100.00', total_credit: '100.00' };
      knex._chain.first
        .mockReturnValueOnce(mockEntry)    // find entry
        .mockReturnValueOnce(MOCK_PERIOD); // find period
      knex._chain.returning.mockReturnValueOnce([{ ...mockEntry, status: 'posted' }]);

      const result = await service.post(TENANT_ID, ENTRY_ID, USER_ID);
      expect(result.status).toBe('posted');
    });

    it('should throw when entry is already posted', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ENTRY_ID, status: 'posted' });

      await expect(service.post(TENANT_ID, ENTRY_ID, USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when entry not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.post(TENANT_ID, ENTRY_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw when fiscal period is closed', async () => {
      const mockEntry = { id: ENTRY_ID, status: 'draft', fiscal_period_id: PERIOD_ID, total_debit: '100.00', total_credit: '100.00' };
      knex._chain.first
        .mockReturnValueOnce(mockEntry)
        .mockReturnValueOnce({ ...MOCK_PERIOD, status: 'closed' });

      await expect(service.post(TENANT_ID, ENTRY_ID, USER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── reverse ──────────────────────────────────────────────────

  describe('reverse', () => {
    it('should reverse a posted entry', async () => {
      const mockEntry = { id: ENTRY_ID, status: 'posted', entry_number: 'JE-2026-0001', total_debit: '100.00', total_credit: '100.00' };
      knex._chain.first.mockReturnValueOnce(mockEntry); // find entry
      // lines: the service calls knex('journal_entry_lines').where({...})
      // Since where() returns the chain, and the chain is iterable via the final await,
      // we need the second knex() call to eventually resolve to an array.
      // The service awaits the chain directly (no .first()), so we mock the where to return a thenable array.
      const mockLines = [
        { account_id: ACCOUNT_A, debit: 100, credit: 0, description: 'Debit line' },
        { account_id: ACCOUNT_B, debit: 0, credit: 100, description: 'Credit line' },
      ];
      // Override: second call to knex() for journal_entry_lines returns a promise-like array
      knex.mockImplementationOnce(() => {
        // Already first call returned chain for journal_entries.where.first
        return knex._chain;
      }).mockImplementationOnce(() => {
        const linesChain: any = { where: jest.fn().mockResolvedValue(mockLines) };
        return linesChain;
      });
      // entry number count
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      // transaction
      const reversalEntry = { id: '00000000-0000-0000-0000-000000000099', status: 'posted', entry_number: 'JE-2026-0002' };
      knex._chain.returning.mockReturnValueOnce([reversalEntry]);
      knex._chain.insert.mockReturnValue(knex._chain);

      const result = await service.reverse(TENANT_ID, ENTRY_ID, USER_ID);
      expect(result.status).toBe('posted');
    });

    it('should throw when entry is not posted', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ENTRY_ID, status: 'draft' });

      await expect(service.reverse(TENANT_ID, ENTRY_ID, USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when entry not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.reverse(TENANT_ID, ENTRY_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ───────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a draft entry and its lines', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ENTRY_ID, status: 'draft' });
      knex._chain.del.mockReturnValue(1);

      const result = await service.remove(TENANT_ID, ENTRY_ID);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw when entry is posted', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ENTRY_ID, status: 'posted' });

      await expect(service.remove(TENANT_ID, ENTRY_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when entry not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, ENTRY_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DepreciationService } from './depreciation.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { JournalEntriesService } from '../accounting/journal-entries/journal-entries.service';
import { DepreciationMethod } from '@sse/shared-types';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'whereNot', 'insert', 'update', 'select', 'first', 'returning',
    'orderBy',
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

describe('DepreciationService', () => {
  let service: DepreciationService;
  let knex: any;
  let mockJeService: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const USER_ID = '00000000-0000-0000-0000-000000000002';
  const ASSET_ID = '00000000-0000-0000-0000-000000000010';
  const PERIOD_ID = '00000000-0000-0000-0000-000000000030';

  beforeEach(async () => {
    knex = mockKnex();
    mockJeService = {
      create: jest.fn().mockResolvedValue({ id: 'je-001', entry_number: 'JE-2024-0001' }),
      post: jest.fn().mockResolvedValue({ id: 'je-001', status: 'posted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepreciationService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
        { provide: JournalEntriesService, useValue: mockJeService },
      ],
    }).compile();
    service = module.get<DepreciationService>(DepreciationService);
  });

  // ── calculateMonthlyDepreciation ────────────────────────────

  describe('calculateMonthlyDepreciation', () => {
    it('should calculate straight-line depreciation', () => {
      const result = service.calculateMonthlyDepreciation(
        25000, 2500, 84, 0, DepreciationMethod.STRAIGHT_LINE, 0,
      );
      // (25000 - 2500) / 84 = 267.86
      expect(result).toBe(267.86);
    });

    it('should return 0 when fully depreciated', () => {
      const result = service.calculateMonthlyDepreciation(
        25000, 2500, 84, 22500, DepreciationMethod.STRAIGHT_LINE, 84,
      );
      expect(result).toBe(0);
    });

    it('should cap depreciation at remaining value', () => {
      const result = service.calculateMonthlyDepreciation(
        25000, 2500, 84, 22400, DepreciationMethod.STRAIGHT_LINE, 83,
      );
      // Remaining = 22500 - 22400 = 100, monthly would be 267.86
      expect(result).toBe(100);
    });

    it('should calculate declining balance depreciation', () => {
      const result = service.calculateMonthlyDepreciation(
        25000, 2500, 84, 0, DepreciationMethod.DECLINING_BALANCE, 0,
      );
      // rate = 2/84, amount = 25000 * (2/84) = 595.24
      expect(result).toBe(595.24);
    });

    it('should calculate sum-of-years depreciation', () => {
      const result = service.calculateMonthlyDepreciation(
        25000, 2500, 84, 0, DepreciationMethod.SUM_OF_YEARS, 0,
      );
      // totalYears=7, sumOfYears=28, year1 remaining=7
      // annual = (7/28) * 22500 = 5625, monthly = 5625/12 = 468.75
      expect(result).toBe(468.75);
    });

    it('should return 0 for units_of_production (requires separate handling)', () => {
      const result = service.calculateMonthlyDepreciation(
        25000, 2500, 84, 0, DepreciationMethod.UNITS_OF_PRODUCTION, 0,
      );
      expect(result).toBe(0);
    });
  });

  // ── executeDepreciation ─────────────────────────────────────

  describe('executeDepreciation', () => {
    const mockAsset = {
      id: ASSET_ID,
      category_id: 'cat-001',
      asset_tag: 'EQ-001',
      asset_name: 'CNC Machine',
      status: 'active',
      acquisition_cost: '25000.00',
      salvage_value: '2500.00',
      accumulated_depreciation: '0.00',
      net_book_value: '25000.00',
      depreciation_method: 'straight_line',
      useful_life_months: 84,
      depreciation_start_date: '2024-01-01',
    };

    const mockCategory = {
      id: 'cat-001',
      expense_account_id: 'acc-expense',
      depreciation_account_id: 'acc-dep',
    };

    it('should execute depreciation and create JE', async () => {
      knex._chain.first
        .mockReturnValueOnce(mockAsset)    // asset found
        .mockReturnValueOnce(null)         // no existing entry
        .mockReturnValueOnce(mockCategory); // category found
      knex._chain.update.mockReturnValueOnce(1); // asset update
      knex._chain.returning.mockReturnValueOnce([{
        id: 'dep-entry-001',
        depreciation_amount: 267.86,
        accumulated_depreciation: 267.86,
        net_book_value: 24732.14,
      }]);

      const result = await service.executeDepreciation(
        TENANT_ID, USER_ID, ASSET_ID, PERIOD_ID, '2024-02-01',
      );

      expect(result.depreciation_amount).toBe(267.86);
      expect(mockJeService.create).toHaveBeenCalledWith(
        TENANT_ID, USER_ID,
        expect.objectContaining({
          description: expect.stringContaining('Depreciation'),
          reference_type: 'depreciation',
          lines: expect.arrayContaining([
            expect.objectContaining({ account_id: 'acc-expense', debit: expect.any(Number) }),
            expect.objectContaining({ account_id: 'acc-dep', credit: expect.any(Number) }),
          ]),
        }),
      );
      expect(mockJeService.post).toHaveBeenCalled();
    });

    it('should throw NotFoundException when asset not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.executeDepreciation(TENANT_ID, USER_ID, ASSET_ID, PERIOD_ID, '2024-02-01'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when asset not active', async () => {
      knex._chain.first.mockReturnValueOnce({ ...mockAsset, status: 'disposed' });

      await expect(
        service.executeDepreciation(TENANT_ID, USER_ID, ASSET_ID, PERIOD_ID, '2024-02-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on duplicate depreciation', async () => {
      knex._chain.first
        .mockReturnValueOnce(mockAsset)
        .mockReturnValueOnce({ id: 'existing-entry' }); // duplicate found

      await expect(
        service.executeDepreciation(TENANT_ID, USER_ID, ASSET_ID, PERIOD_ID, '2024-02-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── executeBatchDepreciation ─────────────────────────────────

  describe('executeBatchDepreciation', () => {
    it('should process all active assets', async () => {
      const mockAssets = [
        { id: 'asset-1', asset_tag: 'EQ-001' },
        { id: 'asset-2', asset_tag: 'EQ-002' },
      ];
      // The chain: knex('fixed_assets').where({...}).where({...}) resolves to mockAssets
      // where returns chain, and the final where in the chain resolves to the array
      knex._chain.where.mockReturnValue(mockAssets);

      // Mock executeDepreciation to succeed for first, fail for second
      jest.spyOn(service, 'executeDepreciation')
        .mockResolvedValueOnce({ depreciation_amount: 500 } as any)
        .mockRejectedValueOnce(new BadRequestException('Already depreciated'));

      const result = await service.executeBatchDepreciation(
        TENANT_ID, USER_ID, PERIOD_ID, '2024-03-31',
      );

      expect(result.total_assets).toBe(2);
      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.total_depreciation).toBe(500);
    });
  });
});

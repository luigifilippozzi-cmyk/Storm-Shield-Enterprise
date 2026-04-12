import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DisposalService } from './disposal.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { JournalEntriesService } from '../accounting/journal-entries/journal-entries.service';

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

describe('DisposalService', () => {
  let service: DisposalService;
  let knex: any;
  let mockJeService: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const USER_ID = '00000000-0000-0000-0000-000000000002';
  const ASSET_ID = '00000000-0000-0000-0000-000000000010';
  const PERIOD_ID = '00000000-0000-0000-0000-000000000030';

  beforeEach(async () => {
    knex = mockKnex();
    mockJeService = {
      create: jest.fn().mockResolvedValue({ id: 'je-001' }),
      post: jest.fn().mockResolvedValue({ id: 'je-001', status: 'posted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisposalService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
        { provide: JournalEntriesService, useValue: mockJeService },
      ],
    }).compile();
    service = module.get<DisposalService>(DisposalService);
  });

  // ── disposeAsset ────────────────────────────────────────────

  describe('disposeAsset', () => {
    const mockAsset = {
      id: ASSET_ID,
      category_id: 'cat-001',
      asset_tag: 'EQ-001',
      asset_name: 'CNC Machine',
      status: 'active',
      acquisition_cost: '25000.00',
      salvage_value: '2500.00',
      accumulated_depreciation: '20000.00',
      net_book_value: '5000.00',
    };

    const mockCategory = {
      id: 'cat-001',
      asset_account_id: 'acc-asset',
      depreciation_account_id: 'acc-dep',
      expense_account_id: 'acc-expense',
      gain_loss_account_id: 'acc-gl',
    };

    const disposeDto = {
      disposal_type: 'sale' as any,
      disposal_date: '2024-06-30',
      disposal_proceeds: 6000,
      fiscal_period_id: PERIOD_ID,
      reason: 'Upgrading to newer model',
    };

    it('should dispose asset and create journal entry', async () => {
      knex._chain.first
        .mockReturnValueOnce(mockAsset)     // asset found
        .mockReturnValueOnce(mockCategory); // category found
      knex._chain.returning.mockReturnValueOnce([{
        id: 'disposal-001',
        gain_loss: 1000,
        disposal_proceeds: 6000,
      }]);
      knex._chain.update.mockReturnValueOnce(1); // asset status update

      const result = await service.disposeAsset(TENANT_ID, USER_ID, ASSET_ID, disposeDto);

      expect(result.gain_loss).toBe(1000);
      expect(mockJeService.create).toHaveBeenCalledWith(
        TENANT_ID, USER_ID,
        expect.objectContaining({
          reference_type: 'asset_disposal',
          reference_id: ASSET_ID,
        }),
      );
      expect(mockJeService.post).toHaveBeenCalled();
    });

    it('should throw NotFoundException when asset not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.disposeAsset(TENANT_ID, USER_ID, ASSET_ID, disposeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when asset already disposed', async () => {
      knex._chain.first.mockReturnValueOnce({ ...mockAsset, status: 'disposed' });

      await expect(
        service.disposeAsset(TENANT_ID, USER_ID, ASSET_ID, disposeDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle write-off with no proceeds (loss)', async () => {
      const writeOffDto = {
        ...disposeDto,
        disposal_type: 'write_off' as any,
        disposal_proceeds: 0,
      };

      knex._chain.first
        .mockReturnValueOnce(mockAsset)
        .mockReturnValueOnce(mockCategory);
      knex._chain.returning.mockReturnValueOnce([{
        id: 'disposal-002',
        gain_loss: -5000, // loss = 0 - 5000 NBV
        disposal_proceeds: 0,
      }]);
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.disposeAsset(TENANT_ID, USER_ID, ASSET_ID, writeOffDto);

      expect(result.gain_loss).toBe(-5000);
      expect(mockJeService.create).toHaveBeenCalled();
    });
  });

  // ── findDisposals ───────────────────────────────────────────

  describe('findDisposals', () => {
    it('should return all disposals for tenant', async () => {
      const mockDisposals = [{ id: 'disposal-001', disposal_type: 'sale' }];
      knex._chain.orderBy.mockReturnValueOnce(mockDisposals);

      const result = await service.findDisposals(TENANT_ID);

      expect(result).toEqual(mockDisposals);
    });

    it('should filter by asset_id when provided', async () => {
      // The chain: knex('asset_disposals').where({...}).orderBy(...) then .where(...)
      // orderBy returns chain, and the subsequent where is called on it
      knex._chain.orderBy.mockReturnValue(knex._chain);
      knex._chain.where.mockReturnValue(knex._chain);

      await service.findDisposals(TENANT_ID, ASSET_ID);

      expect(knex._chain.where).toHaveBeenCalledWith('fixed_asset_id', ASSET_ID);
    });
  });
});

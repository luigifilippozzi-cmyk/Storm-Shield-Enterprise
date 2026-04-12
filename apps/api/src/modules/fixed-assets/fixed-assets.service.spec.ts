import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'whereNot', 'insert', 'update', 'select', 'first', 'returning',
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

describe('FixedAssetsService', () => {
  let service: FixedAssetsService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const ASSET_ID = '00000000-0000-0000-0000-000000000010';
  const CATEGORY_ID = '00000000-0000-0000-0000-000000000020';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedAssetsService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<FixedAssetsService>(FixedAssetsService);
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated assets', async () => {
      const mockAssets = [{ id: ASSET_ID, asset_tag: 'EQ-001', asset_name: 'CNC Machine' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockAssets);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 50 });

      expect(result.data).toEqual(mockAssets);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'CNC', page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'active' as any, page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalledWith('status', 'active');
    });

    it('should filter by category_id', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { category_id: CATEGORY_ID, page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalledWith('category_id', CATEGORY_ID);
    });

    it('should use default sort when invalid sort_by provided', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'invalid_column', page: 1, limit: 50 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('asset_tag', 'asc');
    });
  });

  // ── findOne ──────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return asset when found', async () => {
      const mockAsset = { id: ASSET_ID, asset_tag: 'EQ-001' };
      knex._chain.first.mockReturnValueOnce(mockAsset);

      const result = await service.findOne(TENANT_ID, ASSET_ID);

      expect(result).toEqual(mockAsset);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, ASSET_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      category_id: CATEGORY_ID,
      asset_tag: 'EQ-002',
      asset_name: 'Plasma Cutter',
      acquisition_date: '2024-01-15',
      acquisition_cost: 25000,
      salvage_value: 2500,
      depreciation_method: 'straight_line' as any,
      useful_life_months: 84,
      depreciation_start_date: '2024-02-01',
    };

    it('should create and return asset', async () => {
      const mockAsset = { id: ASSET_ID, ...createDto };
      knex._chain.first
        .mockReturnValueOnce({ id: CATEGORY_ID }) // category exists
        .mockReturnValueOnce(null); // no duplicate tag
      knex._chain.returning.mockReturnValueOnce([mockAsset]);

      const result = await service.create(TENANT_ID, createDto);

      expect(result).toEqual(mockAsset);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: TENANT_ID,
          asset_tag: 'EQ-002',
          net_book_value: 25000,
          accumulated_depreciation: 0,
          status: 'active',
        }),
      );
    });

    it('should throw BadRequestException when category not found', async () => {
      knex._chain.first.mockReturnValueOnce(null); // category not found

      await expect(service.create(TENANT_ID, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on duplicate asset_tag', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: CATEGORY_ID }) // category exists
        .mockReturnValueOnce({ id: 'existing' }); // duplicate tag

      await expect(service.create(TENANT_ID, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when salvage > cost', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: CATEGORY_ID }) // category exists
        .mockReturnValueOnce(null); // no duplicate

      await expect(
        service.create(TENANT_ID, { ...createDto, salvage_value: 30000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should default salvage_value to 0 when not provided', async () => {
      const dtoWithoutSalvage = { ...createDto };
      delete (dtoWithoutSalvage as any).salvage_value;

      knex._chain.first
        .mockReturnValueOnce({ id: CATEGORY_ID })
        .mockReturnValueOnce(null);
      knex._chain.returning.mockReturnValueOnce([{ id: ASSET_ID }]);

      await service.create(TENANT_ID, dtoWithoutSalvage);

      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ salvage_value: 0 }),
      );
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return asset', async () => {
      const mockAsset = { id: ASSET_ID, status: 'active', asset_name: 'Updated Name' };
      knex._chain.first.mockReturnValueOnce({ id: ASSET_ID, status: 'active' });
      knex._chain.returning.mockReturnValueOnce([mockAsset]);

      const result = await service.update(TENANT_ID, ASSET_ID, { asset_name: 'Updated Name' });

      expect(result).toEqual(mockAsset);
    });

    it('should throw NotFoundException when asset not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.update(TENANT_ID, ASSET_ID, { asset_name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating disposed asset', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ASSET_ID, status: 'disposed' });

      await expect(
        service.update(TENANT_ID, ASSET_ID, { asset_name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ───────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft delete asset with no depreciation', async () => {
      knex._chain.first.mockReturnValueOnce({
        id: ASSET_ID, status: 'active', accumulated_depreciation: '0',
      });
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, ASSET_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, ASSET_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when asset has depreciation entries', async () => {
      knex._chain.first.mockReturnValueOnce({
        id: ASSET_ID, status: 'active', accumulated_depreciation: '5000.00',
      });

      await expect(service.remove(TENANT_ID, ASSET_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── getDepreciationHistory ──────────────────────────────────

  describe('getDepreciationHistory', () => {
    it('should return depreciation entries', async () => {
      const mockEntries = [{ id: 'dep-1', depreciation_amount: '500.00' }];
      knex._chain.first.mockReturnValueOnce({ id: ASSET_ID }); // asset exists
      knex._chain.orderBy.mockReturnValueOnce(mockEntries);

      const result = await service.getDepreciationHistory(TENANT_ID, ASSET_ID);

      expect(result).toEqual(mockEntries);
    });

    it('should throw NotFoundException when asset not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.getDepreciationHistory(TENANT_ID, ASSET_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getSchedule ─────────────────────────────────────────────

  describe('getSchedule', () => {
    it('should return depreciation schedule', async () => {
      const mockSchedule = [{ period_number: 1, depreciation_amount: '297.62' }];
      knex._chain.first.mockReturnValueOnce({ id: ASSET_ID }); // asset exists
      knex._chain.orderBy.mockReturnValueOnce(mockSchedule);

      const result = await service.getSchedule(TENANT_ID, ASSET_ID);

      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException when asset not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.getSchedule(TENANT_ID, ASSET_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

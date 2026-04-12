import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

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

describe('AssetCategoriesService', () => {
  let service: AssetCategoriesService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const CATEGORY_ID = '00000000-0000-0000-0000-000000000020';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetCategoriesService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<AssetCategoriesService>(AssetCategoriesService);
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      const mockCategories = [{ id: CATEGORY_ID, category_name: 'Machinery' }];
      knex._chain.orderBy.mockReturnValueOnce(mockCategories);

      const result = await service.findAll(TENANT_ID);

      expect(result).toEqual(mockCategories);
      expect(knex).toHaveBeenCalledWith('asset_categories');
    });
  });

  // ── findOne ──────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return category when found', async () => {
      const mockCategory = { id: CATEGORY_ID, category_name: 'Machinery' };
      knex._chain.first.mockReturnValueOnce(mockCategory);

      const result = await service.findOne(TENANT_ID, CATEGORY_ID);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, CATEGORY_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      category_name: 'Vehicles',
      asset_account_id: 'acc-1',
      depreciation_account_id: 'acc-2',
      expense_account_id: 'acc-3',
      gain_loss_account_id: 'acc-4',
    };

    it('should create and return category', async () => {
      const mockCategory = { id: CATEGORY_ID, ...createDto };
      knex._chain.first.mockReturnValueOnce(null); // no duplicate
      knex._chain.returning.mockReturnValueOnce([mockCategory]);

      const result = await service.create(TENANT_ID, createDto as any);

      expect(result).toEqual(mockCategory);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, category_name: 'Vehicles' }),
      );
    });

    it('should throw ConflictException on duplicate name', async () => {
      knex._chain.first.mockReturnValueOnce({ id: 'existing' }); // duplicate

      await expect(service.create(TENANT_ID, createDto as any)).rejects.toThrow(ConflictException);
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return category', async () => {
      const mockCategory = { id: CATEGORY_ID, category_name: 'Updated Name' };
      knex._chain.first.mockReturnValueOnce({ id: CATEGORY_ID, category_name: 'Old Name' });
      knex._chain.first.mockReturnValueOnce(null); // no duplicate
      knex._chain.returning.mockReturnValueOnce([mockCategory]);

      const result = await service.update(TENANT_ID, CATEGORY_ID, { category_name: 'Updated Name' });

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.update(TENANT_ID, CATEGORY_ID, { category_name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when renaming to existing name', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: CATEGORY_ID, category_name: 'Old' }) // existing
        .mockReturnValueOnce({ id: 'other-id' }); // duplicate found

      await expect(
        service.update(TENANT_ID, CATEGORY_ID, { category_name: 'Duplicate Name' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check for duplicates when name unchanged', async () => {
      const mockCategory = { id: CATEGORY_ID, category_name: 'Same Name' };
      knex._chain.first.mockReturnValueOnce(mockCategory);
      knex._chain.returning.mockReturnValueOnce([mockCategory]);

      await service.update(TENANT_ID, CATEGORY_ID, { category_name: 'Same Name' });

      // whereNot should not be called since name is the same
      expect(knex._chain.whereNot).not.toHaveBeenCalled();
    });
  });
});

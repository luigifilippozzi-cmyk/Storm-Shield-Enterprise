import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AccountingService } from './accounting.service';
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

describe('AccountingService', () => {
  let service: AccountingService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const ACCOUNT_ID = '00000000-0000-0000-0000-000000000010';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<AccountingService>(AccountingService);
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated accounts', async () => {
      const mockAccounts = [{ id: ACCOUNT_ID, account_number: '1010', name: 'Cash' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockAccounts);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 50 });

      expect(result.data).toEqual(mockAccounts);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'cash', page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by account_type', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { account_type: 'asset' as any, page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalledWith('account_type', 'asset');
    });

    it('should filter by is_active', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { is_active: true, page: 1, limit: 50 });

      expect(knex._chain.where).toHaveBeenCalledWith('is_active', true);
    });

    it('should use default sort when invalid sort_by provided', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { sort_by: 'invalid_column', page: 1, limit: 50 });

      expect(knex._chain.orderBy).toHaveBeenCalledWith('account_number', 'asc');
    });
  });

  // ── findOne ──────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return account when found', async () => {
      const mockAccount = { id: ACCOUNT_ID, account_number: '1010', name: 'Cash' };
      knex._chain.first.mockReturnValueOnce(mockAccount);

      const result = await service.findOne(TENANT_ID, ACCOUNT_ID);

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, ACCOUNT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('should create and return account', async () => {
      const mockAccount = { id: ACCOUNT_ID, account_number: '1015', name: 'New Account' };
      knex._chain.first.mockReturnValueOnce(null); // no duplicate
      knex._chain.returning.mockReturnValueOnce([mockAccount]);

      const result = await service.create(TENANT_ID, {
        account_number: '1015',
        name: 'New Account',
        account_type: 'asset' as any,
        normal_balance: 'debit' as any,
      });

      expect(result).toEqual(mockAccount);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, account_number: '1015', is_system: false }),
      );
    });

    it('should throw ConflictException on duplicate account number', async () => {
      knex._chain.first.mockReturnValueOnce({ id: 'existing' }); // duplicate found

      await expect(
        service.create(TENANT_ID, {
          account_number: '1010',
          name: 'Duplicate',
          account_type: 'asset' as any,
          normal_balance: 'debit' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when parent_id does not exist', async () => {
      knex._chain.first
        .mockReturnValueOnce(null)  // no duplicate
        .mockReturnValueOnce(null); // parent not found

      await expect(
        service.create(TENANT_ID, {
          account_number: '1015',
          name: 'Child Account',
          account_type: 'asset' as any,
          normal_balance: 'debit' as any,
          parent_id: '00000000-0000-0000-0000-000000000099',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate parent exists when parent_id is provided', async () => {
      const mockParent = { id: '00000000-0000-0000-0000-000000000050', name: 'Parent' };
      const mockAccount = { id: ACCOUNT_ID, account_number: '1015', name: 'Child' };
      knex._chain.first
        .mockReturnValueOnce(null)       // no duplicate
        .mockReturnValueOnce(mockParent); // parent found
      knex._chain.returning.mockReturnValueOnce([mockAccount]);

      const result = await service.create(TENANT_ID, {
        account_number: '1015',
        name: 'Child',
        account_type: 'asset' as any,
        normal_balance: 'debit' as any,
        parent_id: mockParent.id,
      });

      expect(result).toEqual(mockAccount);
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return account', async () => {
      const mockAccount = { id: ACCOUNT_ID, account_number: '1010', name: 'Updated', is_system: false };
      knex._chain.first.mockReturnValueOnce({ ...mockAccount, name: 'Old Name' });
      knex._chain.returning.mockReturnValueOnce([mockAccount]);

      const result = await service.update(TENANT_ID, ACCOUNT_ID, { name: 'Updated' });

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.update(TENANT_ID, ACCOUNT_ID, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating system account', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ACCOUNT_ID, is_system: true });

      await expect(
        service.update(TENANT_ID, ACCOUNT_ID, { name: 'Changed' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when setting self as parent', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ACCOUNT_ID, is_system: false });

      await expect(
        service.update(TENANT_ID, ACCOUNT_ID, { parent_id: ACCOUNT_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when parent does not exist', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: ACCOUNT_ID, is_system: false }) // existing
        .mockReturnValueOnce(null); // parent not found

      await expect(
        service.update(TENANT_ID, ACCOUNT_ID, { parent_id: '00000000-0000-0000-0000-000000000099' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ───────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft delete account', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: ACCOUNT_ID, is_system: false }) // existing
        .mockReturnValueOnce(null); // no children
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, ACCOUNT_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, ACCOUNT_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deleting system account', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ACCOUNT_ID, is_system: true });

      await expect(service.remove(TENANT_ID, ACCOUNT_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when account has children', async () => {
      knex._chain.first
        .mockReturnValueOnce({ id: ACCOUNT_ID, is_system: false }) // existing
        .mockReturnValueOnce({ id: 'child-id' }); // has children

      await expect(service.remove(TENANT_ID, ACCOUNT_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── getTree ──────────────────────────────────────────────────

  describe('getTree', () => {
    it('should return hierarchical tree', async () => {
      const mockAccounts = [
        { id: 'root-1', account_number: '1000', name: 'Assets', parent_id: null, account_type: 'asset', normal_balance: 'debit', is_active: true, is_system: true },
        { id: 'child-1', account_number: '1010', name: 'Cash', parent_id: 'root-1', account_type: 'asset', normal_balance: 'debit', is_active: true, is_system: true },
        { id: 'child-2', account_number: '1100', name: 'AR', parent_id: 'root-1', account_type: 'asset', normal_balance: 'debit', is_active: true, is_system: true },
        { id: 'root-2', account_number: '2000', name: 'Liabilities', parent_id: null, account_type: 'liability', normal_balance: 'credit', is_active: true, is_system: true },
      ];
      // orderBy returns the accounts
      knex._chain.orderBy.mockReturnValueOnce(mockAccounts);

      const result = await service.getTree(TENANT_ID);

      expect(result).toHaveLength(2); // 2 root nodes
      expect(result[0].children).toHaveLength(2); // Assets has 2 children
      expect(result[0].children[0].account_number).toBe('1010');
      expect(result[1].children).toHaveLength(0); // Liabilities has 0 children
    });

    it('should return empty array when no accounts', async () => {
      knex._chain.orderBy.mockReturnValueOnce([]);

      const result = await service.getTree(TENANT_ID);

      expect(result).toEqual([]);
    });
  });
});

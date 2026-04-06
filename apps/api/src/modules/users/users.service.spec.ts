import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'leftJoin', 'onConflict', 'ignore', 'whereILike', 'orWhereILike',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.transaction = jest.fn().mockImplementation(async (cb) => cb(chain));

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn._chain = chain;
  return knexFn;
};

describe('UsersService', () => {
  let service: UsersService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const USER_ID = '00000000-0000-0000-0000-000000000010';
  const ROLE_ID = '00000000-0000-0000-0000-000000000020';

  beforeEach(async () => {
    knex = mockKnex();
    const mockTenantDb = { getConnection: jest.fn().mockResolvedValue(knex) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: TenantDatabaseService, useValue: mockTenantDb },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [{ id: USER_ID, email: 'test@test.com', first_name: 'John', last_name: 'Doe' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockUsers);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockUsers);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { search: 'john', page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'active' as any, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('users.status', 'active');
    });

    it('should filter by role', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { role: 'admin', page: 1, limit: 20 });

      expect(knex._chain.leftJoin).toHaveBeenCalled();
      expect(knex._chain.where).toHaveBeenCalledWith('r_filter.name', 'admin');
    });
  });

  describe('create', () => {
    it('should create user and assign role in transaction', async () => {
      const mockUser = { id: USER_ID, email: 'new@test.com', first_name: 'Jane', last_name: 'Doe' };
      knex._chain.returning.mockReturnValueOnce([mockUser]);

      const result = await service.create(TENANT_ID, {
        email: 'new@test.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role_id: ROLE_ID,
      });

      expect(result).toEqual(mockUser);
      expect(knex._chain.insert).toHaveBeenCalledTimes(2);
    });

    it('should set default status to active', async () => {
      const mockUser = { id: USER_ID, status: 'active' };
      knex._chain.returning.mockReturnValueOnce([mockUser]);

      await service.create(TENANT_ID, {
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role_id: ROLE_ID,
      });

      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user with roles', async () => {
      const mockUser = { id: USER_ID, email: 'test@test.com' };
      const mockRoles = [{ id: ROLE_ID, name: 'admin', description: 'Administrator' }];
      knex._chain.first.mockReturnValueOnce(mockUser);
      knex._chain.select.mockReturnValueOnce(mockRoles);

      const result = await service.findOne(TENANT_ID, USER_ID);

      expect(result).toEqual({ ...mockUser, roles: mockRoles });
    });

    it('should throw NotFoundException when user not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return user', async () => {
      const mockUser = { id: USER_ID, first_name: 'Updated' };
      knex._chain.returning.mockReturnValueOnce([mockUser]);

      const result = await service.update(TENANT_ID, USER_ID, { first_name: 'Updated' });

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, USER_ID, { first_name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      knex._chain.first.mockReturnValueOnce({ id: USER_ID });

      const result = await service.remove(TENANT_ID, USER_ID);

      expect(result).toEqual({ deleted: true });
      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date) }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      knex._chain.first.mockReturnValueOnce({ id: USER_ID });

      const result = await service.assignRole(TENANT_ID, USER_ID, ROLE_ID);

      expect(result).toEqual({ assigned: true });
      expect(knex._chain.onConflict).toHaveBeenCalledWith(['tenant_id', 'user_id', 'role_id']);
    });

    it('should throw NotFoundException when user not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.assignRole(TENANT_ID, USER_ID, ROLE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      const result = await service.removeRole(TENANT_ID, USER_ID, ROLE_ID);

      expect(result).toEqual({ removed: true });
      expect(knex._chain.del).toHaveBeenCalled();
    });
  });
});

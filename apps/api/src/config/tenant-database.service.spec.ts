import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { TenantDatabaseService } from './tenant-database.service';
import { KNEX_CONNECTION } from './database.module';

describe('TenantDatabaseService', () => {
  const TENANT_ID = '019568a0-0000-7000-8000-000000000001';
  const TENANT_SCHEMA = 'tenant_019568a0_0000_7000_8000_000000000001';

  let service: TenantDatabaseService;
  let mockKnex: any;
  let mockRequest: any;

  beforeEach(async () => {
    mockKnex = { raw: jest.fn().mockResolvedValue(undefined) };
    mockRequest = { tenantId: TENANT_ID, tenantSchema: TENANT_SCHEMA };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantDatabaseService,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();

    service = await module.resolve<TenantDatabaseService>(TenantDatabaseService);
  });

  describe('getConnection', () => {
    it('should set search_path and current_tenant_id on first call', async () => {
      const conn = await service.getConnection();

      expect(mockKnex.raw).toHaveBeenCalledTimes(2);
      expect(mockKnex.raw).toHaveBeenCalledWith(
        `SET search_path TO "${TENANT_SCHEMA}", public`,
      );
      expect(mockKnex.raw).toHaveBeenCalledWith(
        `SET app.current_tenant_id TO '${TENANT_ID}'`,
      );
      expect(conn).toBe(mockKnex);
    });

    it('should only set search_path once across multiple calls', async () => {
      await service.getConnection();
      await service.getConnection();
      await service.getConnection();

      expect(mockKnex.raw).toHaveBeenCalledTimes(2);
    });

    it('should return knex without setting search_path when tenantSchema is missing', async () => {
      mockRequest.tenantSchema = undefined;

      const conn = await service.getConnection();

      expect(mockKnex.raw).not.toHaveBeenCalled();
      expect(conn).toBe(mockKnex);
    });

    it('should return knex without setting search_path when tenantId is missing', async () => {
      mockRequest.tenantId = undefined;

      const conn = await service.getConnection();

      expect(mockKnex.raw).not.toHaveBeenCalled();
      expect(conn).toBe(mockKnex);
    });
  });

  describe('getPublicConnection', () => {
    it('should return raw knex without setting search_path', () => {
      const conn = service.getPublicConnection();

      expect(conn).toBe(mockKnex);
      expect(mockKnex.raw).not.toHaveBeenCalled();
    });
  });

  describe('tenantId getter', () => {
    it('should return tenant ID from request', () => {
      expect(service.tenantId).toBe(TENANT_ID);
    });

    it('should return undefined when request has no tenantId', () => {
      mockRequest.tenantId = undefined;
      expect(service.tenantId).toBeUndefined();
    });
  });

  describe('tenantSchema getter', () => {
    it('should return tenant schema from request', () => {
      expect(service.tenantSchema).toBe(TENANT_SCHEMA);
    });

    it('should return undefined when request has no tenantSchema', () => {
      mockRequest.tenantSchema = undefined;
      expect(service.tenantSchema).toBeUndefined();
    });
  });

  describe('tenant isolation', () => {
    it('should use the correct schema for different tenants', async () => {
      const TENANT_A_ID = '019568a0-0000-7000-8000-00000000000a';
      const TENANT_A_SCHEMA = 'tenant_019568a0_0000_7000_8000_00000000000a';
      const TENANT_B_ID = '019568a0-0000-7000-8000-00000000000b';
      const TENANT_B_SCHEMA = 'tenant_019568a0_0000_7000_8000_00000000000b';

      // Service A
      const mockKnexA: any = { raw: jest.fn().mockResolvedValue(undefined) };
      const moduleA = await Test.createTestingModule({
        providers: [
          TenantDatabaseService,
          { provide: KNEX_CONNECTION, useValue: mockKnexA },
          { provide: REQUEST, useValue: { tenantId: TENANT_A_ID, tenantSchema: TENANT_A_SCHEMA } },
        ],
      }).compile();
      const serviceA = await moduleA.resolve<TenantDatabaseService>(TenantDatabaseService);

      // Service B
      const mockKnexB: any = { raw: jest.fn().mockResolvedValue(undefined) };
      const moduleB = await Test.createTestingModule({
        providers: [
          TenantDatabaseService,
          { provide: KNEX_CONNECTION, useValue: mockKnexB },
          { provide: REQUEST, useValue: { tenantId: TENANT_B_ID, tenantSchema: TENANT_B_SCHEMA } },
        ],
      }).compile();
      const serviceB = await moduleB.resolve<TenantDatabaseService>(TenantDatabaseService);

      await serviceA.getConnection();
      await serviceB.getConnection();

      expect(mockKnexA.raw).toHaveBeenCalledWith(
        `SET search_path TO "${TENANT_A_SCHEMA}", public`,
      );
      expect(mockKnexB.raw).toHaveBeenCalledWith(
        `SET search_path TO "${TENANT_B_SCHEMA}", public`,
      );

      expect(mockKnexA.raw).not.toHaveBeenCalledWith(
        expect.stringContaining(TENANT_B_SCHEMA),
      );
      expect(mockKnexB.raw).not.toHaveBeenCalledWith(
        expect.stringContaining(TENANT_A_SCHEMA),
      );
    });
  });
});

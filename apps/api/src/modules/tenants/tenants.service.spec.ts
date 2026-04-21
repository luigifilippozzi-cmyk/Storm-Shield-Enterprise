import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.module';
import { ActivationEventsService } from '../admin/activation/activation.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn._chain = chain;
  knexFn.raw = jest.fn().mockResolvedValue(undefined);
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('TenantsService', () => {
  let service: TenantsService;
  let knex: any;
  let activationEvents: { record: jest.Mock };

  beforeEach(async () => {
    knex = mockKnex();
    activationEvents = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: KNEX_ADMIN_CONNECTION, useValue: knex },
        { provide: ActivationEventsService, useValue: activationEvents },
      ],
    }).compile();
    service = module.get<TenantsService>(TenantsService);
  });

  describe('create', () => {
    it('should create tenant with generated id and schema name', async () => {
      const mockTenant = {
        id: '00000000-0000-0000-0000-000000000099',
        name: 'Acme Body Shop',
        slug: 'acme-body-shop',
        schema_name: 'tenant_00000000_0000_0000_0000_000000000099',
        status: 'active',
        subscription_plan: 'free',
      };
      knex._chain.returning.mockReturnValueOnce([mockTenant]);

      const result = await service.create({
        name: 'Acme Body Shop',
        slug: 'acme-body-shop',
        owner_email: 'owner@acme.com',
      });

      expect(result).toEqual(mockTenant);
    });

    it('should insert correct fields into tenants table', async () => {
      knex._chain.returning.mockReturnValueOnce([{ id: '00000000-0000-0000-0000-000000000099' }]);

      await service.create({
        name: 'Test Shop',
        slug: 'test-shop',
        owner_email: 'test@shop.com',
        settings: { timezone: 'America/Chicago' },
      });

      expect(knex).toHaveBeenCalledWith('tenants');
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '00000000-0000-0000-0000-000000000099',
          name: 'Test Shop',
          slug: 'test-shop',
          schema_name: 'tenant_00000000_0000_0000_0000_000000000099',
          status: 'active',
          subscription_plan: 'free',
          owner_email: 'test@shop.com',
          settings: JSON.stringify({ timezone: 'America/Chicago' }),
        }),
      );
    });

    it('should default settings to empty object when not provided', async () => {
      knex._chain.returning.mockReturnValueOnce([{ id: '00000000-0000-0000-0000-000000000099' }]);

      await service.create({
        name: 'Test',
        slug: 'test',
        owner_email: 'test@test.com',
      });

      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ settings: '{}' }),
      );
    });

    it('should create schema after inserting tenant', async () => {
      knex._chain.returning.mockReturnValueOnce([{ id: '00000000-0000-0000-0000-000000000099' }]);

      await service.create({
        name: 'Test',
        slug: 'test',
        owner_email: 'test@test.com',
      });

      expect(knex.raw).toHaveBeenCalledWith(
        'CREATE SCHEMA IF NOT EXISTS "tenant_00000000_0000_0000_0000_000000000099"',
      );
    });

    it('should generate schema_name by replacing hyphens with underscores', async () => {
      knex._chain.returning.mockReturnValueOnce([{ id: '00000000-0000-0000-0000-000000000099' }]);

      await service.create({
        name: 'Test',
        slug: 'test',
        owner_email: 'test@test.com',
      });

      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          schema_name: 'tenant_00000000_0000_0000_0000_000000000099',
        }),
      );
    });

    it('should emit tenant_created activation event', async () => {
      knex._chain.returning.mockReturnValueOnce([{ id: '00000000-0000-0000-0000-000000000099' }]);

      await service.create({ name: 'Test', slug: 'test', owner_email: 'test@test.com' });

      expect(activationEvents.record).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000099',
        'tenant_created',
      );
    });
  });

  describe('findOne', () => {
    it('should return tenant when found', async () => {
      const mockTenant = { id: '00000000-0000-0000-0000-000000000099', name: 'Acme' };
      knex._chain.first.mockReturnValueOnce(mockTenant);

      const result = await service.findOne('00000000-0000-0000-0000-000000000099');

      expect(result).toEqual(mockTenant);
      expect(knex._chain.where).toHaveBeenCalledWith({
        id: '00000000-0000-0000-0000-000000000099',
        deleted_at: null,
      });
    });

    it('should return undefined when not found', async () => {
      knex._chain.first.mockReturnValueOnce(undefined);

      const result = await service.findOne('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('findBySlug', () => {
    it('should return tenant when found by slug', async () => {
      const mockTenant = { id: '00000000-0000-0000-0000-000000000099', slug: 'acme-body-shop' };
      knex._chain.first.mockReturnValueOnce(mockTenant);

      const result = await service.findBySlug('acme-body-shop');

      expect(result).toEqual(mockTenant);
      expect(knex._chain.where).toHaveBeenCalledWith({
        slug: 'acme-body-shop',
        deleted_at: null,
      });
    });

    it('should return undefined when slug not found', async () => {
      knex._chain.first.mockReturnValueOnce(undefined);

      const result = await service.findBySlug('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getWizardStatus', () => {
    it('should return wizard status and completed_at', async () => {
      knex._chain.first.mockReturnValueOnce({
        wizard_status: 'completed',
        wizard_completed_at: '2026-04-21T12:00:00Z',
      });

      const result = await service.getWizardStatus('tenant-id');

      expect(result).toEqual({
        wizard_status: 'completed',
        wizard_completed_at: '2026-04-21T12:00:00Z',
      });
    });

    it('should default to pending when tenant not found', async () => {
      knex._chain.first.mockReturnValueOnce(undefined);

      const result = await service.getWizardStatus('tenant-id');

      expect(result).toEqual({ wizard_status: 'pending', wizard_completed_at: null });
    });
  });

  describe('startWizard', () => {
    it('should emit wizard_started event', async () => {
      await service.startWizard('tenant-id', 'user-id');

      expect(activationEvents.record).toHaveBeenCalledWith(
        'tenant-id',
        'wizard_started',
        undefined,
        'user-id',
      );
    });
  });

  describe('recordWizardStep', () => {
    it.each([
      [1, 'wizard_step_1_completed'],
      [2, 'wizard_step_2_completed'],
      [3, 'wizard_step_3_completed'],
      [4, 'wizard_step_4_completed'],
      [5, 'wizard_step_5_completed'],
    ])('should emit step %i event', async (step, eventType) => {
      await service.recordWizardStep('tenant-id', step, 'user-id');

      expect(activationEvents.record).toHaveBeenCalledWith(
        'tenant-id',
        eventType,
        undefined,
        'user-id',
      );
    });

    it('should not emit event for invalid step number', async () => {
      await service.recordWizardStep('tenant-id', 99, 'user-id');

      expect(activationEvents.record).not.toHaveBeenCalled();
    });
  });

  describe('completeWizard', () => {
    it('should update wizard_status to completed and emit event when pending', async () => {
      knex._chain.first.mockReturnValueOnce({ wizard_status: 'pending', wizard_completed_at: null });
      knex._chain.update.mockResolvedValueOnce(1);

      const result = await service.completeWizard('tenant-id', 'user-id');

      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ wizard_status: 'completed' }),
      );
      expect(activationEvents.record).toHaveBeenCalledWith(
        'tenant-id',
        'wizard_completed',
        undefined,
        'user-id',
      );
      expect(result.wizard_status).toBe('completed');
      expect(result.wizard_completed_at).toBeTruthy();
    });

    it('should be idempotent — not re-emit event if already completed', async () => {
      knex._chain.first.mockReturnValueOnce({
        wizard_status: 'completed',
        wizard_completed_at: '2026-04-21T12:00:00Z',
      });

      const result = await service.completeWizard('tenant-id', 'user-id');

      expect(activationEvents.record).not.toHaveBeenCalled();
      expect(result.wizard_status).toBe('completed');
    });
  });

  describe('skipWizard', () => {
    it('should update wizard_status to skipped and emit event', async () => {
      knex._chain.update.mockResolvedValueOnce(1);

      const result = await service.skipWizard('tenant-id', 'user-id');

      expect(knex._chain.update).toHaveBeenCalledWith({ wizard_status: 'skipped' });
      expect(activationEvents.record).toHaveBeenCalledWith(
        'tenant-id',
        'wizard_skipped',
        undefined,
        'user-id',
      );
      expect(result).toEqual({ wizard_status: 'skipped', wizard_completed_at: null });
    });
  });
});

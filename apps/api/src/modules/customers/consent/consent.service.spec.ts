import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { TenantDatabaseService } from '../../../config/tenant-database.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'whereNull', 'insert', 'update', 'first',
    'returning', 'orderBy', 'del',
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

describe('ConsentService', () => {
  let service: ConsentService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000010';
  const USER_ID = '00000000-0000-0000-0000-000000000020';
  const CONSENT_ID = '00000000-0000-0000-0000-000000000030';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
      ],
    }).compile();
    service = module.get<ConsentService>(ConsentService);
  });

  describe('create', () => {
    it('should create a consent record', async () => {
      const customer = { id: CUSTOMER_ID, first_name: 'John', last_name: 'Doe' };
      const createdRecord = {
        id: '00000000-0000-0000-0000-000000000099',
        tenant_id: TENANT_ID,
        customer_id: CUSTOMER_ID,
        consent_type: 'marketing_email',
      };

      knex._chain.first.mockResolvedValueOnce(customer);
      knex._chain.returning.mockResolvedValueOnce([createdRecord]);

      const result = await service.create(TENANT_ID, CUSTOMER_ID, USER_ID, {
        consent_type: 'marketing_email',
      } as any);

      expect(result).toEqual(createdRecord);
      expect(knex).toHaveBeenCalledWith('customer_consent_records');
    });

    it('should throw NotFoundException if customer not found', async () => {
      knex._chain.first.mockResolvedValueOnce(undefined);

      await expect(
        service.create(TENANT_ID, CUSTOMER_ID, USER_ID, { consent_type: 'marketing_email' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCustomer', () => {
    it('should return consent records for a customer', async () => {
      const records = [{ id: CONSENT_ID, consent_type: 'marketing_email' }];
      knex._chain.orderBy.mockResolvedValueOnce(records);

      const result = await service.findByCustomer(TENANT_ID, CUSTOMER_ID);
      expect(result).toEqual(records);
    });
  });

  describe('revoke', () => {
    it('should revoke an active consent record', async () => {
      const existing = { id: CONSENT_ID, revoked_at: null };
      const updated = { ...existing, revoked_at: expect.any(Date), revoked_by: USER_ID };

      knex._chain.first.mockResolvedValueOnce(existing);
      knex._chain.returning.mockResolvedValueOnce([updated]);

      const result = await service.revoke(TENANT_ID, CUSTOMER_ID, CONSENT_ID, USER_ID);
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if consent not found', async () => {
      knex._chain.first.mockResolvedValueOnce(undefined);

      await expect(
        service.revoke(TENANT_ID, CUSTOMER_ID, CONSENT_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

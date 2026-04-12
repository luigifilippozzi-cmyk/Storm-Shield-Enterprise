import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { StorageService } from '../../common/services/storage.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'leftJoin', 'whereILike', 'orWhereILike', 'raw', 'groupBy',
    'sum', 'groupByRaw',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  // trx must be callable
  const trxFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(trxFn, chain);
  chain.transaction = jest.fn().mockImplementation(async (cb) => cb(trxFn));

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn.raw = jest.fn().mockReturnValue('raw_expr');
  knexFn._chain = chain;
  knexFn._trx = trxFn;
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('EstimatesService', () => {
  let service: EstimatesService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const ESTIMATE_ID = '00000000-0000-0000-0000-000000000010';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimatesService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
        { provide: StorageService, useValue: { upload: jest.fn(), delete: jest.fn(), generateKey: jest.fn().mockReturnValue('key') } },
      ],
    }).compile();
    service = module.get<EstimatesService>(EstimatesService);
  });

  describe('findAll', () => {
    it('should return paginated estimates', async () => {
      const mockEstimates = [{ id: ESTIMATE_ID, estimate_number: 'EST-001' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockEstimates);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockEstimates);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: 'draft' as any, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('estimates.status', 'draft');
    });
  });

  describe('create', () => {
    it('should create estimate with lines in transaction', async () => {
      const mockEstimate = { id: ESTIMATE_ID, status: 'draft', subtotal: 150 };
      knex._chain.returning.mockReturnValueOnce([mockEstimate]);

      const result = await service.create(TENANT_ID, {
        customer_id: 'cust-1',
        vehicle_id: 'veh-1',
        lines: [
          { line_type: 'labor', description: 'Dent repair', quantity: 1, unit_price: 100, is_taxable: true, sort_order: 1 },
          { line_type: 'parts', description: 'Panel', quantity: 1, unit_price: 50, is_taxable: true, sort_order: 2 },
        ],
      } as any);

      expect(result).toEqual(mockEstimate);
      // First insert for estimate, second for lines
      expect(knex._trx).toHaveBeenCalledWith('estimates');
      expect(knex._trx).toHaveBeenCalledWith('estimate_lines');
    });

    it('should create estimate without lines', async () => {
      const mockEstimate = { id: ESTIMATE_ID, status: 'draft', subtotal: 0 };
      knex._chain.returning.mockReturnValueOnce([mockEstimate]);

      const result = await service.create(TENANT_ID, {
        customer_id: 'cust-1',
        vehicle_id: 'veh-1',
        lines: [],
      } as any);

      expect(result).toEqual(mockEstimate);
    });
  });

  describe('findOne', () => {
    it('should return estimate with lines, supplements, and documents', async () => {
      const mockEstimate = { id: ESTIMATE_ID, status: 'draft' };
      const mockLines = [{ id: 'line-1', description: 'Repair' }];
      const mockSupplements = [{ id: 'supp-1', reason: 'Extra damage' }];
      const mockDocuments = [{ id: 'doc-1', file_name: 'photo.jpg' }];

      knex._chain.first.mockReturnValueOnce(mockEstimate);
      knex._chain.orderBy
        .mockReturnValueOnce(mockLines)
        .mockReturnValueOnce(mockSupplements)
        .mockReturnValueOnce(mockDocuments);

      const result = await service.findOne(TENANT_ID, ESTIMATE_ID);

      expect(result).toEqual({ ...mockEstimate, lines: mockLines, supplements: mockSupplements, documents: mockDocuments });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, ESTIMATE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update draft estimate', async () => {
      const mockEstimate = { id: ESTIMATE_ID, status: 'draft' };
      knex._chain.first.mockReturnValueOnce(mockEstimate);
      knex._chain.returning.mockReturnValueOnce([{ ...mockEstimate, notes: 'updated' }]);

      const result = await service.update(TENANT_ID, ESTIMATE_ID, { notes: 'updated' } as any);

      expect(result.notes).toBe('updated');
    });

    it('should reject update for non-draft estimates', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'sent' });

      await expect(
        service.update(TENANT_ID, ESTIMATE_ID, { notes: 'test' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.update(TENANT_ID, ESTIMATE_ID, { notes: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should allow valid status transition', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'draft' });
      knex._chain.returning.mockReturnValueOnce([{ id: ESTIMATE_ID, status: 'sent' }]);

      const result = await service.updateStatus(TENANT_ID, ESTIMATE_ID, { status: 'sent' } as any);

      expect(result.status).toBe('sent');
    });

    it('should set approved_at when approving', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'sent' });
      knex._chain.returning.mockReturnValueOnce([{ id: ESTIMATE_ID, status: 'approved' }]);

      await service.updateStatus(TENANT_ID, ESTIMATE_ID, { status: 'approved' } as any);

      expect(knex._chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved', approved_at: expect.any(Date) }),
      );
    });

    it('should reject invalid status transition', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'draft' });

      await expect(
        service.updateStatus(TENANT_ID, ESTIMATE_ID, { status: 'approved' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.updateStatus(TENANT_ID, ESTIMATE_ID, { status: 'sent' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete draft estimate', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'draft' });

      const result = await service.remove(TENANT_ID, ESTIMATE_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should reject deletion of non-draft estimate', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'sent' });

      await expect(service.remove(TENANT_ID, ESTIMATE_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.remove(TENANT_ID, ESTIMATE_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

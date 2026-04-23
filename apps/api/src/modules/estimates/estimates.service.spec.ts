import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { StorageService } from '../../common/services/storage.service';
import { ActivationEventsService } from '../admin/activation/activation.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'leftJoin', 'whereILike', 'orWhereILike', 'raw', 'groupBy',
    'sum', 'groupByRaw', 'whereIn',
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
        { provide: ActivationEventsService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
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

    it('should enforce ownership for estimator role (scope=mine implicit)', async () => {
      const USER_ID = '00000000-0000-0000-0000-000000000099';
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { page: 1, limit: 20 }, { id: USER_ID, roles: ['estimator'] });

      expect(knex._chain.where).toHaveBeenCalledWith('estimates.estimated_by', USER_ID);
    });

    it('should throw ForbiddenException when estimator has no resolved user.id', async () => {
      await expect(
        service.findAll(TENANT_ID, { page: 1, limit: 20 }, { roles: ['estimator'] }),
      ).rejects.toThrow('Estimator context requires a resolved user identity');
    });

    it('should apply scope=mine for non-estimator with user.id', async () => {
      const USER_ID = '00000000-0000-0000-0000-000000000088';
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { scope: 'mine', page: 1, limit: 20 }, { id: USER_ID, roles: ['manager'] });

      expect(knex._chain.where).toHaveBeenCalledWith('estimates.estimated_by', USER_ID);
    });

    it('should filter by statuses (multi-select, validates against enum)', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { statuses: 'draft,awaiting_approval,invalid_value', page: 1, limit: 20 });

      // invalid_value should be stripped; only valid enum values passed to whereIn
      expect(knex._chain.whereIn).toHaveBeenCalledWith('estimates.status', ['draft', 'awaiting_approval']);
    });

    it('should filter by insurance_company_id (adjuster)', async () => {
      const INS_ID = '00000000-0000-0000-0000-000000000077';
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { insurance_company_id: INS_ID, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('estimates.insurance_company_id', INS_ID);
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
      knex._chain.returning.mockReturnValueOnce([{ id: ESTIMATE_ID, status: 'submitted_to_adjuster' }]);

      const result = await service.updateStatus(TENANT_ID, ESTIMATE_ID, { status: 'submitted_to_adjuster' } as any);

      expect(result.status).toBe('submitted_to_adjuster');
    });

    it('should set approved_at when approving', async () => {
      knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID, status: 'awaiting_approval' });
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
        service.updateStatus(TENANT_ID, ESTIMATE_ID, { status: 'submitted_to_adjuster' } as any),
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

  describe('findAll — filters', () => {
    const setupPaginated = (data: any[] = []) => {
      knex._chain.count.mockReturnValueOnce([{ count: String(data.length) }]);
      knex._chain.offset.mockReturnValueOnce(data);
    };

    it('should apply search filter', async () => {
      setupPaginated([]);
      await service.findAll(TENANT_ID, { search: 'EST-001', page: 1, limit: 20 });
      expect(knex._chain.where).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should apply customer_id filter', async () => {
      setupPaginated([]);
      await service.findAll(TENANT_ID, { customer_id: 'cust-1', page: 1, limit: 20 });
      expect(knex._chain.where).toHaveBeenCalledWith('estimates.customer_id', 'cust-1');
    });

    it('should apply vehicle_id filter', async () => {
      setupPaginated([]);
      await service.findAll(TENANT_ID, { vehicle_id: 'veh-1', page: 1, limit: 20 });
      expect(knex._chain.where).toHaveBeenCalledWith('estimates.vehicle_id', 'veh-1');
    });

    it('should apply date_from filter', async () => {
      setupPaginated([]);
      const from = '2024-01-01';
      await service.findAll(TENANT_ID, { date_from: from, page: 1, limit: 20 });
      expect(knex._chain.where).toHaveBeenCalledWith('estimates.created_at', '>=', from);
    });

    it('should apply date_to filter', async () => {
      setupPaginated([]);
      const to = '2024-12-31';
      await service.findAll(TENANT_ID, { date_to: to, page: 1, limit: 20 });
      expect(knex._chain.where).toHaveBeenCalledWith('estimates.created_at', '<=', to);
    });
  });

  describe('update — with lines', () => {
    it('should replace lines when provided', async () => {
      const mockEstimate = { id: ESTIMATE_ID, status: 'draft' };
      knex._chain.first.mockReturnValueOnce(mockEstimate);
      knex._chain.returning.mockReturnValueOnce([{ ...mockEstimate, subtotal: 200 }]);

      const result = await service.update(TENANT_ID, ESTIMATE_ID, {
        lines: [
          { line_type: 'labor', description: 'Paint', quantity: 2, unit_price: 100, is_taxable: true, sort_order: 1 },
        ],
      } as any);

      expect(result.subtotal).toBe(200);
      expect(knex._trx).toHaveBeenCalledWith('estimate_lines');
    });
  });

  describe('attachDocument', () => {
    const makeFile = (mimetype = 'application/pdf', size = 1024): Express.Multer.File =>
      ({
        mimetype,
        size,
        originalname: 'doc.pdf',
        buffer: Buffer.from('data'),
      } as any);

    it('should attach a valid document', async () => {
      const mockEstimate = { id: ESTIMATE_ID };
      const mockDoc = { id: 'doc-1', file_name: 'doc.pdf' };
      knex._chain.first.mockReturnValueOnce(mockEstimate);
      knex._chain.returning.mockReturnValueOnce([mockDoc]);

      const result = await service.attachDocument(TENANT_ID, ESTIMATE_ID, 'user-1', makeFile());

      expect(result).toEqual(mockDoc);
    });

    it('should reject invalid file type', async () => {
      await expect(
        service.attachDocument(TENANT_ID, ESTIMATE_ID, 'user-1', makeFile('video/mp4')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file exceeding 25MB', async () => {
      await expect(
        service.attachDocument(TENANT_ID, ESTIMATE_ID, 'user-1', makeFile('application/pdf', 26 * 1024 * 1024)),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when estimate not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);
      await expect(
        service.attachDocument(TENANT_ID, ESTIMATE_ID, 'user-1', makeFile()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should support image/jpeg and image/png types', async () => {
      for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
        knex._chain.first.mockReturnValueOnce({ id: ESTIMATE_ID });
        knex._chain.returning.mockReturnValueOnce([{ id: 'doc-1' }]);
        await expect(
          service.attachDocument(TENANT_ID, ESTIMATE_ID, 'user-1', makeFile(type)),
        ).resolves.toBeDefined();
      }
    });
  });

  describe('deleteDocument', () => {
    it('should delete an existing document', async () => {
      knex._chain.first.mockReturnValueOnce({ id: 'doc-1', storage_key: 'key/doc.pdf' });

      const result = await service.deleteDocument(TENANT_ID, ESTIMATE_ID, 'doc-1');

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when document not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.deleteDocument(TENANT_ID, ESTIMATE_ID, 'doc-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDocuments', () => {
    it('should return documents for an estimate', async () => {
      const mockDocs = [{ id: 'doc-1', file_name: 'photo.pdf' }];
      knex._chain.orderBy.mockReturnValueOnce(mockDocs);

      const result = await service.getDocuments(TENANT_ID, ESTIMATE_ID);

      expect(result).toEqual(mockDocs);
    });
  });

  describe('getSupplements', () => {
    it('should return supplements for an estimate', async () => {
      const mockSupps = [{ id: 'supp-1', reason: 'Additional damage' }];
      knex._chain.orderBy.mockReturnValueOnce(mockSupps);

      const result = await service.getSupplements(TENANT_ID, ESTIMATE_ID);

      expect(result).toEqual(mockSupps);
    });
  });

  describe('createSupplement', () => {
    it('should create a supplement', async () => {
      const mockEstimate = { id: ESTIMATE_ID };
      const mockCount = [{ count: '2' }];
      const mockSupplement = { id: 'supp-1', supplement_number: 3, reason: 'Extra damage' };

      knex._chain.first.mockReturnValueOnce(mockEstimate);
      knex._chain.count.mockReturnValueOnce(mockCount);
      knex._chain.returning.mockReturnValueOnce([mockSupplement]);

      const result = await service.createSupplement(TENANT_ID, ESTIMATE_ID, 'user-1', {
        reason: 'Extra damage',
        amount: 500,
      } as any);

      expect(result).toEqual(mockSupplement);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ supplement_number: 3, status: 'draft' }),
      );
    });

    it('should throw NotFoundException when estimate not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.createSupplement(TENANT_ID, ESTIMATE_ID, 'user-1', { reason: 'test', amount: 100 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

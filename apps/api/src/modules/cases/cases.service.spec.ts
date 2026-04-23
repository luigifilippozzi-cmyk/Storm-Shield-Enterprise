import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CasesService } from './cases.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { CaseStatus } from './dto/update-case.dto';
import { CaseType, CasePriority } from './dto/create-case.dto';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del', 'catch',
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

describe('CasesService', () => {
  let service: CasesService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const CASE_ID = '00000000-0000-0000-0000-000000000020';
  const USER_ID = '00000000-0000-0000-0000-000000000005';

  const mockCase = {
    id: CASE_ID,
    tenant_id: TENANT_ID,
    case_type: CaseType.COMPLAINT,
    title: 'Test Case',
    body: 'Some details',
    status: CaseStatus.OPEN,
    priority: CasePriority.MEDIUM,
    opened_by_user_id: USER_ID,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: TenantDatabaseService,
          useValue: { getConnection: jest.fn().mockResolvedValue(knex) },
        },
      ],
    }).compile();
    service = module.get<CasesService>(CasesService);
  });

  // ── findAll ──

  describe('findAll', () => {
    it('returns paginated cases', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '2' }]);
      knex._chain.offset.mockReturnValueOnce([mockCase]);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual([mockCase]);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('filters by status', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { status: CaseStatus.OPEN });

      expect(knex._chain.where).toHaveBeenCalledWith('status', CaseStatus.OPEN);
    });

    it('filters by priority', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { priority: CasePriority.HIGH });

      expect(knex._chain.where).toHaveBeenCalledWith('priority', CasePriority.HIGH);
    });

    it('filters by customer_id', async () => {
      const customerId = '00000000-0000-0000-0000-000000000010';
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { customer_id: customerId });

      expect(knex._chain.where).toHaveBeenCalledWith('customer_id', customerId);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('returns a case when found', async () => {
      knex._chain.first.mockResolvedValueOnce(mockCase);

      const result = await service.findOne(TENANT_ID, CASE_ID);

      expect(result).toEqual(mockCase);
    });

    it('throws NotFoundException when case does not exist', async () => {
      knex._chain.first.mockResolvedValueOnce(undefined);

      await expect(service.findOne(TENANT_ID, CASE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ──

  describe('create', () => {
    it('creates a case with OPEN status and audit log', async () => {
      knex._chain.returning.mockResolvedValueOnce([mockCase]);
      knex._chain.catch.mockResolvedValueOnce(undefined);

      const dto = {
        case_type: CaseType.COMPLAINT,
        title: 'Test Case',
        body: 'Some details',
      };

      const result = await service.create(TENANT_ID, USER_ID, dto as any);

      expect(result).toEqual(mockCase);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: TENANT_ID,
          opened_by_user_id: USER_ID,
          status: CaseStatus.OPEN,
        }),
      );
    });
  });

  // ── update ──

  describe('update', () => {
    it('updates case fields when found', async () => {
      const updated = { ...mockCase, priority: CasePriority.HIGH };
      knex._chain.first.mockResolvedValueOnce(mockCase);
      knex._chain.returning.mockResolvedValueOnce([updated]);

      const result = await service.update(TENANT_ID, CASE_ID, USER_ID, { priority: CasePriority.HIGH });

      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when case not found', async () => {
      knex._chain.first.mockResolvedValueOnce(undefined);

      await expect(
        service.update(TENANT_ID, CASE_ID, USER_ID, { priority: CasePriority.HIGH }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows valid OPEN → IN_PROGRESS transition', async () => {
      const updated = { ...mockCase, status: CaseStatus.IN_PROGRESS };
      knex._chain.first.mockResolvedValueOnce(mockCase);
      knex._chain.returning.mockResolvedValueOnce([updated]);
      knex._chain.catch.mockResolvedValueOnce(undefined);

      const result = await service.update(TENANT_ID, CASE_ID, USER_ID, { status: CaseStatus.IN_PROGRESS });

      expect(result.status).toBe(CaseStatus.IN_PROGRESS);
    });

    it('throws BadRequestException for invalid OPEN → RESOLVED transition', async () => {
      knex._chain.first.mockResolvedValueOnce(mockCase); // status = OPEN

      await expect(
        service.update(TENANT_ID, CASE_ID, USER_ID, { status: CaseStatus.RESOLVED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid CLOSED → any transition', async () => {
      const closedCase = { ...mockCase, status: CaseStatus.CLOSED };
      knex._chain.first.mockResolvedValueOnce(closedCase);

      await expect(
        service.update(TENANT_ID, CASE_ID, USER_ID, { status: CaseStatus.OPEN }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── resolve ──

  describe('resolve', () => {
    it('resolves an in-progress case', async () => {
      const inProgressCase = { ...mockCase, status: CaseStatus.IN_PROGRESS };
      const resolved = { ...inProgressCase, status: CaseStatus.RESOLVED, resolved_at: new Date() };
      knex._chain.first.mockResolvedValueOnce(inProgressCase);
      knex._chain.returning.mockResolvedValueOnce([resolved]);
      knex._chain.catch.mockResolvedValueOnce(undefined);

      const result = await service.resolve(TENANT_ID, CASE_ID, USER_ID, { resolution_notes: 'Fixed' });

      expect(result.status).toBe(CaseStatus.RESOLVED);
    });

    it('throws BadRequestException when resolving from OPEN (invalid transition)', async () => {
      knex._chain.first.mockResolvedValueOnce(mockCase); // status = OPEN

      await expect(
        service.resolve(TENANT_ID, CASE_ID, USER_ID, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when case not found', async () => {
      knex._chain.first.mockResolvedValueOnce(undefined);

      await expect(service.resolve(TENANT_ID, CASE_ID, USER_ID, {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('deletes an existing case', async () => {
      knex._chain.del.mockResolvedValueOnce(1);

      const result = await service.remove(TENANT_ID, CASE_ID, USER_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException when case does not exist', async () => {
      knex._chain.first.mockResolvedValueOnce(undefined);

      await expect(service.remove(TENANT_ID, CASE_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── transition matrix completeness ──

  describe('transition matrix', () => {
    const transitions: [CaseStatus, CaseStatus, boolean][] = [
      [CaseStatus.OPEN, CaseStatus.IN_PROGRESS, true],
      [CaseStatus.OPEN, CaseStatus.CLOSED, true],
      [CaseStatus.OPEN, CaseStatus.RESOLVED, false],
      [CaseStatus.IN_PROGRESS, CaseStatus.RESOLVED, true],
      [CaseStatus.IN_PROGRESS, CaseStatus.CLOSED, true],
      [CaseStatus.IN_PROGRESS, CaseStatus.OPEN, false],
      [CaseStatus.RESOLVED, CaseStatus.CLOSED, true],
      [CaseStatus.RESOLVED, CaseStatus.OPEN, false],
      [CaseStatus.RESOLVED, CaseStatus.IN_PROGRESS, false],
      [CaseStatus.CLOSED, CaseStatus.OPEN, false],
      [CaseStatus.CLOSED, CaseStatus.IN_PROGRESS, false],
      [CaseStatus.CLOSED, CaseStatus.RESOLVED, false],
    ];

    transitions.forEach(([from, to, valid]) => {
      it(`${from} → ${to} should be ${valid ? 'allowed' : 'rejected'}`, async () => {
        const caseInState = { ...mockCase, status: from };
        knex._chain.first.mockResolvedValueOnce(caseInState);
        if (valid) {
          knex._chain.returning.mockResolvedValueOnce([{ ...caseInState, status: to }]);
          knex._chain.catch.mockResolvedValueOnce(undefined);
        }

        if (valid) {
          await expect(service.update(TENANT_ID, CASE_ID, USER_ID, { status: to })).resolves.toBeDefined();
        } else {
          await expect(service.update(TENANT_ID, CASE_ID, USER_ID, { status: to })).rejects.toThrow(BadRequestException);
        }
      });
    });
  });
});

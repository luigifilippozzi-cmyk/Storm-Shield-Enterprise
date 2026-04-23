import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  EstimateStateMachineService,
  ALLOWED_TRANSITIONS,
} from './estimate-state-machine.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

const ALL_STATUSES = [
  'draft',
  'submitted_to_adjuster',
  'awaiting_approval',
  'approved',
  'supplement_pending',
  'approved_with_supplement',
  'rejected',
  'disputed',
  'paid',
  'closed',
];

const makeTrx = (estimateRow: any) => {
  const trxChain: any = {};
  const trxMethods = ['where', 'update', 'insert', 'returning', 'orderBy'];
  trxMethods.forEach((m) => {
    trxChain[m] = jest.fn().mockReturnValue(trxChain);
  });
  trxChain.returning.mockResolvedValueOnce([estimateRow]).mockResolvedValueOnce([
    { id: 'change-id', from_status: estimateRow.status, to_status: 'submitted_to_adjuster' },
  ]);
  return trxChain;
};

const makeKnex = (estimateRow: any) => {
  // Read chain (for .where().first() lookup before transaction)
  const chain: any = {};
  const chainMethods = ['where', 'first', 'orderBy', 'update', 'insert', 'returning'];
  chainMethods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.first.mockResolvedValue(estimateRow);

  // Transaction chain — must be callable as trx('table') returning itself
  const trxChain: any = {};
  const trxMethods = ['where', 'update', 'insert', 'returning'];
  trxMethods.forEach((m) => {
    trxChain[m] = jest.fn().mockReturnValue(trxChain);
  });
  const trxFn: any = jest.fn().mockReturnValue(trxChain);
  Object.assign(trxFn, trxChain);

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn.transaction = jest.fn().mockImplementation(async (cb) => cb(trxFn));

  return { knexFn, trxChain, trxFn };
};

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const ESTIMATE_ID = '00000000-0000-0000-0000-000000000010';
const USER_ID = '00000000-0000-0000-0000-000000000020';

describe('EstimateStateMachineService', () => {
  let service: EstimateStateMachineService;

  const buildModule = async (knex: any) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimateStateMachineService,
        {
          provide: TenantDatabaseService,
          useValue: { getConnection: jest.fn().mockResolvedValue(knex) },
        },
      ],
    }).compile();
    return module.get<EstimateStateMachineService>(EstimateStateMachineService);
  };

  // ── ALLOWED_TRANSITIONS map ────────────────────────────────────────────────

  describe('ALLOWED_TRANSITIONS constant', () => {
    it('covers all 10 canonical statuses as keys', () => {
      ALL_STATUSES.forEach((s) => {
        expect(ALLOWED_TRANSITIONS.has(s)).toBe(true);
      });
    });

    it('has no extra keys beyond the 10 canonical statuses', () => {
      expect(ALLOWED_TRANSITIONS.size).toBe(10);
    });

    it('closed is a terminal state (no outgoing transitions)', () => {
      expect(ALLOWED_TRANSITIONS.get('closed')!.size).toBe(0);
    });

    it('draft only transitions to submitted_to_adjuster', () => {
      expect([...ALLOWED_TRANSITIONS.get('draft')!]).toEqual(['submitted_to_adjuster']);
    });

    it('rejected only transitions back to draft', () => {
      expect([...ALLOWED_TRANSITIONS.get('rejected')!]).toEqual(['draft']);
    });

    it('paid only transitions to closed', () => {
      expect([...ALLOWED_TRANSITIONS.get('paid')!]).toEqual(['closed']);
    });

    it('disputed can resolve to awaiting_approval, paid, or closed', () => {
      const targets = ALLOWED_TRANSITIONS.get('disputed')!;
      expect(targets.has('awaiting_approval')).toBe(true);
      expect(targets.has('paid')).toBe(true);
      expect(targets.has('closed')).toBe(true);
      expect(targets.size).toBe(3);
    });

    it('awaiting_approval can transition to approved, supplement_pending, rejected, or disputed', () => {
      const targets = ALLOWED_TRANSITIONS.get('awaiting_approval')!;
      ['approved', 'supplement_pending', 'rejected', 'disputed'].forEach((t) => {
        expect(targets.has(t)).toBe(true);
      });
    });

    it('supplement_pending can only go back to awaiting_approval', () => {
      expect([...ALLOWED_TRANSITIONS.get('supplement_pending')!]).toEqual(['awaiting_approval']);
    });
  });

  // ── transition() — not found ───────────────────────────────────────────────

  describe('transition() — estimate not found', () => {
    it('throws NotFoundException when estimate does not exist', async () => {
      const { knexFn } = makeKnex(null);
      (knexFn().first as jest.Mock).mockResolvedValue(null);
      service = await buildModule(knexFn);

      await expect(
        service.transition(TENANT_ID, ESTIMATE_ID, 'submitted_to_adjuster', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── transition() — valid transitions ──────────────────────────────────────

  describe('transition() — valid transitions', () => {
    const VALID_PAIRS: [string, string][] = [];
    for (const [from, targets] of ALLOWED_TRANSITIONS) {
      for (const to of targets) {
        VALID_PAIRS.push([from, to]);
      }
    }

    it.each(VALID_PAIRS)('%s → %s: succeeds and persists change log', async (from, to) => {
      const estimateRow = { id: ESTIMATE_ID, tenant_id: TENANT_ID, status: from };
      const { knexFn, trxChain } = makeKnex(estimateRow);

      const updatedEstimate = { ...estimateRow, status: to };
      const changeRow = {
        id: '00000000-0000-0000-0000-000000000099',
        tenant_id: TENANT_ID,
        estimate_id: ESTIMATE_ID,
        from_status: from,
        to_status: to,
        changed_by_user_id: USER_ID,
      };

      // returning is called twice: once for UPDATE estimates, once for INSERT change log
      trxChain.returning
        .mockResolvedValueOnce([updatedEstimate])
        .mockResolvedValueOnce([changeRow]);

      service = await buildModule(knexFn);
      const result = await service.transition(TENANT_ID, ESTIMATE_ID, to, USER_ID);

      expect(result.estimate.status).toBe(to);
      expect(result.statusChange.from_status).toBe(from);
      expect(result.statusChange.to_status).toBe(to);
      expect(knexFn.transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── transition() — invalid transitions ────────────────────────────────────

  describe('transition() — invalid transitions', () => {
    const INVALID_PAIRS: [string, string][] = [];
    for (const from of ALL_STATUSES) {
      const allowed = ALLOWED_TRANSITIONS.get(from)!;
      for (const to of ALL_STATUSES) {
        if (!allowed.has(to)) {
          INVALID_PAIRS.push([from, to]);
        }
      }
    }

    it.each(INVALID_PAIRS)('%s → %s: throws BadRequestException', async (from, to) => {
      const estimateRow = { id: ESTIMATE_ID, tenant_id: TENANT_ID, status: from };
      const { knexFn } = makeKnex(estimateRow);

      service = await buildModule(knexFn);

      await expect(
        service.transition(TENANT_ID, ESTIMATE_ID, to, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── transition() — with notes ──────────────────────────────────────────────

  describe('transition() — with notes', () => {
    it('persists optional notes to the change log', async () => {
      const estimateRow = { id: ESTIMATE_ID, tenant_id: TENANT_ID, status: 'draft' };
      const { knexFn, trxChain } = makeKnex(estimateRow);

      const updatedEstimate = { ...estimateRow, status: 'submitted_to_adjuster' };
      const changeRow = { id: 'change-id', from_status: 'draft', to_status: 'submitted_to_adjuster', notes: 'Sent to adjuster on 2026-04-22' };
      trxChain.returning
        .mockResolvedValueOnce([updatedEstimate])
        .mockResolvedValueOnce([changeRow]);

      service = await buildModule(knexFn);
      const result = await service.transition(
        TENANT_ID,
        ESTIMATE_ID,
        'submitted_to_adjuster',
        USER_ID,
        'Sent to adjuster on 2026-04-22',
      );

      expect(result.statusChange.notes).toBe('Sent to adjuster on 2026-04-22');
    });

    it('stores null notes when not provided', async () => {
      const estimateRow = { id: ESTIMATE_ID, tenant_id: TENANT_ID, status: 'draft' };
      const { knexFn, trxChain } = makeKnex(estimateRow);

      trxChain.returning
        .mockResolvedValueOnce([{ ...estimateRow, status: 'submitted_to_adjuster' }])
        .mockResolvedValueOnce([{ id: 'change-id', from_status: 'draft', to_status: 'submitted_to_adjuster', notes: null }]);

      service = await buildModule(knexFn);
      const result = await service.transition(TENANT_ID, ESTIMATE_ID, 'submitted_to_adjuster', USER_ID);

      expect(result.statusChange.notes).toBeNull();
    });
  });

  // ── getHistory() ───────────────────────────────────────────────────────────

  describe('getHistory()', () => {
    it('returns ordered history for a known estimate', async () => {
      const estimateRow = { id: ESTIMATE_ID, tenant_id: TENANT_ID, status: 'approved' };
      const historyRows = [
        { from_status: 'draft', to_status: 'submitted_to_adjuster', changed_at: new Date('2026-04-01') },
        { from_status: 'submitted_to_adjuster', to_status: 'awaiting_approval', changed_at: new Date('2026-04-02') },
        { from_status: 'awaiting_approval', to_status: 'approved', changed_at: new Date('2026-04-03') },
      ];

      const chain: any = {};
      ['where', 'first', 'orderBy'].forEach((m) => {
        chain[m] = jest.fn().mockReturnValue(chain);
      });
      chain.first.mockResolvedValue(estimateRow);
      chain.orderBy.mockResolvedValue(historyRows);

      const knexFn: any = jest.fn().mockReturnValue(chain);
      Object.assign(knexFn, chain);
      knexFn.transaction = jest.fn();

      service = await buildModule(knexFn);
      const history = await service.getHistory(TENANT_ID, ESTIMATE_ID);

      expect(history).toHaveLength(3);
      expect(history[0].from_status).toBe('draft');
    });

    it('throws NotFoundException when estimate does not exist', async () => {
      const chain: any = {};
      ['where', 'first', 'orderBy'].forEach((m) => {
        chain[m] = jest.fn().mockReturnValue(chain);
      });
      chain.first.mockResolvedValue(null);

      const knexFn: any = jest.fn().mockReturnValue(chain);
      Object.assign(knexFn, chain);
      knexFn.transaction = jest.fn();

      service = await buildModule(knexFn);
      await expect(service.getHistory(TENANT_ID, ESTIMATE_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
